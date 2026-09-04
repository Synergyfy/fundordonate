// =============================================================================
// Central Hub Integration Adapter
// Handles SSO/OAuth identity mapping between MCOM Central Hub and FundOrDonate
// =============================================================================

import { prisma } from "../lib/prisma";
import type {
  CentralHubConfig,
  CentralHubTokenResponse,
  CentralHubUserInfo,
  CentralHubAuthResult,
} from "./types";
import { createExternalReference, getExternalReference, type IntegrationResult } from "./reference-store";

// Configuration - loaded from environment
const getConfig = (): CentralHubConfig => ({
  baseUrl: process.env.MCOM_CENTRAL_HUB_URL || "",
  apiVersion: process.env.MCOM_CENTRAL_HUB_API_VERSION || "v1",
  clientId: process.env.MCOM_CENTRAL_HUB_CLIENT_ID || "",
  clientSecret: process.env.MCOM_CENTRAL_HUB_CLIENT_SECRET || "",
  redirectUri: process.env.MCOM_CENTRAL_HUB_REDIRECT_URI || "",
  enabled: process.env.MCOM_CENTRAL_HUB_ENABLED === "true",
});

// =============================================================================
// Mock Adapter (for development before MCOM API is available)
// =============================================================================

export const centralHubMockAdapter = {
  isConfigured: (): boolean => getConfig().enabled,

  // Exchange authorization code for tokens
  async exchangeCode(_code: string, _redirectUri: string): Promise<CentralHubTokenResponse> {
    if (!getConfig().enabled) {
      throw new Error("Central Hub integration is not enabled");
    }

    // MOCK: Return a fake token response for development
    return {
      accessToken: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresIn: 3600,
      tokenType: "Bearer",
      scope: "openid profile email",
    };
  },

  // Fetch user info from Central Hub
  async getUserInfo(_accessToken: string): Promise<CentralHubUserInfo> {
    if (!getConfig().enabled) {
      throw new Error("Central Hub integration is not enabled");
    }

    // MOCK: Return a fake user for development
    return {
      externalId: `mcom_user_${Date.now()}`,
      email: "mock@centralhub.mcom",
      firstName: "MCOM",
      lastName: "User",
    };
  },

  // Link a FundOrDonate user to a Central Hub identity
  async linkUser(userId: string, externalUserInfo: CentralHubUserInfo): Promise<IntegrationResult> {
    try {
      const existing = await getExternalReference("central_hub", "user", userId);
      if (existing) {
        return { success: true, referenceId: existing.id, note: "Already linked" };
      }

      const ref = await createExternalReference({
        provider: "central_hub",
        entityType: "user",
        entityId: userId,
        externalId: externalUserInfo.externalId,
        externalData: {
          email: externalUserInfo.email,
          firstName: externalUserInfo.firstName,
          lastName: externalUserInfo.lastName,
          businessId: externalUserInfo.businessId,
          businessName: externalUserInfo.businessName,
        },
        status: "active",
      });

      return { success: true, referenceId: ref.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // Unlink a FundOrDonate user from Central Hub
  async unlinkUser(userId: string): Promise<IntegrationResult> {
    try {
      const existing = await getExternalReference("central_hub", "user", userId);
      if (!existing) {
        return { success: true, note: "Not linked" };
      }

      await prisma.externalReference.update({
        where: { id: existing.id },
        data: { status: "revoked" },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // Validate a Central Hub access token
  async validateToken(accessToken: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    if (!getConfig().enabled) {
      return { valid: false, error: "Central Hub integration is not enabled" };
    }

    // MOCK: For development, accept any token starting with "mock_"
    if (accessToken.startsWith("mock_")) {
      return { valid: true, userId: "mock_user" };
    }

    return { valid: false, error: "Invalid token" };
  },

  // Get the authorization URL for redirect
  getAuthorizationUrl(state: string): string {
    const config = getConfig();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state,
    });
    return `${config.baseUrl}/${config.apiVersion}/authorize?${params.toString()}`;
  },
};

// =============================================================================
// Production Adapter (requires real MCOM Central Hub API)
// =============================================================================

export const centralHubProductionAdapter = {
  isConfigured: (): boolean => {
    const config = getConfig();
    return config.enabled && !!(config.baseUrl && config.clientId && config.clientSecret);
  },

  async exchangeCode(code: string, redirectUri: string): Promise<CentralHubTokenResponse> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Central Hub token exchange failed: ${error}`);
    }

    return response.json() as Promise<CentralHubTokenResponse>;
  },

  async getUserInfo(accessToken: string): Promise<CentralHubUserInfo> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Central Hub userinfo failed: ${error}`);
    }

    const data = await response.json() as Record<string, unknown>;
    return {
      externalId: data.sub as string,
      email: data.email as string,
      firstName: data.given_name as string | undefined,
      lastName: data.family_name as string | undefined,
    };
  },

  async linkUser(userId: string, externalUserInfo: CentralHubUserInfo): Promise<IntegrationResult> {
    return centralHubMockAdapter.linkUser(userId, externalUserInfo);
  },

  async unlinkUser(userId: string): Promise<IntegrationResult> {
    return centralHubMockAdapter.unlinkUser(userId);
  },

  async validateToken(accessToken: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    const config = getConfig();
    try {
      const response = await fetch(`${config.baseUrl}/${config.apiVersion}/token/validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return { valid: false, error: "Token validation failed" };
      }

      const data = await response.json() as Record<string, unknown>;
      return { valid: true, userId: data.userId as string };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  },

  getAuthorizationUrl(state: string): string {
    return centralHubMockAdapter.getAuthorizationUrl(state);
  },
};

// =============================================================================
// Active Adapter (selects mock or production based on config)
// =============================================================================

export const centralHubAdapter = {
  isConfigured: (): boolean => centralHubProductionAdapter.isConfigured(),

  async authenticate(code: string): Promise<CentralHubAuthResult> {
    try {
      if (!centralHubProductionAdapter.isConfigured()) {
        if (!centralHubMockAdapter.isConfigured()) {
          return { success: false, error: "Central Hub integration is not enabled" };
        }
        const tokens = await centralHubMockAdapter.exchangeCode(code, getConfig().redirectUri);
        const userInfo = await centralHubMockAdapter.getUserInfo(tokens.accessToken);
        return { success: true, user: userInfo };
      }

      const tokens = await centralHubProductionAdapter.exchangeCode(code, getConfig().redirectUri);
      const userInfo = await centralHubProductionAdapter.getUserInfo(tokens.accessToken);
      return { success: true, user: userInfo };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async linkUser(userId: string, externalUserInfo: CentralHubUserInfo): Promise<IntegrationResult> {
    if (!centralHubProductionAdapter.isConfigured()) {
      return centralHubMockAdapter.linkUser(userId, externalUserInfo);
    }
    return centralHubProductionAdapter.linkUser(userId, externalUserInfo);
  },

  async unlinkUser(userId: string): Promise<IntegrationResult> {
    if (!centralHubProductionAdapter.isConfigured()) {
      return centralHubMockAdapter.unlinkUser(userId);
    }
    return centralHubProductionAdapter.unlinkUser(userId);
  },

  getAuthorizationUrl(state: string): string {
    return centralHubMockAdapter.getAuthorizationUrl(state);
  },
};

export default centralHubAdapter;
