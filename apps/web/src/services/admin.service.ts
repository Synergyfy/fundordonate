import api from "@/lib/api";

// =============================================================================
// Admin API Service
// =============================================================================

export const adminApi = {
  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------
  async getDashboardStats() {
    const res = await api.get("/admin/stats");
    return res.data.data;
  },

  async getRevenueChart(period: string = "monthly") {
    const res = await api.get("/admin/stats/revenue", { params: { period } });
    return res.data.data;
  },

  async getRecentContributions(limit = 10) {
    const res = await api.get("/admin/stats/recent", { params: { limit } });
    return res.data.data;
  },

  async getTopCampaigns(limit = 5) {
    const res = await api.get("/admin/stats/top-campaigns", { params: { limit } });
    return res.data.data;
  },

  async getActivityFeed(limit = 20) {
    const res = await api.get("/admin/stats/activity", { params: { limit } });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Campaigns
  // -------------------------------------------------------------------------
  async getCampaigns(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    mode?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const res = await api.get("/admin/campaigns", { params });
    return res.data.data;
  },

  async getCampaign(id: string) {
    const res = await api.get(`/admin/campaigns/${id}`);
    return res.data.data;
  },

  async updateCampaignStatus(id: string, status: string) {
    const res = await api.put(`/admin/campaigns/${id}/status`, { status });
    return res.data.data;
  },

  async createCampaign(data: Record<string, unknown>) {
    const res = await api.post("/campaigns", data);
    return res.data.data;
  },

  async updateCampaign(id: string, data: Record<string, unknown>) {
    const res = await api.put(`/campaigns/${id}`, data);
    return res.data.data;
  },

  async deleteCampaign(id: string) {
    await api.delete(`/campaigns/${id}`);
  },

  async bulkAction(action: string, campaignIds: string[]) {
    const res = await api.post("/admin/campaigns/bulk", { action, campaignIds });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Donations
  // -------------------------------------------------------------------------
  async getDonations(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/donations", { params });
    return res.data.data;
  },

  async getDonation(id: string) {
    const res = await api.get(`/admin/donations/${id}`);
    return res.data.data;
  },

  async updateDonationStatus(id: string, status: string) {
    const res = await api.put(`/admin/donations/${id}/status`, { status });
    return res.data.data;
  },

  async refundDonation(id: string, amount?: number, reason?: string) {
    const res = await api.post(`/admin/donations/${id}/refund`, { amount, reason });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Pledges
  // -------------------------------------------------------------------------
  async getPledges(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/pledges", { params });
    return res.data.data;
  },

  async getPledge(id: string) {
    const res = await api.get(`/admin/pledges/${id}`);
    return res.data.data;
  },

  async updatePledgeStatus(id: string, status: string) {
    const res = await api.put(`/admin/pledges/${id}/status`, { status });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/users", { params });
    return res.data.data;
  },

  async getUser(id: string) {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  },

  async updateUserRole(id: string, role: string) {
    const res = await api.put(`/admin/users/${id}/role`, { role });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  async getCategories() {
    const res = await api.get("/categories");
    return res.data.data;
  },

  async createCategory(data: { name: string; description?: string; slug?: string }) {
    const res = await api.post("/categories", data);
    return res.data.data;
  },

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    const res = await api.put(`/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string) {
    await api.delete(`/categories/${id}`);
  },

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------
  async getTags() {
    const res = await api.get("/tags");
    return res.data.data;
  },

  async createTag(data: { name: string }) {
    const res = await api.post("/tags", data);
    return res.data.data;
  },

  async deleteTag(id: string) {
    await api.delete(`/tags/${id}`);
  },

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------
  async getPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    gatewayId?: string;
  } = {}) {
    const res = await api.get("/admin/payments", { params });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Backers
  // -------------------------------------------------------------------------
  async getBackers(params: {
    page?: number;
    limit?: number;
    tier?: string;
    city?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/backers", { params });
    return res.data.data;
  },

  async getBacker(id: string) {
    const res = await api.get(`/admin/backers/${id}`);
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Businesses
  // -------------------------------------------------------------------------
  async getBusinesses(params: {
    page?: number;
    limit?: number;
    status?: string;
    city?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/businesses", { params });
    return res.data.data;
  },

  async getBusiness(id: string) {
    const res = await api.get(`/admin/businesses/${id}`);
    return res.data.data;
  },

  async updateBusinessVerification(id: string, status: string) {
    const res = await api.put(`/admin/businesses/${id}/verification`, { status });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Consumers
  // -------------------------------------------------------------------------
  async getConsumers(params: {
    page?: number;
    limit?: number;
    foundingStatus?: string;
    city?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/consumers", { params });
    return res.data.data;
  },

  async getConsumer(id: string) {
    const res = await api.get(`/admin/consumers/${id}`);
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------
  async getEvents(params: {
    page?: number;
    limit?: number;
    scope?: string;
    city?: string;
    search?: string;
  } = {}) {
    const res = await api.get("/admin/events", { params });
    return res.data.data;
  },

  async createEvent(data: Record<string, unknown>) {
    const res = await api.post("/admin/events", data);
    return res.data.data;
  },

  async updateEvent(id: string, data: Record<string, unknown>) {
    const res = await api.put(`/admin/events/${id}`, data);
    return res.data.data;
  },

  async deleteEvent(id: string) {
    await api.delete(`/admin/events/${id}`);
  },

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------
  async getSettings() {
    const res = await api.get("/admin/settings");
    return res.data.data;
  },

  async updateSettings(data: Record<string, unknown>) {
    const res = await api.put("/admin/settings", data);
    return res.data.data;
  },
};
