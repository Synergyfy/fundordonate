// =============================================================================
// Campaign Wizard Settings
// Shared helpers for the configuration authored by the admin campaign wizard.
//
// The wizard persists its full state on `BusinessCampaign.settings` as JSON.
// This module is the single source of truth for validating those settings and
// for enforcing the rules they describe when money moves (payments) or when
// rewards/leaderboards are evaluated.
// =============================================================================

import { BadRequestException } from "@nestjs/common";

// ── Raw wizard setting shapes ────────────────────────────────────────────────

export interface WizardLocationCoverage {
  includeNational?: boolean;
  selectedCities?: string[];
  excludedCities?: string[];
  selectedLocalAreas?: string[];
  excludedLocalAreas?: string[];
  selectedHighStreets?: string[];
  excludedHighStreets?: string[];
  selectedBusinesses?: string[];
  excludedBusinesses?: string[];
}

export interface WizardParticipation {
  backCampaign?: boolean;
  foundingMember?: boolean;
  foundingMemberMonthly?: boolean;
  donateContribute?: boolean;
}

export interface WizardContributionRules {
  minContribution?: string;
  maxContribution?: string;
  suggestedAmounts?: string[];
  allowCustomAmount?: boolean;
  contributionTypes?: string[];
}

export interface WizardAllocationDestination {
  id?: string;
  type?: string;
  locationId?: string;
  name?: string;
  description?: string;
  percentage?: string;
  fixedAmount?: string;
}

export interface WizardAllocationRules {
  enabled?: boolean;
  required?: boolean;
  destinations?: WizardAllocationDestination[];
  minAllocation?: string;
  maxDestinations?: string;
  allowSplit?: boolean;
}

export interface WizardBackerRules {
  enabled?: boolean;
  allowWholeCampaign?: boolean;
  allowPercentage?: boolean;
  allowFundingRequirement?: boolean;
  minBackerAmount?: string;
  maxBackers?: string;
  backerBenefits?: string;
}

export interface WizardFoundingMemberRules {
  enabled?: boolean;
  maxFoundingMembers?: string;
  contributionRequired?: string;
  privileges?: string;
  campaignLocationAssociation?: boolean;
  foundingMonthlyEnabled?: boolean;
  foundingMonthlyContribution?: string;
}

export interface WizardGroupRules {
  enabled?: boolean;
  minGroupSize?: string;
  maxGroupSize?: string;
  groupContributionRules?: string;
  groupTarget?: string;
  groupBenefits?: string;
}

export interface WizardRewardTriggerConfig {
  mode?: "min" | "range" | "exact";
  min?: number;
  max?: number;
  exact?: number;
  count?: number;
  minQualification?: number;
}

export interface WizardRewardItem {
  id?: string;
  title?: string;
  description?: string;
  physicalType?: string;
  value?: string;
  currency?: string;
  assetType?: string;
  assetUrl?: string;
  order?: number;
  fulfilmentType?: string;
  fulfilmentConfig?: Record<string, unknown>;
}

export interface WizardReward {
  id?: string;
  title?: string;
  description?: string;
  order?: number;
  audience?: string;
  triggerType?: string;
  triggerConfig?: WizardRewardTriggerConfig;
  quantityType?: "unlimited" | "limited";
  quantityLimit?: number | null;
  claimDeadlineDays?: number;
  fulfilmentType?: string;
  fulfilmentConfig?: Record<string, unknown>;
  qualificationPeriod?: string;
  expiryDays?: number;
  items?: WizardRewardItem[];
}

export interface WizardLeaderboardPrize {
  id?: string;
  position?: string;
  positionRange?: string;
  prizeDescription?: string;
}

export interface WizardLeaderboard {
  enabled?: boolean;
  rankingMethod?: "contribution_amount" | "number_of_contributions" | "participation";
  rankingPeriod?: "campaign" | "weekly" | "monthly";
  numberOfWinners?: string;
  qualificationRules?: string;
  displayRules?: string;
  prizes?: WizardLeaderboardPrize[];
}

export interface CampaignWizardSettings {
  campaignCode?: string;
  campaignType?: string;
  scope?: "city" | "independent";
  cityId?: string;
  citySlug?: string;
  cityName?: string;
  locationCoverage?: WizardLocationCoverage;
  seasonIds?: string[];
  programmeName?: string;
  objective?: string;
  objectiveDetails?: string;
  hasTarget?: boolean;
  startingAmount?: string;
  startingAmountPence?: number;
  stretchTargets?: { id?: string; name?: string; amount?: string }[];
  periodMode?: "season" | "custom" | "evergreen";
  isEvergreen?: boolean;
  additionalImages?: string[];
  videoUrl?: string;
  participation?: WizardParticipation;
  contributionRules?: WizardContributionRules;
  allocationRules?: WizardAllocationRules;
  backerRules?: WizardBackerRules;
  foundingMemberRules?: WizardFoundingMemberRules;
  groupRules?: WizardGroupRules;
  rewards?: WizardReward[];
  hasRewards?: boolean;
  qualificationMode?: "highest" | "cumulative";
  leaderboard?: WizardLeaderboard;
  terms?: Record<string, string>;
  approval?: {
    mode?: string;
    autoApproveCriteria?: string;
    flaggedCriteria?: string[];
    reviewerNotes?: string;
  };
  /** Normalised reward rules consumed by the reward engine. */
  rewardConfigs?: StoredCampaignRewardConfig[];
  [key: string]: unknown;
}

export interface StoredCampaignRewardCondition {
  mode?: string;
  minPence?: number | null;
  maxPence?: number | null;
  exactPence?: number | null;
}

export interface StoredCampaignRewardConfig {
  id: string;
  name: string;
  description?: string;
  rule?: string;
  source: "fundordonate";
  order: number;
  audience?: string;
  qualificationMode?: string;
  triggerType?: string;
  triggerConfig?: WizardRewardTriggerConfig;
  conditions: StoredCampaignRewardCondition[];
  quantityType?: string;
  quantityLimit?: number | null;
  claimDeadlineDays?: number;
  expiryDays?: number;
  qualificationPeriod?: string;
  fulfilmentType?: string;
  fulfilmentConfig?: Record<string, unknown>;
  items: WizardRewardItem[];
}

// ── Primitive helpers ────────────────────────────────────────────────────────

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Recursively drop `undefined` values so the result is valid JSON. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)]),
    ) as T;
  }
  return value;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Parse a wizard money value (pounds) into integer pence. */
export function toPence(
  value: unknown,
  field: string,
  options: { required?: boolean; min?: number; max?: number } = {},
): number | null {
  if (value === undefined || value === null || value === "") {
    if (options.required) {
      throw new BadRequestException(`${field} is required`);
    }
    return null;
  }

  const pounds = asNumber(value);
  if (pounds === undefined) {
    throw new BadRequestException(`${field} must be a valid amount`);
  }

  const pence = Math.round(pounds * 100);
  if (options.min !== undefined && pence < options.min) {
    throw new BadRequestException(`${field} must be at least ${options.min / 100}`);
  }
  if (options.max !== undefined && pence > options.max) {
    throw new BadRequestException(`${field} must be at most ${options.max / 100}`);
  }
  return pence;
}

/** Parse an integer count value. */
export function toCount(
  value: unknown,
  field: string,
  options: { required?: boolean; min?: number } = {},
): number | null {
  if (value === undefined || value === null || value === "") {
    if (options.required) {
      throw new BadRequestException(`${field} is required`);
    }
    return null;
  }
  const parsed = asNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed)) {
    throw new BadRequestException(`${field} must be a whole number`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new BadRequestException(`${field} must be at least ${options.min}`);
  }
  return parsed;
}

// ── Settings getters ─────────────────────────────────────────────────────────

/** Read settings defensively without validating. */
export function getCampaignWizardSettings(raw: unknown): CampaignWizardSettings {
  return asObject(raw) as CampaignWizardSettings;
}

/** Reward rules stored on the campaign, falling back to the legacy key. */
export function getCampaignRewardConfigs(raw: unknown): StoredCampaignRewardConfig[] {
  const settings = getCampaignWizardSettings(raw);
  if (Array.isArray(settings.rewardConfigs)) {
    return settings.rewardConfigs.filter(
      (reward): reward is StoredCampaignRewardConfig =>
        !!reward && typeof reward === "object" && typeof reward.name === "string",
    );
  }
  return [];
}

function normaliseReward(
  input: unknown,
  index: number,
  qualificationMode: string | undefined,
  strict: boolean,
): StoredCampaignRewardConfig | null {
  const reward = asObject(input);
  const title = asString(reward.title) ?? asString(reward.name);
  if (!title) {
    if (strict) {
      throw new BadRequestException(`Rewards[${index}]: title is required`);
    }
    return null;
  }

  const items = Array.isArray(reward.items)
    ? (reward.items.filter((item) => item && typeof item === "object") as WizardRewardItem[])
    : [];
  if (strict && items.length === 0) {
    throw new BadRequestException(`Rewards[${index}]: add at least one reward item`);
  }

  const trigger = asObject(reward.triggerConfig);
  const mode = asString(trigger.mode) ?? "min";
  if (!["min", "range", "exact"].includes(mode)) {
    throw new BadRequestException(`Rewards[${index}]: invalid trigger mode`);
  }

  const condition: StoredCampaignRewardCondition = { mode };
  if (mode === "min") {
    condition.minPence = toPence(trigger.min, `Rewards[${index}].min`, { min: 0 });
  } else if (mode === "range") {
    condition.minPence = toPence(trigger.min, `Rewards[${index}].min`, { min: 0 });
    condition.maxPence = toPence(trigger.max, `Rewards[${index}].max`, { min: 0 });
    if (
      condition.minPence !== null &&
      condition.maxPence !== null &&
      condition.maxPence < condition.minPence
    ) {
      throw new BadRequestException(`Rewards[${index}]: max must be greater than min`);
    }
  } else {
    condition.exactPence = toPence(trigger.exact, `Rewards[${index}].exact`, { min: 0 });
  }
  // No threshold configured means the reward is unconditional (issued on any
  // qualifying contribution) rather than never matching.
  const hasThreshold =
    condition.minPence != null || condition.maxPence != null || condition.exactPence != null;

  const quantityType = asString(reward.quantityType) ?? "unlimited";
  if (!["unlimited", "limited"].includes(quantityType)) {
    throw new BadRequestException(`Rewards[${index}]: invalid quantity type`);
  }
  let quantityLimit: number | null = null;
  if (quantityType === "limited") {
    quantityLimit = toCount(reward.quantityLimit, `Rewards[${index}].quantityLimit`, {
      required: strict,
      min: 1,
    });
  }

  return {
    id: asString(reward.id) ?? `reward-${index + 1}`,
    name: title,
    description: asString(reward.description),
    source: "fundordonate",
    order: asNumber(reward.order) ?? index,
    audience: asString(reward.audience),
    qualificationMode,
    triggerType: asString(reward.triggerType),
    triggerConfig: trigger as WizardRewardTriggerConfig,
    conditions: hasThreshold ? [condition] : [],
    quantityType,
    quantityLimit,
    claimDeadlineDays: toCount(reward.claimDeadlineDays, `Rewards[${index}].claimDeadlineDays`, {
      min: 0,
    }) ?? undefined,
    expiryDays: toCount(reward.expiryDays, `Rewards[${index}].expiryDays`, { min: 0 }) ?? undefined,
    qualificationPeriod: asString(reward.qualificationPeriod),
    fulfilmentType: asString(reward.fulfilmentType),
    fulfilmentConfig:
      reward.fulfilmentConfig && typeof reward.fulfilmentConfig === "object"
        ? (reward.fulfilmentConfig as Record<string, unknown>)
        : undefined,
    items,
  };
}

/**
 * Validate and normalise the wizard settings stored on a campaign.
 * Throws `BadRequestException` with a user-facing message on the first error.
 */
export function normaliseCampaignWizardSettings(
  raw: unknown,
  targetPence: number,
  options: { strict?: boolean } = {},
): CampaignWizardSettings {
  const strict = options.strict !== false;
  const input = asObject(raw);
  const settings: CampaignWizardSettings = { ...input } as CampaignWizardSettings;

  // Simple strings / arrays
  settings.campaignCode = asString(input.campaignCode);
  settings.campaignType = asString(input.campaignType);
  settings.scope = input.scope === "independent" ? "independent" : "city";
  settings.cityId = asString(input.cityId);
  settings.citySlug = asString(input.citySlug);
  settings.cityName = asString(input.cityName);
  settings.programmeName = asString(input.programmeName);
  settings.objective = asString(input.objective);
  settings.objectiveDetails = asString(input.objectiveDetails);
  settings.seasonIds = asStringArray(input.seasonIds) ?? [];
  settings.additionalImages = asStringArray(input.additionalImages) ?? [];
  settings.videoUrl = asString(input.videoUrl);
  settings.hasTarget = input.hasTarget !== false;
  settings.startingAmount = asString(input.startingAmount) ?? "0";
  settings.startingAmountPence =
    toPence(input.startingAmount, "Starting amount", { min: 0 }) ?? 0;
  settings.periodMode =
    input.periodMode === "season" || input.periodMode === "evergreen"
      ? input.periodMode
      : "custom";
  settings.isEvergreen = input.isEvergreen === true || settings.periodMode === "evergreen";
  settings.qualificationMode = input.qualificationMode === "cumulative" ? "cumulative" : "highest";

  // A target is only mandatory when the admin enabled one.
  if (strict && settings.hasTarget && targetPence <= 0) {
    throw new BadRequestException("Funding target must be greater than 0");
  }
  if (strict && !settings.objective) {
    throw new BadRequestException("Campaign objective is required");
  }
  if (targetPence < 0) {
    throw new BadRequestException("Funding target cannot be negative");
  }

  // Location coverage is kept verbatim but normalised to arrays of ids.
  const coverage = asObject(input.locationCoverage);
  settings.locationCoverage = {
    includeNational: coverage.includeNational === true,
    selectedCities: asStringArray(coverage.selectedCities) ?? [],
    excludedCities: asStringArray(coverage.excludedCities) ?? [],
    selectedLocalAreas: asStringArray(coverage.selectedLocalAreas) ?? [],
    excludedLocalAreas: asStringArray(coverage.excludedLocalAreas) ?? [],
    selectedHighStreets: asStringArray(coverage.selectedHighStreets) ?? [],
    excludedHighStreets: asStringArray(coverage.excludedHighStreets) ?? [],
    selectedBusinesses: asStringArray(coverage.selectedBusinesses) ?? [],
    excludedBusinesses: asStringArray(coverage.excludedBusinesses) ?? [],
  };

  // Stretch targets (pounds strings)
  settings.stretchTargets = Array.isArray(input.stretchTargets)
    ? input.stretchTargets
        .filter((target) => target && typeof target === "object")
        .map((target) => {
          const item = asObject(target);
          return {
            id: asString(item.id),
            name: asString(item.name),
            amount: asString(item.amount),
          };
        })
    : [];

  // ── Participation ──────────────────────────────────────────────────────────
  const participation = asObject(input.participation);
  settings.participation = {
    backCampaign: participation.backCampaign !== false,
    foundingMember: participation.foundingMember === true,
    foundingMemberMonthly: participation.foundingMemberMonthly === true,
    donateContribute: participation.donateContribute !== false,
  };
  if (
    strict &&
    !settings.participation.backCampaign &&
    !settings.participation.foundingMember &&
    !settings.participation.foundingMemberMonthly &&
    !settings.participation.donateContribute
  ) {
    throw new BadRequestException("Enable at least one participation method");
  }

  // ── Contribution rules ─────────────────────────────────────────────────────
  const contribution = asObject(input.contributionRules);
  const minContribution = toPence(contribution.minContribution, "Minimum contribution", {
    required: strict,
    min: strict ? 1 : 0,
  });
  const maxContribution = toPence(contribution.maxContribution, "Maximum contribution", {
    min: strict ? minContribution ?? 0 : 0,
  });
  const suggestedAmounts = Array.isArray(contribution.suggestedAmounts)
    ? contribution.suggestedAmounts
        .map((amount, index) =>
          toPence(amount, `Suggested amount ${index + 1}`, { min: 1 }),
        )
        .filter((amount): amount is number => amount !== null)
    : [];
  if (strict) {
    for (const amount of suggestedAmounts) {
      if (minContribution !== null && amount < minContribution) {
        throw new BadRequestException("Suggested amounts cannot be below the minimum contribution");
      }
      if (maxContribution !== null && amount > maxContribution) {
        throw new BadRequestException("Suggested amounts cannot exceed the maximum contribution");
      }
    }
  }
  const allowCustomAmount = contribution.allowCustomAmount !== false;
  if (strict && !allowCustomAmount && suggestedAmounts.length === 0) {
    throw new BadRequestException("Add at least one suggested amount when custom amounts are disabled");
  }
  const contributionTypes = asStringArray(contribution.contributionTypes) ?? ["money"];
  if (strict && contributionTypes.length === 0) {
    throw new BadRequestException("Select at least one contribution type");
  }
  if (strict && contributionTypes.length > 0 && !contributionTypes.includes("money")) {
    throw new BadRequestException("Money must be an accepted contribution type for a monetary campaign");
  }
  settings.contributionRules = {
    minContribution: String((minContribution ?? 0) / 100),
    maxContribution: maxContribution !== null ? String(maxContribution / 100) : "",
    suggestedAmounts: suggestedAmounts.map((amount) => String(amount / 100)),
    allowCustomAmount,
    contributionTypes,
  };

  // ── Allocation rules ───────────────────────────────────────────────────────
  const allocation = asObject(input.allocationRules);
  const allocationEnabled = allocation.enabled === true;
  const destinations = Array.isArray(allocation.destinations)
    ? allocation.destinations
        .filter((destination) => destination && typeof destination === "object")
        .map((destination, index) => {
          const item = asObject(destination);
          const name = asString(item.name);
          if (!name && strict) {
            throw new BadRequestException(`Allocation destination ${index + 1}: name is required`);
          }
          const percentage = toPence(item.percentage, `Allocation destination ${index + 1} percentage`, {
            min: 0,
            max: 10000,
          });
          const fixedAmount = toPence(item.fixedAmount, `Allocation destination ${index + 1} fixed amount`, {
            min: 0,
          });
          return {
            id: asString(item.id) ?? `destination-${index + 1}`,
            type: asString(item.type) ?? "custom",
            locationId: asString(item.locationId),
            name,
            description: asString(item.description),
            percentage: percentage !== null ? String(percentage / 100) : "",
            fixedAmount: fixedAmount !== null ? String(fixedAmount / 100) : "",
          };
        })
    : [];
  if (strict && allocationEnabled && destinations.length === 0) {
    throw new BadRequestException("Add at least one allocation destination");
  }
  const totalPercentage = destinations.reduce(
    (total, destination) => total + Number(destination.percentage || 0),
    0,
  );
  if (totalPercentage > 100) {
    throw new BadRequestException("Allocation percentages cannot exceed 100%");
  }
  settings.allocationRules = {
    enabled: allocationEnabled,
    required: allocation.required === true,
    destinations,
    minAllocation: String(
      (toPence(allocation.minAllocation, "Minimum allocation", { min: 0 }) ?? 0) / 100,
    ),
    maxDestinations: String(
      toCount(allocation.maxDestinations, "Max destinations", { min: 1 }) ?? "",
    ),
    allowSplit: allocation.allowSplit !== false,
  };

  // ── Backer rules ───────────────────────────────────────────────────────────
  const backer = asObject(input.backerRules);
  settings.backerRules = {
    enabled: backer.enabled === true,
    allowWholeCampaign: backer.allowWholeCampaign !== false,
    allowPercentage: backer.allowPercentage !== false,
    allowFundingRequirement: backer.allowFundingRequirement !== false,
    minBackerAmount: String(
      (toPence(backer.minBackerAmount, "Minimum backer amount", { min: 0 }) ?? 0) / 100,
    ),
    maxBackers: String(toCount(backer.maxBackers, "Max backers", { min: 1 }) ?? ""),
    backerBenefits: asString(backer.backerBenefits),
  };

  // ── Founding member rules ──────────────────────────────────────────────────
  const founding = asObject(input.foundingMemberRules);
  const foundingEnabled = founding.enabled === true;
  const foundingMonthlyEnabled = founding.foundingMonthlyEnabled === true;
  const monthlyContribution = toPence(
    founding.foundingMonthlyContribution,
    "Founding monthly contribution",
    { min: foundingMonthlyEnabled && strict ? 1 : 0 },
  );
  settings.foundingMemberRules = {
    enabled: foundingEnabled,
    maxFoundingMembers: String(
      toCount(founding.maxFoundingMembers, "Max founding members", { min: 1 }) ?? "",
    ),
    contributionRequired: String(
      (toPence(founding.contributionRequired, "Founding member contribution", { min: 0 }) ?? 0) /
        100,
    ),
    privileges: asString(founding.privileges),
    campaignLocationAssociation: founding.campaignLocationAssociation === true,
    foundingMonthlyEnabled,
    foundingMonthlyContribution:
      monthlyContribution !== null ? String(monthlyContribution / 100) : "",
  };

  // ── Group rules ────────────────────────────────────────────────────────────
  const group = asObject(input.groupRules);
  const groupEnabled = group.enabled === true;
  const minGroupSize = toCount(group.minGroupSize, "Minimum group size", {
    required: strict && groupEnabled,
    min: 2,
  });
  const maxGroupSize = toCount(group.maxGroupSize, "Maximum group size", {
    required: strict && groupEnabled,
    min: 2,
  });
  if (minGroupSize !== null && maxGroupSize !== null && maxGroupSize < minGroupSize) {
    throw new BadRequestException("Maximum group size must be at least the minimum group size");
  }
  settings.groupRules = {
    enabled: groupEnabled,
    minGroupSize: minGroupSize !== null ? String(minGroupSize) : "",
    maxGroupSize: maxGroupSize !== null ? String(maxGroupSize) : "",
    groupContributionRules: asString(group.groupContributionRules),
    groupTarget: String(
      (toPence(group.groupTarget, "Group target", { min: 0 }) ?? 0) / 100,
    ),
    groupBenefits: asString(group.groupBenefits),
  };

  // ── Rewards ────────────────────────────────────────────────────────────────
  const rawRewards = Array.isArray(input.rewards) ? input.rewards : [];
  const hasRewards = input.hasRewards === true;
  if (strict && hasRewards && rawRewards.length === 0) {
    throw new BadRequestException("Add at least one reward or disable rewards");
  }
  const rewardConfigs = rawRewards
    .map((reward, index) =>
      normaliseReward(reward, index, settings.qualificationMode, strict),
    )
    .filter((reward): reward is StoredCampaignRewardConfig => reward !== null);
  settings.rewards = rawRewards as WizardReward[];
  settings.hasRewards = hasRewards;
  settings.rewardConfigs = hasRewards ? rewardConfigs : [];

  // ── Leaderboard ────────────────────────────────────────────────────────────
  const leaderboard = asObject(input.leaderboard);
  const leaderboardEnabled = leaderboard.enabled === true;
  const rankingMethod = asString(leaderboard.rankingMethod) ?? "contribution_amount";
  if (
    !["contribution_amount", "number_of_contributions", "participation"].includes(rankingMethod)
  ) {
    throw new BadRequestException("Invalid leaderboard ranking method");
  }
  settings.leaderboard = {
    enabled: leaderboardEnabled,
    rankingMethod: rankingMethod as WizardLeaderboard["rankingMethod"],
    rankingPeriod:
      asString(leaderboard.rankingPeriod) === "weekly" ||
      asString(leaderboard.rankingPeriod) === "monthly"
        ? (asString(leaderboard.rankingPeriod) as WizardLeaderboard["rankingPeriod"])
        : "campaign",
    numberOfWinners: String(
      toCount(leaderboard.numberOfWinners, "Number of leaderboard winners", {
        required: strict && leaderboardEnabled,
        min: 1,
      }) ?? "",
    ),
    qualificationRules: asString(leaderboard.qualificationRules),
    displayRules: asString(leaderboard.displayRules),
    prizes: Array.isArray(leaderboard.prizes)
      ? leaderboard.prizes
          .filter((prize) => prize && typeof prize === "object")
          .map((prize, index) => {
            const item = asObject(prize);
            return {
              id: asString(item.id) ?? `prize-${index + 1}`,
              position: asString(item.position),
              positionRange: asString(item.positionRange),
              prizeDescription: asString(item.prizeDescription),
            };
          })
      : [],
  };

  // ── Terms ──────────────────────────────────────────────────────────────────
  const terms = asObject(input.terms);
  settings.terms = Object.fromEntries(
    Object.entries(terms)
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value]),
  ) as Record<string, string>;

  // ── Approval ───────────────────────────────────────────────────────────────
  const approval = asObject(input.approval);
  settings.approval = {
    mode: asString(approval.mode) ?? "flagged_review",
    autoApproveCriteria: asString(approval.autoApproveCriteria),
    flaggedCriteria: asStringArray(approval.flaggedCriteria) ?? [],
    reviewerNotes: asString(approval.reviewerNotes),
  };

  return stripUndefined(settings);
}

// ── Charge-time enforcement ─────────────────────────────────────────────────

export interface CampaignChargeCampaign {
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  settings: unknown;
  /** True for admin-created platform campaigns (no owning business). */
  platform?: boolean;
}

export interface CampaignChargeRequest {
  amountMinor: number;
  purpose: "DONATION" | "PLEDGE" | "MEMBERSHIP" | "SELF_FUNDING";
  isNewBacker?: boolean;
  currentBackerCount?: number;
  isNewFoundingMember?: boolean;
  currentFoundingMemberCount?: number;
  allocations?: { destinationId: string; amountMinor?: number; percentage?: number }[];
  /** Checkout participation type (back_campaign, founding_member, ...). */
  participationType?: string;
  /** Reward selected at checkout, if any. */
  rewardId?: string;
  /** Whether the contributor accepted the configured campaign terms. */
  acceptedTerms?: boolean;
  /** Optional bonus support added on top of the pledge, in pence. */
  bonusAmountMinor?: number;
}

/**
 * Enforce the admin-authored campaign rules at the moment a charge is created.
 * Self-funding by the campaign owner is exempt from public participation limits.
 */
export function enforceCampaignChargeRules(
  campaign: CampaignChargeCampaign,
  request: CampaignChargeRequest,
): void {
  if (request.purpose === "SELF_FUNDING") return;

  if (campaign.platform) {
    if (campaign.status !== "ACTIVE") {
      throw new BadRequestException("This campaign is not currently accepting contributions");
    }

    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) {
      throw new BadRequestException("This campaign has not started yet");
    }
    if (campaign.endDate && campaign.endDate < now) {
      throw new BadRequestException("This campaign has ended");
    }
  }

  const settings = getCampaignWizardSettings(campaign.settings);

  // ── Participation methods ────────────────────────────────────────────────
  const isFoundingParticipation =
    request.participationType === "founding_member" ||
    request.participationType === "founding_monthly";
  if (
    !isFoundingParticipation &&
    request.purpose === "DONATION" &&
    settings.participation?.donateContribute === false
  ) {
    throw new BadRequestException("This campaign is not accepting donations");
  }
  if (
    !isFoundingParticipation &&
    request.purpose === "PLEDGE" &&
    settings.participation?.backCampaign === false
  ) {
    throw new BadRequestException("This campaign is not accepting pledges");
  }

  // ── Founding member participation ────────────────────────────────────────
  if (request.participationType === "founding_member") {
    if (
      settings.participation?.foundingMember !== true ||
      settings.foundingMemberRules?.enabled === false
    ) {
      throw new BadRequestException("This campaign is not accepting founding members");
    }
    const required =
      toPence(
        settings.foundingMemberRules?.contributionRequired,
        "Founding member contribution",
        { min: 0 },
      ) ?? 0;
    if (required > 0 && request.amountMinor < required) {
      throw new BadRequestException(
        `The founding member contribution for this campaign is £${(required / 100).toFixed(2)}`,
      );
    }
    const maxFoundingMembers = toCount(
      settings.foundingMemberRules?.maxFoundingMembers,
      "Max founding members",
      { min: 1 },
    );
    if (
      maxFoundingMembers !== null &&
      request.isNewFoundingMember &&
      (request.currentFoundingMemberCount ?? 0) >= maxFoundingMembers
    ) {
      throw new BadRequestException(
        "This campaign has reached its maximum number of founding members",
      );
    }
  }
  if (request.participationType === "founding_monthly") {
    if (
      settings.participation?.foundingMemberMonthly !== true ||
      settings.foundingMemberRules?.foundingMonthlyEnabled === false
    ) {
      throw new BadRequestException("This campaign is not accepting founding monthly members");
    }
    const required =
      toPence(
        settings.foundingMemberRules?.foundingMonthlyContribution,
        "Founding monthly contribution",
        { min: 0 },
      ) ?? 0;
    if (required > 0 && request.amountMinor < required) {
      throw new BadRequestException(
        `The founding monthly contribution for this campaign is £${(required / 100).toFixed(2)}`,
      );
    }
  }

  // ── Terms ────────────────────────────────────────────────────────────────
  const terms = settings.terms ?? {};
  const hasTerms = Object.values(terms).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  if (hasTerms && request.acceptedTerms !== true) {
    throw new BadRequestException("Please accept the campaign terms before contributing");
  }

  // ── Selected reward ──────────────────────────────────────────────────────
  let selectedRewardMinimum = 0;
  if (request.rewardId) {
    const rewardConfigs = getCampaignRewardConfigs(campaign.settings);
    if (rewardConfigs.length > 0) {
      const reward = rewardConfigs.find((config) => config.id === request.rewardId);
      if (!reward) {
        throw new BadRequestException("The selected reward is not available for this campaign");
      }
      const thresholds = reward.conditions
        .map((condition) =>
          condition.exactPence ?? condition.minPence ?? 0,
        )
        .filter((amount) => amount > 0);
      const minimum = thresholds.length > 0 ? Math.min(...thresholds) : 0;
      selectedRewardMinimum = minimum;
      if (minimum > 0 && request.amountMinor < minimum) {
        throw new BadRequestException(
          `The minimum contribution for "${reward.name}" is £${(minimum / 100).toFixed(2)}`,
        );
      }
    }
  }

  // ── Contribution amount limits ───────────────────────────────────────────
  const contribution = settings.contributionRules;
  if (contribution) {
    const types = contribution.contributionTypes ?? ["money"];
    if (!types.includes("money")) {
      throw new BadRequestException("This campaign does not accept monetary contributions");
    }

    const minPence = toPence(contribution.minContribution, "Minimum contribution", { min: 0 }) ?? 0;
    const maxPence = toPence(contribution.maxContribution, "Maximum contribution", { min: 0 });
    if (minPence > 0 && request.amountMinor < minPence) {
      throw new BadRequestException(
        `The minimum contribution for this campaign is £${(minPence / 100).toFixed(2)}`,
      );
    }
    if (maxPence !== null && request.amountMinor > maxPence) {
      throw new BadRequestException(
        `The maximum contribution for this campaign is £${(maxPence / 100).toFixed(2)}`,
      );
    }

    if (contribution.allowCustomAmount === false) {
      const suggested = (contribution.suggestedAmounts ?? [])
        .map((amount) => toPence(amount, "Suggested amount", { min: 0 }))
        .filter((amount): amount is number => amount !== null);
      const baseAmount = Math.max(
        0,
        request.amountMinor - (request.bonusAmountMinor ?? 0),
      );
      if (
        suggested.length > 0 &&
        !suggested.includes(baseAmount) &&
        (selectedRewardMinimum <= 0 || baseAmount !== selectedRewardMinimum)
      ) {
        throw new BadRequestException(
          "Please choose one of the suggested contribution amounts for this campaign",
        );
      }
    }
  }

  // ── Backer limits ────────────────────────────────────────────────────────
  const backer = settings.backerRules;
  if (backer?.enabled) {
    const minBackerPence = toPence(backer.minBackerAmount, "Minimum backer amount", { min: 0 }) ?? 0;
    if (minBackerPence > 0 && request.amountMinor < minBackerPence) {
      throw new BadRequestException(
        `The minimum backer amount for this campaign is £${(minBackerPence / 100).toFixed(2)}`,
      );
    }
    const maxBackers = toCount(backer.maxBackers, "Max backers", { min: 1 });
    if (
      maxBackers !== null &&
      request.isNewBacker &&
      (request.currentBackerCount ?? 0) >= maxBackers
    ) {
      throw new BadRequestException("This campaign has reached its maximum number of backers");
    }
  }

  // ── Allocation rules ─────────────────────────────────────────────────────
  const allocation = settings.allocationRules;
  if (allocation?.enabled) {
    const allocations = request.allocations ?? [];
    if (allocation.required && allocations.length === 0) {
      throw new BadRequestException("Please choose how your contribution should be allocated");
    }
    if (!allocation.allowSplit && allocations.length > 1) {
      throw new BadRequestException("This campaign only allows allocation to a single destination");
    }
    const maxDestinations = toCount(allocation.maxDestinations, "Max destinations", { min: 1 });
    if (maxDestinations !== null && allocations.length > maxDestinations) {
      throw new BadRequestException(
        `You can allocate to at most ${maxDestinations} destination(s)`,
      );
    }
    const allowedDestinations = new Set(
      (allocation.destinations ?? []).map((destination) => destination.id).filter(Boolean),
    );
    for (const entry of allocations) {
      if (!allowedDestinations.has(entry.destinationId)) {
        throw new BadRequestException("Invalid allocation destination");
      }
    }
    const minAllocationPence =
      toPence(allocation.minAllocation, "Minimum allocation", { min: 0 }) ?? 0;
    let allocated = 0;
    let allocatedPercentage = 0;
    for (const entry of allocations) {
      const amount =
        entry.amountMinor ??
        Math.round((request.amountMinor * (entry.percentage ?? 0)) / 100);
      if (amount < 0) {
        throw new BadRequestException("Allocation amount cannot be negative");
      }
      if (minAllocationPence > 0 && amount < minAllocationPence) {
        throw new BadRequestException(
          `The minimum allocation per destination is £${(minAllocationPence / 100).toFixed(2)}`,
        );
      }
      allocated += amount;
      allocatedPercentage += entry.percentage ?? 0;
    }
    if (allocated > request.amountMinor) {
      throw new BadRequestException("Allocated amount cannot exceed the contribution amount");
    }
    if (allocatedPercentage > 100) {
      throw new BadRequestException("Allocation percentages cannot exceed 100%");
    }
    if (
      allocations.some((entry) => (entry.percentage ?? 0) > 0) &&
      Math.round(allocatedPercentage) !== 100
    ) {
      throw new BadRequestException("Allocation percentages must total 100%");
    }
  }
}
