// =============================================================================
// FundOrDonate — Central Hub (MCOM SSO) Service
// Handles the integration boundary between FundOrDonate frontend and
// the backend Central Hub adapter. Does NOT contain Central Hub business logic.
// =============================================================================

import api from "@/lib/api";
import { CENTRAL_HUB_CONFIG } from "@/lib/config";

// =============================================================================
// Types
// =============================================================================

export interface CentralHubStatus {
  enabled: boolean;
}

export interface CentralHubAuthorizeResponse {
  url: string;
}

export interface CentralHubCallbackResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
    userType: string;
    businessId?: string | null;
    emailVerified: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  isNewUser?: boolean;
  error?: string;
}

// =============================================================================
// Service
// =============================================================================

export const centralHubService = {
  /**
   * Check if Central Hub integration is enabled on the backend.
   */
  async getStatus(): Promise<CentralHubStatus> {
    const res = await api.get("/integrations/central-hub/status");
    return res.data;
  },

  /**
   * Get the Central Hub authorization URL for redirect.
   * @param returnPath - The FundOrDonate path to return to after auth
   */
  async getAuthorizationUrl(returnPath: string = "/"): Promise<string> {
    // Create a state value that encodes where to return in FundOrDonate
    const state = btoa(JSON.stringify({ returnPath, ts: Date.now() }));
    localStorage.setItem(CENTRAL_HUB_CONFIG.STORAGE_KEY, state);

    const res = await api.get<CentralHubAuthorizeResponse>("/integrations/central-hub/authorize", {
      params: { state },
    });
    return res.data.url;
  },

  /**
   * Redirect the user to Central Hub for authentication.
   */
  async redirectToCentralHub(returnPath: string = "/"): Promise<void> {
    const url = await this.getAuthorizationUrl(returnPath);
    window.location.href = url;
  },

  /**
   * Exchange an authorization code for a FundOrDonate session via Central Hub SSO.
   * Handles both first-time users (creates identity) and returning users (returns session).
   * Called from the callback page after Central Hub redirects back.
   */
  async handleCallback(code: string): Promise<CentralHubCallbackResult> {
    const res = await api.post("/integrations/central-hub/sso", { code });
    return res.data;
  },

  /**
   * Unlink the current user from Central Hub.
   */
  async unlink(): Promise<void> {
    await api.delete("/integrations/central-hub/unlink");
  },

  /**
   * Retrieve and clear the stored return path from state.
   */
  getReturnPath(): string {
    const state = localStorage.getItem(CENTRAL_HUB_CONFIG.STORAGE_KEY);
    localStorage.removeItem(CENTRAL_HUB_CONFIG.STORAGE_KEY);
    if (!state) return "/";
    try {
      const parsed = JSON.parse(atob(state));
      return parsed.returnPath || "/";
    } catch {
      return "/";
    }
  },

  /**
   * Validate a return path to prevent open redirects.
   * Only allows paths that start with "/" and don't contain "//".
   */
  validateReturnPath(path: string): boolean {
    if (!path || !path.startsWith("/")) return false;
    if (path.includes("//")) return false;
    return true;
  },
};
