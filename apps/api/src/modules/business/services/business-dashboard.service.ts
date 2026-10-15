import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BusinessCampaignStatus, ContributionStatus } from "@prisma/client";
import { BusinessLeaderboardService } from "./business-leaderboard.service";

export interface DashboardOverviewResponse {
  stats: {
    businessName: string;
    membershipTier: string;
    totalContributed: number;
    activeCampaigns: number;
    totalBackers: number;
    leaderboardRank: number;
    rewardsEarned: number;
    currentSeasonContribution: number;
  };
  availableTemplateTeaser: {
    id: string;
    name: string;
    tagline: string;
  } | null;
  recentCampaigns: Array<{
    id: string;
    name: string;
    raised: number;
    target: number;
    status: string;
    percentage: number;
  }>;
}

@Injectable()
export class BusinessDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboardService: BusinessLeaderboardService,
  ) {}

  /**
   * Aggregates all KPI metrics for the business owner dashboard in parallel without N+1 queries.
   */
  async getOverview(businessId: string): Promise<DashboardOverviewResponse> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        membershipTier: true,
      },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    // Execute queries in parallel at database engine level
    const [
      contributionAgg,
      activeCampaignCount,
      backerCount,
      campaignIdRows,
      recentCampaigns,
      teaserTemplate,
      rankInfo,
    ] = await Promise.all([
      // Total contributions
      this.prisma.contribution.aggregate({
        where: {
          businessId,
          status: ContributionStatus.COMPLETED,
        },
        _sum: {
          amount: true,
        },
      }),

      // Active campaign count
      this.prisma.businessCampaign.count({
        where: {
          businessId,
          status: BusinessCampaignStatus.ACTIVE,
        },
      }),

      // Total completed backer contributions
      this.prisma.contribution.count({
        where: {
          businessId,
          status: ContributionStatus.COMPLETED,
        },
      }),

      // Campaign ids (used to count rewards issued for this business)
      this.prisma.businessCampaign.findMany({
        where: { businessId },
        select: { id: true },
      }),

      // Recent active campaigns
      this.prisma.businessCampaign.findMany({
        where: {
          businessId,
          status: BusinessCampaignStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          raisedAmount: true,
          targetAmount: true,
          status: true,
        },
      }),

      // Teaser template
      this.prisma.campaignTemplate.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          tagline: true,
        },
      }),

      // City leaderboard rank
      this.leaderboardService.getBusinessRank(businessId),
    ]);

    const totalContributed = contributionAgg._sum.amount ?? 0;

    // Rewards issued for this business's campaigns (MCOM Rewards + local mirror)
    const campaignIds = campaignIdRows.map((c) => c.id);
    const rewardsCount = campaignIds.length
      ? await this.prisma.rewardIssuance.count({
          where: { campaignId: { in: campaignIds } },
        })
      : 0;

    return {
      stats: {
        businessName: business.name,
        membershipTier: business.membershipTier,
        totalContributed,
        activeCampaigns: activeCampaignCount,
        totalBackers: backerCount,
        leaderboardRank: rankInfo.rank,
        rewardsEarned: rewardsCount,
        currentSeasonContribution: totalContributed, // Season-scoped aggregate in multi-season setups
      },
      availableTemplateTeaser: teaserTemplate
        ? {
            id: teaserTemplate.id,
            name: teaserTemplate.name,
            tagline: teaserTemplate.tagline,
          }
        : null,
      recentCampaigns: recentCampaigns.map((c) => ({
        id: c.id,
        name: c.title,
        raised: c.raisedAmount,
        target: c.targetAmount,
        status: c.status,
        percentage:
          c.targetAmount > 0
            ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
            : 0,
      })),
    };
  }
}
