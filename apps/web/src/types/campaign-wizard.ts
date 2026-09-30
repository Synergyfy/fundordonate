// =============================================================================
// Campaign Wizard Types
// Shared types for the admin campaign creation/editing wizard.
// 25-step configurable campaign builder.
// =============================================================================

// ── Wizard Step IDs ──

export type StepId =
  | "campaign_type"
  | "locations"
  | "season"
  | "details"
  | "objective"
  | "target"
  | "activation"
  | "dates"
  | "audience"
  | "participation"
  | "contribution_rules"
  | "allocation"
  | "backer_rules"
  | "founding_member_rules"
  | "group_rules"
  | "rewards"
  | "leaderboard"
  | "terms"
  | "preview";

export interface StepDef {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: string;
  category: string;
}

export const WIZARD_STEPS: StepDef[] = [
  { id: "campaign_type", label: "Campaign Type", shortLabel: "Type", icon: "Tag", category: "Setup" },
  { id: "locations", label: "Location Coverage", shortLabel: "Locations", icon: "MapPin", category: "Setup" },
  { id: "season", label: "Season & Programme", shortLabel: "Season", icon: "Calendar", category: "Setup" },
  { id: "details", label: "Campaign Details", shortLabel: "Details", icon: "FileText", category: "Content" },
  { id: "objective", label: "Campaign Objective", shortLabel: "Objective", icon: "Target", category: "Content" },
  { id: "target", label: "Funding Target", shortLabel: "Target", icon: "Pound", category: "Funding" },
  { id: "activation", label: "Activation Rules", shortLabel: "Activation", icon: "Zap", category: "Funding" },
  { id: "dates", label: "Campaign Schedule", shortLabel: "Dates", icon: "Clock", category: "Schedule" },
  { id: "audience", label: "Audience", shortLabel: "Audience", icon: "Users", category: "Participation" },
  { id: "participation", label: "Participation Methods", shortLabel: "Participation", icon: "HandHeart", category: "Participation" },
  { id: "contribution_rules", label: "Contribution Rules", shortLabel: "Contributions", icon: "Calculator", category: "Funding" },
  { id: "allocation", label: "Funding Allocation", shortLabel: "Allocation", icon: "PieChart", category: "Funding" },
  { id: "backer_rules", label: "Backer Rules", shortLabel: "Backers", icon: "Shield", category: "Participation" },
  { id: "founding_member_rules", label: "Founding Member Rules", shortLabel: "Founding", icon: "Crown", category: "Participation" },
  { id: "group_rules", label: "Group Funding Rules", shortLabel: "Groups", icon: "Users", category: "Participation" },
  { id: "rewards", label: "Rewards", shortLabel: "Rewards", icon: "Gift", category: "Rewards" },
  { id: "leaderboard", label: "Leaderboard", shortLabel: "Leaderboard", icon: "Trophy", category: "Rewards" },
  { id: "terms", label: "Terms & Conditions", shortLabel: "Terms", icon: "Scroll", category: "Legal" },
  { id: "preview", label: "Preview & Publish", shortLabel: "Preview", icon: "Eye", category: "Publishing" },
];

// ── Campaign Types ──

export type CampaignType =
  | "national_hub"
  | "city_hub"
  | "local_area"
  | "high_street"
  | "business"
  | "mcom_programme"
  | "mall"
  | "vcard"
  | "brand_identity"
  | "community_event"
  | "other";

export const CAMPAIGN_TYPE_OPTIONS: { value: CampaignType; label: string; description: string; icon: string }[] = [
  { value: "national_hub", label: "National Hub", description: "Campaign for the UK National Hub programme", icon: "🇬🇧" },
  { value: "city_hub", label: "City Hub", description: "Campaign for a specific city hub activation", icon: "🏙️" },
  { value: "local_area", label: "Local Area / Borough", description: "Campaign for a local area or borough", icon: "🏘️" },
  { value: "high_street", label: "High Street", description: "Campaign for a specific high street", icon: "🛒" },
  { value: "business", label: "Business Campaign", description: "Campaign for a specific business", icon: "🏢" },
  { value: "mcom_programme", label: "MCOM Programme", description: "MCOM/247 GBS programme campaign", icon: "📡" },
  { value: "mall", label: "Mall", description: "Campaign for a shopping mall", icon: "🏬" },
  { value: "vcard", label: "VCard", description: "VCard-related campaign", icon: "💳" },
  { value: "brand_identity", label: "Brand Identity", description: "Brand identity campaign", icon: "🎨" },
  { value: "community_event", label: "Community Event", description: "Community event campaign", icon: "🎉" },
  { value: "other", label: "Other", description: "Other approved programme", icon: "📋" },
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

export interface LocationTreeBusiness extends LocationTreeNode {
  type: "BUSINESS";
}

export interface LocationTreeHighStreet extends LocationTreeNode {
  type: "HIGH_STREET";
  businesses: LocationTreeBusiness[];
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
  national: LocationTreeNode | null;
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

// ── Location Coverage Selection (Multi-City + Full Hierarchy) ──

export interface LocationCoverage {
  includeNational: boolean;
  selectedCities: string[];
  excludedCities: string[];
  selectedLocalAreas: string[];
  excludedLocalAreas: string[];
  selectedHighStreets: string[];
  excludedHighStreets: string[];
  selectedBusinesses: string[];
  excludedBusinesses: string[];
}

// ── Season / Programme ──

export interface SeasonOption {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

// ── Activation Rules ──

export interface ActivationRules {
  activationAmount: string;
  activationPercentage: string;
  stages: ActivationStage[];
}

export interface ActivationStage {
  id: string;
  name: string;
  thresholdType: "amount" | "percentage";
  thresholdValue: string;
}

// ── Participation Methods ──

export interface ParticipationConfig {
  backCampaign: boolean;
  foundingMember: boolean;
  foundingMemberMonthly: boolean;
  donateContribute: boolean;
}

// ── Contribution Rules ──

export interface ContributionRules {
  minContribution: string;
  maxContribution: string;
  suggestedAmounts: string[];
  allowCustomAmount: boolean;
  contributionTypes: ContributionType[];
}

export type ContributionType = "money" | "product" | "service" | "other";

// ── Allocation Rules ──

export interface AllocationRules {
  enabled: boolean;
  required: boolean;
  destinations: AllocationDestination[];
  minAllocation: string;
  maxDestinations: string;
  allowSplit: boolean;
}

export interface AllocationDestination {
  id: string;
  type: "city" | "local_area" | "high_street" | "connected_campaign" | "custom";
  locationId: string;
  name: string;
  description?: string;
  percentage?: string;
  fixedAmount?: string;
}

// ── Backer Rules ──

export interface BackerRules {
  enabled: boolean;
  allowWholeCampaign: boolean;
  allowPercentage: boolean;
  allowFundingRequirement: boolean;
  minBackerAmount: string;
  maxBackers: string;
  backerBenefits: string;
}

// ── Founding Member Rules ──

export interface FoundingMemberRules {
  enabled: boolean;
  maxFoundingMembers: string;
  contributionRequired: string;
  privileges: string;
  campaignLocationAssociation: boolean;
  foundingMonthlyEnabled: boolean;
  foundingMonthlyContribution: string;
}

// ── Group Rules ──

export interface GroupRules {
  enabled: boolean;
  minGroupSize: string;
  maxGroupSize: string;
  groupContributionRules: string;
  groupTarget: string;
  groupBenefits: string;
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
  triggerType: "contribution" | "membership" | "founding_monthly" | "backer" | "first_n" | "top_n" | "leaderboard";
  triggerConfig: {
    mode: "min" | "range" | "exact";
    min?: number;
    max?: number;
    exact?: number;
    count?: number;
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

// ── Leaderboard ──

export interface LeaderboardConfig {
  enabled: boolean;
  rankingMethod: "contribution_amount" | "number_of_contributions" | "participation";
  rankingPeriod: "campaign" | "weekly" | "monthly";
  numberOfWinners: string;
  qualificationRules: string;
  displayRules: string;
  prizes: LeaderboardPrize[];
}

export interface LeaderboardPrize {
  id: string;
  position: string;
  positionRange: string;
  prizeDescription: string;
}

// ── Terms ──

export interface TermsConfig {
  campaignTerms: string;
  contributionTerms: string;
  rewardTerms: string;
  claimTerms: string;
  allocationTerms: string;
  refundCancellation: string;
  customConditions: string;
}

// ── Approval Rules ──

export type ApprovalMode = "automatic" | "manual" | "flagged_review";

export interface ApprovalConfig {
  mode: ApprovalMode;
  autoApproveCriteria: string;
  flaggedCriteria: string[];
  reviewerNotes: string;
}

// ── Stretch Targets ──

export interface StretchTarget {
  id: string;
  name: string;
  amount: string;
}

// ── Campaign Wizard Data (Full State — 25 Steps) ──

export interface CampaignWizardData {
  // Step 1 — Campaign Type
  campaignType: CampaignType;

  // Step 2 — Scope
  scope: "city" | "independent";
  citySlug: string;
  cityName: string;
  cityId: string;

  // Step 3 — Location Coverage
  locationCoverage: LocationCoverage;

  // Step 4 — Season / Programme
  seasonIds: string[];
  programmeName: string;

  // Step 5 — Details
  title: string;
  campaignCode: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  featuredImage: string;
  additionalImages: string[];
  videoUrl: string;

  // Step 6 — Objective
  objective: string;
  objectiveDetails: string;

  // Step 7 — Target
  hasTarget: boolean;
  targetAmount: string;
  startingAmount: string;
  stretchTargets: StretchTarget[];

  // Step 8 — Activation Rules
  activationRules: ActivationRules;

  // Step 9 — Dates
  periodMode: "season" | "custom" | "evergreen";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isEvergreen: boolean;

  // Step 10 — Audience
  audience: "business" | "consumer" | "both";

  // Step 11 — Participation
  participation: ParticipationConfig;

  // Step 12 — Contribution Rules
  contributionRules: ContributionRules;

  // Step 13 — Allocation Rules
  allocationRules: AllocationRules;

  // Step 14 — Backer Rules
  backerRules: BackerRules;

  // Step 15 — Founding Member Rules
  foundingMemberRules: FoundingMemberRules;

  // Step 16 — Group Rules
  groupRules: GroupRules;

  // Step 17 — Rewards
  rewards: CampaignReward[];
  qualificationMode: "highest" | "cumulative";
  hasRewards: boolean;

  // Step 18 — Leaderboard
  leaderboard: LeaderboardConfig;

  // Step 19 — Terms
  terms: TermsConfig;

  // Step 20 — Approval
  approval: ApprovalConfig;

  // Meta
  status: CampaignStatus;
  currentStep: StepId;
}

// ── Campaign Status ──

export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "changes_required"
  | "scheduled"
  | "inactive"
  | "making_progress"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  changes_required: "Changes Required",
  scheduled: "Scheduled",
  inactive: "Inactive",
  making_progress: "Making Progress",
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
  inactive: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  making_progress: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-400" },
  active: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-400" },
  paused: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-400" },
  completed: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-400" },
  archived: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-400" },
};

// ── Default Wizard Data ──

export function createDefaultWizardData(): CampaignWizardData {
  return {
    // Step 1 — Campaign Type (city / independent)
    campaignType: "city_hub",
    scope: "city",
    citySlug: "",
    cityName: "",
    cityId: "",

    // Step 3
    locationCoverage: {
      includeNational: false,
      selectedCities: [],
      excludedCities: [],
      selectedLocalAreas: [],
      excludedLocalAreas: [],
      selectedHighStreets: [],
      excludedHighStreets: [],
      selectedBusinesses: [],
      excludedBusinesses: [],
    },

    // Step 4
    seasonIds: [],
    programmeName: "",

    // Step 5
    title: "",
    campaignCode: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    featuredImage: "",
    additionalImages: [],
    videoUrl: "",

    // Step 6
    objective: "",
    objectiveDetails: "",

    // Step 7
    hasTarget: true,
    targetAmount: "",
    startingAmount: "0",
    stretchTargets: [],

    // Step 8
    activationRules: {
      activationAmount: "",
      activationPercentage: "",
      stages: [
        { id: "stage-1", name: "Inactive", thresholdType: "amount", thresholdValue: "0" },
        { id: "stage-2", name: "Making Progress", thresholdType: "percentage", thresholdValue: "30" },
        { id: "stage-3", name: "Active / Live", thresholdType: "percentage", thresholdValue: "100" },
      ],
    },

    // Step 9
    periodMode: "season",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    isEvergreen: false,

    // Step 10
    audience: "both",

    // Step 11
    participation: {
      backCampaign: true,
      foundingMember: false,
      foundingMemberMonthly: false,
      donateContribute: true,
    },

    // Step 12
    contributionRules: {
      minContribution: "",
      maxContribution: "",
      suggestedAmounts: ["10", "25", "50", "100", "250"],
      allowCustomAmount: true,
      contributionTypes: ["money"],
    },

    // Step 13
    allocationRules: {
      enabled: false,
      required: false,
      destinations: [],
      minAllocation: "",
      maxDestinations: "",
      allowSplit: true,
    },

    // Step 14
    backerRules: {
      enabled: true,
      allowWholeCampaign: true,
      allowPercentage: true,
      allowFundingRequirement: true,
      minBackerAmount: "",
      maxBackers: "",
      backerBenefits: "",
    },

    // Step 15
    foundingMemberRules: {
      enabled: false,
      maxFoundingMembers: "",
      contributionRequired: "",
      privileges: "",
      campaignLocationAssociation: false,
      foundingMonthlyEnabled: false,
      foundingMonthlyContribution: "",
    },

    // Step 16
    groupRules: {
      enabled: false,
      minGroupSize: "",
      maxGroupSize: "",
      groupContributionRules: "",
      groupTarget: "",
      groupBenefits: "",
    },

    // Step 17
    rewards: [],
    qualificationMode: "highest",
    hasRewards: false,

    // Step 18
    leaderboard: {
      enabled: false,
      rankingMethod: "contribution_amount",
      rankingPeriod: "campaign",
      numberOfWinners: "",
      qualificationRules: "",
      displayRules: "",
      prizes: [],
    },

    // Step 19
    terms: {
      campaignTerms: "",
      contributionTerms: "",
      rewardTerms: "",
      claimTerms: "",
      allocationTerms: "",
      refundCancellation: "",
      customConditions: "",
    },

    // Step 20
    approval: {
      mode: "flagged_review",
      autoApproveCriteria: "",
      flaggedCriteria: [],
      reviewerNotes: "",
    },

    // Meta
    status: "draft",
    currentStep: "campaign_type",
  };
}

// ── Step Validation ──

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string>;
}

export function validateStep(step: StepId, data: CampaignWizardData): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: Record<string, string> = {};

  switch (step) {
    case "campaign_type":
      if (!data.scope) {
        errors.push("Please select a campaign type");
        fieldErrors.scope = "Campaign type is required";
      }
      if (data.scope === "city" && !data.citySlug) {
        errors.push("Please select a city");
        fieldErrors.citySlug = "Please select a city";
      }
      break;

    case "locations": {
      const lc = data.locationCoverage;
      const hasAny = lc.includeNational || lc.selectedCities.length > 0 || lc.selectedLocalAreas.length > 0 || lc.selectedHighStreets.length > 0 || lc.selectedBusinesses.length > 0;
      if (!hasAny) {
        errors.push("Select at least one location for this campaign");
        fieldErrors.locations = "At least one location is required";
      }
      break;
    }

    case "season":
      if (data.seasonIds.length === 0 && !data.isEvergreen) warnings.push("No season selected");
      break;

    case "details":
      if (!data.title.trim()) {
        errors.push("Campaign name is required");
        fieldErrors.title = "Campaign name is required";
      }
      if (!data.shortDescription.trim()) {
        errors.push("Short description is required");
        fieldErrors.shortDescription = "Short description is required";
      }
      if (!data.featuredImage) warnings.push("No campaign image uploaded");
      break;

    case "objective":
      if (!data.objective.trim()) {
        errors.push("Campaign objective is required");
        fieldErrors.objective = "Campaign objective is required";
      }
      break;

    case "target":
      if (data.hasTarget) {
        if (!data.targetAmount || Number(data.targetAmount) <= 0) {
          errors.push("Funding target must be greater than 0");
          fieldErrors.targetAmount = "Funding target must be greater than 0";
        }
      }
      break;

    case "activation":
      if (data.activationRules.stages.length < 2) {
        errors.push("At least two activation stages are required");
        fieldErrors.activationStages = "At least two activation stages are required";
      }
      break;

    case "dates":
      if (data.periodMode === "custom") {
        if (!data.startDate) {
          errors.push("Start date is required");
          fieldErrors.startDate = "Start date is required";
        }
        if (!data.endDate) {
          errors.push("End date is required");
          fieldErrors.endDate = "End date is required";
        }
        if (data.startDate && data.endDate) {
          const start = new Date(`${data.startDate}T${data.startTime || "00:00"}`);
          const end = new Date(`${data.endDate}T${data.endTime || "23:59"}`);
          if (end <= start) {
            errors.push("End date must be after start date");
            fieldErrors.endDate = "End date must be after start date";
          }
        }
      }
      break;

    case "audience":
      if (!data.audience) {
        errors.push("Please select an audience");
        fieldErrors.audience = "Please select an audience";
      }
      break;

    case "participation": {
      const p = data.participation;
      if (!p.backCampaign && !p.foundingMember && !p.foundingMemberMonthly && !p.donateContribute) {
        errors.push("Enable at least one participation method");
        fieldErrors.participation = "Enable at least one participation method";
      }
      break;
    }

    case "contribution_rules":
      if (!data.contributionRules.minContribution || Number(data.contributionRules.minContribution) <= 0) {
        errors.push("Minimum contribution must be greater than 0");
        fieldErrors.minContribution = "Minimum contribution must be greater than 0";
      }
      break;

    case "allocation":
      if (data.allocationRules.enabled && data.allocationRules.destinations.length === 0) {
        errors.push("Add at least one allocation destination");
        fieldErrors.allocationDestinations = "Add at least one allocation destination";
      }
      break;

    case "backer_rules":
      if (data.backerRules.enabled && !data.backerRules.minBackerAmount) {
        warnings.push("Consider setting a minimum backer amount");
      }
      break;

    case "founding_member_rules":
      if (data.foundingMemberRules.enabled && !data.foundingMemberRules.maxFoundingMembers) {
        warnings.push("Consider setting a maximum number of founding members");
      }
      break;

    case "group_rules":
      if (data.groupRules.enabled) {
        if (!data.groupRules.minGroupSize) {
          errors.push("Minimum group size is required");
          fieldErrors.minGroupSize = "Minimum group size is required";
        }
        if (!data.groupRules.maxGroupSize) {
          errors.push("Maximum group size is required");
          fieldErrors.maxGroupSize = "Maximum group size is required";
        }
      }
      break;

    case "rewards":
      if (data.hasRewards && data.rewards.length === 0) {
        errors.push("Add at least one reward or disable rewards");
        fieldErrors.rewards = "Add at least one reward or disable rewards";
      }
      data.rewards.forEach((r, i) => {
        if (!r.title.trim()) {
          errors.push(`Reward ${i + 1}: name is required`);
          fieldErrors[`reward_${i}_title`] = "Reward name is required";
        }
        if (r.items.length === 0) {
          errors.push(`Reward ${i + 1}: add at least one item`);
          fieldErrors[`reward_${i}_items`] = "Add at least one reward item";
        }
      });
      break;

    case "leaderboard":
      if (data.leaderboard.enabled && !data.leaderboard.numberOfWinners) {
        warnings.push("Consider setting the number of leaderboard winners");
      }
      break;

    case "terms":
      if (!data.terms.campaignTerms.trim()) warnings.push("Campaign terms are recommended");
      break;

    case "preview":
      break;
  }

  return { valid: errors.length === 0, errors, warnings, fieldErrors };
}
