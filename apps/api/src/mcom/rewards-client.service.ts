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

/** The provider source of admin/MCOM-created rewards that can be gifted. */
export const MCOM_VAULT_SOURCE = "mcom vault";
export type McomRewardType =
  | "Voucher"
  | "gift card"
  | "coupon"
  | "point offer"
  | "physical product";
export type McomIssuanceStatus =
  | "ISSUED"
  | "RESERVED"
  | "REDEEMED"
  | "EXPIRED"
  | "REVOKED"
  | "FAILED";

/**
 * How the provider delivers a reward. Central instruments are business-only;
 * consumers must never win them. The provider's cosmetic `rewardType` must NOT
 * be used to infer this — always use `fulfilmentKind`.
 */
export type McomFulfilmentProvider = "MALL" | "CENTRAL" | string;
export type McomFulfilmentKind =
  | "MALL_GIFT_CARD"
  | "MALL_VOUCHER"
  | "MALL_COUPON"
  | "MALL_DISCOUNT"
  | "CENTRAL_MEMBERSHIP"
  | "CENTRAL_ACCESS_PASS"
  | "CENTRAL_COUPON"
  | string;
export type McomFulfilmentStatus =
  | "PENDING"
  | "DELIVERED"
  | "FAILED"
  | "REVOKED"
  | "NOT_REQUIRED"
  | "PENDING_IDENTITY"
  | "PENDING_CONFLICT";

/**
 * Fulfilment metadata exposed by the provider on catalogue rewards.
 *
 * Provider dependency: these fields already exist on the MCOM Rewards `Reward`
 * entity but are not yet on `toCatalogDto`. They are optional here so
 * FundOrDonate degrades safely (and feature-detects) until the provider
 * exposes them.
 */
export interface McomRewardFulfilmentDescriptor {
  fulfilmentProvider?: McomFulfilmentProvider | null;
  fulfilmentKind?: McomFulfilmentKind | null;
  fulfilmentConfig?: Record<string, unknown> | null;
  consumerEligible?: boolean | null;
  businessEligible?: boolean | null;
  /** Provider-rendered deep link, when supplied. */
  deepLink?: string | null;
}

export interface McomRewardCatalogueItem extends McomRewardFulfilmentDescriptor {
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
  /** Filter by reward source, e.g. "mcom vault" for admin/MCOM-created rewards. */
  source?: string;
}

export type McomRewardStatus = "active" | "draft";

/**
 * A reward a business owns (created in MCOM Rewards). FundOrDonate lists these
 * so a business can attach one of its own rewards to a campaign it runs.
 * `/partner/business-rewards`.
 */
export interface McomBusinessReward extends McomRewardFulfilmentDescriptor {
  id: string;
  businessId: string;
  title: string;
  description: string;
  image: string;
  gallery: string[] | null;
  rewardType: McomRewardType | string;
  source: McomRewardSource | string;
  audience: string;
  status: McomRewardStatus | string;
  /** Configured amount (null = not capped). */
  quantity: number | null;
  /** Still available; consumed atomically on issue. */
  remainingQuantity: number | null;
  pointsRequired: number | null;
  stampsRequired: number | null;
  isPointsEnabled: boolean;
  isStampsEnabled: boolean;
  isMallIntegrated: boolean;
  mallRewardValue: number;
  mallRewardType: "VOUCHER" | "GIFT_CARD" | "COUPON" | null;
  /** Parent catalogue reward when this business reward derives from one. */
  sourceRewardId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface McomBusinessRewardOwner {
  id: string;
  name: string;
  email: string;
  mcomUserId: string | null;
}

export interface McomBusinessRewardPage {
  business: McomBusinessRewardOwner;
  data: McomBusinessReward[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface McomListBusinessRewardsQuery {
  /** One of mcomUserId/email is required by the provider. */
  mcomUserId?: string;
  email?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: McomRewardStatus;
  rewardType?: string;
}

/**
 * Issue a business's own reward. The owning business is derived from the reward
 * by the provider — no `business` field is sent (unlike a catalogue issue).
 */
export interface McomIssueBusinessRewardInput {
  recipient: McomRewardRecipient;
  quantity?: number;
  idempotencyKey?: string;
  externalRef?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
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

/**
 * Gift an **admin/MCOM-created** ("mcom vault") reward to a recipient on behalf
 * of the platform. Unlike a catalogue issue, there is **no `business` field** —
 * this is a platform-sponsored gift, authenticated with the app-level
 * client-credentials token (scope `rewards:gift`). Omitting `business` is
 * required: the provider rejects unknown fields.
 */
export interface McomGiftRewardInput {
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
  /** Set when the issuance came from a business's own reward (§4.3.1). */
  businessRewardId?: string | null;
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

  // ── Fulfilment (the key part of the contract for the consumer UI) ───────
  fulfilmentProvider?: McomFulfilmentProvider | null;
  fulfilmentKind?: McomFulfilmentKind | null;
  fulfilmentStatus?: McomFulfilmentStatus | string | null;
  fulfilmentRef?: string | null;
  fulfilmentCode?: string | null;
  fulfilmentError?: string | null;
  centralReference?: string | null;
  deepLink?: string | null;
  fulfilledAt?: string | null;

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
  /** 400 — a consumer was selected for a Central-only (business) reward. */
  RECIPIENT_NOT_A_BUSINESS: "RECIPIENT_NOT_A_BUSINESS",
  /** 409 — membership already exists / conflicts with the requested grant. */
  MEMBERSHIP_CONFLICT: "MEMBERSHIP_CONFLICT",
  /** 400 — the reward's plan is no longer available. Fix the reward config. */
  PLAN_NOT_AVAILABLE: "PLAN_NOT_AVAILABLE",
  /** 400 — the reward's tier is no longer available. Fix the reward config. */
  TIER_NOT_AVAILABLE: "TIER_NOT_AVAILABLE",
  /** 403 — the provider feature flag is off. Retry later / alert. */
  FEATURE_DISABLED: "FEATURE_DISABLED",
  /** 409 — provider stock is exhausted. Stop retrying. */
  OUT_OF_STOCK: "OUT_OF_STOCK",
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
  /** A consumer was selected for a Central-only (business) reward. */
  get isRecipientNotABusiness(): boolean {
    return (
      this.code === MCOM_ERROR_CODES.RECIPIENT_NOT_A_BUSINESS ||
      (/not a business|business[- ]only|business recipient/i.test(this.message) &&
        (this.httpStatus === 400 || this.httpStatus === 422))
    );
  }
  /** Provider stock is exhausted — retrying will not help. */
  get isOutOfStock(): boolean {
    return (
      this.code === MCOM_ERROR_CODES.OUT_OF_STOCK ||
      /out of stock|no (?:remaining )?stock|sold out/i.test(this.message)
    );
  }
  /** The reward's plan/tier is stale or unavailable; the config must be fixed. */
  get isRewardConfigInvalid(): boolean {
    return (
      this.code === MCOM_ERROR_CODES.PLAN_NOT_AVAILABLE ||
      this.code === MCOM_ERROR_CODES.TIER_NOT_AVAILABLE
    );
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
  GIFT: "rewards:gift",
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
   * Mint a delegated service token acting on behalf of a logged-in user, from
   * their MCOM SSO access token (RFC 8693 token exchange). Used for the
   * user-scoped `/partner/issuances/me` view. Cached under a dedicated key.
   */
  async getDelegatedServiceToken(subjectToken: string, scope: string): Promise<string> {
    const cacheKey = `delegated:${scope}`;
    const cached = this.tokenCache.get(cacheKey);
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
        `${this.centralUrl}/api/v1/auth/service-token/exchange`,
        {
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          subject_token: subjectToken,
          audience: this.audience,
          scope,
        },
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
          message: "Central Hub returned no access_token for delegated exchange",
          details: data,
          retryable: true,
        });
      }
      const expiresIn = Number(data?.expires_in ?? 300);
      this.tokenCache.set(cacheKey, {
        token,
        expiresAt: Date.now() + Math.max(expiresIn, 30) * 1000,
      });
      return token;
    } catch (err) {
      if (err instanceof McomRewardsError) throw err;
      const status = axios.isAxiosError(err) ? (err.response?.status ?? 503) : 503;
      const details = axios.isAxiosError(err) ? err.response?.data : (err as Error).message;
      this.logger.error(
        `Failed to mint delegated MCOM service token (scope=${scope}) -> ${status}: ${JSON.stringify(details)}`,
      );
      throw new McomRewardsError({
        httpStatus: status,
        message: "Failed to obtain delegated MCOM service token from Central Hub",
        retryable: isRetryableStatus(status, null),
        details,
      });
    }
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
        "X-Caller-Id": this.clientId,
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

  // ── Business-owned rewards ───────────────────────────────────────────────
  // A business's own rewards (created in MCOM Rewards), which it can attach to
  // a campaign it runs. The owning business is identified by mcomUserId/email.

  listBusinessRewards(
    query: McomListBusinessRewardsQuery = {},
  ): Promise<McomBusinessRewardPage> {
    return this.call<McomBusinessRewardPage>("/partner/business-rewards", {
      scope: MCOM_REWARD_SCOPES.READ,
      params: query as Record<string, unknown>,
    });
  }

  /**
   * Issue a business's own reward. The owner (and its entitlement + stock) is
   * derived from the reward by the provider, so no `business` field is sent.
   */
  issueBusinessReward(
    businessRewardId: string,
    input: McomIssueBusinessRewardInput,
  ): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(
      `/partner/business-rewards/${encodeURIComponent(businessRewardId)}/issue`,
      { method: "POST", scope: MCOM_REWARD_SCOPES.ISSUE, body: input },
    );
  }

  // ── Issuance lifecycle ───────────────────────────────────────────────────

  issueReward(rewardId: string, input: McomRewardIssueInput): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(
      `/partner/rewards/${encodeURIComponent(rewardId)}/issue`,
      { method: "POST", scope: MCOM_REWARD_SCOPES.ISSUE, body: input },
    );
  }

  /**
   * Gift an admin/MCOM-created ("mcom vault") reward to a recipient on behalf of
   * the platform. No `business` is sent — the provider derives the platform
   * sponsor from the app-level token.
   */
  giftReward(
    rewardId: string,
    input: McomGiftRewardInput,
  ): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(
      `/partner/rewards/${encodeURIComponent(rewardId)}/gift`,
      { method: "POST", scope: MCOM_REWARD_SCOPES.GIFT, body: input },
    );
  }

  listIssuances(
    query: {
      page?: number;
      limit?: number;
      externalRef?: string;
      status?: McomIssuanceStatus | string;
      recipientEmail?: string;
      recipientMcomUserId?: string;
      recipientUserId?: string;
    } = {},
  ): Promise<McomRewardIssuancePage> {
    return this.call<McomRewardIssuancePage>("/partner/issuances", {
      scope: MCOM_REWARD_SCOPES.READ,
      params: query as Record<string, unknown>,
    });
  }

  /** Page through every issuance matching a recipient/status filter. */
  async listAllIssuances(query: {
    externalRef?: string;
    status?: McomIssuanceStatus | string;
    recipientEmail?: string;
    recipientMcomUserId?: string;
    recipientUserId?: string;
  }): Promise<McomRewardIssuance[]> {
    const limit = 100;
    const all: McomRewardIssuance[] = [];
    for (let guard = 0; guard < 100; guard += 1) {
      const page = guard + 1;
      const res = await this.listIssuances({ ...query, page, limit });
      const items = Array.isArray(res?.data) ? res.data : [];
      all.push(...items);
      const totalPages = res?.totalPages ?? 1;
      if (page >= totalPages || items.length === 0) break;
    }
    return all;
  }

  getIssuance(id: string): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(`/partner/issuances/${encodeURIComponent(id)}`, {
      scope: MCOM_REWARD_SCOPES.READ,
    });
  }

  redeemIssuance(id: string, body?: Record<string, unknown>): Promise<McomRewardIssuance> {
    return this.call<McomRewardIssuance>(`/partner/issuances/${encodeURIComponent(id)}/redeem`, {
      method: "POST",
      scope: MCOM_REWARD_SCOPES.ISSUE,
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
