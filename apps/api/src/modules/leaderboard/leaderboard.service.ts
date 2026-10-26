import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ContributionStatus, Prisma } from "@prisma/client";

export interface LeaderboardEntryView {
  id: string;
  userId: string;
  name: string;
  rank: number;
  totalContributed: number;
  campaignCount: number;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    username?: string | null;
  };
}

export interface LeaderboardView {
  id: string;
  scope: string;
  scopeId?: string;
  scopeName?: string;
  totalEntries: number;
  lastUpdated: string;
  entries: LeaderboardEntryView[];
}

/**
 * Contributor leaderboards, aggregated live from completed contributions.
 * Backs both the public/consumer leaderboards and the admin overview.
 */
@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(
    level: string,
    scopeId: string | undefined,
    top: number,
    sortBy: "totalContributed" | "campaignCount" = "totalContributed",
  ): Promise<LeaderboardView> {
    const take = Number.isFinite(top) && top > 0 ? Math.min(top, 500) : 100;

    const where: Prisma.ContributionWhereInput = {
      status: ContributionStatus.COMPLETED,
      backerId: { not: null },
    };

    let scopeName: string | undefined;
    if (scopeId && level === "campaign") {
      // Campaign leaderboards are scoped by campaign id, not by hub location.
      const campaign = await this.prisma.businessCampaign.findUnique({
        where: { id: scopeId },
        select: { title: true },
      });
      scopeName = campaign?.title;
      where.campaignId = scopeId;
    } else if (scopeId && level !== "national") {
      const location = await this.prisma.hubLocation.findUnique({
        where: { id: scopeId },
        include: { children: { include: { children: true } } },
      });
      const locationIds = location
        ? [location.id, ...location.children.flatMap((c) => [c.id, ...c.children.map((g) => g.id)])]
        : [scopeId];
      scopeName = location?.name;
      where.campaign = {
        OR: [
          { locations: { some: { locationId: { in: locationIds } } } },
          {
            locations: { none: {} },
            business: { locationId: { in: locationIds } },
          },
        ],
      };
    } else if (scopeId) {
      const location = await this.prisma.hubLocation.findUnique({ where: { id: scopeId } });
      scopeName = location?.name;
    }

    const grouped = await this.prisma.contribution.groupBy({
      by: ["backerId"],
      where,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy:
        sortBy === "campaignCount"
          ? { _count: { backerId: "desc" } }
          : { _sum: { amount: "desc" } },
      take,
    });

    const backerIds = grouped
      .map((g) => g.backerId)
      .filter((id): id is string => !!id);

    const users = backerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: backerIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
          },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    // `grouped._count` counts contributions, not campaigns. Count distinct
    // campaigns per backer so the "campaigns backed" figure is accurate.
    const campaignRows = backerIds.length
      ? await this.prisma.contribution.groupBy({
          by: ["backerId", "campaignId"],
          where: { ...where, backerId: { in: backerIds } },
        })
      : [];
    const campaignCountMap = new Map<string, number>();
    for (const row of campaignRows) {
      if (!row.backerId) continue;
      campaignCountMap.set(row.backerId, (campaignCountMap.get(row.backerId) ?? 0) + 1);
    }

    const entries: LeaderboardEntryView[] = grouped.map((g, index) => {
      const userId = g.backerId!;
      const user = userMap.get(userId);
      const name =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
        user?.username ||
        "Supporter";
      return {
        id: userId,
        userId,
        name,
        rank: index + 1,
        totalContributed: g._sum.amount ?? 0,
        campaignCount: campaignCountMap.get(userId) ?? 0,
        ...(user
          ? {
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                username: user.username,
              },
            }
          : {}),
      };
    });

    return {
      id: `leaderboard-${level}-${scopeId ?? "all"}`,
      scope: level,
      scopeId,
      scopeName,
      totalEntries: entries.length,
      lastUpdated: new Date().toISOString(),
      entries,
    };
  }

  async getOverview(): Promise<{
    national: LeaderboardView;
    cityLeaderboards: { cityId: string; cityName: string; entries: LeaderboardEntryView[] }[];
    lastUpdated: string;
  }> {
    const national = await this.getLeaderboard("national", undefined, 50);
    const cities = await this.prisma.hubLocation.findMany({
      where: { type: "CITY" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    const cityLeaderboards = await Promise.all(
      cities.map(async (city) => {
        const board = await this.getLeaderboard("city", city.id, 10);
        return { cityId: city.id, cityName: city.name, entries: board.entries };
      }),
    );

    return {
      national,
      cityLeaderboards: cityLeaderboards.filter((c) => c.entries.length > 0),
      lastUpdated: new Date().toISOString(),
    };
  }
}
