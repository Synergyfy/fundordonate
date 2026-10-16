import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  Business,
  BusinessCampaign,
  BusinessCampaignStatus,
  BusinessStatus,
  CampaignTemplate,
  MembershipTier,
  TemplateApprovalMode,
} from "@prisma/client";
import { CampaignQueryDto } from "../dto/campaign-query.dto";
import { SaveCampaignAnswersDto } from "../dto/save-campaign-answers.dto";
import { normalizeBusinessRewardsMode } from "@/modules/rewards/reward-config.util";

export interface TemplateRequirementCheck {
  id: string;
  label: string;
  hint: string;
  met: boolean;
}

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

/** The template's `config.access` block, as authored in the wizard. */
interface TemplateAccessConfig {
  type?: string;
  eligibility?: string[];
  minContribution?: string | number;
}

/** The membership tiers, lowest → highest. */
const TIER_HIERARCHY: MembershipTier[] = [
  MembershipTier.BRONZE,
  MembershipTier.SILVER,
  MembershipTier.GOLD,
  MembershipTier.PLATINUM,
];

const gbp = (pence: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);

@Injectable()
export class BusinessCampaignService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [templates, contributionAgg] = await Promise.all([
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
    ]);

    const contributedPence = contributionAgg._sum.amount ?? 0;

    return templates.map((tpl) => {
      const access = this.evaluateAccess(business, tpl, contributedPence);

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

  /** The `config.access` block authored in the template wizard (or `{}`). */
  private templateAccess(template: CampaignTemplate): TemplateAccessConfig {
    const access = (template.config as Record<string, unknown> | null)?.access;
    return access && typeof access === "object"
      ? (access as TemplateAccessConfig)
      : {};
  }

  /**
   * The eligibility rules to enforce. Defaults to "verified business account
   * only" for templates predating the wizard's access step — so nothing is
   * required that the admin did not explicitly select.
   */
  private templateEligibilityRules(template: CampaignTemplate): string[] {
    const rules = this.templateAccess(template).eligibility;
    return Array.isArray(rules) && rules.length > 0
      ? rules.filter((r): r is string => typeof r === "string")
      : ["business_account"];
  }

  /** The minimum platform contribution (pence) the min_contribution rule needs. */
  private requiredContributionPence(template: CampaignTemplate): number {
    if (template.minContributionAmount > 0) return template.minContributionAmount;
    const pounds = Number(this.templateAccess(template).minContribution ?? 0);
    return Number.isFinite(pounds) && pounds > 0 ? Math.round(pounds * 100) : 0;
  }

  /**
   * Evaluates a template's access rules against a business and returns the
   * ordered requirement checklist (shown to the business), whether every
   * requirement is met, the access model label, and the qualifying contribution.
   */
  private evaluateAccess(
    business: Business,
    template: CampaignTemplate,
    contributedPence: number,
  ): {
    requirements: TemplateRequirementCheck[];
    allMet: boolean;
    accessType: string;
    contributionRequiredPence: number;
  } {
    const rules = this.templateEligibilityRules(template);
    const requirements: TemplateRequirementCheck[] = [];

    const membershipActive =
      (business.membershipExpiry?.getTime() ?? 0) > Date.now() ||
      business.membershipTier !== MembershipTier.BRONZE;

    for (const rule of rules) {
      switch (rule) {
        case "business_account":
          requirements.push({
            id: "business_account",
            label: "Verified business account",
            hint: "Your business account must be active on FundOrDonate.",
            met: business.status === BusinessStatus.ACTIVE,
          });
          break;
        case "pre_audit":
          requirements.push({
            id: "pre_audit",
            label: "Public Pre-Audit completed",
            hint: "Complete your FundOrDonate public pre-audit and business verification.",
            met: !!business.auditReference,
          });
          break;
        case "membership_active":
          requirements.push({
            id: "membership_active",
            label: "Active membership",
            hint: "Hold an active FundOrDonate membership tier.",
            met: membershipActive,
          });
          break;
        case "package_tier":
          requirements.push({
            id: "package_tier",
            label: "Purchased package tier",
            hint: "Hold the required FundOrDonate package tier.",
            met: membershipActive,
          });
          break;
        case "min_contribution": {
          const required = this.requiredContributionPence(template);
          requirements.push({
            id: "min_contribution",
            label: `Minimum platform contribution (${gbp(required)})`,
            hint: "Contribute at least this amount to the platform to unlock the template.",
            met: required <= 0 || contributedPence >= required,
          });
          break;
        }
        case "admin_approval":
          // No per-business grant store exists: this is not a template lock.
          // Selecting it means an admin reviews the *campaign* after claiming
          // (reflected by `approvalMode`), so it never blocks the template.
          requirements.push({
            id: "admin_approval",
            label: "Admin approval",
            hint: "An admin reviews your campaign after you claim this template.",
            met: true,
          });
          break;
        default:
          break;
      }
    }

    // Membership-tier gate — enforced whenever the template targets above the
    // base tier (also covers legacy templates that have no access config).
    requirements.push(this.tierRequirement(business, template));

    return {
      requirements,
      allMet: requirements.every((r) => r.met),
      accessType: this.templateAccess(template).type ?? "automatic",
      contributionRequiredPence: rules.includes("min_contribution")
        ? this.requiredContributionPence(template)
        : 0,
    };
  }

  /** The membership-tier gate, or a no-op check when the base tier suffices. */
  private tierRequirement(
    business: Business,
    template: CampaignTemplate,
  ): TemplateRequirementCheck {
    const minTier = template.minEligibilityTier;
    const minIndex = TIER_HIERARCHY.indexOf(minTier);
    const businessIndex = TIER_HIERARCHY.indexOf(business.membershipTier);

    // Base tier (BRONZE) accepts everyone; only above-base tiers gate access.
    if (minIndex <= 0) {
      return {
        id: "campaign_eligibility",
        label: `Membership tier (${minTier} or higher)`,
        hint: "Your membership tier satisfies this template.",
        met: true,
      };
    }

    return {
      id: "campaign_eligibility",
      label: `Membership tier (${minTier} or higher)`,
      hint: `Requires ${minTier} membership or higher.`,
      met: businessIndex >= minIndex,
    };
  }

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
    const access = this.evaluateAccess(
      business,
      template,
      contributionAgg._sum.amount ?? 0,
    );
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
      const auditAnswers = (business.preAuditAnswers as Record<string, string>) || {};

      for (const field of fieldsConfig) {
        let defaultValue = field.value || "";

        // Pre-populate from business identity or audit answers
        if (field.source === "audit" && auditAnswers[field.id]) {
          defaultValue = auditAnswers[field.id];
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
