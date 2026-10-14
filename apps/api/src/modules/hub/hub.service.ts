import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { HubLocationType, BusinessCampaignStatus } from "@prisma/client";

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates live nationwide metrics for the National Hub Overview page.
   */
  async getNationalSummary(): Promise<NationalHubSummaryDto> {
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

      totalTarget += Number(city.targetAmount) || 20000000; // default £200,000 in pence
    }

    return {
      totalCities: cities.length,
      active,
      makingProgress,
      needsActivation,
      totalFundingTarget: totalTarget > 0 ? totalTarget : 152000000,
      totalFundingRaised: totalRaised,
      totalBusinesses: businessesCount,
      totalCampaigns: campaignsAgg._count.id,
    };
  }

  /**
   * Retrieves all live cities with computed activation progress, funding, and geo coordinates.
   */
  async getCities(): Promise<CityHubItemDto[]> {
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

    return cities.map((c) => {
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

      const target = Number(c.targetAmount) || 20000000;
      const statusUpper = (c.activationStatus || "PENDING").toUpperCase();
      let status: "active" | "making_progress" | "needs_activation" = "needs_activation";
      let progress = 35;

      if (statusUpper === "ACTIVATED" || statusUpper === "ACTIVE") {
        status = "active";
        progress = Math.min(100, Math.max(75, Math.round((raised / target) * 100)));
      } else if (statusUpper === "IN_PROGRESS" || statusUpper === "MAKING_PROGRESS") {
        status = "making_progress";
        progress = Math.min(74, Math.max(50, Math.round((raised / target) * 100)));
      } else {
        status = "needs_activation";
        progress = Math.min(49, Math.max(25, Math.round((raised / target) * 100)));
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

    return roots;
  }

  async getLocations(query?: { type?: string; parentId?: string; search?: string }) {
    const where: any = { isActive: true };
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
}
