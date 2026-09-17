// =============================================================================
// Season Types & Interfaces
// Complete seasonal management system types for FundOrDonate.
// =============================================================================

// =============================================================================
// Season Status Lifecycle
// =============================================================================

export type SeasonStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "CLOSING"
  | "REVIEW"
  | "COMPLETED"
  | "ARCHIVED";

// =============================================================================
// Core Season Interface
// =============================================================================

export interface Season {
  id: string;
  name: string;
  /** Programme name/type if applicable */
  programmeName?: string;
  /** Internal reference code */
  referenceCode?: string;
  description?: string;
  publicDescription?: string;
  internalNotes?: string;

  status: SeasonStatus;
  startDate: string;
  endDate: string;
  durationDays: number;

  // ─── Funding Targets ──────────────────────────────────────────────────
  overallTarget: number;
  nationalTarget: number;
  cityTargetDefault: number;
  localAreaTargetDefault: number;
  highStreetTargetDefault: number;
  businessCampaignTargetDefault: number;

  // ─── Current Metrics (denormalized for quick access) ──────────────────
  totalRaised: number;
  totalContributions: number;
  activeCampaigns: number;
  totalParticipants: number;
  totalConsumers: number;
  totalBusinessOwners: number;
  totalBackers: number;
  totalFoundingMembers: number;

  // ─── Activation Scope ─────────────────────────────────────────────────
  activationScope: SeasonActivationScope;

  // ─── Configuration ────────────────────────────────────────────────────
  participationConfig: SeasonParticipationConfig;
  engagementConfig: SeasonEngagementConfig;
  spilloverConfig: SeasonSpilloverConfig;
  communicationConfig: SeasonCommunicationConfig;

  // ─── Metadata ─────────────────────────────────────────────────────────
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  completedAt?: string;
  archivedAt?: string;
}

// =============================================================================
// Activation Scope
// =============================================================================

export interface SeasonActivationScope {
  nationalEnabled: boolean;
  cities: SeasonCityActivation[];
}

export interface SeasonCityActivation {
  cityId: string;
  cityName: string;
  enabled: boolean;
  localAreas: SeasonLocalAreaActivation[];
}

export interface SeasonLocalAreaActivation {
  localAreaId: string;
  localAreaName: string;
  enabled: boolean;
  highStreets: SeasonHighStreetActivation[];
}

export interface SeasonHighStreetActivation {
  highStreetId: string;
  highStreetName: string;
  enabled: boolean;
  businesses: SeasonBusinessActivation[];
}

export interface SeasonBusinessActivation {
  businessId: string;
  businessName: string;
  enabled: boolean;
}

// =============================================================================
// Participation Config
// =============================================================================

export interface SeasonParticipationConfig {
  /** Which identity types can participate */
  consumerParticipation: boolean;
  businessOwnerParticipation: boolean;
  /** Which participation routes are available */
  backerEnabled: boolean;
  foundingMemberEnabled: boolean;
  foundingMemberMonthlyEnabled: boolean;
  /** Original founding recognition criteria */
  originalFoundingCriteria?: string;
}

// =============================================================================
// Engagement Config
// =============================================================================

export interface SeasonEngagementConfig {
  rewardsEnabled: boolean;
  incentivesEnabled: boolean;
  leaderboardsEnabled: boolean;
  recognitionEnabled: boolean;
  /** Which leaderboard scopes are active */
  leaderboardScopes: LeaderboardScope[];
}

export type LeaderboardScope =
  | "NATIONAL"
  | "CITY"
  | "LOCAL_AREA"
  | "HIGH_STREET"
  | "CAMPAIGN"
  | "COMMUNITY";

// =============================================================================
// Spillover Config
// =============================================================================

export interface SeasonSpilloverConfig {
  /** What happens when a target is reached */
  onTargetReached: SpilloverAction;
  /** What happens to surplus funds */
  surplusHandling: SurplusHandling;
  /** Whether campaigns can extend targets */
  allowTargetExtension: boolean;
  /** Whether activity can carry forward */
  allowCarryForward: boolean;
}

export type SpilloverAction =
  | "CONTINUE_CAMPAIGN"
  | "EXTEND_TARGET"
  | "ACTIVATE_ADDITIONAL_OBJECTIVES"
  | "HOLD_PENDING_ALLOCATION"
  | "CARRY_FORWARD";

export type SurplusHandling =
  | "CARRY_FORWARD_TO_NEXT_SEASON"
  | "ALLOCATE_TO_CONFIGURED_OBJECTIVE"
  | "HOLD_PENDING_ADMIN_ALLOCATION"
  | "DISTRIBUTE_TO_RELATED_CAMPAIGNS";

// =============================================================================
// Communication Config
// =============================================================================

export interface SeasonCommunicationConfig {
  publicTitle?: string;
  publicIntroduction?: string;
  keyMessages?: string;
  seasonalCta?: string;
  announcementContentId?: string;
}

// =============================================================================
// Seasonal Activity Records
// =============================================================================

/** Activity record linking a city to a season */
export interface SeasonCityActivity {
  id: string;
  seasonId: string;
  cityId: string;
  cityName: string;
  campaignId?: string;
  target: number;
  raised: number;
  contributions: number;
  participants: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "INACTIVE";
  activatedAt?: string;
}

/** Activity record linking a local area to a season */
export interface SeasonLocalAreaActivity {
  id: string;
  seasonId: string;
  localAreaId: string;
  localAreaName: string;
  cityId: string;
  campaignId?: string;
  target: number;
  raised: number;
  contributions: number;
  participants: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "INACTIVE";
}

/** Activity record linking a high street to a season */
export interface SeasonHighStreetActivity {
  id: string;
  seasonId: string;
  highStreetId: string;
  highStreetName: string;
  localAreaId: string;
  campaignId?: string;
  target: number;
  raised: number;
  contributions: number;
  participants: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "INACTIVE";
}

/** Activity record linking a business to a season */
export interface SeasonBusinessActivity {
  id: string;
  seasonId: string;
  businessId: string;
  businessName: string;
  highStreetId: string;
  campaignId?: string;
  target: number;
  raised: number;
  contributions: number;
  participants: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "INACTIVE";
}

// =============================================================================
// Seasonal Participation Record
// =============================================================================

export interface SeasonParticipation {
  id: string;
  seasonId: string;
  userId: string;
  /** The user's primary identity type */
  identityType: "CONSUMER" | "BUSINESS_OWNER";
  /** How they participated */
  participationRoute: "BACKER" | "FOUNDING_MEMBER" | "FOUNDING_MEMBER_MONTHLY";
  /** Where they participated */
  locationId?: string;
  locationType?: "NATIONAL" | "CITY" | "LOCAL_AREA" | "HIGH_STREET";
  campaignId?: string;
  totalContributed: number;
  contributionCount: number;
  joinedAt: string;
}

// =============================================================================
// Season Metrics Summary
// =============================================================================

export interface SeasonMetrics {
  seasonId: string;
  /** Funding */
  overallTarget: number;
  totalRaised: number;
  progressPercent: number;
  remainingAmount: number;
  /** Activation */
  citiesActive: number;
  citiesTargeted: number;
  localAreasActive: number;
  highStreetsActive: number;
  businessesActive: number;
  /** Participation */
  totalParticipants: number;
  consumers: number;
  businessOwners: number;
  backers: number;
  foundingMembers: number;
  /** Campaigns */
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  campaignsTargetReached: number;
  /** Engagement */
  rewardsIssued: number;
  leaderboardActive: number;
}

// =============================================================================
// Season Review Data
// =============================================================================

export interface SeasonReview {
  seasonId: string;
  season: Season;
  metrics: SeasonMetrics;
  /** Performance breakdown by activation level */
  performanceByLevel: SeasonLevelPerformance[];
  /** Campaign outcomes classification */
  campaignOutcomes: CampaignOutcomeSummary;
  /** Funding and surplus details */
  fundingAndSurplus: FundingSurplusSummary;
  /** Participation breakdown */
  participationBreakdown: ParticipationBreakdown;
  /** Rewards and recognition review */
  rewardsAndRecognition: RewardsRecognitionSummary;
  /** Unfinished items requiring attention */
  unfinishedItems: UnfinishedItem[];
  /** Next season preparation status */
  nextSeasonPrep: NextSeasonPrep;
}

export interface SeasonLevelPerformance {
  level: "NATIONAL" | "CITY" | "LOCAL_AREA" | "HIGH_STREET" | "BUSINESS";
  locationName?: string;
  target: number;
  raised: number;
  contributions: number;
  participants: number;
  campaignsActive: number;
}

export interface CampaignOutcomeSummary {
  total: number;
  targetReached: number;
  exceededTarget: number;
  completedBelowTarget: number;
  carriedForward: number;
  closed: number;
  extended: number;
}

export interface FundingSurplusSummary {
  totalSeasonFunding: number;
  fundsAllocated: number;
  surplus: number;
  fundsAwaitingAllocation: number;
  carryForwardAmount: number;
  outstandingExceptions: number;
}

export interface ParticipationBreakdown {
  byIdentity: { type: string; count: number; contributed: number }[];
  byRoute: { route: string; count: number; contributed: number }[];
  byLocation: { level: string; name: string; count: number }[];
}

export interface RewardsRecognitionSummary {
  rewardsIssued: number;
  rewardsQualified: number;
  rewardOpportunitiesActive: number;
  rewardOpportunitiesClosed: number;
  leaderboardOutcomes: { scope: string; winner?: string; totalParticipants: number }[];
  recognitionAwarded: number;
  campaignIncentivesTriggered: number;
}

export interface UnfinishedItem {
  id: string;
  type: "ACTIVE_CAMPAIGN" | "PENDING_CONTRIBUTION" | "PENDING_APPROVAL" | "OUTSTANDING_REWARD" | "SURPLUS_AWAITING_ALLOCATION" | "UNRESOLVED_OPERATIONAL";
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  linkedEntityId?: string;
  linkedEntityType?: string;
}

export interface NextSeasonPrep {
  duplicateAvailable: boolean;
  carryForwardAvailable: boolean;
  configurationReady: boolean;
  unresolvedItemsCount: number;
}

// =============================================================================
// Create Season Payload
// =============================================================================

export interface CreateSeasonPayload {
  name: string;
  programmeName?: string;
  referenceCode?: string;
  description?: string;
  publicDescription?: string;
  internalNotes?: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "SCHEDULED";
  overallTarget: number;
  nationalTarget: number;
  cityTargetDefault: number;
  localAreaTargetDefault: number;
  highStreetTargetDefault: number;
  businessCampaignTargetDefault: number;
  activationScope: SeasonActivationScope;
  participationConfig: SeasonParticipationConfig;
  engagementConfig: SeasonEngagementConfig;
  spilloverConfig: SeasonSpilloverConfig;
  communicationConfig: SeasonCommunicationConfig;
}

// =============================================================================
// Season Filter & Query Types
// =============================================================================

export interface SeasonFilters {
  status?: SeasonStatus[];
  timeRange?: "CURRENT" | "UPCOMING" | "PREVIOUS" | "ALL";
  programme?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SeasonListResponse {
  seasons: Season[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// Season Action Types
// =============================================================================

export type SeasonAction =
  | "EDIT"
  | "CONFIGURE"
  | "DUPLICATE"
  | "PREVIEW"
  | "DELETE"
  | "ACTIVATE"
  | "PAUSE"
  | "CLOSE"
  | "COMPLETE"
  | "ARCHIVE"
  | "VIEW_REVIEW";

export interface SeasonActionRequest {
  seasonId: string;
  action: SeasonAction;
  payload?: Record<string, unknown>;
}
