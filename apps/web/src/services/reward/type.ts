export interface RewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;

  // ── What the reward actually is / what the owner gets ──
  /** Lifecycle status of the issuance (ISSUED / REDEEMED / EXPIRED / REVOKED / FAILED). */
  status?: string;
  rewardType?: string | null;
  /** Monetary value of the reward in pounds GBP (null when open-ended/unknown). */
  value?: number | null;
  /** Redemption / voucher code the owner quotes to claim the reward. */
  code?: string | null;
  /** Number of units issued. */
  quantity?: number;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  revokedAt?: string | null;

  // ── Provenance: what earned this reward ──
  campaignId?: string | null;
  campaignTitle?: string | null;
  campaignImage?: string | null;
  contributionId?: string | null;
  /** Contribution amount in pence. */
  contributionAmount?: number | null;
  contributionType?: string | null;
  contributionReference?: string | null;
  contributionGateway?: string | null;
  contributionDate?: string | null;
}

export interface RewardsResponse {
  earnedCount: number;
  totalCount: number;
  earned: RewardItem[];
  locked: RewardItem[];
}

export interface CityReward {
  id: string;
  cityLocationId: string;
  cityName: string;
  title: string;
  description: string;
  type: string;
  trigger: string;
  minContributionPence?: number;
  minCampaignCount?: number;
  badgeIcon?: string;
  badgeColor?: string;
  pointsValue?: number;
  isActive: boolean;
  grantedCount: number;
  createdAt: string;
}

export interface BoroughReward {
  id: string;
  boroughLocationId: string;
  boroughName: string;
  title: string;
  description: string;
  type: string;
  trigger: string;
  minContributionPence?: number;
  minCampaignCount?: number;
  badgeIcon?: string;
  badgeColor?: string;
  pointsValue?: number;
  isActive: boolean;
  grantedCount: number;
  createdAt: string;
}

export interface RewardGrant {
  id: string;
  userId: string;
  rewardId: string;
  rewardType: string;
  locationId?: string;
  locationName?: string;
  campaignId?: string;
  grantedAt: string;
  claimed: boolean;
  claimedAt?: string;
  cityReward?: CityReward;
  boroughReward?: BoroughReward;
}
