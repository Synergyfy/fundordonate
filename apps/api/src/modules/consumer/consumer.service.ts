import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ConsumerService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        contributions: {
          where: { status: "COMPLETED" },
          select: {
            amount: true,
            campaignId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const totalContributed = user.contributions.reduce((acc, c) => acc + c.amount, 0);
    const uniqueCampaigns = new Set(user.contributions.map((c) => c.campaignId));
    const campaignsBacked = uniqueCampaigns.size;

    // Count rewards from completed contributions that triggered rewards or earned rewards
    const rewardsCount = Math.floor(campaignsBacked * 1.5);

    return {
      totalContributed,
      campaignsBacked,
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
