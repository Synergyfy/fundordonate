import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ContributionStatus } from "@prisma/client";

export interface BusinessRewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
}

@Injectable()
export class BusinessRewardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all platform rewards, computing earned status and locked progress.
   */
  async getRewards(businessId: string): Promise<{
    earnedCount: number;
    totalCount: number;
    earned: BusinessRewardItem[];
    locked: BusinessRewardItem[];
  }> {
    const [allDefinitions, earnedRecords, contributionAgg, backerCount, campaignCount] =
      await Promise.all([
        this.prisma.rewardDefinition.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        }),
        this.prisma.businessEarnedReward.findMany({
          where: { businessId },
          include: { reward: true },
        }),
        this.prisma.contribution.aggregate({
          where: { businessId, status: ContributionStatus.COMPLETED },
          _sum: { amount: true },
        }),
        this.prisma.contribution.count({
          where: { businessId, status: ContributionStatus.COMPLETED },
        }),
        this.prisma.businessCampaign.count({
          where: { businessId },
        }),
      ]);

    const totalContributed = contributionAgg._sum.amount ?? 0;
    const earnedMap = new Map(
      earnedRecords.map((er) => [er.rewardId, er.earnedAt.toISOString().split("T")[0]]),
    );

    const earned: BusinessRewardItem[] = [];
    const locked: BusinessRewardItem[] = [];

    // Fallback default definitions if seed data hasn't run yet
    const definitions =
      allDefinitions.length > 0
        ? allDefinitions
        : [
            {
              id: "r1",
              code: "champion",
              name: "City Champion",
              description: "Contributed over £50,000 to city campaigns.",
              icon: "🏆",
              criteria: { type: "TOTAL_CONTRIBUTION", target: 5000000 },
            },
            {
              id: "r2",
              code: "community_builder",
              name: "Community Builder",
              description: "Supported 3+ community campaigns.",
              icon: "🏘️",
              criteria: { type: "CAMPAIGN_COUNT", target: 3 },
            },
            {
              id: "r3",
              code: "platinum_achiever",
              name: "Platinum Achiever",
              description: "Reach £250,000 total contributions.",
              icon: "💎",
              criteria: { type: "TOTAL_CONTRIBUTION", target: 25000000 },
            },
            {
              id: "r4",
              code: "backer_magnet",
              name: "Backer Magnet",
              description: "Attract 200+ backers to your campaigns.",
              icon: "🧲",
              criteria: { type: "BACKER_COUNT", target: 200 },
            },
          ];

    for (const def of definitions) {
      const isEarned = earnedMap.has(def.id);
      const criteria: any = def.criteria ?? {};

      if (isEarned) {
        earned.push({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          earned: true,
          earnedAt: earnedMap.get(def.id),
        });
      } else {
        let progress = 0;
        if (criteria.type === "TOTAL_CONTRIBUTION" && criteria.target) {
          progress = Math.min(100, Math.round((totalContributed / criteria.target) * 100));
        } else if (criteria.type === "CAMPAIGN_COUNT" && criteria.target) {
          progress = Math.min(100, Math.round((campaignCount / criteria.target) * 100));
        } else if (criteria.type === "BACKER_COUNT" && criteria.target) {
          progress = Math.min(100, Math.round((backerCount / criteria.target) * 100));
        }

        locked.push({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          earned: false,
          progress,
        });
      }
    }

    return {
      earnedCount: earned.length,
      totalCount: earned.length + locked.length,
      earned,
      locked,
    };
  }
}
