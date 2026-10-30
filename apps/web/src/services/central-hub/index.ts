// =============================================================================
// FundOrDonate — Central Hub (MCOM SSO) Service
// =============================================================================

import api from "../api";
import { CENTRAL_HUB_CONFIG } from "@/lib/config";
import type {
  CentralHubCallbackResult,
  CentralHubUser,
  LocalEntitlement,
} from "./type";

export const centralHubService = {
  /** Whether the backend has MCOM SSO configured. */
  async getStatus(): Promise<{ enabled: boolean }> {
    const res = await api.get("/auth/sso/status");
    return res;
  },

  /** Cryptographically-random 32-byte CSRF state (hex). */
  generateState(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  /** Ask the backend for the MCOM authorize URL (it stores state server-side). */
  async getAuthorizeUrl(state: string, returnPath: string): Promise<string> {
    const res = await api.get("/auth/sso/login", {
      params: { state, returnPath },
    });
    return res.authorizeUrl;
  },

  /** Persist state + return path, then redirect the browser to MCOM Central. */
  async beginLogin(returnPath: string = "/"): Promise<void> {
    const state = this.generateState();
    sessionStorage.setItem(CENTRAL_HUB_CONFIG.STORAGE_KEY, state);
    sessionStorage.setItem(CENTRAL_HUB_CONFIG.RETURN_PATH_KEY, returnPath);

    const url = await this.getAuthorizeUrl(state, returnPath);
    window.location.href = url;
  },

  /** True when the callback's state matches the one we stored. */
  validateState(state: string | null): boolean {
    if (!state) return false;
    return sessionStorage.getItem(CENTRAL_HUB_CONFIG.STORAGE_KEY) === state;
  },

  clearState(): void {
    sessionStorage.removeItem(CENTRAL_HUB_CONFIG.STORAGE_KEY);
  },

  /** Exchange the authorization code for a local session (server-to-server). */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<CentralHubCallbackResult> {
    return api.post("/auth/sso/callback", { code, state });
  },

  /** Flow B — direct dashboard handshake. */
  async handleDirectToken(token: string): Promise<CentralHubCallbackResult> {
    return api.post("/auth/sso/direct-login", { token });
  },

  /** Re-introspect the current user's entitlement. */
  async refreshEntitlement(): Promise<{ hasAccess: boolean; entitlement: LocalEntitlement | null }> {
    return api.post("/auth/sso/refresh-entitlement");
  },

  /** Force a fresh copy of the user's identity from Central Hub. */
  async refreshProfile(): Promise<{ user: CentralHubUser }> {
    return api.post("/auth/sso/refresh-profile");
  },

  /** Clear the local session and get the Central single-logout URL. */
  async logout(refreshToken?: string): Promise<{ logoutUrl?: string }> {
    return api.post("/auth/sso/logout", { refreshToken });
  },

  /** Retrieve and clear the stored post-login return path. */
  consumeReturnPath(): string {
    const path = sessionStorage.getItem(CENTRAL_HUB_CONFIG.RETURN_PATH_KEY);
    sessionStorage.removeItem(CENTRAL_HUB_CONFIG.RETURN_PATH_KEY);
    return this.validateReturnPath(path) ? (path as string) : "";
  },

  /** Prevent open redirects — only same-origin relative paths. */
  validateReturnPath(path: string | null | undefined): boolean {
    if (!path || !path.startsWith("/")) return false;
    if (path.includes("//")) return false;
    return true;
  },
};

export default centralHubService;
export type * from "./type";
