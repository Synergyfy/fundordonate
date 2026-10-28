import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BusinessCampaignStatus,
  ContributionStatus,
  ContributionType,
} from "@prisma/client";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import Redis from "ioredis";
import { RevenueChartPeriod } from "../dto/dashboard-query.dto";

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Invalidates cached admin dashboard summary and revenue chart data.
   */
  async invalidateDashboardCache(): Promise<void> {
    try {
      const keys = [
        "admin:stats:summary",
        "admin:stats:summary:v2",
        "admin:stats:revenue:daily",
        "admin:stats:revenue:weekly",
        "admin:stats:revenue:monthly",
        "admin:stats:revenue:yearly",
      ];
      await this.redis.del(...keys);
    } catch (err: any) {
      this.logger.warn(`Failed to invalidate dashboard cache: ${err.message}`);
    }
  }

  /**
   * Aggregates platform KPIs in a single batch without N+1 queries.
   * Cached in Redis for 60 seconds to ensure high performance.
   */
  async getDashboardStats() {
    // v2 adds the legacy overview fields (totalRaised, totalCampaigns, …)
    // alongside the canonical platform metrics, so stale v1 cache entries are
    // never served with the wrong shape.
    const cacheKey = "admin:stats:summary:v2";
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    const [
      revenueAgg,
      activeCampaignsCount,
      totalCampaignsCount,
      totalBusinessesCount,
      totalConsumersCount,
      distinctBackers,
      totalUsersCount,
      donationAgg,
      pledgeAgg,
    ] = await Promise.all([
      // Total platform revenue & average donation
      this.prisma.contribution.aggregate({
        where: { status: ContributionStatus.COMPLETED },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: { id: true },
      }),

      // Active (live) campaigns
      this.prisma.businessCampaign.count({
        where: { status: BusinessCampaignStatus.ACTIVE },
      }),

      // All campaigns regardless of status
      this.prisma.businessCampaign.count(),

      // Verified active businesses
      this.prisma.business.count(),

      // Consumers
      this.prisma.user.count({
        where: { userType: "consumer" },
      }),

      // Unique backers
      this.prisma.contribution.groupBy({
        by: ["backerId"],
        where: {
          status: ContributionStatus.COMPLETED,
          backerId: { not: null },
        },
      }),

      // Total registered users
      this.prisma.user.count(),

      // Donations: completed, non-self-funding contributions. Legacy rows have
      // no chargePurpose, so type is the reliable discriminator; pledges are
      // subtracted below because they share the same contribution types.
      this.prisma.contribution.aggregate({
        where: {
          status: ContributionStatus.COMPLETED,
          type: {
            in: [
              ContributionType.ONLINE,
              ContributionType.IN_STORE,
              ContributionType.FUNDING_SPLIT,
            ],
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Pledges: completed contributions explicitly tagged as pledges.
      this.prisma.contribution.aggregate({
        where: {
          status: ContributionStatus.COMPLETED,
          metadata: { path: ["chargePurpose"], equals: "PLEDGE" },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalRevenue = revenueAgg._sum.amount ?? 0;
    const totalTransactions = revenueAgg._count.id ?? 0;
    const averageDonation = Math.round(revenueAgg._avg.amount ?? 0);
    const totalBackers = distinctBackers.length;
    const conversionRate = totalUsersCount > 0 ? Number(((totalBackers / totalUsersCount) * 100).toFixed(1)) : 0;

    const totalPledges = pledgeAgg._count.id ?? 0;
    const totalPledgesAmount = pledgeAgg._sum.amount ?? 0;
    // Pledges share the same contribution types as donations, so remove them
    // from the donation aggregate rather than relying on a JSON path filter
    // (legacy rows have no `chargePurpose` and must still count as donations).
    const totalDonations = Math.max(0, (donationAgg._count.id ?? 0) - totalPledges);
    const totalDonationsAmount = Math.max(
      0,
      (donationAgg._sum.amount ?? 0) - totalPledgesAmount,
    );

    const stats = {
      // Legacy overview fields still consumed by the admin dashboard, funding
      // and report screens. Kept additive so all consumers share one payload.
      totalRaised: totalRevenue,
      totalCampaigns: totalCampaignsCount,
      publishedCampaigns: activeCampaignsCount,
      totalUsers: totalUsersCount,
      totalDonations,
      totalDonationsAmount,
      totalPledges,
      totalPledgesAmount,

      // Canonical platform metrics.
      totalRevenue,
      totalTransactions,
      activeCampaigns: activeCampaignsCount,
      totalBusinesses: totalBusinessesCount,
      totalConsumers: totalConsumersCount,
      totalBackers,
      averageDonation,
      conversionRate,
      generatedAt: new Date().toISOString(),
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(stats), "EX", 60);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return stats;
  }

  /**
   * Generates periodic revenue chart data (e.g. daily, weekly, monthly, yearly).
   * Cached for 120 seconds.
   */
  async getRevenueChart(period: RevenueChartPeriod = RevenueChartPeriod.MONTHLY) {
    const cacheKey = `admin:stats:revenue:${period}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    // Default: past 6 months for monthly, past 30 days for daily, past 12 weeks for weekly
    const now = new Date();
    const fromDate = new Date();

    if (period === RevenueChartPeriod.DAILY) {
      fromDate.setDate(now.getDate() - 30);
    } else if (period === RevenueChartPeriod.WEEKLY) {
      fromDate.setDate(now.getDate() - 84);
    } else if (period === RevenueChartPeriod.YEARLY) {
      fromDate.setFullYear(now.getFullYear() - 3);
    } else {
      fromDate.setMonth(now.getMonth() - 6);
    }

    // Single query pulling completed transactions in time window
    const contributions = await this.prisma.contribution.findMany({
      where: {
        status: ContributionStatus.COMPLETED,
        createdAt: { gte: fromDate },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Bucket results
    const bucketMap = new Map<string, { label: string; revenue: number; count: number }>();

    for (const c of contributions) {
      let key = "";
      const d = c.createdAt;

      if (period === RevenueChartPeriod.DAILY) {
        key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (period === RevenueChartPeriod.WEEKLY) {
        const weekNum = Math.ceil(d.getDate() / 7);
        key = `${d.getFullYear()}-W${d.getMonth() + 1}.${weekNum}`;
      } else if (period === RevenueChartPeriod.YEARLY) {
        key = `${d.getFullYear()}`;
      } else {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      const existing = bucketMap.get(key) || { label: key, revenue: 0, count: 0 };
      existing.revenue += c.amount;
      existing.count += 1;
      bucketMap.set(key, existing);
    }

    const data = Array.from(bucketMap.values());

    try {
      await this.redis.set(cacheKey, JSON.stringify(data), "EX", 120);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return data;
  }

  /**
   * Fetches the latest contributions with optimized relations.
   */
  async getRecentContributions(limit = 10) {
    return this.prisma.contribution.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        backer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Fetches top performing campaigns by raised amount.
   */
  async getTopCampaigns(limit = 5) {
    const campaigns = await this.prisma.businessCampaign.findMany({
      take: limit,
      orderBy: { raisedAmount: "desc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            logoUrl: true,
          },
        },
      },
    });

    return campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      businessName: c.business?.name ?? "FundorDonate",
      businessCity: c.business?.city ?? "Platform",
      raisedAmount: c.raisedAmount,
      targetAmount: c.targetAmount,
      percentage: c.targetAmount > 0 ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100)) : 0,
      status: c.status,
      backerCount: c.backerCount,
    }));
  }

  /**
   * Retrieves recent administrative and platform activity events.
   */
  async getActivityFeed(limit = 20) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
