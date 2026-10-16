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
}

export interface CityHubItemDto {
  id: string;
  name: string;
  slug: string;
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

    const [cities, businessesCount, campaignsAgg] = await Promise.all([
      this.prisma.hubLocation.findMany({
        where: { type: HubLocationType.CITY, isActive: true },
        select: {
          id: true,
          activationStatus: true,
          targetAmount: true,
          businesses: {
            select: {
              campaigns: {
                where: { status: BusinessCampaignStatus.ACTIVE },
                select: { raisedAmount: true, targetAmount: true },
              },
            },
          },
        },
      }),
      this.prisma.business.count({ where: { status: "ACTIVE" } }),
      this.prisma.businessCampaign.aggregate({
        where: { status: BusinessCampaignStatus.ACTIVE },
        _sum: { raisedAmount: true, targetAmount: true },
        _count: { id: true },
      }),
    ]);

    let active = 0;
    let makingProgress = 0;
    let needsActivation = 0;
    let totalTarget = 0;
    let totalRaised = campaignsAgg._sum.raisedAmount ?? 0;

    for (const city of cities) {
      const statusUpper = (city.activationStatus || "PENDING").toUpperCase();
      if (statusUpper === "ACTIVATED" || statusUpper === "ACTIVE") {
        active++;
      } else if (statusUpper === "IN_PROGRESS" || statusUpper === "MAKING_PROGRESS") {
        makingProgress++;
      } else {
        needsActivation++;
      }

      totalTarget += Number(city.targetAmount) || 0;
    }

    const summary: NationalHubSummaryDto = {
      totalCities: cities.length,
      active,
      makingProgress,
      needsActivation,
      totalFundingTarget: totalTarget,
      totalFundingRaised: totalRaised,
      totalBusinesses: businessesCount,
      totalCampaigns: campaignsAgg._count.id,
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

    const cities = await this.prisma.hubLocation.findMany({
      where: { type: HubLocationType.CITY, isActive: true },
      orderBy: { name: "asc" },
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
              select: { raisedAmount: true, targetAmount: true },
            },
          },
        },
      },
    });

    const result = cities.map((c) => {
      const meta = (c.metadata as Record<string, any>) || {};
      const localAreasCount = c.children.length;
      let highStreetsCount = 0;
      for (const area of c.children) {
        highStreetsCount += area.children.length;
      }

      let raised = 0;
      let campaignsCount = 0;
      for (const b of c.businesses) {
        for (const camp of b.campaigns) {
          raised += camp.raisedAmount;
          campaignsCount++;
        }
      }

      const target = Number(c.targetAmount) || 0;
      const statusUpper = (c.activationStatus || "PENDING").toUpperCase();
      let status: "active" | "making_progress" | "needs_activation" = "needs_activation";
      let progress = 0;

      if (statusUpper === "ACTIVATED" || statusUpper === "ACTIVE") {
        status = "active";
        progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 100;
      } else if (statusUpper === "IN_PROGRESS" || statusUpper === "MAKING_PROGRESS") {
        status = "making_progress";
        progress = target > 0 ? Math.min(99, Math.round((raised / target) * 100)) : 50;
      } else {
        status = "needs_activation";
        progress = target > 0 ? Math.min(49, Math.round((raised / target) * 100)) : 0;
      }

      if (meta.activationProgress) {
        progress = Number(meta.activationProgress);
      }

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        region: meta.region || "United Kingdom",
        status,
        activationProgress: progress,
        fundingTarget: target,
        fundingRaised: raised,
        localAreas: localAreasCount,
        highStreets: highStreetsCount,
        businesses: c.businesses.length,
        campaigns: campaignsCount,
        mapX: meta.mapX ?? (c.longitude ? Math.round(((c.longitude + 5) / 7) * 100) : 50),
        mapY: meta.mapY ?? (c.latitude ? Math.round(((58 - c.latitude) / 8) * 100) : 50),
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
    const city = await this.prisma.hubLocation.findUnique({
      where: { slug },
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
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                children: {
                  where: { isActive: true },
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

  async getLocations(query?: { type?: string; parentId?: string; search?: string }) {
    const where: Prisma.HubLocationWhereInput = { isActive: true };
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

    const businesses = await this.prisma.business.findMany({
      where: { locationId: { in: scopeIds }, status: "ACTIVE" },
      select: {
        id: true,
        locationId: true,
        campaigns: {
          where: { status: BusinessCampaignStatus.ACTIVE },
          select: {
            id: true,
            raisedAmount: true,
            targetAmount: true,
            template: { select: { origin: true } },
          },
        },
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
    for (const b of businesses) {
      const locId = b.locationId ?? location.id;
      const childId = childOf.get(locId) ?? location.id;
      for (const c of b.campaigns) {
        const origin = c.template?.origin ?? "DIRECT";
        campaignMeta.set(c.id, { origin, locationId: locId, raised: c.raisedAmount, childId });
        fundingRaised += c.raisedAmount;
        targetFromCampaigns += c.targetAmount;
        const agg = ensureChild(childId);
        agg.raised += c.raisedAmount;
        agg.campaigns += 1;
      }
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

    const meta = (location.metadata as Record<string, unknown>) ?? {};
    const fundingTarget = Number(location.targetAmount) || targetFromCampaigns;
    const activationProgress =
      Number(meta.activationProgress) ||
      (fundingTarget > 0 ? Math.min(100, Math.round((fundingRaised / fundingTarget) * 100)) : 0);

    const childType = (type: string) =>
      type === HubLocationType.CITY
        ? "city"
        : type === HubLocationType.HIGH_STREET
          ? "high_street"
          : "local_area";

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
        total: Number(meta.foundingBusinessTotal) || 0,
        allocated: Number(meta.foundingBusinessAllocated) || 0,
        remaining:
          (Number(meta.foundingBusinessTotal) || 0) - (Number(meta.foundingBusinessAllocated) || 0),
        status: location.activationStatus || "PENDING",
      },
      foundingConsumer: {
        total: Number(meta.foundingConsumerTotal) || 0,
        allocated: Number(meta.foundingConsumerAllocated) || 0,
        remaining:
          (Number(meta.foundingConsumerTotal) || 0) - (Number(meta.foundingConsumerAllocated) || 0),
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
