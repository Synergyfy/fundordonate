// =============================================================================
// Founding Service
// API methods for founding programmes, memberships, and benefits.
// =============================================================================

import api from "@/lib/api";

export interface FoundingProgramme {
  id: string;
  locationId: string;
  locationName?: string;
  audience: "BUSINESS" | "CONSUMER";
  status: string;
  title: string;
  description?: string;
  totalAllocation: number;
  allocatedCount: number;
  remainingCount: number;
  opensAt?: string;
  closesAt?: string;
  contributionAmounts: string[];
  benefits: string[];
  isOriginal?: boolean;
}

export interface FoundingMembership {
  id: string;
  userId: string;
  programmeId: string;
  locationId: string;
  locationName?: string;
  audience: "BUSINESS" | "CONSUMER";
  status: string;
  contributionAmount: number;
  isOriginal: boolean;
  isMonthly: boolean;
  grantedAt: string;
  expiresAt?: string;
  benefits: string[];
}

export interface JoinProgrammeInput {
  programmeId: string;
  contributionAmount: number;
  isMonthly?: boolean;
  paymentMethod?: string;
}

export const foundingApi = {
  /**
   * Get all founding programmes for a location.
   */
  async getProgrammes(locationId: string): Promise<FoundingProgramme[]> {
    try {
      const res = await api.get(`/founding/programmes`, { params: { locationId } });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get a single founding programme by ID.
   */
  async getProgramme(programmeId: string): Promise<FoundingProgramme | null> {
    try {
      const res = await api.get(`/founding/programmes/${programmeId}`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Join a founding programme (one-time or monthly).
   * Creates a FoundingMembership and processes payment.
   */
  async joinProgramme(input: JoinProgrammeInput): Promise<FoundingMembership | null> {
    try {
      const res = await api.post(`/founding/programmes/${input.programmeId}/join`, input);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get the current user's founding memberships.
   */
  async getMyMemberships(): Promise<FoundingMembership[]> {
    try {
      const res = await api.get(`/founding/my-memberships`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get founding members for a programme (leaderboard).
   */
  async getProgrammeMembers(programmeId: string): Promise<FoundingMembership[]> {
    try {
      const res = await api.get(`/founding/programmes/${programmeId}/members`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get the user's complete contributor profile.
   */
  async getContributorProfile(userId: string): Promise<{
    backerTier: string | null;
    totalCampaignsBacked: number;
    totalContributed: number;
    citiesBacked: string[];
    foundingMemberships: FoundingMembership[];
    badges: { id: string; type: string; tier?: string; locationName?: string; isOriginal?: boolean; awardedAt: string }[];
    isOriginalFoundingMember: boolean;
  } | null> {
    try {
      const res = await api.get(`/founding/contributor-profile/${userId}`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Check if a user is an Original Founding Member for a location.
   */
  async checkOriginalStatus(userId: string, locationId: string): Promise<boolean> {
    try {
      const res = await api.get(`/founding/check-original`, { params: { userId, locationId } });
      return res.data.data?.isOriginal || false;
    } catch {
      return false;
    }
  },
};
