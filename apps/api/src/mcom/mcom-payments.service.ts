import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export class McomPaymentsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "McomPaymentsError";
  }
}

export interface McomWalletBalance {
  success: boolean;
  balance: number;
  availableBalance: number;
  status: "ACTIVE" | "FROZEN" | "SUSPENDED" | "CLOSED";
  currency: "MCOM";
}

export interface McomWalletTransactionResult {
  success: boolean;
  transactionId: string;
  type: "DEBIT" | "CREDIT" | "HOLD_CAPTURE";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  reference?: string;
  idempotencyKey?: string;
  processedAt: string;
}

export interface CreateMcomChargeInput {
  amountMinor: string; // e.g. "1000" for £10.00
  method: "stripe" | "paypal" | "wallet";
  reference: string;
  currency?: string;
  description?: string;
  mcomUserId?: string;
  externalCustomerId?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
}

export interface McomChargeRecord {
  id: string;
  appClientId: string;
  amountMinor: string;
  currency: string;
  feeMinor: string;
  netMinor: string;
  method: "stripe" | "paypal" | "wallet";
  status: "pending" | "paid" | "failed" | "refunded";
  reference: string;
  provider: string;
  providerRef?: string;
  createdAt: string;
}

export interface CreateMcomChargeResponse {
  charge: McomChargeRecord;
  clientSecret?: string; // stripe
  approvalUrl?: string; // paypal
}

export interface ConfirmMcomChargeInput {
  paymentIntentId?: string;
  orderId?: string;
}

export interface McomWebhookPayload {
  event: "payment.succeeded" | "payment.refunded";
  platform: string;
  timestamp: string;
  data: {
    chargeId: string;
    amountMinor: string;
    feeMinor: string;
    netMinor: string;
    currency: string;
    method: "stripe" | "paypal" | "wallet";
    status: string;
    reference: string;
    mcomUserId?: string;
    externalCustomerId?: string;
    provider: string;
    providerRef?: string;
    paidAt?: string;
  };
}

@Injectable()
export class McomPaymentsService {
  private readonly logger = new Logger(McomPaymentsService.name);
  private readonly base: string;
  private readonly clientId: string;
  private readonly hmacSecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.base = this.config.get<string>("mcom.baseUrl") ?? "http://localhost:3010";
    this.clientId = this.config.get<string>("mcom.clientId") ?? "fundordonate";
    this.hmacSecret = this.config.get<string>("mcom.hmacSecret") ?? "";
    this.webhookSecret = this.config.get<string>("mcom.webhookSecret") ?? "";
  }

  private sign(body: unknown): string {
    if (!this.hmacSecret) {
      throw new Error("MCOM_HMAC_SECRET is not configured");
    }
    const raw = typeof body === "string" ? body : JSON.stringify(body);
    return (
      "sha256=" +
      crypto.createHmac("sha256", this.hmacSecret).update(raw).digest("hex")
    );
  }

  private headers(body: unknown, idempKey?: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Mcom-Client-ID": this.clientId,
      "X-Mcom-Signature": this.sign(body),
      ...(idempKey ? { "X-Idempotency-Key": idempKey } : {}),
    };
  }

  private async call<T>(
    path: string,
    body?: unknown,
    method = "POST",
    idempKey?: string,
  ): Promise<T> {
    const isGet = method === "GET";
    const payload = isGet ? "" : body ?? {};
    const url = `${this.base}/api/v1${path}`;

    this.logger.debug(`[MCOM Call] ${method} ${url}`);

    try {
      const res = await fetch(url, {
        method,
        headers: this.headers(payload, idempKey),
        ...(isGet ? {} : { body: JSON.stringify(payload) }),
      });

      const json: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        this.logger.warn(
          `[MCOM Error] ${method} ${url} responded ${res.status}: ${JSON.stringify(json)}`,
        );
        throw new McomPaymentsError(
          json.error || json.code || "MCOM_PAYMENT_ERROR",
          json.message || res.statusText || "Request failed",
          res.status,
          json,
        );
      }

      return json as T;
    } catch (err: unknown) {
      if (err instanceof McomPaymentsError) {
        throw err;
      }
      this.logger.error(`Network or fetch error calling MCOM: ${(err as Error).message}`);
      throw new McomPaymentsError("MCOM_UNAVAILABLE", (err as Error).message, 503);
    }
  }

  // ── Wallet ──────────────────────────────────────────────────────────────

  /**
   * Check a user's wallet balance in MCOM Central Hub.
   */
  async getBalance(userId: string): Promise<McomWalletBalance> {
    return this.call<McomWalletBalance>(
      `/wallet/partner/balance/${encodeURIComponent(userId)}`,
      undefined,
      "GET",
    );
  }

  /**
   * Debit a user's prepaid wallet balance directly.
   */
  async debit(
    userId: string,
    amount: number,
    opts: {
      category: string;
      description: string;
      reference?: string;
      metadata?: Record<string, unknown>;
      idempotencyKey: string;
    },
  ): Promise<McomWalletTransactionResult> {
    const { idempotencyKey, ...rest } = opts;
    return this.call<McomWalletTransactionResult>(
      "/wallet/partner/debit",
      { userId, amount, ...rest },
      "POST",
      idempotencyKey,
    );
  }

  /**
   * Credit a user's wallet (e.g. cashback, reward, refund).
   */
  async credit(
    userId: string,
    amount: number,
    opts: {
      category: string;
      description: string;
      reference?: string;
      metadata?: Record<string, unknown>;
      idempotencyKey: string;
    },
  ): Promise<McomWalletTransactionResult> {
    const { idempotencyKey, ...rest } = opts;
    return this.call<McomWalletTransactionResult>(
      "/wallet/partner/credit",
      { userId, amount, ...rest },
      "POST",
      idempotencyKey,
    );
  }

  /**
   * Place a hold (pre-authorization) on wallet funds.
   */
  async holdPlace(
    userId: string,
    amount: number,
    opts?: {
      description?: string;
      reference?: string;
      metadata?: Record<string, unknown>;
      idempotencyKey?: string;
    },
  ): Promise<{ success: boolean; holdId: string; expiresAt: string }> {
    return this.call(
      "/wallet/partner/hold/place",
      { userId, amount, ...opts },
      "POST",
      opts?.idempotencyKey,
    );
  }

  /**
   * Capture a previously placed hold.
   */
  async holdCapture(
    holdId: string,
    opts?: { idempotencyKey?: string },
  ): Promise<McomWalletTransactionResult> {
    return this.call(
      "/wallet/partner/hold/capture",
      { holdId },
      "POST",
      opts?.idempotencyKey,
    );
  }

  /**
   * Release a previously placed hold back to available balance.
   */
  async holdRelease(holdId: string): Promise<{ success: boolean; released: boolean }> {
    return this.call("/wallet/partner/hold/release", { holdId }, "POST");
  }

  // ── MCOM Pay ────────────────────────────────────────────────────────────

  /**
   * Create a charge on MCOM Pay (method = stripe | paypal | wallet).
   * Amounts MUST be passed in minor units (pence) as an integer string.
   */
  async createCharge(input: CreateMcomChargeInput): Promise<CreateMcomChargeResponse> {
    const { idempotencyKey, ...body } = input;
    return this.call<CreateMcomChargeResponse>(
      "/app-payments/charges",
      body,
      "POST",
      idempotencyKey,
    );
  }

  /**
   * Confirm a charge once client has completed payment.
   */
  async confirmCharge(
    chargeId: string,
    handle: ConfirmMcomChargeInput = {},
  ): Promise<{ charge: McomChargeRecord }> {
    return this.call<{ charge: McomChargeRecord }>(
      `/app-payments/charges/${encodeURIComponent(chargeId)}/confirm`,
      handle,
      "POST",
    );
  }

  /**
   * Refund a paid charge (full or partial).
   */
  async refundCharge(
    chargeId: string,
    opts?: { amountMinor?: string; reason?: string },
  ): Promise<{ charge: McomChargeRecord; refund: unknown }> {
    return this.call(
      `/app-payments/charges/${encodeURIComponent(chargeId)}/refund`,
      opts ?? {},
      "POST",
    );
  }

  /**
   * Look up a charge by ID.
   */
  async getCharge(chargeId: string): Promise<{ charge: McomChargeRecord }> {
    return this.call<{ charge: McomChargeRecord }>(
      `/app-payments/charges/${encodeURIComponent(chargeId)}`,
      undefined,
      "GET",
    );
  }

  /**
   * Verify an incoming server-to-server webhook signature from Central Hub.
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn("MCOM_WEBHOOK_SECRET is not configured — webhook verification aborted");
      return false;
    }
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
      return false;
    }

    const expectedSig =
      "sha256=" +
      crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

    try {
      const a = Buffer.from(signatureHeader, "utf8");
      const b = Buffer.from(expectedSig, "utf8");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
