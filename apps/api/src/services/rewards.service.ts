// =============================================================================
// Backend Stub — Rewards Service
// Placeholder for backend developer to implement.
// Manages city-specific and borough-specific rewards.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get all city rewards for a location.
 */
export async function getCityRewards(cityLocationId: string) {
  return prisma.cityReward.findMany({
    where: { cityLocationId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get all borough rewards for a location.
 */
export async function getBoroughRewards(boroughLocationId: string) {
  return prisma.boroughReward.findMany({
    where: { boroughLocationId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create a city reward.
 */
export async function createCityReward(data: {
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
}) {
  return prisma.cityReward.create({
    data: {
      ...data,
      isActive: true,
      grantedCount: 0,
    },
  });
}

/**
 * Create a borough reward.
 */
export async function createBoroughReward(data: {
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
}) {
  return prisma.boroughReward.create({
    data: {
      ...data,
      isActive: true,
      grantedCount: 0,
    },
  });
}

/**
 * Check and grant rewards for a user based on their contribution history.
 */
export async function checkAndGrantRewards(userId: string, locationId: string) {
  // Get user's contribution stats
  const donations = await prisma.donation.aggregate({
    where: { userId, locationId },
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalContributed = donations._sum.amount || 0;
  const campaignCount = donations._count.id;

  // Check city rewards
  const cityRewards = await prisma.cityReward.findMany({
    where: { cityLocationId: locationId, isActive: true },
  });

  const grantedRewards = [];

  for (const reward of cityRewards) {
    // Check if user already has this reward
    const existing = await prisma.rewardGrant.findFirst({
      where: { userId, rewardId: reward.id },
    });
    if (existing) continue;

    // Check qualification
    const qualifies =
      (reward.minContributionPence && totalContributed >= reward.minContributionPence) ||
      (reward.minCampaignCount && campaignCount >= reward.minCampaignCount);

    if (qualifies) {
      const grant = await prisma.rewardGrant.create({
        data: {
          userId,
          rewardId: reward.id,
          rewardType: reward.type,
          locationId,
          locationName: reward.cityName,
          grantedAt: new Date(),
          claimed: false,
        },
      });

      // Update granted count
      await prisma.cityReward.update({
        where: { id: reward.id },
        data: { grantedCount: { increment: 1 } },
      });

      grantedRewards.push(grant);
    }
  }

  // Also check borough rewards for boroughs within this city
  const boroughs = await prisma.hubLocation.findMany({
    where: { parentId: locationId },
    select: { id: true, name: true },
  });

  for (const borough of boroughs) {
    const boroughRewards = await prisma.boroughReward.findMany({
      where: { boroughLocationId: borough.id, isActive: true },
    });

    for (const reward of boroughRewards) {
      const existing = await prisma.rewardGrant.findFirst({
        where: { userId, rewardId: reward.id },
      });
      if (existing) continue;

      const boroughDonations = await prisma.donation.aggregate({
        where: { userId, locationId: borough.id },
        _sum: { amount: true },
        _count: { id: true },
      });

      const qualifies =
        (reward.minContributionPence && (boroughDonations._sum.amount || 0) >= reward.minContributionPence) ||
        (reward.minCampaignCount && (boroughDonations._count.id || 0) >= reward.minCampaignCount);

      if (qualifies) {
        const grant = await prisma.rewardGrant.create({
          data: {
            userId,
            rewardId: reward.id,
            rewardType: reward.type,
            locationId: borough.id,
            locationName: borough.name,
            grantedAt: new Date(),
            claimed: false,
          },
        });

        await prisma.boroughReward.update({
          where: { id: reward.id },
          data: { grantedCount: { increment: 1 } },
        });

        grantedRewards.push(grant);
      }
    }
  }

  return grantedRewards;
}

/**
 * Get user's granted rewards.
 */
export async function getUserRewards(userId: string) {
  return prisma.rewardGrant.findMany({
    where: { userId },
    include: { cityReward: true, boroughReward: true },
    orderBy: { grantedAt: "desc" },
  });
}

/**
 * Admin: Get all rewards across all locations.
 */
export async function getAllRewards() {
  const cityRewards = await prisma.cityReward.findMany({
    orderBy: { createdAt: "desc" },
  });

  const boroughRewards = await prisma.boroughReward.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { cityRewards, boroughRewards };
}
