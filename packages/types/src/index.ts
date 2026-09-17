// =============================================================================
// Domain Constants — single source of truth
// =============================================================================
export * from "./constants";

// =============================================================================
// Season Types
// =============================================================================
export type {
  Season,
  SeasonActivationScope,
  SeasonCityActivation,
  SeasonLocalAreaActivation,
  SeasonHighStreetActivation,
  SeasonBusinessActivation,
  SeasonParticipationConfig,
  SeasonEngagementConfig,
  SeasonSpilloverConfig,
  SurplusHandling,
  SeasonCommunicationConfig,
  SeasonCityActivity,
  SeasonLocalAreaActivity,
  SeasonHighStreetActivity,
  SeasonBusinessActivity,
  SeasonParticipation,
  SeasonMetrics,
  SeasonReview,
  SeasonLevelPerformance,
  CampaignOutcomeSummary,
  FundingSurplusSummary,
  ParticipationBreakdown,
  RewardsRecognitionSummary,
  UnfinishedItem,
  NextSeasonPrep,
  CreateSeasonPayload,
  SeasonFilters,
  SeasonListResponse,
  SeasonAction,
  SeasonActionRequest,
} from "./season";

import type { CampaignHierarchyLevel, CampaignMode, CampaignStatus } from "./constants";

// =============================================================================
// Shared Utilities
// =============================================================================
export * from "./utils";

// =============================================================================
// Legacy Type Aliases (backward compatibility)
// These are string literal types used in interfaces below.
// The constants.ts file provides the runtime values.
// =============================================================================

export type UserRole = "admin" | "fundraiser" | "collaborator" | "backer" | "donor";

export type TransactionAction = "credit" | "debit";

export type TransactionType =
  | "earning"
  | "platform_fee"
  | "withdrawal_request"
  | "withdrawal_approval"
  | "withdrawal_rejection";

export type PayoutMethod = "paypal" | "bank" | "others";

export type CommentStatus = "approved" | "pending" | "spam";

export type RewardStatus = "active" | "inactive";

export type FundStatus = "active" | "inactive";

export type TributeType = "in_honor" | "in_memory";

// =============================================================================
// Core Models
// =============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  userType?: string;
  businessId?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignImage {
  id: string;
  url: string;
  alt?: string | null;
  order: number;
  createdAt: Date;
}

export interface CampaignTag {
  id: string;
  campaignId: string;
  tagId: string;
  tag?: Tag;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  goalAmount: number;
  raisedAmount: number;
  campaignTarget?: number | null;
  ownerContribution?: number | null;
  deadline: Date;
  featuredImage?: string | null;
  videoUrl?: string | null;
  mode: CampaignMode;
  status: CampaignStatus;
  creatorType?: string;
  platformFee?: number | null;
  settings?: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: User;
  categoryId?: string | null;
  category?: Category;
  fundId?: string | null;
  fund?: Fund;
  fundraiserId?: string | null;
  shareCode?: string | null;

  // Campaign Hierarchy
  parentId?: string | null;
  parent?: Campaign | null;
  children?: Campaign[];

  // Campaign Hierarchy Level
  hierarchyLevel?: CampaignHierarchyLevel | null;
  locationId?: string | null;

  // Campaign Context
  location?: string | null;
  isEvergreen?: boolean;

  // Participation Configuration
  participationTypes?: string; // JSON array: ["fund","donate","sponsor"]
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;

  // Self-Funding Configuration
  selfFundingLevel?: string | null;
  isSelfFunding?: boolean;

  // ── Reward Configuration ──
  qualificationMode?: string; // "highest" | "cumulative"
  hasRewards?: boolean;

  // Taxonomy
  campaignTypeId?: string | null;
  campaignType?: CampaignType | null;
  seasonId?: string | null;
  season?: CampaignSeason | null;
  membershipPlanId?: string | null;
  membershipPlan?: MembershipPlan | null;

  // Computed / Joined
  images?: CampaignImage[];
  tags?: CampaignTag[];
  rewards?: Reward[];
  rewardEntitlements?: RewardEntitlement[];
  _count?: { donations: number; pledges: number; comments?: number; bookmarks?: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Fund {
  id: string;
  title: string;
  description?: string | null;
  isDefault: boolean;
  status: string;
}

export interface Donation {
  id: string;
  uid: string;
  amount: number;
  recoveryFee: number;
  processingFee: number;
  tributeType?: string | null;
  tributeSalutation?: string | null;
  tributeTo?: string | null;
  tributeNotificationEmail?: string | null;
  tributeNotificationMessage?: string | null;
  notes?: string | null;
  status: string;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
  isAnonymous: boolean;
  isManual: boolean;
  contributionType: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  campaign?: Campaign;
  userId?: string | null;
  user?: User | null;
  // Hierarchy attribution
  hierarchyLevel?: CampaignHierarchyLevel | null;
  locationId?: string | null;
  parentCampaignId?: string | null;
}

export interface Pledge {
  id: string;
  uid: string;
  amount: number;
  bonusSupportAmount: number;
  shippingCost: number;
  recoveryFee: number;
  processingFee: number;
  pledgeOption?: string | null;
  notes?: string | null;
  status: string;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  isManual: boolean;
  rewardInfo: string;
  userInfo: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  campaign?: Campaign;
  userId?: string | null;
  user?: User;
  rewardId?: string | null;
  reward?: Reward;
  // Hierarchy attribution
  hierarchyLevel?: CampaignHierarchyLevel | null;
  locationId?: string | null;
  parentCampaignId?: string | null;
}

export interface Reward {
  id: string;
  title: string;
  description?: string | null;
  campaignId: string;
  order: number;

  // ── Trigger ──
  triggerType: string; // "contribution"
  triggerConfig: RewardTriggerConfig;

  // ── Audience ──
  audience: string; // "business" | "consumer" | "both"

  // ── Availability ──
  quantityType: string; // "unlimited" | "limited"
  quantityLimit?: number | null;
  quantityClaimed: number;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  claimDeadlineDays: number;

  // ── Fulfilment ──
  fulfilmentType: string; // "internal" | "mcom_vcard" | "external_link" | "webhook" | "manual" | "instruction"
  fulfilmentConfig?: RewardFulfilmentConfig | null;

  // ── Display & Type ──
  image?: string | null;
  rewardType: string; // "standard" | "ecard" | "cashback" | "points" | "discount"
  currency: string;

  // ── Status ──
  status: string;
  createdAt: Date;
  updatedAt: Date;

  // ── Relations ──
  campaign?: Campaign;
  items?: RewardItem[];
  entitlements?: RewardEntitlement[];
}

export interface RewardTriggerConfig {
  mode: "min" | "range" | "exact";
  min?: number; // pence
  max?: number; // pence
  exact?: number; // pence
}

export interface RewardFulfilmentConfig {
  url?: string;
  webhookUrl?: string;
  instructions?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;

  // ── Item Type ──
  physicalType: string; // "physical" | "digital"

  // ── Digital Asset ──
  assetType?: string | null; // "file" | "url"
  assetUrl?: string | null;
  assetFileName?: string | null;

  // ── Quantity & Order ──
  quantity: number;
  order: number;

  createdAt: Date;
  updatedAt: Date;

  // ── Relations ──
  rewardId: string;
  reward?: Reward;
}

export interface RewardEntitlement {
  id: string;
  userId: string;
  rewardId: string;
  campaignId: string;

  // ── Trigger Context ──
  triggerValue: Record<string, unknown>;

  // ── Lifecycle ──
  status: string; // "earned" | "claimed" | "fulfilled" | "expired"
  earnedAt: Date;
  claimedAt?: Date | null;
  fulfilledAt?: Date | null;
  expiresAt?: Date | null;

  // ── Fulfilment Reference ──
  claimReference?: string | null;

  createdAt: Date;
  updatedAt: Date;

  // ── Relations ──
  user?: User;
  reward?: Reward;
  campaign?: Campaign;
}

export interface CampaignPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  authorId: string;
  author?: User;
}

export interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  userId: string;
  user?: User;
  parentId?: string | null;
}

export interface Bookmark {
  id: string;
  createdAt: Date;
  campaignId: string;
  userId: string;
}

export interface Wallet {
  id: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface WalletTransaction {
  id: string;
  uid: string;
  amount: number;
  type: string;
  referenceId?: string | null;
  referenceType?: string | null;
  note?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  walletId: string;
  wallet?: Wallet;
  campaignId?: string | null;
  pledgeId?: string | null;
  donationId?: string | null;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  amount: number;
  status: string;
  note?: string | null;
  method?: string | null;
  attachment?: string | null;
  payoutInfo: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  userId: string;
  user?: User;
  items?: WithdrawalItem[];
}

export interface WithdrawalItem {
  id: string;
  amount: number;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
  withdrawalRequestId: string;
  campaignId: string;
  campaign?: Campaign;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  tier: string;
  level: string;
  description?: string | null;
  price: number;
  duration: number | null;
  status: string;
  order: number;
  entitlements: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMembership {
  id: string;
  status: string;
  startDate: Date;
  endDate?: Date | null;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
  planId: string;
  plan?: MembershipPlan;
}

export interface CampaignType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  // Opportunity Configuration
  isOpportunity?: boolean;
  eligibleTiers?: string; // JSON array
  eligibleLevels?: string; // JSON array
  parentInitiative?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSeason {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpilloverRule {
  id: string;
  /** Campaign this rule applies to (null = season-wide default) */
  campaignId?: string | null;
  /** Season this rule applies to (null = global default) */
  seasonId?: string | null;
  /** What action to take with surplus */
  action: string;
  /** Priority order when multiple rules apply (lower = higher priority) */
  priority: number;
  /** Minimum percentage of target that must be reached before spillover activates (0-100) */
  thresholdPercentage: number;
  /** Percentage of surplus to apply this rule to (0-100). Remaining surplus cascades to next rule. */
  allocationPercentage: number;
  /** Campaign ID to redistribute to (for REDISTRIBUTE_NEXT action) */
  targetCampaignId?: string | null;
  /** Season ID to hold surplus for (for HOLD_FOR_NEXT_SEASON action) */
  targetSeasonId?: string | null;
  /** Whether this rule is currently enabled */
  isEnabled: boolean;
  /** Human-readable description of this rule */
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurplusRecord {
  id: string;
  campaignId: string;
  /** Original campaign goal amount in pence */
  goalAmount: number;
  /** Total raised amount in pence */
  raisedAmount: number;
  /** Surplus amount in pence (raised - goal) */
  surplusAmount: number;
  /** How the surplus was handled */
  action: string;
  /** Target campaign/season for redistribution */
  targetId?: string | null;
  /** Amount redistributed in pence */
  redistributedAmount: number;
  /** Status of the surplus handling */
  status: string;
  createdAt: Date;
}

export interface SeasonTransitionConfig {
  /** How the season ends */
  trigger: string;
  /** Auto-transition to next season when this one ends */
  autoTransitionToNext: boolean;
  /** Default spillover action for campaigns in this season */
  defaultSpilloverAction: string;
  /** Review period in days after season ends before finalizing */
  reviewPeriodDays: number;
  /** Whether to auto-allocate surplus based on rules */
  autoAllocateSurplus: boolean;
}

export interface SeasonTransitionLog {
  id: string;
  seasonId: string;
  /** What triggered the transition */
  trigger: string;
  /** Campaigns affected */
  affectedCampaignCount: number;
  /** Total surplus distributed */
  totalSurplusDistributed: number;
  /** Actions taken */
  actions: {
    campaignId: string;
    campaignTitle: string;
    action: string;
    amount: number;
    targetId?: string;
  }[];
  /** Admin who initiated (if manual) */
  initiatedBy?: string | null;
  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  /** Badge type: BACKER, FOUNDING_MEMBER, ORIGINAL_FOUNDING, MONTHLY_FOUNDING, MEMBERSHIP */
  type: string;
  /** For backer badges: the tier (BACKER/CITY/NATIONAL) */
  tier?: string | null;
  /** For founding badges: the programme ID */
  programmeId?: string | null;
  /** Location this badge is associated with */
  locationId?: string | null;
  /** Location name for display */
  locationName?: string | null;
  /** Campaign that triggered this badge */
  sourceCampaignId?: string | null;
  /** Whether this is an Original Founding Member badge */
  isOriginal?: boolean;
  /** Monthly founding: subscription ID */
  subscriptionId?: string | null;
  /** Badge awarded date */
  awardedAt: Date;
  /** Badge expiry (null = permanent) */
  expiresAt?: Date | null;
}

export interface BackerStatusRecord {
  id: string;
  userId: string;
  statusType: string;
  sourceCampaignId: string;
  locationId?: string | null;
  locationName?: string | null;
  cityCount?: number;
  grantedAt: Date;
  visibility: string;
  metadata?: Record<string, unknown>;
}

export interface FoundingMembershipRecord {
  id: string;
  userId: string;
  programmeId: string;
  locationId: string;
  locationName?: string;
  campaignId?: string | null;
  status: string;
  contributionAmount: number;
  isOriginal: boolean;
  isMonthly: boolean;
  grantedAt: Date;
  expiresAt?: Date | null;
  benefits: string[];
}

export interface ContributorProfile {
  userId: string;
  /** Backer tier (BACKER/CITY/NATIONAL or null) */
  backerTier: string | null;
  /** Total number of campaigns backed */
  totalCampaignsBacked: number;
  /** Total amount contributed in pence */
  totalContributed: number;
  /** Cities where user has backer status */
  citiesBacked: string[];
  /** Founding memberships */
  foundingMemberships: FoundingMembershipRecord[];
  /** All badges earned */
  badges: UserBadge[];
  /** Whether user is an Original Founding Member anywhere */
  isOriginalFoundingMember: boolean;
  /** Monthly founding memberships */
  monthlyMemberships: FoundingMembershipRecord[];
}

export interface CampaignGroup {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignEvent {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalReference {
  id: string;
  provider: string;
  entityType: string;
  entityId: string;
  externalId: string;
  externalData: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignShare {
  id: string;
  code: string;
  shareType: string;
  source?: string | null;
  metadata: string;
  createdAt: Date;
  campaignId: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

export interface EmailVerificationToken {
  id: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// MCOM Integration
// =============================================================================

export interface ShareUrlData {
  campaignSlug: string;
  shareCode: string;
  baseUrl: string;
}

export interface QRCodeData {
  url: string;
  campaignSlug: string;
  shareCode: string;
}

export interface CentralHubConfig {
  baseUrl: string;
  apiVersion: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  enabled: boolean;
}

export interface CentralHubUserInfo {
  externalId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessId?: string;
  businessName?: string;
}

export interface CentralHubAuthResult {
  success: boolean;
  user?: CentralHubUserInfo;
  error?: string;
}

export interface VCardConfig {
  baseUrl: string;
  apiVersion: string;
  apiKey: string;
  enabled: boolean;
}

export interface VCardEcardRequest {
  campaignId: string;
  rewardId: string;
  donorUserId: string;
  statedValue: number;
  benefitValue: number;
  currency: string;
  idempotencyKey: string;
}

export interface VCardEcardResponse {
  success: boolean;
  ecardId?: string;
  status?: string;
  error?: string;
}

export interface VCardEcardStatus {
  ecardId: string;
  status: "pending" | "created" | "active" | "failed" | "revoked" | "cancelled";
  activatedAt?: Date;
  expiresAt?: Date;
}

export interface TerminalConfig {
  baseUrl: string;
  apiVersion: string;
  merchantId: string;
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export interface TerminalPaymentRequest {
  amount: number;
  currency: string;
  campaignId: string;
  contributionType: "owner" | "external";
  description?: string;
  reference?: string;
  idempotencyKey: string;
}

export interface TerminalPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  clientSecret?: string;
  error?: string;
}

export interface TerminalWebhookEvent {
  eventId: string;
  eventType: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: Date;
  signature: string;
  data: Record<string, unknown>;
}

export interface TerminalWebhookResult {
  processed: boolean;
  donationId?: string;
  error?: string;
}

// =============================================================================
// Leaderboard (Batch 5)
// =============================================================================

export interface LeaderboardEntry {
  id: string;
  userId: string;
  rank: number;
  totalContributed: number;
  campaignCount: number;
  locationId?: string;
  locationName?: string;
  hierarchyLevel?: string;
  /** For urgency-based leaderboards */
  qualificationStatus?: string;
  qualifiedAt?: Date;
  qualificationExpiresAt?: Date;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    username: string;
  };
  backerTier?: string;
  isOriginalFoundingMember?: boolean;
}

export interface Leaderboard {
  id: string;
  scope: string;
  scopeId?: string;
  scopeName?: string;
  totalEntries: number;
  lastUpdated: Date;
  entries: LeaderboardEntry[];
}

export interface LeaderboardConfig {
  id: string;
  scope: string;
  scopeId?: string;
  maxEntries: number;
  /** For urgency-based: number of qualifying spots */
  qualificationLimit?: number;
  /** For urgency-based: time window for qualification */
  qualificationWindowHours?: number;
  /** Reward given on qualification */
  qualificationReward?: string;
  isActive: boolean;
}

// =============================================================================
// Campaign Templates (Batch 5)
// =============================================================================

export interface CampaignTemplate {
  id: string;
  type: string;
  title: string;
  description?: string;
  shortDescription?: string;
  mode: string;
  categorySlug?: string;
  goalAmount: number;
  deadlineDays: number;
  /** Template content structure */
  contentStructure?: Record<string, unknown>;
  /** Benefits configured for this template */
  benefitsConfig?: Record<string, unknown>;
  /** Reward template */
  rewardConfig?: Record<string, unknown>;
  status: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  /** Number of times this template has been instantiated */
  instantiatedCount: number;
}

export interface CampaignTemplateInstance {
  id: string;
  templateId: string;
  campaignId: string;
  locationId: string;
  locationName?: string;
  instantiatedAt: Date;
  template?: CampaignTemplate;
  campaign?: Campaign;
}

// =============================================================================
// City/Borough Rewards (Batch 5)
// =============================================================================

export interface CityReward {
  id: string;
  cityLocationId: string;
  cityName: string;
  title: string;
  description: string;
  type: string;
  trigger: string;
  /** Minimum contribution amount to qualify (pence) */
  minContributionPence?: number;
  /** Minimum campaign count to qualify */
  minCampaignCount?: number;
  /** Badge icon/type */
  badgeIcon?: string;
  /** Badge color scheme */
  badgeColor?: string;
  /** Points value */
  pointsValue?: number;
  /** Whether this reward is active */
  isActive: boolean;
  /** How many times this reward has been granted */
  grantedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoroughReward {
  id: string;
  boroughLocationId: string;
  boroughName: string;
  title: string;
  description: string;
  type: string;
  trigger: string;
  minContributionPence?: number;
  minCampaignCount?: number;
  badgeIcon?: string;
  badgeColor?: string;
  pointsValue?: number;
  isActive: boolean;
  grantedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardGrant {
  id: string;
  userId: string;
  rewardId: string;
  rewardType: string;
  locationId?: string;
  locationName?: string;
  campaignId?: string;
  grantedAt: Date;
  /** Whether this has been claimed/used */
  claimed: boolean;
  claimedAt?: Date;
  reward?: CityReward | BoroughReward;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    username: string;
  };
}

// =============================================================================
// Physical Integration & Cross-Channel (Batch 6)
// =============================================================================

export interface Terminal {
  id: string;
  locationId: string;
  locationName?: string;
  businessId?: string;
  businessName?: string;
  deviceId: string;
  status: string;
  lastSeenAt?: Date;
  firmwareVersion?: string;
  /** Campaigns available for selection on this terminal */
  campaignIds: string[];
  /** Terminal configuration */
  config?: {
    allowCustomAmount: boolean;
    presetAmounts: number[];
    showCampaignDetails: boolean;
    receiptPrintEnabled: boolean;
  };
}

export interface TerminalDonation {
  id: string;
  terminalId: string;
  campaignId: string;
  amount: number;
  currency: string;
  /** Customer identification (email, phone, or VCard ID) */
  customerIdentifier?: string;
  customerId?: string;
  /** Channel: terminal, qr, in_store */
  channel: string;
  /** Receipt number */
  receiptNumber?: string;
  /** Whether customer opted for gift aid */
  giftAid: boolean;
  status: string;
  createdAt: Date;
}

export interface QrCode {
  id: string;
  campaignId: string;
  locationId?: string;
  /** URL the QR code points to */
  url: string;
  /** Static or dynamic QR */
  type: string;
  /** Number of scans */
  scanCount: number;
  /** Number of conversions (donations) */
  conversionCount: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CrossChannelContribution {
  id: string;
  userId: string;
  campaignId: string;
  amount: number;
  channel: string;
  /** Original channel where contribution was made */
  originalChannel: string;
  /** Linked via email, phone, or VCard */
  linkedVia?: string;
  /** Whether this was merged from another channel */
  mergedFromChannel?: string;
  createdAt: Date;
}

export interface LifetimeStats {
  userId: string;
  totalContributed: number;
  totalCampaignsBacked: number;
  totalPledges: number;
  /** Breakdown by channel */
  channelBreakdown: {
    web: number;
    terminal: number;
    qr: number;
    in_store: number;
    vcard: number;
    mobile_app: number;
  };
  /** Breakdown by hierarchy level */
  hierarchyBreakdown: {
    national: number;
    city: number;
    borough: number;
    high_street: number;
    business: number;
  };
  /** First contribution date */
  firstContributionAt?: Date;
  /** Most recent contribution date */
  lastContributionAt?: Date;
  /** Number of unique locations backed */
  uniqueLocationsBacked: number;
  /** Community Backer status (in-store recognition) */
  isCommunityBacker: boolean;
  communityBackerAwardedAt?: Date;
}

export interface VCardRecognition {
  id: string;
  userId: string;
  vcardId?: string;
  recognitionLevel: string;
  /** What triggered this recognition */
  trigger: string;
  /** Associated campaign */
  campaignId?: string;
  /** Associated location */
  locationId?: string;
  /** Recognition details */
  details: {
    badgeIcon?: string;
    badgeColor?: string;
    title: string;
    description: string;
    pointsAwarded?: number;
  };
  awardedAt: Date;
  /** When this was displayed/scanned at a terminal */
  displayedAt?: Date;
}

export interface DonationGatedReward {
  id: string;
  /** The reward to unlock */
  rewardId: string;
  rewardTitle: string;
  rewardDescription: string;
  /** Minimum donation amount to unlock (pence) */
  minDonationPence: number;
  /** Campaign(s) that qualify for this reward */
  campaignIds?: string[];
  /** Location(s) that qualify */
  locationIds?: string[];
  /** Time window for qualification */
  windowStart?: Date;
  windowEnd?: Date;
  /** How many have been unlocked */
  unlockedCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PhysicalRewardJourney {
  id: string;
  userId: string;
  rewardId: string;
  /** Online qualification status */
  onlineQualified: boolean;
  onlineQualifiedAt?: Date;
  /** Physical redemption status */
  physicalRedeemed: boolean;
  physicalRedeemedAt?: Date;
  /** Business where redemption happens */
  redemptionBusinessId?: string;
  redemptionBusinessName?: string;
  /** QR code for redemption */
  redemptionQrCode?: string;
  /** Overall status */
  status: string;
  /** Expiry date */
  expiresAt?: Date;
  createdAt: Date;
}

export interface McomReward {
  id: string;
  userId: string;
  trigger: string;
  pointsAwarded: number;
  /** Campaign that triggered this reward */
  campaignId?: string;
  /** Location that triggered this reward */
  locationId?: string;
  /** Whether points have been redeemed */
  redeemed: boolean;
  redeemedAt?: Date;
  /** Reward details */
  details: {
    title: string;
    description: string;
    category: string;
  };
  awardedAt: Date;
}

export interface InStoreDonationPrompt {
  id: string;
  businessId: string;
  businessName: string;
  locationId: string;
  /** Campaigns to display */
  campaigns: {
    id: string;
    title: string;
    shortDescription?: string;
    featuredImage?: string;
    goalAmount: number;
    raisedAmount: number;
    mode: string;
  }[];
  /** Preset donation amounts */
  presetAmounts: number[];
  /** Custom amount allowed */
  allowCustomAmount: boolean;
  /** Thank you message */
  thankYouMessage?: string;
  /** Whether to show gift aid option */
  showGiftAid: boolean;
  isActive: boolean;
}

// =============================================================================
// Location Data & Target Calculation (Batch 7)
// =============================================================================

export interface LocationMetrics {
  id: string;
  locationId: string;
  locationName?: string;
  /** Population (from census/ONS) */
  population?: number;
  /** Population density (people per sq km) */
  density?: number;
  /** Area size in square kilometers */
  areaSize?: number;
  /** Economic index (0-100, higher = more affluent) */
  economicIndex?: number;
  /** Activity level (0-100, based on current engagement) */
  activityLevel?: number;
  /** Number of active campaigns */
  activeCampaignCount?: number;
  /** Number of registered users */
  registeredUsers?: number;
  /** Number of founding members */
  foundingMemberCount?: number;
  /** Data source */
  dataSource?: string;
  /** When metrics were last updated */
  lastUpdated?: Date;
  /** When metrics were last verified */
  lastVerified?: Date;
}

export interface TargetCalculation {
  id: string;
  locationId: string;
  locationName?: string;
  /** The calculated target amount (pence) */
  calculatedTarget: number;
  /** Manual override target (if admin has overridden) */
  overrideTarget?: number;
  /** Final target used (calculated or override) */
  finalTarget: number;
  /** Calculation method used */
  calculationMethod: string;
  /** Status of the calculation */
  status: string;
  /** Weights used in calculation */
  weights: {
    population: number;
    density: number;
    areaSize: number;
    economicIndex: number;
    activityLevel: number;
  };
  /** Input values used */
  inputs: {
    population?: number;
    density?: number;
    areaSize?: number;
    economicIndex?: number;
    activityLevel?: number;
  };
  /** Admin notes for override */
  overrideReason?: string;
  /** Who approved the target */
  approvedBy?: string;
  /** When the target was approved */
  approvedAt?: Date;
  /** When the calculation was made */
  calculatedAt: Date;
  /** When the calculation was last updated */
  updatedAt: Date;
}

export interface TargetCalculationConfig {
  id: string;
  /** Global weights for target calculation */
  defaultWeights: {
    population: number;
    density: number;
    areaSize: number;
    economicIndex: number;
    activityLevel: number;
  };
  /** Minimum target amount (pence) */
  minTarget: number;
  /** Maximum target amount (pence) */
  maxTarget: number;
  /** Population multiplier base */
  populationMultiplier: number;
  /** Density multiplier base */
  densityMultiplier: number;
  /** Economic index multiplier base */
  economicMultiplier: number;
  /** Whether to enable automatic calculation */
  autoCalculationEnabled: boolean;
  /** How often to recalculate (in hours) */
  recalculationIntervalHours: number;
  /** Last time calculation was run */
  lastCalculatedAt?: Date;
}

export interface BulkImportRow {
  /** Location name or ID */
  location: string;
  /** Population */
  population?: number;
  /** Density */
  density?: number;
  /** Area size */
  areaSize?: number;
  /** Economic index */
  economicIndex?: number;
  /** Status: success, error, skipped */
  status: string;
  /** Error message if any */
  error?: string;
  /** Matched location ID */
  locationId?: string;
}

export interface BulkImportResult {
  /** Total rows processed */
  totalRows: number;
  /** Rows successfully imported */
  successCount: number;
  /** Rows with errors */
  errorCount: number;
  /** Rows skipped (location not found) */
  skippedCount: number;
  /** Detailed results per row */
  results: BulkImportRow[];
  /** When the import was completed */
  completedAt: Date;
}
