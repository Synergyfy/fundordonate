import api from "../api";
import type {
  LifetimeStats,
  PhysicalRewardJourney,
  Terminal,
  TerminalDonation,
  VCardRecognition,
} from "./type";

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

export const physicalService = {
  // ── Terminal ──

  async getTerminal(terminalId: string): Promise<Terminal | null> {
    try {
      const res = await api.get(`/terminal/${terminalId}`);
      return res || null;
    } catch {
      return null;
    }
  },

  async getLocationTerminals(locationId: string): Promise<Terminal[]> {
    try {
      const res = await api.get(`/terminal/location/${locationId}`);
      return res || [];
    } catch {
      return [];
    }
  },

  async createTerminalDonation(data: {
    terminalId: string;
    campaignId: string;
    amount: number;
    customerIdentifier?: string;
    giftAid?: boolean;
  }): Promise<TerminalDonation | null> {
    try {
      const res = await api.post("/terminal/donate", data);
      return res || null;
    } catch {
      return null;
    }
  },

  // ── QR Codes ──

  async generateQrCode(campaignId: string, locationId?: string): Promise<{ url: string; id: string } | null> {
    try {
      const res = await api.post("/qr/generate", { campaignId, locationId });
      return res || null;
    } catch {
      return null;
    }
  },

  async trackQrScan(qrId: string): Promise<void> {
    try {
      await api.post(`/qr/${qrId}/scan`);
    } catch {
      // ignore
    }
  },

  // ── Cross-Channel ──

  async linkContribution(donationId: string, identifier: string): Promise<{ success: boolean }> {
    try {
      const res: any = await api.post("/cross-channel/link", { donationId, identifier });
      return res || { success: false };
    } catch {
      return { success: false };
    }
  },

  async getLifetimeStats(userId: string): Promise<LifetimeStats | null> {
    try {
      const res = await api.get(`/cross-channel/lifetime-stats/${userId}`);
      return res || null;
    } catch {
      return getDemoLifetimeStats();
    }
  },

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
      return res || { donations: [], total: 0 };
    } catch {
      return { donations: [], total: 0 };
    }
  },

  // ── VCard Recognition ──

  async getVCardRecognition(userId: string): Promise<{
    recognitions: VCardRecognition[];
    highestLevel: string;
    displayInfo: any;
  }> {
    try {
      const res = await api.get(`/vcard-recognition/${userId}`);
      return res || { recognitions: [], highestLevel: "none", displayInfo: null };
    } catch {
      return { recognitions: [], highestLevel: "none", displayInfo: null };
    }
  },

  // ── Physical Reward Journey ──

  async startPhysicalJourney(rewardId: string, businessId: string): Promise<PhysicalRewardJourney | null> {
    try {
      const res = await api.post("/physical-reward/start", { rewardId, businessId });
      return res || null;
    } catch {
      return null;
    }
  },

  async completePhysicalRedemption(journeyId: string, donationId: string): Promise<{ success: boolean }> {
    try {
      const res = await api.post("/physical-reward/complete", { journeyId, donationId });
      return res || { success: false };
    } catch {
      return { success: false };
    }
  },

  async getUserPhysicalJourneys(userId: string): Promise<PhysicalRewardJourney[]> {
    try {
      const res = await api.get(`/physical-reward/journeys/${userId}`);
      return res || [];
    } catch {
      return [];
    }
  },
};

export const physicalApi = physicalService;
export default physicalService;
export type * from "./type";
