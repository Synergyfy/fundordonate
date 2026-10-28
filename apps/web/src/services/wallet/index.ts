import api from "../api";
import { MCOM_CONFIG } from "@/lib/config";
import { getCentralWalletPath, type DashboardUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth.store";
import type { McomWalletBalance, WalletSummary } from "./type";

export const walletService = {
  /**
   * Fetch the current authenticated user's MCOM Central Hub wallet balance.
   *
   * Failures are intentionally NOT converted into a zero balance — a failed
   * lookup must be distinguishable from a genuinely empty wallet.
   */
  async getBalance(): Promise<McomWalletBalance> {
    return api.get("/wallet/balance");
  },

  /**
   * Build the URL of the correct MCOM Central Hub **web app** wallet page for
   * the current user. Pass `user` to resolve it explicitly, otherwise the
   * signed-in user from the auth store is used.
   */
  getCentralTopUpUrl(user?: DashboardUser | null): string {
    const current = user ?? useAuthStore.getState().user;
    const base = MCOM_CONFIG.CENTRAL_APP_URL.replace(/\/+$/, "");
    return `${base}${getCentralWalletPath(current)}`;
  },

  /** Alias for `getCentralTopUpUrl` — the wallet page is where top-ups happen. */
  getCentralWalletUrl(user?: DashboardUser | null): string {
    return walletService.getCentralTopUpUrl(user);
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
