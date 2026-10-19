import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// =============================================================================
// 247GBS Audit partner API client (ecosystem service mesh, direct app-to-app).
//
// FundOrDonate exchanges the signed-in user's MCOM SSO access token for a
// short-lived RS256 **delegated** token (audience `247gbs-audit`) at MCOM
// Central and calls 247GBS Audit's `/api/v1/partner/audit-data/*` routes
// directly. 247GBS Audit verifies the token offline against Central's JWKS —
// Central is never in the data path. Only delegated tokens are accepted; there
// is no user id in the path (identity always comes from the token's `sub`).
//
// Contract source of truth: `apps/api/src/partner/` in the 247gbs-audit repo
// (see `apps/api/docs/partner-m2m.md`). Responses are camelCase and are NOT
// wrapped in an envelope. Errors are `{ error, code }` (401/403) or the Nest
// shape `{ statusCode, message, error }` (404).
// =============================================================================

export const AUDIT_SCOPES = {
  PRE_AUDIT_READ: "preaudit:read",
  AUDIT_READ: "audit:read",
} as const;

/** The combined scope used by `/summary`. */
export const AUDIT_SUMMARY_SCOPE = `${AUDIT_SCOPES.PRE_AUDIT_READ} ${AUDIT_SCOPES.AUDIT_READ}`;

/** Machine codes the provider returns on the peer surface. */
export const AUDIT_ERROR_CODES = {
  PEER_TOKEN_MISSING: "PEER_TOKEN_MISSING",
  PEER_TOKEN_INVALID: "PEER_TOKEN_INVALID",
  PEER_SUBJECT_MISSING: "PEER_SUBJECT_MISSING",
  PEER_NOT_CONFIGURED: "PEER_NOT_CONFIGURED",
  PEER_DELEGATION_REQUIRED: "PEER_DELEGATION_REQUIRED",
  PEER_CALLER_DENIED: "PEER_CALLER_DENIED",
  PEER_SCOPE_MISSING: "PEER_SCOPE_MISSING",
  PARTNER_CONSENT_REQUIRED: "PARTNER_CONSENT_REQUIRED",
} as const;

export interface AuditDiagnosticSummary {
  funding: {
    fundingNeed: number | null;
    fundingNeedFormatted: string | null;
    ownContribution: number | null;
    ownContributionFormatted: string | null;
    otherContribution: number | null;
    otherContributionFormatted: string | null;
    fundingGap: number | null;
    fundingGapFormatted: string | null;
    status: "fully_funded" | "gap_identified" | "not_specified";
    timing: string | null;
    season: string | null;
  };
  marketing: {
    budget: number | null;
    budgetFormatted: string | null;
    needs: string[];
    timing: string | null;
    digitalPresence: string | null;
    channels: string[];
  };
  operations: {
    excessStockLevel: string | null;
    excessStockSeasonal: boolean;
    excessStockPeakSeason: string | null;
    spareCapacityType: string[];
    spareCapacityLevel: string | null;
    spareCapacitySeasonal: boolean;
    spareCapacityPeakSeason: string | null;
  };
  business: {
    category: string | null;
    location: string | null;
    operatingStatus: string | null;
    operatingTenure: string | null;
    identifiedNeeds: string[];
  };
  readiness: {
    level: "immediate" | "preparation_needed" | "blocked" | "not_specified";
    label: string;
    details: string[];
  };
  accountant: {
    involved: boolean;
    email: string | null;
  };
  recommendation: {
    auditType: "SHORT_FORM" | "LONG_FORM";
    title: string;
    rationale: string;
    keyTakeaway: string;
  };
}

export interface AuditPreAudit {
  available: boolean;
  reason?: "no_email" | "no_pre_audit";
  id?: string;
  recommendedAuditType?: string | null;
  destinationType?: string | null;
  destinationTarget?: string | null;
  consentVersion?: string;
  completedAt?: string | null;
  diagnosticSummary?: AuditDiagnosticSummary;
}

export interface AuditMetrics {
  capacityDrainPct: number;
  totalStockImpact: number;
  annualRecovery: number;
  impactScore: number;
}

export interface AuditSummary {
  id: string;
  status: string;
  auditType: string | null;
  scopes: string[];
  sectorId: string | null;
  groupId: string | null;
  businessTypeId: string | null;
  preAuditSessionId: string | null;
  calculatedMetrics: AuditMetrics | null;
  aiInsight: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditListResponse {
  available: boolean;
  reason?: "no_email" | "no_pre_audit" | "consent_required";
  count: number;
  audits: AuditSummary[];
}

export interface AuditSummaryResponse {
  available: boolean;
  preAudit: AuditPreAudit;
  audits: AuditListResponse;
}

/**
 * Error raised for any non-2xx / transport failure talking to 247GBS Audit.
 * Branch on HTTP status first, then `code`.
 */
export class AuditApiError extends Error {
  readonly httpStatus: number;
  readonly code: string | null;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(opts: {
    httpStatus: number;
    message: string;
    code?: string | null;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(opts.message || `247GBS Audit request failed (${opts.httpStatus})`);
    this.name = "AuditApiError";
    this.httpStatus = opts.httpStatus;
    this.code = opts.code ?? null;
    this.retryable = opts.retryable ?? isRetryableStatus(opts.httpStatus);
    this.details = opts.details;
  }

  /** 404 — no linked 247GBS account, or the audit doesn't belong to the user. */
  get isNotFound(): boolean {
    return this.httpStatus === 404;
  }
  /** 403 PARTNER_CONSENT_REQUIRED — a user-consent state, not a request bug. */
  get isConsentRequired(): boolean {
    return this.code === AUDIT_ERROR_CODES.PARTNER_CONSENT_REQUIRED;
  }
  /** Any other 401/403 — an authentication/authorization/config problem. */
  get isPeerError(): boolean {
    return (
      (this.httpStatus === 401 || this.httpStatus === 403) &&
      !this.isConsentRequired
    );
  }
}

/** Network/429/5xx are retryable; 400/401/403/404 are deterministic. */
export function isRetryableStatus(status: number): boolean {
  if (status === 408) return true;
  if (status === 429) return true;
  if (status >= 500) return true;
  return false;
}

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class AuditClient {
  private readonly logger = new Logger(AuditClient.name);
  private readonly centralUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly audience: string;
  private readonly auditBaseUrl: string;
  /** Keyed `${userId}:${scope}` — never share a token across users. */
  private readonly tokenCache = new Map<string, CachedToken>();

  constructor(private readonly config: ConfigService) {
    this.centralUrl =
      this.config.get<string>("mcom.baseUrl") ?? "http://localhost:3010";
    this.clientId = this.config.get<string>("mcom.clientId") ?? "fundordonate";
    this.clientSecret = this.config.get<string>("mcom.clientSecret") ?? "";
    this.audience = this.config.get<string>("audit.audience") ?? "247gbs-audit";
    this.auditBaseUrl =
      this.config.get<string>("audit.apiBaseUrl") ?? "http://localhost:9008";
  }

  /**
   * Mint (or reuse a cached) delegated token for `userId`, acting on the
   * signed-in user's behalf (RFC 8693). Cached per user+scope and refreshed
   * 60s before expiry — never minted per request, never shared across users.
   */
  async getDelegatedToken(
    userId: string,
    subjectToken: string,
    scope: string,
  ): Promise<string> {
    const cacheKey = `${userId}:${scope}`;
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.token;
    }

    if (!this.clientSecret) {
      throw new AuditApiError({
        httpStatus: 500,
        message: "MCOM_CLIENT_SECRET is not configured",
        retryable: false,
      });
    }

    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );

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
        throw new AuditApiError({
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
      if (err instanceof AuditApiError) throw err;
      const status = axios.isAxiosError(err)
        ? (err.response?.status ?? 503)
        : 503;
      const details = axios.isAxiosError(err)
        ? err.response?.data
        : (err as Error).message;
      this.logger.error(
        `Failed to mint delegated 247GBS Audit token (scope=${scope}) -> ${status}: ${JSON.stringify(
          details,
        )}`,
      );
      throw new AuditApiError({
        httpStatus: status,
        message: "Failed to obtain delegated token from Central Hub",
        code:
          (details as { code?: string } | undefined)?.code ?? null,
        retryable: isRetryableStatus(status),
        details,
      });
    }
  }

  /** Drop a cached delegated token so the next call re-mints (used after a 401). */
  invalidateDelegatedToken(userId: string, scope: string): void {
    this.tokenCache.delete(`${userId}:${scope}`);
  }

  // ── Partner routes ─────────────────────────────────────────────────────────

  getPreAudit(
    userId: string,
    subjectToken: string,
  ): Promise<AuditPreAudit> {
    return this.call<AuditPreAudit>(
      userId,
      subjectToken,
      "/pre-audit",
      AUDIT_SCOPES.PRE_AUDIT_READ,
    );
  }

  getAudits(
    userId: string,
    subjectToken: string,
  ): Promise<AuditListResponse> {
    return this.call<AuditListResponse>(
      userId,
      subjectToken,
      "/audits",
      AUDIT_SCOPES.AUDIT_READ,
    );
  }

  /** Combined pre-audit + audits (needs both scopes) — the funding-decision view. */
  getSummary(
    userId: string,
    subjectToken: string,
  ): Promise<AuditSummaryResponse> {
    return this.call<AuditSummaryResponse>(
      userId,
      subjectToken,
      "/summary",
      AUDIT_SUMMARY_SCOPE,
    );
  }

  // ── Transport ──────────────────────────────────────────────────────────────

  private async call<T>(
    userId: string,
    subjectToken: string,
    path: string,
    scope: string,
  ): Promise<T> {
    // Per the provider contract: on 401 the token is missing/invalid/expired/
    // wrong-audience — re-mint once and retry before giving up.
    return this.attempt<T>(userId, subjectToken, path, scope, false);
  }

  private async attempt<T>(
    userId: string,
    subjectToken: string,
    path: string,
    scope: string,
    retriedAuth: boolean,
  ): Promise<T> {
    const token = await this.getDelegatedToken(userId, subjectToken, scope);
    const url = `${this.auditBaseUrl.replace(/\/+$/, "")}/api/v1/partner/audit-data${path}`;

    const request: AxiosRequestConfig = {
      url,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Caller-Id": this.clientId,
      },
      timeout: 10000,
      validateStatus: () => true,
    };

    let response: AxiosResponse<T>;
    try {
      response = await axios.request<T>(request);
    } catch (err) {
      this.logger.error(
        `247GBS Audit GET ${path} transport error: ${(err as Error).message}`,
      );
      throw new AuditApiError({
        httpStatus:
          axios.isAxiosError(err) && err.response
            ? err.response.status || 503
            : 503,
        message: "247GBS Audit is unavailable",
        retryable: true,
        details: (err as Error).message,
      });
    }

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const parsed = toAuditError(response.status, response.data);

    // 401 → re-mint once and retry.
    if (response.status === 401 && !retriedAuth) {
      this.logger.warn(
        `247GBS Audit GET ${path} returned 401 (${parsed.message}); re-minting delegated token and retrying once`,
      );
      this.invalidateDelegatedToken(userId, scope);
      return this.attempt<T>(userId, subjectToken, path, scope, true);
    }

    this.logger.warn(
      `247GBS Audit GET ${path} -> ${response.status}` +
        `${parsed.code ? ` [${parsed.code}]` : ""}: ${parsed.message}` +
        `${parsed.retryable ? " (retryable)" : " (fatal)"}`,
    );
    throw parsed;
  }
}

/** Parse the provider's error body into our error shape. */
function toAuditError(status: number, data: unknown): AuditApiError {
  const body = (data ?? {}) as {
    error?: string;
    code?: string;
    message?: string | string[];
    statusCode?: number;
  };
  const message =
    body.error ??
    (Array.isArray(body.message) ? body.message.join("; ") : body.message) ??
    `247GBS Audit request failed (${status})`;

  return new AuditApiError({
    httpStatus: status,
    message,
    code: body.code ?? null,
    details: data,
  });
}
