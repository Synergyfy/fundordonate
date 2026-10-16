import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, ContributionStatus } from "@prisma/client";
import {
  DonationsQueryDto,
  PayoutsQueryDto,
  RefundDonationDto,
  UpdatePayoutStatusDto,
} from "../dto/finance-admin.dto";
import { RewardRevokeQueueService } from "@/modules/rewards/services/reward-revoke-queue.service";
import { RewardIssueQueueService } from "@/modules/rewards/services/reward-issue-queue.service";

@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardRevokeQueue: RewardRevokeQueueService,
    private readonly rewardIssueQueue: RewardIssueQueueService,
  ) {}

  /**
   * Retrieves a paginated list of contributions/donations with eager relations.
   */
  async getDonations(query: DonationsQueryDto) {
    const { page = 1, limit = 20, status, type, gateway, search, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContributionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (gateway) {
      where.gateway = gateway;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { business: { name: { contains: search, mode: "insensitive" } } },
        { backer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.contribution.count({ where }),
      this.prisma.contribution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          backer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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
      }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        uid: c.id,
        status: String(c.status).toLowerCase(),
        user: c.backer,
        donorId: c.backerId,
        campaignId: c.campaignId,
        isAnonymous: Boolean((c.metadata as Record<string, unknown>)?.isAnonymous),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin status transition for a contribution/pledge. Adjusts the campaign
   * raised total and (de)issues rewards to keep the ledger consistent.
   */
  async updateContributionStatus(id: string, status: string, adminUserId?: string) {
    const allowed = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];
    const next = (status || "").toUpperCase();
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Allowed: ${allowed.join(", ")}`,
      );
    }

    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!contribution) {
      throw new NotFoundException(`Contribution with ID ${id} not found`);
    }

    const wasCompleted = contribution.status === ContributionStatus.COMPLETED;
    const willBeCompleted = next === ContributionStatus.COMPLETED;

    if (!wasCompleted && willBeCompleted) {
      const previousCount = contribution.backerId
        ? await this.prisma.contribution.count({
            where: {
              campaignId: contribution.campaignId,
              backerId: contribution.backerId,
              status: ContributionStatus.COMPLETED,
              id: { not: id },
            },
          })
        : 0;
      const isNewBacker = previousCount === 0 && contribution.type !== "SELF_FUNDING";

      const [updated] = await this.prisma.$transaction([
        this.prisma.contribution.update({ where: { id }, data: { status: next as ContributionStatus } }),
        this.prisma.businessCampaign.update({
          where: { id: contribution.campaignId },
          data: {
            raisedAmount: { increment: contribution.amount },
            ...(isNewBacker ? { backerCount: { increment: 1 } } : {}),
          },
        }),
        this.prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "CONTRIBUTION_STATUS_COMPLETED",
            entityType: "contribution",
            entityId: id,
            details: { previousStatus: contribution.status, newStatus: next },
          },
        }),
      ]);

      await this.rewardIssueQueue.enqueueContribution(id);
      return updated;
    }

    if (wasCompleted && !willBeCompleted) {
      const remainingCount = contribution.backerId
        ? await this.prisma.contribution.count({
            where: {
              campaignId: contribution.campaignId,
              backerId: contribution.backerId,
              status: ContributionStatus.COMPLETED,
              id: { not: id },
            },
          })
        : 0;
      const shouldDecrementBacker =
        contribution.backerId && remainingCount === 0 && contribution.type !== "SELF_FUNDING";

      const [updated] = await this.prisma.$transaction([
        this.prisma.contribution.update({ where: { id }, data: { status: next as ContributionStatus } }),
        this.prisma.businessCampaign.update({
          where: { id: contribution.campaignId },
          data: {
            raisedAmount: { decrement: contribution.amount },
            ...(shouldDecrementBacker ? { backerCount: { decrement: 1 } } : {}),
          },
        }),
        this.prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "CONTRIBUTION_STATUS_UPDATED",
            entityType: "contribution",
            entityId: id,
            details: { previousStatus: contribution.status, newStatus: next },
          },
        }),
      ]);

      await this.rewardRevokeQueue.enqueueContribution(id);
      return updated;
    }

    return this.prisma.contribution.update({ where: { id }, data: { status: next as ContributionStatus } });
  }
  async getDonation(id: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: {
        backer: true,
        business: true,
        campaign: true,
      },
    });

    if (!contribution) {
      throw new NotFoundException(`Contribution with ID ${id} not found`);
    }

    return contribution;
  }

  /**
   * Processes a refund for a contribution and deducts amount from the campaign raised amount.
   */
  async refundDonation(id: string, dto: RefundDonationDto, adminUserId?: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!contribution) {
      throw new NotFoundException(`Contribution with ID ${id} not found`);
    }

    if (contribution.status === ContributionStatus.REFUNDED) {
      throw new BadRequestException("Contribution has already been refunded");
    }

    const refundAmount = dto.amount || contribution.amount;

    // Check if backer has any remaining completed contributions to this campaign
    const remainingCount = contribution.backerId
      ? await this.prisma.contribution.count({
          where: {
            campaignId: contribution.campaignId,
            backerId: contribution.backerId,
            status: ContributionStatus.COMPLETED,
            id: { not: id },
          },
        })
      : 0;
    const shouldDecrementBacker = contribution.backerId && remainingCount === 0;

    const [updatedContribution] = await this.prisma.$transaction([
      this.prisma.contribution.update({
        where: { id },
        data: {
          status: ContributionStatus.REFUNDED,
          metadata: {
            ...(contribution.metadata as object),
            refundedAt: new Date().toISOString(),
            refundReason: dto.reason,
            refundAmount,
          },
        },
      }),
      this.prisma.businessCampaign.update({
        where: { id: contribution.campaignId },
        data: {
          raisedAmount: {
            decrement: refundAmount,
          },
          ...(shouldDecrementBacker ? { backerCount: { decrement: 1 } } : {}),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: "CONTRIBUTION_REFUNDED",
          entityType: "contribution",
          entityId: id,
          details: { refundAmount, reason: dto.reason },
        },
      }),
    ]);

    // Revoke any reward issued for this contribution (durable, idempotent)
    await this.rewardRevokeQueue.enqueueContribution(id);

    return updatedContribution;
  }

  /**
   * Aggregates finance balances, payouts, and platform fee metrics.
   */
  async getFinanceOverview() {
    const [completedAgg, refundedAgg, pendingPayoutsAgg] = await Promise.all([
      this.prisma.contribution.aggregate({
        where: { status: ContributionStatus.COMPLETED },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.contribution.aggregate({
        where: { status: ContributionStatus.REFUNDED },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payoutRequest.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalGross = completedAgg._sum.amount ?? 0;
    const totalRefunded = refundedAgg._sum.amount ?? 0;
    const totalNet = totalGross - totalRefunded;

    // Platform fee rule: e.g. 5%
    const estimatedPlatformFees = Math.round(totalNet * 0.05);
    const pendingPayoutAmount = pendingPayoutsAgg._sum.amount ?? 0;
    const availableEscrowBalance = totalNet - pendingPayoutAmount - estimatedPlatformFees;

    return {
      totalGross,
      totalRefunded,
      totalNet,
      estimatedPlatformFees,
      pendingPayouts: {
        count: pendingPayoutsAgg._count.id ?? 0,
        amount: pendingPayoutAmount,
      },
      availableEscrowBalance: Math.max(0, availableEscrowBalance),
    };
  }

  /**
   * Retrieves payout requests.
   */
  async getPayouts(query: PayoutsQueryDto) {
    const { page = 1, limit = 20, status, businessId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutRequestWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (businessId) {
      where.businessId = businessId;
    }

    const [total, items] = await Promise.all([
      this.prisma.payoutRequest.count({ where }),
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              email: true,
              city: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates payout request status.
   */
  async updatePayoutStatus(id: string, dto: UpdatePayoutStatusDto, adminUserId?: string) {
    const payout = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!payout) {
      throw new NotFoundException(`Payout request with ID ${id} not found`);
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        processedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `PAYOUT_${dto.status}`,
        entityType: "payout",
        entityId: id,
        details: { previousStatus: payout.status, newStatus: dto.status, reason: dto.rejectionReason },
      },
    });

    return updated;
  }
}
