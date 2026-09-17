import { create } from "zustand";
import { authApi } from "@/services/auth.service";
import { centralHubService } from "@/services/central-hub.service";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";
import {
  isDemoMode,
  getDemoUser,
  enableDemoMode,
  disableDemoMode,
} from "@/lib/demo";
import { STORAGE_KEYS } from "@/lib/config";

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  userType: string;
  businessId?: string | null;
  emailVerified: boolean;
}

/**
 * Auth lifecycle states:
 * - initializing: app is checking for an existing session
 * - authenticated: user identity is resolved and available
 * - unauthenticated: no valid session exists
 */
export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  authStatus: AuthStatus;
  sessionError: string | null;
  centralHubEnabled: boolean;
  centralHubLoading: boolean;

  // Derived (kept for backward compatibility)
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    userType?: "donor" | "fundraiser" | "business" | "consumer";
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearAuth: (sessionErrorMessage?: string) => void;
  demoLogin: (role: string) => void;
  checkCentralHub: () => Promise<void>;
  loginWithCentralHub: (returnPath?: string) => Promise<void>;
  handleCentralHubCallback: (code: string) => Promise<{ success: boolean; returnPath: string; error?: string }>;
  getPostLoginRedirect: () => string;
  clearSessionError: () => void;
}

// =============================================================================
// Post-Login Routing
// =============================================================================

/**
 * Determines the correct authenticated destination based on authoritative identity.
 * Uses userType (account type) for primary routing, role (capability) for refinement.
 */
function resolvePostLoginRoute(user: User): string {
  switch (user.userType) {
    case "admin":
      return "/admin";
    case "business":
      return "/dashboard";
    case "consumer":
    default:
      return "/consumer";
  }
}

// =============================================================================
// Store
// =============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  authStatus: "initializing",
  sessionError: null,
  centralHubEnabled: false,
  centralHubLoading: false,

  // Backward-compatible derived state
  get isLoading() {
    return get().authStatus === "initializing";
  },
  get isAuthenticated() {
    return get().authStatus === "authenticated";
  },

  login: async (email, password) => {
    const result = await authApi.login(email, password);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
    set({
      user: result.user,
      authStatus: "authenticated",
      sessionError: null,
    });
  },

  register: async (data) => {
    const result = await authApi.register(data);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
    set({
      user: result.user,
      authStatus: "authenticated",
      sessionError: null,
    });
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors — proceed with local cleanup
      }
    }
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    disableDemoMode();
    set({
      user: null,
      authStatus: "unauthenticated",
      sessionError: null,
    });
  },

  loadUser: async () => {
    // Check for demo mode first
    if (isDemoMode()) {
      const demoRole = localStorage.getItem(STORAGE_KEYS.DEMO_ROLE);
      const demoUser = getDemoUser(demoRole || "donor");
      if (demoUser) {
        set({
          user: demoUser as User,
          authStatus: "authenticated",
          sessionError: null,
        });
        return;
      }
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      set({ authStatus: "unauthenticated" });
      return;
    }

    try {
      const { user } = await authApi.getMe();
      set({
        user,
        authStatus: "authenticated",
        sessionError: null,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      set({
        user: null,
        authStatus: "unauthenticated",
      });
    }
  },

  setUser: (user) => {
    set({
      user,
      authStatus: user ? "authenticated" : "unauthenticated",
    });
  },

  clearAuth: (sessionErrorMessage) => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    disableDemoMode();
    set({
      user: null,
      authStatus: "unauthenticated",
      sessionError: sessionErrorMessage || null,
    });
  },

  demoLogin: (role: string) => {
    // Enable demo mode BEFORE resolving the demo user. getDemoUser() gates on
    // isDemoMode() being true, so the flags must be set first or every demo
    // login returns null and the user bounces back to the homepage.
    enableDemoMode(role);
    const demoUser = getDemoUser(role);
    if (demoUser) {
      set({
        user: demoUser as User,
        authStatus: "authenticated",
        sessionError: null,
      });
    }
  },

  checkCentralHub: async () => {
    try {
      const status = await centralHubService.getStatus();
      set({ centralHubEnabled: status.enabled });
    } catch {
      set({ centralHubEnabled: false });
    }
  },

  loginWithCentralHub: async (returnPath = "/") => {
    set({ centralHubLoading: true });
    try {
      await centralHubService.redirectToCentralHub(returnPath);
    } catch {
      set({ centralHubLoading: false });
      throw new Error("Failed to connect to Central Hub");
    }
  },

  handleCentralHubCallback: async (code: string) => {
    set({ centralHubLoading: true });
    try {
      const returnPath = centralHubService.getReturnPath();
      const validatedPath = centralHubService.validateReturnPath(returnPath)
        ? returnPath
        : "/";

      const result = await centralHubService.handleCallback(code);

      if (result.success && result.user) {
        if (result.tokens) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
        }

        set({
          user: result.user as User,
          authStatus: "authenticated",
          centralHubLoading: false,
          sessionError: null,
        });

        return { success: true, returnPath: validatedPath };
      }

      set({ centralHubLoading: false });
      return { success: false, returnPath: validatedPath, error: result.error || "Central Hub authentication failed" };
    } catch (err) {
      set({ centralHubLoading: false });
      const returnPath = centralHubService.getReturnPath();
      const validatedPath = centralHubService.validateReturnPath(returnPath)
        ? returnPath
        : "/";
      return {
        success: false,
        returnPath: validatedPath,
        error: err instanceof Error ? err.message : "Central Hub authentication failed",
      };
    }
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
