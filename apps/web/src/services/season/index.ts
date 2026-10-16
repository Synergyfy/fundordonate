// =============================================================================
// Season Service — Live Database API
// Connects frontend pages to PostgreSQL Season records via backend API client.
// =============================================================================

import api from "../api";
import type {
  CreateSeasonPayload,
  Season,
  SeasonAction,
  SeasonCityActivity,
  SeasonFilters,
  SeasonListResponse,
  SeasonMetrics,
  SeasonReview,
} from "./type";

function mapDbSeason(raw: any): Season {
  if (!raw) return raw;
  return {
    id: raw.id,
    name: raw.name,
    programmeName: raw.programmeName || undefined,
    referenceCode: raw.referenceCode || undefined,
    description: raw.description || undefined,
    publicDescription: raw.publicDescription || undefined,
    internalNotes: raw.internalNotes || undefined,
    status: raw.status || "DRAFT",
    startDate: raw.startDate ? new Date(raw.startDate).toISOString() : new Date().toISOString(),
    endDate: raw.endDate ? new Date(raw.endDate).toISOString() : new Date().toISOString(),
    durationDays: raw.durationDays || 90,
    overallTarget: Number(raw.overallTarget || 0),
    nationalTarget: Number(raw.nationalTarget || 0),
    cityTargetDefault: Number(raw.cityTargetDefault || 0),
    localAreaTargetDefault: Number(raw.localAreaTargetDefault || 0),
    highStreetTargetDefault: Number(raw.highStreetTargetDefault || 0),
    businessCampaignTargetDefault: Number(raw.businessCampaignTargetDefault || 0),
    totalRaised: Number(raw.totalRaised || 0),
    totalContributions: Number(raw.totalContributions || 0),
    activeCampaigns: Number(raw.activeCampaigns || 0),
    totalParticipants: Number(raw.totalParticipants || 0),
    totalConsumers: Number(raw.totalConsumers || 0),
    totalBusinessOwners: Number(raw.totalBusinessOwners || 0),
    totalBackers: Number(raw.totalBackers || 0),
    totalFoundingMembers: Number(raw.totalFoundingMembers || 0),
    activationScope: {
      nationalEnabled: raw.activationScope?.nationalEnabled ?? true,
      cities: Array.isArray(raw.activationScope?.cities) ? raw.activationScope.cities : [],
    },
    participationConfig: {
      consumerParticipation: raw.participationConfig?.consumerParticipation ?? true,
      businessOwnerParticipation: raw.participationConfig?.businessOwnerParticipation ?? true,
      backerEnabled: raw.participationConfig?.backerEnabled ?? true,
      foundingMemberEnabled: raw.participationConfig?.foundingMemberEnabled ?? true,
      foundingMemberMonthlyEnabled: raw.participationConfig?.foundingMemberMonthlyEnabled ?? true,
    },
    engagementConfig: {
      rewardsEnabled: raw.engagementConfig?.rewardsEnabled ?? true,
      incentivesEnabled: raw.engagementConfig?.incentivesEnabled ?? true,
      leaderboardsEnabled: raw.engagementConfig?.leaderboardsEnabled ?? true,
      recognitionEnabled: raw.engagementConfig?.recognitionEnabled ?? true,
      leaderboardScopes: raw.engagementConfig?.leaderboardScopes || ["NATIONAL", "CITY"],
    },
    spilloverConfig: {
      onTargetReached: raw.spilloverConfig?.onTargetReached || "CONTINUE_CAMPAIGN",
      surplusHandling: raw.spilloverConfig?.surplusHandling || "CARRY_FORWARD_TO_NEXT_SEASON",
      allowTargetExtension: raw.spilloverConfig?.allowTargetExtension ?? true,
      allowCarryForward: raw.spilloverConfig?.allowCarryForward ?? true,
    },
    communicationConfig: raw.communicationConfig || {},
    createdBy: raw.createdById || raw.createdBy || "admin",
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
    activatedAt: raw.activatedAt ? new Date(raw.activatedAt).toISOString() : undefined,
    completedAt: raw.completedAt ? new Date(raw.completedAt).toISOString() : undefined,
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt).toISOString() : undefined,
  };
}

export const seasonService = {
  /** List seasons with filters from database */
  async list(filters?: SeasonFilters): Promise<SeasonListResponse> {
    const params: Record<string, any> = {};
    if (filters?.status?.length) params.status = filters.status.join(",");
    if (filters?.search) params.search = filters.search;

    try {
      const res: any = await api.get("/seasons", { params });
      const rawList = res?.seasons || res?.items || (Array.isArray(res) ? res : []);
      const total = res?.total ?? rawList.length;
      return {
        seasons: rawList.map(mapDbSeason),
        total,
        page: 1,
        pageSize: 50,
      };
    } catch {
      // Fallback to admin seasons endpoint if user is authenticated admin
      try {
        const adminRes: any = await api.get("/admin/seasons", { params });
        const rawList = adminRes?.items || adminRes?.seasons || (Array.isArray(adminRes) ? adminRes : []);
        const total = adminRes?.total ?? rawList.length;
        return {
          seasons: rawList.map(mapDbSeason),
          total,
          page: 1,
          pageSize: 50,
        };
      } catch (err) {
        console.error("Failed to fetch seasons from database:", err);
        return { seasons: [], total: 0, page: 1, pageSize: 20 };
      }
    }
  },

  /** Get a single season by ID */
  async getById(id: string): Promise<Season | null> {
    if (!id) return null;
    try {
      const res = await api.get(`/seasons/${id}`);
      return res ? mapDbSeason(res) : null;
    } catch {
      try {
        const res = await api.get(`/admin/seasons/${id}`);
        return res ? mapDbSeason(res) : null;
      } catch {
        return null;
      }
    }
  },

  /** Get the currently active or scheduled season */
  async getCurrent(): Promise<Season | null> {
    try {
      const res = await api.get("/seasons/current");
      return res ? mapDbSeason(res) : null;
    } catch {
      try {
        const res = await api.get("/admin/seasons/current");
        return res ? mapDbSeason(res) : null;
      } catch {
        return null;
      }
    }
  },

  /** Get season metrics */
  async getMetrics(seasonId: string): Promise<SeasonMetrics | null> {
    try {
      const res = await api.get(`/seasons/${seasonId}/metrics`);
      if (res) return res;
    } catch {}

    const season = await this.getById(seasonId);
    if (!season) return null;

    const overallTarget = Number(season.overallTarget || 0);
    const totalRaised = Number(season.totalRaised || 0);

    return {
      seasonId,
      overallTarget,
      totalRaised,
      progressPercent: overallTarget > 0 ? Math.round((totalRaised / overallTarget) * 100) : 0,
      remainingAmount: Math.max(0, overallTarget - totalRaised),
      citiesActive: (season.activationScope?.cities || []).filter((c) => c.enabled).length,
      citiesTargeted: (season.activationScope?.cities || []).length,
      localAreasActive: 0,
      highStreetsActive: 0,
      businessesActive: 0,
      totalParticipants: season.totalParticipants || 0,
      consumers: season.totalConsumers || 0,
      businessOwners: season.totalBusinessOwners || 0,
      backers: season.totalBackers || 0,
      foundingMembers: season.totalFoundingMembers || 0,
      totalCampaigns: season.activeCampaigns || 0,
      activeCampaigns: season.activeCampaigns || 0,
      completedCampaigns: 0,
      campaignsTargetReached: 0,
      rewardsIssued: 0,
      leaderboardActive: 0,
    };
  },

  /** Get city activities for a season */
  async getCityActivities(seasonId: string): Promise<SeasonCityActivity[]> {
    try {
      const res = await api.get(`/admin/seasons/${seasonId}/cities`);
      if (Array.isArray(res)) return res;
    } catch {}

    const season = await this.getById(seasonId);
    if (!season || !season.activationScope?.cities) return [];

    return season.activationScope.cities.map((c, i) => ({
      id: `ca-${c.cityId || i}`,
      seasonId,
      cityId: c.cityId,
      cityName: c.cityName,
      target: season.cityTargetDefault || 1000000,
      raised: 0,
      contributions: 0,
      participants: 0,
      status: c.enabled ? "ACTIVE" : "INACTIVE",
    }));
  },

  /** Create a new season in database */
  async create(payload: CreateSeasonPayload): Promise<Season> {
    const res = await api.post("/admin/seasons", payload);
    return mapDbSeason(res);
  },

  /** Update an existing season */
  async update(id: string, payload: Partial<CreateSeasonPayload>): Promise<Season> {
    const res = await api.put(`/admin/seasons/${id}`, payload);
    return mapDbSeason(res);
  },

  /** Perform a lifecycle action on a season */
  async performAction(seasonId: string, action: SeasonAction): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/admin/seasons/${seasonId}/action`, { action });
    return res || { success: true, message: `Season ${action.toLowerCase()} performed successfully` };
  },

  /** Get season review from database */
  async getReview(seasonId: string): Promise<SeasonReview | null> {
    const season = await this.getById(seasonId);
    if (!season) return null;

    let apiReview: any = null;
    try {
      apiReview = await api.get(`/admin/seasons/${seasonId}/review`);
    } catch {}

    const reviewSeason = apiReview?.season ? mapDbSeason(apiReview.season) : season;
    const campaignsOutcome = apiReview?.campaignsOutcome || apiReview?.campaignOutcomes || {};
    const reviewMetrics = apiReview?.metrics || {};

    return {
      seasonId,
      season: reviewSeason,
      metrics: {
        overallTarget: reviewSeason.overallTarget,
        totalRaised: reviewSeason.totalRaised,
        totalContributions: reviewSeason.totalContributions,
        activeCampaigns: reviewSeason.activeCampaigns,
        totalParticipants: reviewSeason.totalParticipants,
        totalConsumers: reviewSeason.totalConsumers,
        totalBusinessOwners: reviewSeason.totalBusinessOwners,
        totalBackers: reviewSeason.totalBackers,
        totalFoundingMembers: reviewSeason.totalFoundingMembers,
        progressPercent: reviewSeason.overallTarget > 0 ? Math.round((reviewSeason.totalRaised / reviewSeason.overallTarget) * 100) : 0,
        ...reviewMetrics,
      },
      performanceByLevel: apiReview?.performanceByLevel || [],
      campaignOutcomes: {
        total: campaignsOutcome.totalCampaigns ?? campaignsOutcome.total ?? reviewSeason.activeCampaigns ?? 0,
        targetReached: campaignsOutcome.completed ?? campaignsOutcome.targetReached ?? 0,
        exceededTarget: campaignsOutcome.exceededTarget ?? 0,
        completedBelowTarget: campaignsOutcome.completedBelowTarget ?? 0,
        carriedForward: campaignsOutcome.carriedForward ?? 0,
        closed: campaignsOutcome.closed ?? 0,
        extended: campaignsOutcome.extended ?? 0,
      },
      fundingAndSurplus: apiReview?.fundingAndSurplus || {
        totalSeasonFunding: reviewSeason.totalRaised,
        fundsAllocated: reviewSeason.totalRaised,
        surplus: Math.max(0, reviewSeason.totalRaised - reviewSeason.overallTarget),
        fundsAwaitingAllocation: 0,
        carryForwardAmount: 0,
        outstandingExceptions: 0,
      },
      participationBreakdown: apiReview?.participationBreakdown || { byIdentity: [], byRoute: [], byLocation: [] },
      rewardsAndRecognition: apiReview?.rewardsAndRecognition || {
        rewardsIssued: 0,
        rewardsQualified: 0,
        rewardOpportunitiesActive: 0,
        rewardOpportunitiesClosed: 0,
        leaderboardOutcomes: [],
        recognitionAwarded: 0,
        campaignIncentivesTriggered: 0,
      },
      unfinishedItems: apiReview?.unfinishedItems || [],
      nextSeasonPrep: apiReview?.nextSeasonPrep || {
        duplicateAvailable: true,
        carryForwardAvailable: true,
        configurationReady: true,
        unresolvedItemsCount: 0,
      },
    };
  },

  /** Duplicate a season in database */
  async duplicate(sourceId: string, newName: string, startDate: string, endDate: string): Promise<Season> {
    const source = await this.getById(sourceId);
    if (!source) throw new Error("Source season not found in database");

    return this.create({
      name: newName,
      programmeName: source.programmeName,
      description: source.description,
      startDate,
      endDate,
      status: "DRAFT",
      overallTarget: source.overallTarget,
      nationalTarget: source.nationalTarget,
      cityTargetDefault: source.cityTargetDefault,
      localAreaTargetDefault: source.localAreaTargetDefault,
      highStreetTargetDefault: source.highStreetTargetDefault,
      businessCampaignTargetDefault: source.businessCampaignTargetDefault,
      activationScope: source.activationScope,
      participationConfig: source.participationConfig,
      engagementConfig: source.engagementConfig,
      spilloverConfig: source.spilloverConfig,
      communicationConfig: source.communicationConfig,
    });
  },
};

export const seasonApi = seasonService;
export default seasonService;
export type * from "./type";
