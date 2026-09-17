// =============================================================================
// Physical Integration Service (Frontend)
// API methods for terminal, QR, in-store, and cross-channel features.
// =============================================================================

import api from "@/lib/api";

export interface Terminal {
  id: string;
  locationId: string;
  locationName?: string;
  businessId?: string;
  businessName?: string;
  deviceId: string;
  status: string;
  lastSeenAt?: string;
  campaignIds: string[];
  config?: {
    allowCustomAmount: boolean;
    presetAmounts: number[];
    showCampaignDetails: boolean;
    receiptPrintEnabled: boolean;
  };
}

export interface TerminalDonation {
  id: string;
  terminalId: string;
  campaignId: string;
  amount: number;
  currency: string;
  customerIdentifier?: string;
  customerId?: string;
  channel: string;
  receiptNumber?: string;
  giftAid: boolean;
  status: string;
  createdAt: string;
}

export interface LifetimeStats {
  userId: string;
  totalContributed: number;
  totalCampaignsBacked: number;
  totalPledges: number;
  channelBreakdown: {
    web: number;
    terminal: number;
    qr: number;
    in_store: number;
    vcard: number;
    mobile_app: number;
  };
  hierarchyBreakdown: {
    national: number;
    city: number;
    borough: number;
    high_street: number;
    business: number;
  };
  firstContributionAt?: string;
  lastContributionAt?: string;
  uniqueLocationsBacked: number;
  isCommunityBacker: boolean;
  communityBackerAwardedAt?: string;
}

export interface VCardRecognition {
  id: string;
  userId: string;
  recognitionLevel: string;
  trigger: string;
  details: {
    badgeIcon?: string;
    badgeColor?: string;
    title: string;
    description: string;
    pointsAwarded?: number;
  };
  awardedAt: string;
}

export interface PhysicalRewardJourney {
  id: string;
  userId: string;
  rewardId: string;
  onlineQualified: boolean;
  onlineQualifiedAt?: string;
  physicalRedeemed: boolean;
  physicalRedeemedAt?: string;
  redemptionBusinessId?: string;
  redemptionBusinessName?: string;
  redemptionQrCode?: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
}

export const physicalApi = {
  // ===========================================================================
  // Terminal
  // ===========================================================================

  /**
   * Get terminal by ID.
   */
  async getTerminal(terminalId: string): Promise<Terminal | null> {
    try {
      const res = await api.get(`/terminal/${terminalId}`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get terminals for a location.
   */
  async getLocationTerminals(locationId: string): Promise<Terminal[]> {
    try {
      const res = await api.get(`/terminal/location/${locationId}`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Create a terminal donation.
   */
  async createTerminalDonation(data: {
    terminalId: string;
    campaignId: string;
    amount: number;
    customerIdentifier?: string;
    giftAid?: boolean;
  }): Promise<TerminalDonation | null> {
    try {
      const res = await api.post("/terminal/donate", data);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  // ===========================================================================
  // QR Codes
  // ===========================================================================

  /**
   * Generate QR code for a campaign.
   */
  async generateQrCode(campaignId: string, locationId?: string): Promise<{ url: string; id: string } | null> {
    try {
      const res = await api.post("/qr/generate", { campaignId, locationId });
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Track QR code scan.
   */
  async trackQrScan(qrId: string): Promise<void> {
    try {
      await api.post(`/qr/${qrId}/scan`);
    } catch {
      // ignore
    }
  },

  // ===========================================================================
  // Cross-Channel
  // ===========================================================================

  /**
   * Link contribution to user account.
   */
  async linkContribution(donationId: string, identifier: string): Promise<{ success: boolean }> {
    try {
      const res = await api.post("/cross-channel/link", { donationId, identifier });
      return res.data.data || { success: false };
    } catch {
      return { success: false };
    }
  },

  /**
   * Get user's lifetime stats.
   */
  async getLifetimeStats(userId: string): Promise<LifetimeStats | null> {
    try {
      const res = await api.get(`/cross-channel/lifetime-stats/${userId}`);
      return res.data.data || null;
    } catch {
      return getDemoLifetimeStats();
    }
  },

  /**
   * Get user's contribution history.
   */
  async getContributionHistory(userId: string, options?: {
    limit?: number;
    offset?: number;
    channel?: string;
  }): Promise<{ donations: any[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.set("limit", options.limit.toString());
      if (options?.offset) params.set("offset", options.offset.toString());
      if (options?.channel) params.set("channel", options.channel);
      const res = await api.get(`/cross-channel/history/${userId}?${params.toString()}`);
      return res.data.data || { donations: [], total: 0 };
    } catch {
      return { donations: [], total: 0 };
    }
  },

  // ===========================================================================
  // VCard Recognition
  // ===========================================================================

  /**
   * Get VCard recognition for a user.
   */
  async getVCardRecognition(userId: string): Promise<{
    recognitions: VCardRecognition[];
    highestLevel: string;
    displayInfo: any;
  }> {
    try {
      const res = await api.get(`/vcard-recognition/${userId}`);
      return res.data.data || { recognitions: [], highestLevel: "none", displayInfo: null };
    } catch {
      return { recognitions: [], highestLevel: "none", displayInfo: null };
    }
  },

  // ===========================================================================
  // Physical Reward Journey
  // ===========================================================================

  /**
   * Start a physical reward journey.
   */
  async startPhysicalJourney(rewardId: string, businessId: string): Promise<PhysicalRewardJourney | null> {
    try {
      const res = await api.post("/physical-reward/start", { rewardId, businessId });
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Complete physical redemption.
   */
  async completePhysicalRedemption(journeyId: string, donationId: string): Promise<{ success: boolean }> {
    try {
      const res = await api.post("/physical-reward/complete", { journeyId, donationId });
      return res.data.data || { success: false };
    } catch {
      return { success: false };
    }
  },

  /**
   * Get user's physical reward journeys.
   */
  async getUserPhysicalJourneys(userId: string): Promise<PhysicalRewardJourney[]> {
    try {
      const res = await api.get(`/physical-reward/journeys/${userId}`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },
};

// =============================================================================
// Demo Fallback Data
// =============================================================================

function getDemoLifetimeStats(): LifetimeStats {
  return {
    userId: "demo-user",
    totalContributed: 125000,
    totalCampaignsBacked: 8,
    totalPledges: 3,
    channelBreakdown: {
      web: 75000,
      terminal: 25000,
      qr: 10000,
      in_store: 15000,
      vcard: 0,
      mobile_app: 0,
    },
    hierarchyBreakdown: {
      national: 30000,
      city: 50000,
      borough: 25000,
      high_street: 15000,
      business: 5000,
    },
    firstContributionAt: "2025-01-15T00:00:00Z",
    lastContributionAt: new Date().toISOString(),
    uniqueLocationsBacked: 5,
    isCommunityBacker: true,
    communityBackerAwardedAt: "2025-03-01T00:00:00Z",
  };
}
