// =============================================================================
// FundOrDonate — Reward Domain Service (Trigger-Based)
// Manages reward tiers with trigger configuration, items, availability,
// fulfilment, and entitlement lifecycle.
// =============================================================================

import { prisma } from "../lib/prisma";
import { NotFoundError, AppError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";

// =============================================================================
// Types
// =============================================================================

export interface RewardTriggerInput {
  mode: "min" | "range" | "exact";
  min?: number;  // pence
  max?: number;  // pence
  exact?: number; // pence
}

export interface RewardFulfilmentInput {
  type: string; // internal | mcom_vcard | external_link | webhook | manual | instruction
  config?: {
    url?: string;
    webhookUrl?: string;
    instructions?: string;
  } | null;
}

export interface RewardItemInput {
  id?: string; // for updates
  title: string;
  description?: string;
  image?: string;
  physicalType?: string; // physical | digital
  assetType?: string;    // file | url
  assetUrl?: string;
  assetFileName?: string;
  quantity?: number;
  order?: number;
}

export interface RewardCreateInput {
  campaignId: string;
  title: string;
  description?: string;
  order?: number;
  triggerType?: string;
  triggerConfig: RewardTriggerInput;
  audience?: string;
  quantityType?: string;
  quantityLimit?: number | null;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  claimDeadlineDays?: number;
  fulfilmentType?: string;
  fulfilmentConfig?: RewardFulfilmentInput["config"];
  image?: string;
  rewardType?: string;
  currency?: string;
  items?: RewardItemInput[];
}

export interface RewardUpdateInput {
  title?: string;
  description?: string;
  order?: number;
  triggerType?: string;
  triggerConfig?: RewardTriggerInput;
  audience?: string;
  quantityType?: string;
  quantityLimit?: number | null;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  claimDeadlineDays?: number;
  fulfilmentType?: string;
  fulfilmentConfig?: RewardFulfilmentInput["config"];
  image?: string;
  rewardType?: string;
  currency?: string;
  status?: string;
}

// =============================================================================
// Reward CRUD
// =============================================================================

export async function createReward(data: RewardCreateInput) {
  const reward = await prisma.reward.create({
    data: {
      campaignId: data.campaignId,
      title: data.title,
      description: data.description,
      order: data.order ?? 0,
      triggerType: data.triggerType || "contribution",
      triggerConfig: data.triggerConfig as any,
      audience: data.audience || "both",
      quantityType: data.quantityType || "unlimited",
      quantityLimit: data.quantityLimit,
      availableFrom: data.availableFrom,
      availableUntil: data.availableUntil,
      claimDeadlineDays: data.claimDeadlineDays ?? 30,
      fulfilmentType: data.fulfilmentType || "manual",
      fulfilmentConfig: data.fulfilmentConfig as any,
      image: data.image,
      rewardType: data.rewardType || "standard",
      currency: data.currency || "GBP",
      items: data.items?.length
        ? {
            create: data.items.map((item, i) => ({
              title: item.title,
              description: item.description,
              image: item.image,
              physicalType: item.physicalType || "digital",
              assetType: item.assetType,
              assetUrl: item.assetUrl,
              assetFileName: item.assetFileName,
              quantity: item.quantity ?? 1,
              order: item.order ?? i,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });

  // Mark campaign as having rewards
  await prisma.campaign.update({
    where: { id: data.campaignId },
    data: { hasRewards: true },
  });

  logger.info(`Reward created: ${reward.id} for campaign ${data.campaignId}`);
  return reward;
}

export async function getRewardsByCampaign(campaignId: string) {
  return prisma.reward.findMany({
    where: { campaignId },
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
}

export async function getRewardById(id: string) {
  const reward = await prisma.reward.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      campaign: { select: { id: true, title: true, qualificationMode: true } },
    },
  });
  if (!reward) throw new NotFoundError("Reward");
  return reward;
}

export async function updateReward(id: string, data: RewardUpdateInput) {
  await getRewardById(id);
  return prisma.reward.update({
    where: { id },
    data: {
      ...data,
      triggerConfig: data.triggerConfig as any,
      fulfilmentConfig: data.fulfilmentConfig as any,
    },
    include: { items: true },
  });
}

export async function deleteReward(id: string) {
  const reward = await getRewardById(id);
  await prisma.reward.delete({ where: { id } });

  // Check if campaign has any remaining rewards
  const remaining = await prisma.reward.count({
    where: { campaignId: reward.campaignId },
  });
  if (remaining === 0) {
    await prisma.campaign.update({
      where: { id: reward.campaignId },
      data: { hasRewards: false },
    });
  }

  logger.info(`Reward deleted: ${id}`);
}

// =============================================================================
// Reward Items
// =============================================================================

export async function createRewardItem(rewardId: string, data: RewardItemInput) {
  // Verify reward exists
  await getRewardById(rewardId);

  // Get next order index
  const maxOrder = await prisma.rewardItem.aggregate({
    where: { rewardId },
    _max: { order: true },
  });

  const item = await prisma.rewardItem.create({
    data: {
      rewardId,
      title: data.title,
      description: data.description,
      image: data.image,
      physicalType: data.physicalType || "digital",
      assetType: data.assetType,
      assetUrl: data.assetUrl,
      assetFileName: data.assetFileName,
      quantity: data.quantity ?? 1,
      order: data.order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  logger.info(`Reward item created: ${item.id} for reward ${rewardId}`);
  return item;
}

export async function updateRewardItem(id: string, data: Partial<RewardItemInput>) {
  const item = await prisma.rewardItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Reward item");

  return prisma.rewardItem.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      image: data.image,
      physicalType: data.physicalType,
      assetType: data.assetType,
      assetUrl: data.assetUrl,
      assetFileName: data.assetFileName,
      quantity: data.quantity,
      order: data.order,
    },
  });
}

export async function deleteRewardItem(id: string) {
  const item = await prisma.rewardItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Reward item");
  return prisma.rewardItem.delete({ where: { id } });
}

export async function reorderRewardItems(rewardId: string, itemIds: string[]) {
  await getRewardById(rewardId);

  const updates = itemIds.map((itemId, index) =>
    prisma.rewardItem.update({
      where: { id: itemId },
      data: { order: index },
    })
  );

  await prisma.$transaction(updates);
}

// =============================================================================
// Reward Eligibility & Trigger Evaluation
// =============================================================================

/**
 * Evaluate whether a contribution triggers a reward.
 * Returns true if the contribution amount matches the trigger config.
 */
export function evaluateContributionTrigger(
  triggerConfig: { mode: string; min?: number; max?: number; exact?: number },
  contributionAmount: number // in pence
): boolean {
  switch (triggerConfig.mode) {
    case "min":
      return contributionAmount >= (triggerConfig.min ?? 0);
    case "range":
      return (
        contributionAmount >= (triggerConfig.min ?? 0) &&
        contributionAmount <= (triggerConfig.max ?? Infinity)
      );
    case "exact":
      return contributionAmount === triggerConfig.exact;
    default:
      return false;
  }
}

/**
 * Check if a reward is currently available (quantity, date range).
 */
export function isRewardAvailable(reward: {
  quantityType: string;
  quantityLimit: number | null;
  quantityClaimed: number;
  availableFrom: Date | null;
  availableUntil: Date | null;
}): { available: boolean; reason?: string } {
  // Check quantity
  if (reward.quantityType === "limited" && reward.quantityLimit !== null) {
    if (reward.quantityClaimed >= reward.quantityLimit) {
      return { available: false, reason: "Sold out" };
    }
  }

  // Check date range
  const now = new Date();
  if (reward.availableFrom && now < reward.availableFrom) {
    return { available: false, reason: "Not yet available" };
  }
  if (reward.availableUntil && now > reward.availableUntil) {
    return { available: false, reason: "No longer available" };
  }

  return { available: true };
}

/**
 * Find the best matching reward for a contribution based on campaign qualification mode.
 * - "highest": returns the single highest qualifying reward
 * - "cumulative": returns all qualifying rewards
 */
export async function findMatchingRewards(
  campaignId: string,
  contributionAmount: number // in pence
): Promise<{ reward: any; triggerValue: Record<string, unknown> }[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { qualificationMode: true },
  });

  const rewards = await prisma.reward.findMany({
    where: {
      campaignId,
      triggerType: "contribution",
      status: "active",
    },
    include: { items: true },
    orderBy: { order: "asc" },
  });

  const qualifying: { reward: any; triggerValue: Record<string, unknown> }[] = [];

  for (const reward of rewards) {
    const triggerConfig = reward.triggerConfig as any;
    if (evaluateContributionTrigger(triggerConfig, contributionAmount)) {
      const availability = isRewardAvailable(reward);
      if (availability.available) {
        qualifying.push({
          reward,
          triggerValue: {
            contributionAmount,
            triggerMode: triggerConfig.mode,
            matchedAt: new Date().toISOString(),
          },
        });
      }
    }
  }

  if (campaign?.qualificationMode === "highest") {
    // Return only the last (highest) qualifying reward
    return qualifying.length > 0 ? [qualifying[qualifying.length - 1]] : [];
  }

  // cumulative — return all
  return qualifying;
}

// =============================================================================
// Entitlement Management
// =============================================================================

export async function grantEntitlement(
  userId: string,
  rewardId: string,
  campaignId: string,
  triggerValue: Record<string, unknown>
) {
  // Check if already entitled
  const existing = await prisma.rewardEntitlement.findUnique({
    where: { userId_rewardId: { userId, rewardId } },
  });

  if (existing) {
    logger.info(`Entitlement already exists: user=${userId} reward=${rewardId}`);
    return existing;
  }

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward) throw new NotFoundError("Reward");

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + reward.claimDeadlineDays);

  const entitlement = await prisma.rewardEntitlement.create({
    data: {
      userId,
      rewardId,
      campaignId,
      triggerValue,
      status: "earned",
      expiresAt,
    },
    include: {
      reward: { include: { items: true } },
    },
  });

  // Increment quantity claimed
  if (reward.quantityType === "limited") {
    await prisma.reward.update({
      where: { id: rewardId },
      data: { quantityClaimed: { increment: 1 } },
    });
  }

  logger.info(`Entitlement granted: user=${userId} reward=${rewardId}`);
  return entitlement;
}

export async function claimEntitlement(entitlementId: string, userId: string) {
  const entitlement = await prisma.rewardEntitlement.findUnique({
    where: { id: entitlementId },
    include: { reward: true },
  });

  if (!entitlement) throw new NotFoundError("Entitlement");
  if (entitlement.userId !== userId) throw new AppError(403, "Not your entitlement");
  if (entitlement.status !== "earned") throw new AppError(400, `Cannot claim: status is ${entitlement.status}`);

  // Check expiry
  if (entitlement.expiresAt && new Date() > entitlement.expiresAt) {
    await prisma.rewardEntitlement.update({
      where: { id: entitlementId },
      data: { status: "expired" },
    });
    throw new AppError(400, "Entitlement has expired");
  }

  const updated = await prisma.rewardEntitlement.update({
    where: { id: entitlementId },
    data: {
      status: "claimed",
      claimedAt: new Date(),
    },
    include: { reward: true },
  });

  logger.info(`Entitlement claimed: ${entitlementId}`);
  return updated;
}

export async function fulfillEntitlement(entitlementId: string, reference?: string) {
  const entitlement = await prisma.rewardEntitlement.findUnique({
    where: { id: entitlementId },
  });

  if (!entitlement) throw new NotFoundError("Entitlement");
  if (entitlement.status !== "claimed") throw new AppError(400, `Cannot fulfil: status is ${entitlement.status}`);

  return prisma.rewardEntitlement.update({
    where: { id: entitlementId },
    data: {
      status: "fulfilled",
      fulfilledAt: new Date(),
      claimReference: reference,
    },
    include: { reward: true },
  });
}

export async function getUserEntitlements(userId: string, campaignId?: string) {
  return prisma.rewardEntitlement.findMany({
    where: {
      userId,
      ...(campaignId ? { campaignId } : {}),
    },
    include: {
      reward: { include: { items: true } },
      campaign: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { earnedAt: "desc" },
  });
}

export async function getEntitlementById(id: string) {
  const entitlement = await prisma.rewardEntitlement.findUnique({
    where: { id },
    include: {
      reward: { include: { items: true } },
      campaign: { select: { id: true, title: true, slug: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!entitlement) throw new NotFoundError("Entitlement");
  return entitlement;
}

export async function getCampaignEntitlements(campaignId: string) {
  return prisma.rewardEntitlement.findMany({
    where: { campaignId },
    include: {
      reward: { select: { id: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { earnedAt: "desc" },
  });
}

// =============================================================================
// Batch — Process Pledge Entitlements
// =============================================================================

/**
 * After a pledge is confirmed, evaluate all matching rewards and grant entitlements.
 * Called synchronously from the payment confirmation flow.
 */
export async function processPledgeEntitlements(
  userId: string,
  campaignId: string,
  pledgeId: string,
  contributionAmount: number // in pence
) {
  const matches = await findMatchingRewards(campaignId, contributionAmount);

  const granted = [];
  for (const match of matches) {
    const entitlement = await grantEntitlement(
      userId,
      match.reward.id,
      campaignId,
      {
        ...match.triggerValue,
        pledgeId,
      }
    );
    granted.push(entitlement);
  }

  if (granted.length > 0) {
    logger.info(`Granted ${granted.length} entitlement(s) for user=${userId} campaign=${campaignId}`);
  }

  return granted;
}
