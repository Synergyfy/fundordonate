// =============================================================================
// Backend Stub — Leaderboard Service
// Placeholder for backend developer to implement.
// Ranks contributors by total contribution amount across any scope.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get leaderboard entries for a given scope.
 *
 * @param scope - campaign | city | borough | high_street | national
 * @param scopeId - The ID of the campaign/location
 * @param top - Number of top entries to return
 * @param sortBy - Sorting criterion
 * @returns Ranked leaderboard entries
 */
export async function getLeaderboard(
  scope: string,
  scopeId?: string,
  top: number = 100,
  sortBy: string = "totalContributed"
) {
  // Build the where clause based on scope
  const donationWhere: Record<string, unknown> = {};
  const pledgeWhere: Record<string, unknown> = {};

  if (scope === "campaign" && scopeId) {
    donationWhere.campaignId = scopeId;
    pledgeWhere.campaignId = scopeId;
  } else if (scope === "city" && scopeId) {
    donationWhere.locationId = scopeId;
    pledgeWhere.locationId = scopeId;
    // Also include borough-level donations in city leaderboard
    const boroughs = await prisma.hubLocation.findMany({
      where: { parentId: scopeId },
      select: { id: true },
    });
    const boroughIds = boroughs.map((b) => b.id);
    if (boroughIds.length > 0) {
      donationWhere.locationId = { in: [scopeId, ...boroughIds] };
      pledgeWhere.locationId = { in: [scopeId, ...boroughIds] };
    }
  } else if (scope === "borough" && scopeId) {
    donationWhere.locationId = scopeId;
    pledgeWhere.locationId = scopeId;
  } else if (scope === "high_street" && scopeId) {
    donationWhere.locationId = scopeId;
    pledgeWhere.locationId = scopeId;
  }
  // National: no location filter

  // Aggregate donations per user
  const donationAggregates = await prisma.donation.groupBy({
    by: ["userId"],
    where: donationWhere,
    _sum: { amount: true },
    _count: { id: true },
  });

  // Aggregate pledges per user
  const pledgeAggregates = await prisma.pledge.groupBy({
    by: ["userId"],
    where: pledgeWhere,
    _sum: { amount: true },
    _count: { id: true },
  });

  // Merge aggregates
  const userMap = new Map<string, { totalContributed: number; campaignCount: number }>();

  for (const d of donationAggregates) {
    const existing = userMap.get(d.userId) || { totalContributed: 0, campaignCount: 0 };
    existing.totalContributed += d._sum.amount || 0;
    existing.campaignCount += d._count.id;
    userMap.set(d.userId, existing);
  }

  for (const p of pledgeAggregates) {
    const existing = userMap.get(p.userId) || { totalContributed: 0, campaignCount: 0 };
    existing.totalContributed += p._sum.amount || 0;
    existing.campaignCount += p._count.id;
    userMap.set(p.userId, existing);
  }

  // Sort and rank
  const sorted = Array.from(userMap.entries()).sort((a, b) => {
    if (sortBy === "campaignCount") {
      return b[1].campaignCount - a[1].campaignCount;
    }
    return b[1].totalContributed - a[1].totalContributed;
  });

  const topEntries = sorted.slice(0, top);

  // Fetch user details
  const entries = await Promise.all(
    topEntries.map(async ([userId, stats], index) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          username: true,
        },
      });

      // Get backer tier
      const backerStatus = await prisma.backerStatusRecord.findFirst({
        where: { userId },
        orderBy: { grantedAt: "desc" },
      });

      return {
        id: `leaderboard-${scope}-${scopeId || "all"}-${userId}`,
        userId,
        rank: index + 1,
        totalContributed: stats.totalContributed,
        campaignCount: stats.campaignCount,
        scopeId,
        user,
        backerTier: backerStatus?.statusType || null,
        isOriginalFoundingMember: false, // TODO: Check founding membership
      };
    })
  );

  return {
    id: `leaderboard-${scope}-${scopeId || "all"}`,
    scope,
    scopeId,
    totalEntries: sorted.length,
    lastUpdated: new Date(),
    entries,
  };
}

/**
 * Get urgency-based leaderboard (first N people qualify).
 */
export async function getUrgencyLeaderboard(
  scope: string,
  scopeId: string,
  qualificationLimit: number,
  qualificationWindowHours: number = 72
) {
  const leaderboard = await getLeaderboard(scope, scopeId, qualificationLimit);

  // Apply qualification window
  const windowStart = new Date(Date.now() - qualificationWindowHours * 60 * 60 * 1000);

  const qualified = leaderboard.entries
    .filter((e) => {
      // Qualification is based on rank order
      return e.rank <= qualificationLimit;
    })
    .map((e) => ({
      ...e,
      qualificationStatus: e.rank <= qualificationLimit ? "qualified" : "pending",
      qualifiedAt: e.rank <= qualificationLimit ? leaderboard.lastUpdated : undefined,
      qualificationExpiresAt: new Date(Date.now() + qualificationWindowHours * 60 * 60 * 1000),
    }));

  return {
    ...leaderboard,
    qualificationLimit,
    qualificationWindowHours,
    entries: qualified,
  };
}

/**
 * Check if a user qualifies for an urgency-based leaderboard reward.
 */
export async function checkQualification(
  userId: string,
  scope: string,
  scopeId: string,
  qualificationLimit: number
): Promise<{ qualifies: boolean; rank: number | null; qualificationExpiresAt: Date | null }> {
  const leaderboard = await getLeaderboard(scope, scopeId, qualificationLimit + 10);

  const entry = leaderboard.entries.find((e) => e.userId === userId);
  if (!entry) {
    return { qualifies: false, rank: null, qualificationExpiresAt: null };
  }

  const qualifies = entry.rank <= qualificationLimit;

  return {
    qualifies,
    rank: entry.rank,
    qualificationExpiresAt: qualifies ? new Date(Date.now() + 72 * 60 * 60 * 1000) : null,
  };
}

/**
 * Admin: Get all leaderboards overview.
 */
export async function getLeaderboardsOverview() {
  // Get top contributors across all scopes
  const national = await getLeaderboard("national", undefined, 10);

  // Get top cities by total contribution
  const cities = await prisma.hubLocation.findMany({
    where: { type: "CITY" },
    select: { id: true, name: true },
    take: 10,
  });

  const cityLeaderboards = await Promise.all(
    cities.map(async (city) => ({
      cityId: city.id,
      cityName: city.name,
      ...(await getLeaderboard("city", city.id, 5)),
    }))
  );

  return {
    national,
    cityLeaderboards,
    lastUpdated: new Date(),
  };
}
