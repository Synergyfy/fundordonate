import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
        membershipLevel: true,
        membershipPlanName: true,
        membershipStatus: true,
        membershipTier: true,
        subscription: {
          select: {
            status: true,
            planName: true,
            isActive: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException("User not found");

    // Flatten the cached MCOM subscription snapshot into the fields the
    // consumer membership page renders.
    const { subscription, ...profile } = user;
    return {
      ...profile,
      membershipStartDate: subscription?.createdAt ?? null,
      membershipEndDate: subscription?.expiresAt ?? null,
      membershipAutoRenew: subscription?.isActive ?? false,
    };
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

  /**
   * Permanently deletes the current user's account.
   *
   * Business owners are rejected because deleting them would cascade into the
   * business, its campaigns and other people's contributions. Consumers can
   * delete: reward issuances are removed, contributions are detached (their
   * `backerId` is nulled by the schema) so campaign totals stay correct.
   */
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const ownedBusinesses = await this.prisma.business.count({
      where: { ownerId: userId },
    });
    if (ownedBusinesses > 0) {
      throw new BadRequestException(
        "Your account owns a business profile. Transfer or close the business before deleting your account.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.rewardIssuance.deleteMany({
        where: {
          OR: [{ userId }, ...(user.email ? [{ recipientEmail: user.email }] : [])],
        },
      }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  }

  /** Shared relation shape for a backer's contribution rows. */
  private contributionInclude() {
    return {
      campaign: {
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          category: true,
          imageUrl: true,
          targetAmount: true,
          raisedAmount: true,
          endDate: true,
        },
      },
      business: {
        select: {
          id: true,
          name: true,
          city: true,
          localArea: true,
          highStreet: true,
        },
      },
    };
  }

  /** Attach the reward issuance (if any) that a contribution produced. */
  private async attachRewards<
    T extends { id: string },
  >(items: T[]): Promise<Array<T & { reward: Record<string, unknown> | null }>> {
    const ids = items.map((item) => item.id);
    const issuances = ids.length
      ? await this.prisma.rewardIssuance.findMany({
          where: { contributionId: { in: ids } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const byContribution = new Map<string, (typeof issuances)[number]>();
    for (const issuance of issuances) {
      if (!issuance.contributionId) continue;
      if (!byContribution.has(issuance.contributionId)) {
        byContribution.set(issuance.contributionId, issuance);
      }
    }

    return items.map((item) => {
      const issuance = byContribution.get(item.id);
      return {
        ...item,
        reward: issuance
          ? {
              id: issuance.id,
              externalIssuanceId: issuance.externalIssuanceId,
              title: issuance.rewardTitle ?? "Reward",
              status: issuance.status,
              code: issuance.code,
              value: issuance.value,
              expiresAt: issuance.expiresAt,
              issuedAt: issuance.createdAt,
            }
          : null,
      };
    });
  }

  async getUserDonation(userId: string, contributionId: string) {
    const contribution = await this.prisma.contribution.findFirst({
      where: { id: contributionId, backerId: userId },
      include: this.contributionInclude(),
    });
    if (!contribution) {
      throw new NotFoundException("Contribution not found");
    }

    const [decorated] = await this.attachRewards([contribution]);
    return decorated;
  }

  async getUserDonations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { backerId: userId };

    const [items, total, agg, campaignGroups] = await Promise.all([
      this.prisma.contribution.findMany({
        where,
        include: this.contributionInclude(),
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.contribution.count({ where }),
      this.prisma.contribution.aggregate({
        where: { ...where, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      this.prisma.contribution.groupBy({
        by: ["campaignId"],
        where,
      }),
    ]);

    return {
      items: await this.attachRewards(items),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary: {
        totalAmount: agg._sum.amount ?? 0,
        transactionCount: total,
        campaignCount: campaignGroups.length,
      },
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mcomUserId: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const [contributions, rewards] = await Promise.all([
      this.prisma.contribution.findMany({
        where: { backerId: userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { id: true, title: true } } },
      }),
      this.prisma.rewardIssuance.findMany({
        where: this.rewardOwnershipWhere(user),
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items = [
      ...contributions.map((c) => {
        const status = String(c.status).toUpperCase();
        const amount = `£${(c.amount / 100).toFixed(2)}`;
        const campaign = c.campaign?.title || "Campaign";
        const title =
          status === "COMPLETED"
            ? "Contribution confirmed"
            : status === "PENDING"
              ? "Contribution pending"
              : status === "REFUNDED"
                ? "Contribution refunded"
                : "Contribution failed";
        const message =
          status === "COMPLETED"
            ? `Your contribution of ${amount} to "${campaign}" was successful.`
            : status === "PENDING"
              ? `Your contribution of ${amount} to "${campaign}" is awaiting payment.`
              : status === "REFUNDED"
                ? `Your contribution of ${amount} to "${campaign}" was refunded.`
                : `Your contribution of ${amount} to "${campaign}" could not be completed.`;
        return {
          id: `contribution:${c.id}`,
          title,
          message,
          createdAt: c.createdAt,
          // Read state is persisted per device in the web app; the API only
          // reports the event stream, so every event starts unread.
          read: false,
          type: "contribution",
          reference: c.reference,
          link: `/consumer/activity/contributions/${c.id}`,
        };
      }),
      ...rewards.map((r) => ({
        id: `reward:${r.id}`,
        title: r.status === "REDEEMED" ? "Reward redeemed" : "Reward earned",
        message:
          r.status === "REDEEMED"
            ? `Your reward "${r.rewardTitle ?? "Reward"}" has been redeemed.`
            : `You earned a new reward: "${r.rewardTitle ?? "Reward"}".`,
        createdAt: r.createdAt,
        read: false,
        type: "reward",
        reference: r.externalIssuanceId,
        link: `/consumer/rewards/${r.id}`,
      })),
    ];

    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
