import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BusinessCampaign,
  BusinessCampaignStatus,
  CampaignTemplate,
  TemplateApprovalMode,
} from "@prisma/client";
import { AuditLinkStatus } from "@prisma/client";
import { CampaignQueryDto } from "../dto/campaign-query.dto";
import { SaveCampaignAnswersDto } from "../dto/save-campaign-answers.dto";
import { normalizeBusinessRewardsMode } from "@/modules/rewards/reward-config.util";
import { AuditDataService } from "@/modules/audit/services/audit-data.service";
import {
  TemplateEligibilityService,
  type TemplateRequirementCheck,
} from "@/modules/eligibility/template-eligibility.service";

export type { TemplateRequirementCheck };

export interface BusinessTemplateView {
  id: string;
  name: string;
  tagline: string;
  season: string;
  origin: string;
  approval: string;
  status: "available" | "locked";
  /** Human label for the configured access model (e.g. "Automatic"). */
  accessType: string;
  /** The platform contribution (pence) required to unlock, if configured. */
  contributionRequirement: { required: boolean; amount: number };
  requirements: TemplateRequirementCheck[];
  selfFunding: {
    enabled: boolean;
    mode: string;
    amount: number;
    rewardName: string | null;
  };
  fields: any[];
  rewards: any[];
  mcomAssets: any[];
  businessRewardsMode: string;
}

@Injectable()
export class BusinessCampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditData: AuditDataService,
    private readonly eligibility: TemplateEligibilityService,
  ) {}

  /**
   * Evaluates the active templates against the business profile and splits them
   * into available vs locked.
   *
   * Availability is driven **entirely by the template's own access rules**
   * (`config.access.eligibility`) plus the membership-tier gate — nothing is
   * hardcoded. This keeps the Campaign Centre in lock-step with what an admin
   * configures in the template wizard.
   */
  async getTemplates(businessId: string): Promise<BusinessTemplateView[]> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const [templates, contributionAgg, auditStatus] = await Promise.all([
      this.prisma.campaignTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      }),
      // Total the business has already contributed to the platform — used by
      // the `min_contribution` eligibility rule.
      this.prisma.contribution.aggregate({
        where: { businessId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      // Local 247GBS Audit snapshot — drives the `pre_audit` eligibility rule.
      // Refreshed from the provider when stale (a user is present here).
      this.auditData.refreshIfStale(businessId),
    ]);

    const contributedPence = contributionAgg._sum.amount ?? 0;
    const preAuditMet = auditStatus.linkStatus === AuditLinkStatus.AVAILABLE;

    return templates.map((tpl) => {
      const access = this.eligibility.evaluate({
        business,
        template: tpl,
        contributedPence,
        preAuditMet,
      });

      return {
        id: tpl.id,
        name: tpl.name,
        tagline: tpl.tagline,
        season: tpl.seasonId ?? "Current Season",
        origin: tpl.origin.toLowerCase(),
        approval: tpl.approvalMode.toLowerCase(),
        status: access.allMet ? "available" : "locked",
        accessType: access.accessType,
        contributionRequirement: {
          required: access.contributionRequiredPence > 0,
          amount: access.contributionRequiredPence,
        },
        requirements: access.requirements,
        selfFunding: {
          enabled: tpl.selfFundingEnabled,
          mode: tpl.selfFundingMode,
          amount: tpl.selfFundingAmount,
          rewardName: tpl.selfFundingRewardName,
        },
        businessRewardsMode: normalizeBusinessRewardsMode(tpl.businessRewardsMode),
        fields: (tpl.fieldsConfig as any[]) || [],
        rewards: (tpl.rewardsConfig as any[]) || [],
        mcomAssets: (tpl.mcomAssetsConfig as any[]) || [],
      };
    });
  }

  // ── Access evaluation ─────────────────────────────────────────────────────

  /**
   * Claims a template for a business, initializing the campaign draft and pre-populating fields.
   */
  async claimTemplate(
    businessId: string,
    templateId: string,
  ): Promise<{ campaignId: string }> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const template = await this.prisma.campaignTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException("Campaign template not found or inactive");
    }

    // Enforce the template's access rules server-side (the UI hides the claim
    // button when locked, but the API must not be bypassable).
    const contributionAgg = await this.prisma.contribution.aggregate({
      where: { businessId, status: "COMPLETED" },
      _sum: { amount: true },
    });
    const auditStatus = await this.auditData.getStatus(businessId);
    const access = this.eligibility.evaluate({
      business,
      template,
      contributedPence: contributionAgg._sum.amount ?? 0,
      preAuditMet: auditStatus.linkStatus === AuditLinkStatus.AVAILABLE,
    });
    if (!access.allMet) {
      const unmet = access.requirements
        .filter((r) => !r.met)
        .map((r) => r.label)
        .join(", ");
      throw new ForbiddenException(
        `You are not yet eligible for this template. Outstanding requirement(s): ${unmet}.`,
      );
    }

    // Create the BusinessCampaign in DRAFT status
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.businessCampaign.create({
        data: {
          businessId,
          templateId,
          title: template.name,
          targetAmount: 5000000, // Default £50,000 in pence, adjustable in wizard
          status: BusinessCampaignStatus.DRAFT,
          businessContribution: 0,
        },
      });

      // Pre-populate fields based on template configuration and known business data
      const fieldsConfig = (template.fieldsConfig as any[]) || [];
      // 247GBS Audit never exposes raw answers — pre-fill audit-sourced fields
      // from the server-computed pre-audit diagnostic via the field map.
      const auditFields = fieldsConfig.filter(
        (f) =>
          f?.source === "audit" || f?.source === "audit_diagnostic",
      );
      const auditDefaults = await this.auditData.getFieldDefaults(
        businessId,
        auditFields,
      );

      for (const field of fieldsConfig) {
        let defaultValue = field.value || "";

        // Pre-populate from the 247GBS pre-audit diagnostic or business identity.
        if (
          (field.source === "audit" || field.source === "audit_diagnostic") &&
          auditDefaults[field.id]
        ) {
          defaultValue = auditDefaults[field.id];
        } else if (field.source === "business_account") {
          if (field.id === "business_name") defaultValue = business.name;
          if (field.id === "city") defaultValue = business.city;
          if (field.id === "high_street") defaultValue = business.highStreet;
          if (field.id === "category") defaultValue = business.category;
        }

        if (defaultValue) {
          await tx.campaignFieldAnswer.create({
            data: {
              campaignId: campaign.id,
              fieldId: field.id,
              value: defaultValue,
              source: field.source || "business_input",
            },
          });
        }
      }

      return { campaignId: campaign.id };
    });
  }

  /**
   * Retrieves paginated list of campaigns for the authenticated business.
   */
  async getMyCampaigns(
    businessId: string,
    query: CampaignQueryDto,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where = {
      businessId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.businessCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: {
          template: {
            select: {
              name: true,
              selfFundingRewardName: true,
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      }),
      this.prisma.businessCampaign.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        templateId: c.templateId,
        templateName: c.template.name,
        title: c.title,
        description: c.description,
        status: c.status,
        raised: c.raisedAmount,
        target: c.targetAmount,
        businessContribution: c.businessContribution,
        rewardTriggered: c.rewardTriggered,
        backers: c._count.contributions,
        endDate: c.endDate?.toISOString() ?? null,
        percentage:
          c.targetAmount > 0
            ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
            : 0,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Retrieves comprehensive details of a specific campaign for wizard setup or management.
   */
  async getCampaignDetail(
    businessId: string,
    campaignId: string,
  ): Promise<any> {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: {
        id: campaignId,
        businessId,
      },
      include: {
        template: true,
        answers: true,
        requestedChanges: true,
        _count: {
          select: { contributions: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    return {
      id: campaign.id,
      templateId: campaign.templateId,
      title: campaign.title,
      description: campaign.description,
      status: campaign.status,
      target: campaign.targetAmount,
      raised: campaign.raisedAmount,
      businessContribution: campaign.businessContribution,
      rewardTriggered: campaign.rewardTriggered,
      backers: campaign._count.contributions,
      template: {
        id: campaign.template.id,
        name: campaign.template.name,
        tagline: campaign.template.tagline,
        approvalMode: campaign.template.approvalMode,
        selfFunding: {
          enabled: campaign.template.selfFundingEnabled,
          mode: campaign.template.selfFundingMode,
          amount: campaign.template.selfFundingAmount,
          rewardName: campaign.template.selfFundingRewardName,
        },
        businessRewardsMode: normalizeBusinessRewardsMode(
          campaign.template.businessRewardsMode,
        ),
        fields: (campaign.template.fieldsConfig as any[]) || [],
        rewards: (campaign.template.rewardsConfig as any[]) || [],
        mcomAssets: (campaign.template.mcomAssetsConfig as any[]) || [],
      },
      answers: campaign.answers.map((a) => ({
        fieldId: a.fieldId,
        value: a.value,
        source: a.source,
      })),
      changes: campaign.requestedChanges
        .filter((c) => !c.resolved)
        .map((c) => ({
          fieldId: c.fieldId,
          label: c.label,
          note: c.note,
        })),
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }

  /**
   * Saves or updates field answers in the database.
   */
  async saveAnswers(
    businessId: string,
    campaignId: string,
    dto: SaveCampaignAnswersDto,
  ): Promise<void> {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (
      campaign.status !== BusinessCampaignStatus.DRAFT &&
      campaign.status !== BusinessCampaignStatus.CHANGES_REQUESTED
    ) {
      throw new ForbiddenException(
        "Cannot modify answers when campaign is under review or active.",
      );
    }

    // Atomically upsert answers
    await this.prisma.$transaction(
      dto.answers.map((ans) =>
        this.prisma.campaignFieldAnswer.upsert({
          where: {
            campaignId_fieldId: {
              campaignId,
              fieldId: ans.fieldId,
            },
          },
          update: {
            value: ans.value,
          },
          create: {
            campaignId,
            fieldId: ans.fieldId,
            value: ans.value,
            source: "business_input",
          },
        }),
      ),
    );
  }

  /**
   * Submits a campaign draft for review or triggers automatic activation.
   */
  async submitForReview(
    businessId: string,
    campaignId: string,
  ): Promise<{ status: BusinessCampaignStatus }> {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      include: {
        template: true,
        answers: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const templateFields = (campaign.template.fieldsConfig as any[]) || [];
    const answerMap = new Map(campaign.answers.map((a) => [a.fieldId, a.value]));

    // Validate all required editable fields are answered
    for (const field of templateFields) {
      if (field.required && !field.locked) {
        const val = answerMap.get(field.id);
        if (!val || val.trim().length === 0) {
          throw new BadRequestException(
            `Field '${field.label || field.id}' is required and must be answered before submission.`,
          );
        }
      }
    }

    const nextStatus =
      campaign.template.approvalMode === TemplateApprovalMode.AUTOMATIC
        ? BusinessCampaignStatus.ACTIVE
        : BusinessCampaignStatus.PENDING_REVIEW;

    const updateResult = await this.prisma.businessCampaign.updateMany({
      where: { id: campaignId, businessId },
      data: {
        status: nextStatus,
        startDate: nextStatus === BusinessCampaignStatus.ACTIVE ? new Date() : null,
      },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException("Campaign not found");
    }

    return { status: nextStatus };
  }
}
