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
  TemplateStatus,
} from "@prisma/client";
import {
  AdminCampaignQueryDto,
  BulkCampaignActionDto,
  CreateCampaignTemplateDto,
  DuplicateCampaignTemplateDto,
  InstantiateCampaignTemplateDto,
  RequestCampaignChangesDto,
  UpdateCampaignStatusDto,
  UpdateCampaignTemplateDto,
  UpdateCampaignTemplateStatusDto,
} from "../dto/campaign-admin.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ADMIN_TASKS_QUEUE } from "../processors/admin-tasks.constants";

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
   * Resolves an incoming season reference to a real Season id.
   *
   * Empty, whitespace, "none" and nullish values mean "no season" and resolve
   * to null. Any other value must match an existing season (by id or reference
   * code); otherwise a 400 is thrown instead of letting the database raise an
   * opaque foreign-key constraint error.
   */
  private async resolveSeasonId(seasonId?: string | null): Promise<string | null> {
    const normalised = typeof seasonId === "string" ? seasonId.trim() : seasonId;
    if (!normalised || normalised.toLowerCase() === "none") {
      return null;
    }

    const season = await this.prisma.season.findFirst({
      where: {
        OR: [{ id: normalised }, { referenceCode: normalised }],
      },
      select: { id: true },
    });

    if (!season) {
      throw new BadRequestException(`Season '${seasonId}' does not exist`);
    }

    return season.id;
  }

  /**
   * Creates a new campaign template blueprint and persists the full wizard config.
   */
  async createTemplate(dto: CreateCampaignTemplateDto, adminUserId?: string) {
    const slug = this.slugify(dto.slug || dto.name);

    const existing = await this.prisma.campaignTemplate.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Template slug '${slug}' already exists`);
    }

    const seasonId = await this.resolveSeasonId(dto.seasonId);
    const status = dto.status ?? TemplateStatus.DRAFT;

    try {
      const created = await this.prisma.campaignTemplate.create({
        data: {
          name: dto.name,
          slug,
          tagline: dto.tagline,
          seasonId,
          origin: dto.origin ?? "DIRECT",
          approvalMode: dto.approvalMode ?? "ADMIN_REVIEW",
          status,
          category: dto.category,
          audience: (dto.audience ?? "BOTH").toUpperCase(),
          minEligibilityTier: dto.minEligibilityTier ?? "BRONZE",
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
          config: dto.config ?? {},
          isActive: status === TemplateStatus.ACTIVE,
          createdById: adminUserId,
          updatedById: adminUserId,
        },
      });

      await this.logTemplateAudit("CAMPAIGN_TEMPLATE_CREATED", created.id, adminUserId, {
        slug,
        status,
      });

      return created;
    } catch (err) {
      this.rethrowUniqueSlug(err, slug);
    }
  }

  /**
   * Updates an existing campaign template.
   */
  async updateTemplate(id: string, dto: UpdateCampaignTemplateDto, adminUserId?: string) {
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

    const data: Prisma.CampaignTemplateUpdateInput = {
      version: { increment: 1 },
    };
    if (adminUserId !== undefined) data.updatedById = adminUserId;

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.tagline !== undefined) data.tagline = dto.tagline;
    if (dto.seasonId !== undefined) {
      const seasonId = await this.resolveSeasonId(dto.seasonId);
      data.season = seasonId ? { connect: { id: seasonId } } : { disconnect: true };
    }
    if (dto.origin !== undefined) data.origin = dto.origin;
    if (dto.approvalMode !== undefined) data.approvalMode = dto.approvalMode;
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.isActive = dto.status === TemplateStatus.ACTIVE;
    }
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.audience !== undefined) data.audience = dto.audience.toUpperCase();
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
    if (dto.config !== undefined) data.config = dto.config;
    if (dto.isActive !== undefined && dto.status === undefined) data.isActive = dto.isActive;

    try {
      const updated = await this.prisma.campaignTemplate.update({
        where: { id },
        data,
      });

      await this.logTemplateAudit("CAMPAIGN_TEMPLATE_UPDATED", id, adminUserId, {
        fields: Object.keys(dto),
      });

      return updated;
    } catch (err) {
      if (dto.slug) this.rethrowUniqueSlug(err, dto.slug);
      throw err;
    }
  }

  /**
   * Updates only the lifecycle status of a template (draft/active/inactive/archived).
   */
  async updateTemplateStatus(
    id: string,
    dto: UpdateCampaignTemplateStatusDto,
    adminUserId?: string,
  ) {
    const existing = await this.prisma.campaignTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }

    const updated = await this.prisma.campaignTemplate.update({
      where: { id },
      data: {
        status: dto.status,
        isActive: dto.status === TemplateStatus.ACTIVE,
        updatedById: adminUserId,
      },
    });

    await this.logTemplateAudit(`CAMPAIGN_TEMPLATE_STATUS_${dto.status}`, id, adminUserId, {
      previousStatus: existing.status,
      status: dto.status,
    });

    return updated;
  }

  /**
   * Clones an existing template into a new draft.
   */
  async duplicateTemplate(
    id: string,
    dto: DuplicateCampaignTemplateDto,
    adminUserId?: string,
  ) {
    const source = await this.prisma.campaignTemplate.findUnique({ where: { id } });
    if (!source) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }

    const name = dto.name ?? `${source.name} (Copy)`;
    const slug = await this.uniqueSlug(name);

    const created = await this.prisma.campaignTemplate.create({
      data: {
        name,
        slug,
        tagline: source.tagline,
        seasonId: source.seasonId,
        origin: source.origin,
        approvalMode: source.approvalMode,
        status: TemplateStatus.DRAFT,
        category: source.category,
        audience: source.audience,
        minEligibilityTier: source.minEligibilityTier,
        minContributionRequired: source.minContributionRequired,
        minContributionAmount: source.minContributionAmount,
        selfFundingEnabled: source.selfFundingEnabled,
        selfFundingMode: source.selfFundingMode,
        selfFundingAmount: source.selfFundingAmount,
        selfFundingRewardName: source.selfFundingRewardName,
        fieldsConfig: source.fieldsConfig as Prisma.InputJsonValue,
        rewardsConfig: source.rewardsConfig as Prisma.InputJsonValue,
        mcomAssetsConfig: source.mcomAssetsConfig as Prisma.InputJsonValue,
        requirementsConfig: source.requirementsConfig as Prisma.InputJsonValue,
        config: source.config as Prisma.InputJsonValue,
        isActive: false,
        createdById: adminUserId,
        updatedById: adminUserId,
      },
    });

    await this.logTemplateAudit("CAMPAIGN_TEMPLATE_DUPLICATED", created.id, adminUserId, {
      sourceId: id,
    });

    return created;
  }

  /**
   * Lists campaign instances (business campaigns) spawned from a template.
   */
  async getTemplateInstances(id: string) {
    const template = await this.prisma.campaignTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!template) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }

    const instances = await this.prisma.businessCampaign.findMany({
      where: { templateId: id },
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: { id: true, name: true, slug: true, city: true, membershipTier: true },
        },
        _count: { select: { contributions: true } },
      },
    });

    return instances.map((c) => ({
      ...c,
      percentage:
        c.targetAmount > 0
          ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
          : 0,
      contributionCount: c._count.contributions,
    }));
  }

  /**
   * Instantiates a template for one or more businesses. Small batches run inline;
   * larger batches are dispatched to the background worker.
   */
  async instantiateTemplate(
    id: string,
    dto: InstantiateCampaignTemplateDto,
    adminUserId?: string,
  ) {
    const template = await this.prisma.campaignTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }
    if (!template.isActive) {
      throw new BadRequestException("Template must be active before it can be instantiated");
    }

    const businessIds = await this.resolveTargetBusinessIds(dto);
    if (businessIds.length === 0) {
      throw new BadRequestException("No target businesses were resolved for instantiation");
    }

    const payload = {
      templateId: id,
      businessIds,
      targetAmount: dto.targetAmount,
      deadlineDays: dto.deadlineDays,
      adminUserId,
    };

    if (businessIds.length > 10) {
      const job = await this.adminQueue.add("template-instantiate", payload);
      return {
        queued: true,
        jobId: job.id,
        count: businessIds.length,
        message: `Instantiation for ${businessIds.length} business(es) dispatched to background worker`,
      };
    }

    const result = await this.instantiateTemplateForBusinesses(payload);
    return {
      queued: false,
      count: result.created,
      skipped: result.skipped,
      campaignIds: result.campaignIds,
    };
  }

  /**
   * Core instantiation routine — used inline and by the background worker.
   * Idempotent: skips businesses that already have a non-cancelled campaign.
   */
  async instantiateTemplateForBusinesses(params: {
    templateId: string;
    businessIds: string[];
    targetAmount?: number;
    deadlineDays?: number;
    adminUserId?: string;
  }): Promise<{ created: number; skipped: number; campaignIds: string[] }> {
    const template = await this.prisma.campaignTemplate.findUnique({
      where: { id: params.templateId },
    });
    if (!template) {
      throw new NotFoundException(`Campaign template with ID ${params.templateId} not found`);
    }

    const targetAmount = params.targetAmount ?? 5000000;
    const endDate = params.deadlineDays
      ? new Date(Date.now() + params.deadlineDays * 24 * 60 * 60 * 1000)
      : null;
    const fieldsConfig = (template.fieldsConfig as any[]) ?? [];

    const campaignIds: string[] = [];

    // 1. Bulk find existing campaigns for these business IDs
    const existingCampaigns = await this.prisma.businessCampaign.findMany({
      where: {
        businessId: { in: params.businessIds },
        templateId: template.id,
        status: { not: BusinessCampaignStatus.CANCELLED },
      },
      select: { businessId: true },
    });
    const existingBizSet = new Set(existingCampaigns.map((c) => c.businessId));
    const eligibleBizIds = params.businessIds.filter((id) => !existingBizSet.has(id));
    let skipped = params.businessIds.length - eligibleBizIds.length;

    // 2. Bulk find business profiles
    const businesses = await this.prisma.business.findMany({
      where: { id: { in: eligibleBizIds } },
      select: {
        id: true,
        name: true,
        city: true,
        highStreet: true,
        category: true,
        preAuditAnswers: true,
      },
    });
    const foundBizMap = new Map(businesses.map((b) => [b.id, b]));

    const BATCH_SIZE = 10;
    for (let i = 0; i < eligibleBizIds.length; i += BATCH_SIZE) {
      const chunk = eligibleBizIds.slice(i, i + BATCH_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (businessId) => {
          const business = foundBizMap.get(businessId);
          if (!business) {
            return null;
          }

          const auditAnswers = (business.preAuditAnswers as Record<string, string>) ?? {};

          return this.prisma.$transaction(async (tx) => {
            const campaign = await tx.businessCampaign.create({
              data: {
                businessId,
                templateId: template.id,
                title: template.name,
                description: template.tagline,
                status: BusinessCampaignStatus.DRAFT,
                targetAmount,
                businessContribution: 0,
                startDate: new Date(),
                endDate,
              },
            });

            const fieldAnswersData: Array<{
              campaignId: string;
              fieldId: string;
              value: string;
              source: string;
            }> = [];

            for (const field of fieldsConfig) {
              let defaultValue: string = field.value ?? "";

              if (field.source === "audit" && auditAnswers[field.id]) {
                defaultValue = auditAnswers[field.id];
              } else if (field.source === "business_account") {
                if (field.id === "business_name") defaultValue = business.name;
                if (field.id === "city") defaultValue = business.city ?? "";
                if (field.id === "high_street") defaultValue = business.highStreet ?? "";
                if (field.id === "category") defaultValue = business.category ?? "";
              }

              if (defaultValue) {
                fieldAnswersData.push({
                  campaignId: campaign.id,
                  fieldId: field.id,
                  value: String(defaultValue),
                  source: field.source ?? "business_input",
                });
              }
            }

            if (fieldAnswersData.length > 0) {
              await tx.campaignFieldAnswer.createMany({
                data: fieldAnswersData,
              });
            }

            return campaign.id;
          });
        }),
      );

      for (const res of chunkResults) {
        if (res) {
          campaignIds.push(res);
        } else {
          skipped++;
        }
      }
    }

    await this.logTemplateAudit(
      "CAMPAIGN_TEMPLATE_INSTANTIATED",
      template.id,
      params.adminUserId,
      { created: campaignIds.length, skipped, businessIds: params.businessIds },
    );

    return { created: campaignIds.length, skipped, campaignIds };
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = this.slugify(name) || "template";
    const existing = await this.prisma.campaignTemplate.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const slugSet = new Set(existing.map((e) => e.slug));
    if (!slugSet.has(base)) return base;
    let suffix = 2;
    while (slugSet.has(`${base}-${suffix}`)) {
      suffix++;
    }
    return `${base}-${suffix}`;
  }

  private rethrowUniqueSlug(err: unknown, slug: string): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictException(`Template slug '${slug}' already exists`);
    }
    throw err;
  }

  private async resolveTargetBusinessIds(
    dto: InstantiateCampaignTemplateDto,
  ): Promise<string[]> {
    const ids = new Set<string>(dto.businessIds ?? []);

    if (dto.locationId) {
      const businesses = await this.prisma.business.findMany({
        where: { locationId: dto.locationId },
        select: { id: true },
      });
      for (const b of businesses) ids.add(b.id);
    }

    return [...ids];
  }

  private async logTemplateAudit(
    action: string,
    entityId: string,
    adminUserId: string | undefined,
    details: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action,
        entityType: "campaign_template",
        entityId,
        details,
      },
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
