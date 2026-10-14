export interface CentralHubUser {
  id: string;
  email: string;
  username: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  userType: string;
  businessId?: string | null;
  emailVerified: boolean;
  membershipLevel?: string | null;
  membershipPlanName?: string | null;
  membershipStatus?: string | null;
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
