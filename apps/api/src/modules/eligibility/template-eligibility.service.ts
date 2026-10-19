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
  action?: "audit" | "membership" | "contribution" | "account" | null;
}

export interface EligibilityResult {
  requirements: TemplateRequirementCheck[];
  allMet: boolean;
  accessType: string;
  contributionRequiredPence: number;
}

/** The business fields the evaluator reads (a Prisma `Business` satisfies this). */
export interface EligibilityBusinessInput {
  status: BusinessStatus;
  membershipTier: MembershipTier;
  membershipExpiry: Date | null;
}

/** The template fields the evaluator reads (a Prisma `CampaignTemplate` satisfies this). */
export interface EligibilityTemplateInput {
  config: Prisma.JsonValue | null;
  minEligibilityTier: MembershipTier;
  minContributionAmount: number;
}

export interface EvaluateEligibilityInput {
  business: EligibilityBusinessInput;
  template: EligibilityTemplateInput;
  /** Total the business has contributed to the platform (pence). */
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

  /** The minimum platform contribution (pence) the min_contribution rule needs. */
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
            label: `Minimum platform contribution (${gbp(required)})`,
            hint: "Contribute at least this amount to the platform to unlock the template.",
            met: required <= 0 || contributedPence >= required,
            action: "contribution",
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
