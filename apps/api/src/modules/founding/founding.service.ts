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
