// =============================================================================
// FundOrDonate — Reward Engine
// Evaluates campaign reward triggers after payment confirmation.
// Runs synchronously during payment processing.
// IF contribution matches trigger → THEN grant entitlement.
// =============================================================================

import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

// =============================================================================
// Types
// =============================================================================

export interface RewardEvaluationResult {
  campaignId: string;
  campaignTitle: string;
  qualificationMode: string;
  entitlements: EarnedEntitlement[];
}

export interface EarnedEntitlement {
  entitlementId: string;
  rewardId: string;
  rewardTitle: string;
  rewardDescription: string | null;
  triggerValue: Record<string, unknown>;
  expiresAt: Date;
  items: { title: string; physicalType: string }[];
}

// =============================================================================
// Core Engine
// =============================================================================

/**
 * Evaluate reward triggers for a user after a successful payment.
 * Called synchronously from the payment confirmation flow.
 *
 * @param userId - The user who made the contribution
 * @param campaignId - The campaign being contributed to
 * @param contributionAmount - Amount in pence
 * @param pledgeId - The pledge/donation transaction ID
 * @returns Evaluation result with granted entitlements
 */
export async function evaluateRewardTriggers(
  userId: string,
  campaignId: string,
  contributionAmount: number, // pence
  pledgeId: string
): Promise<RewardEvaluationResult> {
  // 1. Fetch campaign with reward config
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      title: true,
      qualificationMode: true,
      hasRewards: true,
    },
  });

  if (!campaign || !campaign.hasRewards) {
    return {
      campaignId,
      campaignTitle: campaign?.title || "",
      qualificationMode: "highest",
      entitlements: [],
    };
  }

  // 2. Fetch all active contribution-triggered rewards for this campaign
  const rewards = await prisma.reward.findMany({
    where: {
      campaignId,
      triggerType: "contribution",
      status: "active",
    },
    include: {
      items: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });

  // 3. Evaluate each reward's trigger
  const qualifying: { reward: typeof rewards[number]; triggerValue: Record<string, unknown> }[] = [];

  for (const reward of rewards) {
    const triggerConfig = reward.triggerConfig as { mode: string; min?: number; max?: number; exact?: number };

    const matches = evaluateContributionTrigger(triggerConfig, contributionAmount);
    if (!matches) continue;

    // Check availability
    const availability = checkAvailability(reward);
    if (!availability.available) {
      logger.info(`Reward ${reward.id} not available: ${availability.reason}`);
      continue;
    }

    // Check if user already has this entitlement
    const existingEntitlement = await prisma.rewardEntitlement.findUnique({
      where: { userId_rewardId: { userId, rewardId: reward.id } },
    });

    if (existingEntitlement) {
      logger.info(`User ${userId} already has entitlement for reward ${reward.id}`);
      continue;
    }

    qualifying.push({
      reward,
      triggerValue: {
        contributionAmount,
        triggerMode: triggerConfig.mode,
        matchedAt: new Date().toISOString(),
        pledgeId,
      },
    });
  }

  // 4. Apply qualification mode
  let toGrant: typeof qualifying;

  if (campaign.qualificationMode === "highest") {
    // Highest = last item in the sorted list (highest trigger threshold)
    toGrant = qualifying.length > 0 ? [qualifying[qualifying.length - 1]] : [];
  } else {
    // Cumulative = all qualifying rewards
    toGrant = qualifying;
  }

  // 5. Grant entitlements
  const entitlements: EarnedEntitlement[] = [];

  for (const match of toGrant) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + match.reward.claimDeadlineDays);

    const entitlement = await prisma.rewardEntitlement.create({
      data: {
        userId,
        rewardId: match.reward.id,
        campaignId,
        triggerValue: match.triggerValue,
        status: "earned",
        expiresAt,
      },
    });

    // Increment quantity claimed
    if (match.reward.quantityType === "limited") {
      await prisma.reward.update({
        where: { id: match.reward.id },
        data: { quantityClaimed: { increment: 1 } },
      });
    }

    entitlements.push({
      entitlementId: entitlement.id,
      rewardId: match.reward.id,
      rewardTitle: match.reward.title,
      rewardDescription: match.reward.description,
      triggerValue: match.triggerValue,
      expiresAt,
      items: match.reward.items.map(item => ({
        title: item.title,
        physicalType: item.physicalType,
      })),
    });

    logger.info(`Entitlement granted: user=${userId} reward=${match.reward.id} campaign=${campaignId}`);
  }

  if (entitlements.length > 0) {
    logger.info(`Reward engine: granted ${entitlements.length} entitlement(s) for user=${userId} on campaign=${campaignId}`);
  }

  return {
    campaignId,
    campaignTitle: campaign.title,
    qualificationMode: campaign.qualificationMode,
    entitlements,
  };
}

// =============================================================================
// Trigger Evaluation
// =============================================================================

function evaluateContributionTrigger(
  triggerConfig: { mode: string; min?: number; max?: number; exact?: number },
  contributionAmount: number
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

// =============================================================================
// Availability Check
// =============================================================================

function checkAvailability(reward: {
  quantityType: string;
  quantityLimit: number | null;
  quantityClaimed: number;
  availableFrom: Date | null;
  availableUntil: Date | null;
}): { available: boolean; reason?: string } {
  // Quantity
  if (reward.quantityType === "limited" && reward.quantityLimit !== null) {
    if (reward.quantityClaimed >= reward.quantityLimit) {
      return { available: false, reason: "Sold out" };
    }
  }

  // Date range
  const now = new Date();
  if (reward.availableFrom && now < reward.availableFrom) {
    return { available: false, reason: "Not yet available" };
  }
  if (reward.availableUntil && now > reward.availableUntil) {
    return { available: false, reason: "No longer available" };
  }

  return { available: true };
}

// =============================================================================
// Bulk Evaluation (for admin reprocessing)
// =============================================================================

/**
 * Evaluate and grant rewards for a specific campaign for all eligible users.
 * Useful for admin reprocessing or retroactive grant.
 */
export async function batchEvaluateCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { hasRewards: true },
  });

  if (!campaign?.hasRewards) return { processed: 0, granted: 0 };

  // Get all completed pledges for this campaign
  const pledges = await prisma.pledge.findMany({
    where: { campaignId, status: "completed" },
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;
  let granted = 0;

  for (const pledge of pledges) {
    if (!pledge.userId) continue;
    processed++;

    const result = await evaluateRewardTriggers(
      pledge.userId,
      campaignId,
      pledge.amount,
      pledge.id
    );

    granted += result.entitlements.length;
  }

  return { processed, granted };
}
