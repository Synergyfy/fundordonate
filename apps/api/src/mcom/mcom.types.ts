// =============================================================================
// MCOM Solutions — shared types
// Mirrors the contracts returned by MCOM Central Hub SSO / entitlement APIs.
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

export interface McomBusinessProfile {
  id?: string | null;
  businessName?: string | null;
  membershipLevel?: string | null;
  membershipStatus?: string | null;
  membershipPlanName?: string | null;
  membershipTier?: string | null;
  hasPaidVerificationFee?: boolean | null;
  trialAccessExpiresAt?: string | null;
  appPlan?: McomAppPlan | null;
  [key: string]: unknown;
}

export interface McomUser {
  id: string;
  email: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  businessProfile?: McomBusinessProfile | null;
  permissions?: Record<string, boolean>;
  packages?: unknown[];
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
