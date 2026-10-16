import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { createHmac } from "crypto";
import {
  McomTokenResponse,
  McomUserInfo,
  PlatformEntitlement,
} from "./mcom.types";

/**
 * Thin HTTP client for MCOM Central Hub. Holds all Central-facing calls so the
 * rest of the app never deals with Central's transport details.
 */
@Injectable()
export class McomClient {
  private readonly logger = new Logger(McomClient.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string;
  private readonly apiKey?: string;
  private readonly hmacSecret?: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("mcom.baseUrl") ?? "http://localhost:3010";
    this.clientId = config.get<string>("mcom.clientId") ?? "";
    this.clientSecret = config.get<string>("mcom.clientSecret") ?? "";
    this.redirectUri = config.get<string>("mcom.redirectUri") ?? "";
    this.scopes = config.get<string>("mcom.scopes") ?? "profile email";
    this.apiKey = config.get<string>("mcom.apiKey");
    this.hmacSecret = config.get<string>("mcom.hmacSecret");

    this.http = axios.create({
      baseURL: `${this.baseUrl}/api/v1`,
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
    });
  }

  /** Build the Central authorize URL the browser is redirected to. */
  buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      state,
      scope: this.scopes,
    });
    return `${this.baseUrl}/api/v1/auth/sso/authorize?${params.toString()}`;
  }

  /** Server-to-server code exchange. */
  async exchangeCode(code: string): Promise<McomTokenResponse> {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const { data } = await this.http.post<McomTokenResponse>(
      "/auth/sso/token",
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      },
      { headers: { Authorization: `Basic ${basic}` } },
    );
    return data;
  }

  /** Refresh a Central access token. */
  async refreshCentralToken(
    refreshToken: string,
  ): Promise<Partial<McomTokenResponse>> {
    const { data } = await this.http.post("/auth/sso/token/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  }

  /** Fetch the user profile + entitlement using a Bearer access token. */
  async getUserInfo(accessToken: string): Promise<McomUserInfo> {
    const { data } = await this.http.get<McomUserInfo>("/auth/sso/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-client-id": this.clientId,
      },
    });
    return data;
  }

  /** Introspect a user's entitlement via the server API key (no user token). */
  async getEntitlementForUser(
    userId: string,
  ): Promise<{ entitlement: PlatformEntitlement | null }> {
    const { data } = await this.http.get("/auth/sso/entitlement", {
      params: { client_id: this.clientId, user_id: userId },
      headers: this.apiKey ? { "X-API-Key": this.apiKey } : {},
    });
    return data;
  }

  /** Terminate the Central SSO session for an access token. */
  async logoutCentral(accessToken: string): Promise<void> {
    try {
      await this.http.post("/auth/sso/logout", { access_token: accessToken });
    } catch (error) {
      this.logger.warn(`Central logout failed: ${(error as Error).message}`);
    }
  }

  /** URL the browser is sent to in order to end the Central session. */
  buildLogoutUrl(returnUrl: string): string {
    return `${this.baseUrl}/api/v1/auth/sso/logout?redirect_uri=${encodeURIComponent(returnUrl)}`;
  }

  /**
   * HMAC-SHA256 headers for the Central data-sharing API.
   * (Used by Phase 3 — server-to-server membership/permission queries.)
   */
  hmacHeaders(): Record<string, string> {
    if (!this.hmacSecret) {
      throw new Error("MCOM_HMAC_SECRET is not configured");
    }
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", this.hmacSecret)
      .update(`${this.clientId}:${timestamp}`)
      .digest("hex");
    return {
      "X-Service-Id": this.clientId,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    };
  }
}
