// =============================================================================
// Campaign Wizard Types
// Shared types for the admin campaign creation/editing wizard.
// =============================================================================

// ── Wizard Step IDs ──

export type StepId =
  | "scope"
  | "locations"
  | "details"
  | "audience"
  | "participation"
  | "funding"
  | "period"
  | "rules"
  | "rewards"
  | "preview"
  | "review";

export interface StepDef {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const WIZARD_STEPS: StepDef[] = [
  { id: "scope", label: "Campaign Scope", shortLabel: "Scope", icon: "Globe" },
  { id: "locations", label: "Location Coverage", shortLabel: "Locations", icon: "MapPin" },
  { id: "details", label: "Campaign Details", shortLabel: "Details", icon: "FileText" },
  { id: "audience", label: "Audience", shortLabel: "Audience", icon: "Users" },
  { id: "participation", label: "Participation", shortLabel: "Participation", icon: "HandHeart" },
  { id: "funding", label: "Funding", shortLabel: "Funding", icon: "Pound" },
  { id: "period", label: "Campaign Period", shortLabel: "Period", icon: "Calendar" },
  { id: "rules", label: "Campaign Rules", shortLabel: "Rules", icon: "Shield" },
  { id: "rewards", label: "Rewards", shortLabel: "Rewards", icon: "Gift" },
  { id: "preview", label: "Preview", shortLabel: "Preview", icon: "Eye" },
  { id: "review", label: "Review & Submit", shortLabel: "Review", icon: "CheckCircle" },
];

// ── Location Tree Types ──

export interface LocationTreeNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  fullPath: string | null;
  publicStatus: string;
}

export interface LocationTreeHighStreet extends LocationTreeNode {
  type: "HIGH_STREET";
}

export interface LocationTreeLocalArea extends LocationTreeNode {
  type: "BOROUGH" | "DISTRICT" | "LOCAL_AREA" | "COMMERCIAL_AREA";
  highStreets: LocationTreeHighStreet[];
}

export interface LocationTreeCity extends LocationTreeNode {
  type: "CITY";
  localAreas: LocationTreeLocalArea[];
}

export interface LocationTreeResponse {
  cities: LocationTreeCity[];
}

export interface LocationFlatItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  parentId: string | null;
  fullPath: string | null;
  publicStatus: string;
  isActive: boolean;
}

// ── Location Coverage Selection ──

export interface LocationCoverage {
  mode: "all" | "selected";
  selectedLocalAreas: string[]; // location IDs
  excludedLocalAreas: string[];
  highStreetMode: "all" | "selected";
  selectedHighStreets: string[]; // location IDs
  excludedHighStreets: string[];
}

// ── Reward Types ──

export interface CampaignRewardItem {
  id: string;
  title: string;
  description: string;
  physicalType: "physical" | "digital";
  value: string;
  currency: string;
  assetType: "file" | "url" | "";
  assetUrl: string;
  order: number;
  fulfilmentType: string;
  fulfilmentConfig: Record<string, unknown>;
}

export interface CampaignReward {
  id: string;
  title: string;
  description: string;
  order: number;
  audience: "business" | "consumer" | "both";
  triggerType: "contribution" | "membership" | "founding_monthly" | "first_n" | "top_n";
  triggerConfig: {
    mode: "min" | "range" | "exact";
    min?: number;
    max?: number;
    exact?: number;
    count?: number; // for first_n / top_n
    minQualification?: number;
  };
  quantityType: "unlimited" | "limited";
  quantityLimit: number | null;
  claimDeadlineDays: number;
  fulfilmentType: string;
  fulfilmentConfig: Record<string, unknown>;
  qualificationPeriod: string;
  expiryDays: number;
  items: CampaignRewardItem[];
}

// ── Campaign Wizard Data (Full State) ──

export interface CampaignWizardData {
  // Step 1 — Scope
  scope: "city" | "independent";
  citySlug: string;
  cityName: string;
  cityId: string;

  // Step 2 — Location Coverage
  locationCoverage: LocationCoverage;

  // Step 3 — Details
  title: string;
  campaignCode: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  seasonIds: string[];
  featuredImage: string;
  additionalImages: string[];
  videoUrl: string;

  // Step 4 — Audience
  audience: "business" | "consumer" | "both";

  // Step 5 — Participation
  participation: {
    backCampaign: boolean;
    foundingMember: boolean;
    foundingMemberMonthly: boolean;
  };

  // Step 6 — Funding
  funding: {
    hasTarget: boolean;
    targetAmount: string;
    startingAmount: string;
    stretchTarget: string;
    minContribution: string;
    maxContribution: string;
    suggestedAmounts: string[];
    allowCustomAmount: boolean;
  };

  // Step 7 — Period
  period: {
    periodMode: "season" | "custom";
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };

  // Step 8 — Rules
  rules: {
    contributionLimit: string;
    participationLimit: string;
    campaignCapacity: string;
    multipleContributions: boolean;
    multipleRewards: boolean;
  };

  // Step 9 — Rewards
  rewards: CampaignReward[];
  qualificationMode: "highest" | "cumulative";
  hasRewards: boolean;

  // Meta
  status: CampaignStatus;
}

// ── Campaign Status ──

export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "changes_required"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  changes_required: "Changes Required",
  scheduled: "Scheduled",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  pending_review: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
  changes_required: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-400" },
  scheduled: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400" },
  active: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-400" },
  paused: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-400" },
  completed: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-400" },
  archived: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-400" },
};

// ── Default Wizard Data ──

export function createDefaultWizardData(): CampaignWizardData {
  return {
    // Step 1
    scope: "city",
    citySlug: "",
    cityName: "",
    cityId: "",

    // Step 2
    locationCoverage: {
      mode: "all",
      selectedLocalAreas: [],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },

    // Step 3
    title: "",
    campaignCode: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    seasonIds: [],
    featuredImage: "",
    additionalImages: [],
    videoUrl: "",

    // Step 4
    audience: "both",

    // Step 5
    participation: {
      backCampaign: true,
      foundingMember: false,
      foundingMemberMonthly: false,
    },

    // Step 6
    funding: {
      hasTarget: true,
      targetAmount: "",
      startingAmount: "0",
      stretchTarget: "",
      minContribution: "",
      maxContribution: "",
      suggestedAmounts: ["10", "25", "50", "100", "250"],
      allowCustomAmount: true,
    },

    // Step 7
      period: {
        periodMode: "season",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      },

    // Step 8
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "",
      multipleContributions: true,
      multipleRewards: true,
    },

    // Step 9
    rewards: [],
    qualificationMode: "highest",
    hasRewards: false,

    // Meta
    status: "draft",
  };
}

// ── Step Validation ──

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStep(step: StepId, data: CampaignWizardData): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case "scope":
      if (!data.scope) errors.push("Campaign scope is required");
      if (data.scope === "city" && !data.citySlug) errors.push("Please select a city");
      break;

    case "locations": {
      const lc = data.locationCoverage;
      if (lc.mode === "selected" && lc.selectedLocalAreas.length === 0) {
        errors.push("Select at least one local area");
      }
      if (lc.highStreetMode === "selected" && lc.selectedHighStreets.length === 0) {
        errors.push("Select at least one high street");
      }
      break;
    }

    case "details":
      if (!data.title.trim()) errors.push("Campaign name is required");
      if (!data.shortDescription.trim()) errors.push("Short description is required");
      if (!data.featuredImage) warnings.push("No campaign image uploaded");
      break;

    case "audience":
      if (!data.audience) errors.push("Please select an audience");
      break;

    case "participation": {
      const p = data.participation;
      if (!p.backCampaign && !p.foundingMember && !p.foundingMemberMonthly) {
        errors.push("Enable at least one participation method");
      }
      break;
    }

    case "funding":
      if (data.funding.hasTarget) {
        if (!data.funding.targetAmount || Number(data.funding.targetAmount) <= 0) {
          errors.push("Funding target must be greater than 0");
        }
      }
      if (!data.funding.minContribution || Number(data.funding.minContribution) <= 0) {
        errors.push("Minimum contribution must be greater than 0");
      }
      break;

    case "period":
      if (!data.period.startDate) errors.push("Start date is required");
      if (!data.period.endDate) errors.push("End date is required");
      if (data.period.startDate && data.period.endDate) {
        const start = new Date(`${data.period.startDate}T${data.period.startTime}`);
        const end = new Date(`${data.period.endDate}T${data.period.endTime}`);
        if (end <= start) errors.push("End date must be after start date");
      }
      break;

    case "rules":
      // All optional
      break;

    case "rewards":
      if (data.hasRewards && data.rewards.length === 0) {
        errors.push("Add at least one reward or disable rewards");
      }
      data.rewards.forEach((r, i) => {
        if (!r.title.trim()) errors.push(`Reward ${i + 1}: name is required`);
        if (r.items.length === 0) errors.push(`Reward ${i + 1}: add at least one item`);
      });
      break;

    case "preview":
      // No validation needed
      break;

    case "review":
      // Run all validations
      const allSteps: StepId[] = ["scope", "locations", "details", "audience", "participation", "funding", "period", "rules", "rewards"];
      for (const s of allSteps) {
        const result = validateStep(s, data);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
      break;
  }

  return { valid: errors.length === 0, errors, warnings };
}
