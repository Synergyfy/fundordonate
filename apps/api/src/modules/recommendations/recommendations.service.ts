import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { HubLocationType, Prisma, RecommendationStatus } from "@prisma/client";
import Redis from "ioredis";
import { PrismaService } from "@/prisma/prisma.service";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import {
  AdminRecommendationsQueryDto,
  PublicRecommendationsQueryDto,
  SubmitLocationRecommendationDto,
} from "./dto/recommendation.dto";

const LOCAL_AREA_TYPES: HubLocationType[] = [
  HubLocationType.BOROUGH,
  HubLocationType.DISTRICT,
  HubLocationType.LOCAL_AREA,
];

const CITY_CHILD_TYPES: HubLocationType[] = [...LOCAL_AREA_TYPES];

const ADMIN_ITEM_INCLUDE = {
  city: { select: { id: true, name: true, slug: true } },
  area: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.LocationRecommendationInclude;

type RecommendationWithRelations = Prisma.LocationRecommendationGetPayload<{
  include: typeof ADMIN_ITEM_INCLUDE;
}>;

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ───────────────────────────── Submission ─────────────────────────────

  async submit(dto: SubmitLocationRecommendationDto) {
    const city = await this.resolveCity(dto.citySlug);
    const area = dto.areaSlug ? await this.resolveArea(dto.areaSlug) : null;
    if (area && !(await this.areaBelongsToCity(area.id, city.id))) {
      throw new BadRequestException(
        `Local area '${area.name}' does not belong to ${city.name}.`,
      );
    }

    const kind = dto.kind ?? "HIGH_STREET";
    if (kind === "HIGH_STREET" && !area) {
      throw new BadRequestException(
        "A high street recommendation must include the local area it belongs to.",
      );
    }

    const duplicate = await this.prisma.locationRecommendation.findFirst({
      where: {
        cityId: city.id,
        areaId: area?.id ?? null,
        name: { equals: dto.name.trim(), mode: "insensitive" },
        status: RecommendationStatus.PENDING,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        "A pending recommendation for this location already exists.",
      );
    }

    const created = await this.prisma.locationRecommendation.create({
      data: {
        kind,
        name: dto.name.trim(),
        slug: this.slugify(dto.name),
        postcodes: (dto.postcodes ?? []).map((postcode) => postcode.trim()).filter(Boolean),
        note: dto.note?.trim() || null,
        suggestedBy: dto.suggestedBy?.trim() || null,
        submittedByRole: dto.submittedByRole,
        cityId: city.id,
        areaId: area?.id ?? null,
        status: RecommendationStatus.PENDING,
      },
      include: ADMIN_ITEM_INCLUDE,
    });

    return this.toAdminItem(created);
  }

  /** Public queue used by the city wizard to show community suggestions. */
  async listPublic(query: PublicRecommendationsQueryDto) {
    const where: Prisma.LocationRecommendationWhereInput = {};
    if (query.status) {
      where.status = query.status;
    } else {
      // Only pending suggestions are useful to the city wizard; approved ones
      // already exist in the hierarchy and rejected ones are discarded.
      where.status = RecommendationStatus.PENDING;
    }
    if (query.citySlug) {
      const city = await this.findCity(query.citySlug);
      if (!city) return { items: [] };
      where.cityId = city.id;
    }

    const items = await this.prisma.locationRecommendation.findMany({
      where,
      include: ADMIN_ITEM_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { items: items.map((item) => this.toPublicItem(item)) };
  }

  // ───────────────────────────── Admin queue ─────────────────────────────

  async listAdmin(query: AdminRecommendationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationRecommendationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { name: { contains: search, mode: "insensitive" } } },
        { area: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total, grouped] = await Promise.all([
      this.prisma.locationRecommendation.findMany({
        where,
        include: ADMIN_ITEM_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.locationRecommendation.count({ where }),
      this.prisma.locationRecommendation.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const counts = this.buildCounts(grouped);

    return {
      items: items.map((item) => this.toAdminItem(item)),
      counts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async counts() {
    const grouped = await this.prisma.locationRecommendation.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return this.buildCounts(grouped);
  }

  /**
   * Approves a recommendation and creates a SUGGESTED HubLocation under the
   * submitted local area (high street) or city (local area). Suggested
   * locations are hidden from the public site until an admin confirms them on
   * the High Streets / Local Areas pages.
   */
  async approve(id: string, adminUserId?: string) {
    const rec = await this.prisma.locationRecommendation.findUnique({
      where: { id },
      include: {
        ...ADMIN_ITEM_INCLUDE,
        city: true,
        area: true,
      },
    });

    if (!rec) throw new NotFoundException(`Recommendation ${id} not found`);
    if (rec.status !== RecommendationStatus.PENDING) {
      throw new ConflictException("This recommendation has already been reviewed.");
    }
    if (rec.city.deletedAt) {
      throw new BadRequestException("The submitted city has been deleted.");
    }

    const locationType =
      rec.kind === "HIGH_STREET"
        ? HubLocationType.HIGH_STREET
        : HubLocationType.LOCAL_AREA;

    if (rec.area && !(await this.areaBelongsToCity(rec.area.id, rec.cityId))) {
      throw new BadRequestException(
        `Local area '${rec.area.name}' no longer belongs to ${rec.city.name}.`,
      );
    }

    let parent: { id: string; name: string; slug: string; type: HubLocationType; fullPath: string | null };

    if (locationType === HubLocationType.HIGH_STREET) {
      const resolvedParent =
        rec.area ??
        (await this.prisma.hubLocation.findFirst({
          where: {
            parentId: rec.cityId,
            type: { in: CITY_CHILD_TYPES },
            deletedAt: null,
          },
          select: { id: true, name: true, slug: true, type: true, fullPath: true },
          orderBy: { name: "asc" },
        }));

      if (!resolvedParent) {
        throw new BadRequestException(
          `${rec.city.name} has no local area yet. Create one before approving a high street.`,
        );
      }
      parent = resolvedParent;
      if (!LOCAL_AREA_TYPES.includes(parent.type)) {
        throw new BadRequestException(
          `High streets must sit under a local area, not a ${parent.type}.`,
        );
      }
    } else {
      parent = rec.city;
    }

    // Avoid creating a duplicate if the street/area already exists in the
    // hierarchy. Link the recommendation to the existing location instead.
    const existing = await this.prisma.hubLocation.findFirst({
      where: {
        parentId: parent.id,
        name: { equals: rec.name, mode: "insensitive" },
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true, type: true, fullPath: true },
    });

    const now = new Date();
    if (existing) {
      const updated = await this.prisma.locationRecommendation.update({
        where: { id },
        data: {
          status: RecommendationStatus.APPROVED,
          reviewedAt: now,
          reviewedById: adminUserId ?? null,
          createdLocationId: existing.id,
        },
        include: ADMIN_ITEM_INCLUDE,
      });
      return {
        recommendation: this.toAdminItem(updated),
        location: existing,
        reusedExistingLocation: true,
      };
    }

    const slug = await this.uniqueSlug(this.slugify(rec.name));
    const fullPath = parent.fullPath ? `${parent.fullPath}/${slug}` : `${parent.slug}/${slug}`;

    const { updated, location } = await this.prisma.$transaction(async (tx) => {
      const createdLocation = await tx.hubLocation.create({
        data: {
          name: rec.name,
          slug,
          type: locationType,
          parentId: parent.id,
          fullPath,
          internalState: "DRAFT",
          activationStatus: "PENDING",
          isActive: true,
          // Suggested locations stay internal until an admin confirms them.
          isPublic: false,
          mapEnabled: false,
          metadata: {
            layerState: "suggested",
            source: "recommendation",
            recommendationId: rec.id,
            postcodes: rec.postcodes,
            suggestedBy: rec.suggestedBy,
            submittedByRole: rec.submittedByRole,
          },
        },
        select: { id: true, name: true, slug: true, type: true, fullPath: true, parentId: true },
      });

      const updatedRecommendation = await tx.locationRecommendation.update({
        where: { id },
        data: {
          status: RecommendationStatus.APPROVED,
          reviewedAt: now,
          reviewedById: adminUserId ?? null,
          createdLocationId: createdLocation.id,
        },
        include: ADMIN_ITEM_INCLUDE,
      });

      return { updated: updatedRecommendation, location: createdLocation };
    });

    await this.invalidateLocationCache();

    return { recommendation: this.toAdminItem(updated), location, reusedExistingLocation: false };
  }

  async reject(id: string, adminUserId?: string) {
    const rec = await this.prisma.locationRecommendation.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException(`Recommendation ${id} not found`);
    if (rec.status !== RecommendationStatus.PENDING) {
      throw new ConflictException("This recommendation has already been reviewed.");
    }

    const updated = await this.prisma.locationRecommendation.update({
      where: { id },
      data: {
        status: RecommendationStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: adminUserId ?? null,
      },
      include: ADMIN_ITEM_INCLUDE,
    });

    return this.toAdminItem(updated);
  }

  // ───────────────────────────── Helpers ─────────────────────────────

  private async findCity(ref: string) {
    return this.prisma.hubLocation.findFirst({
      where: {
        OR: [{ id: ref }, { slug: ref }],
        type: HubLocationType.CITY,
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true, type: true, fullPath: true },
    });
  }

  private async resolveCity(ref: string) {
    const city = await this.findCity(ref);
    if (!city) {
      throw new BadRequestException(`City '${ref}' not found.`);
    }
    return city;
  }

  private async resolveArea(ref: string) {
    const area = await this.prisma.hubLocation.findFirst({
      where: {
        OR: [{ id: ref }, { slug: ref }],
        type: { in: CITY_CHILD_TYPES },
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true, type: true, parentId: true, fullPath: true },
    });
    if (!area) {
      throw new BadRequestException(`Local area '${ref}' not found.`);
    }
    return area;
  }

  private async areaBelongsToCity(areaId: string, cityId: string) {
    let cursor: string | null = areaId;
    for (let depth = 0; cursor && depth < 10; depth += 1) {
      if (cursor === cityId) return true;
      const node: { parentId: string | null } | null = await this.prisma.hubLocation.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = node?.parentId ?? null;
    }
    return false;
  }

  private slugify(value: string) {
    return (
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "location"
    );
  }

  /** Slugs are unique across live and soft-deleted locations. */
  private async uniqueSlug(base: string) {
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.hubLocation.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private buildCounts(
    grouped: Array<{ status: RecommendationStatus; _count: { _all: number } }>,
  ) {
    const counts = { pending: 0, approved: 0, rejected: 0, total: 0 };
    for (const row of grouped) {
      const key = row.status.toLowerCase() as "pending" | "approved" | "rejected";
      counts[key] = row._count._all;
      counts.total += row._count._all;
    }
    return counts;
  }

  private toAdminItem(rec: RecommendationWithRelations) {
    return {
      id: rec.id,
      kind: rec.kind === "HIGH_STREET" ? "high_street" : "local_area",
      name: rec.name,
      slug: rec.slug,
      citySlug: rec.city.slug,
      cityName: rec.city.name,
      areaSlug: rec.area?.slug ?? "",
      areaName: rec.area?.name ?? "",
      postcodes: rec.postcodes ?? [],
      suggestedBy: rec.suggestedBy ?? "",
      submittedByRole: rec.submittedByRole,
      note: rec.note ?? "",
      status: rec.status.toLowerCase() as "pending" | "approved" | "rejected",
      createdAt: rec.createdAt.toISOString(),
      reviewedAt: rec.reviewedAt?.toISOString(),
      createdLocationId: rec.createdLocationId,
    };
  }

  /** Public projection — never exposes recommender identity or admin notes. */
  private toPublicItem(rec: RecommendationWithRelations) {
    return {
      id: rec.id,
      kind: rec.kind === "HIGH_STREET" ? "high_street" : "local_area",
      name: rec.name,
      citySlug: rec.city.slug,
      cityName: rec.city.name,
      areaSlug: rec.area?.slug ?? "",
      areaName: rec.area?.name ?? "",
      postcodes: rec.postcodes ?? [],
      status: rec.status.toLowerCase() as "pending" | "approved" | "rejected",
      createdAt: rec.createdAt.toISOString(),
    };
  }

  private async invalidateLocationCache() {
    try {
      await this.redis.del(
        "admin:locations:tree",
        "hub:location:tree",
        "hub:cities:all",
        "hub:summary:national",
      );
    } catch (err: any) {
      this.logger.warn(`Failed to invalidate locations cache: ${err.message}`);
    }
  }
}
