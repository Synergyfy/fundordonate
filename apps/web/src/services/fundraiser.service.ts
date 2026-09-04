import api from "@/lib/api";

export const fundraiserApi = {
  // -------------------------------------------------------------------------
  // Overview
  // -------------------------------------------------------------------------
  async getStats() {
    const res = await api.get("/fundraiser/stats");
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // My Campaigns
  // -------------------------------------------------------------------------
  async getCampaigns(params: { page?: number; limit?: number; status?: string } = {}) {
    const res = await api.get("/fundraiser/campaigns", { params });
    return res.data.data;
  },

  async getCampaign(id: string) {
    const res = await api.get(`/fundraiser/campaigns/${id}`);
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Earnings
  // -------------------------------------------------------------------------
  async getEarnings() {
    const res = await api.get("/fundraiser/earnings");
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Withdrawals
  // -------------------------------------------------------------------------
  async getWithdrawals(params: { page?: number; limit?: number } = {}) {
    const res = await api.get("/fundraiser/withdrawals", { params });
    return res.data.data;
  },

  async requestWithdrawal(data: { amount: number; method: string; accountDetails: string }) {
    const res = await api.post("/fundraiser/withdrawals", data);
    return res.data.data;
  },

  async getWithdrawal(id: string) {
    const res = await api.get(`/fundraiser/withdrawals/${id}`);
    return res.data.data;
  },
};
