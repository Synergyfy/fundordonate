import { Injectable, NotFoundException, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { HubLocationType, BusinessCampaignStatus, ContributionStatus, Prisma } from "@prisma/client";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import Redis from "ioredis";

export interface NationalHubSummaryDto {
  totalCities: number;
  active: number;
  makingProgress: number;
  needsActivation: number;
  totalFundingTarget: number;
  totalFundingRaised: number;
  totalBusinesses: number;
  totalCampaigns: number;
  totalFoundingBusiness: number;
  totalFoundingConsumer: number;
  totalBackers: number;
}

export interface CityHubItemDto {
  id: string;
  name: string;
  slug: string;
  fullPath?: string | null;
  region: string;
  status: "active" | "making_progress" | "needs_activation";
  activationProgress: number;
  fundingTarget: number;
  fundingRaised: number;
  localAreas: number;
  highStreets: number;
  businesses: number;
  campaigns: number;
  mapX: number;
  mapY: number;
  latitude?: number | null;
  longitude?: number | null;
  mapEnabled?: boolean;
  mapZoomLevel?: number | null;
  isPublic?: boolean;
  imageOne?: string | null;
  imageTwo?: string | null;
  shortDescription: string;
  heroHeadline: string | null;
  postcodePrefix: string | null;
  activity: string[];
}

@Injectable()
export class HubService {
  private readonly logger = new Logger(HubService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Resolves the effective public status. Admin overrides win; otherwise the
   * internal activation status is mapped onto the three public states.
   */
  private resolvePublicStatus(
    activationStatus?: string | null,
    statusOverride?: string | null,
  ): "active" | "making_progress" | "needs_activation" {
    const value = (statusOverride || activationStatus || "").toUpperCase();
    if (value === "ACTIVE" || value === "ACTIVATED") return "active";
    if (
      value === "MAKING_PROGRESS" ||
      value === "IN_PROGRESS" ||
      value === "PREPARING" ||
      value === "LAUNCHING"
    ) {
      return "making_progress";
    }
    return "needs_activation";
  }

  private progressFor(raised: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((raised / target) * 100));
  }

  /**
   * Single source of truth for UK Hub roll-ups.
   *
   * A campaign belongs to its PRIMARY CampaignLocation (falling back to the
   * business's HubLocation for legacy rows). We walk that location up to its
   * City so high-street activity contributes exactly once to its city (and
   * therefore to the national total).
   */
  private async buildCityAggregates() {
    const [locations, businesses, campaigns, memberships] = await Promise.all([
      this.prisma.hubLocation.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          parentId: true,
          fullPath: true,
          isPublic: true,
          activationStatus: true,
          statusOverride: true,
          targetAmount: true,
          metadata: true,
          latitude: true,
          longitude: true,
          mapEnabled: true,
          mapZoomLevel: true,
          shortDescription: true,
          heroHeadline: true,
          postcodePrefix: true,
          primaryImage: true,
          secondaryImage: true,
        },
      }),
      this.prisma.business.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, locationId: true },
      }),
      this.prisma.businessCampaign.findMany({
        where: { status: BusinessCampaignStatus.ACTIVE },
        select: {
          id: true,
          raisedAmount: true,
          targetAmount: true,
          business: { select: { locationId: true } },
          locations: {
            where: { scope: "PRIMARY" },
            select: { locationId: true },
            take: 1,
          },
        },
      }),
      this.prisma.foundingMembership.findMany({
        where: { status: "ACTIVE" },
        select: {
          programme: { select: { audience: true, locationId: true } },
        },
      }),
    ]);

    const locationById = new Map(locations.map((location) => [location.id, location]));
    const cityCache = new Map<string, (typeof locations)[number] | null>();
    const cityOf = (locationId: string | null): (typeof locations)[number] | null => {
      if (!locationId) return null;
      if (cityCache.has(locationId)) return cityCache.get(locationId) ?? null;
      let current = locationById.get(locationId);
      let found: (typeof locations)[number] | null = null;
      const seen = new Set<string>();
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        if (current.type === HubLocationType.CITY) {
          found = current;
          break;
        }
        current = current.parentId ? locationById.get(current.parentId) : undefined;
      }
      cityCache.set(locationId, found);
      return found;
    };

    const cityLocations = locations
      .filter((location) => location.type === HubLocationType.CITY)
      .filter((location) => location.isPublic !== false)
      .sort((a, b) => a.name.localeCompare(b.name));

    type Aggregate = {
      city: (typeof locations)[number];
      raised: number;
      targetFromCampaigns: number;
      campaigns: number;
      businesses: number;
      localAreas: number;
      highStreets: number;
      foundingBusiness: number;
      foundingConsumer: number;
      backers: Set<string>;
      campaignIds: Set<string>;
    };

    const aggregates = new Map<string, Aggregate>();
    for (const city of cityLocations) {
      aggregates.set(city.id, {
        city,
        raised: 0,
        targetFromCampaigns: 0,
        campaigns: 0,
        businesses: 0,
        localAreas: 0,
        highStreets: 0,
        foundingBusiness: 0,
        foundingConsumer: 0,
        backers: new Set(),
        campaignIds: new Set(),
      });
    }

    // Count descendants once, per city.
    for (const location of locations) {
      if (location.type === HubLocationType.CITY) continue;
      const city = cityOf(location.id);
      if (!city) continue;
      const aggregate = aggregates.get(city.id);
      if (!aggregate) continue;
      if (
        location.type === HubLocationType.BOROUGH ||
        location.type === HubLocationType.DISTRICT ||
        location.type === HubLocationType.LOCAL_AREA
      ) {
        aggregate.localAreas += 1;
      } else if (
        location.type === HubLocationType.HIGH_STREET ||
        location.type === HubLocationType.COMMERCIAL_AREA
      ) {
        aggregate.highStreets += 1;
      }
    }

    // Business participation follows the business's registered location.
    for (const business of businesses) {
      const city = cityOf(business.locationId);
      if (!city) continue;
      const aggregate = aggregates.get(city.id);
      if (aggregate) aggregate.businesses += 1;
    }

    // Financial attribution follows the campaign's PRIMARY location (falling
    // back to the business location for legacy campaigns without a link).
    for (const campaign of campaigns) {
      const primaryLocationId =
        campaign.locations[0]?.locationId ?? campaign.business?.locationId ?? null;
      const city = cityOf(primaryLocationId);
      if (!city) continue;
      const aggregate = aggregates.get(city.id);
      if (!aggregate) continue;
      aggregate.campaigns += 1;
      aggregate.raised += campaign.raisedAmount;
      aggregate.targetFromCampaigns += campaign.targetAmount;
      aggregate.campaignIds.add(campaign.id);
    }

    // Founding participation belongs to the programme's location.
    for (const membership of memberships) {
      const city = cityOf(membership.programme?.locationId ?? null);
      if (!city) continue;
      const aggregate = aggregates.get(city.id);
      if (!aggregate) continue;
      if (membership.programme?.audience === "BUSINESS") aggregate.foundingBusiness += 1;
      else aggregate.foundingConsumer += 1;
    }

    // Distinct backers per city from completed contributions.
    const campaignToCity = new Map<string, string>();
    for (const aggregate of aggregates.values()) {
      for (const id of aggregate.campaignIds) campaignToCity.set(id, aggregate.city.id);
    }
    if (campaignToCity.size > 0) {
      const contributions = await this.prisma.contribution.findMany({
        where: {
          campaignId: { in: [...campaignToCity.keys()] },
          status: ContributionStatus.COMPLETED,
          backerId: { not: null },
        },
        select: { campaignId: true, backerId: true },
      });
      for (const contribution of contributions) {
        const cityId = campaignToCity.get(contribution.campaignId);
        if (!cityId || !contribution.backerId) continue;
        aggregates.get(cityId)?.backers.add(contribution.backerId);
      }
    }

    return [...aggregates.values()];
  }

  /**
   * Aggregates live nationwide metrics for the National Hub Overview page.
   */
  async getNationalSummary(): Promise<NationalHubSummaryDto> {
    const cacheKey = "hub:summary:national";
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    const aggregates = await this.buildCityAggregates();

    let active = 0;
    let makingProgress = 0;
    let needsActivation = 0;

    for (const aggregate of aggregates) {
      const status = this.resolvePublicStatus(
        aggregate.city.activationStatus,
        aggregate.city.statusOverride,
      );
      if (status === "active") active++;
      else if (status === "making_progress") makingProgress++;
      else needsActivation++;
    }

    const summary: NationalHubSummaryDto = {
      totalCities: aggregates.length,
      active,
      makingProgress,
      needsActivation,
      totalFundingTarget: aggregates.reduce(
        (sum, aggregate) => sum + (Number(aggregate.city.targetAmount) || 0),
        0,
      ),
      totalFundingRaised: aggregates.reduce((sum, aggregate) => sum + aggregate.raised, 0),
      totalBusinesses: aggregates.reduce((sum, aggregate) => sum + aggregate.businesses, 0),
      totalCampaigns: aggregates.reduce((sum, aggregate) => sum + aggregate.campaigns, 0),
      totalFoundingBusiness: aggregates.reduce(
        (sum, aggregate) => sum + aggregate.foundingBusiness,
        0,
      ),
      totalFoundingConsumer: aggregates.reduce(
        (sum, aggregate) => sum + aggregate.foundingConsumer,
        0,
      ),
      totalBackers: aggregates.reduce((sum, aggregate) => sum + aggregate.backers.size, 0),
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(summary), "EX", 300);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return summary;
  }

  /**
   * Retrieves all live cities with computed activation progress, funding, and geo coordinates.
   */
  async getCities(): Promise<CityHubItemDto[]> {
    const cacheKey = "hub:cities:all";
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    const aggregates = await this.buildCityAggregates();

    const result = aggregates.map(({ city: c, ...aggregate }) => {
      const meta = (c.metadata as Record<string, any>) || {};
      const target =
        Number(c.targetAmount) || aggregate.targetFromCampaigns || 0;
      const status = this.resolvePublicStatus(c.activationStatus, c.statusOverride);
      const progress = this.progressFor(aggregate.raised, target);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        fullPath: c.fullPath ?? c.slug,
        region: meta.region || "United Kingdom",
        status,
        activationProgress: progress,
        fundingTarget: target,
        fundingRaised: aggregate.raised,
        localAreas: aggregate.localAreas,
        highStreets: aggregate.highStreets,
        businesses: aggregate.businesses,
        campaigns: aggregate.campaigns,
        mapX: meta.mapX ?? (c.longitude ? Math.round(((c.longitude + 5) / 7) * 100) : 50),
        mapY: meta.mapY ?? (c.latitude ? Math.round(((58 - c.latitude) / 8) * 100) : 50),
        latitude: c.latitude,
        longitude: c.longitude,
        mapEnabled: c.mapEnabled,
        mapZoomLevel: c.mapZoomLevel,
        isPublic: c.isPublic,
        imageOne: c.primaryImage,
        imageTwo: c.secondaryImage,
        shortDescription:
          c.shortDescription ||
          `Local Hub for ${c.name} connecting High Streets, businesses and residents to the National Hub Community.`,
        heroHeadline: c.heroHeadline,
        postcodePrefix: c.postcodePrefix,
        activity: meta.activity || [
          `Local Hub development active in ${c.name}`,
          "Community campaigns and business participation building",
        ],
      };
    });

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), "EX", 300);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return result;
  }

  /**
   * Retrieves full city hub breakdown with its hierarchy tree.
   */
  async getCityBySlug(slug: string) {
    const city = await this.prisma.hubLocation.findFirst({
      where: {
        slug,
        type: HubLocationType.CITY,
        isActive: true,
        isPublic: true,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
            },
          },
        },
        businesses: {
          where: { status: "ACTIVE" },
          include: {
            campaigns: {
              where: { status: BusinessCampaignStatus.ACTIVE },
            },
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`City with slug '${slug}' not found`);
    }

    return city;
  }

  /**
   * Returns recursive location tree for interactive map and location pickers.
   */
  async getLocationTree() {
    const cacheKey = "hub:location:tree";
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    const roots = await this.prisma.hubLocation.findMany({
      where: { parentId: null, isActive: true, isPublic: true },
      include: {
        children: {
          where: { isActive: true, isPublic: true },
          include: {
            children: {
              where: { isActive: true, isPublic: true },
              include: {
                children: {
                  where: { isActive: true, isPublic: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    try {
      await this.redis.set(cacheKey, JSON.stringify(roots), "EX", 600);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return roots;
  }

  /**
   * Resolves a canonical public hub path (e.g. `manchester/northern-quarter/oldham-street`)
   * against `HubLocation.fullPath`. Supports paths with or without the
   * `united-kingdom` prefix and returns the location, ancestors, children and
   * live stats in one projection for the public hub page.
   */
  async resolveLocationPath(rawPath: string) {
    const clean = decodeURIComponent(rawPath || "")
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .join("/");
    if (!clean) {
      throw new NotFoundException("Location path is required");
    }

    const withoutRoutePrefix = clean.replace(/^uk-hub-activation\//, "");
    const candidates = new Set<string>([withoutRoutePrefix]);
    if (!withoutRoutePrefix.startsWith("united-kingdom/")) {
      candidates.add(`united-kingdom/${withoutRoutePrefix}`);
    }
    if (withoutRoutePrefix !== clean) {
      candidates.add(clean);
    }

    const locationSelect = {
      id: true,
      name: true,
      slug: true,
      type: true,
      parentId: true,
      fullPath: true,
      shortDescription: true,
      description: true,
      heroHeadline: true,
      heroSupportingText: true,
      postcodePrefix: true,
      latitude: true,
      longitude: true,
      isActive: true,
      isPublic: true,
      activationStatus: true,
      statusOverride: true,
      targetAmount: true,
      metadata: true,
      mapEnabled: true,
      mapZoomLevel: true,
      primaryImage: true,
      secondaryImage: true,
    } as const;

    let location = await this.prisma.hubLocation.findFirst({
      where: {
        fullPath: { in: [...candidates] },
        isActive: true,
        isPublic: true,
      },
      select: locationSelect,
    });

    if (!location) {
      const lastSegment = withoutRoutePrefix.split("/").filter(Boolean).pop();
      if (lastSegment) {
        location = await this.prisma.hubLocation.findFirst({
          where: { slug: lastSegment, isActive: true, isPublic: true },
          select: locationSelect,
        });
      }
    }

    if (!location) {
      throw new NotFoundException(`Location path '${rawPath}' not found`);
    }

    // Ancestors, nearest first.
    const ancestors: Array<{
      id: string;
      name: string;
      slug: string;
      type: HubLocationType;
      fullPath: string | null;
    }> = [];
    let parentId = location.parentId;
    let guard = 0;
    while (parentId && guard < 12) {
      const parent = await this.prisma.hubLocation.findUnique({
        where: { id: parentId },
        select: { id: true, name: true, slug: true, type: true, fullPath: true, parentId: true },
      });
      if (!parent) break;
      ancestors.unshift({
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        type: parent.type,
        fullPath: parent.fullPath,
      });
      parentId = parent.parentId;
      guard += 1;
    }

    const children = await this.prisma.hubLocation.findMany({
      where: { parentId: location.id, isActive: true, isPublic: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        fullPath: true,
        shortDescription: true,
        description: true,
        activationStatus: true,
        statusOverride: true,
        targetAmount: true,
        latitude: true,
        longitude: true,
        mapEnabled: true,
        primaryImage: true,
        secondaryImage: true,
      },
    });

    const stats = await this.getLocationStats(location.id);

    // Scope the business count to the location's whole subtree.
    const allLocations = await this.prisma.hubLocation.findMany({
      select: { id: true, parentId: true, type: true },
    });
    const childIds = new Map<string, string[]>();
    for (const item of allLocations) {
      if (!item.parentId) continue;
      const list = childIds.get(item.parentId) ?? [];
      list.push(item.id);
      childIds.set(item.parentId, list);
    }
    const scopeIds: string[] = [];
    const queue = [location.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (scopeIds.includes(id)) continue;
      scopeIds.push(id);
      queue.push(...(childIds.get(id) ?? []));
    }
    const businessCount = await this.prisma.business.count({
      where: { locationId: { in: scopeIds }, status: "ACTIVE" },
    });

    const publicStatus = this.resolvePublicStatus(
      location.activationStatus,
      location.statusOverride,
    );
    const targetAmount = Number(location.targetAmount) || stats.fundingTarget || 0;
    const activationProgress =
      stats.activationProgress ||
      (targetAmount > 0
        ? Math.min(100, Math.round((stats.fundingRaised / targetAmount) * 100))
        : 0);

    return {
      location: {
        ...location,
        targetAmount,
        fundingTarget: targetAmount,
        fundingRaised: stats.fundingRaised,
        activationProgress,
        publicStatus,
        status: publicStatus,
        businessCount,
        campaignCount: stats.campaignCount,
        totalBackers: stats.totalBackers,
        foundingBusiness: stats.foundingBusiness,
        foundingConsumer: stats.foundingConsumer,
        childCounts: {
          localAreas: scopeIds
            .map((id) => allLocations.find((item) => item.id === id))
            .filter(
              (item) =>
                item?.type === HubLocationType.BOROUGH ||
                item?.type === HubLocationType.DISTRICT ||
                item?.type === HubLocationType.LOCAL_AREA,
            ).length,
          highStreets: scopeIds
            .map((id) => allLocations.find((item) => item.id === id))
            .filter(
              (item) =>
                item?.type === HubLocationType.HIGH_STREET ||
                item?.type === HubLocationType.COMMERCIAL_AREA,
            ).length,
        },
      },
      ancestors,
      children,
      stats,
    };
  }

  async getLocations(query?: { type?: string; parentId?: string; search?: string }) {
    const where: Prisma.HubLocationWhereInput = { isActive: true, isPublic: true };
    if (query?.type) where.type = query.type as HubLocationType;
    if (query?.parentId) where.parentId = query.parentId;
    if (query?.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }
    const locations = await this.prisma.hubLocation.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return { locations };
  }

  async getSeasons(status?: string) {
    const where: Prisma.SeasonWhereInput = {};
    if (status) {
      where.status = status;
    }
    const items = await this.prisma.season.findMany({
      where,
      orderBy: { startDate: "desc" },
    });
    return {
      seasons: items.map((s) => ({
        ...s,
        overallTarget: Number(s.overallTarget),
        nationalTarget: Number(s.nationalTarget),
        cityTargetDefault: Number(s.cityTargetDefault),
        localAreaTargetDefault: Number(s.localAreaTargetDefault),
        highStreetTargetDefault: Number(s.highStreetTargetDefault),
        businessCampaignTargetDefault: Number(s.businessCampaignTargetDefault),
        totalRaised: Number(s.totalRaised),
      })),
      total: items.length,
    };
  }

  async getCurrentSeason() {
    const season =
      (await this.prisma.season.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      })) ||
      (await this.prisma.season.findFirst({
        where: { status: "SCHEDULED" },
        orderBy: { startDate: "asc" },
      })) ||
      (await this.prisma.season.findFirst({
        orderBy: { startDate: "desc" },
      }));

    if (!season) return null;
    return {
      ...season,
      overallTarget: Number(season.overallTarget),
      nationalTarget: Number(season.nationalTarget),
      cityTargetDefault: Number(season.cityTargetDefault),
      localAreaTargetDefault: Number(season.localAreaTargetDefault),
      highStreetTargetDefault: Number(season.highStreetTargetDefault),
      businessCampaignTargetDefault: Number(season.businessCampaignTargetDefault),
      totalRaised: Number(season.totalRaised),
    };
  }

  async getSeasonById(id: string) {
    const season = await this.prisma.season.findUnique({
      where: { id },
    });
    if (!season) return null;
    return {
      ...season,
      overallTarget: Number(season.overallTarget),
      nationalTarget: Number(season.nationalTarget),
      cityTargetDefault: Number(season.cityTargetDefault),
      localAreaTargetDefault: Number(season.localAreaTargetDefault),
      highStreetTargetDefault: Number(season.highStreetTargetDefault),
      businessCampaignTargetDefault: Number(season.businessCampaignTargetDefault),
      totalRaised: Number(season.totalRaised),
    };
  }

  async getSeasonMetrics(seasonId: string) {    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
    });
    if (!season) return null;
    const overallTarget = Number(season.overallTarget);
    const totalRaised = Number(season.totalRaised);
    return {
      seasonId,
      overallTarget,
      totalRaised,
      progressPercent: overallTarget > 0 ? Math.round((totalRaised / overallTarget) * 100) : 0,
      remainingAmount: Math.max(0, overallTarget - totalRaised),
      citiesActive: 4,
      citiesTargeted: 5,
      localAreasActive: 8,
      highStreetsActive: 12,
      businessesActive: 45,
      totalParticipants: season.totalParticipants,
      consumers: 0,
      businessOwners: 0,
      backers: 0,
      foundingMembers: 0,
      totalCampaigns: season.activeCampaigns,
      activeCampaigns: season.activeCampaigns,
      completedCampaigns: 0,
      campaignsTargetReached: 0,
      rewardsIssued: 0,
      leaderboardActive: 0,
    };
  }

  /**
   * Live aggregates for a single location (city, local area, or high street),
   * including direct-child roll-up. Used by the hub progress panels.
   */
  async getLocationStats(locationId: string) {
    const location = await this.prisma.hubLocation.findUnique({
      where: { id: locationId },
      include: {
        parent: true,
        children: { include: { children: true } },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }

    // Map every location in the sub-tree back to its direct child of `location`
    // so we can roll contributions up per child (local area / high street).
    const childOf = new Map<string, string>();
    const scopeIds: string[] = [location.id];
    childOf.set(location.id, location.id);
    for (const child of location.children) {
      scopeIds.push(child.id);
      childOf.set(child.id, child.id);
      for (const grand of child.children) {
        scopeIds.push(grand.id);
        childOf.set(grand.id, child.id);
      }
    }

    const campaigns = await this.prisma.businessCampaign.findMany({
      where: {
        status: BusinessCampaignStatus.ACTIVE,
        business: { status: "ACTIVE" },
        OR: [
          {
            locations: {
              some: {
                locationId: { in: scopeIds },
                scope: "PRIMARY",
              },
            },
          },
          {
            locations: { none: {} },
            business: { locationId: { in: scopeIds } },
          },
        ],
      },
      select: {
        id: true,
        raisedAmount: true,
        targetAmount: true,
        business: { select: { locationId: true } },
        locations: {
          where: { scope: "PRIMARY" },
          select: { locationId: true },
          take: 1,
        },
        template: { select: { origin: true } },
      },
    });

    const campaignMeta = new Map<
      string,
      { origin: string; locationId: string; raised: number; childId: string }
    >();
    const childAgg = new Map<
      string,
      { raised: number; campaigns: number; backers: Set<string> }
    >();

    const ensureChild = (childId: string) => {
      if (!childAgg.has(childId)) {
        childAgg.set(childId, { raised: 0, campaigns: 0, backers: new Set() });
      }
      return childAgg.get(childId)!;
    };

    let fundingRaised = 0;
    let targetFromCampaigns = 0;
    for (const campaign of campaigns) {
      const locId =
        campaign.locations[0]?.locationId ??
        campaign.business?.locationId ??
        location.id;
      const childId = childOf.get(locId) ?? location.id;
      const origin = campaign.template?.origin ?? "DIRECT";
      campaignMeta.set(campaign.id, {
        origin,
        locationId: locId,
        raised: campaign.raisedAmount,
        childId,
      });
      fundingRaised += campaign.raisedAmount;
      targetFromCampaigns += campaign.targetAmount;
      const agg = ensureChild(childId);
      agg.raised += campaign.raisedAmount;
      agg.campaigns += 1;
    }

    const campaignIds = [...campaignMeta.keys()];
    const contributions = campaignIds.length
      ? await this.prisma.contribution.findMany({
          where: { campaignId: { in: campaignIds }, status: ContributionStatus.COMPLETED },
          select: { amount: true, backerId: true, campaignId: true },
        })
      : [];

    const backers = new Set<string>();
    let totalDonations = 0;
    let totalPledges = 0;
    let fundAmount = 0;
    let donateAmount = 0;

    for (const c of contributions) {
      const meta = campaignMeta.get(c.campaignId);
      if (!meta) continue;
      if (c.backerId) {
        backers.add(c.backerId);
        ensureChild(meta.childId).backers.add(c.backerId);
      }
      if (meta.origin === "AUDIT") {
        totalPledges += 1;
        fundAmount += c.amount;
      } else {
        totalDonations += 1;
        donateAmount += c.amount;
      }
    }

    const fundingTarget = Number(location.targetAmount) || targetFromCampaigns;
    const activationProgress =
      fundingTarget > 0 ? Math.min(100, Math.round((fundingRaised / fundingTarget) * 100)) : 0;

    const programmes = await this.prisma.foundingProgramme.findMany({
      where: { locationId: location.id, status: { not: "ARCHIVED" } },
      select: { audience: true, totalAllocation: true, allocatedCount: true },
    });
    const businessProgrammes = programmes.filter((programme) => programme.audience === "BUSINESS");
    const consumerProgrammes = programmes.filter((programme) => programme.audience === "CONSUMER");
    const summariseProgrammes = (items: typeof programmes) => ({
      total: items.reduce((sum, programme) => sum + programme.totalAllocation, 0),
      allocated: items.reduce((sum, programme) => sum + programme.allocatedCount, 0),
    });
    const businessSummary = summariseProgrammes(businessProgrammes);
    const consumerSummary = summariseProgrammes(consumerProgrammes);

    const childType = (type: string) => {
      if (type === HubLocationType.CITY) return "city";
      if (type === HubLocationType.HIGH_STREET) return "high_street";
      if (type === HubLocationType.COMMERCIAL_AREA) return "commercial_area";
      if (type === HubLocationType.DISTRICT) return "district";
      if (type === HubLocationType.BOROUGH) return "borough";
      return "local_area";
    };

    const childContributions = location.children.map((child) => {
      const agg = childAgg.get(child.id);
      return {
        childId: child.id,
        childName: child.name,
        childType: childType(child.type),
        raised: agg?.raised ?? 0,
        campaigns: agg?.campaigns ?? 0,
        backers: agg?.backers.size ?? 0,
      };
    });

    const hierarchyLevel =
      location.type === HubLocationType.NATIONAL
        ? "national"
        : location.type === HubLocationType.CITY
          ? "city"
          : location.type === HubLocationType.HIGH_STREET
            ? "high_street"
            : location.type === HubLocationType.COMMERCIAL_AREA
              ? "commercial_area"
              : location.type === HubLocationType.DISTRICT
                ? "district"
                : location.type === HubLocationType.LOCAL_AREA
                  ? "local_area"
                  : "borough";

    return {
      locationId: location.id,
      locationName: location.name,
      locationType: location.type,
      hierarchyLevel,
      fundingRaised,
      fundingTarget,
      activationProgress,
      campaignCount: campaignIds.length,
      totalDonations,
      totalPledges,
      totalBackers: backers.size,
      foundingBusiness: {
        total: businessSummary.total,
        allocated: businessSummary.allocated,
        remaining: Math.max(0, businessSummary.total - businessSummary.allocated),
        status: location.activationStatus || "PENDING",
      },
      foundingConsumer: {
        total: consumerSummary.total,
        allocated: consumerSummary.allocated,
        remaining: Math.max(0, consumerSummary.total - consumerSummary.allocated),
        status: location.activationStatus || "PENDING",
      },
      childContributions,
      contributionBreakdown: {
        fund: fundAmount,
        donate: donateAmount,
        founding: 0,
      },
      parentBoroughName: location.parent?.name ?? undefined,
      parentBoroughSlug: location.parent?.slug ?? undefined,
    };
  }
}
