import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// =============================================================================
// MCOM Rewards provider API client (ecosystem service mesh, direct app-to-app).
//
// FundOrDonate mints a short-lived RS256 service token from MCOM Central Hub
// (control plane) and calls the MCOM Rewards `/api/v1/partner/*` API directly.
// The peer verifies the token offline via JWKS — Central is never in the data
// path. Tokens are cached and refreshed ~60s before expiry.
//
// Provider contract: see docs / integration brief. Responses are camelCase and
// are NOT wrapped in an envelope. Errors are `{ success:false, message, ... }`.
// =============================================================================

export type McomRewardSource = "mcom vault" | "partner" | "business";
export type McomRewardType =
  | "Voucher"
  | "gift card"
  | "coupon"
  | "point offer"
  | "physical product";
export type McomIssuanceStatus =
  | "ISSUED"
  | "REDEEMED"
  | "EXPIRED"
  | "REVOKED"
  | "FAILED";

export interface McomRewardCatalogueItem {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
  rewardType: McomRewardType | string;
  source: McomRewardSource | string;
  audience: string;
  status: string;
  value: number | null;
  maxPoints: number | null;
  maxStampsRequired: number | null;
  isPointsEnabled: boolean;
  isStampsEnabled: boolean;
  quantity: number;
  expiresAt: string | null;
  updatedAt: string | null;
}

export interface McomRewardCataloguePage {
  data: McomRewardCatalogueItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface McomRewardCatalogueQuery {
  page?: number;
  limit?: number;
  search?: string;
  rewardType?: string;
  audience?: string;
}

export interface McomRewardRecipient {
  email?: string;
  mcomUserId?: string;
  name?: string;
}

/**
 * The business on whose behalf the reward is issued. Its MCOM entitlement
 * (active subscription, trial, or MCOM Rewards in its membership package) is
 * verified by the provider before issuance — at least one of `mcomUserId` /
 * `email` is required.
 */
export interface McomIssuingBusiness {
  mcomUserId?: string;
  email?: string;
}

export interface McomRewardIssueInput {
  /** Required by the provider — the entitled sponsor business. */
  business: McomIssuingBusiness;
  recipient: McomRewardRecipient;
  quantity?: number;
  /** Stable key — idempotent per (clientId, idempotencyKey). Always send one. */
  idempotencyKey: string;
  /** Caller-side correlation ref (e.g. campaignId). */
  externalRef?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface McomRewardIssuance {
  id: string;
  rewardId: string;
  rewardTitle: string | null;
  issuerClientId: string;
  externalRef: string | null;
  idempotencyKey: string;
  recipient: {
    email?: string | null;
    mcomUserId?: string | null;
    userId?: string | null;
    userType?: string | null;
    name?: string | null;
    resolved: boolean;
  };
  code: string | null;
  status: McomIssuanceStatus | string;
  rewardType: string;
  value: number | null;
  pointsAwarded: number | null;
  mallReference: string | null;
  quantity: number;
  expiresAt: string | null;
  redeemedAt: string | null;
  revokedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface McomRewardIssuancePage {
  data: McomRewardIssuance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Stable machine codes returned by the MCOM Rewards partner API. Most errors
 * carry `code: null`; these are the ones worth branching on.
 */
export const MCOM_ERROR_CODES = {
  /** 403 — sponsor business has no active subscription/trial/entitlement. Fatal. */
  BUSINESS_NOT_ENTITLED: "BUSINESS_NOT_ENTITLED",
  /** 403 — entitlement could not be verified (Central down). Retryable. */
  ENTITLEMENT_UNAVAILABLE: "ENTITLEMENT_UNAVAILABLE",
} as const;

/**
 * Error raised for any non-2xx / transport failure talking to MCOM Rewards.
 *
 * Models the provider's error envelope:
 * `{ success:false, message: string|string[], code: string|null, timestamp }`
 * (branch on HTTP status first, then `code`, then `message` for humans).
 */
export class McomRewardsError extends Error {
  /** HTTP status from the provider (or a synthetic 408/502/503 for transport issues). */
  readonly httpStatus: number;
  /** Stable machine code when the provider supplies one, else null. */
  readonly code: string | null;
  /** Every human message (validation errors arrive as an array). */
  readonly messages: string[];
  /** True for validation errors (message was an array). */
  readonly validation: boolean;
  /**
   * Whether retrying the same call could succeed: network/timeout, 429, 5xx,
   * and `ENTITLEMENT_UNAVAILABLE`. Everything else (400/401/403/404) is fatal.
   */
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(opts: {
    httpStatus: number;
    message: string | string[];
    code?: string | null;
    retryable?: boolean;
    validation?: boolean;
    details?: unknown;
  }) {
    const messages = Array.isArray(opts.message) ? opts.message : [opts.message];
    super(messages.filter(Boolean).join("\n") || `MCOM Rewards request failed (${opts.httpStatus})`);
    this.name = "McomRewardsError";
    this.httpStatus = opts.httpStatus;
    this.code = opts.code ?? null;
    this.messages = messages;
    this.validation = opts.validation ?? Array.isArray(opts.message);
    this.retryable = opts.retryable ?? isRetryableStatus(opts.httpStatus, opts.code ?? null);
    this.details = opts.details;
  }

  get isAuthError(): boolean {
    return this.httpStatus === 401;
  }
  get isBusinessNotEntitled(): boolean {
    return this.code === MCOM_ERROR_CODES.BUSINESS_NOT_ENTITLED;
  }
  get isEntitlementUnavailable(): boolean {
    return this.code === MCOM_ERROR_CODES.ENTITLEMENT_UNAVAILABLE;
  }
  /** A point offer whose recipient cannot resolve to a participant account. */
  get isRecipientUnresolved(): boolean {
    return this.httpStatus === 400 && /resolvable to a participant|participant account/i.test(this.message);
  }
}

/** Provider retry policy: network/429/5xx/ENTITLEMENT_UNAVAILABLE are retryable. */
export function isRetryableStatus(status: number, code: string | null): boolean {
  if (code === MCOM_ERROR_CODES.ENTITLEMENT_UNAVAILABLE) return true;
  if (status === 408) return true;
  if (status === 429) return true;
  if (status >= 500) return true;
  return false;
}

/** Parse the provider's error envelope into our error shape. */
function toMcomError(status: number, data: unknown): McomRewardsError {
  const env = (data ?? {}) as { message?: string | string[]; code?: string | null };
  const raw = env.message;
  const validation = Array.isArray(raw);
  const messages = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return new McomRewardsError({
    httpStatus: status,
    message: messages.length ? messages : `MCOM Rewards request failed (${status})`,
    code: env.code ?? null,
    validation,
    details: data,
  });
}

export const MCOM_REWARD_SCOPES = {
  READ: "rewards:read",
  ISSUE: "rewards:issue",
  REDEEM: "rewards:redeem",
} as const;

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class RewardsClient {
  private readonly logger = new Logger(RewardsClient.name);
  private readonly centralUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly audience: string;
  private readonly rewardsBaseUrl: string;
  private readonly tokenCache = new Map<string, CachedToken>();

  constructor(private readonly config: ConfigService) {
    this.centralUrl = this.config.get<string>("mcom.baseUrl") ?? "http://localhost:3010";
    this.clientId = this.config.get<string>("mcom.clientId") ?? "fundordonate";
    this.clientSecret = this.config.get<string>("mcom.clientSecret") ?? "";
    this.audience = this.config.get<string>("mcom.rewardsAudience") ?? "mcom-rewards";
    this.rewardsBaseUrl = this.config.get<string>("mcom.rewardsBaseUrl") ?? "http://localhost:4000";
  }

  /**
   * Mint (or reuse a cached) short-lived RS256 service token for the configured
   * MCOM Rewards audience. Cached per scope and refreshed 60s before expiry.
   */
  async getServiceToken(scope: string): Promise<string> {
    const cached = this.tokenCache.get(scope);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.token;
    }

    if (!this.clientSecret) {
      throw new McomRewardsError({
        httpStatus: 500,
        message: "MCOM_CLIENT_SECRET is not configured",
        retryable: false,
      });
    }

    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    try {
      const { data } = await axios.post(
        `${this.centralUrl}/api/v1/auth/service-token`,
        { grant_type: "client_credentials", audience: this.audience, scope },
        {
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        },
      );

      const token = String(data?.access_token ?? "");
      if (!token) {
        throw new McomRewardsError({
          httpStatus: 502,
          message: "Central Hub returned no access_token",
          details: data,
          retryable: true,
        });
      }
      const expiresIn = Number(data?.expires_in ?? 300);
      this.tokenCache.set(scope, {
        token,
        expiresAt: Date.now() + Math.max(expiresIn, 30) * 1000,
      });
      return token;
    } catch (err) {
      if (err instanceof McomRewardsError) throw err;
      const status = axios.isAxiosError(err) ? (err.response?.status ?? 503) : 503;
      const details = axios.isAxiosError(err) ? err.response?.data : (err as Error).message;
      this.logger.error(
        `Failed to mint MCOM service token (scope=${scope}) -> ${status}: ${JSON.stringify(details)}`,
      );
      throw new McomRewardsError({
        httpStatus: status,
        message: "Failed to obtain MCOM service token from Central Hub",
        retryable: isRetryableStatus(status, null),
        details,
      });
    }
  }

  /** Drop a cached token so the next call re-mints (used after a 401). */
  invalidateToken(scope: string): void {
    this.tokenCache.delete(scope);
  }

  /**
   * Call a MCOM Rewards provider route directly with a Bearer service token.
   */
  private async call<T>(
    path: string,
    opts: {
      method?: "GET" | "POST";
      scope: string;
      params?: Record<string, unknown>;
      body?: unknown;
    },
  ): Promise<T> {
    // Per the provider contract: on 401 the token is missing/invalid/expired/
    // wrong-audience — re-mint once and retry the call before giving up.
    return this.attempt<T>(path, opts, false);
  }

  private async attempt<T>(
    path: string,
    opts: {
      method?: "GET" | "POST";
      scope: string;
      params?: Record<string, unknown>;
      body?: unknown;
    },
    retriedAuth: boolean,
  ): Promise<T> {
    const token = await this.getServiceToken(opts.scope);
    const url = `${this.rewardsBaseUrl.replace(/\/+$/, "")}/api/v1${path}`;

    const request: AxiosRequestConfig = {
      url,
      method: opts.method ?? "GET",
      params: opts.params,
      data: opts.body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Origin-App": this.clientId,
      },
      timeout: 12000,
      validateStatus: () => true,
    };

    let response: AxiosResponse<T>;
    try {
      response = await axios.request<T>(request);
    } catch (err) {
      // Transport failure / timeout — always retryable.
      this.logger.error(
        `MCOM Rewards ${opts.method ?? "GET"} ${path} transport error: ${(err as Error).message}`,
      );
      throw new McomRewardsError({
        httpStatus: axios.isAxiosError(err) && err.response ? (err.response.status || 503) : 503,
        message: "MCOM Rewards is unavailable",
        retryable: true,
        details: (err as Error).message,
      });
    }

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const parsed = toMcomError(response.status, response.data);

    // 401 → re-mint once and retry.
    if (response.status === 401 && !retriedAuth) {
      this.logger.warn(
        `MCOM Rewards ${opts.method ?? "GET"} ${path} returned 401 (${parsed.message}); re-minting service token and retrying once`,
      );
      this.invalidateToken(opts.scope);
      return this.attempt<T>(path, opts, true);
    }

    this.logger.warn(
      `MCOM Rewards ${opts.method ?? "GET"} ${path} -> ${response.status}` +
        `${parsed.code ? ` [${parsed.code}]` : ""}: ${parsed.message.replace(/\n/g, " | ")}` +
        `${parsed.retryable ? " (retryable)" : " (fatal)"}`,
    );
    throw parsed;
  }

  // ── Catalogue ────────────────────────────────────────────────────────────

  listRewards(query: McomRewardCatalogueQuery = {}): Promise<McomRewardCataloguePage> {
    return this.call<McomRewardCataloguePage>("/partner/rewards", {
      scope: MCOM_REWARD_SCOPES.READ,
      params: query as Record<string, unknown>,
    });
  }

  getReward(id: string): Promise<McomRewardCatalogueItem> {
    return this.call<McomRewardCatalogueItem>(
      `/partner/rewards/${encodeURIComponent(id)}`,
      { scope: MCOM_REWARD_SCOPES.READ },
    );
  }

  // ── Issuance lifecycle ───────────────────────────────────────────────────

  issueReward(rewardId: string, input: McomRewardIssueInput): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(
      `/partner/rewards/${encodeURIComponent(rewardId)}/issue`,
      { method: "POST", scope: MCOM_REWARD_SCOPES.ISSUE, body: input },
    );
  }

  listIssuances(
    query: { page?: number; limit?: number; externalRef?: string } = {},
  ): Promise<McomRewardIssuancePage> {
    return this.call<McomRewardIssuancePage>("/partner/issuances", {
      scope: MCOM_REWARD_SCOPES.READ,
      params: query as Record<string, unknown>,
    });
  }

  getIssuance(id: string): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(`/partner/issuances/${encodeURIComponent(id)}`, {
      scope: MCOM_REWARD_SCOPES.READ,
    });
  }

  redeemIssuance(id: string, body?: Record<string, unknown>): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(`/partner/issuances/${encodeURIComponent(id)}/redeem`, {
      method: "POST",
      scope: MCOM_REWARD_SCOPES.REDEEM,
      body: body ?? {},
    });
  }

  revokeIssuance(id: string, body?: Record<string, unknown>): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(`/partner/issuances/${encodeURIComponent(id)}/revoke`, {
      method: "POST",
      scope: MCOM_REWARD_SCOPES.ISSUE,
      body: body ?? {},
    });
  }
}
