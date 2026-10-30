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
  CampaignLocationScope,
  CampaignTemplate,
  Prisma,
  TemplateApprovalMode,
} from "@prisma/client";
import { AuditLinkStatus } from "@prisma/client";
import { CampaignQueryDto } from "../dto/campaign-query.dto";
import { SaveCampaignAnswersDto } from "../dto/save-campaign-answers.dto";
import { UpdateCampaignSettingsDto } from "../dto/update-campaign-settings.dto";
import { normalizeBusinessRewardsMode } from "@/modules/rewards/reward-config.util";
import { AuditDataService } from "@/modules/audit/services/audit-data.service";
import { BusinessMediaService } from "./business-media.service";
import {
  TemplateEligibilityService,
  type TemplateRequirementCheck,
} from "@/modules/eligibility/template-eligibility.service";
import { CapabilityService } from "@/modules/plans/services/capability.service";
import { FEATURES } from "@/modules/plans/plan.constants";

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
  /** Minimum amount the business must have raised through FundOrDonate to unlock, if configured. */
  contributionRequirement: { required: boolean; amount: number };
  /**
   * Campaign the business must donate to **during setup** (before submission).
   * Informational only for the Campaign Centre — it never locks the template.
   */
  requiredCampaign: {
    campaignId: string;
    title: string;
    minPence: number;
  } | null;
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
  audience?: string;
  /** Premium templates require the `templates.premium` capability. */
  premium: boolean;
  requiredFeature: string | null;
  featureUnlocked: boolean;
}

@Injectable()
export class BusinessCampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditData: AuditDataService,
    private readonly eligibility: TemplateEligibilityService,
    private readonly media: BusinessMediaService,
    private readonly capabilities: CapabilityService,
  ) {}

  /**
   * Completed donation totals per campaign for one donor (the business owner).
   * Self-funding is excluded — it is the business funding its own campaign, not
   * a donation to the prerequisite campaign.
   */
  private async donationPenceByCampaign(
    donorUserId: string,
    campaignIds: string[],
  ): Promise<Map<string, number>> {
    if (!donorUserId || campaignIds.length === 0) return new Map();

    const groups = await this.prisma.contribution.groupBy({
      by: ["campaignId"],
      where: {
        backerId: donorUserId,
        campaignId: { in: campaignIds },
        status: "COMPLETED",
        type: { not: "SELF_FUNDING" },
      },
      _sum: { amount: true },
    });

    return new Map(groups.map((g) => [g.campaignId, g._sum.amount ?? 0]));
  }

  /**
   * Hydrates the admin-authored `fieldsConfig` rows into the blueprint shape the
   * business setup flow renders: a human label, a normalised source, lock/editable
   * state and — when a campaign exists — its current value.
   *
   * Pure and query-free, so it is safe to run for every template in a list.
   */
  private fieldBlueprints(
    rows: unknown,
    ctx: {
      answers?: Map<string, string>;
      campaign?: BusinessCampaign | null;
      business?: any | null;
      template?: CampaignTemplate | null;
    } = {},
  ): any[] {
    const sourceMeta: Record<string, { source: string; note: string }> = {
      template: { source: "template", note: "Set by the Admin template" },
      admin: { source: "admin", note: "Set by FundOrDonate" },
      admin_mcom: { source: "mcom", note: "Admin-managed MCOM asset" },
      business_mcom: { source: "mcom", note: "From your MCOM account" },
      audit_business: { source: "audit", note: "From your 247GBS Audit" },
      audit_diagnostic: { source: "audit", note: "From your 247GBS Audit" },
      business_account: { source: "business_account", note: "From your business account" },
      business_input: { source: "business_input", note: "Provided by you" },
      business: { source: "business_account", note: "From your business account" },
      location: { source: "location", note: "From your business location" },
    };

    const isoDay = (value?: Date | null) =>
      value ? value.toISOString().slice(0, 10) : "";
    const money = (pence?: number | null) =>
      typeof pence === "number" && pence > 0
        ? (pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)
        : "";

    const { answers, campaign, business, template } = ctx;

    return (Array.isArray(rows) ? rows : []).map((row, index) => {
      const id = String(row?.id ?? `field_${index}`);
      const label =
        row?.label ?? row?.field ?? row?.name ?? row?.question ?? id;
      const meta = sourceMeta[row?.source as string] ?? {
        source: String(row?.source ?? "template"),
        note: "",
      };
      // "Configurable" is the only access level the wizard opens to the
      // business ("Business can edit the value"); "conditional" ("only if
      // enabled") and "no" stay template-managed. Rewards are chosen in the
      // Rewards step, so they are never a free-text field.
      const locked = row?.access !== "configurable" || id === "f_rewards";

      let value = answers?.get(id) ?? "";
      if (!value && campaign) {
        switch (id) {
          case "f_title":
            value = campaign.title ?? "";
            break;
          case "f_desc":
            value = campaign.description ?? "";
            break;
          case "f_target":
            value = money(campaign.targetAmount);
            break;
          case "f_period": {
            const from = isoDay(campaign.startDate);
            const to = isoDay(campaign.endDate);
            value = from && to ? `${from} – ${to}` : from || to;
            break;
          }
          case "f_location":
            value = [business?.address, business?.city, business?.highStreet]
              .filter(Boolean)
              .join(", ");
            break;
          case "f_contact":
            value = [business?.email, business?.phone]
              .filter(Boolean)
              .join(" · ");
            break;
          case "f_rewards":
            // Rewards are chosen in the Rewards step, not as free text.
            value = "Chosen in the Rewards step";
            break;
          case "f_payout":
            value = "Managed by FundOrDonate";
            break;
          case "f_disclosure":
            value = template?.selfFundingEnabled
              ? "Self-funding is disclosed on your campaign"
              : "";
            break;
          default:
            break;
        }
      }

      const inputType: "text" | "number" | "date" | "textarea" =
        id === "f_target"
          ? "number"
          : id === "f_desc"
            ? "textarea"
            : /date|deadline|start|end/i.test(id)
              ? "date"
              : "text";

      // What kind of control the business should see. Derived from the field id
      // first (the wizard's standard rows), then from the label so Admin-added
      // custom rows still get a sensible input.
      const kind: "money" | "media" | "documents" | "contact" | "date" | "textarea" | "text" =
        id === "f_target" || /target|amount|budget|funding goal/i.test(label)
          ? "money"
          : id === "f_media" || /image|video|media|photo|logo|hero/i.test(label)
            ? "media"
            : id === "f_docs" || /document|evidence|attachment|supporting/i.test(label)
              ? "documents"
              : id === "f_contact" || /contact|email|phone/i.test(label)
                ? "contact"
                : id === "f_period" || /period|deadline|start date|end date/i.test(label)
                  ? "date"
                  : inputType === "textarea"
                    ? "textarea"
                    : "text";

      return {
        id,
        label,
        value,
        source: meta.source,
        sourceNote: meta.note,
        locked,
        editable: !locked,
        // The wizard does not capture a per-field "required" flag; an explicit
        // one (if ever present) is honoured, otherwise the field is optional.
        required: Boolean(row?.required),
        inputType,
        kind,
      };
    });
  }

  /**
   * Evaluates the active templates against the business profile and splits them
   * into available vs locked.
   *
   * Availability is driven **entirely by the template's own access rules**
   * (`config.access.eligibility`) plus the membership-tier gate — nothing is
   * hardcoded. This keeps the Campaign Centre in lock-step with what an admin
   * configures in the template wizard.
   *
   * Query shape is deliberately fixed — four statements regardless of how many
   * templates exist (business, templates, one contribution aggregate, one audit
   * snapshot). Every per-template check below is pure in-memory work, so adding
   * templates or eligibility rules never introduces an N+1.
   */
  async getTemplates(businessId: string): Promise<BusinessTemplateView[]> {
    const [business, templates, contributionAgg, auditStatus] = await Promise.all([
      this.prisma.business.findUnique({ where: { id: businessId } }),
      this.prisma.campaignTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      }),
      // Total already raised by this business's own campaigns — used by the
      // `min_contribution` eligibility rule.
      this.prisma.contribution.aggregate({
        where: { businessId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      // Local 247GBS Audit snapshot — drives the `pre_audit` eligibility rule.
      // Refreshed from the provider when stale (a user is present here).
      this.auditData.refreshIfStale(businessId),
    ]);

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const contributedPence = contributionAgg._sum.amount ?? 0;
    const preAuditMet = auditStatus.linkStatus === AuditLinkStatus.AVAILABLE;
    const effective = await this.capabilities.resolve(business.ownerId);

    // Admin-assigned templates stay visible but locked for businesses that were
    // not picked, with an explicit "Assigned by an Admin" requirement — the
    // same rule the claim endpoint enforces.
    return templates.map((tpl) => {
      const access = this.eligibility.evaluate({
        business,
        template: tpl,
        contributedPence,
        preAuditMet,
      });

      const requiredFeature = tpl.isPremium
        ? tpl.requiredFeature ?? FEATURES.TEMPLATES_PREMIUM
        : tpl.requiredFeature ?? null;
      const featureUnlocked =
        !requiredFeature || Boolean(effective.capabilities[requiredFeature]?.enabled);
      const requirements = featureUnlocked
        ? access.requirements
        : [
            ...access.requirements,
            {
              id: "plan_feature",
              label: "Plan upgrade required",
              hint: "This is a premium template. Upgrade your membership or activate an access pass to unlock it.",
              met: false,
              action: "plan" as const,
            },
          ];

      return {
        id: tpl.id,
        name: tpl.name,
        tagline: tpl.tagline,
        season: tpl.seasonId ?? "Current Season",
        origin: tpl.origin.toLowerCase(),
        approval: tpl.approvalMode.toLowerCase(),
        status:
          access.allMet && featureUnlocked ? "available" : "locked",
        accessType: access.accessType,
        contributionRequirement: {
          required: access.contributionRequiredPence > 0,
          amount: access.contributionRequiredPence,
        },
        // Shown as an informational note: the donation is collected during
        // setup and never prevents the business from claiming the template.
        requiredCampaign: this.eligibility.requiredCampaign(tpl),
        requirements,
        selfFunding: {
          enabled: tpl.selfFundingEnabled,
          mode: tpl.selfFundingMode,
          amount: tpl.selfFundingAmount,
          rewardName: tpl.selfFundingRewardName,
        },
        businessRewardsMode: normalizeBusinessRewardsMode(tpl.businessRewardsMode),
        audience: tpl.audience,
        fields: this.fieldBlueprints(tpl.fieldsConfig, { business, template: tpl }),
        rewards: (tpl.rewardsConfig as any[]) || [],
        mcomAssets: (tpl.mcomAssetsConfig as any[]) || [],
        premium: tpl.isPremium,
        requiredFeature,
        featureUnlocked,
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

    // Plan gates: campaign creation, a free slot, and premium templates.
    await this.capabilities.assertFeature(
      business.ownerId,
      FEATURES.CAMPAIGN_CREATION,
    );
    const [claimedCampaigns, runningCampaigns, premiumCampaigns] =
      await Promise.all([
        this.prisma.businessCampaign.count({ where: { businessId } }),
        this.prisma.businessCampaign.count({
          where: {
            businessId,
            status: {
              in: [
                BusinessCampaignStatus.APPROVED,
                BusinessCampaignStatus.ACTIVE,
                BusinessCampaignStatus.PENDING_REVIEW,
                BusinessCampaignStatus.CHANGES_REQUESTED,
              ],
            },
          },
        }),
        this.prisma.businessCampaign.count({
          where: { businessId, template: { isPremium: true } },
        }),
      ]);

    await this.capabilities.assertWithinLimit(
      business.ownerId,
      FEATURES.CAMPAIGN_CLAIM_LIMIT,
      claimedCampaigns,
      "campaign claim",
    );

    if (template.isPremium) {
      const premiumKey =
        template.requiredFeature ?? FEATURES.TEMPLATES_PREMIUM;
      await this.capabilities.assertFeature(business.ownerId, premiumKey);
      await this.capabilities.assertWithinLimit(
        business.ownerId,
        premiumKey,
        premiumCampaigns,
        "premium template",
      );
    } else if (template.requiredFeature) {
      await this.capabilities.assertFeature(
        business.ownerId,
        template.requiredFeature,
      );
    }

    await this.capabilities.assertWithinLimit(
      business.ownerId,
      FEATURES.CAMPAIGN_ACTIVE_SLOTS,
      runningCampaigns,
      "active campaign",
    );

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

      // The business's registered HubLocation is the campaign's primary
      // location until an admin explicitly assigns a different one.
      if (business.locationId) {
        await tx.campaignLocation.create({
          data: {
            campaignId: campaign.id,
            locationId: business.locationId,
            scope: CampaignLocationScope.PRIMARY,
          },
        });
      }

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
        templateName: c.template?.name ?? c.title,
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
   * Permanently delete a campaign that the business has not submitted. Only
   * DRAFT campaigns with no contributions or issued rewards may be removed.
   */
  async deleteDraftCampaign(
    businessId: string,
    campaignId: string,
  ): Promise<{ success: true; deletedId: string }> {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      select: {
        id: true,
        status: true,
        _count: { select: { contributions: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }
    if (campaign.status !== BusinessCampaignStatus.DRAFT) {
      throw new BadRequestException(
        "Only draft campaigns can be deleted. Submitted campaigns must be archived or cancelled instead.",
      );
    }
    if (campaign._count.contributions > 0) {
      throw new BadRequestException(
        "This draft has contributions and cannot be deleted.",
      );
    }

    const issuedRewards = await this.prisma.rewardIssuance.count({
      where: { campaignId },
    });
    if (issuedRewards > 0) {
      throw new BadRequestException(
        "This draft has issued rewards and cannot be deleted.",
      );
    }

    await this.prisma.businessCampaign.delete({ where: { id: campaignId } });
    return { success: true, deletedId: campaignId };
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

    // Business campaigns are always template instances. Platform campaigns
    // (created by admins) are only reachable through the admin API.
    if (!campaign.template) {
      throw new NotFoundException("Campaign template not found");
    }

    // The attached-campaign donation is required during setup (not to claim the
    // template), so expose the requirement plus the owner's completed total.
    const business = campaign.businessId
      ? await this.prisma.business.findUnique({
          where: { id: campaign.businessId },
        })
      : null;

    const required = this.eligibility.requiredCampaign(campaign.template);
    let requiredCampaign: {
      campaignId: string;
      title: string;
      minPence: number;
      donatedPence: number;
      met: boolean;
    } | null = null;
    if (required) {
      const donations = business
        ? await this.donationPenceByCampaign(business.ownerId, [
            required.campaignId,
          ])
        : new Map<string, number>();
      const donatedPence = donations.get(required.campaignId) ?? 0;
      requiredCampaign = {
        ...required,
        donatedPence,
        met: this.eligibility.campaignDonationMet(
          campaign.template,
          donatedPence,
        ),
      };
    }

    const answerMap = new Map(
      campaign.answers.map((a) => [a.fieldId, a.value] as const),
    );

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
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      settings: campaign.settings ?? {},
      requiredCampaign,
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
        audience: campaign.audience ?? campaign.template.audience,
        fields: this.fieldBlueprints(campaign.template.fieldsConfig, {
          answers: answerMap,
          campaign,
          business,
          template: campaign.template,
        }),
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

    // Media/document answers are either our own upload paths or remote links —
    // reject javascript:/data:/file: and private-network URLs before storing.
    for (const answer of dto.answers) {
      if (answer.fieldId !== "f_media" && answer.fieldId !== "f_docs") continue;
      const value = String(answer.value ?? "").trim();
      if (value) this.media.assertShallowSafeValue(value);
    }

    // Atomically upsert answers. The funding target is a first-class campaign
    // column, so an edited `f_target` updates it in the same transaction
    // instead of leaving the answer stranded as text.
    const targetAnswer = dto.answers.find((a) => a.fieldId === "f_target");
    const targetPounds = targetAnswer
      ? Number(String(targetAnswer.value).replace(/[£,\s]/g, ""))
      : NaN;

    const operations: any[] = dto.answers.map((ans) =>
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
    );

    if (Number.isFinite(targetPounds) && targetPounds > 0) {
      operations.push(
        this.prisma.businessCampaign.update({
          where: { id: campaignId },
          data: { targetAmount: Math.round(targetPounds * 100) },
        }),
      );
    }

    await this.prisma.$transaction(operations);
  }

  /**
   * Updates campaign-level presentation settings (FAQs, terms, etc.).
   */
  async saveSettings(
    businessId: string,
    campaignId: string,
    dto: UpdateCampaignSettingsDto,
  ) {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    return this.prisma.businessCampaign.update({
      where: { id: campaignId },
      data: { settings: dto.settings as Prisma.InputJsonValue },
      select: { id: true, settings: true },
    });
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

    if (!campaign.template) {
      throw new ForbiddenException(
        "This campaign is not managed through the business campaign workflow.",
      );
    }

    const owner = campaign.businessId
      ? await this.prisma.business.findUnique({
          where: { id: campaign.businessId },
          select: { ownerId: true },
        })
      : null;
    if (owner) {
      const runningCampaigns = await this.prisma.businessCampaign.count({
        where: {
          businessId,
          id: { not: campaignId },
          status: {
            in: [
              BusinessCampaignStatus.APPROVED,
              BusinessCampaignStatus.ACTIVE,
              BusinessCampaignStatus.PENDING_REVIEW,
              BusinessCampaignStatus.CHANGES_REQUESTED,
            ],
          },
        },
      });
      await this.capabilities.assertWithinLimit(
        owner.ownerId,
        FEATURES.CAMPAIGN_ACTIVE_SLOTS,
        runningCampaigns,
        "active campaign",
      );
      if (campaign.template.isPremium || campaign.template.requiredFeature) {
        await this.capabilities.assertFeature(
          owner.ownerId,
          campaign.template.requiredFeature ?? FEATURES.TEMPLATES_PREMIUM,
        );
      }
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

    // Self-funding (Step 14): when the template marks seed funding as
    // required, the business must have paid it into this campaign before the
    // campaign can be submitted. Optional / not-allowed modes never block.
    if (
      !this.eligibility.selfFundingMet(
        campaign.template,
        campaign.businessContribution,
      )
    ) {
      const requiredPence = this.eligibility.requiredSelfFundingPence(
        campaign.template,
      );
      const amountLabel =
        requiredPence > 0
          ? ` of ${new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
              maximumFractionDigits: requiredPence % 100 === 0 ? 0 : 2,
            }).format(requiredPence / 100)}`
          : "";
      throw new BadRequestException(
        `This template requires seed funding${amountLabel} into your own campaign before it can be submitted.`,
      );
    }

    // An attached campaign donation is collected during setup and must be
    // complete before the campaign can be submitted for review.
    const requiredCampaign = this.eligibility.requiredCampaign(
      campaign.template,
    );
    if (requiredCampaign) {
      const business = campaign.businessId
        ? await this.prisma.business.findUnique({
            where: { id: campaign.businessId },
            select: { ownerId: true },
          })
        : null;
      const donations = business
        ? await this.donationPenceByCampaign(business.ownerId, [
            requiredCampaign.campaignId,
          ])
        : new Map<string, number>();
      const donatedPence =
        donations.get(requiredCampaign.campaignId) ?? 0;
      if (
        !this.eligibility.campaignDonationMet(
          campaign.template,
          donatedPence,
        )
      ) {
        const amount =
          requiredCampaign.minPence > 0
            ? ` of at least £${(
                requiredCampaign.minPence / 100
              ).toFixed(requiredCampaign.minPence % 100 === 0 ? 0 : 2)}`
            : "";
        throw new BadRequestException(
          `A donation${amount} to "${requiredCampaign.title}" is required before this campaign can be submitted.`,
        );
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
