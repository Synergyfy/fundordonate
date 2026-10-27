import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { AdminLeaderboardQueryDto } from "../dto/admin-leaderboard-query.dto";

interface BusinessLeaderboardRow {
  business_id: string;
  name: string;
  city: string | null;
  local_area: string | null;
  membership_tier: string | null;
  total_contributed: bigint;
  campaign_count: bigint;
  backer_count: bigint;
  rank: bigint;
  total_count: bigint;
  owner_id: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_username: string | null;
}

@Injectable()
export class AdminLeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Platform-wide business ranking. Unlike the business-dashboard leaderboard
   * this is not scoped to the caller's own business, so it is safe for admins.
   */
  async getBusinessLeaderboard(query: AdminLeaderboardQueryDto) {
    const { limit, skip, scope = "national", location } = query;

    const conditions = [Prisma.sql`b.status = 'ACTIVE'`];

    if (scope !== "national") {
      if (!location?.trim()) {
        throw new BadRequestException(
          "A location is required for city, local area, or high street leaderboards",
        );
      }

      if (scope === "city") {
        conditions.push(Prisma.sql`LOWER(b.city) = LOWER(${location.trim()})`);
      } else if (scope === "local_area") {
        conditions.push(
          Prisma.sql`LOWER(b."localArea") = LOWER(${location.trim()})`,
        );
      } else {
        conditions.push(
          Prisma.sql`LOWER(b."highStreet") = LOWER(${location.trim()})`,
        );
      }
    }

    const whereSql = Prisma.join(conditions, " AND ");

    const rows = await this.prisma.$queryRaw<BusinessLeaderboardRow[]>`
      SELECT
        b.id AS business_id,
        b.name,
        b.city,
        b."localArea" AS local_area,
        b."membershipTier" AS membership_tier,
        COALESCE(SUM(c.amount), 0) AS total_contributed,
        COUNT(DISTINCT c."campaignId") AS campaign_count,
        COUNT(DISTINCT c."backerId") AS backer_count,
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC) AS rank,
        COUNT(*) OVER() AS total_count,
        u.id AS owner_id,
        u."firstName" AS owner_first_name,
        u."lastName" AS owner_last_name,
        u.username AS owner_username
      FROM businesses b
      LEFT JOIN contributions c
        ON c."businessId" = b.id AND c.status = 'COMPLETED'
      LEFT JOIN users u ON u.id = b."ownerId"
      WHERE ${whereSql}
      GROUP BY b.id, u.id, u."firstName", u."lastName", u.username
      ORDER BY rank ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    return {
      entries: rows.map((row) => ({
        rank: Number(row.rank),
        businessId: row.business_id,
        name: row.name,
        location:
          [row.local_area, row.city].filter(Boolean).join(", ") || "UK Hub",
        membershipTier: row.membership_tier ?? "BRONZE",
        totalContributed: Number(row.total_contributed),
        campaignCount: Number(row.campaign_count),
        backerCount: Number(row.backer_count),
        change: 0,
        isCurrentBusiness: false,
        user: row.owner_id
          ? {
              id: row.owner_id,
              firstName: row.owner_first_name,
              lastName: row.owner_last_name,
              username: row.owner_username,
            }
          : undefined,
      })),
      total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    };
  }
}
