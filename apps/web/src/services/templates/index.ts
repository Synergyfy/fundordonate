// =============================================================================
// Campaign Templates Service
// Adapts between the admin template wizard's view model (MasterTemplate) and
// the live adminApi backend. No local/mock persistence.
// =============================================================================

import type {
  AdminCampaignTemplate,
  CreateCampaignTemplatePayload,
  TemplateInstance,
} from "@/services/admin";

export type TemplateLifecycle = "draft" | "active" | "inactive" | "archived";
export type TemplateCampaignType = "donation" | "crowdfunding" | "fund";

export interface TemplateSection {
  id: string;
  label: string;
  hint: string;
  source: "admin" | "business";
  enabled: boolean;
  required: boolean;
}

export type TemplateLocationLevel =
  | "national"
  | "city"
  | "local_area"
  | "high_street"
  | "business";

export interface TemplateStructureConfig {
  funding: {
    targetRequired: boolean;
    methods: string[];
    minContributionEnabled: boolean;
    minContribution: string;
    duration: "30" | "60" | "90" | "custom";
    customDays: string;
    rules: string[];
    payments: string[];
  };
  location: {
    required: boolean;
    levels: TemplateLocationLevel[];
    allowMultiple: boolean;
  };
  visibility: {
    marketplace: boolean;
    hub: boolean;
    search: boolean;
    adminReview: boolean;
    presentation: "image" | "video" | "story";
  };
  seasonId: string;
}

export interface TemplateStructure {
  mode: string;
  layout: string;
  sections: TemplateSection[];
  config: TemplateStructureConfig;
}

export type TemplateFieldSource =
  | "template"
  | "business_account"
  | "business_mcom"
  | "audit_business"
  | "admin"
  | "admin_mcom";

export type TemplateFieldAccess = "no" | "configurable" | "conditional";

export interface TemplateFieldRow {
  id: string;
  field: string;
  source: TemplateFieldSource;
  access: TemplateFieldAccess;
}

export type TemplateAccessTypeId =
  | "automatic"
  | "audit"
  | "contribution"
  | "membership"
  | "admin_assigned"
  | "combination";

export interface TemplateAccessRules {
  type: TemplateAccessTypeId;
  eligibility: string[];
  minContributionEnabled: boolean;
  minContribution: string;
  accessAsReward: boolean;
  accessRewardThreshold: string;
  adminApproval: boolean;
}

export interface ContributionRules {
  mode: "not_allowed" | "optional" | "required";
  amountType: "fixed" | "minimum" | "from_audit" | "admin_rule";
  fixedAmount: string;
  minAmount: string;
  auditRequirement: string;
  auditPercent: string;
  adminRule: string;
  rewardForOwnContribution: boolean;
  countsTowardTarget: boolean;
  showDisclosure: boolean;
  maxSelfContribution: string;
}

export interface MasterTemplate {
  id: string;
  name: string;
  tagline: string;
  season: string;
  audience: "business" | "consumer" | "both";
  accessType: string;
  origin: "audit" | "direct";
  requirements: Array<{ id: string; label: string; hint: string; met: boolean }>;
  approval: "admin_review" | "automatic";
  contributionRequirement: { required: boolean; amount: number };
  purpose: string;
  campaignType: TemplateCampaignType;
  lifecycle: TemplateLifecycle;
  owner: "admin";
  masterTemplate: true;
  campaignsUsing: number;
  createdAt: string;
  updatedAt: string;
  structure: TemplateStructure;
  dataSources: string[];
  accessRules: TemplateAccessRules;
  accessConditions: string[];
  fieldRows: TemplateFieldRow[];
  contributionRules: ContributionRules;
  rewards: any[];
  mcomAssets: any[];
}

export interface TemplateSaveInput {
  name: string;
  purpose: string;
  campaignType: TemplateCampaignType;
  audience: "business" | "consumer" | "both";
  seasonId: string;
  seasonLabel: string;
  sections: TemplateSection[];
  funding: TemplateStructureConfig["funding"];
  location: TemplateStructureConfig["location"];
  visibility: TemplateStructureConfig["visibility"];
  access: TemplateAccessRules;
  accessTypeName: string;
  fieldRows: TemplateFieldRow[];
  selfFundingRules: ContributionRules;
  rewards: any[];
  mcomAssets: any[];
  campaignTypeName: string;
  lifecycle: TemplateLifecycle;
}

// ---------------------------------------------------------------------------
// Lifecycle <-> status mapping
// ---------------------------------------------------------------------------

export type TemplateStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export function lifecycleToStatus(lifecycle: TemplateLifecycle): TemplateStatus {
  switch (lifecycle) {
    case "active":
      return "ACTIVE";
    case "inactive":
      return "INACTIVE";
    case "archived":
      return "ARCHIVED";
    default:
      return "DRAFT";
  }
}

export function statusToLifecycle(status?: string | null): TemplateLifecycle {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "INACTIVE":
      return "inactive";
    case "ARCHIVED":
      return "archived";
    default:
      return "draft";
  }
}

// ---------------------------------------------------------------------------
// Defaults (used when a persisted template has no stored config yet)
// ---------------------------------------------------------------------------

const DEFAULT_FUNDING: TemplateStructureConfig["funding"] = {
  targetRequired: true,
  methods: ["one_off"],
  minContributionEnabled: false,
  minContribution: "10",
  duration: "60",
  customDays: "",
  rules: ["partial_allowed", "public_progress"],
  payments: ["card_payments", "verified_payouts", "receipt_issue"],
};

const DEFAULT_LOCATION: TemplateStructureConfig["location"] = {
  required: true,
  levels: ["city", "local_area", "high_street"],
  allowMultiple: false,
};

const DEFAULT_VISIBILITY: TemplateStructureConfig["visibility"] = {
  marketplace: true,
  hub: true,
  search: true,
  adminReview: true,
  presentation: "image",
};

const DEFAULT_ACCESS: TemplateAccessRules = {
  type: "automatic",
  eligibility: ["business_account"],
  minContributionEnabled: true,
  minContribution: "100",
  accessAsReward: false,
  accessRewardThreshold: "100",
  adminApproval: false,
};

const DEFAULT_CONTRIBUTION: ContributionRules = {
  mode: "optional",
  amountType: "from_audit",
  fixedAmount: "100",
  minAmount: "50",
  auditRequirement: "2000",
  auditPercent: "5",
  adminRule: "",
  rewardForOwnContribution: true,
  countsTowardTarget: true,
  showDisclosure: true,
  maxSelfContribution: "",
};

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function deriveEligibilityTier(eligibility: string[]): string {
  const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];
  for (const tier of tiers) {
    if (eligibility.some((e) => e.toLowerCase().includes(tier.toLowerCase()))) {
      return tier;
    }
  }
  return "BRONZE";
}

/**
 * Maps the wizard's view model to the create/update template API payload.
 */
export function buildTemplatePayload(input: TemplateSaveInput): CreateCampaignTemplatePayload {
  return {
    name: input.name,
    tagline: input.purpose,
    seasonId: input.seasonId && input.seasonId !== "none" ? input.seasonId : undefined,
    origin: "DIRECT",
    approvalMode:
      input.visibility.adminReview || input.access.adminApproval
        ? "ADMIN_REVIEW"
        : "AUTOMATIC",
    status: lifecycleToStatus(input.lifecycle),
    category: input.campaignType,
    audience: input.audience.toUpperCase(),
    minEligibilityTier: deriveEligibilityTier(input.access.eligibility),
    minContributionRequired: input.access.minContributionEnabled,
    minContributionAmount: Math.round(Number(input.access.minContribution || 0) * 100),
    selfFundingEnabled: input.selfFundingRules.mode !== "not_allowed",
    selfFundingMode: input.selfFundingRules.mode,
    selfFundingAmount: Math.round(Number(input.selfFundingRules.fixedAmount || 0) * 100),
    fieldsConfig: input.fieldRows,
    rewardsConfig: input.rewards,
    mcomAssetsConfig: input.mcomAssets,
    requirementsConfig: [],
    config: {
      sections: input.sections,
      funding: input.funding,
      location: input.location,
      visibility: input.visibility,
      access: input.access,
      contributionRules: input.selfFundingRules,
      accessTypeName: input.accessTypeName,
      seasonLabel: input.seasonLabel,
      campaignTypeName: input.campaignTypeName,
      lifecycle: input.lifecycle,
    },
  };
}

export function normalizeFieldRows(fields?: any[]): TemplateFieldRow[] {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return [
      { id: "f_title", field: "Campaign title", source: "template", access: "no" },
      { id: "f_desc", field: "Campaign description", source: "template", access: "no" },
      { id: "f_design", field: "Campaign design / hero", source: "admin_mcom", access: "no" },
      { id: "f_target", field: "Funding target", source: "template", access: "configurable" },
      { id: "f_period", field: "Campaign period", source: "template", access: "conditional" },
      { id: "f_media", field: "Images & video", source: "business_mcom", access: "configurable" },
      { id: "f_location", field: "Location details", source: "business_account", access: "conditional" },
      { id: "f_contact", field: "Contact information", source: "business_account", access: "configurable" },
      { id: "f_rewards", field: "Reward selection", source: "template", access: "conditional" },
      { id: "f_payout", field: "Payout / bank details", source: "audit_business", access: "no" },
      { id: "f_disclosure", field: "Self-funding disclosure", source: "admin", access: "no" },
      { id: "f_docs", field: "Supporting documents", source: "audit_business", access: "configurable" },
    ];
  }

  return fields.map((r, idx) => {
    const field = r.field || r.label || r.name || r.question || `Field ${idx + 1}`;

    let source: TemplateFieldSource = "template";
    const rawSource = String(r.source || "").toLowerCase().trim();
    if (rawSource === "business_input" || rawSource === "business" || rawSource === "business_account") {
      source = "business_account";
    } else if (rawSource === "business_mcom") {
      source = "business_mcom";
    } else if (rawSource === "audit_business" || rawSource === "audit") {
      source = "audit_business";
    } else if (rawSource === "admin") {
      source = "admin";
    } else if (rawSource === "admin_mcom") {
      source = "admin_mcom";
    } else if (rawSource === "location") {
      source = "business_account";
    } else {
      source = "template";
    }

    let access: TemplateFieldAccess = "no";
    if (r.access === "no" || r.access === "configurable" || r.access === "conditional") {
      access = r.access;
    } else if (r.editable === true || r.configurable === true) {
      access = "configurable";
    } else if (r.conditional === true) {
      access = "conditional";
    } else {
      access = "no";
    }

    return {
      id: r.id || `field_${idx}`,
      field,
      source,
      access,
    };
  });
}

/**
 * Rehydrates a persisted admin template into the wizard's view model.
 */
export function adaptAdminTemplateToMaster(tpl: AdminCampaignTemplate): MasterTemplate {
  const config = (tpl.config ?? {}) as Record<string, any>;
  const accessRules: TemplateAccessRules = config.access ?? DEFAULT_ACCESS;

  return {
    id: tpl.id,
    name: tpl.name,
    tagline: tpl.tagline,
    season: config.seasonLabel ?? tpl.season?.name ?? "No season / evergreen",
    audience: (tpl.audience?.toLowerCase() ?? "both") as MasterTemplate["audience"],
    accessType: config.accessTypeName ?? accessRules.type ?? "automatic",
    origin: tpl.origin === "AUDIT" ? "audit" : "direct",
    requirements: tpl.requirementsConfig ?? [],
    approval: tpl.approvalMode === "AUTOMATIC" ? "automatic" : "admin_review",
    contributionRequirement: {
      required: tpl.minContributionRequired,
      amount: tpl.minContributionAmount,
    },
    purpose: tpl.tagline,
    campaignType: ((tpl.category ?? "fund") as TemplateCampaignType),
    lifecycle: statusToLifecycle(tpl.status),
    owner: "admin",
    masterTemplate: true,
    campaignsUsing: tpl.instantiatedCount ?? 0,
    createdAt: tpl.createdAt,
    updatedAt: tpl.updatedAt,
    structure: {
      mode: "custom",
      layout: "standard",
      sections: config.sections ?? [],
      config: {
        funding: config.funding ?? DEFAULT_FUNDING,
        location: config.location ?? DEFAULT_LOCATION,
        visibility: config.visibility ?? DEFAULT_VISIBILITY,
        seasonId: tpl.seasonId ?? "none",
      },
    },
    dataSources: [],
    accessRules,
    accessConditions: [],
    fieldRows: normalizeFieldRows(tpl.fieldsConfig),
    contributionRules: config.contributionRules ?? DEFAULT_CONTRIBUTION,
    rewards: tpl.rewardsConfig ?? [],
    mcomAssets: tpl.mcomAssetsConfig ?? [],
  };
}

export type { TemplateInstance };
