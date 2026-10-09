// =============================================================================
// Campaign Template Wizard — Admin
// Template = Campaign Access + Configuration Template, grouped into areas:
//   1. Campaign Structure   (basic, content, requirements, funding, location,
//                            audience & visibility)
//   2. Business Access      (access type, eligibility rules, access as reward)
//   3. Editable Fields      (which fields the business may edit)
//   4. Rewards & Internal  (rewards, conditions, delivery, internal asset connections)
//   5. Contribution         (self-funding / business contribution)
//   6. Preview              (business experience check)
//   7. Review               (summary, status, save / activate)
// Frontend only — no backend calls.
// =============================================================================

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Gift,
  GitBranch,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Info,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  Lock,
  MapPin,
  Package,
  Plus,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Ticket,
  Trash2,
  UserCheck,
  Users,
  Video,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  AUDIENCE_META,
  DELIVERY_LABELS,
  DELIVERY_OPTIONS,
  LIBRARY_REWARDS,
  REWARD_CATEGORY_META,
  SOURCE_META,
  type DeliveryMethod,
  type LibraryReward,
  type RewardAudience,
  type RewardCategory,
} from "@/data/templateRewardLibrary";
import {
  getMcomPlatforms,
  MCOM_GROUP_META,
} from "@/data/mcomAssetCatalogue";
import {
  getAdminTemplateById,
  saveTemplate,
  type MasterTemplate,
  type TemplateLifecycle,
} from "@/data/campaignTemplateStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CampaignType = "donation" | "crowdfunding" | "fund";
type TemplateAudience = "business" | "consumer" | "both";
type ConditionMode = "minimum" | "range" | "exact";
type DeliveryTiming = "instant" | "campaign_end" | "manual";
type LocationLevel = "national" | "city" | "local_area" | "high_street" | "business";
type Presentation = "image" | "video" | "story";
type AccessTypeId =
  | "automatic"
  | "audit"
  | "contribution"
  | "membership"
  | "admin_assigned"
  | "combination";
type ContributionMode = "not_allowed" | "optional" | "required";
type ContributionAmountType = "fixed" | "minimum" | "from_audit" | "admin_rule";
type FieldSource =
  | "template"
  | "business_account"
  | "business_mcom"
  | "audit_business"
  | "admin"
  | "admin_mcom";
type FieldAccess = "no" | "configurable" | "conditional";

interface StructureSection {
  id: string;
  label: string;
  hint: string;
  source: "admin" | "business";
  enabled: boolean;
  required: boolean;
}

interface ConditionRow {
  id: string;
  mode: ConditionMode;
  min: string;
  max: string;
  exact: string;
}

interface DeliveryConfig {
  method: DeliveryMethod;
  code: string;
  url: string;
  instructions: string;
  timing: DeliveryTiming;
  claimDays: string;
}

interface TemplateRewardEntry {
  id: string;
  reward: LibraryReward;
  conditions: ConditionRow[];
  delivery: DeliveryConfig;
}

interface FundingConfig {
  targetRequired: boolean;
  methods: string[];
  minContributionEnabled: boolean;
  minContribution: string;
  duration: "30" | "60" | "90" | "custom";
  customDays: string;
  rules: string[];
  payments: string[];
}

interface SelfFundingConfig {
  mode: ContributionMode;
  amountType: ContributionAmountType;
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

interface AccessConfig {
  type: AccessTypeId;
  eligibility: string[];
  minContributionEnabled: boolean;
  minContribution: string;
  accessAsReward: boolean;
  accessRewardThreshold: string;
  adminApproval: boolean;
}

interface FieldAccessRow {
  id: string;
  field: string;
  source: FieldSource;
  access: FieldAccess;
}

interface LocationConfig {
  required: boolean;
  levels: LocationLevel[];
  allowMultiple: boolean;
}

interface VisibilityConfig {
  marketplace: boolean;
  hub: boolean;
  search: boolean;
  adminReview: boolean;
  presentation: Presentation;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, area: 1, label: "Basic Template", icon: <FileText className="h-4 w-4" /> },
  { id: 2, area: 1, label: "Campaign Content", icon: <Layers className="h-4 w-4" /> },
  { id: 3, area: 1, label: "Content Requirements", icon: <ListChecks className="h-4 w-4" /> },
  { id: 4, area: 1, label: "Funding", icon: <Banknote className="h-4 w-4" /> },
  { id: 5, area: 1, label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { id: 6, area: 1, label: "Audience & Visibility", icon: <Users className="h-4 w-4" /> },
  { id: 7, area: 2, label: "Access Type", icon: <KeyRound className="h-4 w-4" /> },
  { id: 8, area: 2, label: "Eligibility Rules", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 9, area: 2, label: "Access as Reward", icon: <Ticket className="h-4 w-4" /> },
  { id: 10, area: 3, label: "Editable Fields", icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: 11, area: 4, label: "Internal Assets", icon: <Sparkles className="h-4 w-4" /> },
  { id: 12, area: 4, label: "Rewards", icon: <Gift className="h-4 w-4" /> },
  { id: 13, area: 4, label: "Conditions", icon: <ListChecks className="h-4 w-4" /> },
  { id: 14, area: 4, label: "Delivery", icon: <Package className="h-4 w-4" /> },
  { id: 15, area: 5, label: "Contribution", icon: <Store className="h-4 w-4" /> },
  { id: 16, area: 6, label: "Preview", icon: <Eye className="h-4 w-4" /> },
  { id: 17, area: 7, label: "Review", icon: <CheckCircle2 className="h-4 w-4" /> },
];

const AREAS: { id: number; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 1, label: "Campaign Structure", description: "What the template defines for every campaign built from it.", icon: <Layers className="h-4 w-4" /> },
  { id: 2, label: "Business Access & Eligibility", description: "Who can use this template, on what conditions, and how access is granted.", icon: <KeyRound className="h-4 w-4" /> },
  { id: 3, label: "Business Editable Fields", description: "Exactly which fields the business is allowed to edit after the template is applied.", icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: 4, label: "Rewards & Internal Assets", description: "Reusable rewards with conditions and delivery, plus the MCOM/247GBS platform access (Internal Assets) this campaign connects.", icon: <Gift className="h-4 w-4" /> },
  { id: 5, label: "Business Contribution / Self-Funding", description: "Whether and how the business contributes to its own campaign.", icon: <Store className="h-4 w-4" /> },
  { id: 6, label: "Preview", description: "Check what a business will see when using this template.", icon: <Eye className="h-4 w-4" /> },
  { id: 7, label: "Review & Activate", description: "Summary, status and save / activate.", icon: <CheckCircle2 className="h-4 w-4" /> },
];

const PREVIEW_STEP_ID = 16;
const REVIEW_STEP_ID = 17;

const CAMPAIGN_TYPES: { id: CampaignType; label: string; description: string }[] = [
  { id: "donation", label: "Donation", description: "Give-based campaigns with optional contributor rewards." },
  { id: "crowdfunding", label: "Crowdfunding", description: "Goal-driven campaigns backed by many small contributions." },
  { id: "fund", label: "Fund", description: "Structured funding campaigns with a defined target and dates." },
];

const AUDIENCE_OPTIONS: { id: TemplateAudience; label: string; description: string }[] = [
  { id: "business", label: "Business campaign", description: "Used inside the Business campaign experience." },
  { id: "consumer", label: "Consumer campaign", description: "Used inside the Consumer campaign experience." },
  { id: "both", label: "Both", description: "Available to Business and Consumer experiences separately." },
];

const ADMIN_SECTIONS: StructureSection[] = [
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

const BUSINESS_SECTIONS: StructureSection[] = [
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

const CONTRIBUTION_METHODS = [
  { id: "one_off", label: "One-off contribution", description: "A single payment per contributor." },
  { id: "recurring", label: "Recurring contribution", description: "Repeat contributions across the campaign period." },
  { id: "milestone", label: "Milestone-based", description: "Contributions released as milestones are reached." },
  { id: "flexible", label: "Flexible", description: "Contributions accepted at any time before the end date." },
];

const DURATION_OPTIONS: { id: FundingConfig["duration"]; label: string }[] = [
  { id: "30", label: "30 days" },
  { id: "60", label: "60 days" },
  { id: "90", label: "90 days" },
  { id: "custom", label: "Custom" },
];

const FUNDING_RULES = [
  { id: "all_or_nothing", label: "All-or-nothing", description: "Funds are only collected if the target is reached." },
  { id: "partial_allowed", label: "Partial funding allowed", description: "Business keeps funds raised if the target is missed." },
  { id: "stretch_goals", label: "Stretch goals", description: "Allow additional goals beyond the main target." },
  { id: "public_progress", label: "Public progress", description: "Show live progress towards the funding target." },
];

const PAYMENT_REQUIREMENTS = [
  { id: "card_payments", label: "Card payments", description: "Contributions must be made by debit or credit card." },
  { id: "verified_payouts", label: "Verified payouts", description: "Business must complete payout verification before launch." },
  { id: "receipt_issue", label: "Receipts issued", description: "A contribution receipt is issued to every contributor." },
  { id: "identity_checks", label: "Identity checks", description: "Campaign owner must pass identity checks." },
];

const TIMING_OPTIONS: { id: DeliveryTiming; label: string }[] = [
  { id: "instant", label: "Instantly on contribution" },
  { id: "campaign_end", label: "After the campaign ends" },
  { id: "manual", label: "Manual release by Admin" },
];

const CATEGORY_FILTERS: { id: "all" | RewardCategory; label: string }[] = [
  { id: "all", label: "All Rewards" },
  { id: "egift_card", label: "E-Gift Cards" },
  { id: "gift_card", label: "Gift Cards" },
  { id: "voucher", label: "Vouchers" },
  { id: "coupon", label: "Coupons" },
  { id: "deal", label: "Deals" },
  { id: "membership", label: "Membership / Access" },
  { id: "other", label: "Other" },
];

const LOCATION_LEVELS: { id: LocationLevel; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "national", label: "National", description: "Campaign runs across the whole country.", icon: <Globe className="h-4 w-4" /> },
  { id: "city", label: "City", description: "Anchored to a single city.", icon: <Building2 className="h-4 w-4" /> },
  { id: "local_area", label: "Local Area", description: "Anchored to a borough / local area.", icon: <MapPin className="h-4 w-4" /> },
  { id: "high_street", label: "High Street", description: "Anchored to a specific high street.", icon: <Store className="h-4 w-4" /> },
  { id: "business", label: "Business", description: "Anchored to the business itself.", icon: <Briefcase className="h-4 w-4" /> },
];

const VISIBILITY_OPTIONS: { id: keyof Omit<VisibilityConfig, "presentation">; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "marketplace", label: "Campaign marketplace", description: "Show the campaign in the public campaign list.", icon: <Package className="h-4 w-4" /> },
  { id: "hub", label: "City & hub pages", description: "Surface the campaign on city and hub pages.", icon: <Globe className="h-4 w-4" /> },
  { id: "search", label: "Campaign search", description: "Allow the campaign to appear in search results.", icon: <Search className="h-4 w-4" /> },
  { id: "adminReview", label: "Admin review before publish", description: "Admin checks the campaign before it goes live.", icon: <ShieldCheck className="h-4 w-4" /> },
];

const PRESENTATION_OPTIONS: { id: Presentation; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "image", label: "Image-first", description: "Campaign card leads with the campaign image.", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "video", label: "Video-first", description: "Campaign card leads with the campaign video.", icon: <Video className="h-4 w-4" /> },
  { id: "story", label: "Story-first", description: "Campaign card leads with the campaign story.", icon: <BookOpen className="h-4 w-4" /> },
];

const ACCESS_TYPES: { id: AccessTypeId; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "automatic", label: "Automatic", description: "Every eligible business sees the template automatically — no approval needed.", icon: <Zap className="h-4 w-4" /> },
  { id: "audit", label: "After Audit", description: "Unlocked once the business passes its platform audit.", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "contribution", label: "Contribution", description: "Unlocked when the business contributes the required amount to the platform.", icon: <Wallet className="h-4 w-4" /> },
  { id: "membership", label: "Membership / Package", description: "Unlocked by an active membership or purchased package tier.", icon: <Package className="h-4 w-4" /> },
  { id: "admin_assigned", label: "Admin Assigned", description: "Granted manually by an Admin to specific businesses.", icon: <UserCheck className="h-4 w-4" /> },
  { id: "combination", label: "Combination", description: "Mix of the rules above — all selected conditions must be met.", icon: <GitBranch className="h-4 w-4" /> },
];

const ELIGIBILITY_RULES: { id: string; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "business_account", label: "Verified business account", description: "Business must have a completed, verified account.", icon: <Building2 className="h-4 w-4" /> },
  { id: "pre_audit", label: "Passed pre-audit", description: "Business must have passed its FundOrDonate audit.", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "membership_active", label: "Active membership", description: "Business must hold an active membership tier.", icon: <BadgeCheck className="h-4 w-4" /> },
  { id: "package_tier", label: "Purchased package", description: "Business must hold the required package tier.", icon: <Package className="h-4 w-4" /> },
  { id: "min_contribution", label: "Minimum platform contribution", description: "Business must have contributed at least £100 to the platform.", icon: <Wallet className="h-4 w-4" /> },
  { id: "admin_approval", label: "Admin approval required", description: "An Admin must approve each business before access is granted.", icon: <UserCheck className="h-4 w-4" /> },
];

const ACCESS_PRESETS: { id: string; label: string; rules: string[]; type: AccessTypeId }[] = [
  { id: "open", label: "Open (automatic)", rules: ["business_account"], type: "automatic" },
  { id: "audited", label: "Audited businesses only", rules: ["business_account", "pre_audit"], type: "audit" },
  { id: "contributing", label: "Contributing businesses", rules: ["business_account", "min_contribution"], type: "contribution" },
  { id: "members", label: "Members / packages", rules: ["business_account", "membership_active"], type: "membership" },
  { id: "manual", label: "Admin assigned", rules: ["business_account", "admin_approval"], type: "admin_assigned" },
];

const FIELD_SOURCE_META: Record<FieldSource, { label: string; color: string }> = {
  template: { label: "Template", color: "bg-indigo-100 text-indigo-700" },
  business_account: { label: "Business account", color: "bg-blue-100 text-blue-700" },
  business_mcom: { label: "Business-MCOM", color: "bg-teal-100 text-teal-700" },
  audit_business: { label: "Audit-Business", color: "bg-amber-100 text-amber-700" },
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700" },
  admin_mcom: { label: "Admin-MCOM", color: "bg-fuchsia-100 text-fuchsia-700" },
};

const FIELD_ACCESS_META: Record<FieldAccess, { label: string; hint: string; color: string }> = {
  no: { label: "No", hint: "No, unless selection enabled", color: "bg-gray-100 text-gray-600" },
  configurable: { label: "Configurable", hint: "Business can edit the value", color: "bg-green-100 text-green-700" },
  conditional: { label: "Conditional", hint: "Only if enabled", color: "bg-yellow-100 text-yellow-800" },
};

const DEFAULT_FIELD_ACCESS: FieldAccessRow[] = [
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

const CONTRIBUTION_MODES: { id: ContributionMode; label: string; description: string }[] = [
  { id: "not_allowed", label: "Not allowed", description: "The business cannot contribute to its own campaign." },
  { id: "optional", label: "Optional", description: "The business may contribute if it wants to." },
  { id: "required", label: "Required", description: "The business must contribute before publishing." },
];

const CONTRIBUTION_AMOUNT_TYPES: { id: ContributionAmountType; label: string; description: string }[] = [
  { id: "fixed", label: "Fixed amount", description: "One fixed contribution amount for every business." },
  { id: "minimum", label: "Minimum amount", description: "The business contributes at least this amount." },
  { id: "from_audit", label: "From audit", description: "Calculated from the business's audit funding requirement." },
  { id: "admin_rule", label: "Admin-defined rule", description: "A custom Admin rule decides the amount." },
];

const SEASONS: { id: string; label: string }[] = [
  { id: "none", label: "No season / evergreen" },
  { id: "spring_2026", label: "Spring 2026" },
  { id: "summer_2026", label: "Summer 2026" },
  { id: "autumn_2026", label: "Autumn 2026" },
  { id: "winter_2026", label: "Winter 2026" },
  { id: "ramadan_2026", label: "Ramadan 2026" },
  { id: "christmas_2026", label: "Christmas 2026" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let conditionSeq = 0;
const newConditionId = () => `c${Date.now()}-${conditionSeq++}`;

const createCondition = (mode: ConditionMode = "minimum"): ConditionRow => ({
  id: newConditionId(),
  mode,
  min: "",
  max: "",
  exact: "",
});

const createDelivery = (reward: LibraryReward): DeliveryConfig => ({
  method: reward.defaultDelivery,
  code: "",
  url: "",
  instructions: "",
  timing: "instant",
  claimDays: "30",
});

function conditionPreview(rewardName: string, condition: ConditionRow): string {
  if (condition.mode === "range" && condition.min && condition.max) {
    return `£${condition.min} – £${condition.max} contribution → ${rewardName}`;
  }
  if (condition.mode === "exact" && condition.exact) {
    return `£${condition.exact} contribution → ${rewardName}`;
  }
  if (condition.mode === "minimum" && condition.min) {
    return `£${condition.min}+ contribution → ${rewardName}`;
  }
  return "Set a contribution value to preview this reward rule";
}

/** Business-facing rule text stored on the master template. */
function buildRewardRule(conditions: ConditionRow[]): string {
  const parts = conditions
    .map((c) => {
      if (c.mode === "range" && c.min && c.max) return `£${c.min}–£${c.max} contribution`;
      if (c.mode === "exact" && c.exact) return `£${c.exact} contribution`;
      if (c.mode === "minimum" && c.min) return `£${c.min}+ contribution`;
      return null;
    })
    .filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(" or ") : "Any contribution";
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Callout({
  tone = "blue",
  icon,
  children,
}: {
  tone?: "blue" | "teal" | "yellow" | "gray";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
  } as const;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${tones[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon ?? <Info className="h-4 w-4" />}</span>
      <p className="text-xs">{children}</p>
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-primary-500 bg-primary-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {icon && (
        <span className={`mt-0.5 ${selected ? "text-primary-600" : "text-gray-400"}`}>{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {selected && <Check className="h-4 w-4 text-primary-600" />}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
      </span>
    </button>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  description,
  icon,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3.5 transition-colors ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-900">{title}</span>
          <span className="block text-xs text-gray-500">{description}</span>
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded text-primary-600 focus:ring-primary-500"
      />
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase text-gray-400">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function EmptyRewardsStep() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 py-14 text-center">
      <Gift className="mx-auto mb-3 h-9 w-9 text-gray-300" />
      <p className="text-sm font-medium text-gray-500">No rewards connected yet</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-gray-400">
        Add rewards from the reusable library — or attach Internal Assets on the
        Internal Assets step — then define their conditions and delivery here.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  /** Stored master template when editing — the source of truth for seeding. */
  const existing: MasterTemplate | undefined = id ? getAdminTemplateById(id) : undefined;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Area 1 — Basic template (spec step 3)
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.purpose ?? "");
  const [campaignType, setCampaignType] = useState<CampaignType>(
    existing?.campaignType ?? "fund"
  );
  const [audience, setAudience] = useState<TemplateAudience>(
    existing?.audience ?? "business"
  );
  const [season, setSeason] = useState(existing?.structure.config.seasonId ?? "none");

  // Area 1 — Admin-controlled campaign content (spec step 4)
  const [adminSections, setAdminSections] = useState<StructureSection[]>(() => {
    const stored = existing?.structure.sections.filter((s) => s.source === "admin") ?? [];
    return stored.length > 0
      ? stored.map((s) => ({ ...s }))
      : ADMIN_SECTIONS.map((s) => ({ ...s }));
  });

  // Area 1 — Business content requirements (spec step 13)
  const [sections, setSections] = useState<StructureSection[]>(() => {
    const stored = existing?.structure.sections.filter((s) => s.source === "business") ?? [];
    return stored.length > 0
      ? stored.map((s) => ({ ...s }))
      : BUSINESS_SECTIONS.map((s) => ({ ...s }));
  });

  // Area 1 — Funding requirements (spec step 5)
  const [funding, setFunding] = useState<FundingConfig>(() =>
    existing
      ? { ...existing.structure.config.funding }
      : {
          targetRequired: true,
          methods: ["one_off"],
          minContributionEnabled: false,
          minContribution: "10",
          duration: "60",
          customDays: "",
          rules: ["partial_allowed", "public_progress"],
          payments: ["card_payments", "verified_payouts", "receipt_issue"],
        }
  );

  // Area 2 — Business access & eligibility
  const [access, setAccess] = useState<AccessConfig>(() =>
    existing
      ? { ...existing.accessRules }
      : {
          type: "automatic",
          eligibility: ["business_account"],
          minContributionEnabled: true,
          minContribution: "100",
          accessAsReward: false,
          accessRewardThreshold: "100",
          adminApproval: false,
        }
  );

  // Area 3 — Business editable fields
  const [fieldAccess, setFieldAccess] = useState<FieldAccessRow[]>(() =>
    existing
      ? existing.fieldRows.map((r) => ({ ...r }))
      : DEFAULT_FIELD_ACCESS.map((r) => ({ ...r }))
  );

  // Area 5 — Self-funding / business contribution (spec step 12)
  const [selfFunding, setSelfFunding] = useState<SelfFundingConfig>(() =>
    existing
      ? { ...existing.contributionRules }
      : {
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
        }
  );

  // Area 4 — Reusable rewards (spec steps 6–10)
  const [rewards, setRewards] = useState<TemplateRewardEntry[]>(() => {
    if (!existing) return [];
    const used = new Set<string>();
    const entries: TemplateRewardEntry[] = [];
    for (const templateReward of existing.rewards) {
      const lib = LIBRARY_REWARDS.find(
        (l) => l.id === templateReward.id || l.name === templateReward.name
      );
      if (!lib || used.has(lib.id)) continue;
      used.add(lib.id);
      entries.push({
        id: lib.id,
        reward: lib,
        conditions: [createCondition("minimum")],
        delivery: createDelivery(lib),
      });
    }
    return entries;
  });

  // Area 4 — Connected Internal Assets (spec step 11)
  const [connectedServiceIds, setConnectedServiceIds] = useState<string[]>(() => {
    if (!existing) return [];
    const catalogue = getMcomPlatforms();
    const ids = new Set<string>();
    for (const asset of existing.mcomAssets) {
      const svc = catalogue.find(
        (s) => s.id === asset.id || s.code === asset.id || s.name === asset.name
      );
      if (svc) ids.add(svc.id);
    }
    return [...ids];
  });

  // Area 1 — Location requirements (spec step 14)
  const [location, setLocation] = useState<LocationConfig>(() =>
    existing ? { ...existing.structure.config.location } : { required: true, levels: ["city", "local_area", "high_street"], allowMultiple: false }
  );

  // Area 1 — Audience / visibility (spec step 15)
  const [visibility, setVisibility] = useState<VisibilityConfig>(() =>
    existing
      ? { ...existing.structure.config.visibility }
      : {
          marketplace: true,
          hub: true,
          search: true,
          adminReview: true,
          presentation: "image",
        }
  );

  // Reward library picker
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libSearch, setLibSearch] = useState("");
  const [libCategory, setLibCategory] = useState<"all" | RewardCategory>("all");
  const [libAudience, setLibAudience] = useState<"all" | RewardAudience>("all");
  const [libSelected, setLibSelected] = useState<string[]>([]);

  const selectedIds = useMemo(() => new Set(rewards.map((r) => r.id)), [rewards]);

  const connectablePlatforms = useMemo(
    () => getMcomPlatforms().filter((p) => p.connected),
    []
  );

  const libraryResults = useMemo(() => {
    const q = libSearch.trim().toLowerCase();
    return LIBRARY_REWARDS.filter((r) => r.status !== "archived").filter((r) => {
      if (q && !`${r.name} ${r.description} ${r.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      if (libCategory !== "all" && r.category !== libCategory) return false;
      if (libAudience !== "all" && r.audience !== libAudience && r.audience !== "both") return false;
      return true;
    });
  }, [libSearch, libCategory, libAudience]);

  const enabledSections = sections.filter((s) => s.enabled);
  const requiredSections = enabledSections.filter((s) => s.required);
  const enabledAdminSections = adminSections.filter((s) => s.enabled);
  const connectedServices = connectablePlatforms.filter((s) => connectedServiceIds.includes(s.id));
  const editableFieldCount = fieldAccess.filter(
    (r) => r.access !== "no"
  ).length;

  // ---------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------

  const stepError = (s: number): string | null => {
    if (s === 1 && !name.trim()) return "Enter a template name.";
    if (s === 2 && enabledAdminSections.length === 0)
      return "Keep at least one admin-controlled content section.";
    if (s === 3 && enabledSections.length === 0) return "Enable at least one content requirement.";
    if (s === 4 && funding.methods.length === 0) return "Select at least one contribution method.";
    if (s === 5 && location.required && location.levels.length === 0)
      return "Select at least one location level, or turn location off.";
    if (s === 8 && access.eligibility.length === 0)
      return "Select at least one eligibility rule.";
    if (s === 8 && access.eligibility.includes("min_contribution") && !access.minContribution.trim())
      return "Enter the minimum platform contribution amount, or remove that rule.";
    return null;
  };

  const canNext = () => stepError(step) === null;

  const goToStep = (target: number) => {
    setShowErrors(false);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (!canNext()) {
      setShowErrors(true);
      return;
    }
    goToStep(Math.min(STEPS.length, step + 1));
  };

  const goBack = () => goToStep(Math.max(1, step - 1));

  // ---------------------------------------------------------------------
  // Content requirement handlers
  // ---------------------------------------------------------------------

  const toggleSection = (sectionId: string) => {
    const target = sections.find((s) => s.id === sectionId);
    const nextEnabled = target ? !target.enabled : true;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: nextEnabled } : s))
    );
    if (sectionId === "location_details") {
      setLocation((prev) => ({ ...prev, required: nextEnabled }));
    }
  };

  const toggleRequired = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, required: !s.required } : s))
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[index];
      const b = next[target];
      if (!a || !b) return prev;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  const toggleAdminSection = (sectionId: string) => {
    setAdminSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // ---------------------------------------------------------------------
  // Access & eligibility handlers
  // ---------------------------------------------------------------------

  const applyAccessPreset = (presetId: string) => {
    const preset = ACCESS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setAccess((prev) => ({
      ...prev,
      type: preset.type,
      eligibility: [...preset.rules],
      adminApproval: preset.rules.includes("admin_approval"),
    }));
  };

  const toggleEligibility = (ruleId: string) => {
    setAccess((prev) => {
      const eligibility = prev.eligibility.includes(ruleId)
        ? prev.eligibility.filter((r) => r !== ruleId)
        : [...prev.eligibility, ruleId];
      return {
        ...prev,
        eligibility,
        minContributionEnabled: eligibility.includes("min_contribution"),
        adminApproval: eligibility.includes("admin_approval"),
      };
    });
  };

  const updateFieldAccess = (rowId: string, patch: Partial<FieldAccessRow>) => {
    setFieldAccess((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  // ---------------------------------------------------------------------
  // Funding handlers
  // ---------------------------------------------------------------------

  const toggleListValue = (key: "methods" | "rules" | "payments", value: string) => {
    setFunding((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  // ---------------------------------------------------------------------
  // Reward handlers (library + MCOM)
  // ---------------------------------------------------------------------

  const addRewardEntry = (reward: LibraryReward): TemplateRewardEntry => ({
    id: reward.id,
    reward,
    conditions: [createCondition("minimum")],
    delivery: createDelivery(reward),
  });

  const toggleService = (serviceId: string) => {
    setConnectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const openLibrary = () => {
    setLibSelected([]);
    setLibSearch("");
    setLibCategory("all");
    setLibAudience("all");
    setLibraryOpen(true);
  };

  const toggleLibReward = (rewardId: string) => {
    setLibSelected((prev) =>
      prev.includes(rewardId) ? prev.filter((r) => r !== rewardId) : [...prev, rewardId]
    );
  };

  const confirmAddRewards = () => {
    setRewards((prev) => {
      const existing = new Set(prev.map((r) => r.id));
      const additions: TemplateRewardEntry[] = [];
      for (const rid of libSelected) {
        if (existing.has(rid)) continue;
        const reward = LIBRARY_REWARDS.find((r) => r.id === rid);
        if (!reward) continue;
        additions.push(addRewardEntry(reward));
      }
      return [...prev, ...additions];
    });
    setLibraryOpen(false);
  };

  const removeReward = (rewardId: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
  };

  const addCondition = (rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId
          ? { ...r, conditions: [...r.conditions, createCondition("range")] }
          : r
      )
    );
  };

  const updateCondition = (
    rewardId: string,
    conditionId: string,
    patch: Partial<ConditionRow>
  ) => {
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId
          ? {
              ...r,
              conditions: r.conditions.map((c) => (c.id === conditionId ? { ...c, ...patch } : c)),
            }
          : r
      )
    );
  };

  const removeCondition = (rewardId: string, conditionId: string) => {
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId
          ? { ...r, conditions: r.conditions.filter((c) => c.id !== conditionId) }
          : r
      )
    );
  };

  const updateDelivery = (rewardId: string, patch: Partial<DeliveryConfig>) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, delivery: { ...r.delivery, ...patch } } : r))
    );
  };

  // ---------------------------------------------------------------------
  // Location handlers
  // ---------------------------------------------------------------------

  const setLocationRequired = (required: boolean) => {
    setLocation((prev) => ({ ...prev, required }));
    setSections((prev) =>
      prev.map((s) => (s.id === "location_details" ? { ...s, enabled: required } : s))
    );
  };

  const toggleLocationLevel = (level: LocationLevel) => {
    setLocation((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }));
  };

  // ---------------------------------------------------------------------
  // Save (spec steps 16 + 18) — persist to the master template store
  // ---------------------------------------------------------------------

  const handleSave = (lifecycle: TemplateLifecycle) => {
    setSaving(true);
    setTimeout(() => {
      const seasonOption = SEASONS.find((s) => s.id === season);
      saveTemplate(
        {
          name: name.trim() || "Untitled Template",
          purpose: description.trim() || name.trim() || "Campaign template",
          campaignType,
          audience,
          seasonId: season,
          seasonLabel: seasonOption?.label ?? "No season / evergreen",
          sections: [...adminSections, ...sections],
          funding,
          location,
          visibility,
          access,
          accessTypeName: accessMeta?.label ?? "Automatic",
          fieldRows: fieldAccess,
          selfFundingRules: selfFunding,
          rewards: rewards.map((entry) => ({
            id: entry.reward.id,
            name: entry.reward.name,
            category: REWARD_CATEGORY_META[entry.reward.category].label,
            rule: buildRewardRule(entry.conditions),
            source: entry.reward.source,
          })),
          mcomAssets: connectedServices.map((s) => ({
            id: s.id,
            name: s.name,
            type: MCOM_GROUP_META[s.group].label,
          })),
          campaignTypeName:
            CAMPAIGN_TYPES.find((t) => t.id === campaignType)?.label ?? "Fund",
          lifecycle,
        },
        isEdit ? id : undefined
      );
      setSaving(false);
      navigate(`/admin/campaigns/templates?status=${lifecycle}`);
    }, 700);
  };

  // ---------------------------------------------------------------------
  // Derived labels
  // ---------------------------------------------------------------------

  const typeMeta = CAMPAIGN_TYPES.find((t) => t.id === campaignType);
  const audienceMeta = AUDIENCE_OPTIONS.find((a) => a.id === audience);
  const durationLabel =
    funding.duration === "custom"
      ? `${funding.customDays || "—"} days`
      : `${funding.duration} days`;
  const presentationLabel =
    PRESENTATION_OPTIONS.find((p) => p.id === visibility.presentation)?.label ?? "—";
  const locationLevelLabels = LOCATION_LEVELS.filter((l) => location.levels.includes(l.id)).map(
    (l) => l.label
  );
  const accessMeta = ACCESS_TYPES.find((a) => a.id === access.type);
  const eligibilityLabels = ELIGIBILITY_RULES.filter((r) =>
    access.eligibility.includes(r.id)
  ).map((r) => r.label);
  const contributionModeLabel =
    CONTRIBUTION_MODES.find((m) => m.id === selfFunding.mode)?.label ?? "—";
  const contributionAmountLabel = (() => {
    switch (selfFunding.amountType) {
      case "fixed":
        return `£${selfFunding.fixedAmount || "0"} fixed`;
      case "minimum":
        return `£${selfFunding.minAmount || "0"} minimum`;
      case "from_audit": {
        const req = Number(selfFunding.auditRequirement) || 0;
        const pct = Number(selfFunding.auditPercent) || 0;
        return `From audit: £${req} × ${pct}% = £${((req * pct) / 100).toFixed(0)}`;
      }
      case "admin_rule":
        return selfFunding.adminRule.trim() || "Admin-defined rule (not set)";
    }
  })();

  const completeness: { label: string; ok: boolean; note: string; blocking: boolean }[] = [
    { label: "Template name", ok: Boolean(name.trim()), note: name.trim() ? name : "Missing name", blocking: true },
    { label: "Admin-controlled content", ok: enabledAdminSections.length > 0, note: `${enabledAdminSections.length} section(s) owned by Admin`, blocking: true },
    { label: "Content requirements", ok: enabledSections.length > 0, note: `${enabledSections.length} sections · ${requiredSections.length} required`, blocking: true },
    { label: "Funding configuration", ok: funding.methods.length > 0, note: funding.methods.length > 0 ? `${funding.methods.length} method(s) · ${durationLabel}` : "No contribution method selected", blocking: true },
    { label: "Business access", ok: access.eligibility.length > 0, note: accessMeta ? `${accessMeta.label} · ${eligibilityLabels.length} rule(s)` : "No access type", blocking: true },
    { label: "Editable fields", ok: editableFieldCount > 0, note: `${editableFieldCount} of ${fieldAccess.length} fields editable by the business`, blocking: true },
    { label: "Rewards connected", ok: rewards.length > 0, note: rewards.length > 0 ? `${rewards.length} reward(s) from the library` : "No rewards connected (recommended)", blocking: false },
    { label: "Internal asset connections", ok: connectedServices.length > 0, note: connectedServices.length > 0 ? `${connectedServices.length} platform(s) connected` : "No Internal Assets connected (optional)", blocking: false },
    { label: "Business contribution", ok: true, note: `${contributionModeLabel} · ${contributionAmountLabel}`, blocking: false },
    { label: "Location requirements", ok: !location.required || location.levels.length > 0, note: location.required ? locationLevelLabels.join(" › ") || "No levels selected" : "Location not required", blocking: true },
    { label: "Audience & visibility", ok: Boolean(audience), note: `${audienceMeta?.label ?? "—"} · ${presentationLabel} presentation`, blocking: true },
  ];
  const completenessIssues = completeness.filter((c) => !c.ok).length;
  const blockingIssues = completeness.filter((c) => !c.ok && c.blocking).length;

  // Area 2 (spec) — where each value comes from: Public Pre-Audit, business
  // profile, location data or Admin.
  const dataSourceGroups: { label: string; fields: string[] }[] = [
    {
      label: "Public Pre-Audit",
      fields: fieldAccess.filter((r) => r.source === "audit_business").map((r) => r.field),
    },
    {
      label: "Business profile",
      fields: fieldAccess.filter((r) => r.source === "business_account").map((r) => r.field),
    },
    ...(location.required
      ? [
          {
            label: "Location data",
            fields: LOCATION_LEVELS.filter((l) => location.levels.includes(l.id)).map((l) => l.label),
          },
        ]
      : []),
    {
      label: "Admin",
      fields: fieldAccess
        .filter((r) => r.source === "admin" || r.source === "admin_mcom")
        .map((r) => r.field),
    },
    {
      label: "Template",
      fields: fieldAccess.filter((r) => r.source === "template").map((r) => r.field),
    },
    {
      label: "MCOM",
      fields: fieldAccess.filter((r) => r.source === "business_mcom").map((r) => r.field),
    },
  ].filter((g) => g.fields.length > 0);

  const lifecycleLabel =
    existing?.lifecycle === "active"
      ? "Active"
      : existing?.lifecycle === "inactive"
      ? "Inactive"
      : existing?.lifecycle === "archived"
      ? "Archived"
      : "Draft";
  const lifecycleColor =
    existing?.lifecycle === "active"
      ? "bg-green-100 text-green-700"
      : existing?.lifecycle === "inactive" || existing?.lifecycle === "archived"
      ? "bg-gray-100 text-gray-600"
      : "bg-yellow-100 text-yellow-700";

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/admin/campaigns" className="hover:text-gray-700">Campaigns</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/campaigns/templates" className="hover:text-gray-700">Campaign Templates</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-gray-900">
            {isEdit ? "Edit Template" : "Create Template"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Campaign Template" : "Create Campaign Template"}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${lifecycleColor}`}
            >
              <Lock className="h-3 w-3" />
              {lifecycleLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              <ShieldCheck className="h-3 w-3" />
              Master template · Admin owned
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(PREVIEW_STEP_ID)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <Link
              to="/admin/campaigns/templates"
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          A template is a <strong>campaign access + configuration</strong> master: it defines
          campaign structure, which businesses can access it, which fields they may edit, and
          the rewards, assets and contribution rules attached to it. Businesses claim
          <strong> permission to use</strong> this master — they never own or modify it.
        </p>

        <div className="mt-4">
          <Callout tone="blue" icon={<Info className="h-4 w-4" />}>
            <strong>Statuses: Draft · Active · Inactive.</strong> New templates start as Draft
            and are invisible to businesses until activated. Inactive templates stay configured
            but hidden. Save at any point and return later.
          </Callout>
        </div>
      </div>

      {/* Area + step indicator */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {AREAS.map((a) => {
            const areaSteps = STEPS.filter((s) => s.area === a.id);
            const activeArea = STEPS.find((s) => s.id === step)?.area === a.id;
            const areaDone = step > Math.max(...areaSteps.map((s) => s.id));
            return (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  activeArea
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : areaDone
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
                title={a.description}
              >
                {areaDone && !activeArea ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                      activeArea ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {a.id}
                  </span>
                )}
                {a.label}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 scrollbar-hide">
          {STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            const error = showErrors && step === s.id && Boolean(stepError(s.id));
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < step) goToStep(s.id);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : done
                    ? "text-primary-700 hover:bg-primary-50"
                    : error
                    ? "bg-red-50 text-red-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                title={`Area ${s.area} · ${s.label}`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
                <span className="hidden xl:inline">{s.label}</span>
                <span className="xl:hidden">{s.id}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Area {STEPS.find((s) => s.id === step)?.area ?? 1} of {AREAS.length} ·{" "}
            <span className="font-semibold text-gray-600">
              {AREAS.find((a) => a.id === STEPS.find((s) => s.id === step)?.area)?.label}
            </span>
          </span>
          <span>
            Step {step} of {STEPS.length} · {STEPS[step - 1]?.label ?? ""}
          </span>
        </div>
      </div>

      {showErrors && stepError(step) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {stepError(step)}
        </div>
      )}

      {/* ══ Step 1 — Basic Template Information (spec step 3) ═══════════ */}
      {step === 1 && (
        <div className="space-y-5">
          <Panel title="Basic Template Information" description="What this template is and who it is for.">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Local Business Funding Campaign"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Internal Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Template for local businesses that want to raise funding through FundOrDonate."
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Visible to Admins only. Explains what this template is intended to be used for.
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Campaign Type"
            description="The type determines which campaign structure and features are available."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CAMPAIGN_TYPES.map((type) => (
                <ChoiceCard
                  key={type.id}
                  selected={campaignType === type.id}
                  onClick={() => setCampaignType(type.id)}
                  title={type.label}
                  description={type.description}
                  icon={<Banknote className="h-4 w-4" />}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Intended Audience"
            description="Who this template is designed for. Refine visibility on the Audience step."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  selected={audience === opt.id}
                  onClick={() => setAudience(opt.id)}
                  title={opt.label}
                  description={opt.description}
                  icon={<Users className="h-4 w-4" />}
                />
              ))}
            </div>
            <div className="mt-3">
              <Callout tone="gray">
                FundOrDonate keeps Business and Consumer campaign experiences separate. The
                audience you pick here controls which experience uses this template.
              </Callout>
            </div>
          </Panel>

          <Panel
            title="Season / Programme"
            description="Optionally attach this template to a season or programme so campaigns inherit it."
          >
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {SEASONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Season is optional. Templates without a season stay available all year.
            </p>
          </Panel>
        </div>
      )}

      {/* ══ Step 2 — Campaign Content, Area 1 (admin-controlled) ═══════ */}
      {step === 2 && (
        <div className="space-y-5">
          <Callout tone="blue" icon={<Lock className="h-4 w-4" />}>
            <strong>Campaign content is controlled by Admin.</strong> The template owns the
            campaign title, description and design, plus six controlled sections. The business
            never edits this copy — it only fills in the fields on the Content Requirements step.
          </Callout>

          <Panel
            title="Admin-controlled campaign content"
            description="Turn a section off to remove it entirely from campaigns built on this template."
          >
            <div className="space-y-2">
              {adminSections.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    section.enabled
                      ? "border-gray-200 bg-white"
                      : "border-dashed border-gray-200 bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggleAdminSection(section.id)}
                    className="h-4 w-4 shrink-0 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          section.enabled ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {section.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        <Lock className="h-2.5 w-2.5" />
                        Admin-controlled
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-400">{section.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryRow label="Campaign title" value="Fixed — set by Admin" />
            <SummaryRow label="Campaign design" value="Fixed — set by Admin" />
            <SummaryRow
              label="Controlled sections"
              value={`${enabledAdminSections.length} of ${adminSections.length} active`}
            />
          </div>

          <Callout tone="gray">
            Template name is internal — it is <strong>not</strong> the campaign title. Each
            campaign created from this template gets its own Admin-approved title.
          </Callout>
        </div>
      )}

      {/* ══ Step 3 — Content Requirements, Area 1 (spec step 13) ═══════ */}
      {step === 3 && (
        <div className="space-y-5">
          <Callout tone="blue" icon={<Info className="h-4 w-4" />}>
            Define which information the business <strong>must provide</strong>. The business
            fills in the actual values later — it never has to rebuild the structure itself.
          </Callout>

          <Panel
            title="Campaign Content Requirements"
            description="Enable the content the business provides, mark it required or optional, and reorder it."
          >
            <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3.5 py-2.5">
              <span className="text-xs font-medium text-gray-600">
                {enabledSections.length} of {sections.length} requirements enabled ·{" "}
                {requiredSections.length} required
              </span>
              <span className="text-xs text-gray-400">Reorder with the arrows</span>
            </div>

            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    section.enabled
                      ? "border-gray-200 bg-white"
                      : "border-dashed border-gray-200 bg-gray-50"
                  }`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggleSection(section.id)}
                    className="h-4 w-4 shrink-0 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          section.enabled ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {section.label}
                      </span>
                      {section.enabled && (
                        <button
                          type="button"
                          onClick={() => toggleRequired(section.id)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                            section.required
                              ? "bg-primary-100 text-primary-700"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {section.required ? "Required" : "Optional"}
                        </button>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">{section.hint}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="What the business provides" description="The business completes these fields when creating a campaign from this template.">
            {enabledSections.length === 0 ? (
              <p className="text-sm text-gray-400">No requirements enabled yet.</p>
            ) : (
              <ol className="space-y-1.5">
                {enabledSections.map((section, i) => (
                  <li key={section.id} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                      {i + 1}
                    </span>
                    {section.label}
                    {section.required && <span className="text-[10px] text-red-500">*required</span>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}

      {/* ══ Step 4 — Funding Requirements, Area 1 (spec step 5) ══════ */}
      {step === 4 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Panel
              title="Funding Target"
              description="Define whether campaigns using this template must set a funding target."
            >
              <ToggleRow
                checked={funding.targetRequired}
                onChange={(v) => setFunding((p) => ({ ...p, targetRequired: v }))}
                title="Requires a funding target"
                description="The business always enters its own campaign-specific target."
                icon={<Banknote className="h-4 w-4" />}
              />
            </Panel>

            <Panel
              title="Contribution Method"
              description="How contributors can give to campaigns on this template."
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {CONTRIBUTION_METHODS.map((method) => (
                  <ChoiceCard
                    key={method.id}
                    selected={funding.methods.includes(method.id)}
                    onClick={() => toggleListValue("methods", method.id)}
                    title={method.label}
                    description={method.description}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Minimum Contribution" description="Set a floor for contributions where applicable.">
              <ToggleRow
                checked={funding.minContributionEnabled}
                onChange={(v) => setFunding((p) => ({ ...p, minContributionEnabled: v }))}
                title="Enforce a minimum contribution"
                description="Contributions below this value are not accepted."
              />
              {funding.minContributionEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Minimum (£)</span>
                  <input
                    type="number"
                    min="0"
                    value={funding.minContribution}
                    onChange={(e) => setFunding((p) => ({ ...p, minContribution: e.target.value }))}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}
            </Panel>

            <Panel title="Campaign Duration" description="Default campaign length for this template.">
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFunding((p) => ({ ...p, duration: opt.id }))}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      funding.duration === opt.id
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {funding.duration === "custom" && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Duration (days)</span>
                  <input
                    type="number"
                    min="1"
                    value={funding.customDays}
                    onChange={(e) => setFunding((p) => ({ ...p, customDays: e.target.value }))}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                <Info className="h-3.5 w-3.5" />
                Template vs Campaign
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-lg bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase text-gray-400">Template defines</div>
                  <div className="mt-0.5 font-medium text-gray-900">
                    {funding.targetRequired ? "Campaign requires a funding target" : "Funding target optional"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {durationLabel} · {funding.methods.length} contribution method(s)
                    {funding.minContributionEnabled ? ` · min £${funding.minContribution || "0"}` : ""}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase text-gray-400">Business provides</div>
                  <div className="mt-0.5 font-medium text-gray-900">£10,000</div>
                  <div className="mt-1 text-xs text-gray-500">The actual campaign-specific funding value.</div>
                </div>
              </div>
            </div>

            <Panel title="Funding Rules">
              <div className="space-y-2.5">
                {FUNDING_RULES.map((rule) => (
                  <ToggleRow
                    key={rule.id}
                    checked={funding.rules.includes(rule.id)}
                    onChange={() => toggleListValue("rules", rule.id)}
                    title={rule.label}
                    description={rule.description}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Payment Requirements">
              <div className="space-y-2.5">
                {PAYMENT_REQUIREMENTS.map((req) => (
                  <ToggleRow
                    key={req.id}
                    checked={funding.payments.includes(req.id)}
                    onChange={() => toggleListValue("payments", req.id)}
                    title={req.label}
                    description={req.description}
                    icon={<CreditCard className="h-4 w-4" />}
                  />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ══ Step 11 — Attach Internal Assets, Area 4 (spec step 11) ═════ */}
      {step === 11 && (
        <div className="space-y-5">
          <Callout tone="teal" icon={<Sparkles className="h-4 w-4" />}>
            Attach the <strong>Internal Assets</strong> this campaign connects to — access to
            connected <strong>MCOM</strong> and <strong>247GBS</strong> platforms, e.g. “MCOM VCard
            Access” simply means the eligible business gets access to MCOM VCard. Platforms are
            connected centrally under{" "}
            <strong>Rewards → Asset Management → Internal Assets</strong> — only{" "}
            <strong>connected</strong> platforms appear here. FundOrDonate never recreates their
            products.
          </Callout>

          {connectablePlatforms.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">No connected platforms</p>
              <p className="mt-1 text-xs text-gray-500">
                Connect an MCOM or 247GBS platform in Asset Management → Internal Assets first.
              </p>
            </div>
          )}

          {(["mcom", "247gbs"] as const).map((groupKey) => {
            const meta = MCOM_GROUP_META[groupKey];
            const groupServices = connectablePlatforms.filter((s) => s.group === groupKey);
            if (groupServices.length === 0) return null;
            return (
              <Panel
                key={groupKey}
                title={`${meta.label} Platforms`}
                description={meta.description}
                action={
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                    {connectedServices.filter((s) => s.group === groupKey).length} connected
                  </span>
                }
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {groupServices.map((service) => {
                    const connected = connectedServiceIds.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          connected
                            ? "border-teal-400 bg-teal-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-semibold text-gray-900">{service.name}</span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-600">
                                {service.code}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">{service.description}</p>
                          </div>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              connected ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {connected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Gives businesses access to {service.name} · {service.assets.length} entr{service.assets.length === 1 ? "y" : "ies"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            );
          })}

          {connectedServices.length > 0 && (
            <Panel title="Connected to this template">
              <div className="flex flex-wrap gap-2">
                {connectedServices.map((service) => (
                  <span
                    key={service.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800"
                  >
                    {MCOM_GROUP_META[service.group].label} · {service.name}
                    <button
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className="rounded-full p-0.5 text-teal-500 hover:bg-teal-100 hover:text-teal-700"
                      title="Disconnect"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* ══ Step 15 — Business Contribution, Area 5 (spec step 12) ════ */}
      {step === 15 && (
        <div className="space-y-5">
          <Callout tone="blue" icon={<Store className="h-4 w-4" />}>
            Business contribution / self-funding lets a business owner contribute to their{" "}
            <strong>own campaign</strong>. It is a template capability — never hardcoded into
            every campaign.
          </Callout>

          <Panel
            title="Contribution Mode"
            description="Can the business contribute to campaigns built from this template?"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CONTRIBUTION_MODES.map((mode) => (
                <ChoiceCard
                  key={mode.id}
                  selected={selfFunding.mode === mode.id}
                  onClick={() => setSelfFunding((p) => ({ ...p, mode: mode.id }))}
                  title={mode.label}
                  description={mode.description}
                  icon={<Store className="h-4 w-4" />}
                />
              ))}
            </div>
          </Panel>

          {selfFunding.mode !== "not_allowed" && (
            <>
              <Panel
                title="Contribution Amount"
                description="How the required business contribution amount is determined."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CONTRIBUTION_AMOUNT_TYPES.map((type) => (
                    <ChoiceCard
                      key={type.id}
                      selected={selfFunding.amountType === type.id}
                      onClick={() => setSelfFunding((p) => ({ ...p, amountType: type.id }))}
                      title={type.label}
                      description={type.description}
                      icon={<Banknote className="h-4 w-4" />}
                    />
                  ))}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  {selfFunding.amountType === "fixed" && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Fixed amount (£)</label>
                      <input
                        type="number"
                        min="0"
                        value={selfFunding.fixedAmount}
                        onChange={(e) =>
                          setSelfFunding((p) => ({ ...p, fixedAmount: e.target.value }))
                        }
                        className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-400">Every business pays this amount.</span>
                    </div>
                  )}

                  {selfFunding.amountType === "minimum" && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Minimum amount (£)</label>
                      <input
                        type="number"
                        min="0"
                        value={selfFunding.minAmount}
                        onChange={(e) =>
                          setSelfFunding((p) => ({ ...p, minAmount: e.target.value }))
                        }
                        className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-400">The business may give more.</span>
                    </div>
                  )}

                  {selfFunding.amountType === "from_audit" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">
                          Audit funding requirement (£)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={selfFunding.auditRequirement}
                          onChange={(e) =>
                            setSelfFunding((p) => ({ ...p, auditRequirement: e.target.value }))
                          }
                          className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-500">×</span>
                        <label className="text-sm font-medium text-gray-700">Percent (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selfFunding.auditPercent}
                          onChange={(e) =>
                            setSelfFunding((p) => ({ ...p, auditPercent: e.target.value }))
                          }
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                        <span className="font-semibold">Live example:</span> audit funding
                        requirement £{selfFunding.auditRequirement || "0"} ×{" "}
                        {selfFunding.auditPercent || "0"}% ={" "}
                        <span className="font-bold">
                          £
                          {(
                            (Number(selfFunding.auditRequirement) || 0) *
                            (Number(selfFunding.auditPercent) || 0) /
                            100
                          ).toFixed(0)}
                        </span>{" "}
                        contribution from the business.
                      </div>
                      <p className="text-xs text-gray-400">
                        The formula is configured by Admin and recalculated automatically from
                        each business's audit result.
                      </p>
                    </div>
                  )}

                  {selfFunding.amountType === "admin_rule" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Admin-defined rule
                      </label>
                      <textarea
                        rows={3}
                        value={selfFunding.adminRule}
                        onChange={(e) =>
                          setSelfFunding((p) => ({ ...p, adminRule: e.target.value }))
                        }
                        placeholder="e.g. 5% of the business's approved funding requirement, minimum £50"
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Written in plain English — Admin evaluates it against each business.
                      </p>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel
                title="Contribution Behaviour"
                description="How the business's own contribution is treated on the campaign."
              >
                <div className="space-y-2.5">
                  <ToggleRow
                    checked={selfFunding.rewardForOwnContribution}
                    onChange={(v) => setSelfFunding((p) => ({ ...p, rewardForOwnContribution: v }))}
                    title="Reward the owner's own contribution"
                    description="The owner receives the configured reward / free gift, like any other contributor."
                    icon={<Gift className="h-4 w-4" />}
                  />
                  <ToggleRow
                    checked={selfFunding.countsTowardTarget}
                    onChange={(v) => setSelfFunding((p) => ({ ...p, countsTowardTarget: v }))}
                    title="Count towards the funding target"
                    description="Self-funded amounts contribute to the campaign's progress."
                    icon={<Banknote className="h-4 w-4" />}
                  />
                  <ToggleRow
                    checked={selfFunding.showDisclosure}
                    onChange={(v) => setSelfFunding((p) => ({ ...p, showDisclosure: v }))}
                    title="Show self-funding disclosure"
                    description="Display a clear note on the campaign that the owner has contributed."
                    icon={<Info className="h-4 w-4" />}
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-sm font-medium text-gray-700">Max self-funding (£)</label>
                    <input
                      type="number"
                      min="0"
                      value={selfFunding.maxSelfContribution}
                      onChange={(e) =>
                        setSelfFunding((p) => ({ ...p, maxSelfContribution: e.target.value }))
                      }
                      placeholder="No limit"
                      className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-400">Leave blank for no limit</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Example" description="How this works for a business campaign on this template.">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="font-medium text-gray-900">
                    Business owner contributes {contributionAmountLabel}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>→ Mode: <span className="font-semibold text-gray-900">{contributionModeLabel}</span></li>
                    <li>
                      → Receives{" "}
                      <span className="font-semibold text-gray-900">
                        {selfFunding.rewardForOwnContribution
                          ? "the configured reward / free gift (e.g. £5 E-Gift Card)"
                          : "no reward — owner rewards are switched off"}
                      </span>
                    </li>
                    <li>
                      → Counts towards the target:{" "}
                      <span className="font-semibold text-gray-900">
                        {selfFunding.countsTowardTarget ? "Yes" : "No"}
                      </span>
                    </li>
                    <li>
                      → Disclosure shown on the campaign:{" "}
                      <span className="font-semibold text-gray-900">
                        {selfFunding.showDisclosure ? "Yes" : "No"}
                      </span>
                    </li>
                    {selfFunding.maxSelfContribution && (
                      <li>
                        → Cap: <span className="font-semibold text-gray-900">£{selfFunding.maxSelfContribution}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </Panel>
            </>
          )}

          {audience === "consumer" && (
            <Callout tone="yellow" icon={<AlertCircle className="h-4 w-4" />}>
              Business contribution applies to <strong>business campaigns</strong>. This template
              is currently set to Consumer — switch the audience to Business or Both on the Basic
              Template or Audience step.
            </Callout>
          )}

          {selfFunding.mode === "not_allowed" && (
            <Callout tone="gray">
              Contribution is not allowed. Campaigns created from this template will not let the
              owner contribute to their own campaign. You can change this before activating.
            </Callout>
          )}
        </div>
      )}

      {/* ══ Step 12 — Connect Reusable Rewards, Area 4 (spec 6–8) ════ */}
      {step === 12 && (
        <div className="space-y-5">
          <Panel
            title="Reusable Rewards"
            description="Select rewards from the central library. The same reward can be used across many campaigns — no need to recreate it."
            action={
              <button
                type="button"
                onClick={openLibrary}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add Reward
              </button>
            }
          >
            {rewards.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                <Gift className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No rewards connected yet</p>
                <p className="mx-auto mt-1 max-w-md text-xs text-gray-400">
                  Pick existing rewards from the library — for example the £5, £10 and £15
                  e-gift cards or MCOM Rewards &amp; Loyalty access.
                </p>
                <button
                  type="button"
                  onClick={openLibrary}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Search className="h-4 w-4" />
                  Open Reward Library
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rewards.map((entry, index) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">{entry.reward.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REWARD_CATEGORY_META[entry.reward.category].color}`}
                        >
                          {REWARD_CATEGORY_META[entry.reward.category].label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_META[entry.reward.source].color}`}
                        >
                          {SOURCE_META[entry.reward.source].label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${AUDIENCE_META[entry.reward.audience].color}`}
                        >
                          {AUDIENCE_META[entry.reward.audience].label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{entry.reward.description}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Used by {entry.reward.uses} campaign{entry.reward.uses === 1 ? "" : "s"} ·{" "}
                        {entry.conditions.length} condition{entry.conditions.length === 1 ? "" : "s"} ·{" "}
                        {DELIVERY_LABELS[entry.delivery.method]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReward(entry.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove reward"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {rewards.length > 0 && (
            <Callout tone="gray">
              Rewards remain reusable. Removing a reward here only removes it from this template —
              the reward stays in the library for other campaigns.
            </Callout>
          )}
        </div>
      )}

      {/* ══ Step 13 — Reward Conditions, Area 4 (spec step 9) ════════ */}
      {step === 13 && (
        <div className="space-y-5">
          <Callout tone="blue">
            Define when each reward applies. The reward itself stays reusable — the campaign
            determines how it is applied.
          </Callout>

          {rewards.length === 0 ? (
            <EmptyRewardsStep />
          ) : (
            rewards.map((entry) => (
              <Panel
                key={entry.id}
                title={entry.reward.name}
                description="Contribution rules that unlock this reward."
                action={
                  <button
                    type="button"
                    onClick={() => addCondition(entry.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Condition
                  </button>
                }
              >
                <div className="space-y-3">
                  {entry.conditions.map((condition, ci) => (
                    <div key={condition.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3.5">
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase text-gray-400">
                            Rule {ci + 1}
                          </label>
                          <select
                            value={condition.mode}
                            onChange={(e) =>
                              updateCondition(entry.id, condition.id, {
                                mode: e.target.value as ConditionMode,
                              })
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="minimum">Minimum contribution</option>
                            <option value="range">Contribution range</option>
                            <option value="exact">Exact contribution</option>
                          </select>
                        </div>

                        {condition.mode === "minimum" && (
                          <MoneyField
                            label="Min (£)"
                            value={condition.min}
                            onChange={(v) => updateCondition(entry.id, condition.id, { min: v })}
                          />
                        )}

                        {condition.mode === "range" && (
                          <>
                            <MoneyField
                              label="From (£)"
                              value={condition.min}
                              onChange={(v) => updateCondition(entry.id, condition.id, { min: v })}
                            />
                            <MoneyField
                              label="To (£)"
                              value={condition.max}
                              onChange={(v) => updateCondition(entry.id, condition.id, { max: v })}
                            />
                          </>
                        )}

                        {condition.mode === "exact" && (
                          <MoneyField
                            label="Exact (£)"
                            value={condition.exact}
                            onChange={(v) => updateCondition(entry.id, condition.id, { exact: v })}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeCondition(entry.id, condition.id)}
                          disabled={entry.conditions.length === 1}
                          className="mb-1 rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          title="Remove condition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-primary-700">
                        <ListChecks className="h-3.5 w-3.5 shrink-0" />
                        {conditionPreview(entry.reward.name, condition)}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ))
          )}
        </div>
      )}

      {/* ══ Step 14 — Reward Delivery, Area 4 (spec step 10) ══════════ */}
      {step === 14 && (
        <div className="space-y-5">
          <Callout tone="teal">
            FundOrDonate does not recreate internal assets that already exist on connected MCOM /
            247GBS platforms — choose how the selected reward is delivered instead.
          </Callout>

          {rewards.length === 0 ? (
            <EmptyRewardsStep />
          ) : (
            rewards.map((entry) => (
              <Panel
                key={entry.id}
                title={entry.reward.name}
                description="How this reward reaches the contributor."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {DELIVERY_OPTIONS.map((option) => {
                      const selected = entry.delivery.method === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateDelivery(entry.id, { method: option.value })}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            selected
                              ? "border-primary-400 bg-primary-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                            {selected && <Check className="h-3.5 w-3.5 text-primary-600" />}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-500">{option.hint}</span>
                        </button>
                      );
                    })}
                  </div>

                  {entry.delivery.method === "voucher_code" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Voucher / code pattern</label>
                      <input
                        type="text"
                        value={entry.delivery.code}
                        onChange={(e) => updateDelivery(entry.id, { code: e.target.value })}
                        placeholder="e.g. FOD-XXXX-XXXX"
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {entry.delivery.method === "external_link" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Redemption link</label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="url"
                          value={entry.delivery.url}
                          onChange={(e) => updateDelivery(entry.id, { url: e.target.value })}
                          placeholder="https://example.com/redeem"
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {entry.delivery.method === "instructions" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Redemption instructions</label>
                      <textarea
                        rows={3}
                        value={entry.delivery.instructions}
                        onChange={(e) => updateDelivery(entry.id, { instructions: e.target.value })}
                        placeholder="Describe how the contributor claims this reward..."
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Delivery timing</label>
                      <select
                        value={entry.delivery.timing}
                        onChange={(e) =>
                          updateDelivery(entry.id, { timing: e.target.value as DeliveryTiming })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {TIMING_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Claim deadline (days)</label>
                      <input
                        type="number"
                        min="1"
                        value={entry.delivery.claimDays}
                        onChange={(e) => updateDelivery(entry.id, { claimDays: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </Panel>
            ))
          )}
        </div>
      )}

      {/* ══ Step 5 — Location Requirements, Area 1 (spec step 14) ════ */}
      {step === 5 && (
        <div className="space-y-5">
          <Callout tone="blue">
            The template never hard-codes a single business or location. The business campaign
            receives its actual applicable location when the campaign is created.
          </Callout>

          <Panel
            title="Location Requirements"
            description="Decide whether campaigns on this template need location information, and at which level."
          >
            <ToggleRow
              checked={location.required}
              onChange={setLocationRequired}
              title="Campaign requires location information"
              description="Turn this off for campaigns that are not location-based."
              icon={<MapPin className="h-4 w-4" />}
            />

            {location.required && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Location levels (select all that apply)
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {LOCATION_LEVELS.map((level) => (
                    <ChoiceCard
                      key={level.id}
                      selected={location.levels.includes(level.id)}
                      onClick={() => toggleLocationLevel(level.id)}
                      title={level.label}
                      description={level.description}
                      icon={level.icon}
                    />
                  ))}
                </div>

                <div className="mt-4">
                  <ToggleRow
                    checked={location.allowMultiple}
                    onChange={(v) => setLocation((p) => ({ ...p, allowMultiple: v }))}
                    title="Allow multiple locations"
                    description="The campaign can span more than one city, area or high street."
                  />
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Location Structure" description="How the campaign location connects to the wider FundOrDonate structure.">
            <div className="flex flex-wrap items-center gap-2">
              {LOCATION_LEVELS.map((level, i) => {
                const active = location.required && location.levels.includes(level.id);
                return (
                  <span key={level.id} className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-dashed border-gray-200 bg-gray-50 text-gray-400"
                      }`}
                    >
                      {level.icon}
                      {level.label}
                    </span>
                    {i < LOCATION_LEVELS.length - 1 && (
                      <ChevronRight className={`h-3.5 w-3.5 ${active ? "text-primary-400" : "text-gray-300"}`} />
                    )}
                  </span>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {location.required
                ? `Selected: ${locationLevelLabels.join(" › ") || "none yet"}${
                    location.allowMultiple ? " · multiple locations allowed" : ""
                  }`
                : "Location is not required for this template."}
            </p>
          </Panel>
        </div>
      )}

      {/* ══ Step 6 — Audience & Visibility, Area 1 (spec step 15) ═════ */}
      {step === 6 && (
        <div className="space-y-5">
          <Panel
            title="Campaign Audience"
            description="Who the resulting campaign is intended for. This connects with the existing FundOrDonate audience structure."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  selected={audience === opt.id}
                  onClick={() => setAudience(opt.id)}
                  title={opt.label}
                  description={opt.description}
                  icon={<Users className="h-4 w-4" />}
                />
              ))}
            </div>
            <div className="mt-3">
              <Callout tone="gray">
                Same audience setting as the Basic Info step — one value drives the whole
                template. Business and Consumer streams stay separate in reporting.
              </Callout>
            </div>
          </Panel>

          <Panel title="Visibility" description="Where campaigns created from this template can appear.">
            <div className="space-y-2.5">
              {VISIBILITY_OPTIONS.map((opt) => (
                <ToggleRow
                  key={opt.id}
                  checked={visibility[opt.id]}
                  onChange={(v) => setVisibility((p) => ({ ...p, [opt.id]: v }))}
                  title={opt.label}
                  description={opt.description}
                  icon={opt.icon}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Campaign Presentation" description="How the campaign is presented in lists and cards.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PRESENTATION_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  selected={visibility.presentation === opt.id}
                  onClick={() => setVisibility((p) => ({ ...p, presentation: opt.id }))}
                  title={opt.label}
                  description={opt.description}
                  icon={opt.icon}
                />
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ══ Step 7 — Access Type, Area 2 ══════════════════════════════ */}
      {step === 7 && (
        <div className="space-y-5">
          <Callout tone="blue" icon={<KeyRound className="h-4 w-4" />}>
            A template is also a <strong>campaign access grant</strong>. Choose how businesses
            unlock access to campaigns built from this template.
          </Callout>

          <Panel title="Access Presets" description="Quick starting points — customise afterwards.">
            <div className="flex flex-wrap gap-2">
              {ACCESS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAccessPreset(preset.id)}
                  className="rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Access Type" description="How a business gains access to this template.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACCESS_TYPES.map((type) => (
                <ChoiceCard
                  key={type.id}
                  selected={access.type === type.id}
                  onClick={() => setAccess((p) => ({ ...p, type: type.id }))}
                  title={type.label}
                  description={type.description}
                  icon={type.icon}
                />
              ))}
            </div>
          </Panel>

          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
              <Info className="h-3.5 w-3.5" />
              Selected access model
            </div>
            <p className="mt-2 text-sm text-primary-900">
              <strong>{accessMeta?.label}</strong> — {accessMeta?.description}
            </p>
            <p className="mt-1 text-xs text-primary-700">
              {eligibilityLabels.length > 0
                ? `Conditions: ${eligibilityLabels.join(" · ")}`
                : "No eligibility conditions configured yet."}
            </p>
          </div>
        </div>
      )}

      {/* ══ Step 8 — Eligibility Rules, Area 2 ════════════════════════ */}
      {step === 8 && (
        <div className="space-y-5">
          <Callout tone="teal" icon={<ShieldCheck className="h-4 w-4" />}>
            Eligibility rules decide which businesses qualify. A business must satisfy{" "}
            <strong>every selected rule</strong> before it can create a campaign from this
            template.
          </Callout>

          <Panel
            title="Eligibility Rules"
            description="Select all conditions that apply to this template."
            action={
              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
                {access.eligibility.length} of {ELIGIBILITY_RULES.length} active
              </span>
            }
          >
            <div className="space-y-2.5">
              {ELIGIBILITY_RULES.map((rule) => (
                <ToggleRow
                  key={rule.id}
                  checked={access.eligibility.includes(rule.id)}
                  onChange={() => toggleEligibility(rule.id)}
                  title={rule.label}
                  description={rule.description}
                  icon={rule.icon}
                />
              ))}
            </div>
          </Panel>

          {access.eligibility.includes("min_contribution") && (
            <Panel
              title="Minimum Platform Contribution"
              description="How much the business must have contributed to the platform to qualify."
            >
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Minimum (£)</label>
                <input
                  type="number"
                  min="0"
                  value={access.minContribution}
                  onChange={(e) =>
                    setAccess((p) => ({ ...p, minContribution: e.target.value }))
                  }
                  className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-400">Spec default: £100</span>
              </div>
            </Panel>
          )}

          <Panel title="Eligibility Summary" description="What the business must satisfy.">
            {access.eligibility.length === 0 ? (
              <p className="text-sm text-gray-400">No rules selected — every business qualifies.</p>
            ) : (
              <ol className="space-y-1.5">
                {ELIGIBILITY_RULES.filter((r) => access.eligibility.includes(r.id)).map(
                  (rule, i) => (
                    <li key={rule.id} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                        {i + 1}
                      </span>
                      {rule.label}
                      {rule.id === "min_contribution" && (
                        <span className="text-xs font-semibold text-teal-700">
                          (£{access.minContribution || "0"})
                        </span>
                      )}
                    </li>
                  )
                )}
              </ol>
            )}
          </Panel>
        </div>
      )}

      {/* ══ Step 9 — Access as Reward, Area 2 ═════════════════════════ */}
      {step === 9 && (
        <div className="space-y-5">
          <Callout tone="yellow" icon={<Ticket className="h-4 w-4" />}>
            <strong>Template access can itself be a reward.</strong> This is different from the
            Rewards area: here the <em>reward is access to the campaign template</em>, not a gift
            card or MCOM asset.
          </Callout>

          <Panel
            title="Grant template access as a reward"
            description="Businesses unlock this template by hitting a contribution threshold."
          >
            <ToggleRow
              checked={access.accessAsReward}
              onChange={(v) => setAccess((p) => ({ ...p, accessAsReward: v }))}
              title="Enable access-as-reward"
              description="Contribute the threshold amount, get the template unlocked."
              icon={<Ticket className="h-4 w-4" />}
            />

            {access.accessAsReward && (
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-700">
                  Contribution threshold (£)
                </label>
                <input
                  type="number"
                  min="0"
                  value={access.accessRewardThreshold}
                  onChange={(e) =>
                    setAccess((p) => ({ ...p, accessRewardThreshold: e.target.value }))
                  }
                  className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-400">Spec default: £100</span>
              </div>
            )}
          </Panel>

          {access.accessAsReward && (
            <Panel
              title="Reward flow"
              description="The journey a business takes to unlock this template."
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {[
                  `Contribute £${access.accessRewardThreshold || "100"}`,
                  "Contribution confirmed",
                  "Access unlocked",
                  "“Campaign Available”",
                  "Business claims it",
                ].map((label, i, arr) => (
                  <span key={label} className="flex items-center gap-2">
                    <span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-teal-800">
                      {label}
                    </span>
                    {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-gray-400" />}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <Callout tone="gray">
                  Access rewards are tracked separately from campaign rewards — they never appear
                  in the contributor reward library and are not delivered as gifts or vouchers.
                </Callout>
              </div>
            </Panel>
          )}

          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
              <Info className="h-3.5 w-3.5" />
              Current model
            </div>
            <p className="mt-2">
              Access: <strong>{accessMeta?.label}</strong>
              {access.accessAsReward
                ? ` · also unlocked by contributing £${access.accessRewardThreshold || "100"}`
                : " · access-as-reward disabled"}
              {access.adminApproval ? " · Admin approval required" : ""}
            </p>
          </div>
        </div>
      )}

      {/* ══ Step 10 — Business Editable Fields, Area 3 ════════════════ */}
      {step === 10 && (
        <div className="space-y-5">
          <Callout tone="blue" icon={<SlidersHorizontal className="h-4 w-4" />}>
            Decide, field by field, what the business can change after the template is applied.
            Everything else stays exactly as Admin configured it.
          </Callout>

          <Panel
            title="Field Access"
            description="Field · Source · Business can edit"
            action={
              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
                {editableFieldCount} editable
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-2.5 font-semibold">Field</th>
                    <th className="px-3 py-2.5 font-semibold">Source</th>
                    <th className="px-3 py-2.5 font-semibold">Business can edit</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldAccess.map((row) => {
                    const source = FIELD_SOURCE_META[row.source];
                    const accessMetaRow = FIELD_ACCESS_META[row.access];
                    return (
                      <tr key={row.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">
                          {row.field}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${source.color}`}
                          >
                            {source.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={row.access}
                            onChange={(e) =>
                              updateFieldAccess(row.id, {
                                access: e.target.value as FieldAccess,
                              })
                            }
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${accessMetaRow.color}`}
                          >
                            <option value="no">No</option>
                            <option value="configurable">Configurable</option>
                            <option value="conditional">Conditional</option>
                          </select>
                          <p className="mt-1 text-[11px] text-gray-400">{accessMetaRow.hint}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Data Sources"
            description="Where each value comes from — Public Pre-Audit, business profile, location data or Admin. Businesses never re-ask what a source already knows."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {dataSourceGroups.map((group) => (
                <div
                  key={group.label}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900">{group.label}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {group.fields.length} field{group.fields.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                    {group.fields.join(" · ")}
                  </p>
                </div>
              ))}
              {dataSourceGroups.length === 0 && (
                <p className="text-sm text-gray-400">
                  No sources configured yet — add fields with sources above.
                </p>
              )}
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryRow
              label="Editable by business"
              value={`${editableFieldCount} of ${fieldAccess.length} fields`}
            />
            <SummaryRow
              label="Locked"
              value={`${fieldAccess.filter((r) => r.access === "no").length} fields`}
            />
            <SummaryRow
              label="Conditional"
              value={`${fieldAccess.filter((r) => r.access === "conditional").length} fields`}
            />
          </div>

          <Callout tone="gray">
            Sources: <strong>Template</strong> (this template), <strong>Business account</strong>{" "}
            (verified profile), <strong>Business-MCOM</strong> (business's MCOM assets),{" "}
            <strong>Audit-Business</strong> (audit records), <strong>Admin</strong> and{" "}
            <strong>Admin-MCOM</strong>. Conditional fields are editable only when the relevant
            selection is enabled.
          </Callout>
        </div>
      )}

      {/* ══ Step 16 — Preview, Area 6 (spec step 17) ══════════════════ */}
      {step === PREVIEW_STEP_ID && (
        <div className="space-y-5">
          <Callout tone="blue" icon={<Eye className="h-4 w-4" />}>
            Preview what a business will experience when creating a campaign from this template.
            Verify the template is complete before activating it.
          </Callout>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {/* Campaign presentation */}
              <Panel title="Campaign Presentation" description="How the campaign appears to the public.">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div
                    className={`flex h-32 items-end bg-gradient-to-br from-primary-600 to-primary-800 p-4 ${
                      visibility.presentation === "video" ? "from-gray-700 to-gray-900" : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                      {PRESENTATION_OPTIONS.find((p) => p.id === visibility.presentation)?.icon}
                      {presentationLabel}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">
                          Campaign title (set by Admin)
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {name || "Template"} · {typeMeta?.label} · {audienceMeta?.label} ·{" "}
                          {durationLabel}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-semibold text-primary-700">
                        {location.required && locationLevelLabels[0]
                          ? locationLevelLabels[0]
                          : "No location"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-1/3 rounded-full bg-primary-500" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{funding.targetRequired ? "£0 raised of £10,000 target" : "Flexible funding"}</span>
                      <span>{durationLabel}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {visibility.marketplace && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">Marketplace</span>
                      )}
                      {visibility.hub && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">City &amp; Hub</span>
                      )}
                      {visibility.search && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">Search</span>
                      )}
                      {visibility.adminReview && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">Admin review</span>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Structure + required fields */}
              <Panel
                title="Admin-Controlled Content"
                description={`${enabledAdminSections.length} sections owned by Admin — never editable by the business`}
              >
                <div className="flex flex-wrap gap-1.5">
                  {enabledAdminSections.map((section) => (
                    <span
                      key={section.id}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700"
                    >
                      <Lock className="h-3 w-3" />
                      {section.label}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Campaign Structure"
                description={`${enabledSections.length} sections the business completes · ${requiredSections.length} required fields`}
              >
                <div className="space-y-3">
                  {enabledSections.map((section) => (
                    <div key={section.id}>
                      <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-700">
                        {section.label}
                        {section.required && <span className="text-red-500">*</span>}
                        {!section.required && (
                          <span className="font-normal text-gray-400">(optional)</span>
                        )}
                      </label>
                      {section.id === "media" ? (
                        <div className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-gray-400">
                          Upload campaign images / video
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled
                          placeholder={`Business enters: ${section.label.toLowerCase()}`}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <aside className="space-y-5">
              <Panel title="Funding Section">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Funding target</span><span className="font-semibold text-gray-900">{funding.targetRequired ? "Required" : "Optional"}</span></div>
                  <div className="flex justify-between"><span>Duration</span><span className="font-semibold text-gray-900">{durationLabel}</span></div>
                  <div className="flex justify-between"><span>Minimum</span><span className="font-semibold text-gray-900">{funding.minContributionEnabled ? `£${funding.minContribution || "0"}` : "None"}</span></div>
                  <div className="flex justify-between"><span>Methods</span><span className="font-semibold text-gray-900">{funding.methods.length}</span></div>
                  <div className="flex justify-between"><span>Business contribution</span><span className="font-semibold text-gray-900">{contributionModeLabel}</span></div>
                </div>
              </Panel>

              <Panel title="Reward Section">
                {rewards.length === 0 ? (
                  <p className="text-xs text-gray-400">No rewards configured.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {rewards.map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-gray-700">{entry.reward.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${SOURCE_META[entry.reward.source].color}`}
                        >
                          {SOURCE_META[entry.reward.source].label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Available Assets">
                {rewards.length === 0 ? (
                  <p className="text-xs text-gray-400">No assets connected.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {rewards.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-1.5">
                        <Package className="h-3 w-3 shrink-0 text-gray-400" />
                        <span className="truncate">{entry.reward.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[11px] font-semibold uppercase text-gray-400">
                  Internal Assets
                </p>
                {connectedServices.length === 0 ? (
                  <p className="mt-1 text-xs text-gray-400">No Internal Assets connected.</p>
                ) : (
                  <ul className="mt-1 space-y-1.5 text-xs text-gray-600">
                    {connectedServices.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{s.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${MCOM_GROUP_META[s.group].color}`}
                        >
                          {MCOM_GROUP_META[s.group].label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Location">
                <p className="text-xs text-gray-600">
                  {location.required
                    ? `${locationLevelLabels.join(" › ")}${location.allowMultiple ? " · multiple allowed" : ""}`
                    : "Location not required"}
                </p>
              </Panel>

              <Panel title="Audience">
                <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
                  {audienceMeta?.label ?? "—"}
                </span>
              </Panel>

              <Panel title="Access & Eligibility">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">{accessMeta?.label}</span> —{" "}
                  {accessMeta?.description}
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
                  {eligibilityLabels.length === 0 ? (
                    <li>No eligibility rules — open access.</li>
                  ) : (
                    eligibilityLabels.map((label) => (
                      <li key={label} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-teal-500" />
                        {label}
                      </li>
                    ))
                  )}
                  <li className="flex items-center gap-1.5">
                    <Ticket className="h-3 w-3 shrink-0 text-teal-500" />
                    {access.accessAsReward
                      ? `Access as reward at £${access.accessRewardThreshold || "100"}`
                      : "Access-as-reward off"}
                  </li>
                </ul>
                <p className="mt-2 text-[11px] text-gray-400">
                  {editableFieldCount} of {fieldAccess.length} fields editable by the business.
                </p>
              </Panel>

              <Panel
                title="Template Completeness"
                description="Verify the template before activating."
                action={
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      completenessIssues === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {completenessIssues === 0 ? "Ready" : `${completenessIssues} to review`}
                  </span>
                }
              >
                <ul className="space-y-2">
                  {completeness.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-xs">
                      {item.ok ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
                      )}
                      <span className="min-w-0">
                        <span className="block font-medium text-gray-900">{item.label}</span>
                        <span className="block text-gray-500">{item.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </aside>
          </div>
        </div>
      )}

      {/* ══ Step 17 — Review, Save & Activate, Area 7 (spec 16,18,19) ══ */}
      {step === REVIEW_STEP_ID && (
        <div className="space-y-5">
          <Panel title="Basic Information">
            <div className="space-y-3">
              <SummaryRow label="Template name" value={name || "Not set"} />
              <SummaryRow label="Internal description" value={description || "Not provided"} />
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryRow label="Campaign type" value={typeMeta?.label ?? "—"} />
                <SummaryRow label="Audience" value={audienceMeta?.label ?? "—"} />
                <SummaryRow
                  label="Season / programme"
                  value={SEASONS.find((s) => s.id === season)?.label ?? "—"}
                />
                <SummaryRow
                  label="Admin-controlled content"
                  value={`${enabledAdminSections.length} section(s)`}
                />
              </div>
            </div>
          </Panel>

          <Panel
            title="Content Requirements"
            description={`${enabledSections.length} sections · ${requiredSections.length} required`}
          >
            <div className="flex flex-wrap gap-1.5">
              {enabledSections.map((s, i) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  <span className="text-gray-400">{i + 1}.</span>
                  {s.label}
                  {s.required && <span className="text-red-400">*</span>}
                </span>
              ))}
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Funding Requirements">
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryRow label="Funding target" value={funding.targetRequired ? "Required" : "Optional"} />
                <SummaryRow label="Duration" value={durationLabel} />
                <SummaryRow
                  label="Minimum contribution"
                  value={funding.minContributionEnabled ? `£${funding.minContribution || "0"}` : "None"}
                />
                <SummaryRow label="Contribution methods" value={String(funding.methods.length)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...funding.rules, ...funding.payments].map((id) => {
                  const label =
                    FUNDING_RULES.find((r) => r.id === id)?.label ??
                    PAYMENT_REQUIREMENTS.find((r) => r.id === id)?.label ??
                    id;
                  return (
                    <span
                      key={id}
                      className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Access & Contribution">
              <div className="grid gap-3">
                <SummaryRow
                  label="Access type"
                  value={accessMeta?.label ?? "—"}
                />
                <SummaryRow
                  label="Eligibility rules"
                  value={
                    eligibilityLabels.length > 0
                      ? `${eligibilityLabels.length} rule(s)`
                      : "None — open access"
                  }
                />
                <SummaryRow
                  label="Access as reward"
                  value={
                    access.accessAsReward
                      ? `£${access.accessRewardThreshold || "100"} threshold`
                      : "Disabled"
                  }
                />
                <SummaryRow
                  label="Business contribution"
                  value={`${contributionModeLabel} · ${contributionAmountLabel}`}
                />
                <SummaryRow
                  label="Location requirements"
                  value={
                    location.required
                      ? `${locationLevelLabels.join(" › ") || "—"}${
                          location.allowMultiple ? " · multiple" : ""
                        }`
                      : "Not required"
                  }
                />
                <SummaryRow
                  label="Visibility"
                  value={[
                    visibility.marketplace && "Marketplace",
                    visibility.hub && "Hubs",
                    visibility.search && "Search",
                    visibility.adminReview && "Admin review",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "None"}
                />
                <SummaryRow label="Campaign presentation" value={presentationLabel} />
              </div>
            </Panel>
          </div>

          <Panel
            title="Business Editable Fields"
            description={`${editableFieldCount} of ${fieldAccess.length} fields editable by the business`}
          >
            <div className="flex flex-wrap gap-1.5">
              {fieldAccess.map((row) => (
                <span
                  key={row.id}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${FIELD_ACCESS_META[row.access].color}`}
                  title={`${row.field} · ${FIELD_SOURCE_META[row.source].label} · ${FIELD_ACCESS_META[row.access].hint}`}
                >
                  {row.field}
                  <span className="opacity-70">· {FIELD_ACCESS_META[row.access].label}</span>
                </span>
              ))}
            </div>
          </Panel>

          <Panel
            title="Rewards"
            description={`${rewards.length} reward(s) connected · ${connectedServices.length} internal asset(s)`}
          >
            {rewards.length === 0 ? (
              <p className="text-sm text-gray-400">No rewards connected.</p>
            ) : (
              <div className="space-y-2.5">
                {rewards.map((entry, index) => (
                  <div key={entry.id} className="rounded-lg border border-gray-200 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{entry.reward.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_META[entry.reward.source].color}`}
                      >
                        {SOURCE_META[entry.reward.source].label}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="rounded bg-gray-50 p-2.5">
                        <div className="text-[10px] font-semibold uppercase text-gray-400">Conditions</div>
                        <div className="mt-1 space-y-0.5">
                          {entry.conditions.map((c) => (
                            <p key={c.id} className="text-xs text-gray-600">
                              {conditionPreview(entry.reward.name, c)}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="rounded bg-gray-50 p-2.5">
                        <div className="text-[10px] font-semibold uppercase text-gray-400">Delivery</div>
                        <p className="mt-1 text-xs text-gray-600">{DELIVERY_LABELS[entry.delivery.method]}</p>
                        <p className="text-[11px] text-gray-400">
                          {TIMING_OPTIONS.find((t) => t.id === entry.delivery.timing)?.label} · claim
                          within {entry.delivery.claimDays || "30"} days
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Spec step 19 — reusability */}
          <Panel
            title="Reusable Template"
            description="One master template → many business campaigns."
          >
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-900 shadow-sm">
                  {name || "This template"}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                {["Business A", "Business B", "Business C", "Business D"].map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Each business creates its own campaign from the same underlying template — they
                do not create separate master templates. Only active templates are available for
                businesses to use.
              </p>
            </div>
          </Panel>

          <Callout tone="blue" icon={<ShieldCheck className="h-4 w-4" />}>
            <strong>Master template — owned and controlled by FundOrDonate (Admin).</strong> When
            a business claims this template it receives permission to use it: the campaign is
            prepared from this master, and the business may only complete the fields Admin
            opened. Businesses never own, copy or modify the master template itself.
          </Callout>

          <Panel
            title="Template Status"
            description="Draft and Inactive templates are hidden from businesses. Only Active templates can be used to create campaigns."
          >
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                <Lock className="h-3 w-3" />
                Draft — being built
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                Active — available to businesses
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                <AlertCircle className="h-3 w-3" />
                Inactive — hidden, configuration kept
              </span>
            </div>
          </Panel>

          <Callout tone="yellow" icon={<AlertCircle className="h-4 w-4" />}>
            <strong>Saving keeps this template as a Draft</strong> — businesses will not see it
            until you activate it. Use <em>Save Inactive</em> to keep the configuration while
            hiding an existing template. Activate it when the preview confirms the template is
            complete.
          </Callout>
        </div>
      )}

      {/* ── Footer navigation ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="hidden text-xs text-gray-400 sm:block">
          Step {step} of {STEPS.length} · {STEPS[step - 1]?.label ?? ""}
        </div>

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("inactive")}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              title="Keep the configuration but hide this template from businesses"
            >
              <AlertCircle className="h-4 w-4" />
              Save Inactive
            </button>
            <button
              type="button"
              onClick={() => handleSave("active")}
              disabled={saving || blockingIssues > 0}
              className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
              title={
                blockingIssues > 0
                  ? "Resolve the required items shown in Preview before activating"
                  : "Make this template available to businesses"
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              Activate Template
            </button>
          </div>
        )}
      </div>

      {step === REVIEW_STEP_ID && completenessIssues > 0 && (
        <button
          type="button"
          onClick={() => goToStep(PREVIEW_STEP_ID)}
          className="mx-auto flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          <Eye className="h-3.5 w-3.5" />
          Review the {completenessIssues} item{completenessIssues === 1 ? "" : "s"} in Preview before activating
        </button>
      )}

      {/* ── Reward library picker ───────────────────────────────────────── */}
      {libraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Gift className="h-5 w-5 text-primary-600" />
                  Reward Library
                </h2>
                <p className="text-xs text-gray-500">
                  Select existing rewards. The same reward can be reused across campaigns — you
                  never have to recreate it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 px-6 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  placeholder="Search rewards, vouchers, gift cards, access..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Filter className="mr-1 h-3.5 w-3.5 text-gray-400" />
                {CATEGORY_FILTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setLibCategory(c.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      libCategory === c.id
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                <select
                  value={libAudience}
                  onChange={(e) => setLibAudience(e.target.value as "all" | RewardAudience)}
                  className="ml-auto rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary-300"
                >
                  <option value="all">All audiences</option>
                  <option value="business">Business</option>
                  <option value="consumer">Consumer</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {libraryResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Gift className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">No rewards match your search</p>
                  <p className="mt-1 text-xs text-gray-400">Try a different keyword or filter.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {libraryResults.map((reward) => {
                    const alreadyAdded = selectedIds.has(reward.id);
                    const checked = libSelected.includes(reward.id);
                    return (
                      <label
                        key={reward.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                          checked
                            ? "border-primary-400 bg-primary-50"
                            : alreadyAdded
                            ? "border-gray-200 bg-gray-50 opacity-70"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked || alreadyAdded}
                          disabled={alreadyAdded}
                          onChange={() => toggleLibReward(reward.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900">{reward.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REWARD_CATEGORY_META[reward.category].color}`}
                            >
                              {REWARD_CATEGORY_META[reward.category].label}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_META[reward.source].color}`}
                            >
                              {SOURCE_META[reward.source].label}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${AUDIENCE_META[reward.audience].color}`}
                            >
                              {AUDIENCE_META[reward.audience].label}
                            </span>
                            {reward.status === "draft" && (
                              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                                Draft
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{reward.description}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {reward.valueGbp !== null ? `£${reward.valueGbp} value · ` : ""}
                            Used by {reward.uses} campaign{reward.uses === 1 ? "" : "s"} · default
                            delivery: {DELIVERY_LABELS[reward.defaultDelivery]}
                          </p>
                        </div>
                        {alreadyAdded && (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            Added
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3.5">
              <span className="text-xs text-gray-500">
                {libSelected.length} reward{libSelected.length === 1 ? "" : "s"} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLibraryOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAddRewards}
                  disabled={libSelected.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add {libSelected.length} Reward{libSelected.length === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
