import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ConsumerService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mcomUserId: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const [contribAgg, uniqueCampaignGroups, rewardsCount] = await Promise.all([
      this.prisma.contribution.aggregate({
        where: { backerId: userId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      this.prisma.contribution.groupBy({
        by: ["campaignId"],
        where: { backerId: userId, status: "COMPLETED" },
      }),
      this.prisma.rewardIssuance.count({
        where: this.rewardOwnershipWhere(user),
      }),
    ]);

    return {
      totalContributed: contribAgg._sum.amount ?? 0,
      campaignsBacked: uniqueCampaignGroups.length,
      rewardsEarned: rewardsCount,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        userType: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; username?: string; avatar?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        avatar: data.avatar,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        userType: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async getUserDonations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.contribution.findMany({
        where: { backerId: userId },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              targetAmount: true,
              raisedAmount: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.contribution.count({ where: { backerId: userId } }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getConsumerOverview(userId: string) {
    const [stats, activeSeason, featuredCampaigns] = await Promise.all([
      this.getDashboardStats(userId),
      this.prisma.season.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      }),
      this.prisma.businessCampaign.findMany({
        where: { status: "ACTIVE" },
        take: 6,
        orderBy: { raisedAmount: "desc" },
        include: {
          business: {
            select: {
              name: true,
              city: true,
              localArea: true,
              highStreet: true,
            },
          },
        },
      }),
    ]);

    return {
      stats,
      activeSeason,
      featuredCampaigns,
    };
  }

  /**
   * The current user's reward issuances (the rewards they have earned via their
   * contributions), including the redemption code and lifecycle status.
   *
   * Ownership is matched on the contribution backer id, the recorded
   * `mcomUserId`, or the recipient email — an issuance may have been created by
   * a webhook or the reconciliation job before/without a local userId.
   */
  async getRewards(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mcomUserId: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const where = this.rewardOwnershipWhere(user);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.rewardIssuance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.rewardIssuance.count({ where }),
    ]);

    const items = await this.decorateRewards(rows);
    return { items, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /** A single issuance, scoped to the current user. */
  async getReward(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mcomUserId: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const row = await this.prisma.rewardIssuance.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { externalIssuanceId: id }] },
          this.rewardOwnershipWhere(user),
        ],
      },
    });

    if (!row) throw new NotFoundException("Reward not found");

    const [item] = await this.decorateRewards([row]);
    return item;
  }

  private rewardOwnershipWhere(user: {
    id: string;
    email: string | null;
    mcomUserId: string | null;
  }) {
    const or: Array<Record<string, unknown>> = [{ userId: user.id }];
    if (user.email) or.push({ recipientEmail: user.email });
    if (user.mcomUserId) or.push({ mcomUserId: user.mcomUserId });
    return { OR: or };
  }

  /** Attach the owning campaign's display fields (no Prisma relation exists). */
  private async decorateRewards(
    rows: Array<{
      id: string;
      campaignId: string | null;
      rewardTitle: string | null;
      rewardType: string | null;
      status: string;
      code: string | null;
      value: number | null;
      quantity: number;
      externalIssuanceId: string;
      externalRef: string | null;
      metadata: unknown;
      expiresAt: Date | null;
      redeemedAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) {
    const campaignIds = [
      ...new Set(rows.map((r) => r.campaignId).filter((id): id is string => !!id)),
    ];

    const campaigns = campaignIds.length
      ? await this.prisma.businessCampaign.findMany({
          where: { id: { in: campaignIds } },
          select: {
            id: true,
            title: true,
            business: {
              select: { name: true, city: true, logoUrl: true, coverImageUrl: true },
            },
          },
        })
      : [];
    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

    return rows.map((r) => {
      const campaign = r.campaignId ? campaignMap.get(r.campaignId) : undefined;
      return {
        id: r.id,
        externalIssuanceId: r.externalIssuanceId,
        campaignId: r.campaignId,
        campaignTitle: campaign?.title ?? null,
        campaignImage:
          campaign?.business?.coverImageUrl ?? campaign?.business?.logoUrl ?? null,
        campaignLocation: campaign?.business?.city ?? null,
        title: r.rewardTitle ?? "Reward",
        rewardType: r.rewardType,
        source: r.rewardType === "local" ? "fundordonate" : "mcom",
        status: r.status,
        code: r.code,
        value: r.value,
        quantity: r.quantity,
        metadata: r.metadata ?? null,
        expiresAt: r.expiresAt,
        redeemedAt: r.redeemedAt,
        revokedAt: r.revokedAt,
        earnedAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }

  async getNotifications(userId: string) {
    // Generate real notification events based on user activity
    const contributions = await this.prisma.contribution.findMany({
      where: { backerId: userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { title: true } } },
    });

    return contributions.map((c) => ({
      id: c.id,
      title: "Contribution Confirmed",
      message: `Your contribution of £${(c.amount / 100).toFixed(2)} to "${c.campaign?.title || "Campaign"}" was successful.`,
      createdAt: c.createdAt,
      read: true,
      type: "contribution",
    }));
  }
}
