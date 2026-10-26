import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BusinessCampaignStatus,
  PreferredAudience,
  Prisma,
  TemplateOrigin,
  type CampaignRewardAttachment,
} from "@prisma/client";
import { PublicCampaignQueryDto } from "./dto/public-campaign-query.dto";
import {
  businessRewardsAttachmentAllowed,
  businessRewardsReplaceTemplate,
  effectiveConditions,
  minQualifyingPence,
} from "@/modules/rewards/reward-config.util";

/** A reward rule as persisted in `CampaignTemplate.rewardsConfig`. */
interface StoredRewardCondition {
  mode?: string;
  minPence?: number | null;
  maxPence?: number | null;
  exactPence?: number | null;
  min?: number | null;
  max?: number | null;
  exact?: number | null;
}

interface StoredRewardConfig {
  id?: string;
  name?: string;
  description?: string;
  rule?: string;
  source?: string;
  mcomRewardId?: string | null;
  rewardCategory?: string;
  valueGbp?: number | null;
  audience?: string;
  delivery?: string;
  qualificationMode?: string;
  conditions?: StoredRewardCondition[];
  trigger?: StoredRewardCondition;
  quantityType?: string;
  quantityLimit?: number | string | null;
  claimDeadlineDays?: number | string | null;
  order?: number;
  items?: { title: string; physicalType?: string }[];
}

/** Public (non-sensitive) view of a campaign reward rule. */
export interface PublicCampaignReward {
  id: string;
  title: string;
  description: string;
  source: string;
  mcomRewardId: string | null;
  rewardType: string | null;
  fulfilmentType: string | null;
  audience: string | null;
  qualificationMode: string;
  valueGbp: number | null;
  /** Minimum qualifying contribution in pence (for checkout gating). */
  amount: number;
  triggerConfig: { mode: string; min?: number; max?: number; exact?: number };
  issuedCount: number;
  status: "active";
  order?: number;
  quantityType?: string;
  quantityLimit?: number | null;
  quantityClaimed?: number;
  claimDeadlineDays?: number;
  items: { title: string; physicalType?: string }[];
}

export interface PublicCampaignItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  mode: "fund" | "donation";
  targetAudience: "business" | "consumer" | "both";
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
  /** Canonical HubLocation context for the campaign. */
  locationId?: string | null;
  location?: string;
  hierarchyLevel?: "national" | "city" | "borough" | "district" | "local_area" | "high_street" | "commercial_area";
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  /** Campaign-level presentation settings (FAQs, terms, …). */
  settings?: Record<string, unknown>;
  _count?: {
    contributions?: number;
    donations?: number;
    pledges?: number;
  };
  rewards?: PublicCampaignReward[];
  createdAt: string;
}

/** A campaign row with the relations required to build a PublicCampaignItem. */
type PublicCampaignRecord = Prisma.BusinessCampaignGetPayload<{
  include: {
    template: true;
    business: { include: { location: true } };
    locations: { include: { location: true } };
    _count: { select: { contributions: true } };
  };
}>;

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

  private toHierarchyLevel(
    type?: string | null,
  ): PublicCampaignItem["hierarchyLevel"] | undefined {
    switch ((type ?? "").toUpperCase()) {
      case "NATIONAL":
        return "national";
      case "CITY":
        return "city";
      case "BOROUGH":
        return "borough";
      case "DISTRICT":
        return "district";
      case "LOCAL_AREA":
        return "local_area";
      case "HIGH_STREET":
        return "high_street";
      case "COMMERCIAL_AREA":
        return "commercial_area";
      default:
        return undefined;
    }
  }

  /**
   * Resolves a location slug/id to itself plus all descendants. Campaigns are
   * owned by the business location, so a city hub must include high-street
   * activity beneath it without duplicating campaigns.
   */
  private async resolveLocationScope(ref: string): Promise<string[] | null> {
    const root = await this.prisma.hubLocation.findFirst({
      where: { OR: [{ id: ref }, { slug: ref }] },
      select: { id: true },
    });
    if (!root) return null;

    const locations = await this.prisma.hubLocation.findMany({
      select: { id: true, parentId: true },
    });
    const children = new Map<string, string[]>();
    for (const location of locations) {
      if (!location.parentId) continue;
      const siblings = children.get(location.parentId) ?? [];
      siblings.push(location.id);
      children.set(location.parentId, siblings);
    }

    const scope: string[] = [];
    const queue = [root.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (scope.includes(id)) continue;
      scope.push(id);
      queue.push(...(children.get(id) ?? []));
    }
    return scope;
  }

  /** Maps a campaign row (with relations) to its public, non-sensitive shape. */
  private toPublicItem(c: PublicCampaignRecord): PublicCampaignItem {
    const biz = c.business;
    const primaryLink = c.locations?.find((link) => link.scope === "PRIMARY");
    const campaignLocation = primaryLink?.location ?? biz.location ?? null;
    const citySlug = this.slugify(biz.city);
    const areaSlug = this.slugify(biz.localArea);
    const streetSlug = this.slugify(biz.highStreet);
    const campaignSlug = `${this.slugify(c.title)}-${c.id.slice(0, 8)}`;
    const percentage =
      c.targetAmount > 0
        ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
        : 0;

    const audience: "business" | "consumer" | "both" =
      biz.preferredAudience === PreferredAudience.BUSINESS
        ? "business"
        : biz.preferredAudience === PreferredAudience.CONSUMER
          ? "consumer"
          : "both";
    const mode = c.template.origin === "AUDIT" ? "fund" : "donation";
    const catName = biz.category || "Community & Commerce";

    // Fallback high quality imagery
    const fallbackImages = [
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=450&fit=crop",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop",
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=450&fit=crop",
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=450&fit=crop",
    ];
    const imgIdx =
      Math.abs(c.id.charCodeAt(0) + c.title.charCodeAt(0)) % fallbackImages.length;
    const featuredImage = biz.coverImageUrl || biz.logoUrl || fallbackImages[imgIdx]!;

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
      locationId: campaignLocation?.id ?? null,
      location:
        campaignLocation?.name ||
        biz.highStreet ||
        biz.localArea ||
        biz.city ||
        undefined,
      hierarchyLevel: this.toHierarchyLevel(campaignLocation?.type),
      author: {
        id: biz.ownerId,
        firstName: biz.name,
        lastName: "",
        username: biz.slug,
      },
      settings:
        c.settings && typeof c.settings === "object" && !Array.isArray(c.settings)
          ? (c.settings as Record<string, unknown>)
          : {},
      _count: {
        contributions: c._count?.contributions || 0,
        donations: c.backerCount || c._count?.contributions || 0,
        pledges: 0,
      },
      createdAt: c.createdAt.toISOString(),
    };
  }

  /**
   * Look up a single contribution by its public reference (e.g. WEB-042) for the
   * post-payment confirmation page.
   */
  async getContributionByReference(reference: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { reference },
      include: {
        campaign: { select: { id: true, title: true } },
        business: { select: { name: true, city: true } },
      },
    });
    if (!contribution) {
      throw new NotFoundException(`Contribution ${reference} not found`);
    }

    return {
      uid: contribution.id,
      reference: contribution.reference,
      amount: contribution.amount,
      status: contribution.status.toLowerCase(),
      createdAt: contribution.createdAt.toISOString(),
      gateway: contribution.gateway,
      campaign: {
        id: contribution.campaign.id,
        title: contribution.campaign.title,
        slug: this.slugify(contribution.campaign.title),
      },
      business: { name: contribution.business.name, location: contribution.business.city },
    };
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
    const andClauses: Prisma.BusinessCampaignWhereInput[] = [];

    // Filter by audience (business vs consumer) - strictly isolated
    if (query.audience && query.audience.toLowerCase() !== "all") {
      const aud = query.audience.toLowerCase();
      if (aud === "business") {
        businessWhere.preferredAudience = {
          in: [PreferredAudience.BUSINESS, PreferredAudience.BOTH],
        };
      } else if (aud === "consumer") {
        businessWhere.preferredAudience = {
          in: [PreferredAudience.CONSUMER, PreferredAudience.BOTH],
        };
      }
    }

    // Filter by city (resolved through the location hierarchy when possible).
    if (query.city) {
      const cityLocation = await this.prisma.hubLocation.findFirst({
        where: {
          type: "CITY",
          OR: [
            { name: { equals: query.city, mode: "insensitive" } },
            { slug: { equals: this.slugify(query.city) } },
          ],
        },
        select: { id: true },
      });
      if (cityLocation) {
        const scope = (await this.resolveLocationScope(cityLocation.id)) ?? [];
        andClauses.push({
          OR: [
            { locations: { some: { locationId: { in: scope } } } },
            { locations: { none: {} }, business: { locationId: { in: scope } } },
          ],
        });
      } else {
        businessWhere.city = { equals: query.city, mode: "insensitive" };
      }
    }

    // Filter by location hierarchy (slug/id) — includes descendants. Prefer the
    // explicit CampaignLocation relationship and fall back to the business's
    // registered location for legacy campaigns that have no links yet.
    const locationRef = query.location || query.locationId;
    if (locationRef) {
      const scope = await this.resolveLocationScope(locationRef);
      if (!scope) {
        return { items: [], total: 0, page: query.page, limit: query.limit };
      }
      andClauses.push({
        OR: [
          { locations: { some: { locationId: { in: scope } } } },
          {
            locations: { none: {} },
            business: { locationId: { in: scope } },
          },
        ],
      });
    }

    if (Object.keys(businessWhere).length > 0) {
      where.business = businessWhere;
    }

    // Filter by category
    if (query.category) {
      businessWhere.category = { contains: query.category, mode: "insensitive" };
    }

    if (Object.keys(businessWhere).length > 0) {
      where.business = businessWhere;
    }
    if (andClauses.length > 0) {
      where.AND = andClauses;
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
          locations: { include: { location: true } },
          _count: {
            select: { contributions: true },
          },
        },
      }),
      this.prisma.businessCampaign.count({ where }),
    ]);

    const items: PublicCampaignItem[] = rawItems.map((c) => this.toPublicItem(c));

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Retrieves the campaigns promoted in the public "Featured Campaigns" sections.
   *
   * There is no explicit curation flag yet, so featured campaigns are the
   * highest-raising active campaigns (newest first when amounts tie).
   */
  async listFeatured(
    limit = 6,
    audience?: string,
    mode?: string,
  ): Promise<{
    items: PublicCampaignItem[];
    total: number;
    limit: number;
  }> {
    const take = Math.min(Math.max(1, Math.trunc(limit) || 6), 50);

    const where: Prisma.BusinessCampaignWhereInput = {
      status: BusinessCampaignStatus.ACTIVE,
    };

    // Mode is derived from the template origin: AUDIT templates are fund
    // campaigns, every other template is a donation campaign.
    const normalizedMode = mode?.toLowerCase();
    if (normalizedMode === "fund") {
      where.template = { origin: TemplateOrigin.AUDIT };
    } else if (normalizedMode === "donation" || normalizedMode === "donate") {
      where.template = { origin: { not: TemplateOrigin.AUDIT } };
    }

    if (audience && audience.toLowerCase() !== "all") {
      const aud = audience.toLowerCase();
      if (aud === "business") {
        where.business = {
          preferredAudience: {
            in: [PreferredAudience.BUSINESS, PreferredAudience.BOTH],
          },
        };
      } else if (aud === "consumer") {
        where.business = {
          preferredAudience: {
            in: [PreferredAudience.CONSUMER, PreferredAudience.BOTH],
          },
        };
      }
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.businessCampaign.findMany({
        where,
        take,
        orderBy: [{ raisedAmount: "desc" }, { createdAt: "desc" }],
        include: {
          template: true,
          business: { include: { location: true } },
          locations: { include: { location: true } },
          _count: { select: { contributions: true } },
        },
      }),
      this.prisma.businessCampaign.count({ where }),
    ]);

    return {
      items: rawItems.map((c) => this.toPublicItem(c)),
      total,
      limit: take,
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
        business: { include: { location: true } },
        locations: { include: { location: true } },
        rewardAttachments: { orderBy: { createdAt: "asc" } },
        _count: { select: { contributions: true } },
      },
    });

    if (!c) {
      throw new NotFoundException("Campaign not found");
    }

    return {
      ...this.toPublicItem(c),
      rewards: await this.buildRewards(
        c.id,
        c.template?.rewardsConfig,
        c.rewardAttachments,
        c.template?.businessRewardsMode,
      ),
    };
  }

  /**
   * Public reward rules for a campaign, suitable for the campaign page and the
   * pledge checkout (which uses `amount` to gate the minimum contribution).
   *
   * Codes and recipient details are intentionally excluded — a donor's own
   * issuance (with code/status) is served from the authenticated consumer API.
   */
  async getRewards(campaignId: string): Promise<{
    data: PublicCampaignReward[];
    total: number;
  }> {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        rewardAttachments: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const data = await this.buildRewards(
      campaignId,
      campaign.template?.rewardsConfig,
      campaign.rewardAttachments,
      campaign.template?.businessRewardsMode,
    );
    return { data, total: data.length };
  }

  /** Map stored reward configs + attached rewards (+ issuance counts) into public reward views. */
  private async buildRewards(
    campaignId: string,
    rawConfig: unknown,
    attachments: CampaignRewardAttachment[] = [],
    businessRewardsMode?: string | null,
  ): Promise<PublicCampaignReward[]> {
    const configs: StoredRewardConfig[] = Array.isArray(rawConfig)
      ? (rawConfig as unknown as StoredRewardConfig[])
      : [];
    const enabledAttachments = attachments.filter(
      (a) => a.enabled && (!a.expiresAt || a.expiresAt.getTime() > Date.now()),
    );

    const includeTemplateRewards =
      configs.length > 0 &&
      !(businessRewardsReplaceTemplate(businessRewardsMode) && enabledAttachments.length > 0);

    if (!includeTemplateRewards && enabledAttachments.length === 0) return [];

    const issuances = await this.prisma.rewardIssuance.findMany({
      where: { campaignId },
      select: { mcomRewardId: true, businessRewardId: true, rewardConfigId: true },
    });
    const countMap = new Map<string, number>();
    for (const issuance of issuances) {
      for (const key of [
        issuance.mcomRewardId,
        issuance.businessRewardId,
        issuance.rewardConfigId,
      ]) {
        if (!key) continue;
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
      }
    }

    const templateRewards = includeTemplateRewards
      ? configs
          .filter((cfg) => cfg && typeof cfg === "object")
          .map((cfg, index) => this.toPublicReward(cfg, index, countMap))
      : [];

    const attachmentRewards = businessRewardsAttachmentAllowed(businessRewardsMode)
      ? enabledAttachments.map((attachment, index) =>
          this.toPublicAttachmentReward(attachment, index, countMap),
        )
      : [];

    return [...templateRewards, ...attachmentRewards];
  }

  private toPublicReward(
    cfg: StoredRewardConfig,
    index: number,
    countMap: Map<string, number>,
  ): PublicCampaignReward {
    const condition = this.normalizeCondition(cfg);
    const mode = this.normalizeMode(condition.mode);
    // Minimum qualifying contribution in pence — falls back to the rule copy
    // for legacy configs that predate `conditions[]`.
    const amount = minQualifyingPence(cfg);
    const issuedCount =
      countMap.get(cfg.mcomRewardId ?? cfg.id ?? "") ??
      countMap.get(cfg.id ?? "") ??
      0;
    const quantityLimit =
      cfg.quantityLimit !== null && cfg.quantityLimit !== undefined && cfg.quantityLimit !== ""
        ? Number(cfg.quantityLimit)
        : null;
    const claimDeadlineDays =
      cfg.claimDeadlineDays !== null &&
      cfg.claimDeadlineDays !== undefined &&
      cfg.claimDeadlineDays !== ""
        ? Number(cfg.claimDeadlineDays)
        : undefined;

    return {
      id: cfg.id ?? `cfg-${index}`,
      title: cfg.name ?? "Reward",
      description: cfg.description ?? cfg.rule ?? "",
      source: cfg.source ?? "fundordonate",
      mcomRewardId: cfg.mcomRewardId ?? null,
      rewardType: cfg.rewardCategory ?? null,
      fulfilmentType: cfg.delivery ?? null,
      audience: cfg.audience ?? null,
      qualificationMode: cfg.qualificationMode ?? "highest",
      valueGbp: cfg.valueGbp ?? null,
      amount,
      triggerConfig: {
        mode,
        ...(condition.minPence != null ? { min: condition.minPence } : {}),
        ...(condition.maxPence != null ? { max: condition.maxPence } : {}),
        ...(condition.exactPence != null ? { exact: condition.exactPence } : {}),
      },
      issuedCount,
      status: "active",
      order: cfg.order ?? index,
      quantityType:
        cfg.quantityType ?? (quantityLimit != null ? "limited" : undefined),
      quantityLimit,
      quantityClaimed: issuedCount,
      claimDeadlineDays,
      items: Array.isArray(cfg.items)
        ? cfg.items.filter((item) => item && typeof item === "object")
        : [],
    };
  }

  /** Map a business-owned MCOM reward attached to the campaign. */
  private toPublicAttachmentReward(
    attachment: CampaignRewardAttachment,
    index: number,
    countMap: Map<string, number>,
  ): PublicCampaignReward {
    const cfg: StoredRewardConfig = {
      conditions: Array.isArray(attachment.conditions)
        ? (attachment.conditions as unknown as StoredRewardCondition[])
        : [],
    };
    const condition = this.normalizeCondition(cfg);
    const issuedCount = countMap.get(attachment.businessRewardId) ?? 0;
    const quantityLimit = attachment.maxQuantity ?? null;

    return {
      id: attachment.id,
      title: attachment.title,
      description: attachment.description ?? "",
      source: "mcom",
      mcomRewardId: attachment.businessRewardId,
      rewardType: attachment.rewardType ?? null,
      fulfilmentType: null,
      audience: null,
      qualificationMode: attachment.qualificationMode ?? "independent",
      valueGbp: null,
      amount: minQualifyingPence(cfg),
      triggerConfig: {
        mode: this.normalizeMode(condition.mode),
        ...(condition.minPence != null ? { min: condition.minPence } : {}),
        ...(condition.maxPence != null ? { max: condition.maxPence } : {}),
        ...(condition.exactPence != null ? { exact: condition.exactPence } : {}),
      },
      issuedCount,
      status: "active",
      order: index,
      quantityType: quantityLimit != null ? "limited" : undefined,
      quantityLimit,
      quantityClaimed: issuedCount,
      items: [],
    };
  }

  /** Pick the first effective trigger condition (conditions[] / legacy trigger / rule copy). */
  private normalizeCondition(cfg: StoredRewardConfig): StoredRewardCondition {
    const [first] = effectiveConditions(cfg);
    if (!first) return { mode: undefined, minPence: null, maxPence: null, exactPence: null };
    return {
      mode: first.mode,
      minPence: first.minPence ?? null,
      maxPence: first.maxPence ?? null,
      exactPence: first.exactPence ?? null,
    };
  }

  /** The wizard stores "minimum"; the UI expects "min". */
  private normalizeMode(mode?: string): string {
    switch ((mode ?? "").toLowerCase()) {
      case "minimum":
      case "min":
        return "min";
      case "range":
        return "range";
      case "exact":
        return "exact";
      default:
        return "min";
    }
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
