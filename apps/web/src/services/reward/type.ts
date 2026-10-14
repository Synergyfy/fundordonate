export interface RewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
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
