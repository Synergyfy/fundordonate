import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export interface BusinessRewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
}

/**
 * Business reward listing.
 *
 * Reads from `RewardIssuance` — the unified mirror of rewards issued for the
 * business's campaigns (MCOM Rewards + FundOrDonate-local). The legacy
 * gamification catalogue (`RewardDefinition`/`BusinessEarnedReward`) was retired.
 */
@Injectable()
export class BusinessRewardService {
  constructor(private readonly prisma: PrismaService) {}

  async getRewards(businessId: string): Promise<{
    earnedCount: number;
    totalCount: number;
    earned: BusinessRewardItem[];
    locked: BusinessRewardItem[];
  }> {
    const campaigns = await this.prisma.businessCampaign.findMany({
      where: { businessId },
      select: { id: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    const issuances = campaignIds.length
      ? await this.prisma.rewardIssuance.findMany({
          where: { campaignId: { in: campaignIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const earned: BusinessRewardItem[] = issuances.map((i) => ({
      id: i.id,
      name: i.rewardTitle ?? "Reward",
      description:
        i.rewardType === "local"
          ? "FundOrDonate reward"
          : "Issued via MCOM Rewards",
      icon: "🎁",
      earned: true,
      earnedAt: i.createdAt.toISOString().split("T")[0],
    }));

    return {
      earnedCount: earned.length,
      totalCount: earned.length,
      earned,
      locked: [],
    };
  }
}
