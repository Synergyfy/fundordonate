import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BusinessCampaignStatus,
  PreferredAudience,
  Prisma,
} from "@prisma/client";
import { PublicCampaignQueryDto } from "./dto/public-campaign-query.dto";

export interface PublicCampaignItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  mode: "fund" | "donation";
  targetAudience: "business" | "consumer";
  goalAmount: number; // In pence
  raisedAmount: number; // In pence
  percentage: number;
  backerCount: number;
  deadline: string;
  featuredImage: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    city: string;
    localArea: string;
    highStreet: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
  };
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  streetSlug: string;
  streetName: string;
  author: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    contributions?: number;
    donations?: number;
    pledges?: number;
  };
  createdAt: string;
}

@Injectable()
export class PublicCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Retrieves public campaigns matching filters (audience, mode, city, search, etc.)
   */
  async list(query: PublicCampaignQueryDto): Promise<{
    items: PublicCampaignItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Prisma.BusinessCampaignWhereInput = {
      status: query.status
        ? (query.status.toUpperCase() as BusinessCampaignStatus)
        : BusinessCampaignStatus.ACTIVE,
    };

    const businessWhere: Prisma.BusinessWhereInput = {};

    // Filter by audience (business vs consumer) - strictly isolated
    if (query.audience && query.audience.toLowerCase() !== "all") {
      const aud = query.audience.toLowerCase();
      if (aud === "business") {
        businessWhere.preferredAudience = PreferredAudience.BUSINESS;
      } else if (aud === "consumer") {
        businessWhere.preferredAudience = PreferredAudience.CONSUMER;
      }
    }

    // Filter by city
    if (query.city) {
      businessWhere.city = { equals: query.city, mode: "insensitive" };
    }

    // Filter by category
    if (query.category) {
      businessWhere.category = { contains: query.category, mode: "insensitive" };
    }

    if (Object.keys(businessWhere).length > 0) {
      where.business = businessWhere;
    }

    // Search query
    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
        { business: { name: { contains: s, mode: "insensitive" } } },
        { business: { city: { contains: s, mode: "insensitive" } } },
        { business: { localArea: { contains: s, mode: "insensitive" } } },
        { business: { highStreet: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.businessCampaign.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { raisedAmount: "desc" },
        include: {
          template: true,
          business: {
            include: {
              location: true,
            },
          },
          _count: {
            select: { contributions: true },
          },
        },
      }),
      this.prisma.businessCampaign.count({ where }),
    ]);

    const items: PublicCampaignItem[] = rawItems.map((c) => {
      const biz = c.business;
      const citySlug = this.slugify(biz.city);
      const areaSlug = this.slugify(biz.localArea);
      const streetSlug = this.slugify(biz.highStreet);
      const campaignSlug = `${this.slugify(c.title)}-${c.id.slice(0, 8)}`;
      const percentage =
        c.targetAmount > 0
          ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
          : 0;

      const audience: "business" | "consumer" =
        biz.preferredAudience === PreferredAudience.BUSINESS
          ? "business"
          : "consumer";
      const mode = c.template.origin === "AUDIT" ? "fund" : "donation";
      const catName = biz.category || "Community & Commerce";

      // Fallback high quality imagery
      const fallbackImages = [
        "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=450&fit=crop",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop",
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=450&fit=crop",
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=450&fit=crop",
      ];
      const imgIdx = Math.abs(c.id.charCodeAt(0) + c.title.charCodeAt(0)) % fallbackImages.length;
      const featuredImage =
        biz.coverImageUrl || biz.logoUrl || fallbackImages[imgIdx]!;

      return {
        id: c.id,
        slug: campaignSlug,
        title: c.title,
        description: c.description || c.title,
        shortDescription:
          c.description?.slice(0, 150) ||
          `Support ${biz.name} in ${biz.localArea}, ${biz.city}.`,
        mode,
        targetAudience: audience,
        goalAmount: c.targetAmount,
        raisedAmount: c.raisedAmount,
        percentage,
        backerCount: c.backerCount || c._count.contributions,
        deadline:
          c.endDate?.toISOString() ||
          new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        featuredImage,
        category: {
          id: `cat-${this.slugify(catName)}`,
          name: catName,
          slug: this.slugify(catName),
        },
        business: {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          city: biz.city,
          localArea: biz.localArea,
          highStreet: biz.highStreet,
          logoUrl: biz.logoUrl,
          coverImageUrl: biz.coverImageUrl,
        },
        citySlug,
        cityName: biz.city,
        areaSlug,
        areaName: biz.localArea,
        streetSlug,
        streetName: biz.highStreet,
        author: {
          firstName: biz.name,
          lastName: "",
        },
        _count: {
          contributions: c._count?.contributions || 0,
          donations: c.backerCount || c._count?.contributions || 0,
          pledges: 0,
        },
        createdAt: c.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Retrieves single public campaign by ID.
   */
  async getById(id: string): Promise<PublicCampaignItem> {
    const c = await this.prisma.businessCampaign.findUnique({
      where: { id },
      include: {
        template: true,
        business: true,
        _count: { select: { contributions: true } },
      },
    });

    if (!c) {
      throw new NotFoundException("Campaign not found");
    }

    const biz = c.business;
    const citySlug = this.slugify(biz.city);
    const areaSlug = this.slugify(biz.localArea);
    const streetSlug = this.slugify(biz.highStreet);
    const campaignSlug = `${this.slugify(c.title)}-${c.id.slice(0, 8)}`;
    const percentage =
      c.targetAmount > 0
        ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
        : 0;

    return {
      id: c.id,
      slug: campaignSlug,
      title: c.title,
      description: c.description || c.title,
      shortDescription: c.description?.slice(0, 150) || "",
      mode: c.template.origin === "AUDIT" ? "fund" : "donation",
      targetAudience:
        biz.preferredAudience === PreferredAudience.BUSINESS
          ? "business"
          : "consumer",
      goalAmount: c.targetAmount,
      raisedAmount: c.raisedAmount,
      percentage,
      backerCount: c.backerCount || c._count.contributions,
      deadline:
        c.endDate?.toISOString() ||
        new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      featuredImage:
        biz.coverImageUrl ||
        biz.logoUrl ||
        "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=450&fit=crop",
      category: {
        id: `cat-${this.slugify(biz.category || "Community")}`,
        name: biz.category || "Community",
        slug: this.slugify(biz.category || "Community"),
      },
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        city: biz.city,
        localArea: biz.localArea,
        highStreet: biz.highStreet,
        logoUrl: biz.logoUrl,
        coverImageUrl: biz.coverImageUrl,
      },
      citySlug,
      cityName: biz.city,
      areaSlug,
      areaName: biz.localArea,
      streetSlug,
      streetName: biz.highStreet,
      author: {
        firstName: biz.name,
        lastName: "",
      },
      _count: {
        contributions: c._count?.contributions || 0,
        donations: c.backerCount || c._count?.contributions || 0,
        pledges: 0,
      },
      createdAt: c.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves single public campaign by slug.
   */
  async getBySlug(slug: string): Promise<PublicCampaignItem> {
    // If slug has ID suffix e.g. feed-manchester-12345678
    const parts = slug.split("-");
    const lastPart = parts[parts.length - 1];

    let campaign = null;
    if (lastPart && lastPart.length === 8) {
      campaign = await this.prisma.businessCampaign.findFirst({
        where: { id: { startsWith: lastPart } },
        include: {
          template: true,
          business: true,
          _count: { select: { contributions: true } },
        },
      });
    }

    if (!campaign) {
      // Find by title slug match or template match
      const allActive = await this.prisma.businessCampaign.findMany({
        where: { status: BusinessCampaignStatus.ACTIVE },
        include: {
          template: true,
          business: true,
          _count: { select: { contributions: true } },
        },
      });

      campaign = allActive.find(
        (c) =>
          this.slugify(c.title) === slug ||
          `${this.slugify(c.title)}-${c.id.slice(0, 8)}` === slug,
      ) ?? null;
    }

    if (!campaign) {
      throw new NotFoundException(`Campaign '${slug}' not found`);
    }

    return this.getById(campaign.id);
  }
}
