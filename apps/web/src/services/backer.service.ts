// =============================================================================
// Backer Service
// API methods for backer status, badges, and recognition.
// =============================================================================

import api from "@/lib/api";

export interface BackerStatus {
  id: string;
  userId: string;
  statusType: string;
  sourceCampaignId: string;
  locationId?: string;
  locationName?: string;
  cityCount?: number;
  grantedAt: string;
  visibility: string;
}

export interface BackerLeaderboardEntry {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  username: string;
  backerTier: string;
  totalContributed: number;
  campaignCount: number;
  locationName?: string;
  isOriginalFoundingMember?: boolean;
}

export interface BackerFunnelCode {
  code: string;
  issuedAt: string;
  expiresAt?: string;
  redeemed: boolean;
}

export const backerApi = {
  /**
   * Get backer status for a user.
   */
  async getUserBackerStatus(userId: string): Promise<BackerStatus | null> {
    try {
      const res = await api.get(`/backer/status/${userId}`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get the current user's backer status.
   */
  async getMyBackerStatus(): Promise<BackerStatus | null> {
    try {
      const res = await api.get(`/backer/my-status`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get backer leaderboard for a location.
   */
  async getLeaderboard(params: {
    locationId?: string;
    limit?: number;
    sortBy?: "totalContributed" | "campaignCount" | "grantedAt";
  }): Promise<BackerLeaderboardEntry[]> {
    try {
      const res = await api.get(`/backer/leaderboard`, { params });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Issue a backer funnel code (through National Hub funnel).
   */
  async issueFunnelCode(): Promise<BackerFunnelCode | null> {
    try {
      const res = await api.post(`/backer/funnel-code`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Redeem a backer funnel code to acknowledge Backer Status.
   */
  async redeemFunnelCode(code: string): Promise<{ success: boolean; backerStatus?: BackerStatus }> {
    try {
      const res = await api.post(`/backer/redeem-code`, { code });
      return res.data.data || { success: false };
    } catch {
      return { success: false };
    }
  },

  /**
   * Get all backers for admin management.
   */
  async getBackers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    locationId?: string;
  }): Promise<{ backers: BackerStatus[]; total: number; totalPages: number }> {
    try {
      const res = await api.get(`/admin/backers`, { params });
      return res.data.data || { backers: [], total: 0, totalPages: 0 };
    } catch {
      return { backers: [], total: 0, totalPages: 0 };
    }
  },

  /**
   * Update backer visibility setting.
   */
  async updateVisibility(backerId: string, visibility: string): Promise<void> {
    try {
      await api.put(`/backer/${backerId}/visibility`, { visibility });
    } catch {
      // ignore
    }
  },

  /**
   * Get backer stats for a location (for hub pages).
   */
  async getLocationStats(locationId: string): Promise<{
    totalBackers: number;
    backerTierBreakdown: { BACKER: number; CITY: number; NATIONAL: number };
    topContributors: BackerLeaderboardEntry[];
  }> {
    try {
      const res = await api.get(`/backer/location-stats/${locationId}`);
      return res.data.data || { totalBackers: 0, backerTierBreakdown: { BACKER: 0, CITY: 0, NATIONAL: 0 }, topContributors: [] };
    } catch {
      return {
        totalBackers: 0,
        backerTierBreakdown: { BACKER: 0, CITY: 0, NATIONAL: 0 },
        topContributors: [],
      };
    }
  },
};
