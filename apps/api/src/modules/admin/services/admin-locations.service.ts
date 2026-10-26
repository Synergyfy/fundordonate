import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, HubLocationType } from "@prisma/client";
import {
  CreateLocationDto,
  LocationQueryDto,
  UpdateLocationDto,
  UpdateRollupConfigDto,
} from "../dto/location.dto";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import Redis from "ioredis";

@Injectable()
export class AdminLocationsService {
  private readonly logger = new Logger(AdminLocationsService.name);

  /**
   * Valid parent/child combinations from the UK Hub hierarchy. Kept intentionally
   * flexible (local areas and high streets can sit at multiple levels) while
   * still rejecting nonsensical relationships such as HIGH_STREET → NATIONAL.
   */
  private static readonly ALLOWED_PARENTS: Record<HubLocationType, HubLocationType[]> = {
    NATIONAL: [],
    CITY: [HubLocationType.NATIONAL],
    BOROUGH: [HubLocationType.CITY],
    DISTRICT: [HubLocationType.CITY],
    LOCAL_AREA: [HubLocationType.CITY, HubLocationType.BOROUGH, HubLocationType.DISTRICT],
    HIGH_STREET: [
      HubLocationType.CITY,
      HubLocationType.BOROUGH,
      HubLocationType.DISTRICT,
      HubLocationType.LOCAL_AREA,
    ],
    COMMERCIAL_AREA: [
      HubLocationType.CITY,
      HubLocationType.BOROUGH,
      HubLocationType.DISTRICT,
      HubLocationType.LOCAL_AREA,
    ],
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

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

  /**
   * Resolves the parent a location must use and validates the combination.
   * Cities without an explicit parent are attached to the National Hub.
   */
  private async resolveValidParent(
    type: HubLocationType,
    parentId: string | null | undefined,
    currentId?: string,
  ): Promise<string | null> {
    if (type === HubLocationType.NATIONAL) {
      if (parentId) {
        throw new BadRequestException("The National Hub cannot have a parent location.");
      }
      return null;
    }

    let effectiveParentId = parentId ?? null;
    if (!effectiveParentId && type === HubLocationType.CITY) {
      const national = await this.prisma.hubLocation.findFirst({
        where: { type: HubLocationType.NATIONAL },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      if (!national) {
        throw new BadRequestException(
          "A National Hub must exist before a City can be created.",
        );
      }
      effectiveParentId = national.id;
    }

    if (!effectiveParentId) {
      throw new BadRequestException(`A ${type} location must have a parent location.`);
    }

    if (currentId && effectiveParentId === currentId) {
      throw new BadRequestException("A location cannot be its own parent.");
    }

    const parent = await this.prisma.hubLocation.findUnique({
      where: { id: effectiveParentId },
      select: { id: true, type: true, parentId: true },
    });
    if (!parent) {
      throw new BadRequestException(`Parent location with ID ${effectiveParentId} does not exist`);
    }

    const allowed = AdminLocationsService.ALLOWED_PARENTS[type];
    if (!allowed.includes(parent.type)) {
      throw new BadRequestException(
        `Invalid hierarchy: ${type} cannot be a child of ${parent.type}. ` +
          `Allowed parents: ${allowed.length ? allowed.join(", ") : "none"}.`,
      );
    }

    // Guard against moving a location underneath one of its own descendants.
    if (currentId) {
      let cursor: string | null = parent.id;
      while (cursor) {
        if (cursor === currentId) {
          throw new BadRequestException("A location cannot be moved beneath one of its descendants.");
        }
        const node: { parentId: string | null } | null = await this.prisma.hubLocation.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
        cursor = node?.parentId ?? null;
      }
    }

    return effectiveParentId;
  }

  /**
   * Recomputes `fullPath` for the whole tree. Cheap at UK Hub scale and keeps
   * canonical paths consistent after slug/parent changes.
   */
  private async recomputeFullPaths() {
    const locations = await this.prisma.hubLocation.findMany({
      select: { id: true, slug: true, parentId: true, fullPath: true },
    });
    const byId = new Map(locations.map((l) => [l.id, l]));
    const pathFor = (id: string, seen = new Set<string>()): string => {
      if (seen.has(id)) return byId.get(id)?.slug ?? id;
      seen.add(id);
      const node = byId.get(id);
      if (!node) return id;
      if (!node.parentId || !byId.has(node.parentId)) return node.slug;
      return `${pathFor(node.parentId, seen)}/${node.slug}`;
    };

    const updates = locations
      .map((location) => ({ ...location, nextPath: pathFor(location.id) }))
      .filter((location) => location.fullPath !== location.nextPath);

    if (updates.length > 0) {
      await this.prisma.$transaction(
        updates.map((location) =>
          this.prisma.hubLocation.update({
            where: { id: location.id },
            data: { fullPath: location.nextPath },
          }),
        ),
      );
    }
  }

  /**
   * Retrieves a paginated list of locations with parent relation and business counts.
   */
  async getLocations(query: LocationQueryDto) {
    const { page = 1, limit = 20, type, parentId, search, includeInactive = false } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HubLocationWhereInput = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (type) {
      where.type = type;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { postcodePrefix: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.hubLocation.count({ where }),
      this.prisma.hubLocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ type: "asc" }, { name: "asc" }],
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
          _count: {
            select: {
              businesses: true,
              children: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((loc) => ({
        ...loc,
        targetAmount: Number(loc.targetAmount),
        businessCount: loc._count.businesses,
        childrenCount: loc._count.children,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Builds the entire location hierarchy tree in a single pass without N+1 queries.
   * Cached in Redis for 300 seconds.
   */
  async getLocationTree() {
    const cacheKey = "admin:locations:tree";
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    // Pull all active locations in one single DB query
    const allLocations = await this.prisma.hubLocation.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });

    const locationMap = new Map<string, any>();
    const roots: any[] = [];

    // Map all nodes
    for (const loc of allLocations) {
      locationMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        type: loc.type,
        parentId: loc.parentId,
        shortDescription: loc.shortDescription,
        postcodePrefix: loc.postcodePrefix,
        fullPath: loc.fullPath,
        internalState: loc.internalState,
        latitude: loc.latitude,
        longitude: loc.longitude,
        mapEnabled: loc.mapEnabled,
        mapZoomLevel: loc.mapZoomLevel,
        isPublic: loc.isPublic,
        statusOverride: loc.statusOverride,
        primaryImage: loc.primaryImage,
        secondaryImage: loc.secondaryImage,
        targetAmount: Number(loc.targetAmount),
        activationStatus: loc.activationStatus,
        businessCount: loc._count.businesses,
        children: [],
      });
    }

    // Build hierarchy
    for (const loc of allLocations) {
      const node = locationMap.get(loc.id);
      if (loc.parentId && locationMap.has(loc.parentId)) {
        locationMap.get(loc.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    const tree = { roots };

    try {
      await this.redis.set(cacheKey, JSON.stringify(tree), "EX", 300);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return tree;
  }

  /**
   * Retrieves single location details with parent, children, and business metrics.
   */
  async getLocation(id: string) {
    const location = await this.prisma.hubLocation.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true, type: true },
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            activationStatus: true,
            _count: { select: { businesses: true } },
          },
        },
        businesses: {
          take: 10,
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            status: true,
            membershipTier: true,
            logoUrl: true,
          },
        },
        _count: {
          select: { businesses: true, events: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return {
      ...location,
      targetAmount: Number(location.targetAmount),
      businessCount: location._count.businesses,
      eventCount: location._count.events,
    };
  }

  /**
   * Creates a new hub location in the hierarchy.
   */
  async createLocation(dto: CreateLocationDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await this.prisma.hubLocation.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Location slug '${slug}' already exists`);
    }

    if (dto.type === HubLocationType.NATIONAL) {
      const national = await this.prisma.hubLocation.findFirst({
        where: { type: HubLocationType.NATIONAL },
        select: { id: true },
      });
      if (national) {
        throw new ConflictException("A National Hub already exists.");
      }
    }

    const parentId = await this.resolveValidParent(dto.type, dto.parentId);

    const created = await this.prisma.hubLocation.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        parentId,
        internalState: dto.internalState ?? "DRAFT",
        shortDescription: dto.shortDescription,
        description: dto.description,
        heroHeadline: dto.heroHeadline,
        heroSupportingText: dto.heroSupportingText,
        postcodePrefix: dto.postcodePrefix,
        latitude: dto.latitude,
        longitude: dto.longitude,
        mapEnabled: dto.mapEnabled ?? true,
        mapZoomLevel: dto.mapZoomLevel ?? 6,
        primaryImage: dto.primaryImage,
        secondaryImage: dto.secondaryImage,
        statusOverride: dto.statusOverride,
        targetAmount: dto.targetAmount ? BigInt(dto.targetAmount) : BigInt(0),
        activationStatus: dto.activationStatus || "PENDING",
        metadata: dto.metadata ?? {},
      },
    });

    await this.recomputeFullPaths();
    await this.invalidateLocationCache();

    return {
      ...created,
      fullPath: created.fullPath ?? created.slug,
      targetAmount: Number(created.targetAmount),
    };
  }

  /**
   * Updates an existing hub location.
   */
  async updateLocation(id: string, dto: UpdateLocationDto) {
    const location = await this.prisma.hubLocation.findUnique({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== location.slug) {
      const existing = await this.prisma.hubLocation.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`Location slug '${dto.slug}' already exists`);
      }
    }

    const nextType = (dto.type ?? location.type) as HubLocationType;
    const requestedParentId =
      dto.parentId !== undefined ? (dto.parentId || null) : location.parentId;
    const nextParentId = await this.resolveValidParent(nextType, requestedParentId, id);

    const data: Prisma.HubLocationUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.internalState !== undefined) data.internalState = dto.internalState;
    if (nextParentId) {
      data.parent = { connect: { id: nextParentId } };
    } else {
      data.parent = { disconnect: true };
    }
    if (dto.shortDescription !== undefined) data.shortDescription = dto.shortDescription;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.heroHeadline !== undefined) data.heroHeadline = dto.heroHeadline;
    if (dto.heroSupportingText !== undefined) data.heroSupportingText = dto.heroSupportingText;
    if (dto.postcodePrefix !== undefined) data.postcodePrefix = dto.postcodePrefix;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.mapEnabled !== undefined) data.mapEnabled = dto.mapEnabled;
    if (dto.mapZoomLevel !== undefined) data.mapZoomLevel = dto.mapZoomLevel;
    if (dto.primaryImage !== undefined) data.primaryImage = dto.primaryImage;
    if (dto.secondaryImage !== undefined) data.secondaryImage = dto.secondaryImage;
    if (dto.statusOverride !== undefined) data.statusOverride = dto.statusOverride;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.targetAmount !== undefined) data.targetAmount = BigInt(dto.targetAmount);
    if (dto.activationStatus !== undefined) data.activationStatus = dto.activationStatus;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    const updated = await this.prisma.hubLocation.update({
      where: { id },
      data,
    });

    await this.recomputeFullPaths();
    await this.invalidateLocationCache();

    return {
      ...updated,
      targetAmount: Number(updated.targetAmount),
    };
  }

  /**
   * Toggles the active status of a hub location.
   */
  async toggleLocationStatus(id: string, isActive: boolean) {
    const location = await this.prisma.hubLocation.findUnique({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    const updated = await this.prisma.hubLocation.update({
      where: { id },
      data: { isActive },
    });

    await this.invalidateLocationCache();

    return {
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
    };
  }

  /**
   * Deletes a location if it has no child locations and no registered businesses.
   */
  async deleteLocation(id: string) {
    const location = await this.prisma.hubLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: { children: true, businesses: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    if (location.type === HubLocationType.NATIONAL) {
      throw new BadRequestException("The National Hub cannot be deleted.");
    }

    if (location._count.children > 0) {
      throw new BadRequestException("Cannot delete location with child locations. Deactivate it instead.");
    }

    if (location._count.businesses > 0) {
      throw new BadRequestException("Cannot delete location with assigned businesses. Reassign or deactivate it instead.");
    }

    await this.prisma.hubLocation.delete({ where: { id } });
    await this.recomputeFullPaths();
    await this.invalidateLocationCache();

    return { success: true, deletedId: id };
  }

  /**
   * Retrieves roll-up configuration settings.
   */
  async getRollupConfig() {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: "locations_rollup_config" },
    });

    return (
      setting?.value ?? {
        nationalTargetMultiplier: 1.0,
        cityDefaultWeight: 0.5,
        localAreaWeight: 0.3,
        highStreetWeight: 0.2,
      }
    );
  }

  /**
   * Updates roll-up configuration settings.
   */
  async updateRollupConfig(dto: UpdateRollupConfigDto) {
    const updated = await this.prisma.platformSetting.upsert({
      where: { key: "locations_rollup_config" },
      update: { value: dto.config },
      create: {
        key: "locations_rollup_config",
        value: dto.config,
        category: "general",
        description: "Target roll-up weights and configuration across tiers",
      },
    });

    return updated.value;
  }

  /**
   * Computes (without persisting) the projected roll-up for every city from its
   * live active campaigns. Returns the per-city current vs projected raised and
   * any activation status change.
   */
  async previewRollup() {
    const [cities, locations, campaigns] = await Promise.all([
      this.prisma.hubLocation.findMany({
        where: { type: HubLocationType.CITY },
        orderBy: { name: "asc" },
        select: { id: true, name: true, targetAmount: true, activationStatus: true },
      }),
      this.prisma.hubLocation.findMany({ select: { id: true, parentId: true, type: true } }),
      this.prisma.businessCampaign.findMany({
        where: { status: "ACTIVE", business: { status: "ACTIVE" } },
        select: {
          raisedAmount: true,
          business: { select: { locationId: true } },
          locations: {
            where: { scope: "PRIMARY" },
            select: { locationId: true },
            take: 1,
          },
        },
      }),
    ]);

    // Walk a campaign's primary (or legacy business) location up to its city.
    const locationById = new Map(locations.map((l) => [l.id, l]));
    const cityOf = (locationId: string | null): string | null => {
      let current = locationId;
      while (current) {
        const loc = locationById.get(current);
        if (!loc) return null;
        if (loc.type === HubLocationType.CITY) return loc.id;
        current = loc.parentId;
      }
      return null;
    };

    const raisedByCity = new Map<string, number>();
    for (const campaign of campaigns) {
      const locationId =
        campaign.locations[0]?.locationId ?? campaign.business?.locationId ?? null;
      const cityId = cityOf(locationId);
      if (!cityId) continue;
      raisedByCity.set(cityId, (raisedByCity.get(cityId) ?? 0) + campaign.raisedAmount);
    }

    const locationsView = cities.map((city) => {
      const currentRaised = raisedByCity.get(city.id) ?? 0;
      const target = Number(city.targetAmount) || 0;
      const projectedRaised = currentRaised;
      const pct = target > 0 ? Math.round((projectedRaised / target) * 100) : 0;
      const currentStatus = (city.activationStatus || "PENDING").toUpperCase();
      const projectedStatus =
        pct >= 100 ? "ACTIVATED" : pct >= 50 ? "IN_PROGRESS" : "PENDING";
      return {
        id: city.id,
        name: city.name,
        currentRaised,
        projectedRaised,
        statusChange:
          projectedStatus !== currentStatus
            ? `${currentStatus} → ${projectedStatus}`
            : null,
      };
    });

    return {
      locations: locationsView,
      totalProjected: locationsView.reduce((s, l) => s + l.projectedRaised, 0),
    };
  }

  /**
   * Recomputes and persists the activation progress for every city from live
   * campaign totals (safety net / manual trigger for the roll-up job).
   */
  async runRollup() {
    const preview = await this.previewRollup();
    const cities = await this.prisma.hubLocation.findMany({
      where: { type: HubLocationType.CITY },
      select: { id: true, targetAmount: true, metadata: true },
    });

    let updated = 0;
    for (const city of cities) {
      const target = Number(city.targetAmount) || 0;
      const entry = preview.locations.find((l) => l.id === city.id);
      const raised = entry?.projectedRaised ?? 0;
      const activationProgress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

      await this.prisma.hubLocation.update({
        where: { id: city.id },
        data: {
          metadata: {
            ...((city.metadata as Record<string, unknown>) ?? {}),
            activationProgress,
            lastRolledUpAt: new Date().toISOString(),
          },
        },
      });
      updated++;
    }

    await this.invalidateLocationCache();

    return {
      success: true,
      message: `Roll-up complete — recomputed ${updated} cities.`,
      citiesUpdated: updated,
    };
  }
}
