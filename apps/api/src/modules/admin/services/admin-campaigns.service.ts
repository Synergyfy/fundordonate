import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  Prisma,
  BusinessCampaignStatus,
} from "@prisma/client";
import {
  AdminCampaignQueryDto,
  BulkCampaignActionDto,
  CreateCampaignTemplateDto,
  RequestCampaignChangesDto,
  UpdateCampaignStatusDto,
  UpdateCampaignTemplateDto,
} from "../dto/campaign-admin.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ADMIN_TASKS_QUEUE } from "../processors/admin-tasks.processor";

@Injectable()
export class AdminCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ADMIN_TASKS_QUEUE) private readonly adminQueue: Queue,
  ) {}

  /**
   * Retrieves a paginated list of campaigns with eager relations to prevent N+1 queries.
   */
  async getCampaigns(query: AdminCampaignQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      audience,
      seasonId,
      locationId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.BusinessCampaignWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (seasonId) {
      where.template = { seasonId };
    }

    if (locationId) {
      where.business = { locationId };
    }

    if (audience && audience !== "all") {
      where.business = {
        ...where.business,
        preferredAudience: audience.toUpperCase() as any,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { business: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.BusinessCampaignOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [total, items] = await Promise.all([
      this.prisma.businessCampaign.count({ where }),
      this.prisma.businessCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              localArea: true,
              highStreet: true,
              logoUrl: true,
              membershipTier: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
              seasonId: true,
            },
          },
          _count: {
            select: {
              contributions: true,
              requestedChanges: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        percentage: c.targetAmount > 0 ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100)) : 0,
        contributionCount: c._count.contributions,
        openChangesCount: c._count.requestedChanges,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single campaign details with answers, requested changes, and audit entries.
   */
  async getCampaign(id: string) {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
          },
        },
        template: true,
        answers: true,
        requestedChanges: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { contributions: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return {
      ...campaign,
      percentage:
        campaign.targetAmount > 0
          ? Math.min(100, Math.round((campaign.raisedAmount / campaign.targetAmount) * 100))
          : 0,
      contributionCount: campaign._count.contributions,
    };
  }

  /**
   * Updates campaign status and logs an audit trail event.
   */
  async updateCampaignStatus(id: string, dto: UpdateCampaignStatusDto, adminUserId?: string) {
    const campaign = await this.prisma.businessCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const updated = await this.prisma.businessCampaign.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `CAMPAIGN_STATUS_${dto.status}`,
        entityType: "campaign",
        entityId: id,
        details: { previousStatus: campaign.status, newStatus: dto.status, note: dto.note },
      },
    });

    return updated;
  }

  /**
   * Requests modifications on specific campaign fields.
   */
  async requestChanges(id: string, dto: RequestCampaignChangesDto, adminUserId?: string) {
    const campaign = await this.prisma.businessCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const [change, updatedCampaign] = await this.prisma.$transaction([
      this.prisma.campaignRequestedChange.create({
        data: {
          campaignId: id,
          fieldId: dto.fieldId,
          label: dto.label,
          note: dto.note,
        },
      }),
      this.prisma.businessCampaign.update({
        where: { id },
        data: { status: BusinessCampaignStatus.CHANGES_REQUESTED },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: "CAMPAIGN_CHANGES_REQUESTED",
          entityType: "campaign",
          entityId: id,
          details: { fieldId: dto.fieldId, note: dto.note },
        },
      }),
    ]);

    return {
      requestedChange: change,
      campaignStatus: updatedCampaign.status,
    };
  }

  /**
   * Executes bulk campaign status transitions (uses BullMQ if batch size > 10).
   */
  async bulkAction(dto: BulkCampaignActionDto, adminUserId?: string) {
    if (dto.campaignIds.length > 10) {
      const job = await this.adminQueue.add("bulk-campaign-status", {
        action: dto.action,
        campaignIds: dto.campaignIds,
        adminUserId,
      });

      return {
        queued: true,
        jobId: job.id,
        count: dto.campaignIds.length,
        message: `Bulk ${dto.action} for ${dto.campaignIds.length} campaigns dispatched to background worker`,
      };
    }

    let targetStatus: BusinessCampaignStatus;
    if (dto.action === "approve") {
      targetStatus = BusinessCampaignStatus.ACTIVE;
    } else if (dto.action === "reject") {
      targetStatus = BusinessCampaignStatus.CHANGES_REQUESTED;
    } else {
      targetStatus = BusinessCampaignStatus.CANCELLED;
    }

    const res = await this.prisma.businessCampaign.updateMany({
      where: { id: { in: dto.campaignIds } },
      data: { status: targetStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `BULK_CAMPAIGN_${dto.action.toUpperCase()}`,
        entityType: "campaign",
        details: { count: res.count, campaignIds: dto.campaignIds },
      },
    });

    return {
      queued: false,
      count: res.count,
      status: targetStatus,
    };
  }

  /**
   * Lists campaign templates.
   */
  async getTemplates() {
    const templates = await this.prisma.campaignTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        season: {
          select: {
            id: true,
            name: true,
            referenceCode: true,
            status: true,
          },
        },
        _count: {
          select: { instances: true },
        },
      },
    });

    return templates.map((t) => ({
      ...t,
      instantiatedCount: t._count.instances,
    }));
  }

  /**
   * Retrieves single campaign template detail.
   */
  async getTemplate(id: string) {
    const template = await this.prisma.campaignTemplate.findUnique({
      where: { id },
      include: {
        season: true,
        _count: { select: { instances: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }

    return {
      ...template,
      instantiatedCount: template._count.instances,
    };
  }

  /**
   * Creates a new campaign template blueprint.
   */
  async createTemplate(dto: CreateCampaignTemplateDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await this.prisma.campaignTemplate.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Template slug '${slug}' already exists`);
    }

    return this.prisma.campaignTemplate.create({
      data: {
        name: dto.name,
        slug,
        tagline: dto.tagline,
        seasonId: dto.seasonId,
        origin: dto.origin,
        approvalMode: dto.approvalMode,
        minEligibilityTier: dto.minEligibilityTier,
        minContributionRequired: dto.minContributionRequired ?? false,
        minContributionAmount: dto.minContributionAmount ?? 0,
        selfFundingEnabled: dto.selfFundingEnabled ?? true,
        selfFundingMode: dto.selfFundingMode ?? "optional",
        selfFundingAmount: dto.selfFundingAmount ?? 10000,
        selfFundingRewardName: dto.selfFundingRewardName,
        fieldsConfig: dto.fieldsConfig ?? [],
        rewardsConfig: dto.rewardsConfig ?? [],
        mcomAssetsConfig: dto.mcomAssetsConfig ?? [],
        requirementsConfig: dto.requirementsConfig ?? [],
      },
    });
  }

  /**
   * Updates an existing campaign template.
   */
  async updateTemplate(id: string, dto: UpdateCampaignTemplateDto) {
    const existing = await this.prisma.campaignTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const conflict = await this.prisma.campaignTemplate.findUnique({ where: { slug: dto.slug } });
      if (conflict) {
        throw new ConflictException(`Template slug '${dto.slug}' already exists`);
      }
    }

    const data: Prisma.CampaignTemplateUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.tagline !== undefined) data.tagline = dto.tagline;
    if (dto.seasonId !== undefined) {
      data.season = dto.seasonId ? { connect: { id: dto.seasonId } } : { disconnect: true };
    }
    if (dto.origin !== undefined) data.origin = dto.origin;
    if (dto.approvalMode !== undefined) data.approvalMode = dto.approvalMode;
    if (dto.minEligibilityTier !== undefined) data.minEligibilityTier = dto.minEligibilityTier;
    if (dto.minContributionRequired !== undefined) data.minContributionRequired = dto.minContributionRequired;
    if (dto.minContributionAmount !== undefined) data.minContributionAmount = dto.minContributionAmount;
    if (dto.selfFundingEnabled !== undefined) data.selfFundingEnabled = dto.selfFundingEnabled;
    if (dto.selfFundingMode !== undefined) data.selfFundingMode = dto.selfFundingMode;
    if (dto.selfFundingAmount !== undefined) data.selfFundingAmount = dto.selfFundingAmount;
    if (dto.selfFundingRewardName !== undefined) data.selfFundingRewardName = dto.selfFundingRewardName;
    if (dto.fieldsConfig !== undefined) data.fieldsConfig = dto.fieldsConfig;
    if (dto.rewardsConfig !== undefined) data.rewardsConfig = dto.rewardsConfig;
    if (dto.mcomAssetsConfig !== undefined) data.mcomAssetsConfig = dto.mcomAssetsConfig;
    if (dto.requirementsConfig !== undefined) data.requirementsConfig = dto.requirementsConfig;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.campaignTemplate.update({
      where: { id },
      data,
    });
  }

  /**
   * Target calculation formula engine for campaign target planning.
   */
  async calculateTargets(params: {
    tier?: string;
    businessCount?: number;
    baseTargetPerBusiness?: number;
    highStreetCount?: number;
  }) {
    const businessCount = params.businessCount || 10;
    const baseTarget = params.baseTargetPerBusiness || 100000; // £1,000.00
    const highStreetCount = params.highStreetCount || 1;

    const highStreetTarget = businessCount * baseTarget;
    const localAreaTarget = highStreetTarget * 2;
    const cityTarget = localAreaTarget * 5;
    const nationalTarget = cityTarget * 10;

    return {
      formula: "baseTargetPerBusiness * businessCount * tierMultiplier",
      businessCount,
      baseTargetPerBusiness: baseTarget,
      projectedTargets: {
        highStreet: highStreetTarget,
        localArea: localAreaTarget,
        city: cityTarget,
        national: nationalTarget,
      },
    };
  }
}
