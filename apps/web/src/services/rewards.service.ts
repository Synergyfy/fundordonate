// =============================================================================
// Rewards Service (Frontend)
// API methods for city-specific and borough-specific rewards.
// =============================================================================

import api from "@/lib/api";

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

export const rewardsApi = {
  /**
   * Get city rewards for a location.
   */
  async getCityRewards(cityLocationId: string): Promise<CityReward[]> {
    try {
      const res = await api.get(`/rewards/city/${cityLocationId}`);
      return res.data.data || [];
    } catch {
      return getDemoCityRewards(cityLocationId);
    }
  },

  /**
   * Get borough rewards for a location.
   */
  async getBoroughRewards(boroughLocationId: string): Promise<BoroughReward[]> {
    try {
      const res = await api.get(`/rewards/borough/${boroughLocationId}`);
      return res.data.data || [];
    } catch {
      return getDemoBoroughRewards(boroughLocationId);
    }
  },

  /**
   * Get user's granted rewards.
   */
  async getUserRewards(userId: string): Promise<RewardGrant[]> {
    try {
      const res = await api.get(`/rewards/user/${userId}`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Check and grant rewards for a user.
   */
  async checkAndGrantRewards(userId: string, locationId: string): Promise<RewardGrant[]> {
    try {
      const res = await api.post(`/rewards/check`, { userId, locationId });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Admin: Create a city reward.
   */
  async createCityReward(data: Partial<CityReward>): Promise<CityReward | null> {
    try {
      const res = await api.post("/rewards/city", data);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Admin: Create a borough reward.
   */
  async createBoroughReward(data: Partial<BoroughReward>): Promise<BoroughReward | null> {
    try {
      const res = await api.post("/rewards/borough", data);
      return res.data.data || null;
    } catch {
      return null;
    }
  },
};

// =============================================================================
// Demo Fallback Data
// =============================================================================

function getDemoCityRewards(cityLocationId: string): CityReward[] {
  return [
    {
      id: `city-reward-1-${cityLocationId}`,
      cityLocationId,
      cityName: "Your City",
      title: "First Contribution",
      description: "Thank you for your first contribution to our city hub!",
      type: "badge",
      trigger: "first_contribution",
      badgeIcon: "🌟",
      badgeColor: "amber",
      pointsValue: 100,
      isActive: true,
      grantedCount: 1250,
      createdAt: "2025-01-15T00:00:00Z",
    },
    {
      id: `city-reward-2-${cityLocationId}`,
      cityLocationId,
      cityName: "Your City",
      title: "City Champion",
      description: "Contributed over £100 to city campaigns. You're a true champion!",
      type: "badge",
      trigger: "milestone_reached",
      minContributionPence: 10000,
      badgeIcon: "🏆",
      badgeColor: "blue",
      pointsValue: 500,
      isActive: true,
      grantedCount: 342,
      createdAt: "2025-01-15T00:00:00Z",
    },
    {
      id: `city-reward-3-${cityLocationId}`,
      cityLocationId,
      cityName: "Your City",
      title: "Multi-Campaign Supporter",
      description: "Backed 5 or more city campaigns. Your support makes a difference!",
      type: "badge",
      trigger: "campaign_completed",
      minCampaignCount: 5,
      badgeIcon: "🤝",
      badgeColor: "green",
      pointsValue: 300,
      isActive: true,
      grantedCount: 189,
      createdAt: "2025-01-15T00:00:00Z",
    },
    {
      id: `city-reward-4-${cityLocationId}`,
      cityLocationId,
      cityName: "Your City",
      title: "Early Bird",
      description: "Among the first 100 contributors to this city hub.",
      type: "badge",
      trigger: "first_contribution",
      badgeIcon: "🐦",
      badgeColor: "teal",
      pointsValue: 200,
      isActive: true,
      grantedCount: 100,
      createdAt: "2025-01-15T00:00:00Z",
    },
  ];
}

function getDemoBoroughRewards(boroughLocationId: string): BoroughReward[] {
  return [
    {
      id: `borough-reward-1-${boroughLocationId}`,
      boroughLocationId,
      boroughName: "Your Borough",
      title: "Borough Supporter",
      description: "Thank you for supporting your local borough campaign!",
      type: "badge",
      trigger: "first_contribution",
      badgeIcon: "🏘️",
      badgeColor: "green",
      pointsValue: 50,
      isActive: true,
      grantedCount: 456,
      createdAt: "2025-01-15T00:00:00Z",
    },
    {
      id: `borough-reward-2-${boroughLocationId}`,
      boroughLocationId,
      boroughName: "Your Borough",
      title: "Borough Champion",
      description: "Contributed over £50 to borough campaigns. You're making a local impact!",
      type: "badge",
      trigger: "milestone_reached",
      minContributionPence: 5000,
      badgeIcon: "⭐",
      badgeColor: "amber",
      pointsValue: 250,
      isActive: true,
      grantedCount: 89,
      createdAt: "2025-01-15T00:00:00Z",
    },
  ];
}
