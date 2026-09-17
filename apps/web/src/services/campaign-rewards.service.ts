// =============================================================================
// Campaign Rewards API Service (Frontend)
// API methods for managing trigger-based campaign rewards.
// =============================================================================

import api from "@/lib/api";

// ───────── Types ─────────

export interface RewardTriggerConfig {
  mode: "min" | "range" | "exact";
  min?: number;
  max?: number;
  exact?: number;
}

export interface RewardFulfilmentConfig {
  url?: string;
  webhookUrl?: string;
  instructions?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  physicalType: string;
  assetType?: string;
  assetUrl?: string;
  assetFileName?: string;
  quantity: number;
  order: number;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  order: number;
  triggerType: string;
  triggerConfig: RewardTriggerConfig;
  audience: string;
  quantityType: string;
  quantityLimit?: number;
  quantityClaimed: number;
  availableFrom?: string;
  availableUntil?: string;
  claimDeadlineDays: number;
  fulfilmentType: string;
  fulfilmentConfig?: RewardFulfilmentConfig;
  image?: string;
  rewardType: string;
  currency: string;
  status: string;
  items: RewardItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RewardEntitlement {
  id: string;
  userId: string;
  rewardId: string;
  campaignId: string;
  triggerValue: Record<string, unknown>;
  status: string;
  earnedAt: string;
  claimedAt?: string;
  fulfilledAt?: string;
  expiresAt?: string;
  claimReference?: string;
  reward?: Reward;
  campaign?: { id: string; title: string; slug?: string };
}

// ───────── Admin Reward API ─────────

export const campaignRewardsApi = {
  /** List all rewards for a campaign */
  async listByCampaign(campaignId: string): Promise<Reward[]> {
    const res = await api.get(`/admin/campaigns/${campaignId}/rewards`);
    return res.data.data;
  },

  /** Get a single reward */
  async get(rewardId: string): Promise<Reward> {
    const res = await api.get(`/admin/rewards/${rewardId}`);
    return res.data.data;
  },

  /** Create a reward */
  async create(campaignId: string, data: Record<string, unknown>): Promise<Reward> {
    const res = await api.post(`/admin/campaigns/${campaignId}/rewards`, data);
    return res.data.data;
  },

  /** Update a reward */
  async update(rewardId: string, data: Record<string, unknown>): Promise<Reward> {
    const res = await api.put(`/admin/rewards/${rewardId}`, data);
    return res.data.data;
  },

  /** Delete a reward */
  async delete(rewardId: string): Promise<void> {
    await api.delete(`/admin/rewards/${rewardId}`);
  },

  /** Add an item to a reward */
  async addItem(rewardId: string, data: Record<string, unknown>): Promise<RewardItem> {
    const res = await api.post(`/admin/rewards/${rewardId}/items`, data);
    return res.data.data;
  },

  /** Update a reward item */
  async updateItem(itemId: string, data: Record<string, unknown>): Promise<RewardItem> {
    const res = await api.put(`/admin/rewards/items/${itemId}`, data);
    return res.data.data;
  },

  /** Delete a reward item */
  async deleteItem(itemId: string): Promise<void> {
    await api.delete(`/admin/rewards/items/${itemId}`);
  },

  /** Reorder items within a reward */
  async reorderItems(rewardId: string, itemIds: string[]): Promise<void> {
    await api.put(`/admin/rewards/${rewardId}/items/reorder`, { itemIds });
  },

  /** Set campaign qualification mode */
  async setQualificationMode(campaignId: string, mode: "highest" | "cumulative"): Promise<void> {
    await api.put(`/admin/campaigns/${campaignId}/qualification-mode`, { mode });
  },

  /** List entitlements for a campaign */
  async listEntitlements(campaignId: string): Promise<RewardEntitlement[]> {
    const res = await api.get(`/admin/campaigns/${campaignId}/entitlements`);
    return res.data.data;
  },

  /** Fulfill an entitlement (admin) */
  async fulfillEntitlement(entitlementId: string, reference?: string): Promise<RewardEntitlement> {
    const res = await api.put(`/admin/entitlements/${entitlementId}/fulfill`, { reference });
    return res.data.data;
  },
};

// ───────── User Reward API ─────────

export const userRewardsApi = {
  /** Get all my entitlements */
  async listMyRewards(campaignId?: string): Promise<RewardEntitlement[]> {
    const params = campaignId ? { campaignId } : {};
    const res = await api.get("/user/rewards", { params });
    return res.data.data;
  },

  /** Get a single entitlement */
  async get(entitlementId: string): Promise<RewardEntitlement> {
    const res = await api.get(`/user/rewards/${entitlementId}`);
    return res.data.data;
  },

  /** Claim an earned reward */
  async claim(entitlementId: string): Promise<RewardEntitlement> {
    const res = await api.post(`/user/rewards/${entitlementId}/claim`);
    return res.data.data;
  },
};
