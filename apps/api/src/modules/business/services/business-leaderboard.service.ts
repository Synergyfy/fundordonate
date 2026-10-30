import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { LeaderboardQueryDto, LeaderboardScope } from "../dto/leaderboard-query.dto";
import { CapabilityService } from "@/modules/plans/services/capability.service";
import { FEATURES } from "@/modules/plans/plan.constants";

export interface LeaderboardRankResult {
  rank: number;
  totalContributed: number;
  totalBusinesses: number;
}

export interface LeaderboardEntryDto {
  rank: number;
  businessId: string;
  name: string;
  location: string;
  membershipTier: string;
  totalContributed: number;
  change: number;
  isCurrentBusiness: boolean;
}

@Injectable()
export class BusinessLeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capabilities: CapabilityService,
  ) {}

  /**
   * Calculates the specific rank and total contribution for a given business in its city.
   */
  async getBusinessRank(businessId: string): Promise<LeaderboardRankResult> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { city: true },
    });

    if (!business) {
      return { rank: 1, totalContributed: 0, totalBusinesses: 1 };
    }

    const city = business.city;

    // Aggregate rank and contributions directly in PostgreSQL
    const result: Array<{
      total_contributed: bigint;
      rank: bigint;
      total_businesses: bigint;
    }> = await this.prisma.$queryRaw`
      WITH ranked AS (
        SELECT 
          b.id AS business_id,
          COALESCE(SUM(c.amount), 0) AS total_contributed,
          DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC) AS rank,
          COUNT(*) OVER() AS total_businesses
        FROM businesses b
        LEFT JOIN contributions c ON c."businessId" = b.id AND c.status = 'COMPLETED'
        WHERE b.status = 'ACTIVE' AND b.city = ${city}
        GROUP BY b.id
      )
      SELECT total_contributed, rank, total_businesses
      FROM ranked
      WHERE business_id = ${businessId}
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return { rank: 1, totalContributed: 0, totalBusinesses: 1 };
    }

    return {
      rank: Number(result[0].rank),
      totalContributed: Number(result[0].total_contributed),
      totalBusinesses: Number(result[0].total_businesses),
    };
  }

  /**
   * Retrieves paginated leaderboard entries for a given geographic scope.
   */
  async getLeaderboard(
    currentBusinessId: string,
    query: LeaderboardQueryDto,
  ): Promise<{
    currentRank: LeaderboardRankResult;
    entries: LeaderboardEntryDto[];
    total: number;
  }> {
    const scope = query.scope ?? LeaderboardScope.CITY;
    const locationFilter = query.location?.trim();

    const business = await this.prisma.business.findUnique({
      where: { id: currentBusinessId },
      select: { ownerId: true },
    });
    if (business) {
      const feature =
        scope === LeaderboardScope.NATIONAL
          ? FEATURES.LEADERBOARD_NATIONAL
          : scope === LeaderboardScope.CITY
            ? FEATURES.LEADERBOARD_CITY
            : FEATURES.LEADERBOARD_LOCAL;
      await this.capabilities.assertFeature(business.ownerId, feature);
    }

    const conditions = [Prisma.sql`b.status = 'ACTIVE'`];
    if (locationFilter) {
      if (scope === LeaderboardScope.CITY) {
        conditions.push(Prisma.sql`LOWER(b.city) = LOWER(${locationFilter})`);
      } else if (scope === LeaderboardScope.LOCAL_AREA) {
        conditions.push(Prisma.sql`LOWER(b."localArea") = LOWER(${locationFilter})`);
      } else if (scope === LeaderboardScope.HIGH_STREET) {
        conditions.push(Prisma.sql`LOWER(b."highStreet") = LOWER(${locationFilter})`);
      }
    }
    const whereSql = Prisma.join(conditions, " AND ");

    const rawRows: Array<{
      business_id: string;
      name: string;
      city: string;
      local_area: string;
      membership_tier: string;
      total_contributed: bigint;
      rank: bigint;
      total_count: bigint;
    }> = await this.prisma.$queryRaw`
      SELECT 
        b.id AS business_id,
        b.name,
        b.city,
        b."localArea" AS local_area,
        b."membershipTier" AS membership_tier,
        COALESCE(SUM(c.amount), 0) AS total_contributed,
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC) AS rank,
        COUNT(*) OVER() AS total_count
      FROM businesses b
      LEFT JOIN contributions c ON c."businessId" = b.id AND c.status = 'COMPLETED'
      WHERE ${whereSql}
      GROUP BY b.id
      ORDER BY rank ASC
      LIMIT ${query.limit} OFFSET ${query.skip}
    `;

    const currentRank = await this.getBusinessRank(currentBusinessId);

    const entries: LeaderboardEntryDto[] = rawRows.map((row) => ({
      rank: Number(row.rank),
      businessId: row.business_id,
      name: row.name,
      location: `${row.local_area}, ${row.city}`,
      membershipTier: row.membership_tier,
      totalContributed: Number(row.total_contributed),
      change: 0, // In production, delta compared with previous seasonal snapshot
      isCurrentBusiness: row.business_id === currentBusinessId,
    }));

    const total = rawRows.length > 0 ? Number(rawRows[0].total_count) : 0;

    return {
      currentRank,
      entries,
      total,
    };
  }
}
