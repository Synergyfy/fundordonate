export interface LeaderboardRankResult {
  rank: number;
  totalContributed: number;
  totalBusinesses: number;
}

export interface BusinessLeaderboardEntry {
  rank: number;
  businessId: string;
  name: string;
  location: string;
  membershipTier: string;
  totalContributed: number;
  change: number;
  isCurrentBusiness: boolean;
}

export interface LeaderboardEntry {
  id?: string;
  userId?: string;
  businessId?: string;
  name?: string;
  rank: number;
  totalContributed: number;
  campaignCount?: number;
  locationId?: string;
  locationName?: string;
  location?: string;
  hierarchyLevel?: string;
  qualificationStatus?: string;
  qualifiedAt?: string;
  qualificationExpiresAt?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    username: string;
  };
  backerTier?: string;
  membershipTier?: string;
  isOriginalFoundingMember?: boolean;
  change?: number;
  isCurrentBusiness?: boolean;
}

export interface Leaderboard {
  id: string;
  scope: string;
  scopeId?: string;
  scopeName?: string;
  totalEntries: number;
  lastUpdated: string;
  entries: LeaderboardEntry[];
  qualificationLimit?: number;
  qualificationWindowHours?: number;
}

export interface LeaderboardResponse {
  currentRank: LeaderboardRankResult;
  entries: LeaderboardEntry[];
  total: number;
}

export interface LeaderboardQueryDto {
  scope?: "national" | "city" | "local_area" | "high_street";
  location?: string;
  page?: number;
  limit?: number;
}
