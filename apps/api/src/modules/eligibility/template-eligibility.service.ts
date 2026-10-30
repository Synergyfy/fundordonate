import { Injectable } from "@nestjs/common";
import {
  BusinessStatus,
  MembershipTier,
  type Prisma,
} from "@prisma/client";

/** The template's `config.access` block, as authored in the wizard. */
export interface TemplateAccessConfig {
  type?: string;
  eligibility?: string[];
  minContribution?: string | number;
  /**
   * Whether an admin may override assignment eligibility for this template
   * (used by admin bulk-instantiation). Defaults to `false` (hard-enforce).
   */
  allowAssignmentOverride?: boolean;
  /** Legacy alias for `allowAssignmentOverride`. */
  allowOverride?: boolean;
  /**
   * An existing campaign the claiming business must donate to **during setup**
   * (before the campaign can be submitted). This never locks the template.
   */
  requiredCampaignId?: string | null;
  /** Display name captured when the admin attached the campaign. */
  requiredCampaignTitle?: string | null;
  /** Minimum completed donation (pence). `0` means any donation. */
  requiredCampaignMinPence?: number;
  /**
   * Businesses explicitly granted access when the template uses the
   * `admin_assigned` rule. The admin picks these in the template wizard.
   */
  assignedBusinessIds?: string[];
  /** Display snapshot of the assigned businesses (name + email). */
  assignedBusinesses?: { id: string; name: string; email: string }[];
}

/** The attached-campaign donation the business must make during setup. */
export interface RequiredCampaignContribution {
  campaignId: string;
  title: string;
  /** Minimum completed donation (pence). `0` means any donation. */
  minPence: number;
}

/** A single eligibility check shown to the business / reported to the admin. */
export interface TemplateRequirementCheck {
  id: string;
  label: string;
  hint: string;
  met: boolean;
  /**
   * Which surface the business must action to satisfy the requirement — lets
   * the UI render the right call-to-action (e.g. the 247GBS Audit deep link).
   */
  action?: "audit" | "membership" | "contribution" | "account" | "donation" | "plan" | null;
  /** The campaign to donate to when `action` is `donation`. */
  campaignId?: string;
  /** Minimum donation (pence) for the campaign requirement. */
  minDonationPence?: number;
}

export interface EligibilityResult {
  requirements: TemplateRequirementCheck[];
  allMet: boolean;
  accessType: string;
  contributionRequiredPence: number;
}

/** The business fields the evaluator reads (a Prisma `Business` satisfies this). */
export interface EligibilityBusinessInput {
  id: string;
  status: BusinessStatus;
  membershipTier: MembershipTier;
  membershipExpiry: Date | null;
}

/** The template fields the evaluator reads (a Prisma `CampaignTemplate` satisfies this). */
export interface EligibilityTemplateInput {
  config: Prisma.JsonValue | null;
  minEligibilityTier: MembershipTier;
  minContributionAmount: number;
  /** Self-funding capability declared in the template wizard (Step 14). */
  selfFundingEnabled?: boolean;
  selfFundingMode?: string | null;
  /** Seed amount in pence. `0` means "any contribution" when required. */
  selfFundingAmount?: number;
}

export interface EvaluateEligibilityInput {
  business: EligibilityBusinessInput;
  template: EligibilityTemplateInput;
  /** Total raised by the business's own campaigns through FundOrDonate (pence). */
  contributedPence: number;
  /** Whether 247GBS Audit reports a consenting completed pre-audit. */
  preAuditMet: boolean;
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

/**
 * The single source of truth for template eligibility — used by the business
 * claim flow AND the admin assignment flow so an admin can never push a
 * pre-audit-gated (or otherwise gated) template past the same rules a business
 * is held to. Availability is driven entirely by the template's own
 * `config.access` rules plus the membership-tier gate.
 *
 * Pure and dependency-free: callers load the business, template, contribution
 * total and 247GBS pre-audit state (possibly from the local snapshot) and pass
 * them in. Never talks to the provider itself.
 */
@Injectable()
export class TemplateEligibilityService {
  /** The `config.access` block authored in the template wizard (or `{}`). */
  accessConfig(template: EligibilityTemplateInput): TemplateAccessConfig {
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
  rules(template: EligibilityTemplateInput): string[] {
    const rules = this.accessConfig(template).eligibility;
    return Array.isArray(rules) && rules.length > 0
      ? rules.filter((r): r is string => typeof r === "string")
      : ["business_account"];
  }

  /** Whether the template gates access on a 247GBS Audit pre-audit. */
  requiresPreAudit(template: EligibilityTemplateInput): boolean {
    return this.rules(template).includes("pre_audit");
  }

  /** Whether an admin may override assignment eligibility for this template. */
  allowAssignmentOverride(template: EligibilityTemplateInput): boolean {
    const cfg = this.accessConfig(template);
    // Accept the legacy `allowOverride` alias too.
    return cfg.allowAssignmentOverride === true || cfg.allowOverride === true;
  }

  /**
   * Businesses explicitly granted access when the template uses the
   * `admin_assigned` rule. Empty means nobody can claim it yet.
   */
  assignedBusinessIds(template: EligibilityTemplateInput): string[] {
    if (!this.rules(template).includes("admin_assigned")) return [];
    const ids = this.accessConfig(template).assignedBusinessIds;
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
  }

  /**
   * The campaign a claiming business must donate to during setup, when the
   * template opts into the `required_campaign_donation` rule. This is a
   * setup-time obligation — claiming is never blocked by it.
   */
  requiredCampaignId(template: EligibilityTemplateInput): string | null {
    if (!this.rules(template).includes("required_campaign_donation")) return null;
    const id = this.accessConfig(template).requiredCampaignId;
    return typeof id === "string" && id.trim() ? id.trim() : null;
  }

  /** The attached-campaign requirement, or `null` when none is configured. */
  requiredCampaign(
    template: EligibilityTemplateInput,
  ): RequiredCampaignContribution | null {
    const campaignId = this.requiredCampaignId(template);
    if (!campaignId) return null;
    return {
      campaignId,
      title:
        this.accessConfig(template).requiredCampaignTitle?.trim() ||
        "the attached campaign",
      minPence: this.requiredCampaignMinPence(template),
    };
  }

  /**
   * Whether a completed donation total satisfies the attached-campaign
   * requirement. `0` minimum means any completed donation will do.
   */
  campaignDonationMet(
    template: EligibilityTemplateInput,
    donatedPence: number,
  ): boolean {
    const minPence = this.requiredCampaignMinPence(template);
    return minPence > 0 ? donatedPence >= minPence : donatedPence > 0;
  }

  /** Minimum completed donation (pence) to the attached campaign. `0` = any. */
  requiredCampaignMinPence(template: EligibilityTemplateInput): number {
    const value = Number(this.accessConfig(template).requiredCampaignMinPence ?? 0);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  }

  // ── Self-funding (business funds its own campaign) ──────────────────────

  /** The template's self-funding mode. `not_allowed` also covers a disabled capability. */
  selfFundingMode(
    template: EligibilityTemplateInput,
  ): "not_allowed" | "optional" | "required" {
    if (template.selfFundingEnabled === false) return "not_allowed";
    if (template.selfFundingMode === "not_allowed") return "not_allowed";
    return template.selfFundingMode === "required" ? "required" : "optional";
  }

  /**
   * Seed funding (pence) the business must have paid into its own campaign
   * before the campaign can be submitted. `0` means either "not required" or
   * "any contribution" — check `selfFundingMode` to tell them apart.
   */
  requiredSelfFundingPence(template: EligibilityTemplateInput): number {
    if (this.selfFundingMode(template) !== "required") return 0;
    const amount = Number(template.selfFundingAmount ?? 0);
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  }

  /**
   * Whether the self-funding obligation is satisfied. Optional / not-allowed
   * modes are always satisfied — the obligation only exists when the template
   * marks self-funding as required.
   */
  selfFundingMet(
    template: EligibilityTemplateInput,
    businessContributedPence: number,
  ): boolean {
    if (this.selfFundingMode(template) !== "required") return true;
    const required = this.requiredSelfFundingPence(template);
    return required > 0
      ? businessContributedPence >= required
      : businessContributedPence > 0;
  }

  /** The minimum funds-raised threshold (pence) the min_contribution rule needs. */
  requiredContributionPence(template: EligibilityTemplateInput): number {
    if (template.minContributionAmount > 0) return template.minContributionAmount;
    const pounds = Number(this.accessConfig(template).minContribution ?? 0);
    return Number.isFinite(pounds) && pounds > 0 ? Math.round(pounds * 100) : 0;
  }

  /**
   * Evaluates a template's access rules against a business and returns the
   * ordered requirement checklist, whether every requirement is met, the access
   * model label, and the qualifying contribution.
   */
  evaluate({
    business,
    template,
    contributedPence,
    preAuditMet,
  }: EvaluateEligibilityInput): EligibilityResult {
    const rules = this.rules(template);
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
            action: "account",
          });
          break;
        case "pre_audit":
          requirements.push({
            id: "pre_audit",
            label: "247GBS Audit pre-audit completed",
            hint: preAuditMet
              ? "Your 247GBS Audit pre-audit is linked and shared."
              : "Complete (and share) your free 247GBS Audit pre-audit to unlock this template.",
            met: preAuditMet,
            action: "audit",
          });
          break;
        case "membership_active":
          requirements.push({
            id: "membership_active",
            label: "Active membership",
            hint: "Hold an active FundOrDonate membership tier.",
            met: membershipActive,
            action: "membership",
          });
          break;
        case "package_tier":
          requirements.push({
            id: "package_tier",
            label: "Purchased package tier",
            hint: "Hold the required FundOrDonate package tier.",
            met: membershipActive,
            action: "membership",
          });
          break;
        case "min_contribution": {
          const required = this.requiredContributionPence(template);
          requirements.push({
            id: "min_contribution",
            label: `Minimum funds raised (${gbp(required)})`,
            hint: "Your campaigns must have raised at least this much through FundOrDonate to unlock the template.",
            met: required <= 0 || contributedPence >= required,
            action: "contribution",
          });
          break;
        }
        case "admin_assigned": {
          const assigned = this.assignedBusinessIds(template);
          requirements.push({
            id: "admin_assigned",
            label: "Assigned by an Admin",
            hint: assigned.length
              ? "This template is granted directly by an Admin to specific businesses."
              : "An Admin must assign this template to your business before you can claim it.",
            met: assigned.includes(business.id),
            action: null,
          });
          break;
        }
        case "required_campaign_donation":
          // A setup-time obligation, not an access lock. The business claims
          // the template normally and donates to the attached campaign during
          // the setup wizard; submission is blocked until that donation is
          // complete (enforced in BusinessCampaignService.submitForReview).
          break;
        case "admin_approval":
          // No per-business grant store exists: this is not a template lock.
          // Selecting it means an admin reviews the *campaign* after claiming
          // (reflected by `approvalMode`), so it never blocks the template.
          requirements.push({
            id: "admin_approval",
            label: "Admin approval",
            hint: "An admin reviews your campaign after you claim this template.",
            met: true,
            action: null,
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
      accessType: this.accessConfig(template).type ?? "automatic",
      contributionRequiredPence: rules.includes("min_contribution")
        ? this.requiredContributionPence(template)
        : 0,
    };
  }

  /** The membership-tier gate, or a no-op check when the base tier suffices. */
  private tierRequirement(
    business: EligibilityBusinessInput,
    template: EligibilityTemplateInput,
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
        action: "membership",
      };
    }

    return {
      id: "campaign_eligibility",
      label: `Membership tier (${minTier} or higher)`,
      hint: `Requires ${minTier} membership or higher.`,
      met: businessIndex >= minIndex,
      action: "membership",
    };
  }
}
