import { create } from "zustand";
import { authApi } from "@/services/auth";
import {
  centralHubService,
  type LocalEntitlement,
} from "@/services/central-hub";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/config";
import { getDashboardRoute } from "@/lib/roles";

// =============================================================================
// Types
// =============================================================================

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

/**
 * Auth lifecycle states:
 * - initializing: app is checking for an existing session
 * - authenticated: user identity is resolved and available
 * - unauthenticated: no valid session exists
 */
export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface CentralHubCallbackOutcome {
  success: boolean;
  returnPath: string;
  reason?: string;
  upgradeUrl?: string;
  error?: string;
}

interface AuthState {
  user: User | null;
  entitlement: LocalEntitlement | null;
  authStatus: AuthStatus;
  sessionError: string | null;
  centralHubEnabled: boolean;
  centralHubLoading: boolean;

  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearAuth: (sessionErrorMessage?: string) => void;
  checkCentralHub: () => Promise<void>;
  loginWithCentralHub: (returnPath?: string) => Promise<void>;
  handleCentralHubCallback: (
    code: string,
    state: string,
  ) => Promise<CentralHubCallbackOutcome>;
  handleDirectSsoToken: (token: string) => Promise<CentralHubCallbackOutcome>;
  refreshEntitlement: () => Promise<{
    hasAccess: boolean;
    entitlement: LocalEntitlement | null;
  }>;
  getPostLoginRedirect: () => string;
  clearSessionError: () => void;
}

// =============================================================================
// Post-Login Routing
// =============================================================================

/**
 * Determines the correct authenticated destination based on authoritative identity.
 * Delegates to the shared role → dashboard mapping so every entry point agrees.
 */
function resolvePostLoginRoute(user: User): string {
  return getDashboardRoute(user);
}

// =============================================================================
// Store
// =============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  entitlement: null,
  authStatus: "initializing",
  sessionError: null,
  centralHubEnabled: false,
  centralHubLoading: false,

  adminLogin: async (email, password) => {
    const result = await authApi.adminLogin(email, password);
    if (result.accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
    }
    if (result.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
    }
    set({
      user: result.user,
      entitlement: result.user.subscription ?? null,
      authStatus: "authenticated",
      sessionError: null,
    });
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    try {
      await centralHubService.logout(refreshToken || undefined);
    } catch {
      // Ignore logout errors — proceed with local cleanup
    }
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    set({
      user: null,
      entitlement: null,
      authStatus: "unauthenticated",
      sessionError: null,
    });
  },

  loadUser: async () => {
    try {
      const user = await authApi.getMe();
      if (!user || !user.id) {
        throw new Error("No active session");
      }
      set({
        user,
        entitlement: user.subscription ?? null,
        authStatus: "authenticated",
        sessionError: null,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      set({
        user: null,
        entitlement: null,
        authStatus: "unauthenticated",
      });
    }
  },

  setUser: (user) => {
    set({
      user,
      entitlement: user?.subscription ?? null,
      authStatus: user ? "authenticated" : "unauthenticated",
    });
  },

  clearAuth: (sessionErrorMessage) => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    set({
      user: null,
      entitlement: null,
      authStatus: "unauthenticated",
      sessionError: sessionErrorMessage || null,
    });
  },

  checkCentralHub: async () => {
    try {
      const status = await centralHubService.getStatus();
      set({ centralHubEnabled: status.enabled });
    } catch {
      set({ centralHubEnabled: false });
    }
  },

  loginWithCentralHub: async (returnPath = "") => {
    set({ centralHubLoading: true });
    try {
      await centralHubService.beginLogin(returnPath);
    } catch {
      set({ centralHubLoading: false });
      throw new Error("Failed to connect to MCOM Central Hub");
    }
  },

  handleCentralHubCallback: async (code, state) => {
    set({ centralHubLoading: true });
    try {
      const result = await centralHubService.handleCallback(code, state);
      const returnPath = centralHubService.consumeReturnPath();

      if (result.success && result.user) {
        if (result.tokens) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
        }
        set({
          user: result.user,
          entitlement: result.entitlement ?? result.user.subscription ?? null,
          authStatus: "authenticated",
          centralHubLoading: false,
          sessionError: null,
        });
        return { success: true, returnPath };
      }

      set({ centralHubLoading: false });
      return {
        success: false,
        returnPath,
        reason: result.reason,
        upgradeUrl: result.upgradeUrl,
        error: result.reason ? undefined : "Central Hub authentication failed",
      };
    } catch (err) {
      set({ centralHubLoading: false });
      return {
        success: false,
        returnPath: centralHubService.consumeReturnPath(),
        error:
          err instanceof Error
            ? err.message
            : "Central Hub authentication failed",
      };
    }
  },

  handleDirectSsoToken: async (token) => {
    set({ centralHubLoading: true });
    try {
      const result = await centralHubService.handleDirectToken(token);
      if (result.success && result.user) {
        if (result.tokens) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
        }
        set({
          user: result.user,
          entitlement: result.entitlement ?? result.user.subscription ?? null,
          authStatus: "authenticated",
          centralHubLoading: false,
          sessionError: null,
        });
        return { success: true, returnPath: result.returnPath || "/" };
      }
      set({ centralHubLoading: false });
      return {
        success: false,
        returnPath: result.returnPath || "/",
        error: result.error || "Direct SSO authentication failed",
      };
    } catch (err) {
      set({ centralHubLoading: false });
      return {
        success: false,
        returnPath: "/",
        error: err instanceof Error ? err.message : "Direct SSO authentication failed",
      };
    }
  },

  refreshEntitlement: async () => {
    const result = await centralHubService.refreshEntitlement();
    set({ entitlement: result.entitlement });
    return result;
  },

  getPostLoginRedirect: () => {
    const { user } = get();
    if (!user) return "/";
    return resolvePostLoginRoute(user);
  },
  clearSessionError: () => {
    set({ sessionError: null });
  },
}));

// =============================================================================
// Session Expiry Listener
// When the API client's refresh fails, it dispatches a custom event.
// This listener picks it up and clears the auth store accordingly.
// =============================================================================

if (typeof window !== "undefined") {
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    const currentStatus = useAuthStore.getState().authStatus;
    if (currentStatus === "authenticated") {
      useAuthStore.getState().clearAuth("Your session has expired. Please sign in again.");
    }
  });
}
