import api from "../api";
import type {
  BusinessOnboardingDto,
  BusinessProfile,
  BusinessSettings,
  DashboardOverviewData,
  UpdateBusinessProfileDto,
  UpdateBusinessSettingsDto,
} from "./type";

export const businessService = {
  /**
   * Fetch aggregated metrics and active campaigns for overview dashboard.
   */
  async getOverview(): Promise<DashboardOverviewData> {
    return api.get("/business/dashboard/overview");
  },

  /**
   * Fetch current authenticated business profile.
   */
  async getProfile(): Promise<BusinessProfile> {
    return api.get("/business/profile");
  },

  /**
   * Update business profile details.
   */
  async updateProfile(dto: UpdateBusinessProfileDto): Promise<BusinessProfile> {
    return api.patch("/business/profile", dto);
  },

  /**
   * Fetch business notification settings.
   */
  async getSettings(): Promise<BusinessSettings> {
    return api.get("/business/settings");
  },

  /**
   * Update notification settings.
   */
  async updateSettings(dto: UpdateBusinessSettingsDto): Promise<BusinessSettings> {
    return api.patch("/business/settings", dto);
  },

  /**
   * Complete business onboarding.
   */
  async onboard(dto: BusinessOnboardingDto): Promise<BusinessProfile> {
    return api.post("/business/onboarding", dto);
  },
  /**
   * List public businesses with optional location or search filtering.
   */
  async listBusinesses(params?: { location?: string; search?: string }): Promise<any[]> {
    try {
      const res = await api.get<any[]>("/business/list", { params });
      return res || [];
    } catch {
      return [];
    }
  },
};

export default businessService;
