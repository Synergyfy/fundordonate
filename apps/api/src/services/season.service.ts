// =============================================================================
// Season Service — Backend Stub
// Handles season CRUD, lifecycle management, and seasonal activity.
// =============================================================================

import type {
  Season,
  SeasonStatus,
  SeasonMetrics,
  SeasonReview,
  CreateSeasonPayload,
  SeasonFilters,
  SeasonListResponse,
  SeasonActionRequest,
  SeasonCityActivity,
  SeasonLocalAreaActivity,
  SeasonHighStreetActivity,
  SeasonBusinessActivity,
  SeasonParticipation,
} from "@fundordonate/types";

// =============================================================================
// Demo Data
// =============================================================================

const DEMO_SEASONS: Season[] = [
  {
    id: "season-autumn-2026",
    name: "Autumn 2026",
    programmeName: "UK Activation Programme",
    referenceCode: "S26-AUT",
    description: "The autumn 2026 activation season across UK cities, local areas and high streets.",
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
        {
          cityId: "london", cityName: "London", enabled: true,
          localAreas: [
            {
              localAreaId: "westminster", localAreaName: "Westminster", enabled: true,
              highStreets: [
                { highStreetId: "oxford-st", highStreetName: "Oxford Street", enabled: true, businesses: [] },
              ],
            },
          ],
        },
        {
          cityId: "manchester", cityName: "Manchester", enabled: true,
          localAreas: [
            {
              localAreaId: "city-centre", localAreaName: "City Centre", enabled: true,
              highStreets: [
                { highStreetId: "market-st", highStreetName: "Market Street", enabled: true, businesses: [] },
              ],
            },
          ],
        },
        { cityId: "birmingham", cityName: "Birmingham", enabled: true, localAreas: [] },
        { cityId: "leeds", cityName: "Leeds", enabled: true, localAreas: [] },
        { cityId: "bristol", cityName: "Bristol", enabled: false, localAreas: [] },
      ],
    },
    participationConfig: {
      consumerParticipation: true,
      businessOwnerParticipation: true,
      backerEnabled: true,
      foundingMemberEnabled: true,
      foundingMemberMonthlyEnabled: true,
    },
    engagementConfig: {
      rewardsEnabled: true,
      incentivesEnabled: true,
      leaderboardsEnabled: true,
      recognitionEnabled: true,
      leaderboardScopes: ["NATIONAL", "CITY", "LOCAL_AREA", "HIGH_STREET", "CAMPAIGN"],
    },
    spilloverConfig: {
      onTargetReached: "CONTINUE_CAMPAIGN",
      surplusHandling: "CARRY_FORWARD_TO_NEXT_SEASON",
      allowTargetExtension: true,
      allowCarryForward: true,
    },
    communicationConfig: {
      publicTitle: "Autumn 2026 — Fund Or Donate",
      publicIntroduction: "Join thousands of communities raising funds across the UK this autumn.",
      keyMessages: "Every contribution matters. Every community counts.",
      seasonalCta: "Donate Now",
    },
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
    description: "The winter 2026 season — end of year giving campaign.",
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
    totalRaised: 0,
    totalContributions: 0,
    activeCampaigns: 0,
    totalParticipants: 0,
    totalConsumers: 0,
    totalBusinessOwners: 0,
    totalBackers: 0,
    totalFoundingMembers: 0,
    activationScope: { nationalEnabled: true, cities: [] },
    participationConfig: {
      consumerParticipation: true, businessOwnerParticipation: true,
      backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: true,
    },
    engagementConfig: {
      rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true,
      recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY"],
    },
    spilloverConfig: {
      onTargetReached: "EXTEND_TARGET", surplusHandling: "ALLOCATE_TO_CONFIGURED_OBJECTIVE",
      allowTargetExtension: true, allowCarryForward: true,
    },
    communicationConfig: {},
    createdBy: "admin-1",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "season-summer-2026",
    name: "Summer 2026",
    programmeName: "UK Activation Programme",
    referenceCode: "S26-SUM",
    description: "The inaugural summer 2026 launch season.",
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
    totalRaised: 27500000,
    totalContributions: 38000,
    activeCampaigns: 0,
    totalParticipants: 7200,
    totalConsumers: 5100,
    totalBusinessOwners: 2100,
    totalBackers: 5800,
    totalFoundingMembers: 1400,
    activationScope: { nationalEnabled: true, cities: [] },
    participationConfig: {
      consumerParticipation: true, businessOwnerParticipation: true,
      backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: false,
    },
    engagementConfig: {
      rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true,
      recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY"],
    },
    spilloverConfig: {
      onTargetReached: "CONTINUE_CAMPAIGN", surplusHandling: "CARRY_FORWARD_TO_NEXT_SEASON",
      allowTargetExtension: true, allowCarryForward: true,
    },
    communicationConfig: {},
    createdBy: "admin-1",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-08-31T23:59:59Z",
    completedAt: "2026-08-31T23:59:59Z",
  },
];

const DEMO_CITY_ACTIVITIES: SeasonCityActivity[] = [
  { id: "ca-1", seasonId: "season-autumn-2026", cityId: "london", cityName: "London", campaignId: "camp-london-autumn", target: 8000000, raised: 4200000, contributions: 9500, participants: 2100, status: "ACTIVE", activatedAt: "2026-09-01T00:00:00Z" },
  { id: "ca-2", seasonId: "season-autumn-2026", cityId: "manchester", cityName: "Manchester", campaignId: "camp-manchester-autumn", target: 5000000, raised: 2800000, contributions: 6200, participants: 1400, status: "ACTIVE", activatedAt: "2026-09-01T00:00:00Z" },
  { id: "ca-3", seasonId: "season-autumn-2026", cityId: "birmingham", cityName: "Birmingham", target: 4000000, raised: 1900000, contributions: 4100, participants: 950, status: "ACTIVE", activatedAt: "2026-09-05T00:00:00Z" },
  { id: "ca-4", seasonId: "season-autumn-2026", cityId: "leeds", cityName: "Leeds", target: 3000000, raised: 1200000, contributions: 2800, participants: 680, status: "ACTIVE", activatedAt: "2026-09-10T00:00:00Z" },
];

// =============================================================================
// Service Methods
// =============================================================================

export const seasonService = {
  /** List seasons with filters */
  async list(filters?: SeasonFilters): Promise<SeasonListResponse> {
    let seasons = [...DEMO_SEASONS];
    if (filters?.status?.length) {
      seasons = seasons.filter((s) => filters.status!.includes(s.status));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      seasons = seasons.filter(
        (s) => s.name.toLowerCase().includes(q) || s.referenceCode?.toLowerCase().includes(q)
      );
    }
    return { seasons, total: seasons.length, page: 1, pageSize: 20 };
  },

  /** Get a single season by ID */
  async getById(id: string): Promise<Season | null> {
    return DEMO_SEASONS.find((s) => s.id === id) || null;
  },

  /** Get the currently active season */
  async getCurrent(): Promise<Season | null> {
    return DEMO_SEASONS.find((s) => s.status === "ACTIVE") || null;
  },

  /** Get season metrics */
  async getMetrics(seasonId: string): Promise<SeasonMetrics | null> {
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
      localAreasActive: season.activationScope.cities.reduce(
        (sum, c) => sum + c.localAreas.filter((la) => la.enabled).length, 0
      ),
      highStreetsActive: season.activationScope.cities.reduce(
        (sum, c) => sum + c.localAreas.reduce(
          (laSum, la) => laSum + la.highStreets.filter((hs) => hs.enabled).length, 0
        ), 0
      ),
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
    return DEMO_CITY_ACTIVITIES.filter((a) => a.seasonId === seasonId);
  },

  /** Create a new season */
  async create(payload: CreateSeasonPayload): Promise<Season> {
    const newSeason: Season = {
      id: `season-${Date.now()}`,
      ...payload,
      totalRaised: 0,
      totalContributions: 0,
      activeCampaigns: 0,
      totalParticipants: 0,
      totalConsumers: 0,
      totalBusinessOwners: 0,
      totalBackers: 0,
      totalFoundingMembers: 0,
      durationDays: Math.ceil(
        (new Date(payload.endDate).getTime() - new Date(payload.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
      createdBy: "admin-current",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    DEMO_SEASONS.push(newSeason);
    return newSeason;
  },

  /** Update a season */
  async update(id: string, updates: Partial<Season>): Promise<Season | null> {
    const idx = DEMO_SEASONS.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    DEMO_SEASONS[idx] = { ...DEMO_SEASONS[idx], ...updates, updatedAt: new Date().toISOString() };
    return DEMO_SEASONS[idx];
  },

  /** Perform a season action */
  async performAction(request: SeasonActionRequest): Promise<{ success: boolean; message: string }> {
    const season = DEMO_SEASONS.find((s) => s.id === request.seasonId);
    if (!season) return { success: false, message: "Season not found" };

    switch (request.action) {
      case "ACTIVATE":
        season.status = "ACTIVE";
        season.activatedAt = new Date().toISOString();
        break;
      case "CLOSE":
        season.status = "CLOSING";
        break;
      case "COMPLETE":
        season.status = "COMPLETED";
        season.completedAt = new Date().toISOString();
        break;
      case "ARCHIVE":
        season.status = "ARCHIVED";
        season.archivedAt = new Date().toISOString();
        break;
      case "DELETE":
        if (season.status === "ACTIVE") return { success: false, message: "Cannot delete active season" };
        break;
    }
    season.updatedAt = new Date().toISOString();
    return { success: true, message: `Season ${request.action.toLowerCase()}d successfully` };
  },

  /** Get season review data */
  async getReview(seasonId: string): Promise<SeasonReview | null> {
    const season = DEMO_SEASONS.find((s) => s.id === seasonId);
    if (!season) return null;
    return {
      seasonId,
      season,
      metrics: await this.getMetrics(seasonId) as SeasonMetrics,
      performanceByLevel: [
        { level: "NATIONAL", target: season.nationalTarget, raised: Math.round(season.totalRaised * 0.2), contributions: Math.round(season.totalContributions * 0.15), participants: Math.round(season.totalParticipants * 0.1), campaignsActive: 5 },
        { level: "CITY", target: season.overallTarget - season.nationalTarget, raised: Math.round(season.totalRaised * 0.8), contributions: Math.round(season.totalContributions * 0.85), participants: Math.round(season.totalParticipants * 0.9), campaignsActive: season.activeCampaigns },
      ],
      campaignOutcomes: { total: 179, targetReached: 18, exceededTarget: 5, completedBelowTarget: 12, carriedForward: 3, closed: 141, extended: 0 },
      fundingAndSurplus: { totalSeasonFunding: season.totalRaised, fundsAllocated: Math.round(season.totalRaised * 0.85), surplus: Math.round(season.totalRaised * 0.15), fundsAwaitingAllocation: Math.round(season.totalRaised * 0.1), carryForwardAmount: Math.round(season.totalRaised * 0.05), outstandingExceptions: 2 },
      participationBreakdown: {
        byIdentity: [{ type: "Consumer", count: season.totalConsumers, contributed: Math.round(season.totalRaised * 0.6) }, { type: "Business Owner", count: season.totalBusinessOwners, contributed: Math.round(season.totalRaised * 0.4) }],
        byRoute: [{ route: "Backer", count: season.totalBackers, contributed: Math.round(season.totalRaised * 0.7) }, { route: "Founding Member", count: season.totalFoundingMembers, contributed: Math.round(season.totalRaised * 0.3) }],
        byLocation: [{ level: "City", name: "London", count: 2100 }, { level: "City", name: "Manchester", count: 1400 }],
      },
      rewardsAndRecognition: { rewardsIssued: 1250, rewardsQualified: 1800, rewardOpportunitiesActive: 8, rewardOpportunitiesClosed: 4, leaderboardOutcomes: [], recognitionAwarded: 350, campaignIncentivesTriggered: 42 },
      unfinishedItems: [
        { id: "u1", type: "ACTIVE_CAMPAIGN", description: "3 campaigns still active past planned end date", severity: "HIGH" },
        { id: "u2", type: "SURPLUS_AWAITING_ALLOCATION", description: "£2.8M surplus awaiting allocation decision", severity: "MEDIUM" },
      ],
      nextSeasonPrep: { duplicateAvailable: true, carryForwardAvailable: true, configurationReady: false, unresolvedItemsCount: 2 },
    };
  },

  /** Duplicate a season for a new season */
  async duplicate(sourceSeasonId: string, newName: string, newStartDate: string, newEndDate: string): Promise<Season> {
    const source = DEMO_SEASONS.find((s) => s.id === sourceSeasonId);
    if (!source) throw new Error("Source season not found");
    return this.create({
      name: newName,
      programmeName: source.programmeName,
      description: source.description,
      startDate: newStartDate,
      endDate: newEndDate,
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
