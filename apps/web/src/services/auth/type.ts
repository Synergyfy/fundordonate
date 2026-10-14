import type { LocalEntitlement } from "@/services/central-hub";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface User {
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
