/**
 * Stable capability keys. These are the contract between the admin-authored
 * plans and every gate in the API/web apps — never rename without a migration.
 */
export const FEATURES = {
  CAMPAIGN_CREATION: "campaign.creation",
  CAMPAIGN_CLAIM_LIMIT: "campaign.claim_limit",
  CAMPAIGN_ACTIVE_SLOTS: "campaign.active_slots",
  TEMPLATES_PREMIUM: "templates.premium",
  REWARDS_ATTACH: "rewards.attach",
  REWARDS_PREMIUM_LIBRARY: "rewards.premium_library",
  CONTRIBUTIONS_LEDGER: "contributions.ledger",
  CONTRIBUTIONS_FILTERS: "contributions.filters",
  LEADERBOARD_CITY: "leaderboard.city",
  LEADERBOARD_LOCAL: "leaderboard.local",
  LEADERBOARD_NATIONAL: "leaderboard.national",
  LEADERBOARD_RANK_TRACKING: "leaderboard.rank_tracking",
  PROFILE_ENHANCED: "profile.enhanced",
  PROFILE_FEATURED: "profile.featured",
  ANALYTICS_INSIGHTS: "analytics.insights",
  ANALYTICS_ADVANCED: "analytics.advanced",
  NOTIFICATIONS_WEEKLY_DIGEST: "notifications.weekly_digest",
  NOTIFICATIONS_ALERTS: "notifications.alerts",
  SUPPORT_PRIORITY: "support.priority",
  PROFILE_BADGES: "profile.badges",
  CAMPAIGN_PROMOTION: "campaign.promotion",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

export interface CapabilityRule {
  enabled: boolean;
  /** Numeric quota for features that support one. Null with `unlimited` = no cap. */
  limit: number | null;
  unlimited: boolean;
}

export type CapabilityMap = Record<string, CapabilityRule>;

export interface PlanFeatureSeed {
  key: FeatureKey;
  name: string;
  description: string;
  category: string;
  sortOrder: number;
  defaultEnabled: boolean;
  supportsLimit: boolean;
  defaultLimit: number | null;
}

/**
 * The canonical catalogue, mirrored by the SQL migration that seeds
 * `plan_features`. Used to fill gaps when a newly-added key has not been
 * persisted yet.
 */
export const PLAN_FEATURE_CATALOGUE: PlanFeatureSeed[] = [
  {
    key: FEATURES.CAMPAIGN_CREATION,
    name: "Campaign creation",
    description: "Claim a template and launch a campaign.",
    category: "campaigns",
    sortOrder: 10,
    defaultEnabled: true,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.CAMPAIGN_CLAIM_LIMIT,
    name: "Campaign claims",
    description: "How many campaigns the business can claim in total.",
    category: "campaigns",
    sortOrder: 15,
    defaultEnabled: true,
    supportsLimit: true,
    defaultLimit: 2,
  },
  {
    key: FEATURES.CAMPAIGN_ACTIVE_SLOTS,
    name: "Active campaign slots",
    description: "How many campaigns a business can run at once.",
    category: "campaigns",
    sortOrder: 20,
    defaultEnabled: true,
    supportsLimit: true,
    defaultLimit: 1,
  },
  {
    key: FEATURES.TEMPLATES_PREMIUM,
    name: "Premium templates",
    description: "Access premium templates, with a cap on how many the business can hold.",
    category: "campaigns",
    sortOrder: 30,
    defaultEnabled: false,
    supportsLimit: true,
    defaultLimit: 1,
  },
  {
    key: FEATURES.REWARDS_ATTACH,
    name: "Attach rewards",
    description: "Add reward-library rewards to campaigns.",
    category: "rewards",
    sortOrder: 50,
    defaultEnabled: true,
    supportsLimit: true,
    defaultLimit: 3,
  },
  {
    key: FEATURES.REWARDS_PREMIUM_LIBRARY,
    name: "Premium reward library",
    description: "Access exclusive, high-value rewards.",
    category: "rewards",
    sortOrder: 60,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.CONTRIBUTIONS_LEDGER,
    name: "Contributions ledger",
    description: "See in-store, online, split and self-funded contributions.",
    category: "contributions",
    sortOrder: 80,
    defaultEnabled: true,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.CONTRIBUTIONS_FILTERS,
    name: "Contribution filters",
    description: "Filter by channel and view transaction references.",
    category: "contributions",
    sortOrder: 90,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.LEADERBOARD_CITY,
    name: "City leaderboard",
    description: "City-level ranking.",
    category: "leaderboards",
    sortOrder: 100,
    defaultEnabled: true,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.LEADERBOARD_LOCAL,
    name: "Local-area leaderboard",
    description: "Local-area ranking.",
    category: "leaderboards",
    sortOrder: 110,
    defaultEnabled: true,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.LEADERBOARD_NATIONAL,
    name: "National leaderboard",
    description: "National ranking.",
    category: "leaderboards",
    sortOrder: 120,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.LEADERBOARD_RANK_TRACKING,
    name: "Rank tracking",
    description: "Position changes and total contributed versus peers.",
    category: "leaderboards",
    sortOrder: 130,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.PROFILE_ENHANCED,
    name: "Enhanced business profile",
    description: "Logo, cover image and a richer public listing.",
    category: "profile",
    sortOrder: 160,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.PROFILE_FEATURED,
    name: "Featured listing",
    description: "Promoted placement in the business directory.",
    category: "profile",
    sortOrder: 170,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.ANALYTICS_INSIGHTS,
    name: "Performance insights",
    description: "KPI overview, season contribution and rewards earned.",
    category: "analytics",
    sortOrder: 180,
    defaultEnabled: true,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.ANALYTICS_ADVANCED,
    name: "Advanced analytics",
    description: "Campaign and season performance reports.",
    category: "analytics",
    sortOrder: 190,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.NOTIFICATIONS_WEEKLY_DIGEST,
    name: "Weekly digest",
    description: "Automated performance summary emails.",
    category: "notifications",
    sortOrder: 200,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.NOTIFICATIONS_ALERTS,
    name: "Alert preferences",
    description: "Leaderboard shifts, new backers and reward unlocks.",
    category: "notifications",
    sortOrder: 210,
    defaultEnabled: true,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.SUPPORT_PRIORITY,
    name: "Priority support",
    description: "Faster, dedicated support channel.",
    category: "support",
    sortOrder: 220,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.PROFILE_BADGES,
    name: "Recognition badges",
    description: "Tier badges and founding-member recognition.",
    category: "profile",
    sortOrder: 240,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
  {
    key: FEATURES.CAMPAIGN_PROMOTION,
    name: "Campaign promotion",
    description: "Boost or feature a campaign in discovery.",
    category: "campaigns",
    sortOrder: 250,
    defaultEnabled: false,
    supportsLimit: false,
    defaultLimit: null,
  },
];

export const PLAN_FEATURE_KEYS = new Set<string>(
  PLAN_FEATURE_CATALOGUE.map((f) => f.key),
);

export const FEATURE_CATEGORY_LABELS: Record<string, string> = {
  campaigns: "Campaigns & templates",
  rewards: "Rewards",
  contributions: "Contributions",
  leaderboards: "Leaderboards",
  profile: "Business profile & recognition",
  analytics: "Analytics & insights",
  notifications: "Notifications",
  support: "Support",
  general: "General",
};

export const DEFAULT_FEATURE_RULE: CapabilityRule = {
  enabled: false,
  limit: null,
  unlimited: false,
};

/** Normalise an untrusted capability object into a safe map. */
export function normalizeCapabilities(
  input: unknown,
  options: {
    features: {
      key: string;
      defaultEnabled: boolean;
      supportsLimit: boolean;
      defaultLimit: number | null;
    }[];
    /**
     * When true, missing keys fall back to the feature's defaults. When false,
     * missing keys are simply omitted.
     */
    includeDefaults?: boolean;
  },
): CapabilityMap {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const result: CapabilityMap = {};
  for (const feature of options.features) {
    const raw = source[feature.key];
    const hasRaw = raw && typeof raw === "object" && !Array.isArray(raw);
    if (!hasRaw && !options.includeDefaults) continue;

    const entry = (hasRaw ? raw : {}) as Record<string, unknown>;
    const enabled =
      typeof entry.enabled === "boolean"
        ? entry.enabled
        : feature.defaultEnabled;
    const unlimited = feature.supportsLimit
      ? entry.unlimited === true
      : false;
    let limit: number | null = null;
    if (feature.supportsLimit && !unlimited) {
      const candidate = Number(entry.limit);
      if (Number.isFinite(candidate) && candidate >= 0) {
        limit = Math.floor(candidate);
      } else {
        limit = feature.defaultLimit;
      }
    }

    result[feature.key] = { enabled, limit, unlimited };
  }
  return result;
}

/** Merge stored capability maps with current feature defaults. */
export function mergeWithDefaults(
  capabilities: unknown,
  features: {
    key: string;
    defaultEnabled: boolean;
    supportsLimit: boolean;
    defaultLimit: number | null;
  }[],
): CapabilityMap {
  return normalizeCapabilities(capabilities, {
    features,
    includeDefaults: true,
  });
}

/** Human-readable summary of a capability for admin tables. */
export function capabilitySummary(rule: CapabilityRule): string {
  if (!rule.enabled) return "Off";
  if (rule.unlimited) return "Unlimited";
  if (typeof rule.limit === "number") return `Limit ${rule.limit}`;
  return "On";
}
