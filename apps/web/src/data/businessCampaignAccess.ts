// =============================================================================
// Business Campaign Access & Template Claim — Demo Data (frontend only)
// Drives the Business Dashboard "Campaign Centre", the Claim flow and the
// template-driven Campaign Setup wizard. Mirrors the Admin template config:
// what is locked, what the business may answer, what comes from the audit,
// which rewards / MCOM assets are attached and whether approval is required.
// =============================================================================

export type RequirementId =
  | "business_account"
  | "pre_audit"
  | "min_contribution"
  | "campaign_eligibility";

export interface AccessRequirement {
  id: RequirementId;
  label: string;
  hint: string;
  met: boolean;
}

export type SetupFieldSource =
  | "admin"
  | "template"
  | "audit"
  | "business_account"
  | "location"
  | "mcom"
  | "business_input";

export type SetupInputType = "text" | "number" | "date" | "textarea";

export interface SetupField {
  id: string;
  label: string;
  /** Admin-configured question shown when the business must supply the value. */
  question?: string;
  /** Known value — empty when nothing exists yet. */
  value: string;
  source: SetupFieldSource;
  /** Locked: the business can only view it (template / audit / identity data). */
  locked: boolean;
  /** Admin has enabled the business to provide or confirm this value. */
  editable: boolean;
  required: boolean;
  inputType: SetupInputType;
  /** Shown next to the value so the business knows where it came from. */
  sourceNote: string;
}

export interface TemplateReward {
  id: string;
  name: string;
  category: string;
  /** Admin-configured contribution rule — not editable by the business. */
  rule: string;
  source: "mcom" | "fundordonate";
}

export interface TemplateAsset {
  id: string;
  name: string;
  type: string;
}

export interface SelfFundingConfig {
  enabled: boolean;
  mode: "optional" | "required";
  amount: number;
  /** Reward triggered by the business's own contribution, if configured. */
  rewardName: string | null;
}

export interface BusinessTemplate {
  id: string;
  name: string;
  tagline: string;
  season: string;
  audience: "business" | "consumer" | "both";
  accessType: string;
  /** "audit" = Route A (campaign prepared from the Public Pre-Audit). */
  origin: "audit" | "direct";
  requirements: AccessRequirement[];
  approval: "automatic" | "admin_review";
  contributionRequirement: { required: boolean; amount: number };
  selfFunding: SelfFundingConfig;
  fields: SetupField[];
  rewards: TemplateReward[];
  mcomAssets: TemplateAsset[];
  status: "locked" | "available";
}

export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "active";

export interface RequestedChange {
  fieldId: string;
  label: string;
  note: string;
}

export interface MyCampaign {
  id: string;
  templateId: string;
  title: string;
  status: CampaignStatus;
  target: number;
  raised: number;
  businessContribution: number;
  rewardTriggered: string | null;
  changes: RequestedChange[];
  updatedAt: string;
  /** Business answers for Admin-permitted fields — persisted by the setup wizard. */
  answers?: Record<string, string>;
  /** Linked Admin campaign (created on submit) so Admin decisions flow back. */
  adminCampaignId?: string;
  /** Programme (season) this campaign instance is connected to. */
  programme?: string;
  /** Location this campaign instance is connected to. */
  locationLabel?: string;
}

// ---------------------------------------------------------------------------
// Business identity & audit — already known, never re-asked
// ---------------------------------------------------------------------------

export const BUSINESS_IDENTITY = {
  name: "ABC Business Ltd",
  reference: "BUS-004821",
  location: "Worcester",
  city: "Worcester",
  localArea: "Central Worcester",
  highStreet: "High Street",
  businessType: "Retail",
  category: "Food & Drink",
  membershipTier: "Gold",
  auditReference: "AUD-000123",
};

export interface AuditAnswer {
  id: string;
  label: string;
  value: string;
}

/** Answers captured by the Public Pre-Audit — reused, never asked twice. */
export const AUDIT_ANSWERS: AuditAnswer[] = [
  { id: "funding_amount", label: "Funding amount required", value: "£2,000" },
  { id: "purpose", label: "Campaign / funding purpose", value: "Refit the shop front and add accessible entry for the high street store." },
  { id: "period_start", label: "Campaign period — start", value: "2026-10-01" },
  { id: "trading_history", label: "Trading history", value: "Trading since 2018 · 4 staff" },
  { id: "sector", label: "Business sector", value: "Retail — Food & Drink" },
];

// ---------------------------------------------------------------------------
// Requirements checklist helper
// ---------------------------------------------------------------------------

const REQ_ACCOUNT: AccessRequirement = {
  id: "business_account",
  label: "Business Account",
  hint: "Verified FundOrDonate business account",
  met: true,
};
const REQ_AUDIT: AccessRequirement = {
  id: "pre_audit",
  label: "Public Pre-Audit",
  hint: "Completed public pre-audit on file",
  met: true,
};

export const requirementProgress = (template: BusinessTemplate) => {
  const met = template.requirements.filter((r) => r.met).length;
  return { met, total: template.requirements.length, complete: met === template.requirements.length };
};

// ---------------------------------------------------------------------------
// Templates the business can see in the Campaign Centre
// ---------------------------------------------------------------------------

const lockedFields = (over: Partial<SetupField> & { id: string; label: string }): SetupField => ({
  value: "",
  source: "admin",
  locked: true,
  editable: false,
  required: true,
  inputType: "text",
  sourceNote: "Managed by FundOrDonate",
  ...over,
});

const WINTER_FIELDS: SetupField[] = [
  lockedFields({
    id: "campaign_name",
    label: "Campaign Name",
    value: "Winter High Street Funding Campaign",
    source: "admin",
    sourceNote: "Locked by Admin template",
  }),
  lockedFields({
    id: "campaign_description",
    label: "Campaign Description",
    value: "A FundOrDonate-approved winter campaign supporting high street businesses through the winter trading period.",
    source: "admin",
    sourceNote: "Locked by Admin template",
  }),
  lockedFields({
    id: "design",
    label: "Campaign Design",
    value: "Winter theme · hero image + brand colours",
    source: "template",
    sourceNote: "Template design",
  }),
  lockedFields({
    id: "purpose",
    label: "Purpose",
    value: AUDIT_ANSWERS[1]?.value ?? "",
    source: "audit",
    sourceNote: "Source: Public Pre-Audit",
  }),
  lockedFields({
    id: "funding_target",
    label: "Funding Target",
    value: "£2,000",
    source: "audit",
    sourceNote: "Source: Public Pre-Audit — asked once, reused here",
  }),
  lockedFields({
    id: "period_start",
    label: "Campaign Period — Start",
    value: "2026-10-01",
    source: "audit",
    sourceNote: "Source: Public Pre-Audit",
    inputType: "date",
  }),
  {
    id: "period_end",
    label: "Campaign Period — End",
    question: "When should this campaign run? Enter the end date.",
    value: "",
    source: "business_input",
    locked: false,
    editable: true,
    required: true,
    inputType: "date",
    sourceNote: "Not in the audit — Admin allows you to answer",
  },
  lockedFields({
    id: "location",
    label: "Location",
    value: "High Street, Central Worcester, Worcester",
    source: "location",
    sourceNote: "From your business location",
  }),
  lockedFields({
    id: "business_identity",
    label: "Business",
    value: `${BUSINESS_IDENTITY.name} · ${BUSINESS_IDENTITY.reference}`,
    source: "business_account",
    sourceNote: "From your business account",
  }),
  {
    id: "promotion_plan",
    label: "Promotion plan",
    question: "Which winter events will you promote this campaign at?",
    value: "",
    source: "business_input",
    locked: false,
    editable: true,
    required: true,
    inputType: "textarea",
    sourceNote: "Admin-configured question",
  },
  lockedFields({
    id: "rewards",
    label: "Rewards",
    value: "3 configured rewards",
    source: "admin",
    sourceNote: "Admin controlled — view only",
  }),
  lockedFields({
    id: "rules",
    label: "Campaign Rules",
    value: "All contributions received on completion · receipts issued",
    source: "template",
    sourceNote: "Template rules",
  }),
];

const AUTUMN_FIELDS: SetupField[] = [
  lockedFields({
    id: "campaign_name",
    label: "Campaign Name",
    value: "Autumn Growth Campaign",
    source: "admin",
    sourceNote: "Locked by Admin template",
  }),
  lockedFields({
    id: "campaign_description",
    label: "Campaign Description",
    value: "Approved template for autumn growth funding on the high street.",
    source: "admin",
    sourceNote: "Locked by Admin template",
  }),
  lockedFields({
    id: "design",
    label: "Campaign Design",
    value: "Autumn theme · hero image + brand colours",
    source: "template",
    sourceNote: "Template design",
  }),
  {
    id: "funding_target",
    label: "Funding Target",
    question: "How much would you like to raise?",
    value: "",
    source: "business_input",
    locked: false,
    editable: true,
    required: true,
    inputType: "number",
    sourceNote: "No audit on file — Admin allows you to answer",
  },
  {
    id: "purpose",
    label: "Purpose",
    question: "What is the purpose of this campaign?",
    value: "",
    source: "business_input",
    locked: false,
    editable: true,
    required: true,
    inputType: "textarea",
    sourceNote: "No audit on file — Admin allows you to answer",
  },
  {
    id: "period_start",
    label: "Campaign Period — Start",
    question: "When should this campaign start?",
    value: "",
    source: "business_input",
    locked: false,
    editable: true,
    required: true,
    inputType: "date",
    sourceNote: "Admin-configured question",
  },
  {
    id: "period_end",
    label: "Campaign Period — End",
    question: "When should this campaign end?",
    value: "",
    source: "business_input",
    locked: false,
    editable: true,
    required: true,
    inputType: "date",
    sourceNote: "Admin-configured question",
  },
  lockedFields({
    id: "location",
    label: "Location",
    value: "High Street, Central Worcester, Worcester",
    source: "location",
    sourceNote: "From your business location",
  }),
  lockedFields({
    id: "business_identity",
    label: "Business",
    value: `${BUSINESS_IDENTITY.name} · ${BUSINESS_IDENTITY.reference}`,
    source: "business_account",
    sourceNote: "From your business account",
  }),
  lockedFields({
    id: "rewards",
    label: "Rewards",
    value: "2 configured rewards",
    source: "admin",
    sourceNote: "Admin controlled — view only",
  }),
];

const SPRING_FIELDS: SetupField[] = AUTUMN_FIELDS.map((f) =>
  f.id === "campaign_name"
    ? { ...f, value: "Spring Community Fund" }
    : f.id === "campaign_description"
    ? { ...f, value: "Approved template for community funding campaigns in spring." }
    : f.id === "design"
    ? { ...f, value: "Spring theme · hero image + brand colours" }
    : f
);

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "tpl-winter",
    name: "Winter High Street Funding Campaign",
    tagline: "You are eligible to use this campaign template.",
    season: "Winter 2026",
    audience: "business",
    accessType: "After Audit",
    origin: "audit",
    requirements: [REQ_ACCOUNT, REQ_AUDIT],
    approval: "admin_review",
    contributionRequirement: { required: true, amount: 100 },
    selfFunding: { enabled: true, mode: "optional", amount: 100, rewardName: "£5 E-Gift Card" },
    fields: WINTER_FIELDS,
    rewards: [
      { id: "r1", name: "£5 E-Gift Card", category: "E-Gift Card", rule: "£50+ contribution", source: "fundordonate" },
      { id: "r2", name: "MCOM Rewards & Loyalty Access", category: "Membership / Access", rule: "£25+ contribution", source: "mcom" },
      { id: "r3", name: "Local Business Deal", category: "Deal", rule: "Any contribution", source: "mcom" },
    ],
    mcomAssets: [
      { id: "a1", name: "MCOM Winter Voucher Pack", type: "Voucher" },
      { id: "a2", name: "MCOM Rewards Listing", type: "Listing" },
    ],
    status: "available",
  },
  {
    id: "tpl-autumn",
    name: "Autumn Growth Campaign",
    tagline: "Contribute £100 to unlock this campaign template.",
    season: "Autumn 2026",
    audience: "business",
    accessType: "Contribution",
    origin: "direct",
    requirements: [
      REQ_ACCOUNT,
      { id: "pre_audit", label: "Public Pre-Audit", hint: "Completed public pre-audit on file", met: true },
      { id: "min_contribution", label: "Required Contribution", hint: "£100 platform contribution", met: false },
      { id: "campaign_eligibility", label: "Campaign Eligibility", hint: "Reviewed once the contribution clears", met: false },
    ],
    approval: "admin_review",
    contributionRequirement: { required: true, amount: 100 },
    selfFunding: { enabled: true, mode: "optional", amount: 100, rewardName: "£10 E-Gift Card" },
    fields: AUTUMN_FIELDS,
    rewards: [
      { id: "r4", name: "£10 E-Gift Card", category: "E-Gift Card", rule: "£75+ contribution", source: "fundordonate" },
      { id: "r5", name: "MCOM Coupon — 10% Off", category: "Coupon", rule: "Any contribution", source: "mcom" },
    ],
    mcomAssets: [{ id: "a3", name: "MCOM Autumn Coupon Set", type: "Coupon" }],
    status: "locked",
  },
  {
    id: "tpl-spring",
    name: "Spring Community Fund",
    tagline: "Confirm your campaign eligibility to unlock this campaign template.",
    season: "Spring 2027",
    audience: "both",
    accessType: "After Audit",
    origin: "audit",
    requirements: [
      REQ_ACCOUNT,
      { id: "pre_audit", label: "Public Pre-Audit", hint: "Completed public pre-audit on file", met: false },
      { id: "campaign_eligibility", label: "Campaign Eligibility", hint: "Checked automatically after the audit", met: false },
    ],
    approval: "automatic",
    contributionRequirement: { required: false, amount: 0 },
    selfFunding: { enabled: false, mode: "optional", amount: 0, rewardName: null },
    fields: SPRING_FIELDS,
    rewards: [{ id: "r6", name: "Thank You Certificate", category: "Other", rule: "Any contribution", source: "fundordonate" }],
    mcomAssets: [],
    status: "locked",
  },
];

// ---------------------------------------------------------------------------
// Campaigns the business has already claimed / created
// ---------------------------------------------------------------------------

export const MY_CAMPAIGNS: MyCampaign[] = [
  {
    id: "mc-1",
    templateId: "tpl-winter",
    title: "Summer High Street Campaign",
    status: "active",
    target: 5000,
    raised: 2400,
    businessContribution: 100,
    rewardTriggered: null,
    changes: [],
    updatedAt: "2026-08-14",
  },
  {
    id: "mc-2",
    templateId: "tpl-autumn",
    title: "Autumn Growth — ABC Business",
    status: "changes_requested",
    target: 2000,
    raised: 0,
    businessContribution: 100,
    rewardTriggered: null,
    changes: [
      {
        fieldId: "funding_target",
        label: "Campaign funding amount",
        note: "Please confirm the amount — the audit figure and your request differ.",
      },
      {
        fieldId: "period_end",
        label: "Campaign period",
        note: "Please confirm the end date before we can approve the campaign.",
      },
    ],
    updatedAt: "2026-09-21",
  },
  {
    id: "mc-3",
    templateId: "tpl-winter",
    title: "Winter Market Stall Fund",
    status: "pending_review",
    target: 1500,
    raised: 0,
    businessContribution: 100,
    rewardTriggered: null,
    changes: [],
    updatedAt: "2026-09-24",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const getTemplate = (id: string | undefined) =>
  BUSINESS_TEMPLATES.find((t) => t.id === id);

export const getCampaign = (id: string | undefined) =>
  MY_CAMPAIGNS.find((c) => c.id === id);

export const formatGbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/** Fields the business must still supply: required, not answered, Admin-enabled. */
export const missingFields = (fields: SetupField[], answers: Record<string, string>) =>
  fields.filter(
    (f) => f.editable && f.required && !f.locked && !(answers[f.id] ?? f.value).trim()
  );

/** Everything the business is allowed to touch — for the review summary. */
export const editableFields = (fields: SetupField[]) =>
  fields.filter((f) => f.editable && !f.locked);

export const lockedFieldsOnly = (fields: SetupField[]) => fields.filter((f) => f.locked);

export const SOURCE_BADGES: Record<SetupFieldSource, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700" },
  template: { label: "Template", color: "bg-indigo-100 text-indigo-700" },
  audit: { label: "Public Pre-Audit", color: "bg-amber-100 text-amber-800" },
  business_account: { label: "Business account", color: "bg-blue-100 text-blue-700" },
  location: { label: "Location", color: "bg-teal-100 text-teal-700" },
  mcom: { label: "MCOM", color: "bg-fuchsia-100 text-fuchsia-700" },
  business_input: { label: "You", color: "bg-green-100 text-green-700" },
};

export const CAMPAIGN_STATUS_META: Record<
  CampaignStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-700" },
  pending_review: { label: "Pending Review", color: "bg-blue-100 text-blue-700" },
  changes_requested: { label: "Changes Required", color: "bg-orange-100 text-orange-700" },
  approved: { label: "Approved", color: "bg-green-100 text-green-700" },
  active: { label: "Active", color: "bg-green-100 text-green-700" },
};
