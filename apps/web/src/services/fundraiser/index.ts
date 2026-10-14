import api from "../api";
import type { RequestWithdrawalInput } from "./type";

export const fundraiserService = {
  // -------------------------------------------------------------------------
  // Overview
  // -------------------------------------------------------------------------
  async getStats() {
    return api.get("/fundraiser/stats");
  },

  // -------------------------------------------------------------------------
  // My Campaigns
  // -------------------------------------------------------------------------
  async getCampaigns(params: { page?: number; limit?: number; status?: string } = {}) {
    return api.get("/fundraiser/campaigns", { params });
  },

  async getCampaign(id: string) {
    return api.get(`/fundraiser/campaigns/${id}`);
  },

  // -------------------------------------------------------------------------
  // Earnings
  // -------------------------------------------------------------------------
  async getEarnings() {
    return api.get("/fundraiser/earnings");
  },

  // -------------------------------------------------------------------------
  // Withdrawals
  // -------------------------------------------------------------------------
  async getWithdrawals(params: { page?: number; limit?: number } = {}) {
    return api.get("/fundraiser/withdrawals", { params });
  },

  async requestWithdrawal(data: RequestWithdrawalInput) {
    return api.post("/fundraiser/withdrawals", data);
  },

  async getWithdrawal(id: string) {
    return api.get(`/fundraiser/withdrawals/${id}`);
  },
};

export const fundraiserApi = fundraiserService;
export default fundraiserService;
export type * from "./type";
