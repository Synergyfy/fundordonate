import api from "../api";
import type {
  BoroughStatsData,
  HighStreetStatsData,
  LocationStatsData,
  NationalProgressData,
  RollUpConfig,
  RollUpPreview,
} from "./type";

export const hubProgressService = {
  /**
   * Get national-level aggregated progress stats from live API.
   */
  async getNationalSummary(): Promise<NationalProgressData> {
    const res = await api.get<any>("/hub/national-summary");
    return {
      totalCities: res.totalCities ?? 0,
      activeCities: res.active ?? 0,
      makingProgressCities: res.makingProgress ?? 0,
      needsActivationCities: res.needsActivation ?? 0,
      totalFundingRaised: res.totalFundingRaised ?? 0,
      totalFundingTarget: res.totalFundingTarget ?? 0,
      totalCampaignDonations: res.totalDonations ?? 0,
      totalCampaignPledges: res.totalPledges ?? 0,
      totalBackers: res.totalBackers ?? 0,
      totalFoundingBusiness: res.totalFoundingBusiness ?? 0,
      totalFoundingConsumer: res.totalFoundingConsumer ?? 0,
      campaignCount: res.totalCampaigns ?? 0,
      contributionVelocity: res.contributionVelocity ?? [],
    };
  },

  /**
   * Get stats for any location (city, borough, high street).
   */
  async getLocationStats(locationId: string): Promise<LocationStatsData | null> {
    const res = await api.get(`/hub/locations/${locationId}/stats`);
    return res;
  },

  /**
   * Get city-specific stats with child breakdown.
   */
  async getCityStats(cityId: string): Promise<BoroughStatsData | null> {
    const res = await api.get(`/hub/locations/${cityId}/stats`, { params: { type: "city" } });
    return res;
  },

  /**
   * Get borough-specific stats with high street breakdown.
   */
  async getBoroughStats(boroughId: string): Promise<BoroughStatsData | null> {
    const res = await api.get(`/hub/locations/${boroughId}/stats`, { params: { type: "borough" } });
    return res;
  },

  /**
   * Get high street-specific stats.
   */
  async getHighStreetStats(highStreetId: string): Promise<HighStreetStatsData | null> {
    const res = await api.get(`/hub/locations/${highStreetId}/stats`, { params: { type: "high_street" } });
    return res;
  },

  /**
   * Get roll-up configuration (admin only).
   */
  async getRollUpConfig(): Promise<RollUpConfig> {
    const res = await api.get("/admin/locations/rollup-config");
    return res;
  },

  /**
   * Update roll-up configuration (admin only).
   */
  async updateRollUpConfig(config: Partial<RollUpConfig>): Promise<RollUpConfig> {
    return api.put("/admin/locations/rollup-config", { config });
  },

  /**
   * Preview roll-up computation without applying (admin only).
   */
  async previewRollUp(): Promise<RollUpPreview> {
    const res = await api.post("/admin/locations/rollup-config/preview");
    return res;
  },

  /**
   * Trigger manual roll-up computation (admin only).
   */
  async triggerRollUp(): Promise<{ success: boolean; message: string }> {
    const res = await api.post("/admin/locations/rollup-config/run");
    return res;
  },
};

export const hubProgressApi = hubProgressService;
export type NationalSummary = NationalProgressData;
export default hubProgressService;
export type * from "./type";
