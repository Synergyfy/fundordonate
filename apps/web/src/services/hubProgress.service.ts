// =============================================================================
// Hub Progress Service
// API methods for hub progress and roll-up data with demo data fallbacks.
// =============================================================================

import api from "@/lib/api";
import {
  getNationalHubSummary,
  getChildLocations,
} from "@/data/ukHubData";

// ───────────────────── Types ─────────────────────

export interface NationalProgressData {
  totalCities: number;
  activeCities: number;
  makingProgressCities: number;
  needsActivationCities: number;
  totalFundingRaised: number;
  totalFundingTarget: number;
  totalCampaignDonations: number;
  totalCampaignPledges: number;
  totalBackers: number;
  totalFoundingBusiness: number;
  totalFoundingConsumer: number;
  campaignCount: number;
  contributionVelocity: { period: string; amount: number }[];
}

export interface LocationStatsData {
  locationId: string;
  locationName: string;
  locationType: string;
  hierarchyLevel: string;
  fundingRaised: number;
  fundingTarget: number;
  activationProgress: number;
  campaignCount: number;
  totalDonations: number;
  totalPledges: number;
  totalBackers: number;
  foundingBusiness: { total: number; allocated: number; remaining: number; status: string };
  foundingConsumer: { total: number; allocated: number; remaining: number; status: string };
  childContributions: ChildContribution[];
  contributionBreakdown: { fund: number; donate: number; founding: number };
}

export interface ChildContribution {
  childId: string;
  childName: string;
  childType: string;
  raised: number;
  campaigns: number;
  backers: number;
}

export interface BoroughStatsData extends LocationStatsData {
  highStreetContributions: ChildContribution[];
}

export interface HighStreetStatsData extends LocationStatsData {
  parentBoroughName?: string;
  parentBoroughSlug?: string;
}

export interface RollUpConfig {
  enabled: boolean;
  aggregationLevel: "realtime" | "hourly" | "daily";
  autoPromoteStatus: boolean;
  activationThreshold: number;
  rollUpRules: {
    campaignTypes: string[];
    includeDonations: boolean;
    includePledges: boolean;
    includeFounding: boolean;
  };
}

export interface RollUpPreview {
  locations: {
    id: string;
    name: string;
    currentRaised: number;
    projectedRaised: number;
    statusChange: string | null;
  }[];
  totalProjected: number;
}

// ───────────────────── Demo Fallback Helpers ─────────────────────

function computeFallbackNationalSummary(): NationalProgressData {
  const summary = getNationalHubSummary();
  return {
    totalCities: summary.totalCities,
    activeCities: summary.active,
    makingProgressCities: summary.makingProgress,
    needsActivationCities: summary.needsActivation,
    totalFundingRaised: summary.totalFundingRaised,
    totalFundingTarget: summary.totalFundingTarget,
    totalCampaignDonations: 452300,
    totalCampaignPledges: 287600,
    totalBackers: summary.totalBackers,
    totalFoundingBusiness: summary.totalFoundingBusiness,
    totalFoundingConsumer: summary.totalFoundingConsumer,
    campaignCount: 47,
    contributionVelocity: [
      { period: "This week", amount: 12500 },
      { period: "Last week", amount: 18200 },
      { period: "This month", amount: 67800 },
      { period: "Last month", amount: 54300 },
    ],
  };
}

function computeFallbackLocationStats(locationId: string): LocationStatsData | null {
  const location = getAllLocations().find((l) => l.id === locationId);
  if (!location) return null;

  const children = getChildLocations(locationId);
  const childContributions: ChildContribution[] = children.map((child) => ({
    childId: child.id,
    childName: child.name,
    childType: child.type,
    raised: child.fundingRaised,
    campaigns: Math.floor(Math.random() * 5) + 1,
    backers: Math.floor(child.foundingBusinessAllocated * 1.5 + child.foundingConsumerAllocated * 0.8),
  }));

  const fundingPct = location.fundingTarget > 0
    ? Math.min(Math.round((location.fundingRaised / location.fundingTarget) * 100), 100)
    : 0;

  const bizRemaining = Math.max(0, location.foundingBusinessTotal - location.foundingBusinessAllocated);
  const consRemaining = Math.max(0, location.foundingConsumerTotal - location.foundingConsumerAllocated);

  return {
    locationId: location.id,
    locationName: location.name,
    locationType: location.type,
    hierarchyLevel: location.type === "CITY" ? "city" : location.type === "BOROUGH" ? "borough" : "high_street",
    fundingRaised: location.fundingRaised,
    fundingTarget: location.fundingTarget,
    activationProgress: fundingPct,
    campaignCount: children.length + Math.floor(Math.random() * 3) + 1,
    totalDonations: Math.floor(location.fundingRaised * 0.6),
    totalPledges: Math.floor(location.fundingRaised * 0.4),
    totalBackers: Math.floor(location.foundingBusinessAllocated * 1.5 + location.foundingConsumerAllocated * 0.8),
    foundingBusiness: {
      total: location.foundingBusinessTotal,
      allocated: location.foundingBusinessAllocated,
      remaining: bizRemaining,
      status: bizRemaining === 0 ? "FULLY_ALLOCATED" : bizRemaining < location.foundingBusinessTotal * 0.1 ? "LIMITED" : "OPEN",
    },
    foundingConsumer: {
      total: location.foundingConsumerTotal,
      allocated: location.foundingConsumerAllocated,
      remaining: consRemaining,
      status: consRemaining === 0 ? "FULLY_ALLOCATED" : consRemaining < location.foundingConsumerTotal * 0.1 ? "LIMITED" : "OPEN",
    },
    childContributions,
    contributionBreakdown: {
      fund: Math.floor(location.fundingRaised * 0.5),
      donate: Math.floor(location.fundingRaised * 0.3),
      founding: Math.floor(location.fundingRaised * 0.2),
    },
  };
}

// Helper to get all locations (imported from ukHubData)
function getAllLocations() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ALL_LOCATIONS } = require("@/data/ukHubData");
  return ALL_LOCATIONS as any[];
}

// ───────────────────── API Service ─────────────────────

export const hubProgressApi = {
  /**
   * Get national-level aggregated progress stats.
   * Falls back to demo data computation if API is unavailable.
   */
  async getNationalSummary(): Promise<NationalProgressData> {
    try {
      const res = await api.get("/hub/national/summary");
      return res.data.data;
    } catch {
      return computeFallbackNationalSummary();
    }
  },

  /**
   * Get stats for any location (city, borough, high street).
   * Falls back to demo data computation if API is unavailable.
   */
  async getLocationStats(locationId: string): Promise<LocationStatsData | null> {
    try {
      const res = await api.get(`/hub/locations/${locationId}/stats`);
      return res.data.data;
    } catch {
      return computeFallbackLocationStats(locationId);
    }
  },

  /**
   * Get city-specific stats with child breakdown.
   * Falls back to demo data computation if API is unavailable.
   */
  async getCityStats(cityId: string): Promise<BoroughStatsData | null> {
    try {
      const res = await api.get(`/hub/locations/${cityId}/stats?type=city`);
      return res.data.data;
    } catch {
      const base = computeFallbackLocationStats(cityId);
      if (!base) return null;
      return { ...base, highStreetContributions: base.childContributions };
    }
  },

  /**
   * Get borough-specific stats with high street breakdown.
   * Falls back to demo data computation if API is unavailable.
   */
  async getBoroughStats(boroughId: string): Promise<BoroughStatsData | null> {
    try {
      const res = await api.get(`/hub/locations/${boroughId}/stats?type=borough`);
      return res.data.data;
    } catch {
      const base = computeFallbackLocationStats(boroughId);
      if (!base) return null;
      return { ...base, highStreetContributions: base.childContributions };
    }
  },

  /**
   * Get high street-specific stats.
   * Falls back to demo data computation if API is unavailable.
   */
  async getHighStreetStats(highStreetId: string): Promise<HighStreetStatsData | null> {
    try {
      const res = await api.get(`/hub/locations/${highStreetId}/stats?type=high_street`);
      return res.data.data;
    } catch {
      const base = computeFallbackLocationStats(highStreetId);
      if (!base) return null;

      const location = getAllLocations().find((l) => l.id === highStreetId);
      const parentId = location?.parentId;
      const parent = parentId ? getAllLocations().find((l) => l.id === parentId) : null;

      return {
        ...base,
        parentBoroughName: parent?.name,
        parentBoroughSlug: parent?.slug,
      };
    }
  },

  /**
   * Get roll-up configuration (admin only).
   * Falls back to default config if API is unavailable.
   */
  async getRollUpConfig(): Promise<RollUpConfig> {
    try {
      const res = await api.get("/admin/rollup-config");
      return res.data.data;
    } catch {
      return {
        enabled: true,
        aggregationLevel: "realtime",
        autoPromoteStatus: true,
        activationThreshold: 75,
        rollUpRules: {
          campaignTypes: ["donation", "fund", "founding"],
          includeDonations: true,
          includePledges: true,
          includeFounding: true,
        },
      };
    }
  },

  /**
   * Update roll-up configuration (admin only).
   * Silently fails if API is unavailable.
   */
  async updateRollUpConfig(config: Partial<RollUpConfig>): Promise<RollUpConfig> {
    try {
      const res = await api.put("/admin/rollup-config", config);
      return res.data.data;
    } catch {
      return { ...await this.getRollUpConfig(), ...config };
    }
  },

  /**
   * Preview roll-up computation without applying (admin only).
   * Falls back to empty preview if API is unavailable.
   */
  async previewRollUp(): Promise<RollUpPreview> {
    try {
      const res = await api.post("/admin/rollup-config/preview");
      return res.data.data;
    } catch {
      return { locations: [], totalProjected: 0 };
    }
  },

  /**
   * Trigger manual roll-up computation (admin only).
   * Silently fails if API is unavailable.
   */
  async triggerRollUp(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await api.post("/admin/rollup-config/run");
      return res.data.data;
    } catch {
      return { success: false, message: "API unavailable" };
    }
  },
};
