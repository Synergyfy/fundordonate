import type { LocalEntitlement } from "@/services/central-hub";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface User {
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

export type AuthUser = User;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type SessionResponse = AuthResponse;
