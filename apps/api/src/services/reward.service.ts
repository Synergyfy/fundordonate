// =============================================================================
// FundOrDonate — Reward Domain Service
// Manages reward tiers, items, downloads, E-cards.
// Conversion rules are configuration-driven, NOT hardcoded.
// =============================================================================

import { prisma } from "../lib/prisma";
import { RewardType, DEFAULT_CURRENCY } from "@fundordonate/types";
import { NotFoundError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";

// =============================================================================
// Types
// =============================================================================

export interface RewardInput {
  campaignId: string;
  title: string;
  description?: string;
  rewardType?: RewardType;
  amount: number; // minimum contribution in minor units
  statedValue?: number; // what the reward claims to be worth
  benefitValue?: number; // actual value to the user
  currency?: string;
  limit?: number; // max quantity (null = unlimited)
  deliveryDate?: Date;
  shippingRequired?: boolean;
  eligibility?: Record<string, unknown>;
  conversionRule?: Record<string, unknown>;
  order?: number;
}

export interface ConversionRule {
  /** Stated value multiplier (e.g., 10 means £1 contribution → £10 stated value) */
  statedValueMultiplier?: number;
  /** Benefit value multiplier */
  benefitValueMultiplier?: number;
  /** Currency for the benefit */
  benefitCurrency?: string;
  /** Custom conversion message */
  message?: string;
}

// =============================================================================
// Reward CRUD
// =============================================================================

export async function createReward(data: RewardInput) {
  const reward = await prisma.reward.create({
    data: {
      campaignId: data.campaignId,
      title: data.title,
      description: data.description,
      rewardType: data.rewardType || RewardType.STANDARD,
      amount: data.amount,
      statedValue: data.statedValue || 0,
      benefitValue: data.benefitValue || 0,
      currency: data.currency || DEFAULT_CURRENCY,
      limit: data.limit,
      deliveryDate: data.deliveryDate,
      eligibility: JSON.stringify(data.eligibility || {}),
      conversionRule: JSON.stringify(data.conversionRule || {}),
      order: data.order ?? 0,
    },
  });

  logger.info(`Reward created: ${reward.id} for campaign ${data.campaignId}`);
  return reward;
}

export async function getRewardsByCampaign(campaignId: string) {
  return prisma.reward.findMany({
    where: { campaignId },
    orderBy: { order: "asc" },
    include: { items: true },
  });
}

export async function getRewardById(id: string) {
  const reward = await prisma.reward.findUnique({
    where: { id },
    include: { items: true, campaign: true },
  });
  if (!reward) throw new NotFoundError("Reward");
  return reward;
}

export async function updateReward(id: string, data: Partial<RewardInput>) {
  await getRewardById(id);
  return prisma.reward.update({
    where: { id },
    data: {
      ...data,
      eligibility: data.eligibility ? JSON.stringify(data.eligibility) : undefined,
      conversionRule: data.conversionRule ? JSON.stringify(data.conversionRule) : undefined,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
    },
  });
}

export async function deleteReward(id: string) {
  await getRewardById(id);
  return prisma.reward.delete({ where: { id } });
}

// =============================================================================
// Reward Items
// =============================================================================

export async function createRewardItem(rewardId: string, data: { title: string; description?: string; quantity?: number }) {
  const item = await prisma.rewardItem.create({
    data: {
      rewardId,
      title: data.title,
      description: data.description,
      quantity: data.quantity || 0,
    },
  });

  logger.info(`Reward item created: ${item.id} for reward ${rewardId}`);
  return item;
}

export async function getRewardItems(rewardId: string) {
  return prisma.rewardItem.findMany({ where: { rewardId } });
}

export async function deleteRewardItem(id: string) {
  return prisma.rewardItem.delete({ where: { id } });
}

// =============================================================================
// Reward Downloads
// =============================================================================

export async function createRewardDownload(rewardItemId: string, userId: string, data: { fileName: string; fileUrl: string }) {
  return prisma.rewardItemDownload.create({
    data: {
      rewardItemId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      userId,
    },
  });
}

export async function getRewardDownloads(rewardItemId: string) {
  return prisma.rewardItemDownload.findMany({ where: { rewardItemId } });
}

// =============================================================================
// Conversion Calculation
// =============================================================================

/**
 * Calculate benefit value based on conversion rule.
 * Conversion rules are configuration — NOT hardcoded business logic.
 */
export function calculateBenefitValue(
  contributionAmount: number,
  conversionRule: ConversionRule
): { statedValue: number; benefitValue: number; currency: string } {
  const statedValueMultiplier = conversionRule.statedValueMultiplier ?? 1;
  const benefitValueMultiplier = conversionRule.benefitValueMultiplier ?? 1;

  return {
    statedValue: Math.round(contributionAmount * statedValueMultiplier),
    benefitValue: Math.round(contributionAmount * benefitValueMultiplier),
    currency: conversionRule.benefitCurrency || DEFAULT_CURRENCY,
  };
}

// =============================================================================
// Eligibility Check
// =============================================================================

export function checkRewardEligibility(
  reward: { eligibility: string; limit?: number | null; currentQuantity?: number },
  userEntitlements: Record<string, unknown> | null
): { eligible: boolean; reason?: string } {
  const eligibility = JSON.parse(reward.eligibility || "{}");

  // Check quantity limit
  if (reward.limit !== null && reward.limit !== undefined) {
    if ((reward.currentQuantity || 0) >= reward.limit) {
      return { eligible: false, reason: "Reward fully claimed" };
    }
  }

  // Check membership tier requirement
  if (eligibility.requiredTier && userEntitlements) {
    const tierOrder = ["bronze", "silver", "gold", "platinum"];
    const userTier = (userEntitlements as any).tier || "bronze";
    if (tierOrder.indexOf(userTier) < tierOrder.indexOf(eligibility.requiredTier)) {
      return { eligible: false, reason: `Requires ${eligibility.requiredTier} membership or higher` };
    }
  }

  return { eligible: true };
}
