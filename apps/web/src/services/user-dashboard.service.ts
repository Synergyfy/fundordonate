import api from "@/lib/api";

export const userDashboardApi = {
  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  async getStats() {
    const res = await api.get("/user/dashboard/stats");
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Donations
  // -------------------------------------------------------------------------
  async getDonations(params: { page?: number; limit?: number } = {}) {
    const res = await api.get("/user/donations", { params });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Pledges
  // -------------------------------------------------------------------------
  async getPledges(params: { page?: number; limit?: number } = {}) {
    const res = await api.get("/user/pledges", { params });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Bookmarks
  // -------------------------------------------------------------------------
  async getBookmarks(params: { page?: number; limit?: number } = {}) {
    const res = await api.get("/user/bookmarks", { params });
    return res.data.data;
  },

  async toggleBookmark(campaignId: string) {
    const res = await api.post(`/user/bookmarks/${campaignId}`);
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Receipts
  // -------------------------------------------------------------------------
  async getReceipts(year?: number) {
    const res = await api.get("/user/receipts", { params: { year } });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------
  async getProfile() {
    const res = await api.get("/user/profile");
    return res.data.data;
  },

  async updateProfile(data: { firstName?: string; lastName?: string; username?: string; bio?: string; avatar?: string }) {
    const res = await api.put("/user/profile", data);
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Password
  // -------------------------------------------------------------------------
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await api.post("/user/change-password", data);
    return res.data;
  },

  // -------------------------------------------------------------------------
  // Account
  // -------------------------------------------------------------------------
  async deleteAccount(password: string) {
    const res = await api.delete("/user/account", { data: { password } });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  async getNotificationPrefs() {
    const res = await api.get("/user/notifications");
    return res.data.data;
  },

  async updateNotificationPrefs(data: Record<string, boolean>) {
    const res = await api.put("/user/notifications", data);
    return res.data.data;
  },
};
