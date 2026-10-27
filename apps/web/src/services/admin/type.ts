// =============================================================================
// ADMIN DASHBOARD & STATISTICS
// =============================================================================

/**
 * Shape returned by `GET /admin/stats`.
 *
 * Amounts are in minor units (pence). The legacy overview fields
 * (`totalRaised`, `totalCampaigns`, …) are returned alongside the canonical
 * platform metrics so every admin screen consumes one contract.
 */
export interface AdminDashboardStats {
  // Overview fields
  totalCampaigns: number;
  publishedCampaigns: number;
  totalDonations: number;
  totalPledges: number;
  totalUsers: number;
  totalRaised: number;
  totalDonationsAmount: number;
  totalPledgesAmount: number;

  // Canonical platform metrics
  totalRevenue: number;
  totalTransactions: number;
  activeCampaigns: number;
  totalBusinesses: number;
  totalConsumers: number;
  totalBackers: number;
  averageDonation: number;
  conversionRate: number;
  generatedAt: string;
}

export interface RevenueChartItem {
  label: string;
  revenue: number;
  count: number;
}

export interface RecentContribution {
  id: string;
  amount: number;
  type: any;
  status: string;
  reference?: string;
  gateway?: string;
  createdAt: string;
  date: any;
  campaign: any;
  user: any;
  backer?: any;
  business?: any;
  donorId?: string;
  campaignId?: string;
  uid: string;
  isAnonymous: boolean;
  reward: any;
  [key: string]: any;
}

export interface TopCampaignItem {
  id: string;
  title: string;
  businessName: string;
  businessCity: string;
  raisedAmount: number;
  targetAmount: number;
  percentage: number;
  status: string;
  backerCount: number;
}

export interface ActivityFeedItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

// =============================================================================
// SEASONS & CYCLES
// =============================================================================

export interface AdminSeason {
  id: string;
  name: string;
  programmeName?: string | null;
  referenceCode?: string | null;
  description?: string | null;
  publicDescription?: string | null;
  internalNotes?: string | null;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "CLOSING" | "REVIEW" | "COMPLETED" | "ARCHIVED";
  startDate: string;
  endDate: string;
  durationDays: number;
  overallTarget: number;
  nationalTarget: number;
  cityTargetDefault: number;
  localAreaTargetDefault: number;
  highStreetTargetDefault: number;
  businessCampaignTargetDefault: number;
  totalRaised: number;
  totalContributions: number;
  activeCampaigns: number;
  totalParticipants: number;
  templateCount?: number;
  activationScope?: Record<string, any>;
  participationConfig?: Record<string, any>;
  engagementConfig?: Record<string, any>;
  spilloverConfig?: Record<string, any>;
  communicationConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
}

export interface SeasonReviewData {
  seasonId: string;
  seasonName: string;
  status: string;
  metrics: {
    overallTarget: number;
    totalRaised: number;
    surplusOrDeficit: number;
    isTargetMet: boolean;
    totalTransactions: number;
    averageContribution: number;
    totalParticipants: number;
  };
  campaignsOutcome: {
    totalCampaigns: number;
    completed: number;
    active: number;
    successRate: number;
  };
  reviewTimestamp: string;
}

export interface CreateSeasonPayload {
  name: string;
  programmeName?: string;
  referenceCode?: string;
  description?: string;
  publicDescription?: string;
  internalNotes?: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  overallTarget: number;
  nationalTarget: number;
  cityTargetDefault: number;
  localAreaTargetDefault: number;
  highStreetTargetDefault: number;
  businessCampaignTargetDefault: number;
  activationScope?: Record<string, any>;
  participationConfig?: Record<string, any>;
  engagementConfig?: Record<string, any>;
  spilloverConfig?: Record<string, any>;
  communicationConfig?: Record<string, any>;
}

export interface UpdateSeasonPayload extends Partial<CreateSeasonPayload> {}

export interface SeasonActionPayload {
  action: "activate" | "close" | "review" | "complete" | "archive";
  note?: string;
}

// =============================================================================
// HUB LOCATIONS & HIERARCHY
// =============================================================================

export interface AdminLocation {
  id: string;
  name: string;
  slug: string;
  type: "NATIONAL" | "CITY" | "BOROUGH" | "DISTRICT" | "LOCAL_AREA" | "HIGH_STREET" | "COMMERCIAL_AREA";
  parentId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  heroHeadline?: string | null;
  heroSupportingText?: string | null;
  postcodePrefix?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  isPublic?: boolean;
  targetAmount: number;
  activationStatus: string;
  statusOverride?: string | null;
  internalState?:
    | "DRAFT"
    | "PLANNED"
    | "PREPARING"
    | "LAUNCHING"
    | "ACTIVE_OPERATION"
    | "ARCHIVED";
  fullPath?: string | null;
  status?: string;
  fundingTarget?: number;
  fundingRaised?: number;
  raisedAmount?: number;
  region?: string;
  mapEnabled?: boolean;
  mapZoomLevel?: number;
  primaryImage?: string | null;
  secondaryImage?: string | null;
  children?: AdminLocation[];
  metadata?: Record<string, any>;
  businessCount?: number;
  childrenCount?: number;
  eventCount?: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
    type: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationTreeNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  parentId?: string | null;
  shortDescription?: string | null;
  postcodePrefix?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  targetAmount: number;
  activationStatus: string;
  businessCount: number;
  children: LocationTreeNode[];
}

export interface LocationTreeResponse {
  roots: LocationTreeNode[];
}

export interface CreateLocationPayload {
  name: string;
  slug?: string;
  type: string;
  parentId?: string;
  internalState?: string;
  shortDescription?: string;
  description?: string;
  heroHeadline?: string;
  heroSupportingText?: string;
  postcodePrefix?: string;
  latitude?: number;
  longitude?: number;
  mapZoomLevel?: number;
  mapEnabled?: boolean;
  primaryImage?: string;
  secondaryImage?: string;
  statusOverride?: string;
  isPublic?: boolean;
  targetAmount?: number;
  activationStatus?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {
  isActive?: boolean;
  mapZoomLevel?: number;
  mapEnabled?: boolean;
}

// =============================================================================
// CAMPAIGNS & TEMPLATES
// =============================================================================

export interface AdminCampaign {
  id: string;
  businessId?: string;
  templateId?: string;
  title: string;
  slug: string;
  description?: string | null;
  status: any;
  mode: string;
  goalAmount: number;
  targetAmount?: number;
  raisedAmount: number;
  businessContribution?: number;
  rewardTriggered?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  backerCount?: number;
  percentage?: number;
  contributionCount?: number;
  openChangesCount?: number;
  authorId?: string;
  author: { id: string; firstName: string; lastName: string; email: string; [key: string]: any };
  _count: { donations: number; pledges: number; [key: string]: any };
  business?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    localArea?: string;
    highStreet?: string;
    logoUrl?: string | null;
    membershipTier?: string;
    [key: string]: any;
  };
  template?: {
    id: string;
    name: string;
    slug: string;
    seasonId?: string | null;
    [key: string]: any;
  };
  isFeatured?: boolean;
  isVisible?: boolean;
  isSelfFunding?: boolean;
  location?: string;
  season?: any;
  hierarchyLevel?: string | null;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AdminCampaignDetail extends AdminCampaign {
  answers?: Array<{
    id: string;
    fieldId: string;
    value: string;
    source: string;
  }>;
  requestedChanges?: Array<{
    id: string;
    fieldId: string;
    label: string;
    note: string;
    resolved: boolean;
    createdAt: string;
  }>;
}

export interface UpdateCampaignStatusPayload {
  status: string;
  note?: string;
}

export interface RequestCampaignChangesPayload {
  fieldId: string;
  label: string;
  note: string;
}

export interface BulkCampaignActionPayload {
  action: "approve" | "reject" | "archive";
  campaignIds: string[];
}

export interface AdminCampaignTemplate {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category?: string | null;
  description?: string;
  seasonId?: string | null;
  origin: string;
  approvalMode: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  audience: string;
  minEligibilityTier: string;
  minContributionRequired: boolean;
  minContributionAmount: number;
  selfFundingEnabled: boolean;
  selfFundingMode: string;
  selfFundingAmount: number;
  selfFundingRewardName?: string | null;
  businessRewardsMode?: string;
  fieldsConfig: any[];
  rewardsConfig: any[];
  mcomAssetsConfig: any[];
  requirementsConfig: any[];
  config: Record<string, any>;
  isActive: boolean;
  version: number;
  createdById?: string | null;
  updatedById?: string | null;
  instantiatedCount: number;
  season?: {
    id: string;
    name: string;
    referenceCode?: string | null;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInstance {
  id: string;
  businessId: string;
  title: string;
  status: string;
  targetAmount: number;
  raisedAmount: number;
  percentage: number;
  contributionCount: number;
  business?: {
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    membershipTier?: string;
  };
  createdAt: string;
}

export interface McomCatalogueReward {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
  rewardType: string;
  source: string;
  audience: string;
  status: string;
  value: number | null;
  maxPoints: number | null;
  maxStampsRequired: number | null;
  isPointsEnabled: boolean;
  isStampsEnabled: boolean;
  quantity: number;
  expiresAt: string | null;
  updatedAt: string | null;
}

export interface McomRewardCataloguePage {
  data: McomCatalogueReward[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCampaignTemplatePayload {
  name: string;
  slug?: string;
  tagline: string;
  seasonId?: string;
  origin?: string;
  approvalMode?: string;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  category?: string;
  audience?: string;
  minEligibilityTier?: string;
  minContributionRequired?: boolean;
  minContributionAmount?: number;
  selfFundingEnabled?: boolean;
  selfFundingMode?: string;
  selfFundingAmount?: number;
  selfFundingRewardName?: string;
  businessRewardsMode?: string;
  fieldsConfig?: any[];
  rewardsConfig?: any[];
  mcomAssetsConfig?: any[];
  requirementsConfig?: any[];
  config?: Record<string, any>;
}

export interface UpdateCampaignTemplatePayload extends Partial<CreateCampaignTemplatePayload> {
  isActive?: boolean;
}

export interface DuplicateCampaignTemplatePayload {
  name?: string;
}

export interface InstantiateCampaignTemplatePayload {
  businessIds?: string[];
  locationId?: string;
  targetAmount?: number;
  deadlineDays?: number;
  /** Override eligibility — only honoured when the template allows it. */
  force?: boolean;
}

export interface InstantiateSkipReason {
  businessId: string;
  businessName: string | null;
  reason: "ineligible" | "already_exists" | "not_found";
  message: string;
  unmet: string[];
}

export interface InstantiateCampaignTemplateResult {
  queued: boolean;
  count: number;
  skipped?: number;
  campaignIds?: string[];
  jobId?: string;
  message?: string;
  skippedReasons?: InstantiateSkipReason[];
}

export interface TargetCalculationResult {
  formula: string;
  businessCount: number;
  baseTargetPerBusiness: number;
  projectedTargets: {
    highStreet: number;
    localArea: number;
    city: number;
    national: number;
  };
}

// =============================================================================
// PARTICIPANTS & USERS
// =============================================================================

export interface AdminUser {
  id: string;
  email: string;
  username?: string | null;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: string;
  userType?: string;
  emailVerified: boolean;
  membershipTier?: string | null;
  businessCount?: number;
  contributionCount?: number;
  createdAt: string;
  _count: { donations: number; pledges: number; campaigns: number };
  [key: string]: any;
}

export interface AdminBusiness {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  registrationNumber?: string | null;
  businessType: string;
  category: string;
  subcategories: string[];
  description?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  status: string;
  membershipTier: string;
  preferredAudience: string;
  city: string;
  localArea: string;
  highStreet: string;
  address?: string | null;
  postcode: string;
  campaignCount: number;
  campaignsCount?: number;
  contributionCount: number;
  verificationStatus?: string;
  /** Completed contribution total in pence. */
  totalContributed: number;
  /** Completed contribution total in pence. */
  totalRaised: number;
  campaigns?: any[];
  owner?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminConsumer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  membershipTier?: string | null;
  membershipStatus?: string | null;
  donationsCount: number;
  createdAt: string;
}

export interface AdminBacker {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  membershipTier?: string | null;
  contributionsCount: number;
  totalContributed: number;
  createdAt: string;
}

export interface AdminFoundingMember {
  id: string;
  email: string;
  name?: string;
  userName?: string | null;
  businessName?: string | null;
  locationName?: string;
  audience?: "BUSINESS" | "CONSUMER";
  status?: string;
  contributionAmount?: number;
  isOriginal?: boolean;
  isMonthly?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  membershipTier?: string | null;
  membershipPlanName?: string | null;
  membershipStatus?: string | null;
  subscription?: {
    planName?: string | null;
    status: string;
    isActive: boolean;
    expiresAt?: string | null;
  } | null;
  createdAt: string;
}

// =============================================================================
// FINANCE & PAYOUTS
// =============================================================================

export interface FinanceOverview {
  totalGross: number;
  totalRefunded: number;
  totalNet: number;
  estimatedPlatformFees: number;
  pendingPayouts: {
    count: number;
    amount: number;
  };
  availableEscrowBalance: number;
}

export interface AdminPayout {
  id: string;
  businessId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  destinationDetails: Record<string, any>;
  processedAt?: string | null;
  rejectionReason?: string | null;
  campaignTitle?: string;
  campaignId?: string;
  bankDetails?: { accountName?: string; accountNumber?: string; sortCode?: string };
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    name: string;
    slug: string;
    email: string;
    city: string;
  };
}

// =============================================================================
// REWARDS & FULFILMENT
// =============================================================================

export interface AdminReward {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
  isActive: boolean;
  grantedCount: number;
  fulfilmentCount: number;
  createdAt: string;
}

export interface CreateRewardPayload {
  code: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateRewardPayload extends Partial<CreateRewardPayload> {}

export interface AdminFulfilment {
  id: string;
  rewardId: string;
  userId?: string | null;
  businessId?: string | null;
  status: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  shippingAddress?: Record<string, any> | null;
  trackingNumber?: string | null;
  courier?: string | null;
  notes?: string | null;
  fulfilledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reward?: {
    id: string;
    code: string;
    name: string;
    icon: string;
  };
}

export interface UpdateFulfilmentPayload {
  status: string;
  trackingNumber?: string;
  courier?: string;
  notes?: string;
}

// =============================================================================
// SYSTEM EVENTS, SETTINGS & AUDIT
// =============================================================================

export interface AdminEvent {
  id: string;
  title: string;
  description?: string | null;
  scope: string;
  locationId?: string | null;
  eventDate: string;
  endDate?: string | null;
  venue?: string | null;
  isPublished: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    slug: string;
    type: string;
  } | null;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  scope?: string;
  locationId?: string;
  eventDate: string;
  endDate?: string;
  venue?: string;
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

export interface AdminSettingsMap {
  siteName: string;
  currency: string;
  platformFee: number;
  paymentGateways: string[];
  platform_fee_percent?: number;
  payout_schedule?: string;
  min_donation_pence?: number;
  auto_approve_campaigns?: boolean;
  support_email?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  campaigns: T[];
  donations: T[];
  pledges: T[];
  users: T[];
  businesses: T[];
  consumers: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  [key: string]: any;
}
