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
