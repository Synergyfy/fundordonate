import api from "../api";
import type { UserDashboardProfile, UserDashboardStats } from "./type";

export const userDashboardService = {
  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  async getStats(): Promise<UserDashboardStats> {
    return api.get("/user/dashboard/stats");
  },

  // -------------------------------------------------------------------------
  // Donations
  // -------------------------------------------------------------------------
  async getDonations(params: { page?: number; limit?: number } = {}) {
    return api.get("/user/donations", { params });
  },

  // -------------------------------------------------------------------------
  // Pledges
  // -------------------------------------------------------------------------
  async getPledges(params: { page?: number; limit?: number } = {}) {
    return api.get("/user/pledges", { params });
  },

  // -------------------------------------------------------------------------
  // Bookmarks
  // -------------------------------------------------------------------------
  async getBookmarks(params: { page?: number; limit?: number } = {}) {
    return api.get("/user/bookmarks", { params });
  },

  async toggleBookmark(campaignId: string) {
    return api.post(`/user/bookmarks/${campaignId}`);
  },

  // -------------------------------------------------------------------------
  // Receipts
  // -------------------------------------------------------------------------
  async getReceipts(year?: number) {
    return api.get("/user/receipts", { params: { year } });
  },

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------
  async getProfile(): Promise<UserDashboardProfile> {
    return api.get("/user/profile");
  },

  async updateProfile(data: { firstName?: string; lastName?: string; username?: string; bio?: string; avatar?: string }) {
    return api.put("/user/profile", data);
  },

  // -------------------------------------------------------------------------
  // Account
  // -------------------------------------------------------------------------
  async deleteAccount() {
    return api.delete("/user/account");
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  async getNotificationPrefs() {
    return api.get("/user/notifications");
  },

  async updateNotificationPrefs(data: Record<string, boolean>) {
    return api.put("/user/notifications", data);
  },
};

export const userDashboardApi = userDashboardService;
export default userDashboardService;
export type * from "./type";
