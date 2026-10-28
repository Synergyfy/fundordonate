import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import Redis from "ioredis";
import {
  Prisma,
  BusinessCampaignStatus,
  CampaignLocationScope,
  PreferredAudience,
  TemplateStatus,
} from "@prisma/client";
import {
  AdminCampaignQueryDto,
  BulkCampaignActionDto,
  CreateAdminCampaignDto,
  CreateCampaignTemplateDto,
  DuplicateCampaignTemplateDto,
  InstantiateCampaignTemplateDto,
  RequestCampaignChangesDto,
  UpdateAdminCampaignDto,
  UpdateCampaignStatusDto,
  UpdateCampaignTemplateDto,
  UpdateCampaignTemplateStatusDto,
} from "../dto/campaign-admin.dto";
import { SetCampaignLocationsDto } from "../dto/campaign-locations.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ADMIN_TASKS_QUEUE } from "../processors/admin-tasks.constants";
import { AuditDataService } from "@/modules/audit/services/audit-data.service";
import { TemplateEligibilityService } from "@/modules/eligibility/template-eligibility.service";
import { AuditLinkStatus } from "@prisma/client";
import {
  getCampaignWizardSettings,
  normaliseCampaignWizardSettings,
} from "@/modules/campaigns/campaign-wizard-settings";

/** Why a business was skipped when an admin assigned a template to it. */
export interface InstantiateSkipReason {
  businessId: string;
  businessName: string | null;
  reason: "ineligible" | "already_exists" | "not_found";
  message: string;
  /** The unmet rule ids when `reason` is `ineligible`. */
  unmet: string[];
}

@Injectable()
export class AdminCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(ADMIN_TASKS_QUEUE) private readonly adminQueue: Queue,
    private readonly auditData: AuditDataService,
    private readonly eligibility: TemplateEligibilityService,
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
    const and: Prisma.BusinessCampaignWhereInput[] = [];

    if (status) {
      where.status = status;
    }

    if (seasonId) {
      // Platform campaigns store their seasons on `settings.seasonIds`; template
      // campaigns use the template relation.
      and.push({
        OR: [
          { template: { seasonId } },
          { settings: { path: ["seasonIds"], array_contains: seasonId } },
        ],
      });
    }

    if (locationId) {
      and.push({
        OR: [
          { locations: { some: { locationId } } },
          { locations: { none: {} }, business: { locationId } },
        ],
      });
    }

    if (audience && audience !== "all") {
      const preferredAudience = audience.toUpperCase() as PreferredAudience;
      and.push({
        OR: [
          { audience: preferredAudience },
          {
            audience: null,
            business: { preferredAudience },
          },
        ],
      });
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { business: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (and.length > 0) {
      where.AND = and;
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              username: true,
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
   * Creates a platform campaign directly from admin input. Platform campaigns
   * are stored on the same `business_campaigns` table as business campaigns so
   * they surface everywhere business campaigns do (homepage, hubs, search), but
   * they have no owning business or template.
   */
  async createCampaign(dto: CreateAdminCampaignDto, adminUserId?: string) {
    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException("Campaign title is required");
    }

    const status = dto.status ?? BusinessCampaignStatus.DRAFT;

    // Validate and normalise everything the wizard collected. Draft saves are
    // allowed to be incomplete; publishing enforces the full rule set.
    const rawSettings = (dto.settings ?? {}) as Record<string, unknown>;
    const hasWizardSettings = Object.keys(rawSettings).length > 0;
    if (
      hasWizardSettings &&
      status === BusinessCampaignStatus.ACTIVE &&
      !dto.shortDescription?.trim()
    ) {
      throw new BadRequestException("Short description is required");
    }
    const settings = normaliseCampaignWizardSettings(rawSettings, dto.targetAmount, {
      strict: hasWizardSettings && status === BusinessCampaignStatus.ACTIVE,
    });
    const targetAmount = settings.hasTarget === false ? 0 : dto.targetAmount;

    const periodMode = hasWizardSettings ? settings.periodMode ?? "custom" : null;
    let startDate =
      dto.startDate !== undefined && dto.startDate !== null
        ? new Date(dto.startDate)
        : null;
    let endDate =
      dto.endDate !== undefined && dto.endDate !== null
        ? new Date(dto.endDate)
        : null;

    if (periodMode === "season") {
      const seasonIds = settings.seasonIds ?? [];
      if (seasonIds.length > 0) {
        const seasons = await this.prisma.season.findMany({
          where: { id: { in: seasonIds } },
          select: { id: true, startDate: true, endDate: true },
        });
        if (seasons.length !== new Set(seasonIds).size) {
          const foundIds = new Set(seasons.map((season) => season.id));
          const missing = seasonIds.filter((id) => !foundIds.has(id));
          throw new BadRequestException(`Unknown season(s): ${missing.join(", ")}`);
        }
        startDate = new Date(Math.min(...seasons.map((season) => season.startDate.getTime())));
        endDate = new Date(Math.max(...seasons.map((season) => season.endDate.getTime())));
      } else if (status === BusinessCampaignStatus.ACTIVE) {
        throw new BadRequestException("Select at least one season for a season-based campaign");
      }
    } else if (periodMode === "evergreen") {
      endDate = null;
      if (!startDate && status === BusinessCampaignStatus.ACTIVE) {
        startDate = new Date();
      }
    } else if (
      periodMode === "custom" &&
      hasWizardSettings &&
      status === BusinessCampaignStatus.ACTIVE &&
      (!startDate || !endDate)
    ) {
      throw new BadRequestException("Campaign start and end dates are required");
    } else if (!hasWizardSettings && status === BusinessCampaignStatus.ACTIVE && !startDate) {
      startDate = new Date();
    }

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException("Invalid campaign start date");
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid campaign end date");
    }
    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException(
        "Campaign end date must be after the start date",
      );
    }

    const coverage = settings.locationCoverage ?? {};
    const coverageCityIds = coverage.selectedCities ?? [];
    const coverageLocalAreaIds = coverage.selectedLocalAreas ?? [];
    const coverageHighStreetIds = coverage.selectedHighStreets ?? [];

    let primaryLocationId =
      dto.primaryLocationId ||
      settings.cityId ||
      coverageCityIds[0] ||
      null;
    let additionalLocationIds = [
      ...new Set([
        ...(dto.additionalLocationIds ?? []),
        ...coverageCityIds,
        ...coverageLocalAreaIds,
        ...coverageHighStreetIds,
      ]),
    ].filter(Boolean);

    // National coverage is represented by the NATIONAL hub row as the primary
    // location, so national campaigns are discoverable by location filters.
    if (coverage.includeNational && !primaryLocationId) {
      const national = await this.prisma.hubLocation.findFirst({
        where: { type: "NATIONAL", isActive: true },
        select: { id: true },
      });
      if (national) primaryLocationId = national.id;
    }

    additionalLocationIds = additionalLocationIds.filter(
      (id) => id !== primaryLocationId,
    );

    const hasLocations = Boolean(primaryLocationId) || additionalLocationIds.length > 0;
    if (
      status === BusinessCampaignStatus.ACTIVE &&
      hasWizardSettings &&
      settings.scope !== "independent" &&
      !hasLocations
    ) {
      throw new BadRequestException("Select at least one location for this campaign");
    }

    const locationIds = [
      ...(primaryLocationId ? [primaryLocationId] : []),
      ...additionalLocationIds,
    ];
    if (locationIds.length > 0) {
      const found = await this.prisma.hubLocation.findMany({
        where: { id: { in: locationIds }, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== locationIds.length) {
        const foundIds = new Set(found.map((location) => location.id));
        const missing = locationIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `Unknown or inactive location(s): ${missing.join(", ")}`,
        );
      }
    }

    const campaign = await this.prisma.$transaction(async (tx) => {
      const created = await tx.businessCampaign.create({
        data: {
          businessId: null,
          templateId: null,
          createdById: adminUserId ?? null,
          title,
          description: dto.description ?? null,
          shortDescription: dto.shortDescription ?? null,
          targetAmount,
          // "Starting amount" is money already raised/seeded before launch.
          raisedAmount: settings.startingAmountPence ?? 0,
          status,
          isFeatured: dto.isFeatured ?? true,
          mode: dto.mode ?? "donation",
          audience: dto.audience ?? PreferredAudience.BOTH,
          category: dto.category ?? null,
          imageUrl: dto.imageUrl ?? null,
          startDate,
          endDate,
          settings: settings as Prisma.InputJsonValue,
        },
      });

      if (primaryLocationId) {
        await tx.campaignLocation.create({
          data: {
            campaignId: created.id,
            locationId: primaryLocationId,
            scope: CampaignLocationScope.PRIMARY,
          },
        });
      }
      if (additionalLocationIds.length > 0) {
        await tx.campaignLocation.createMany({
          data: additionalLocationIds.map((locationId) => ({
            campaignId: created.id,
            locationId,
            scope: CampaignLocationScope.INCLUDED,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "CAMPAIGN_CREATED",
          entityType: "campaign",
          entityId: created.id,
          details: {
            kind: "platform",
            title: created.title,
            targetAmount: created.targetAmount,
            status: created.status,
            primaryLocationId,
            additionalLocationIds,
            periodMode,
            seasonIds: settings.seasonIds ?? [],
            contributionRules: (settings.contributionRules ?? null) as Prisma.InputJsonValue,
            allocationRules: (settings.allocationRules ?? null) as Prisma.InputJsonValue,
            rewardsConfigured: (settings.rewardConfigs ?? []).length,
          },
        },
      });

      return created;
    });

    await this.invalidateHubCaches();

    return this.getCampaign(campaign.id);
  }

  /** Best-effort invalidation of the public hub aggregates. */
  private async invalidateHubCaches() {
    try {
      await this.redis.del(
        "hub:cities:all",
        "hub:summary:national",
        "hub:location:tree",
      );
    } catch {
      // Cache invalidation is best-effort.
    }
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            username: true,
          },
        },
        answers: true,
        locations: {
          include: {
            location: {
              select: { id: true, name: true, slug: true, type: true, fullPath: true },
            },
          },
        },
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

    // Re-run the full wizard rule validation before a draft is made live so
    // incomplete drafts cannot bypass the checks performed at creation time.
    if (dto.status === BusinessCampaignStatus.ACTIVE) {
      const settings = getCampaignWizardSettings(campaign.settings);
      if (settings.contributionRules) {
        normaliseCampaignWizardSettings(campaign.settings, campaign.targetAmount, {
          strict: true,
        });
        if (!campaign.shortDescription?.trim()) {
          throw new BadRequestException("Short description is required");
        }

        if (settings.periodMode === "season" && (settings.seasonIds?.length ?? 0) === 0) {
          throw new BadRequestException(
            "Select at least one season before activating a season-based campaign",
          );
        }
        if (
          campaign.businessId === null &&
          settings.periodMode === "custom" &&
          (!campaign.startDate || !campaign.endDate)
        ) {
          throw new BadRequestException("Campaign start and end dates are required");
        }
        if (campaign.businessId === null && settings.scope !== "independent") {
          const locationCount = await this.prisma.campaignLocation.count({
            where: { campaignId: id },
          });
          if (locationCount === 0) {
            throw new BadRequestException("Select at least one location for this campaign");
          }
        }
      }
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
   * Updates the campaign-level fields admins can safely edit without going
   * through the template/approval workflow.
   */
  async updateCampaign(
    id: string,
    dto: UpdateAdminCampaignDto,
    adminUserId?: string,
  ) {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const data: Prisma.BusinessCampaignUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.targetAmount !== undefined) data.targetAmount = dto.targetAmount;
    if (dto.businessContribution !== undefined) {
      data.businessContribution = dto.businessContribution;
    }
    if (dto.shortDescription !== undefined) {
      data.shortDescription = dto.shortDescription;
    }
    if (dto.mode !== undefined) data.mode = dto.mode;
    if (dto.audience !== undefined) data.audience = dto.audience;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.settings !== undefined) {
      data.settings = normaliseCampaignWizardSettings(
        dto.settings,
        dto.targetAmount ?? campaign.targetAmount,
        { strict: false },
      ) as Prisma.InputJsonValue;
    }

    const startDate =
      dto.startDate !== undefined
        ? dto.startDate
          ? new Date(dto.startDate)
          : null
        : campaign.startDate;
    const endDate =
      dto.endDate !== undefined
        ? dto.endDate
          ? new Date(dto.endDate)
          : null
        : campaign.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException(
        "Campaign end date must be after the start date",
      );
    }

    if (dto.startDate !== undefined) data.startDate = startDate;
    if (dto.endDate !== undefined) data.endDate = endDate;

    const updated = await this.prisma.businessCampaign.update({
      where: { id },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CAMPAIGN_UPDATED",
        entityType: "campaign",
        entityId: id,
        details: {
          changedFields: Object.keys(dto),
          previous: {
            title: campaign.title,
            targetAmount: campaign.targetAmount,
            businessContribution: campaign.businessContribution,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
          },
        },
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
   * Validates and normalises the wizard config before persisting.
   *
   * When the `required_campaign_donation` rule is active, the attached campaign
   * must exist; its canonical title and minimum donation are snapshotted into
   * the access config so the business UI can render the setup-time donation
   * step without an extra lookup. The rule never locks the template itself.
   *
   * When the `admin_assigned` rule is active, the selected businesses are
   * validated and snapshotted (id, name, email) so the assignment list stays
   * readable and only those businesses can claim the template.
   */
  private async normaliseTemplateConfig(
    config?: Record<string, any>,
  ): Promise<Record<string, any>> {
    const next: Record<string, any> = { ...(config ?? {}) };
    const rawAccess = next.access;
    if (!rawAccess || typeof rawAccess !== "object" || Array.isArray(rawAccess)) {
      return next;
    }

    const access: Record<string, any> = { ...(rawAccess as Record<string, any>) };
    const eligibility = Array.isArray(access.eligibility)
      ? access.eligibility.filter((rule): rule is string => typeof rule === "string")
      : [];
    const requiresCampaign = eligibility.includes("required_campaign_donation");
    const rawCampaignId =
      typeof access.requiredCampaignId === "string"
        ? access.requiredCampaignId.trim()
        : "";

    if (!requiresCampaign) {
      access.requiredCampaignId = null;
      access.requiredCampaignTitle = null;
      access.requiredCampaignMinPence = 0;
    } else if (!rawCampaignId) {
      throw new BadRequestException(
        "Select a campaign for the 'Donation to an attached campaign' eligibility rule.",
      );
    } else {
      const campaign = await this.prisma.businessCampaign.findUnique({
        where: { id: rawCampaignId },
        select: { id: true, title: true, status: true },
      });
      if (!campaign || campaign.status === BusinessCampaignStatus.CANCELLED) {
        throw new BadRequestException(
          "The attached prerequisite campaign does not exist or has been cancelled.",
        );
      }
      const minPence = Math.round(Number(access.requiredCampaignMinPence ?? 0));
      access.requiredCampaignId = campaign.id;
      access.requiredCampaignTitle = campaign.title;
      access.requiredCampaignMinPence =
        Number.isFinite(minPence) && minPence > 0 ? minPence : 0;
    }

    // ── Admin-assigned access ────────────────────────────────────────────
    // When the `admin_assigned` rule is active the admin must pick at least
    // one business; the snapshot of names/emails keeps the wizard and the
    // admin templates list readable without extra lookups.
    const requiresAssignment = eligibility.includes("admin_assigned");
    const rawAssignedIds = Array.isArray(access.assignedBusinessIds)
      ? access.assignedBusinessIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.trim().length > 0,
        )
      : [];

    if (!requiresAssignment) {
      access.assignedBusinessIds = [];
      access.assignedBusinesses = [];
    } else {
      const assignedIds = Array.from(new Set<string>(rawAssignedIds));
      if (assignedIds.length === 0) {
        throw new BadRequestException(
          "Select at least one business for the 'Admin assigned' access rule.",
        );
      }

      const businesses = await this.prisma.business.findMany({
        where: { id: { in: assignedIds } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });

      if (businesses.length !== assignedIds.length) {
        const found = new Set(businesses.map((b) => b.id));
        const missing = assignedIds.filter((id) => !found.has(id));
        throw new BadRequestException(
          `Unknown business assigned to this template: ${missing.join(", ")}`,
        );
      }

      access.assignedBusinessIds = businesses.map((b) => b.id);
      access.assignedBusinesses = businesses.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
      }));
    }

    next.access = access;
    return next;
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
    const config = await this.normaliseTemplateConfig(dto.config);

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
          businessRewardsMode: dto.businessRewardsMode ?? "disabled",
          fieldsConfig: dto.fieldsConfig ?? [],
          rewardsConfig: dto.rewardsConfig ?? [],
          mcomAssetsConfig: dto.mcomAssetsConfig ?? [],
          requirementsConfig: dto.requirementsConfig ?? [],
          config,
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
    if (dto.businessRewardsMode !== undefined) data.businessRewardsMode = dto.businessRewardsMode;
    if (dto.fieldsConfig !== undefined) data.fieldsConfig = dto.fieldsConfig;
    if (dto.rewardsConfig !== undefined) data.rewardsConfig = dto.rewardsConfig;
    if (dto.mcomAssetsConfig !== undefined) data.mcomAssetsConfig = dto.mcomAssetsConfig;
    if (dto.requirementsConfig !== undefined) data.requirementsConfig = dto.requirementsConfig;
    if (dto.config !== undefined) {
      data.config = (await this.normaliseTemplateConfig(dto.config)) as Prisma.InputJsonValue;
    }
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

    // Admin override is only honoured when the template explicitly allows it.
    if (dto.force && !this.eligibility.allowAssignmentOverride(template)) {
      throw new BadRequestException(
        "This template does not allow assignment eligibility to be overridden.",
      );
    }

    const payload = {
      templateId: id,
      businessIds,
      targetAmount: dto.targetAmount,
      deadlineDays: dto.deadlineDays,
      adminUserId,
      force: dto.force,
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
      skippedReasons: result.skippedReasons,
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
    force?: boolean;
  }): Promise<{
    created: number;
    skipped: number;
    campaignIds: string[];
    skippedReasons: InstantiateSkipReason[];
  }> {
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
    const skippedReasons: InstantiateSkipReason[] = [];

    // Admin override is only honoured when the template explicitly allows it.
    const enforceEligibility = !(
      params.force && this.eligibility.allowAssignmentOverride(template)
    );

    // 1. Bulk find existing campaigns for these business IDs (idempotency).
    const existingCampaigns = await this.prisma.businessCampaign.findMany({
      where: {
        businessId: { in: params.businessIds },
        templateId: template.id,
        status: { not: BusinessCampaignStatus.CANCELLED },
      },
      select: { businessId: true },
    });
    const existingBizSet = new Set(existingCampaigns.map((c) => c.businessId));
    let eligibleBizIds = params.businessIds.filter((id) => !existingBizSet.has(id));
    for (const id of params.businessIds) {
      if (existingBizSet.has(id)) {
        skippedReasons.push({
          businessId: id,
          businessName: null,
          reason: "already_exists",
          message: "A campaign for this template already exists for the business.",
          unmet: [],
        });
      }
    }

    // 2. Bulk find business rule inputs (a superset of what field pre-fill needs).
    const businesses = await this.prisma.business.findMany({
      where: { id: { in: eligibleBizIds } },
      select: {
        id: true,
        name: true,
        city: true,
        highStreet: true,
        category: true,
        status: true,
        membershipTier: true,
        membershipExpiry: true,
        locationId: true,
        ownerId: true,
      },
    });
    const foundBizMap = new Map(businesses.map((b) => [b.id, b]));
    for (const id of eligibleBizIds) {
      if (!foundBizMap.has(id)) {
        skippedReasons.push({
          businessId: id,
          businessName: null,
          reason: "not_found",
          message: "Business not found.",
          unmet: [],
        });
      }
    }
    eligibleBizIds = eligibleBizIds.filter((id) => foundBizMap.has(id));

    // 3. Enforce the template's eligibility rules (same rules the business sees
    //    when claiming). `pre_audit` is checked against 247GBS Audit: the target
    //    businesses' snapshots are refreshed server-side first so a business
    //    that has never opened the Campaign Centre is judged on live data.
    if (enforceEligibility && eligibleBizIds.length > 0) {
      const requiresPreAudit = this.eligibility.requiresPreAudit(template);
      if (requiresPreAudit) {
        await this.auditData.refreshMany(eligibleBizIds);
      }

      const contributionGroups = await this.prisma.contribution.groupBy({
        by: ["businessId"],
        where: {
          businessId: { in: eligibleBizIds },
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });
      const contributedByBiz = new Map(
        contributionGroups.map((g) => [g.businessId as string, g._sum.amount ?? 0]),
      );

      const preAuditByBiz = new Map<string, boolean>();
      if (requiresPreAudit) {
        const statuses = await Promise.all(
          eligibleBizIds.map((id) => this.auditData.getStatus(id)),
        );
        eligibleBizIds.forEach((id, idx) => {
          preAuditByBiz.set(
            id,
            statuses[idx].linkStatus === AuditLinkStatus.AVAILABLE,
          );
        });
      }

      // An attached-campaign donation is a setup-time obligation, not an
      // assignment gate: the business donates during setup before submitting.
      const kept: string[] = [];
      for (const id of eligibleBizIds) {
        const business = foundBizMap.get(id)!;
        const result = this.eligibility.evaluate({
          business,
          template,
          contributedPence: contributedByBiz.get(id) ?? 0,
          preAuditMet: preAuditByBiz.get(id) ?? false,
        });
        if (result.allMet) {
          kept.push(id);
        } else {
          const unmet = result.requirements.filter((r) => !r.met);
          skippedReasons.push({
            businessId: id,
            businessName: business.name,
            reason: "ineligible",
            message: `Not eligible — outstanding: ${unmet.map((r) => r.label).join(", ")}.`,
            unmet: unmet.map((r) => r.id),
          });
        }
      }
      eligibleBizIds = kept;
    }

    // Pre-resolve 247GBS Audit field defaults from each business's snapshot
    // (no user session here — this reads the local mirror, never the provider).
    const auditFields = fieldsConfig.filter(
      (f) => f?.source === "audit" || f?.source === "audit_diagnostic",
    );
    const auditDefaultsByBiz = new Map<string, Record<string, string>>();
    if (auditFields.length > 0 && eligibleBizIds.length > 0) {
      await Promise.all(
        eligibleBizIds.map(async (id) => {
          auditDefaultsByBiz.set(
            id,
            await this.auditData.getFieldDefaults(id, auditFields),
          );
        }),
      );
    }

    const BATCH_SIZE = 10;
    for (let i = 0; i < eligibleBizIds.length; i += BATCH_SIZE) {
      const chunk = eligibleBizIds.slice(i, i + BATCH_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (businessId) => {
          const business = foundBizMap.get(businessId);
          if (!business) {
            return null;
          }

          const auditAnswers = auditDefaultsByBiz.get(businessId) ?? {};

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

            if (business.locationId) {
              await tx.campaignLocation.create({
                data: {
                  campaignId: campaign.id,
                  locationId: business.locationId,
                  scope: CampaignLocationScope.PRIMARY,
                },
              });
            }

            const fieldAnswersData: Array<{
              campaignId: string;
              fieldId: string;
              value: string;
              source: string;
            }> = [];

            for (const field of fieldsConfig) {
              let defaultValue: string = field.value ?? "";

              if (
                (field.source === "audit" ||
                  field.source === "audit_diagnostic") &&
                auditAnswers[field.id]
              ) {
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
        }
      }
    }

    const skipped = skippedReasons.length;

    await this.logTemplateAudit(
      "CAMPAIGN_TEMPLATE_INSTANTIATED",
      template.id,
      params.adminUserId,
      {
        created: campaignIds.length,
        skipped,
        forced: params.force === true && !enforceEligibility,
        businessIds: params.businessIds,
      },
    );

    return { created: campaignIds.length, skipped, campaignIds, skippedReasons };
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
   * Returns the campaign's location attribution rows.
   */
  async getCampaignLocations(campaignId: string) {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    return this.prisma.campaignLocation.findMany({
      where: { campaignId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            fullPath: true,
            activationStatus: true,
            statusOverride: true,
          },
        },
      },
      orderBy: [{ scope: "asc" }, { createdAt: "asc" }],
    });
  }

  /**
   * Replaces the campaign's location links. A single PRIMARY location owns the
   * campaign's funding for aggregation; additional locations are visibility-only.
   */
  async setCampaignLocations(campaignId: string, dto: SetCampaignLocationsDto) {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const existing = await this.prisma.campaignLocation.findMany({
      where: { campaignId },
      select: { locationId: true, scope: true },
    });
    const existingPrimary = existing.find(
      (entry) => entry.scope === CampaignLocationScope.PRIMARY,
    )?.locationId;
    const primaryLocationId =
      dto.primaryLocationId !== undefined ? dto.primaryLocationId || null : existingPrimary ?? null;

    const additionalIds = [...new Set(dto.additionalLocationIds ?? [])].filter(
      (id) => id && id !== primaryLocationId,
    );
    const secondaryIds = [...new Set(dto.secondaryLocationIds ?? [])].filter(
      (id) => id && id !== primaryLocationId && !additionalIds.includes(id),
    );
    const locationIds = [
      ...new Set([primaryLocationId, ...secondaryIds, ...additionalIds].filter(Boolean)),
    ] as string[];

    if (locationIds.length > 0) {
      const found = await this.prisma.hubLocation.findMany({
        where: { id: { in: locationIds }, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== locationIds.length) {
        const foundIds = new Set(found.map((location) => location.id));
        const missing = locationIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(`Unknown or inactive location(s): ${missing.join(", ")}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.campaignLocation.deleteMany({ where: { campaignId } });
      if (primaryLocationId) {
        await tx.campaignLocation.create({
          data: {
            campaignId,
            locationId: primaryLocationId,
            scope: CampaignLocationScope.PRIMARY,
          },
        });
      }
      if (additionalIds.length > 0) {
        await tx.campaignLocation.createMany({
          data: additionalIds.map((locationId) => ({
            campaignId,
            locationId,
            scope: CampaignLocationScope.INCLUDED,
          })),
        });
      }
      if (secondaryIds.length > 0) {
        await tx.campaignLocation.createMany({
          data: secondaryIds.map((locationId) => ({
            campaignId,
            locationId,
            scope: CampaignLocationScope.SECONDARY,
          })),
        });
      }
    });

    await this.invalidateHubCaches();

    return this.getCampaignLocations(campaignId);
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
