// =============================================================================
// Backend Stub — Backer Service
// Placeholder for backend developer to implement.
// Handles backer status grants, funnel codes, leaderboard, and visibility.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Grant Backer Status to a user based on their contribution history.
 *
 * Steps:
 * 1. Count unique locations the user has backed campaigns in
 * 2. Calculate total amount contributed
 * 3. Determine tier: BACKER (<3 cities), CITY (3+ cities in one), NATIONAL (5+ cities)
 * 4. Check if user already has this tier (only upgrade, never downgrade)
 * 5. Create or update BackerStatusRecord
 * 6. Create UserBadge record
 * 7. If tier >= CITY, trigger funnel code issuance
 *
 * @param userId - The user to grant status to
 * @param sourceCampaignId - The campaign that triggered this check
 * @returns The updated BackerStatus record
 */
export async function grantBackerStatus(userId: string, sourceCampaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: sourceCampaignId },
  });

  // Count unique locations backed
  const locationStats = await prisma.donation.groupBy({
    by: ["locationId"],
    where: { userId, campaignId: { not: sourceCampaignId } },
    _count: { id: true },
  });

  // Also count pledges
  const pledgeLocations = await prisma.pledge.groupBy({
    by: ["locationId"],
    where: { userId },
    _count: { id: true },
  });

  // Merge unique locations
  const allLocationIds = new Set([
    ...locationStats.map((l) => l.locationId).filter(Boolean),
    ...pledgeLocations.map((l) => l.locationId).filter(Boolean),
    campaign.locationId,
  ].filter(Boolean) as string[]);

  const uniqueLocationCount = allLocationIds.size;

  // Determine tier
  let tier: string;
  if (uniqueLocationCount >= 5) {
    tier = "NATIONAL";
  } else if (uniqueLocationCount >= 3) {
    tier = "CITY";
  } else {
    tier = "BACKER";
  }

  // Check existing status - only upgrade
  const existing = await prisma.backerStatusRecord.findFirst({
    where: { userId },
    orderBy: { grantedAt: "desc" },
  });

  const tierOrder = { BACKER: 0, CITY: 1, NATIONAL: 2 };
  const currentTierOrder = existing ? (tierOrder as any)[existing.statusType] : -1;
  const newTierOrder = (tierOrder as any)[tier];

  if (newTierOrder <= currentTierOrder) {
    return existing; // Already at this tier or higher
  }

  // Create new backer status
  const status = await prisma.backerStatusRecord.create({
    data: {
      userId,
      statusType: tier,
      sourceCampaignId,
      locationId: campaign.locationId,
      cityCount: uniqueLocationCount,
      grantedAt: new Date(),
      visibility: "PUBLIC",
    },
  });

  // Create badge
  // TODO: Create UserBadge record

  // If CITY tier or higher, issue funnel code
  if (tier !== "BACKER") {
    // TODO: Issue funnel code via email or in-app notification
  }

  return status;
}

/**
 * Get backer leaderboard for a location.
 */
export async function getLeaderboard(locationId?: string, limit: number = 20) {
  const where = locationId ? { locationId } : {};

  const backerStats = await prisma.backerStatusRecord.groupBy({
    by: ["userId"],
    where,
    _max: { statusType: true },
    _count: { id: true },
  });

  // Get user details and total contributed
  const leaderboard = await Promise.all(
    backerStats.map(async (b) => {
      const user = await prisma.user.findUnique({
        where: { id: b.userId },
        select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
      });

      const totalContributed = await prisma.donation.aggregate({
        where: { userId: b.userId },
        _sum: { amount: true },
      });

      return {
        userId: b.userId,
        user,
        backerTier: b._max.statusType,
        totalContributed: totalContributed._sum.amount || 0,
        campaignCount: b._count.id,
      };
    })
  );

  return leaderboard
    .sort((a, b) => b.totalContributed - a.totalContributed)
    .slice(0, limit);
}

/**
 * Issue a funnel code for a user.
 */
export async function issueFunnelCode(userId: string) {
  const code = `FUNNEL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return prisma.funnelCode.create({
    data: {
      userId,
      code,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      redeemed: false,
    },
  });
}

/**
 * Redeem a funnel code.
 */
export async function redeemFunnelCode(code: string, userId: string) {
  const funnelCode = await prisma.funnelCode.findUnique({
    where: { code },
  });

  if (!funnelCode || funnelCode.redeemed) {
    throw new Error("Invalid or already redeemed funnel code");
  }

  if (funnelCode.expiresAt && funnelCode.expiresAt < new Date()) {
    throw new Error("Funnel code has expired");
  }

  await prisma.funnelCode.update({
    where: { id: funnelCode.id },
    data: { redeemed: true, redeemedAt: new Date(), redeemedBy: userId },
  });

  return { success: true, backerStatus: await grantBackerStatus(userId, funnelCode.campaignId || "") };
}

/**
 * Get backer stats for a location.
 */
export async function getLocationStats(locationId: string) {
  const totalBackers = await prisma.backerStatusRecord.count({
    where: { locationId },
  });

  const tierBreakdown = await prisma.backerStatusRecord.groupBy({
    by: ["statusType"],
    where: { locationId },
    _count: { id: true },
  });

  const topContributors = await getLeaderboard(locationId, 10);

  return {
    totalBackers,
    backerTierBreakdown: {
      BACKER: tierBreakdown.find((t) => t.statusType === "BACKER")?._count.id || 0,
      CITY: tierBreakdown.find((t) => t.statusType === "CITY")?._count.id || 0,
      NATIONAL: tierBreakdown.find((t) => t.statusType === "NATIONAL")?._count.id || 0,
    },
    topContributors,
  };
}
