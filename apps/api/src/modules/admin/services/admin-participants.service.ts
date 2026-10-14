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

    return {
      items: items.map((b) => ({
        ...b,
        campaignCount: b._count.campaigns,
        contributionCount: b._count.contributions,
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
            earnedRewards: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return {
      ...business,
      campaignCount: business._count.campaigns,
      contributionCount: business._count.contributions,
      rewardsCount: business._count.earnedRewards,
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
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        donationsCount: c._count.contributions,
      })),
      total,
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
          firstName: true,
          lastName: true,
          membershipTier: true,
          createdAt: true,
          contributions: {
            where: { status: ContributionStatus.COMPLETED },
            select: { amount: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((b) => ({
        id: b.id,
        email: b.email,
        firstName: b.firstName,
        lastName: b.lastName,
        membershipTier: b.membershipTier,
        createdAt: b.createdAt,
        contributionsCount: b.contributions.length,
        totalContributed: b.contributions.reduce((sum, c) => sum + c.amount, 0),
      })),
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
    return this.prisma.user.findMany({
      where: {
        OR: [
          { membershipStatus: { in: ["active", "founding"] } },
          { subscription: { isActive: true } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        membershipTier: true,
        membershipPlanName: true,
        membershipStatus: true,
        subscription: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
