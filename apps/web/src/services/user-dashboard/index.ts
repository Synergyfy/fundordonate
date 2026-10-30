import api from "../api";
import type {
  MyContributionItem,
  MyContributionsPage,
  UserDashboardProfile,
  UserDashboardStats,
} from "./type";

export const userDashboardService = {
  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  async getStats(): Promise<UserDashboardStats> {
    return api.get("/user/dashboard/stats");
  },

  // -------------------------------------------------------------------------
  // Donations (outgoing contributions)
  // -------------------------------------------------------------------------
  async getDonations(params: { page?: number; limit?: number } = {}): Promise<MyContributionsPage> {
    return api.get("/user/donations", { params });
  },

  async getDonation(id: string): Promise<MyContributionItem> {
    return api.get(`/user/donations/${id}`);
  },

  // -------------------------------------------------------------------------
  // Pledges
  // -------------------------------------------------------------------------
  async getPledges(params: { page?: number; limit?: number } = {}) {
    return api.get("/user/pledges", { params });
  },

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------
  async getProfile(): Promise<UserDashboardProfile> {
    return api.get("/user/profile");
  },

  // -------------------------------------------------------------------------
  // Account
  // -------------------------------------------------------------------------
  async deleteAccount() {
    return api.delete("/user/account");
  },
};

export const userDashboardApi = userDashboardService;
export default userDashboardService;
export type * from "./type";
