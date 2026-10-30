// =============================================================================
// MCOM Solutions — shared types
// Mirrors the contracts returned by MCOM Central Hub SSO / entitlement APIs.
//
// Central Hub is the source of truth for a user's identity: name, email,
// contact details, business profile and role-specific profile. FundOrDonate
// caches that identity locally for display only.
// =============================================================================

export interface McomAppPlan {
  source?: "membership" | "direct" | string;
  platform?: string;
  clientId?: string;
  planId?: string;
  planName?: string;
  status?: string;
  quotas?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  features?: string[];
  membershipPlanName?: string | null;
  expiresAt?: string | null;
  directPlan?: unknown;
  membershipPlan?: unknown;
  [key: string]: unknown;
}

/**
 * Full business profile as returned by Central Hub's SSO surfaces.
 * Central is authoritative — every field here is cached, never edited locally.
 */
export interface McomBusinessProfile {
  id?: string | null;
  userId?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  isOnGoogle?: boolean | null;
  googlePlaceId?: string | null;
  address?: string | null;
  postcode?: string | null;
  industry?: string | null;
  category?: string | null;
  subCategory?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  openingHours?: string | null;
  socialMedia?: string | null;
  membershipLevel?: string | null;
  membershipStatus?: string | null;
  membershipPlanName?: string | null;
  membershipTier?: string | null;
  membershipExpiresAt?: string | null;
  hasPaidVerificationFee?: boolean | null;
  verificationFeePaidAt?: string | null;
  trialAccessDays?: number | null;
  trialAccessExpiresAt?: string | null;
  localMallName?: string | null;
  localMallId?: string | null;
  proximityTier?: string | null;
  packages?: unknown[];
  appPlan?: McomAppPlan | null;
  [key: string]: unknown;
}

export interface McomCustomerProfile {
  id?: string | null;
  phone?: string | null;
  loyaltyPoints?: number | null;
  platformUsage?: string[] | null;
  membershipStatus?: string | null;
  status?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface McomAgentProfile {
  id?: string | null;
  phone?: string | null;
  permissions?: string[] | null;
  status?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface McomConsultantProfile {
  id?: string | null;
  phone?: string | null;
  specialisation?: string | null;
  status?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface McomAccountManagerProfile {
  id?: string | null;
  phone?: string | null;
  assignedBusinesses?: number | null;
  status?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

/**
 * Canonical identity returned by Central Hub. The same shape is returned by
 * the token exchange, `/auth/sso/userinfo` and `/auth/sso/entitlement`.
 */
export interface McomUser {
  id: string;
  sub?: string;
  email: string;
  role?: string;
  /** Explicit discriminator for which role profile object is populated. */
  profileType?: string;
  /** True for affiliate/partner-portal accounts. */
  isAffiliate?: boolean;

  firstName?: string | null;
  lastName?: string | null;
  /** "First Last" — the person, never the business name. */
  fullName?: string | null;
  /** Display name: business name for BUSINESS, otherwise the person's name. */
  name?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;

  // Contact details, resolved by Central from whichever profile owns them.
  phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  country?: string | null;

  // Business convenience fields (null for non-business roles).
  businessId?: string | null;
  businessName?: string | null;
  membershipLevel?: string | null;
  membershipTier?: string | null;
  membershipStatus?: string | null;
  membershipPlanName?: string | null;
  membershipExpiresAt?: string | null;
  hasPaidVerificationFee?: boolean | null;
  trialAccessExpiresAt?: string | null;

  // Role-specific profile objects — exactly one is populated.
  businessProfile?: McomBusinessProfile | null;
  customerProfile?: McomCustomerProfile | null;
  agentProfile?: McomAgentProfile | null;
  consultantProfile?: McomConsultantProfile | null;
  accountManagerProfile?: McomAccountManagerProfile | null;

  permissions?: Record<string, boolean>;
  packages?: unknown[];
  entitlement?: PlatformEntitlement | null;
  appPlan?: McomAppPlan | null;
  [key: string]: unknown;
}

export type EntitlementAccessType =
  | "PAID_MEMBERSHIP"
  | "TRIAL_PROGRAMME"
  | "DIRECT_PACKAGE"
  | "NONE";

export type EntitlementReason =
  | "PLATFORM_NOT_IN_MEMBERSHIP"
  | "TRIAL_NO_TASKS"
  | "TRIAL_EXPIRED"
  | "UNVERIFIED"
  | "MEMBERSHIP_EXPIRED"
  | "NO_ACTIVE_ENTITLEMENT";

export interface EntitlementProgrammeTask {
  taskId: string;
  title: string;
  description: string;
  deadlineDays: number;
  rewardPoints: number;
  status: string;
}

export interface PlatformEntitlement {
  version: string;
  targetPlatform: {
    clientId: string | null;
    platformSlug: string | null;
    name: string | null;
  };
  access: {
    hasAccess: boolean;
    accessType: EntitlementAccessType;
    reason?: EntitlementReason;
    upgradeUrl: string;
  };
  plan: {
    planId: string;
    planName: string;
    source: string;
    status: string;
    billingCycle?: string | null;
    expiresAt?: string | null;
    quotas: Record<string, unknown>;
    limits: Record<string, unknown>;
    features: string[];
  } | null;
  membershipContext: {
    membershipPlanName: string | null;
    membershipLevel: string;
    membershipStatus: string;
    isIncludedInMembership: boolean;
  };
  trialContext: {
    isInTrial: boolean;
    hasPaidVerificationFee: boolean;
    trialExpiresAt: string | null;
    daysRemaining: number;
    programmeTasks: EntitlementProgrammeTask[];
  };
}

export interface McomTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  entitlement?: PlatformEntitlement | null;
  user: McomUser;
}

export interface McomUserInfo extends McomUser {
  entitlement?: PlatformEntitlement | null;
  appPlan?: McomAppPlan | null;
  permissions?: Record<string, boolean>;
}
