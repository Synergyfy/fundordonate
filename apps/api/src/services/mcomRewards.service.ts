// =============================================================================
// Backend Stub — MCOM Rewards Adapter
// Placeholder for backend developer to implement.
// Handles reward progression → FundOrDonate campaign trigger.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * MCOM Rewards configuration.
 * Maps reward triggers to points and campaign triggers.
 */
const MCOM_REWARD_CONFIG = {
  first_donation: { points: 100, category: "engagement" },
  milestone_reached: { points: 250, category: "milestone" },
  campaign_completed: { points: 150, category: "engagement" },
  qualified_on_leaderboard: { points: 500, category: "achievement" },
  founding_member: { points: 1000, category: "membership" },
  in_store_donation: { points: 75, category: "engagement" },
  community_backer: { points: 200, category: "recognition" },
};

/**
 * Award MCOM reward points to a user.
 *
 * @param userId - The user to reward
 * @param trigger - What triggered this reward
 * @param campaignId - Optional campaign that triggered it
 * @param locationId - Optional location that triggered it
 * @returns The created MCOM reward
 */
export async function awardMcomReward(
  userId: string,
  trigger: string,
  campaignId?: string,
  locationId?: string
) {
  const config = MCOM_REWARD_CONFIG[trigger as keyof typeof MCOM_REWARD_CONFIG];
  if (!config) {
    throw new Error(`Unknown trigger: ${trigger}`);
  }

  // Check if user already has this reward for this campaign
  if (campaignId) {
    const existing = await prisma.mcomReward.findFirst({
      where: { userId, trigger, campaignId },
    });
    if (existing) {
      return existing; // Already awarded
    }
  }

  // Create MCOM reward
  const reward = await prisma.mcomReward.create({
    data: {
      userId,
      trigger,
      pointsAwarded: config.points,
      campaignId,
      locationId,
      redeemed: false,
      details: {
        title: getRewardTitle(trigger),
        description: getRewardDescription(trigger),
        category: config.category,
      },
      awardedAt: new Date(),
    },
  });

  // Update user's total MCOM points
  await prisma.user.update({
    where: { id: userId },
    data: {
      mcomPoints: { increment: config.points },
    },
  });

  // Check if this triggers a campaign action
  await checkMcomCampaignTriggers(userId, trigger);

  return reward;
}

/**
 * Check if MCOM rewards trigger any campaign actions.
 */
async function checkMcomCampaignTriggers(userId: string, trigger: string) {
  // Example: If user earns enough points, trigger a campaign unlock
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // Check if user has earned founding member points
  if (trigger === "founding_member" || trigger === "qualified_on_leaderboard") {
    // Check if user qualifies for special campaign access
    const totalPoints = user.mcomPoints || 0;
    if (totalPoints >= 2000) {
      // User qualifies for exclusive campaign access
      // TODO: Unlock exclusive campaigns
    }
  }
}

/**
 * Redeem MCOM reward points.
 */
export async function redeemMcomReward(
  userId: string,
  rewardId: string
) {
  const reward = await prisma.mcomReward.findUnique({
    where: { id: rewardId },
  });

  if (!reward || reward.userId !== userId) {
    throw new Error("Reward not found");
  }

  if (reward.redeemed) {
    throw new Error("Reward already redeemed");
  }

  // Mark as redeemed
  await prisma.mcomReward.update({
    where: { id: rewardId },
    data: {
      redeemed: true,
      redeemedAt: new Date(),
    },
  });

  // Deduct points from user
  await prisma.user.update({
    where: { id: userId },
    data: {
      mcomPoints: { decrement: reward.pointsAwarded },
    },
  });

  return { success: true, pointsRedeemed: reward.pointsAwarded };
}

/**
 * Get user's MCOM reward history.
 */
export async function getMcomRewards(userId: string) {
  return prisma.mcomReward.findMany({
    where: { userId },
    orderBy: { awardedAt: "desc" },
  });
}

/**
 * Get user's total MCOM points balance.
 */
export async function getMcomPointsBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mcomPoints: true },
  });
  return user?.mcomPoints || 0;
}

/**
 * Get MCOM reward leaderboard.
 */
export async function getMcomLeaderboard(top: number = 100) {
  const users = await prisma.user.findMany({
    where: { mcomPoints: { gt: 0 } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      username: true,
      mcomPoints: true,
    },
    orderBy: { mcomPoints: "desc" },
    take: top,
  });

  return users.map((user, index) => ({
    rank: index + 1,
    ...user,
  }));
}

// =============================================================================
// Helper Functions
// =============================================================================

function getRewardTitle(trigger: string): string {
  const titles: Record<string, string> = {
    first_donation: "First Donation",
    milestone_reached: "Milestone Reached",
    campaign_completed: "Campaign Champion",
    qualified_on_leaderboard: "Leaderboard Qualifier",
    founding_member: "Founding Member",
    in_store_donation: "In-Store Supporter",
    community_backer: "Community Backer",
  };
  return titles[trigger] || "Reward";
}

function getRewardDescription(trigger: string): string {
  const descriptions: Record<string, string> = {
    first_donation: "Thank you for your first donation!",
    milestone_reached: "You've reached a contribution milestone!",
    campaign_completed: "You helped complete a campaign!",
    qualified_on_leaderboard: "You qualified on the leaderboard!",
    founding_member: "Welcome to the founding programme!",
    in_store_donation: "Thank you for donating in-store!",
    community_backer: "You're a recognized Community Backer!",
  };
  return descriptions[trigger] || "Reward earned!";
}
