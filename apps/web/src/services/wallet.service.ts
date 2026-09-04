import api from "@/lib/api";

export const walletApi = {
  // -------------------------------------------------------------------------
  // Wallet Info
  // -------------------------------------------------------------------------
  async getWallet() {
    const res = await api.get("/wallet");
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Transaction History
  // -------------------------------------------------------------------------
  async getTransactions(params: { page?: number; limit?: number; type?: string; action?: string } = {}) {
    const res = await api.get("/wallet/transactions", { params });
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Wallet Summary
  // -------------------------------------------------------------------------
  async getSummary() {
    const res = await api.get("/wallet/summary");
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Admin: Credit/Debit
  // -------------------------------------------------------------------------
  async credit(data: { userId: string; amount: number; type?: string; referenceId?: string; referenceType?: string }) {
    const res = await api.post("/wallet/credit", data);
    return res.data.data;
  },

  async debit(data: { userId: string; amount: number; type?: string; referenceId?: string; referenceType?: string }) {
    const res = await api.post("/wallet/debit", data);
    return res.data.data;
  },

  // -------------------------------------------------------------------------
  // Admin: Stats
  // -------------------------------------------------------------------------
  async getStats() {
    const res = await api.get("/wallet/stats");
    return res.data.data;
  },
};
