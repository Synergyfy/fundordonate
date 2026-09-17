// =============================================================================
// Season Service — Frontend API
// Handles season management, seasonal context, and operational data.
// =============================================================================

import type {
  Season as SeasonType,
  SeasonStatus as SeasonStatusType,
  SeasonMetrics as SeasonMetricsType,
  SeasonReview as SeasonReviewType,
  CreateSeasonPayload as CreateSeasonPayloadType,
  SeasonFilters as SeasonFiltersType,
  SeasonListResponse as SeasonListResponseType,
  SeasonCityActivity as SeasonCityActivityType,
  SeasonAction as SeasonActionType,
} from "@fundordonate/types";

// Re-export types for convenience
export type Season = SeasonType;
export type SeasonStatus = SeasonStatusType;
export type SeasonMetrics = SeasonMetricsType;
export type SeasonReview = SeasonReviewType;
export type CreateSeasonPayload = CreateSeasonPayloadType;
export type SeasonFilters = SeasonFiltersType;
export type SeasonListResponse = SeasonListResponseType;
export type SeasonCityActivity = SeasonCityActivityType;
export type SeasonAction = SeasonActionType;

const API_BASE = "/api/seasons";

// =============================================================================
// Demo Fallback Data
// =============================================================================

const DEMO_SEASONS: Season[] = [
  {
    id: "season-autumn-2026",
    name: "Autumn 2026",
    programmeName: "UK Activation Programme",
    referenceCode: "S26-AUT",
    description: "The autumn 2026 activation season.",
    status: "ACTIVE",
    startDate: "2026-09-01T00:00:00Z",
    endDate: "2026-11-30T23:59:59Z",
    durationDays: 91,
    overallTarget: 50000000,
    nationalTarget: 10000000,
    cityTargetDefault: 5000000,
    localAreaTargetDefault: 1000000,
    highStreetTargetDefault: 500000,
    businessCampaignTargetDefault: 100000,
    totalRaised: 18750000,
    totalContributions: 42500,
    activeCampaigns: 156,
    totalParticipants: 8900,
    totalConsumers: 6200,
    totalBusinessOwners: 2700,
    totalBackers: 7100,
    totalFoundingMembers: 1800,
    activationScope: {
      nationalEnabled: true,
      cities: [
        { cityId: "london", cityName: "London", enabled: true, localAreas: [] },
        { cityId: "manchester", cityName: "Manchester", enabled: true, localAreas: [] },
        { cityId: "birmingham", cityName: "Birmingham", enabled: true, localAreas: [] },
        { cityId: "leeds", cityName: "Leeds", enabled: true, localAreas: [] },
        { cityId: "bristol", cityName: "Bristol", enabled: false, localAreas: [] },
      ],
    },
    participationConfig: { consumerParticipation: true, businessOwnerParticipation: true, backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: true },
    engagementConfig: { rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true, recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY", "LOCAL_AREA", "HIGH_STREET", "CAMPAIGN"] },
    spilloverConfig: { onTargetReached: "CONTINUE_CAMPAIGN", surplusHandling: "CARRY_FORWARD_TO_NEXT_SEASON", allowTargetExtension: true, allowCarryForward: true },
    communicationConfig: { publicTitle: "Autumn 2026 — Fund Or Donate", publicIntroduction: "Join thousands of communities raising funds across the UK this autumn." },
    createdBy: "admin-1",
    createdAt: "2026-07-15T10:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    activatedAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "season-winter-2026",
    name: "Winter 2026",
    programmeName: "UK Activation Programme",
    referenceCode: "S26-WIN",
    status: "SCHEDULED",
    startDate: "2026-12-01T00:00:00Z",
    endDate: "2027-02-28T23:59:59Z",
    durationDays: 90,
    overallTarget: 60000000,
    nationalTarget: 12000000,
    cityTargetDefault: 6000000,
    localAreaTargetDefault: 1200000,
    highStreetTargetDefault: 600000,
    businessCampaignTargetDefault: 120000,
    totalRaised: 0, totalContributions: 0, activeCampaigns: 0, totalParticipants: 0,
    totalConsumers: 0, totalBusinessOwners: 0, totalBackers: 0, totalFoundingMembers: 0,
    activationScope: { nationalEnabled: true, cities: [] },
    participationConfig: { consumerParticipation: true, businessOwnerParticipation: true, backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: true },
    engagementConfig: { rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true, recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY"] },
    spilloverConfig: { onTargetReached: "EXTEND_TARGET", surplusHandling: "ALLOCATE_TO_CONFIGURED_OBJECTIVE", allowTargetExtension: true, allowCarryForward: true },
    communicationConfig: {},
    createdBy: "admin-1", createdAt: "2026-08-01T10:00:00Z", updatedAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "season-summer-2026",
    name: "Summer 2026",
    programmeName: "UK Activation Programme",
    referenceCode: "S26-SUM",
    status: "COMPLETED",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-08-31T23:59:59Z",
    durationDays: 92,
    overallTarget: 30000000,
    nationalTarget: 6000000,
    cityTargetDefault: 3000000,
    localAreaTargetDefault: 600000,
    highStreetTargetDefault: 300000,
    businessCampaignTargetDefault: 60000,
    totalRaised: 27500000, totalContributions: 38000, activeCampaigns: 0, totalParticipants: 7200,
    totalConsumers: 5100, totalBusinessOwners: 2100, totalBackers: 5800, totalFoundingMembers: 1400,
    activationScope: { nationalEnabled: true, cities: [] },
    participationConfig: { consumerParticipation: true, businessOwnerParticipation: true, backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: false },
    engagementConfig: { rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true, recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY"] },
    spilloverConfig: { onTargetReached: "CONTINUE_CAMPAIGN", surplusHandling: "CARRY_FORWARD_TO_NEXT_SEASON", allowTargetExtension: true, allowCarryForward: true },
    communicationConfig: {},
    createdBy: "admin-1", createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-08-31T23:59:59Z", completedAt: "2026-08-31T23:59:59Z",
  },
  {
    id: "season-spring-2026",
    name: "Spring 2026",
    programmeName: "UK Activation Programme",
    referenceCode: "S26-SPR",
    description: "The spring 2026 activation season.",
    status: "COMPLETED",
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-05-31T23:59:59Z",
    durationDays: 92,
    overallTarget: 25000000,
    nationalTarget: 5000000,
    cityTargetDefault: 2500000,
    localAreaTargetDefault: 500000,
    highStreetTargetDefault: 250000,
    businessCampaignTargetDefault: 50000,
    totalRaised: 22500000, totalContributions: 31000, activeCampaigns: 0, totalParticipants: 6500,
    totalConsumers: 4600, totalBusinessOwners: 1900, totalBackers: 5200, totalFoundingMembers: 1300,
    activationScope: { nationalEnabled: true, cities: [] },
    participationConfig: { consumerParticipation: true, businessOwnerParticipation: true, backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: false },
    engagementConfig: { rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true, recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY"] },
    spilloverConfig: { onTargetReached: "CONTINUE_CAMPAIGN", surplusHandling: "CARRY_FORWARD_TO_NEXT_SEASON", allowTargetExtension: true, allowCarryForward: true },
    communicationConfig: {},
    createdBy: "admin-1", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-05-31T23:59:59Z", completedAt: "2026-05-31T23:59:59Z",
  },
];

// =============================================================================
// Service Methods
// =============================================================================

export const seasonApi = {
  /** List seasons with filters */
  async list(filters?: SeasonFilters): Promise<SeasonListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status?.length) params.set("status", filters.status.join(","));
      if (filters?.search) params.set("search", filters.search);
      const res = await fetch(`${API_BASE}?${params}`);
      if (res.ok) return res.json();
    } catch {}
    // Demo fallback
    let seasons = [...DEMO_SEASONS];
    if (filters?.status?.length) seasons = seasons.filter((s) => filters.status!.includes(s.status));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      seasons = seasons.filter((s) => s.name.toLowerCase().includes(q) || s.referenceCode?.toLowerCase().includes(q));
    }
    return { seasons, total: seasons.length, page: 1, pageSize: 20 };
  },

  /** Get a single season */
  async getById(id: string): Promise<Season | null> {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (res.ok) return res.json();
    } catch {}
    return DEMO_SEASONS.find((s) => s.id === id) || null;
  },

  /** Get the currently active season */
  async getCurrent(): Promise<Season | null> {
    try {
      const res = await fetch(`${API_BASE}/current`);
      if (res.ok) return res.json();
    } catch {}
    return DEMO_SEASONS.find((s) => s.status === "ACTIVE") || null;
  },

  /** Get season metrics */
  async getMetrics(seasonId: string): Promise<SeasonMetrics | null> {
    try {
      const res = await fetch(`${API_BASE}/${seasonId}/metrics`);
      if (res.ok) return res.json();
    } catch {}
    const season = DEMO_SEASONS.find((s) => s.id === seasonId);
    if (!season) return null;
    return {
      seasonId,
      overallTarget: season.overallTarget,
      totalRaised: season.totalRaised,
      progressPercent: Math.round((season.totalRaised / season.overallTarget) * 100),
      remainingAmount: season.overallTarget - season.totalRaised,
      citiesActive: season.activationScope.cities.filter((c) => c.enabled).length,
      citiesTargeted: season.activationScope.cities.length,
      localAreasActive: 8,
      highStreetsActive: 12,
      businessesActive: 45,
      totalParticipants: season.totalParticipants,
      consumers: season.totalConsumers,
      businessOwners: season.totalBusinessOwners,
      backers: season.totalBackers,
      foundingMembers: season.totalFoundingMembers,
      totalCampaigns: season.activeCampaigns + 23,
      activeCampaigns: season.activeCampaigns,
      completedCampaigns: 23,
      campaignsTargetReached: 18,
      rewardsIssued: 1250,
      leaderboardActive: 12,
    };
  },

  /** Get city activities for a season */
  async getCityActivities(seasonId: string): Promise<SeasonCityActivity[]> {
    try {
      const res = await fetch(`${API_BASE}/${seasonId}/cities`);
      if (res.ok) return res.json();
    } catch {}
    return [
      { id: "ca-1", seasonId, cityId: "london", cityName: "London", target: 8000000, raised: 4200000, contributions: 9500, participants: 2100, status: "ACTIVE" },
      { id: "ca-2", seasonId, cityId: "manchester", cityName: "Manchester", target: 5000000, raised: 2800000, contributions: 6200, participants: 1400, status: "ACTIVE" },
      { id: "ca-3", seasonId, cityId: "birmingham", cityName: "Birmingham", target: 4000000, raised: 1900000, contributions: 4100, participants: 950, status: "ACTIVE" },
      { id: "ca-4", seasonId, cityId: "leeds", cityName: "Leeds", target: 3000000, raised: 1200000, contributions: 2800, participants: 680, status: "ACTIVE" },
    ];
  },

  /** Create a new season */
  async create(payload: CreateSeasonPayload): Promise<Season> {
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {}
    return {
      id: `season-${Date.now()}`,
      ...payload,
      totalRaised: 0, totalContributions: 0, activeCampaigns: 0, totalParticipants: 0,
      totalConsumers: 0, totalBusinessOwners: 0, totalBackers: 0, totalFoundingMembers: 0,
      durationDays: Math.ceil((new Date(payload.endDate).getTime() - new Date(payload.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      createdBy: "admin-current", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  },

  /** Perform a season action */
  async performAction(seasonId: string, action: SeasonAction): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/${seasonId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) return res.json();
    } catch {}
    return { success: true, message: `Season ${action.toLowerCase()}d successfully` };
  },

  /** Get season review */
  async getReview(seasonId: string): Promise<SeasonReview | null> {
    try {
      const res = await fetch(`${API_BASE}/${seasonId}/review`);
      if (res.ok) return res.json();
    } catch {}
    const season = DEMO_SEASONS.find((s) => s.id === seasonId);
    if (!season) return null;
    return {
      seasonId,
      season,
      metrics: await this.getMetrics(seasonId) as any,
      performanceByLevel: [],
      campaignOutcomes: { total: 179, targetReached: 18, exceededTarget: 5, completedBelowTarget: 12, carriedForward: 3, closed: 141, extended: 0 },
      fundingAndSurplus: { totalSeasonFunding: season.totalRaised, fundsAllocated: Math.round(season.totalRaised * 0.85), surplus: Math.round(season.totalRaised * 0.15), fundsAwaitingAllocation: Math.round(season.totalRaised * 0.1), carryForwardAmount: Math.round(season.totalRaised * 0.05), outstandingExceptions: 2 },
      participationBreakdown: { byIdentity: [], byRoute: [], byLocation: [] },
      rewardsAndRecognition: { rewardsIssued: 1250, rewardsQualified: 1800, rewardOpportunitiesActive: 8, rewardOpportunitiesClosed: 4, leaderboardOutcomes: [], recognitionAwarded: 350, campaignIncentivesTriggered: 42 },
      unfinishedItems: [
        { id: "u1", type: "ACTIVE_CAMPAIGN", description: "3 campaigns still active past planned end date", severity: "HIGH" },
        { id: "u2", type: "SURPLUS_AWAITING_ALLOCATION", description: "£2.8M surplus awaiting allocation decision", severity: "MEDIUM" },
      ],
      nextSeasonPrep: { duplicateAvailable: true, carryForwardAvailable: true, configurationReady: false, unresolvedItemsCount: 2 },
    };
  },

  /** Duplicate a season */
  async duplicate(sourceId: string, newName: string, startDate: string, endDate: string): Promise<Season> {
    try {
      const res = await fetch(`${API_BASE}/${sourceId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, startDate, endDate }),
      });
      if (res.ok) return res.json();
    } catch {}
    const source = DEMO_SEASONS.find((s) => s.id === sourceId);
    if (!source) throw new Error("Source season not found");
    return this.create({
      name: newName, programmeName: source.programmeName, description: source.description,
      startDate, endDate, status: "DRAFT",
      overallTarget: source.overallTarget, nationalTarget: source.nationalTarget,
      cityTargetDefault: source.cityTargetDefault, localAreaTargetDefault: source.localAreaTargetDefault,
      highStreetTargetDefault: source.highStreetTargetDefault, businessCampaignTargetDefault: source.businessCampaignTargetDefault,
      activationScope: source.activationScope, participationConfig: source.participationConfig,
      engagementConfig: source.engagementConfig, spilloverConfig: source.spilloverConfig,
      communicationConfig: source.communicationConfig,
    });
  },
};
