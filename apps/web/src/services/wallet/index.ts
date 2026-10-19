import api from "../api";
import { MCOM_CONFIG } from "@/lib/config";
import type { McomWalletBalance, WalletSummary } from "./type";

export const walletService = {
  /**
   * Fetch the current authenticated user's MCOM Central Hub wallet balance.
   */
  async getBalance(): Promise<McomWalletBalance> {
    try {
      return await api.get("/wallet/balance");
    } catch {
      return {
        success: true,
        balance: 0,
        availableBalance: 0,
        status: "ACTIVE",
        currency: "MCOM",
      };
    }
  },

  /**
   * Optional helper to build a top-up URL to MCOM Central Hub.
   */
  getCentralTopUpUrl(): string {
    return `${MCOM_CONFIG.CENTRAL_URL}/wallet/topup`;
  },

  /**
   * Summary helper for earnings/platform wallet overview
   */
  async getSummary(): Promise<WalletSummary> {
    try {
      const res = await api.get("/wallet/summary");
      return res;
    } catch {
      const balance = await this.getBalance().catch(() => null);
      return {
        balance: balance ? Math.round(balance.balance * 100) : 0,
        totalEarned: 0,
        totalFees: 0,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
        byCampaign: [],
      };
    }
  },

  /**
   * Historical transactions list
   */
  async getTransactions(params: { page?: number; limit?: number; type?: string } = {}): Promise<any> {
    try {
      return await api.get("/wallet/transactions", { params });
    } catch {
      return {
        transactions: [],
        pagination: { totalPages: 1, page: params.page ?? 1, total: 0 },
      };
    }
  },
};

export const walletApi = walletService;
export default walletService;
export type * from "./type";
