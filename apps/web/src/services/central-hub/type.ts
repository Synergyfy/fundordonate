export interface CentralHubUser {
  id: string;
  email: string;
  username: string | null;
  role: string;
  userType: string;
  profileType?: string | null;
  isAffiliate?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  jobTitle?: string | null;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  country?: string | null;
  businessId?: string | null;
  emailVerified: boolean;
  membershipLevel?: string | null;
  membershipTier?: string | null;
  membershipPlanName?: string | null;
  membershipStatus?: string | null;
  profile?: Record<string, unknown> | null;
  subscription?: LocalEntitlement | null;
}

export interface LocalEntitlement {
  planId: string | null;
  planName: string | null;
  source: string | null;
  status: string;
  isTrial: boolean;
  isActive: boolean;
  quotas: Record<string, unknown>;
  limits: Record<string, unknown>;
  features: string[];
  /**
   * Effective capability map keyed by the API's stable feature keys:
   * `{ [key]: { enabled, limit, unlimited } }`.
   */
  capabilities?: Record<
    string,
    { enabled: boolean; limit: number | null; unlimited: boolean }
  >;
  entitlementKind?: string | null;
  tasksToComplete: unknown;
  membershipPlanName: string | null;
  expiresAt: string | null;
}

export interface CentralHubCallbackResult {
  success: boolean;
  returnPath: string;
  isNewUser?: boolean;
  user?: CentralHubUser;
  tokens?: { accessToken: string; refreshToken: string };
  entitlement?: LocalEntitlement | null;
  reason?: string;
  upgradeUrl?: string;
  error?: string;
}
