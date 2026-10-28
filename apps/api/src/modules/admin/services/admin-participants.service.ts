import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, ContributionStatus } from "@prisma/client";
import {
  BackersQueryDto,
  BusinessesQueryDto,
  ConsumersQueryDto,
  UpdateBusinessTierDto,
  UpdateUserRoleDto,
  UsersQueryDto,
  VerifyBusinessDto,
} from "../dto/participant-query.dto";

@Injectable()
export class AdminParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves a paginated list of registered users.
   */
  async getUsers(query: UsersQueryDto) {
    const { page = 1, limit = 20, role, userType, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (userType) {
      where.userType = userType;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          membershipTier: true,
          createdAt: true,
          _count: {
            select: {
              businesses: true,
              contributions: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((u) => ({
        ...u,
        businessCount: u._count.businesses,
        contributionCount: u._count.contributions,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single user details with businesses and contribution ledger.
   */
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        businesses: true,
        subscription: true,
        contributions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            business: { select: { id: true, name: true } },
            campaign: { select: { id: true, title: true } },
          },
        },
        _count: {
          select: { businesses: true, contributions: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      ...user,
      businessCount: user._count.businesses,
      contributionCount: user._count.contributions,
    };
  }

  /**
   * Updates user role and logs an audit log entry.
   */
  async updateUserRole(id: string, dto: UpdateUserRoleDto, adminUserId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "USER_ROLE_UPDATED",
        entityType: "user",
        entityId: id,
        details: { previousRole: user.role, newRole: dto.role },
      },
    });

    return updated;
  }

  /**
   * Retrieves a paginated list of businesses with owner and campaign statistics.
   */
  async getBusinesses(query: BusinessesQueryDto) {
    const { page = 1, limit = 20, status, membershipTier, city, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (membershipTier) {
      where.membershipTier = membershipTier;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              contributions: true,
            },
          },
        },
      }),
    ]);

    // Aggregate completed contribution totals for the current page in one
    // query so list/report views can display real raised amounts.
    const businessIds = items.map((b) => b.id);
    const contributionTotals = businessIds.length
      ? await this.prisma.contribution.groupBy({
          by: ["businessId"],
          where: {
            businessId: { in: businessIds },
            status: ContributionStatus.COMPLETED,
          },
          _sum: { amount: true },
        })
      : [];
    const raisedByBusiness = new Map(
      contributionTotals.map((row) => [row.businessId as string, row._sum.amount ?? 0]),
    );

    return {
      items: items.map((b) => ({
        ...b,
        campaignCount: b._count.campaigns,
        contributionCount: b._count.contributions,
        totalRaised: raisedByBusiness.get(b.id) ?? 0,
        totalContributed: raisedByBusiness.get(b.id) ?? 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single business details with owner, campaigns, and settings.
   */
  async getBusiness(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        campaigns: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        settings: true,
        _count: {
          select: {
            campaigns: true,
            contributions: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Rewards issued for this business's campaigns (legacy earnedRewards retired).
    const campaignIds = (
      await this.prisma.businessCampaign.findMany({
        where: { businessId: id },
        select: { id: true },
      })
    ).map((c) => c.id);
    const rewardsCount = campaignIds.length
      ? await this.prisma.rewardIssuance.count({
          where: { campaignId: { in: campaignIds } },
        })
      : 0;

    const contributionAgg = await this.prisma.contribution.aggregate({
      where: { businessId: id, status: ContributionStatus.COMPLETED },
      _sum: { amount: true },
    });
    const totalRaised = contributionAgg._sum.amount ?? 0;

    return {
      ...business,
      campaignCount: business._count.campaigns,
      contributionCount: business._count.contributions,
      totalRaised,
      totalContributed: totalRaised,
      rewardsCount,
    };
  }

  /**
   * Updates verification status for a business.
   */
  async verifyBusiness(id: string, dto: VerifyBusinessDto, adminUserId?: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `BUSINESS_VERIFICATION_${dto.status}`,
        entityType: "business",
        entityId: id,
        details: { previousStatus: business.status, newStatus: dto.status },
      },
    });

    return updated;
  }

  /**
   * Updates business membership tier.
   */
  async updateBusinessTier(id: string, dto: UpdateBusinessTierDto, adminUserId?: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: { membershipTier: dto.membershipTier },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "BUSINESS_TIER_UPDATED",
        entityType: "business",
        entityId: id,
        details: { previousTier: business.membershipTier, newTier: dto.membershipTier },
      },
    });

    return updated;
  }

  /**
   * Retrieves consumer users with their contribution statistics.
   */
  async getConsumers(query: ConsumersQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      userType: "consumer",
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items, foundingCount, activeMembersCount] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          membershipTier: true,
          membershipStatus: true,
          createdAt: true,
          _count: {
            select: { contributions: true },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          ...where,
          membershipTier: { contains: "FOUNDING", mode: "insensitive" },
        },
      }),
      this.prisma.user.count({
        where: {
          ...where,
          membershipStatus: "ACTIVE",
        },
      }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        donationsCount: c._count.contributions,
      })),
      total,
      foundingCount,
      activeMembersCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves backers list with aggregated contribution totals.
   */
  async getBackers(query: BackersQueryDto) {
    const { page = 1, limit = 20, tier, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      contributions: { some: { status: ContributionStatus.COMPLETED } },
    };

    if (tier) {
      where.membershipTier = tier;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          membershipTier: true,
          createdAt: true,
        },
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const agg = userIds.length > 0
      ? await this.prisma.contribution.groupBy({
          by: ["backerId"],
          where: { backerId: { in: userIds }, status: ContributionStatus.COMPLETED },
          _sum: { amount: true },
          _count: { id: true },
        })
      : [];
    const aggMap = new Map(
      agg.map((a) => [a.backerId!, { count: a._count.id, total: a._sum.amount ?? 0 }]),
    );

    return {
      items: users.map((b) => {
        const stats = aggMap.get(b.id) ?? { count: 0, total: 0 };
        return {
          id: b.id,
          email: b.email,
          firstName: b.firstName,
          lastName: b.lastName,
          membershipTier: b.membershipTier,
          createdAt: b.createdAt,
          contributionsCount: stats.count,
          totalContributed: stats.total,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves founding members with active subscription or founding status.
   */
  async getFoundingMembers() {
    const members = await this.prisma.user.findMany({
      where: {
        OR: [
          { membershipStatus: { in: ["active", "founding"] } },
          { subscription: { isActive: true } },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        userType: true,
        membershipTier: true,
        membershipPlanName: true,
        membershipStatus: true,
        subscription: true,
        createdAt: true,
        businesses: {
          select: { name: true, city: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const userIds = members.map((m) => m.id);
    const contributionsAgg = userIds.length > 0
      ? await this.prisma.contribution.groupBy({
          by: ["backerId"],
          where: { backerId: { in: userIds }, status: ContributionStatus.COMPLETED },
          _sum: { amount: true },
        })
      : [];
    const contribMap = new Map(
      contributionsAgg.map((c) => [c.backerId!, c._sum.amount ?? 0]),
    );

    return members.map((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || u.email;
      const biz = u.businesses[0];
      const isSubActive = u.subscription?.isActive ?? false;
      const rawStatus = (u.membershipStatus || "").toLowerCase();
      const status = (rawStatus === "active" || rawStatus === "founding" || isSubActive)
        ? "ACTIVE"
        : (rawStatus || "EXPIRED").toUpperCase();

      return {
        id: u.id,
        email: u.email,
        name,
        userName: u.username,
        businessName: biz?.name ?? null,
        locationName: biz?.city ?? "National",
        audience: u.userType === "business" ? "BUSINESS" : "CONSUMER",
        status,
        contributionAmount: contribMap.get(u.id) ?? 0,
        avatar: u.avatar,
        membershipTier: u.membershipTier,
        membershipPlanName: u.membershipPlanName,
        membershipStatus: u.membershipStatus,
        subscription: u.subscription,
        createdAt: u.createdAt,
      };
    });
  }
}
