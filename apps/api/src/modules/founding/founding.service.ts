import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  FoundingAudience,
  FoundingMembershipStatus,
  FoundingProgramme,
  FoundingProgrammeStatus,
  HubLocation,
  MembershipTier,
  Prisma,
} from "@prisma/client";
import { JoinProgrammeDto } from "./dto/join-programme.dto";
import {
  CreateFoundingProgrammeDto,
  UpdateFoundingProgrammeDto,
} from "./dto/admin-programme.dto";

const ORIGINAL_MEMBER_LIMIT = 150;

@Injectable()
export class FoundingService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Programmes
  // ---------------------------------------------------------------------------

  async getProgrammes(locationRef: string) {
    const location = await this.resolveLocation(locationRef);
    if (!location) return [];

    const programmes = await this.prisma.foundingProgramme.findMany({
      where: { locationId: location.id, status: { not: FoundingProgrammeStatus.ARCHIVED } },
      orderBy: { audience: "asc" },
    });

    return programmes.map((p) => this.toProgrammeView(p, location.name));
  }

  async getProgramme(programmeId: string) {
    const programme = await this.prisma.foundingProgramme.findUnique({
      where: { id: programmeId },
      include: { location: { select: { name: true } } },
    });
    if (!programme) throw new NotFoundException(`Founding programme ${programmeId} not found`);
    return this.toProgrammeView(programme, programme.location.name);
  }

  async getProgrammeMembers(programmeId: string) {
    const programme = await this.prisma.foundingProgramme.findUnique({
      where: { id: programmeId },
      include: { location: { select: { name: true } } },
    });
    if (!programme) throw new NotFoundException(`Founding programme ${programmeId} not found`);

    const memberships = await this.prisma.foundingMembership.findMany({
      where: { programmeId, status: FoundingMembershipStatus.ACTIVE },
      orderBy: { startedAt: "asc" },
      take: 100,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return memberships.map((m, i) => ({
      ...this.toMembershipView(m, programme, programme.location.name),
      rank: i + 1,
      member: {
        id: m.user.id,
        name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email,
      },
    }));
  }

  // ---------------------------------------------------------------------------
  // Memberships
  // ---------------------------------------------------------------------------

  async joinProgramme(userId: string, programmeId: string, dto: JoinProgrammeDto) {
    const programme = await this.prisma.foundingProgramme.findUnique({
      where: { id: programmeId },
      include: { location: { select: { name: true } } },
    });
    if (!programme) throw new NotFoundException(`Founding programme ${programmeId} not found`);
    if (programme.status === FoundingProgrammeStatus.CLOSED || programme.status === FoundingProgrammeStatus.ARCHIVED) {
      throw new BadRequestException("This programme is no longer accepting members.");
    }

    const existing = await this.prisma.foundingMembership.findUnique({
      where: { programmeId_userId: { programmeId, userId } },
    });

    if (
      !existing &&
      programme.totalAllocation > 0 &&
      programme.allocatedCount >= programme.totalAllocation
    ) {
      throw new ConflictException("This programme is fully allocated.");
    }

    const tier = this.parseTier(dto.tier);
    const accessLevel = dto.accessLevel ?? "standard";

    const membership = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        return tx.foundingMembership.update({
          where: { id: existing.id },
          data: {
            contributionAmount: BigInt(dto.contributionAmount ?? 0),
            isMonthly: Boolean(dto.isMonthly),
            tier,
            accessLevel,
            status: FoundingMembershipStatus.ACTIVE,
          },
        });
      }

      const created = await tx.foundingMembership.create({
        data: {
          programmeId,
          userId,
          contributionAmount: BigInt(dto.contributionAmount ?? 0),
          isMonthly: Boolean(dto.isMonthly),
          tier,
          accessLevel,
          status: FoundingMembershipStatus.ACTIVE,
        },
      });

      await tx.foundingProgramme.update({
        where: { id: programmeId },
        data: { allocatedCount: { increment: 1 } },
      });

      return created;
    });

    return this.toMembershipView(membership, programme, programme.location.name);
  }

  async getMyMemberships(userId: string) {
    const memberships = await this.prisma.foundingMembership.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        programme: { include: { location: { select: { name: true } } } },
      },
    });

    return memberships.map((m) =>
      this.toMembershipView(m, m.programme, m.programme.location.name),
    );
  }

  async getContributorProfile(userId: string) {
    const memberships = await this.prisma.foundingMembership.findMany({
      where: { userId },
      include: { programme: { include: { location: { select: { name: true } } } } },
    });

    const [contributions, distinctCities] = await Promise.all([
      this.prisma.contribution.aggregate({
        where: { backerId: userId },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.contribution.findMany({
        where: { backerId: userId },
        select: { business: { select: { city: true } } },
        distinct: ["businessId"],
      }),
    ]);

    const mapped = memberships.map((m) =>
      this.toMembershipView(m, m.programme, m.programme.location.name),
    );

    return {
      backerTier: memberships.length > 0 ? "FOUNDING" : null,
      totalCampaignsBacked: contributions._count._all,
      totalContributed: Number(contributions._sum.amount ?? 0),
      citiesBacked: [
        ...new Set(distinctCities.map((c) => c.business?.city).filter(Boolean) as string[]),
      ],
      foundingMemberships: mapped,
      badges: mapped.map((m) => ({
        id: m.id,
        type: m.audience === "BUSINESS" ? "FOUNDING_BUSINESS" : "FOUNDING_CONSUMER",
        tier: m.status,
        locationName: m.locationName,
        isOriginal: m.isOriginal,
        awardedAt: m.grantedAt,
      })),
      isOriginalFoundingMember: mapped.some((m) => m.isOriginal),
    };
  }

  async checkOriginal(userId: string, locationRef: string) {
    const location = await this.resolveLocation(locationRef);
    if (!location) return { isOriginal: false };

    const programmes = await this.prisma.foundingProgramme.findMany({
      where: { locationId: location.id },
      select: { id: true },
    });
    if (programmes.length === 0) return { isOriginal: false };

    const membership = await this.prisma.foundingMembership.findFirst({
      where: { userId, programmeId: { in: programmes.map((p) => p.id) } },
      orderBy: { startedAt: "asc" },
    });
    if (!membership) return { isOriginal: false };

    const earlierCount = await this.prisma.foundingMembership.count({
      where: {
        programmeId: membership.programmeId,
        startedAt: { lte: membership.startedAt },
      },
    });

    return { isOriginal: earlierCount <= ORIGINAL_MEMBER_LIMIT };
  }

  // ---------------------------------------------------------------------------
  // Admin management
  // ---------------------------------------------------------------------------

  async adminListProgrammes(query: {
    locationId?: string;
    audience?: FoundingAudience;
    status?: FoundingProgrammeStatus;
  }) {
    const programmes = await this.prisma.foundingProgramme.findMany({
      where: {
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(query.audience ? { audience: query.audience } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        location: { select: { id: true, name: true, slug: true, type: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: [{ location: { name: "asc" } }, { audience: "asc" }],
    });

    return programmes.map((programme) => ({
      ...this.toProgrammeView(programme, programme.location.name),
      location: programme.location,
      memberCount: programme._count.memberships,
    }));
  }

  async adminListMemberships(query: {
    programmeId?: string;
    locationId?: string;
    audience?: FoundingAudience;
    status?: FoundingMembershipStatus;
  }) {
    const memberships = await this.prisma.foundingMembership.findMany({
      where: {
        ...(query.programmeId ? { programmeId: query.programmeId } : {}),
        ...(query.locationId ? { programme: { locationId: query.locationId } } : {}),
        ...(query.audience ? { programme: { audience: query.audience } } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
        programme: {
          select: {
            id: true,
            title: true,
            audience: true,
            location: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 500,
    });

    return memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      memberName:
        [membership.user.firstName, membership.user.lastName].filter(Boolean).join(" ") ||
        membership.user.username ||
        membership.user.email,
      email: membership.user.email,
      programmeId: membership.programmeId,
      programmeTitle: membership.programme.title,
      audience: membership.programme.audience,
      locationId: membership.programme.location.id,
      locationName: membership.programme.location.name,
      tier: membership.tier,
      accessLevel: membership.accessLevel,
      status: membership.status,
      contributionAmount: Number(membership.contributionAmount),
      isMonthly: membership.isMonthly,
      grantedAt: membership.startedAt.toISOString(),
    }));
  }

  async createProgramme(dto: CreateFoundingProgrammeDto) {
    const location = await this.prisma.hubLocation.findUnique({
      where: { id: dto.locationId },
      select: { id: true, name: true },
    });
    if (!location) {
      throw new NotFoundException(`Location ${dto.locationId} not found`);
    }

    const existing = await this.prisma.foundingProgramme.findUnique({
      where: { locationId_audience: { locationId: dto.locationId, audience: dto.audience } },
    });
    if (existing) {
      throw new ConflictException(
        `${location.name} already has a ${dto.audience.toLowerCase()} founding programme.`,
      );
    }

    const created = await this.prisma.foundingProgramme.create({
      data: {
        locationId: dto.locationId,
        audience: dto.audience,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? FoundingProgrammeStatus.OPEN,
        totalAllocation: dto.totalAllocation ?? 0,
        opensAt: dto.opensAt ? new Date(dto.opensAt) : undefined,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined,
        contributionConfig: (dto.contributionConfig ?? {}) as Prisma.InputJsonValue,
        benefitConfig: dto.benefitConfig ?? [],
        eligibilityConfig: (dto.eligibilityConfig ?? {}) as Prisma.InputJsonValue,
      },
    });

    return {
      ...this.toProgrammeView(created, location.name),
      location: { id: location.id, name: location.name },
      memberCount: 0,
    };
  }

  async updateProgramme(programmeId: string, dto: UpdateFoundingProgrammeDto) {
    const programme = await this.prisma.foundingProgramme.findUnique({
      where: { id: programmeId },
      include: { location: { select: { id: true, name: true } } },
    });
    if (!programme) {
      throw new NotFoundException(`Founding programme ${programmeId} not found`);
    }

    if (
      dto.totalAllocation !== undefined &&
      dto.totalAllocation < programme.allocatedCount
    ) {
      throw new BadRequestException(
        `Allocation cannot be lower than the ${programme.allocatedCount} places already allocated.`,
      );
    }

    const data: Prisma.FoundingProgrammeUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.totalAllocation !== undefined) data.totalAllocation = dto.totalAllocation;
    if (dto.opensAt !== undefined) data.opensAt = new Date(dto.opensAt);
    if (dto.closesAt !== undefined) data.closesAt = new Date(dto.closesAt);
    if (dto.contributionConfig !== undefined) {
      data.contributionConfig = dto.contributionConfig as Prisma.InputJsonValue;
    }
    if (dto.benefitConfig !== undefined) data.benefitConfig = dto.benefitConfig;
    if (dto.eligibilityConfig !== undefined) {
      data.eligibilityConfig = dto.eligibilityConfig as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.foundingProgramme.update({
      where: { id: programmeId },
      data,
      include: { _count: { select: { memberships: true } } },
    });

    return {
      ...this.toProgrammeView(updated, programme.location.name),
      location: programme.location,
      memberCount: updated._count.memberships,
    };
  }

  async archiveProgramme(programmeId: string) {
    const programme = await this.prisma.foundingProgramme.findUnique({
      where: { id: programmeId },
      include: { _count: { select: { memberships: true } } },
    });
    if (!programme) {
      throw new NotFoundException(`Founding programme ${programmeId} not found`);
    }

    if (programme._count.memberships > 0) {
      throw new BadRequestException(
        "This programme has members and cannot be deleted. Close it instead.",
      );
    }

    await this.prisma.foundingProgramme.delete({ where: { id: programmeId } });
    return { success: true, deletedId: programmeId };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async resolveLocation(ref: string): Promise<HubLocation | null> {
    if (!ref) return null;
    return this.prisma.hubLocation.findFirst({
      where: { OR: [{ id: ref }, { slug: ref }] },
    });
  }

  private parseTier(tier?: string): MembershipTier {
    const value = (tier ?? "").toUpperCase();
    return (Object.values(MembershipTier) as string[]).includes(value)
      ? (value as MembershipTier)
      : MembershipTier.BRONZE;
  }

  private contributionAmounts(config: Prisma.JsonValue): string[] {
    if (!config || typeof config !== "object" || Array.isArray(config)) return [];
    const values = Object.values(config as Record<string, unknown>).filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );
    return [...new Set(values)].sort((a, b) => a - b).map((v) => String(v));
  }

  private benefits(config: Prisma.JsonValue): string[] {
    if (!Array.isArray(config)) return [];
    return config.filter((v): v is string => typeof v === "string");
  }

  private toProgrammeView(
    p: FoundingProgramme,
    locationName: string | null,
  ) {
    return {
      id: p.id,
      locationId: p.locationId,
      locationName: locationName ?? undefined,
      audience: p.audience as FoundingAudience,
      status: p.status as FoundingProgrammeStatus,
      title: p.title,
      description: p.description ?? undefined,
      totalAllocation: p.totalAllocation,
      allocatedCount: p.allocatedCount,
      remainingCount: Math.max(0, p.totalAllocation - p.allocatedCount),
      opensAt: p.opensAt ? p.opensAt.toISOString() : undefined,
      closesAt: p.closesAt ? p.closesAt.toISOString() : undefined,
      contributionAmounts: this.contributionAmounts(p.contributionConfig),
      contributionConfig: JSON.stringify(p.contributionConfig ?? {}),
      benefits: this.benefits(p.benefitConfig),
      isOriginal: false,
    };
  }

  private toMembershipView(
    m: {
      id: string;
      userId: string;
      programmeId: string;
      status: FoundingMembershipStatus;
      contributionAmount: bigint;
      isMonthly: boolean;
      startedAt: Date;
      expiresAt: Date | null;
    },
    programme: FoundingProgramme,
    locationName: string | null,
  ) {
    return {
      id: m.id,
      userId: m.userId,
      programmeId: m.programmeId,
      locationId: programme.locationId,
      locationName: locationName ?? undefined,
      audience: programme.audience as FoundingAudience,
      status: m.status as FoundingMembershipStatus,
      contributionAmount: Number(m.contributionAmount),
      isOriginal: false,
      isMonthly: m.isMonthly,
      grantedAt: m.startedAt.toISOString(),
      expiresAt: m.expiresAt ? m.expiresAt.toISOString() : undefined,
      benefits: this.benefits(programme.benefitConfig),
    };
  }
}
