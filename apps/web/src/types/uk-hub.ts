// =============================================================================
// UK Hub Activation — Domain Types
// =============================================================================

// ───────────────────── Location Types ─────────────────────

export type LocationType =
  | "NATIONAL"
  | "CITY"
  | "BOROUGH"
  | "DISTRICT"
  | "LOCAL_AREA"
  | "HIGH_STREET"
  | "COMMERCIAL_AREA";

export type LocationInternalLifecycle =
  | "DRAFT"
  | "IDENTIFIED"
  | "PREPARING"
  | "LAUNCHING"
  | "ACTIVATING"
  | "ACTIVE"
  | "EXPANDING"
  | "ARCHIVED";

export type LocationPublicStatus =
  | "NEEDS_ACTIVATION"
  | "MAKING_PROGRESS"
  | "ACTIVE";

export const LOCATION_TYPE_META: Record<LocationType, { label: string; plural: string; icon: string; requiredForUKHub: boolean; requiredForEveryCity: boolean }> = {
  NATIONAL:        { label: "National",        plural: "National",        icon: "🇬🇧", requiredForUKHub: true,  requiredForEveryCity: false },
  CITY:            { label: "City",            plural: "Cities",          icon: "🏙️", requiredForUKHub: true,  requiredForEveryCity: true  },
  BOROUGH:         { label: "Borough",         plural: "Boroughs",        icon: "🏘️", requiredForUKHub: false, requiredForEveryCity: false },
  DISTRICT:        { label: "District",        plural: "Districts",       icon: "📍", requiredForUKHub: false, requiredForEveryCity: false },
  LOCAL_AREA:      { label: "Local Area",      plural: "Local Areas",     icon: "🗺️", requiredForUKHub: false, requiredForEveryCity: false },
  HIGH_STREET:     { label: "High Street",     plural: "High Streets",    icon: "🛒", requiredForUKHub: false, requiredForEveryCity: false },
  COMMERCIAL_AREA: { label: "Commercial Area", plural: "Commercial Areas", icon: "🏢", requiredForUKHub: false, requiredForEveryCity: false },
};

export const LOCATION_PUBLIC_STATUS_META: Record<LocationPublicStatus, { label: string; color: string; bgColor: string; borderColor: string; mapColor: string; description: string }> = {
  NEEDS_ACTIVATION: {
    label: "Needs Activation",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    mapColor: "#eab308",
    description: "This location is part of the programme but requires activation progress.",
  },
  MAKING_PROGRESS: {
    label: "Making Progress",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    mapColor: "#3b82f6",
    description: "This location is showing visible movement towards activation.",
  },
  ACTIVE: {
    label: "Active",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    mapColor: "#22c55e",
    description: "This location has reached its active public state.",
  },
};

// ───────────────────── HubLocation ─────────────────────

export interface HubLocation {
  id: string;
  name: string;
  slug: string;
  type: LocationType;
  parentId?: string | null;
  parent?: HubLocation | null;
  children?: HubLocation[];

  // Content
  shortDescription?: string | null;
  description?: string | null;
  heroHeadline?: string | null;
  heroSupportingText?: string | null;

  // Activation
  internalLifecycle: LocationInternalLifecycle;
  publicStatus: LocationPublicStatus;
  statusOverride?: LocationPublicStatus | null;

  // Publication
  isActive: boolean;
  isPublic: boolean;

  // Map
  mapVisible: boolean;
  latitude?: number | null;
  longitude?: number | null;
  mapZoomLevel?: number | null;

  // Media
  primaryImage?: string | null;
  secondaryImage?: string | null;

  // Hierarchy path
  fullPath?: string | null;

  // Featured
  isFeaturedNationally: boolean;
  featuredPriority?: number | null;
  featuredFrom?: string | null;
  featuredUntil?: string | null;

  // Progress
  fundingTarget: number;
  fundingRaised: number;
  activationThreshold?: number | null;

  // Founding allocation
  foundingBusinessTotal: number;
  foundingBusinessAllocated: number;
  foundingConsumerTotal: number;
  foundingConsumerAllocated: number;

  createdAt: string;
  updatedAt: string;
}

// ───────────────────── CampaignLocation ─────────────────────

export type CampaignRelationshipType = "PRIMARY" | "LOCAL" | "NATIONAL" | "FEATURED";

export interface CampaignLocation {
  id: string;
  campaignId: string;
  locationId: string;
  relationshipType: CampaignRelationshipType;
  visibility: "VISIBLE" | "HIDDEN";
  createdAt: string;
}

// ───────────────────── Founding Programme ─────────────────────

export type FoundingAudience = "BUSINESS" | "CONSUMER";

export type FoundingProgrammeStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "OPEN"
  | "LIMITED"
  | "FULLY_ALLOCATED"
  | "CLOSED"
  | "ARCHIVED";

export const FOUNDING_STATUS_META: Record<FoundingProgrammeStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT:            { label: "Draft",            color: "text-gray-500", bgColor: "bg-gray-50" },
  SCHEDULED:        { label: "Opening Soon",     color: "text-blue-500", bgColor: "bg-blue-50" },
  OPEN:             { label: "Open",             color: "text-green-600", bgColor: "bg-green-50" },
  LIMITED:          { label: "Limited Availability", color: "text-amber-600", bgColor: "bg-amber-50" },
  FULLY_ALLOCATED:  { label: "Fully Allocated",  color: "text-red-600", bgColor: "bg-red-50" },
  CLOSED:           { label: "Closed",           color: "text-gray-600", bgColor: "bg-gray-100" },
  ARCHIVED:         { label: "Archived",         color: "text-gray-400", bgColor: "bg-gray-50" },
};

export interface FoundingProgramme {
  id: string;
  locationId: string;
  location?: HubLocation;
  audience: FoundingAudience;
  status: FoundingProgrammeStatus;
  title: string;
  description?: string | null;
  totalAllocation: number;
  allocatedCount: number;
  opensAt?: string | null;
  closesAt?: string | null;
  campaignId?: string | null;
  campaign?: any;
  contributionConfig: string;
  benefitConfig: string;
  eligibilityConfig: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoundingMembership {
  id: string;
  userId: string;
  programmeId: string;
  programme?: FoundingProgramme;
  locationId: string;
  location?: HubLocation;
  campaignId?: string | null;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  contributionAmount?: number | null;
  grantedAt: string;
  benefitsVersion?: string | null;
}

// ───────────────────── Backer Status ─────────────────────

export type BackerVisibility = "COUNTED" | "PUBLIC";

export interface BackerStatus {
  id: string;
  userId: string;
  statusType: string;
  sourceCampaignId?: string | null;
  locationId?: string | null;
  location?: HubLocation | null;
  grantedAt: string;
  visibility: BackerVisibility;
  metadata: string;
}

// ───────────────────── Hub Activity ─────────────────────

export type HubActivityType =
  | "ANNOUNCEMENT"
  | "MILESTONE"
  | "CAMPAIGN_UPDATE"
  | "FOUNDING_MILESTONE"
  | "LAUNCH"
  | "COMMUNITY";

export interface HubActivity {
  id: string;
  locationId: string;
  activityType: HubActivityType;
  title: string;
  content?: string | null;
  media?: string | null;
  publicationStatus: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  visibilityScope: "NATIONAL" | "LOCATION";
  createdAt: string;
}

// ───────────────────── Hub Event ─────────────────────

export interface HubEvent {
  id: string;
  locationId: string;
  title: string;
  description?: string | null;
  eventDate?: string | null;
  status: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  eligibleAudience?: string | null;
  createdAt: string;
}

// ───────────────────── Projections ─────────────────────

export interface NationalHubSummary {
  totalCities: number;
  needsActivation: number;
  makingProgress: number;
  active: number;
  totalFundingRaised: number;
  totalFundingTarget: number;
  totalFoundingBusiness: number;
  totalFoundingConsumer: number;
  totalBackers: number;
  featuredCities: HubLocation[];
  progressCities: HubLocation[];
  launchingCities: HubLocation[];
  activeCities: HubLocation[];
}

export interface CityHubSummary {
  city: HubLocation;
  effectiveStatus: LocationPublicStatus;
  activationProgress: number;
  fundingProgress: number;
  fundingRaised: number;
  fundingTarget: number;
  foundingBusiness: {
    total: number;
    allocated: number;
    remaining: number;
    status: FoundingProgrammeStatus;
  };
  foundingConsumer: {
    total: number;
    allocated: number;
    remaining: number;
    status: FoundingProgrammeStatus;
  };
  campaignCount: number;
  backerCount: number;
  childLocationCount: number;
  recentActivity: HubActivity[];
  upcomingEvents: HubEvent[];
}

export interface MapLocation {
  id: string;
  name: string;
  slug: string;
  type: LocationType;
  parentId?: string | null;
  latitude: number;
  longitude: number;
  effectiveStatus: LocationPublicStatus;
  progressSummary: {
    activation: number;
    funding: number;
  };
  fundingTarget: number;
  fundingRaised: number;
  campaignSummary: {
    total: number;
    active: number;
  };
  foundingSummary: {
    businessOpen: boolean;
    consumerOpen: boolean;
    businessRemaining: number;
    consumerRemaining: number;
  };
  hubUrl: string;
  shortDescription?: string | null;
  primaryImage?: string | null;
}

// ───────────────────── Page Configuration ─────────────────────

export interface HubPageConfiguration {
  showProgress: boolean;
  showCampaigns: boolean;
  showFoundingBusiness: boolean;
  showFoundingConsumer: boolean;
  showBackers: boolean;
  showLocalActivity: boolean;
  showCommunity: boolean;
  showEvents: boolean;
  showMapPreview: boolean;
}

// ───────────────────── Breadcrumb ─────────────────────

export interface BreadcrumbItem {
  label: string;
  slug: string;
  fullPath: string;
  type: LocationType;
}
