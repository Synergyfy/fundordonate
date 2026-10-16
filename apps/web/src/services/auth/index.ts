import api from "../api";
import { STORAGE_KEYS } from "@/lib/config";
import type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  LoginCredentials,
  SessionResponse,
  User,
} from "./type";

export const authService = {
  /**
   * Standard user login with email & password.
   */
  async login(credentials: LoginCredentials): Promise<SessionResponse> {
    const res: any = await api.post("/auth/login", credentials);
    if (res.accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken);
    }
    if (res.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken);
    }
    return res;
  },

  /**
   * Administrator-only local login. Regular users use Central Hub SSO.
   */
  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    return api.post("/auth/admin/login", { email, password });
  },

  /**
   * Refresh session tokens.
   */
  async refresh(refreshToken?: string): Promise<AuthResponse> {
    return api.post("/auth/refresh", refreshToken ? { refreshToken } : {});
  },

  /**
   * Fetch current authenticated user.
   */
  async me(): Promise<AuthUser> {
    const res: any = await api.get("/auth/me");
    return (res?.user ?? res) as AuthUser;
  },

  /**
   * Alias for me() to match legacy authApi.getMe() callers.
   */
  async getMe(): Promise<User> {
    return this.me();
  },

  /**
   * Fetch current entitlement.
   */
  async getEntitlement(): Promise<unknown> {
    return api.get("/auth/entitlement");
  },

  /**
   * Logout current session.
   */
  async logout(refreshToken?: string): Promise<void> {
    const token = refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (token) {
      try {
        await api.post("/auth/logout", { refreshToken: token });
      } catch {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

export const authApi = authService;
export default authService;

export type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  LoginCredentials,
  SessionResponse,
  User,
};
