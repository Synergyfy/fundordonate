import api from "../api";
import type {
  BoroughReward,
  CityReward,
  RewardGrant,
  RewardsResponse,
} from "./type";

export const rewardService = {
  /**
   * Fetch all earned rewards and locked achievements for business dashboard.
   */
  async getRewards(): Promise<RewardsResponse> {
    return api.get("/business/rewards");
  },

  /**
   * Get city rewards for a location.
   */
  async getCityRewards(cityLocationId: string): Promise<CityReward[]> {
    try {
      const res = await api.get(`/rewards/city/${cityLocationId}`);
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Get borough rewards for a location.
   */
  async getBoroughRewards(boroughLocationId: string): Promise<BoroughReward[]> {
    try {
      const res = await api.get(`/rewards/borough/${boroughLocationId}`);
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Get user's granted rewards.
   */
  async getUserRewards(userId: string): Promise<RewardGrant[]> {
    try {
      const res = await api.get(`/rewards/user/${userId}`);
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Check and grant rewards for a user.
   */
  async checkAndGrantRewards(userId: string, locationId: string): Promise<RewardGrant[]> {
    try {
      const res = await api.post("/rewards/check", { userId, locationId });
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Admin: Create a city reward.
   */
  async createCityReward(data: Partial<CityReward>): Promise<CityReward | null> {
    try {
      return await api.post("/rewards/city", data);
    } catch {
      return null;
    }
  },

  /**
   * Admin: Create a borough reward.
   */
  async createBoroughReward(data: Partial<BoroughReward>): Promise<BoroughReward | null> {
    try {
      return await api.post("/rewards/borough", data);
    } catch {
      return null;
    }
  },
};

export const rewardsApi = rewardService;
export default rewardService;
export type * from "./type";
