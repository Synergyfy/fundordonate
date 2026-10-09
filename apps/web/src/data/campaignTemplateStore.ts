// =============================================================================
// Campaign Template Store — Admin-owned master templates (frontend only)
// Single source of truth for the "Campaign templates & business access" spec:
//   - MasterTemplate = Admin-owned template with the 8 configuration areas
//     (campaign structure, data sources, business-editable fields, rewards,
//     MCOM assets, access rules, contribution rules, approval rules).
//   - Business Campaign Centre views (Available / Locked / My Campaigns) are
//     hydrated from these masters + the business eligibility profile.
//   - Claim = permission to use a template (never ownership). Claiming creates
//     a campaign instance which is submitted through the Admin review process
//     (an Admin campaign is created so Admin decisions flow back to the
//     business).
// Dependency direction: this store → businessCampaignAccess / adminCampaigns /
// templateRewardLibrary. businessCampaignAccess must NOT import this store.
// =============================================================================

import {
  AUDIT_ANSWERS,
  BUSINESS_IDENTITY,
  BUSINESS_TEMPLATES,
  MY_CAMPAIGNS,
  type BusinessTemplate,
  type CampaignStatus,
  type MyCampaign,
  type RequestedChange,
  type RequirementId,
  type SelfFundingConfig,
  type SetupField,
  type SetupFieldSource,
  type TemplateAsset,
  type TemplateReward,
} from "./businessCampaignAccess";
import {
  addAdminCampaign,
  getAdminCampaignById,
  getAdminCampaigns,
  updateAdminCampaignStatus,
  type AdminCampaignSeed,
  type AdminCampaignStatus,
} from "./adminCampaigns";
import {
  LIBRARY_REWARDS,
  REWARD_CATEGORY_META,
  type LibraryReward,
} from "./templateRewardLibrary";

// ---------------------------------------------------------------------------
// Types — the 8 template configuration areas
// ---------------------------------------------------------------------------

export type TemplateLifecycle = "draft" | "active" | "inactive" | "archived";
export type TemplateCampaignType = "donation" | "crowdfunding" | "fund";

/** Area 1 — predefined campaign structure sections. */
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

/** Area 1 — general campaign configuration. */
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

/** Area 3 — field access rows (wizard-native, mapped to business SetupFields). */
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

/** Area 6 — access rules (wizard Area 2). */
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

/** Area 7 — contribution / self-funding rules (wizard Area 5). */
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

/**
 * Canonical Admin-owned master template. Extends the business-facing
 * BusinessTemplate so it can be previewed / hydrated directly.
 */
export interface MasterTemplate extends BusinessTemplate {
  purpose: string;
  campaignType: TemplateCampaignType;
  lifecycle: TemplateLifecycle;
  owner: "admin";
  masterTemplate: true;
  campaignsUsing: number;
  createdAt: string;
  updatedAt: string;
  structure: TemplateStructure;
  /** Area 2 — which source systems feed this template. */
  dataSources: SetupFieldSource[];
  accessRules: TemplateAccessRules;
  /** Conditions every business must meet before claiming. */
  accessConditions: RequirementId[];
  fieldRows: TemplateFieldRow[];
  contributionRules: ContributionRules;
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
  rewards: TemplateReward[];
  mcomAssets: TemplateAsset[];
  campaignTypeName: string;
  lifecycle: TemplateLifecycle;
}

export type ClaimResult =
  | { ok: true; campaignId: string; reused: boolean }
  | { ok: false; reason: string };

// ---------------------------------------------------------------------------
// Business eligibility profile (mutable demo state)
// ---------------------------------------------------------------------------

const profile: Record<RequirementId, boolean> = {
  business_account: true,
  pre_audit: true,
  min_contribution: false,
  campaign_eligibility: false,
};

const REQ_META: Record<RequirementId, { label: string; hint: string }> = {
  business_account: {
    label: "Business Account",
    hint: "Verified FundOrDonate business account",
  },
  pre_audit: {
    label: "Public Pre-Audit",
    hint: "Completed public pre-audit on file",
  },
  min_contribution: {
    label: "Required Contribution",
    hint: "One £100 platform contribution to unlock",
  },
  campaign_eligibility: {
    label: "Campaign Eligibility",
    hint: "Confirmed during your eligibility check",
  },
};

const requirementMet = (id: RequirementId) => profile[id];

/**
 * Mark a requirement as satisfied for this business. Completing the required
 * contribution automatically completes the eligibility review that follows it.
 */
export function completeRequirement(id: RequirementId): void {
  profile[id] = true;
  if (id === "min_contribution") profile.campaign_eligibility = true;
}

function hydratedRequirements(conditions: RequirementId[]) {
  return conditions.map((id) => ({
    id,
    label: REQ_META[id].label,
    hint: REQ_META[id].hint,
    met: requirementMet(id),
  }));
}

// ---------------------------------------------------------------------------
// Mapping helpers — wizard rows ⇄ business fields, eligibility ⇄ conditions
// ---------------------------------------------------------------------------

const SETUP_SOURCE_BY_ROW: Record<TemplateFieldSource, SetupFieldSource> = {
  template: "template",
  business_account: "business_account",
  business_mcom: "mcom",
  audit_business: "audit",
  admin: "admin",
  admin_mcom: "mcom",
};

const SOURCE_NOTE_BY_SETUP: Record<SetupFieldSource, string> = {
  admin: "Locked by Admin template",
  template: "Template design",
  audit: "Source: Public Pre-Audit",
  business_account: "From your business account",
  location: "From your business location",
  mcom: "MCOM asset",
  business_input: "Admin-configured question",
};

function inputTypeFor(rowId: string): SetupField["inputType"] {
  if (rowId === "f_target") return "number";
  if (rowId === "f_period") return "date";
  if (rowId === "f_docs" || rowId === "f_disclosure") return "textarea";
  return "text";
}

/** Area 3 → business-facing fields (what the setup wizard renders). */
function rowsToFields(rows: TemplateFieldRow[]): SetupField[] {
  return rows.map((r) => {
    const locked = r.access === "no";
    const editable = !locked;
    const origin = SETUP_SOURCE_BY_ROW[r.source];
    const source: SetupFieldSource =
      locked
        ? origin
        : origin === "business_account" || origin === "mcom"
        ? origin
        : "business_input";
    return {
      id: r.id,
      label: r.field,
      question: editable
        ? source === "business_input"
          ? `Provide: ${r.field}`
          : `Confirm: ${r.field}`
        : undefined,
      value: "",
      source,
      locked,
      editable,
      required: r.access === "configurable",
      inputType: inputTypeFor(r.id),
      sourceNote: SOURCE_NOTE_BY_SETUP[source],
    } satisfies SetupField;
  });
}

/** Business-facing fields → wizard rows (edit-mode seeding). */
function fieldsToRows(fields: SetupField[]): TemplateFieldRow[] {
  return fields.map((f) => ({
    id: f.id,
    field: f.label,
    source: ((): TemplateFieldSource => {
      switch (f.source) {
        case "audit":
          return "audit_business";
        case "business_account":
        case "location":
          return "business_account";
        case "mcom":
          return "business_mcom";
        case "template":
          return "template";
        case "admin":
        case "business_input":
        default:
          return "admin";
      }
    })(),
    access: ((): TemplateFieldAccess => {
      if (f.locked) return "no";
      return f.required ? "configurable" : "conditional";
    })(),
  }));
}

const WIZARD_RULE_TO_CONDITION: Record<string, RequirementId> = {
  business_account: "business_account",
  pre_audit: "pre_audit",
  min_contribution: "min_contribution",
  membership_active: "campaign_eligibility",
  package_tier: "campaign_eligibility",
  admin_approval: "campaign_eligibility",
};

const CONDITION_TO_WIZARD_RULE: Record<RequirementId, string> = {
  business_account: "business_account",
  pre_audit: "pre_audit",
  min_contribution: "min_contribution",
  campaign_eligibility: "package_tier",
};

function mapEligibilityToConditions(eligibility: string[]): RequirementId[] {
  const mapped = eligibility
    .map((rule) => WIZARD_RULE_TO_CONDITION[rule])
    .filter((c): c is RequirementId => Boolean(c));
  return mapped.length > 0 ? [...new Set(mapped)] : ["business_account"];
}

/** Area 2 — derive the data-source systems a template draws from. */
function deriveDataSources(
  rows: TemplateFieldRow[],
  location: TemplateStructureConfig["location"]
): SetupFieldSource[] {
  const order: SetupFieldSource[] = [
    "audit",
    "business_account",
    "location",
    "admin",
    "template",
    "mcom",
  ];
  const present = new Set<SetupFieldSource>();
  for (const row of rows) present.add(SETUP_SOURCE_BY_ROW[row.source]);
  if (location.required) present.add("location");
  present.add("business_account");
  return order.filter((s) => present.has(s));
}

const CATEGORY_LABEL = (category: LibraryReward["category"]) =>
  REWARD_CATEGORY_META[category].label;

function rewardFromLibrary(
  reward: LibraryReward,
  conditions: { mode: "minimum" | "range" | "exact"; min: string; max: string; exact: string }[]
): TemplateReward {
  const parts = conditions
    .map((c) => {
      if (c.mode === "range" && c.min && c.max) return `£${c.min}–£${c.max} contribution`;
      if (c.mode === "exact" && c.exact) return `£${c.exact} contribution`;
      if (c.mode === "minimum" && c.min) return `£${c.min}+ contribution`;
      return null;
    })
    .filter((p): p is string => Boolean(p));
  return {
    id: reward.id,
    name: reward.name,
    category: CATEGORY_LABEL(reward.category),
    rule: parts.length > 0 ? parts.join(" or ") : "Any contribution",
    source: reward.source,
  };
}

// ---------------------------------------------------------------------------
// Default structure (Areas 1) — shared by seeds and new masters
// ---------------------------------------------------------------------------

const DEFAULT_ADMIN_SECTIONS: TemplateSection[] = [
  { id: "title", label: "Campaign Title", hint: "Admin-controlled. The business never edits the title.", source: "admin", enabled: true, required: true },
  { id: "description", label: "Campaign Description", hint: "Admin-controlled long-form copy shown on the campaign page.", source: "admin", enabled: true, required: true },
  { id: "design", label: "Campaign Design", hint: "Hero image, colours and branding set by Admin.", source: "admin", enabled: true, required: true },
  { id: "funding_section", label: "Funding", hint: "Controlled funding section (rules come from the Funding step).", source: "admin", enabled: true, required: true },
  { id: "purpose", label: "Purpose", hint: "Why the campaign exists — admin-controlled copy.", source: "admin", enabled: true, required: true },
  { id: "rewards_section", label: "Rewards", hint: "Rewards offered — configured on the Rewards area.", source: "admin", enabled: true, required: true },
  { id: "business_info", label: "Business Information", hint: "Business details pulled from the verified business account.", source: "admin", enabled: true, required: true },
  { id: "location_section", label: "Location", hint: "Controlled location section (levels come from the Location step).", source: "admin", enabled: true, required: true },
  { id: "period", label: "Campaign Period", hint: "Campaign start / end dates for this template.", source: "admin", enabled: true, required: true },
];

const DEFAULT_BUSINESS_SECTIONS: TemplateSection[] = [
  { id: "business_name", label: "Business name & trading details", hint: "From the verified business account.", source: "business", enabled: true, required: true },
  { id: "funding_target", label: "Funding target amount", hint: "The business enters its campaign-specific target.", source: "business", enabled: true, required: true },
  { id: "media", label: "Campaign images / video", hint: "Media the business uploads for its campaign.", source: "business", enabled: true, required: true },
  { id: "location_details", label: "Location details", hint: "The actual address / area for this campaign.", source: "business", enabled: true, required: true },
  { id: "contribution_info", label: "Contribution information", hint: "How contributors can give and what they receive.", source: "business", enabled: true, required: true },
  { id: "reward_selection", label: "Reward selection", hint: "Which configured rewards this campaign offers.", source: "business", enabled: false, required: false },
  { id: "supporting", label: "Supporting documents", hint: "Documents, links and supporting evidence.", source: "business", enabled: false, required: false },
  { id: "contact", label: "Campaign contact information", hint: "Contact person for campaign queries.", source: "business", enabled: true, required: true },
  { id: "review", label: "Review / submission", hint: "Final check before the campaign is submitted.", source: "business", enabled: true, required: true },
];

const DEFAULT_FIELD_ROWS: TemplateFieldRow[] = [
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

function defaultSections(): TemplateSection[] {
  return [
    ...DEFAULT_ADMIN_SECTIONS.map((s) => ({ ...s })),
    ...DEFAULT_BUSINESS_SECTIONS.map((s) => ({ ...s })),
  ];
}

function defaultStructureConfig(): TemplateStructureConfig {
  return {
    funding: {
      targetRequired: true,
      methods: ["one_off"],
      minContributionEnabled: false,
      minContribution: "10",
      duration: "60",
      customDays: "",
      rules: ["partial_allowed", "public_progress"],
      payments: ["card_payments", "verified_payouts", "receipt_issue"],
    },
    location: {
      required: true,
      levels: ["city", "local_area", "high_street"],
      allowMultiple: false,
    },
    visibility: {
      marketplace: true,
      hub: true,
      search: true,
      adminReview: true,
      presentation: "image",
    },
    seasonId: "none",
  };
}

function defaultContributionRules(): ContributionRules {
  return {
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
}

function defaultAccessRules(conditions: RequirementId[]): TemplateAccessRules {
  return {
    type: conditions.includes("pre_audit")
      ? "audit"
      : conditions.includes("min_contribution")
      ? "contribution"
      : "automatic",
    eligibility: conditions.map((c) => CONDITION_TO_WIZARD_RULE[c]),
    minContributionEnabled: conditions.includes("min_contribution"),
    minContribution: "100",
    accessAsReward: false,
    accessRewardThreshold: "100",
    adminApproval: false,
  };
}

function accessTypeLabel(conditions: RequirementId[]): string {
  if (conditions.includes("min_contribution")) return "Contribution";
  if (conditions.includes("campaign_eligibility")) return "Membership / Package";
  if (conditions.includes("pre_audit")) return "After Audit";
  if (conditions.includes("business_account")) return "Automatic";
  return "Combination";
}

function selfFundingFromRules(
  rules: ContributionRules,
  rewards: TemplateReward[]
): SelfFundingConfig {
  const amount =
    rules.amountType === "fixed"
      ? Number(rules.fixedAmount || 0)
      : rules.amountType === "minimum"
      ? Number(rules.minAmount || 0)
      : rules.amountType === "from_audit"
      ? Math.round(Number(rules.auditRequirement || 0) * Number(rules.auditPercent || 0) / 100)
      : parseMoney(rules.adminRule);
  return {
    enabled: rules.mode !== "not_allowed",
    mode: rules.mode === "required" ? "required" : "optional",
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    rewardName: rules.rewardForOwnContribution ? rewards[0]?.name ?? null : null,
  };
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function parseMoney(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

const isoToday = () => new Date().toISOString().split("T")[0] ?? "";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "campaign";

function uniqueCampaignSlug(title: string): string {
  const base = slugify(title);
  const existing = new Set(getAdminCampaigns().map((c) => c.slug));
  let slug = base;
  let i = 2;
  while (existing.has(slug)) slug = `${base}-${i++}`;
  return slug;
}

const CAMPAIGN_TYPE_LABELS: Record<TemplateCampaignType, string> = {
  donation: "Donation",
  crowdfunding: "Crowdfunding",
  fund: "Fund",
};

function audienceForBusiness(t: MasterTemplate): boolean {
  return t.audience !== "consumer";
}

// ---------------------------------------------------------------------------
// Seed construction
// ---------------------------------------------------------------------------

interface BusinessSeedMeta {
  purpose: string;
  campaignType: TemplateCampaignType;
  lifecycle: TemplateLifecycle;
  campaignsUsing: number;
  createdAt: string;
  updatedAt: string;
  conditions: RequirementId[];
}

const BUSINESS_SEED_META: Record<string, BusinessSeedMeta> = {
  "tpl-winter": {
    purpose:
      "Prepared from the Public Pre-Audit for winter high street funding campaigns.",
    campaignType: "fund",
    lifecycle: "active",
    campaignsUsing: 12,
    createdAt: "2026-06-10",
    updatedAt: "2026-09-22",
    conditions: ["business_account", "pre_audit"],
  },
  "tpl-autumn": {
    purpose:
      "Autumn growth funding for high street businesses — unlocked with the required platform contribution.",
    campaignType: "fund",
    lifecycle: "active",
    campaignsUsing: 3,
    createdAt: "2026-07-08",
    updatedAt: "2026-09-15",
    conditions: ["business_account", "pre_audit", "min_contribution", "campaign_eligibility"],
  },
  "tpl-spring": {
    purpose: "Community funding template for spring campaigns, prepared from your Public Pre-Audit.",
    campaignType: "donation",
    lifecycle: "active",
    campaignsUsing: 0,
    createdAt: "2026-09-01",
    updatedAt: "2026-09-20",
    conditions: ["business_account", "pre_audit", "campaign_eligibility"],
  },
};

interface AdminSeedMeta {
  id: string;
  name: string;
  purpose: string;
  campaignType: TemplateCampaignType;
  audience: "business" | "consumer" | "both";
  lifecycle: TemplateLifecycle;
  campaignsUsing: number;
  rewardsCount: number;
  createdAt: string;
  updatedAt: string;
  conditions: RequirementId[];
  approval: "automatic" | "admin_review";
}

const ADMIN_SEED_META: AdminSeedMeta[] = [
  {
    id: "t1",
    name: "Local Business Funding Campaign",
    purpose: "For local businesses raising funding through FundOrDonate.",
    campaignType: "fund",
    audience: "business",
    lifecycle: "active",
    campaignsUsing: 12,
    rewardsCount: 4,
    createdAt: "2026-06-14",
    updatedAt: "2026-09-18",
    conditions: ["business_account", "pre_audit"],
    approval: "admin_review",
  },
  {
    id: "t2",
    name: "High Street Crowdfunding Drive",
    purpose: "Crowdfunding structure for high street regeneration projects.",
    campaignType: "crowdfunding",
    audience: "both",
    lifecycle: "active",
    campaignsUsing: 8,
    rewardsCount: 6,
    createdAt: "2026-07-02",
    updatedAt: "2026-09-15",
    conditions: ["business_account", "pre_audit", "min_contribution"],
    approval: "admin_review",
  },
  {
    id: "t3",
    name: "Community Donation Campaign",
    purpose: "Simple donation structure for community-led causes.",
    campaignType: "donation",
    audience: "consumer",
    lifecycle: "active",
    campaignsUsing: 21,
    rewardsCount: 2,
    createdAt: "2026-05-20",
    updatedAt: "2026-09-10",
    conditions: ["business_account"],
    approval: "automatic",
  },
  {
    id: "t4",
    name: "City Partnership Programme",
    purpose: "Partnership structure for city-wide partners and brands.",
    campaignType: "fund",
    audience: "business",
    lifecycle: "draft",
    campaignsUsing: 0,
    rewardsCount: 3,
    createdAt: "2026-09-05",
    updatedAt: "2026-09-16",
    conditions: ["business_account", "pre_audit"],
    approval: "admin_review",
  },
  {
    id: "t5",
    name: "Seasonal Consumer Rewards Campaign",
    purpose: "Donation template with seasonal reward tiers for consumers.",
    campaignType: "donation",
    audience: "consumer",
    lifecycle: "draft",
    campaignsUsing: 0,
    rewardsCount: 5,
    createdAt: "2026-09-12",
    updatedAt: "2026-09-12",
    conditions: ["business_account"],
    approval: "automatic",
  },
  {
    id: "t6",
    name: "Legacy Borough Launch",
    purpose: "Original borough launch structure, superseded by v2.",
    campaignType: "crowdfunding",
    audience: "both",
    lifecycle: "archived",
    campaignsUsing: 4,
    rewardsCount: 1,
    createdAt: "2026-01-15",
    updatedAt: "2026-08-01",
    conditions: ["business_account", "pre_audit"],
    approval: "admin_review",
  },
  {
    id: "t7",
    name: "Membership Access Funding",
    purpose: "Access-gated template paused while eligibility rules are reviewed.",
    campaignType: "fund",
    audience: "business",
    lifecycle: "inactive",
    campaignsUsing: 3,
    rewardsCount: 2,
    createdAt: "2026-04-02",
    updatedAt: "2026-09-20",
    conditions: ["business_account", "pre_audit", "campaign_eligibility"],
    approval: "admin_review",
  },
];

const ACTIVE_LIBRARY = LIBRARY_REWARDS.filter((r) => r.status === "active");

function librarySlice(count: number, offset: number): LibraryReward[] {
  if (ACTIVE_LIBRARY.length === 0 || count <= 0) return [];
  const picked: LibraryReward[] = [];
  for (let i = 0; i < count; i++) {
    const reward = ACTIVE_LIBRARY[(offset + i) % ACTIVE_LIBRARY.length];
    if (reward) picked.push(reward);
  }
  return picked;
}

function masterFromBusinessSeed(
  base: BusinessTemplate,
  meta: BusinessSeedMeta
): MasterTemplate {
  const fieldRows = fieldsToRows(base.fields);
  const config = defaultStructureConfig();
  const accessRules = defaultAccessRules(meta.conditions);
  return {
    ...base,
    requirements: hydratedRequirements(meta.conditions),
    purpose: meta.purpose,
    campaignType: meta.campaignType,
    lifecycle: meta.lifecycle,
    owner: "admin",
    masterTemplate: true,
    campaignsUsing: meta.campaignsUsing,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    structure: {
      mode: CAMPAIGN_TYPE_LABELS[meta.campaignType],
      layout: "Image-first",
      sections: defaultSections(),
      config,
    },
    dataSources: deriveDataSources(fieldRows, config.location),
    accessRules,
    accessConditions: meta.conditions,
    fieldRows,
    contributionRules: {
      ...defaultContributionRules(),
      mode: base.selfFunding.enabled
        ? base.selfFunding.mode === "required"
          ? "required"
          : "optional"
        : "not_allowed",
      amountType: "fixed",
      fixedAmount: String(base.selfFunding.amount || 100),
      rewardForOwnContribution: Boolean(base.selfFunding.rewardName),
    },
    status: "locked",
  };
}

function masterFromAdminSeed(meta: AdminSeedMeta, offset: number): MasterTemplate {
  const fieldRows = DEFAULT_FIELD_ROWS.map((r) => ({ ...r }));
  const config = defaultStructureConfig();
  const accessRules = defaultAccessRules(meta.conditions);
  const rewards = librarySlice(meta.rewardsCount, offset).map((r) =>
    rewardFromLibrary(r, [])
  );
  const mcomAssets = librarySlice(Math.min(meta.rewardsCount, 2), offset + 1)
    .filter((r) => r.source === "mcom")
    .map((r) => ({ id: r.id, name: r.name, type: CATEGORY_LABEL(r.category) }));
  const contributionRequirement = meta.conditions.includes("min_contribution")
    ? { required: true, amount: Number(accessRules.minContribution || 100) }
    : { required: false, amount: 0 };
  return {
    id: meta.id,
    name: meta.name,
    tagline: meta.purpose,
    season: "Autumn 2026",
    audience: meta.audience,
    accessType: accessTypeLabel(meta.conditions),
    origin: meta.conditions.includes("pre_audit") ? "audit" : "direct",
    requirements: hydratedRequirements(meta.conditions),
    approval: meta.approval,
    contributionRequirement,
    selfFunding: {
      enabled: true,
      mode: "optional",
      amount: 100,
      rewardName: rewards[0]?.name ?? null,
    },
    fields: rowsToFields(fieldRows),
    rewards,
    mcomAssets,
    status: "locked",
    purpose: meta.purpose,
    campaignType: meta.campaignType,
    lifecycle: meta.lifecycle,
    owner: "admin",
    masterTemplate: true,
    campaignsUsing: meta.campaignsUsing,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    structure: {
      mode: CAMPAIGN_TYPE_LABELS[meta.campaignType],
      layout: "Image-first",
      sections: defaultSections(),
      config,
    },
    dataSources: deriveDataSources(fieldRows, config.location),
    accessRules,
    accessConditions: meta.conditions,
    fieldRows,
    contributionRules: defaultContributionRules(),
  };
}

// ---------------------------------------------------------------------------
// Store state
// ---------------------------------------------------------------------------

const masters: MasterTemplate[] = [
  ...BUSINESS_TEMPLATES.map((t) => {
    const meta = BUSINESS_SEED_META[t.id];
    if (!meta) throw new Error(`Missing business seed meta for template ${t.id}`);
    return masterFromBusinessSeed(t, meta);
  }),
  ...ADMIN_SEED_META.map((m, i) => masterFromAdminSeed(m, i * 3)),
];

function hydrate(t: MasterTemplate): MasterTemplate {
  const requirements = hydratedRequirements(t.accessConditions);
  const available =
    t.lifecycle === "active" && requirements.every((r) => r.met);
  return { ...t, requirements, status: available ? "available" : "locked" };
}

// ---------------------------------------------------------------------------
// Business campaign instances
// ---------------------------------------------------------------------------

let campaignSeq = 3;

const campaigns: MyCampaign[] = MY_CAMPAIGNS.map((c) => {
  const master = masters.find((t) => t.id === c.templateId);
  return {
    ...c,
    answers: {},
    changes: c.changes.map((ch) => ({ ...ch })),
    programme: master?.season ?? "Autumn 2026",
    locationLabel: `${BUSINESS_IDENTITY.highStreet}, ${BUSINESS_IDENTITY.localArea}, ${BUSINESS_IDENTITY.city}`,
  };
});

function buildAdminSeed(
  c: MyCampaign,
  master: MasterTemplate | undefined,
  status: AdminCampaignStatus
): AdminCampaignSeed {
  const mode: AdminCampaignSeed["mode"] =
    master?.campaignType === "donation" ? "donation" : "fund";
  const description =
    master?.purpose ??
    "Business campaign created from an approved FundOrDonate master template.";
  return {
    id: `ac-${c.id}`,
    slug: uniqueCampaignSlug(c.title),
    title: c.title,
    description,
    shortDescription:
      description.length > 120 ? `${description.slice(0, 117)}...` : description,
    scope: "city",
    citySlug: slugify(BUSINESS_IDENTITY.city),
    areaSlug: slugify(BUSINESS_IDENTITY.localArea),
    streetSlug: slugify(BUSINESS_IDENTITY.highStreet),
    audience: "business",
    status,
    mode,
    raisedAmount: c.raised,
    targetAmount: c.target,
    backers: 0,
    startDate: isoToday(),
    endDate: "2026-12-31",
    season: master?.season ?? "Autumn 2026",
    createdAt: isoToday(),
    category: { name: "Business", slug: "business" },
    author: { firstName: "ABC", lastName: "Business" },
    businessCampaignId: c.id,
  };
}

/** Give seeded in-flight campaigns an Admin counterpart so Admin's Pending
 * Review loop includes them and Admin decisions flow back. */
function linkSeedCampaigns(): void {
  for (const c of campaigns) {
    if (c.adminCampaignId || c.status === "draft") continue;
    const adminStatus: AdminCampaignStatus | undefined =
      c.status === "changes_requested"
        ? "changes_required"
        : c.status === "pending_review"
        ? "pending_review"
        : c.status === "approved"
        ? "approved"
        : c.status === "active"
        ? "active"
        : undefined;
    if (!adminStatus) continue;
    const master = masters.find((t) => t.id === c.templateId);
    const admin = addAdminCampaign(buildAdminSeed(c, master, adminStatus));
    c.adminCampaignId = admin.id;
  }
}

linkSeedCampaigns();

// ---------------------------------------------------------------------------
// Accessors — Admin side
// ---------------------------------------------------------------------------

/** All master templates (copies) for the Admin templates list. */
export function getAdminTemplates(): MasterTemplate[] {
  return masters.map((t) => hydrate(t));
}

export function getAdminTemplateById(id: string): MasterTemplate | undefined {
  const t = masters.find((m) => m.id === id);
  return t ? hydrate(t) : undefined;
}

/** Create or update a master template from wizard state. */
export function saveTemplate(
  input: TemplateSaveInput,
  existingId?: string
): MasterTemplate {
  const existing = existingId
    ? masters.find((m) => m.id === existingId)
    : undefined;
  const conditions = mapEligibilityToConditions(input.access.eligibility);
  const fieldRows = input.fieldRows.map((r) => ({ ...r }));
  const config: TemplateStructureConfig = {
    funding: { ...input.funding },
    location: { ...input.location },
    visibility: { ...input.visibility },
    seasonId: input.seasonId,
  };

  // Preserve legacy business rewards / assets not represented in wizard state
  // (e.g. hand-authored seed rewards) so editing never silently drops them.
  const legacyRewards = (existing?.rewards ?? []).filter(
    (lr) => !input.rewards.some((r) => r.name === lr.name)
  );
  const rewards = [...input.rewards, ...legacyRewards];
  const legacyAssets = (existing?.mcomAssets ?? []).filter(
    (a) => !input.mcomAssets.some((n) => n.name === a.name)
  );
  const mcomAssets = [...input.mcomAssets, ...legacyAssets];

  const approval =
    input.visibility.adminReview || input.access.adminApproval
      ? "admin_review"
      : "automatic";

  const master: MasterTemplate = {
    id: existing?.id ?? `tpl-${Date.now()}`,
    name: input.name,
    tagline: existing?.tagline ?? input.purpose,
    season: input.seasonLabel,
    audience: input.audience,
    accessType: input.accessTypeName,
    origin: conditions.includes("pre_audit") ? "audit" : "direct",
    requirements: hydratedRequirements(conditions),
    approval,
    contributionRequirement: input.access.minContributionEnabled
      ? {
          required: conditions.includes("min_contribution"),
          amount: Number(input.access.minContribution || 0),
        }
      : { required: false, amount: 0 },
    selfFunding: selfFundingFromRules(input.selfFundingRules, rewards),
    fields: rowsToFields(fieldRows),
    rewards,
    mcomAssets,
    status: "locked",
    purpose: input.purpose,
    campaignType: input.campaignType,
    lifecycle: input.lifecycle,
    owner: "admin",
    masterTemplate: true,
    campaignsUsing: existing?.campaignsUsing ?? 0,
    createdAt: existing?.createdAt ?? isoToday(),
    updatedAt: isoToday(),
    structure: {
      mode: input.campaignTypeName,
      layout: config.visibility.presentation === "video"
        ? "Video-first"
        : config.visibility.presentation === "story"
        ? "Story-first"
        : "Image-first",
      sections: input.sections.map((s) => ({ ...s })),
      config,
    },
    dataSources: deriveDataSources(fieldRows, config.location),
    accessRules: { ...input.access },
    accessConditions: conditions,
    fieldRows,
    contributionRules: { ...input.selfFundingRules },
  };

  if (existing) {
    Object.assign(existing, master);
    return hydrate(existing);
  }
  masters.unshift(master);
  return hydrate(master);
}

/** Duplicate a master as a new Draft. */
export function duplicateTemplate(id: string): MasterTemplate | undefined {
  const source = masters.find((m) => m.id === id);
  if (!source) return undefined;
  const copy: MasterTemplate = {
    ...source,
    id: `tpl-${Date.now()}`,
    name: `${source.name} (Copy)`,
    lifecycle: "draft",
    campaignsUsing: 0,
    createdAt: isoToday(),
    updatedAt: isoToday(),
    requirements: source.requirements.map((r) => ({ ...r })),
    structure: {
      ...source.structure,
      sections: source.structure.sections.map((s) => ({ ...s })),
      config: {
        funding: { ...source.structure.config.funding },
        location: { ...source.structure.config.location },
        visibility: { ...source.structure.config.visibility },
        seasonId: source.structure.config.seasonId,
      },
    },
    dataSources: [...source.dataSources],
    accessRules: { ...source.accessRules },
    accessConditions: [...source.accessConditions],
    fieldRows: source.fieldRows.map((r) => ({ ...r })),
    contributionRules: { ...source.contributionRules },
    rewards: source.rewards.map((r) => ({ ...r })),
    mcomAssets: source.mcomAssets.map((a) => ({ ...a })),
    fields: source.fields.map((f) => ({ ...f })),
  };
  masters.unshift(copy);
  return hydrate(copy);
}

/** Archive / restore / activate / deactivate a master. */
export function setTemplateLifecycle(
  id: string,
  lifecycle: TemplateLifecycle
): MasterTemplate | undefined {
  const t = masters.find((m) => m.id === id);
  if (!t) return undefined;
  t.lifecycle = lifecycle;
  t.updatedAt = isoToday();
  return hydrate(t);
}

// ---------------------------------------------------------------------------
// Accessors — Business side
// ---------------------------------------------------------------------------

/** Active templates the business can see (Available / Locked views). */
export function getBusinessTemplates(): MasterTemplate[] {
  return masters.filter((t) => t.lifecycle === "active" && audienceForBusiness(t)).map(hydrate);
}

/** Any template, hydrated — for setup / detail / admin preview. */
export function getBusinessTemplate(id: string | undefined): MasterTemplate | undefined {
  if (!id) return undefined;
  const t = masters.find((m) => m.id === id);
  return t ? hydrate(t) : undefined;
}

/** Admin "Preview as business" — non-active templates preview as locked. */
export function getTemplateForPreview(id: string): MasterTemplate | undefined {
  const t = getBusinessTemplate(id);
  if (!t) return undefined;
  const master = masters.find((m) => m.id === id);
  if (master && master.lifecycle !== "active") t.status = "locked";
  return t;
}

export function getMyCampaigns(): MyCampaign[] {
  return campaigns.map((c) => ({ ...c, answers: { ...(c.answers ?? {}) }, changes: c.changes.map((ch) => ({ ...ch })) }));
}

export function getCampaignInstance(id: string | undefined): MyCampaign | undefined {
  if (!id) return undefined;
  const c = campaigns.find((m) => m.id === id);
  return c
    ? { ...c, answers: { ...(c.answers ?? {}) }, changes: c.changes.map((ch) => ({ ...ch })) }
    : undefined;
}

// ---------------------------------------------------------------------------
// Claim → campaign instance (permission to use, never ownership)
// ---------------------------------------------------------------------------

export function claimTemplate(templateId: string): ClaimResult {
  const master = masters.find((m) => m.id === templateId);
  if (!master) return { ok: false, reason: "Template not found." };
  if (master.lifecycle !== "active")
    return { ok: false, reason: "This template is not currently available." };

  const inProgress = campaigns.find(
    (c) =>
      c.templateId === templateId &&
      (c.status === "draft" || c.status === "pending_review" || c.status === "changes_requested")
  );
  if (inProgress) return { ok: true, campaignId: inProgress.id, reused: true };

  const hydrated = hydrate(master);
  if (hydrated.status !== "available")
    return { ok: false, reason: "Complete the listed requirements to claim this template." };

  campaignSeq += 1;
  const id = `mc-${campaignSeq}`;
  const campaign: MyCampaign = {
    id,
    templateId,
    title: master.name,
    status: "draft",
    target:
      master.origin === "audit"
        ? parseMoney(AUDIT_ANSWERS.find((a) => a.id === "funding_amount")?.value)
        : 0,
    raised: 0,
    businessContribution: 0,
    rewardTriggered: null,
    changes: [],
    updatedAt: isoToday(),
    answers: {},
    programme: master.season,
    locationLabel: `${BUSINESS_IDENTITY.highStreet}, ${BUSINESS_IDENTITY.localArea}, ${BUSINESS_IDENTITY.city}`,
  };
  campaigns.push(campaign);
  master.campaignsUsing += 1;
  return { ok: true, campaignId: id, reused: false };
}

/** Persist Admin-permitted answers onto the campaign instance. */
export function saveAnswers(campaignId: string, answers: Record<string, string>): void {
  const c = campaigns.find((m) => m.id === campaignId);
  if (!c) return;
  c.answers = { ...(c.answers ?? {}), ...answers };
  c.updatedAt = isoToday();
}

/**
 * Submit the campaign through the template's configured approval process:
 * automatic → approved immediately; admin_review → Pending Review with a
 * linked Admin campaign so Admin decisions flow back.
 */
export function submitForReview(
  campaignId: string
): { status: CampaignStatus; adminCampaignId: string } | undefined {
  const c = campaigns.find((m) => m.id === campaignId);
  if (!c) return undefined;
  const master = masters.find((m) => m.id === c.templateId);
  const template = master ? hydrate(master) : undefined;

  const answers = c.answers ?? {};
  const auditTarget = parseMoney(
    AUDIT_ANSWERS.find((a) => a.id === "funding_amount")?.value
  );
  const target = parseMoney(answers.funding_target) || c.target || auditTarget || 0;
  if (target > 0) c.target = target;

  const next: CampaignStatus =
    template?.approval === "admin_review" ? "pending_review" : "approved";
  c.status = next;
  c.changes = [];
  c.updatedAt = isoToday();

  const adminStatus: AdminCampaignStatus =
    next === "pending_review" ? "pending_review" : "approved";
  if (c.adminCampaignId) {
    updateAdminCampaignStatus(c.adminCampaignId, adminStatus);
  } else {
    const admin = addAdminCampaign(buildAdminSeed(c, master, adminStatus));
    c.adminCampaignId = admin.id;
  }
  return { status: next, adminCampaignId: c.adminCampaignId };
}

/** Resubmit after Admin requested changes — returns the campaign to review. */
export function resubmitCampaign(
  campaignId: string,
  answers?: Record<string, string>
): void {
  const c = campaigns.find((m) => m.id === campaignId);
  if (!c) return;
  if (answers) c.answers = { ...(c.answers ?? {}), ...answers };
  c.status = "pending_review";
  c.changes = [];
  c.updatedAt = isoToday();
  if (c.adminCampaignId) updateAdminCampaignStatus(c.adminCampaignId, "pending_review");
}

/** Contribution B — the business contributes to its own campaign. */
export function contributeToCampaign(
  campaignId: string,
  amount: number,
  rewardName: string | null
): void {
  const c = campaigns.find((m) => m.id === campaignId);
  if (!c) return;
  c.businessContribution += amount;
  if (rewardName) c.rewardTriggered = rewardName;
  c.updatedAt = isoToday();
}

const ADMIN_TO_BUSINESS: Partial<Record<AdminCampaignStatus, CampaignStatus>> = {
  draft: "draft",
  pending_review: "pending_review",
  changes_required: "changes_requested",
  approved: "approved",
  scheduled: "approved",
  active: "active",
};

/**
 * Called when an Admin takes a lifecycle action on a linked campaign:
 * reflects the decision on the business campaign and reopens only the
 * Admin-permitted fields when changes are requested.
 */
export function syncBusinessCampaign(
  businessCampaignId: string,
  adminStatus: AdminCampaignStatus,
  note?: string
): void {
  const c = campaigns.find((m) => m.id === businessCampaignId);
  if (!c) return;
  if (adminStatus === "changes_required") {
    c.status = "changes_requested";
    const master = masters.find((m) => m.id === c.templateId);
    const text =
      note?.trim() ||
      "Please review the Admin feedback and update this field before resubmitting.";
    const reopen = (master?.fields ?? []).filter((f) => f.editable && !f.locked);
    const changes: RequestedChange[] = reopen.length
      ? reopen.map((f) => ({ fieldId: f.id, label: f.label, note: text }))
      : [{ fieldId: "campaign_details", label: "Campaign details", note: text }];
    c.changes = changes;
  } else {
    const mapped = ADMIN_TO_BUSINESS[adminStatus];
    if (mapped) c.status = mapped;
    c.changes = [];
  }
  c.updatedAt = isoToday();
}

/** Does an admin campaign belong to a business claim? (for admin pages) */
export function getAdminCampaignLink(
  adminCampaignId: string
): string | undefined {
  return getAdminCampaignById(adminCampaignId)?.businessCampaignId;
}
