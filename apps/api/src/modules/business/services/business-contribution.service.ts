import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  ContributionStatus,
  ContributionType,
} from "@prisma/client";
import { ContributionQueryDto } from "../dto/contribution-query.dto";
import { SelfFundDto } from "../dto/self-fund.dto";
import { RewardIssueQueueService } from "@/modules/rewards/services/reward-issue-queue.service";

@Injectable()
export class BusinessContributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardIssuanceQueue: RewardIssueQueueService,
  ) {}

  /**
   * Retrieves paginated contribution ledger and overall summary totals for the business.
   */
  async getContributions(
    businessId: string,
    query: ContributionQueryDto,
  ): Promise<{
    summary: {
      totalAmount: number;
      transactionCount: number;
    };
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {
      businessId,
      status: ContributionStatus.COMPLETED,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [items, total, agg] = await Promise.all([
      this.prisma.contribution.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: {
          campaign: {
            select: {
              title: true,
            },
          },
        },
      }),
      this.prisma.contribution.count({ where }),
      this.prisma.contribution.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      summary: {
        totalAmount: agg._sum.amount ?? 0,
        transactionCount: total,
      },
      items: items.map((c) => ({
        id: c.id,
        campaign: c.campaign.title,
        type: c.type,
        amount: c.amount,
        reference: c.reference,
        gateway: c.gateway,
        date: c.createdAt.toISOString().split("T")[0],
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Processes a self-funding contribution from the business owner into their campaign.
   */
  async selfFund(
    businessId: string,
    campaignId: string,
    dto: SelfFundDto,
  ): Promise<{
    reference: string;
    contributed: number;
    rewardTriggered: string | null;
  }> {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const reference = `SELF-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 1000,
    )}`;

    let contributionId = "";

    await this.prisma.$transaction(async (tx) => {
      // 1. Record contribution ledger entry
      const contribution = await tx.contribution.create({
        data: {
          businessId,
          campaignId,
          type: ContributionType.SELF_FUNDING,
          status: ContributionStatus.COMPLETED,
          amount: dto.amount,
          reference,
          gateway: dto.gateway,
          paymentIntentId: dto.paymentToken,
        },
      });
      contributionId = contribution.id;

      // 2. Increment campaign raised and self-contribution amounts. Self-funding
      //    no longer unlocks rewards — the campaign runner is not eligible for
      //    rewards from their own campaign.
      const updateResult = await tx.businessCampaign.updateMany({
        where: { id: campaignId, businessId },
        data: {
          businessContribution: { increment: dto.amount },
          raisedAmount: { increment: dto.amount },
        },
      });

      if (updateResult.count === 0) {
        throw new NotFoundException("Campaign not found");
      }
    });

    // 3. Queue reward evaluation (durable + retried; never blocks the
    //    contribution). The runner is excluded as a recipient by the trigger.
    await this.rewardIssuanceQueue.enqueueContribution(contributionId);

    return {
      reference,
      contributed: dto.amount,
      rewardTriggered: null,
    };
  }
}
