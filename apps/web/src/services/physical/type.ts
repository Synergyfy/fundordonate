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
