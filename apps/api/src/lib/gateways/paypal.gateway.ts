import { BasePaymentGateway } from "./base.gateway";
import type {
  GatewayConfig,
  GatewayId,
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  WebhookResponse,
} from "./types";

// =============================================================================
// PayPal REST API v2 Gateway
// Full integration with OAuth, Orders, Vault, Webhooks
// =============================================================================

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class PayPalGateway extends BasePaymentGateway {
  readonly id: GatewayId = "paypal";
  readonly name = "PayPal";

  private cachedToken: CachedToken | null = null;

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  private getClientId(): string {
    return process.env.PAYPAL_CLIENT_ID || "";
  }

  private getClientSecret(): string {
    return process.env.PAYPAL_CLIENT_SECRET || "";
  }

  private getWebhookId(): string {
    return process.env.PAYPAL_WEBHOOK_ID || "";
  }

  private getBaseUrl(): string {
    const mode = process.env.PAYPAL_MODE || "sandbox";
    return mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  private getReturnUrl(): string {
    return process.env.PAYPAL_RETURN_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/complete`;
  }

  private getCancelUrl(): string {
    return process.env.PAYPAL_CANCEL_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/cancel`;
  }

  async isConfigured(): Promise<boolean> {
    return !!(this.getClientId() && this.getClientSecret());
  }

  async getConfig(): Promise<GatewayConfig> {
    const mode = process.env.PAYPAL_MODE || "sandbox";
    return {
      id: this.id,
      name: this.name,
      enabled: true,
      testMode: mode === "sandbox",
      credentials: {
        clientId: this.getClientId(),
      },
      supportedPaymentMethods: ["paypal", "card", "credit", "debit"],
      supportedCurrencies: ["usd", "eur", "gbp", "cad", "aud", "jpy"],
      supportsRefunds: true,
      supportsWebhooks: true,
      webhookSecret: this.getWebhookId(),
      webhookUrl: `${process.env.API_URL || "http://localhost:3001"}/api/webhooks/paypal`,
    };
  }

  getPaymentMethods(): string[] {
    return ["paypal", "card", "credit", "debit"];
  }

  // -------------------------------------------------------------------------
  // OAuth Token Management (with caching)
  // -------------------------------------------------------------------------

  private async getAccessToken(): Promise<string> {
    // Check cached token (with 5 min buffer before expiry)
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 300000) {
      return this.cachedToken.token;
    }

    const auth = Buffer.from(`${this.getClientId()}:${this.getClientSecret()}`).toString("base64");

    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const error = await response.json();
      this.logError("getAccessToken", error);
      throw new Error(`PayPal OAuth failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    // Cache the token
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    this.log("getAccessToken", { expiresIn: data.expires_in });
    return data.access_token;
  }

  /**
   * Generate client token for PayPal SDK (for vault/hosted fields)
   */
  async getClientToken(): Promise<string> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.getBaseUrl()}/v1/identity/generate-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept-Language": "en_US",
      },
      body: JSON.stringify({
        customer_id: undefined, // For guest checkout
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PayPal client token");
    }

    const data = (await response.json()) as { client_token: string };
    return data.client_token;
  }

  // -------------------------------------------------------------------------
  // Order Management
  // -------------------------------------------------------------------------

  /**
   * Create a PayPal order (CAPTURE intent)
   * Returns the order ID for client-side approval
   */
  async createOrder(request: ChargeRequest): Promise<ChargeResponse> {
    this.validateAmount(request.amount, request.currency);
    this.validateCurrency(request.currency, (await this.getConfig()).supportedCurrencies);

    this.log("createOrder", { amount: request.amount, currency: request.currency });

    try {
      const accessToken = await this.getAccessToken();

      const orderBody = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: request.currency.toUpperCase(),
              value: (request.amount / 100).toFixed(2),
              breakdown: request.metadata.type === "donation"
                ? {
                    item_total: {
                      currency_code: request.currency.toUpperCase(),
                      value: (request.amount / 100).toFixed(2),
                    },
                  }
                : undefined,
            },
            description: `${request.metadata.type === "donation" ? "Donation" : "Pledge"} to ${request.metadata.campaignTitle}`,
            custom_id: request.metadata.campaignId,
            soft_descriptor: "FUNDORDONATE",
            invoice_id: `FD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              brand_name: "FundorDonate",
              locale: "en-US",
              landing_page: "BILLING",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: this.getReturnUrl(),
              cancel_url: this.getCancelUrl(),
            },
          },
        },
        application_context: {
          brand_name: "FundorDonate",
          locale: "en-US",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      };

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(orderBody),
      });

      const order = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        this.logError("createOrder", order);
        return this.errorResponse(
          (order as { message?: string }).message || "Failed to create PayPal order"
        );
      }

      // Find the approval URL
      const links = (order.links as Array<{ rel: string; href: string; method: string }>) || [];
      const approveLink = links.find((l) => l.rel === "approve");
      const selfLink = links.find((l) => l.rel === "self");

      this.log("createOrder success", { orderId: order.id, status: order.status });

      return {
        success: true,
        transactionId: order.id as string,
        gatewayId: this.id,
        status: "pending",
        amount: request.amount,
        currency: request.currency,
        redirectUrl: approveLink?.href,
        clientSecret: selfLink?.href,
        metadata: {
          orderId: order.id,
          status: order.status,
          approveUrl: approveLink?.href,
        },
      };
    } catch (error) {
      this.logError("createOrder", error);
      return this.errorResponse(String(error));
    }
  }

  /**
   * Capture an approved PayPal order
   */
  async captureOrder(orderId: string): Promise<{
    success: boolean;
    captureId?: string;
    status?: string;
    error?: string;
  }> {
    this.log("captureOrder", { orderId });

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      });

      const result = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        this.logError("captureOrder", result);
        return {
          success: false,
          error: (result as { message?: string }).message || "Failed to capture order",
        };
      }

      const purchaseUnits = result.purchase_units as Array<{
        payments: {
          captures: Array<{
            id: string;
            status: string;
            amount: { currency_code: string; value: string };
          }>;
        };
      }>;

      const capture = purchaseUnits?.[0]?.payments?.captures?.[0];

      this.log("captureOrder success", {
        orderId,
        captureId: capture?.id,
        status: capture?.status,
      });

      return {
        success: true,
        captureId: capture?.id || (result.id as string),
        status: capture?.status || (result.status as string),
      };
    } catch (error) {
      this.logError("captureOrder", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get order details by ID
   */
  async getOrder(orderId: string): Promise<Record<string, unknown> | null> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      this.logError("getOrder", error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Charge (Create + Auto-Capture)
  // -------------------------------------------------------------------------

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    this.validateAmount(request.amount, request.currency);

    this.log("charge", { amount: request.amount, currency: request.currency });

    try {
      // Step 1: Create order
      const orderResponse = await this.createOrder(request);

      if (!orderResponse.success || !orderResponse.transactionId) {
        return orderResponse;
      }

      // Step 2: Auto-capture (for server-side flow)
      const captureResult = await this.captureOrder(orderResponse.transactionId);

      if (!captureResult.success) {
        return this.errorResponse(captureResult.error || "Failed to capture PayPal payment");
      }

      this.log("charge success", {
        orderId: orderResponse.transactionId,
        captureId: captureResult.captureId,
      });

      return this.successResponse(
        captureResult.captureId || orderResponse.transactionId,
        request.amount,
        request.currency,
        {
          orderId: orderResponse.transactionId,
          captureId: captureResult.captureId,
        }
      );
    } catch (error) {
      this.logError("charge", error);
      return this.errorResponse(String(error));
    }
  }

  // -------------------------------------------------------------------------
  // Refund Processing
  // -------------------------------------------------------------------------

  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.log("refund", { captureId: request.transactionId, amount: request.amount });

    try {
      const accessToken = await this.getAccessToken();

      const body: Record<string, unknown> = {};
      if (request.amount) {
        body.amount = {
          value: (request.amount / 100).toFixed(2),
          currency_code: "USD",
        };
      }
      if (request.reason) {
        body.note_to_payer = request.reason;
      }

      const response = await fetch(
        `${this.getBaseUrl()}/v2/payments/captures/${request.transactionId}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(body),
        }
      );

      const refund = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        this.logError("refund", refund);
        return {
          success: false,
          refundId: "",
          status: "failed",
          amount: 0,
          error: (refund as { message?: string }).message || "PayPal refund failed",
        };
      }

      const statusMap: Record<string, "pending" | "completed" | "failed"> = {
        COMPLETED: "completed",
        PENDING: "pending",
        CANCELLED: "failed",
        FAILED: "failed",
      };

      this.log("refund success", {
        refundId: refund.id,
        status: refund.status,
      });

      return {
        success: true,
        refundId: refund.id as string,
        status: statusMap[(refund.status as string)] || "pending",
        amount: request.amount || 0,
      };
    } catch (error) {
      this.logError("refund", error);
      return {
        success: false,
        refundId: "",
        status: "failed",
        amount: 0,
        error: String(error),
      };
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<Record<string, unknown> | null> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.getBaseUrl()}/v2/payments/refunds/${refundId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      this.logError("getRefund", error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Vault (Saved Payment Methods)
  // -------------------------------------------------------------------------

  /**
   * Generate a vault setup token for saving payment methods
   */
  async createVaultSetupToken(): Promise<{ setupToken: string; error?: string }> {
    this.log("createVaultSetupToken", {});

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.getBaseUrl()}/v1/vault/setup-tokens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_source: {
            paypal: {
              usage_type: "MERCHANT",
              experience_context: {
                brand_name: "FundorDonate",
                shipping_preference: "NO_SHIPPING",
                user_action: "CONTINUE",
                return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/vault-complete`,
                cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/vault-cancel`,
              },
            },
          },
        }),
      });

      const result = await response.json() as { id: string; status: string };

      if (!response.ok) {
        this.logError("createVaultSetupToken", result);
        return { setupToken: "", error: "Failed to create vault setup token" };
      }

      this.log("createVaultSetupToken success", { setupTokenId: result.id });
      return { setupToken: result.id };
    } catch (error) {
      this.logError("createVaultSetupToken", error);
      return { setupToken: "", error: String(error) };
    }
  }

  /**
   * Approve a vault setup token and get payment token
   */
  async approveVaultSetupToken(
    setupTokenId: string
  ): Promise<{ paymentTokenId: string; error?: string }> {
    this.log("approveVaultSetupToken", { setupTokenId });

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/v1/vault/setup-tokens/${setupTokenId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json() as {
        id: string;
        status: string;
        payment_source?: Record<string, unknown>;
      };

      if (!response.ok) {
        this.logError("approveVaultSetupToken", result);
        return { paymentTokenId: "", error: "Failed to approve vault setup token" };
      }

      this.log("approveVaultSetupToken success", { status: result.status });
      return { paymentTokenId: result.id };
    } catch (error) {
      this.logError("approveVaultSetupToken", error);
      return { paymentTokenId: "", error: String(error) };
    }
  }

  /**
   * List saved payment tokens for a customer
   */
  async listPaymentTokens(customerId: string): Promise<Record<string, unknown>[]> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/v1/vault/payment-tokens?customer_id=${customerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) return [];
      const data = (await response.json()) as { payment_tokens?: Record<string, unknown>[] };
      return data.payment_tokens || [];
    } catch (error) {
      this.logError("listPaymentTokens", error);
      return [];
    }
  }

  /**
   * Delete a saved payment token
   */
  async deletePaymentToken(paymentTokenId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/v1/vault/payment-tokens/${paymentTokenId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      this.logError("deletePaymentToken", error);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Charge with Saved Token
  // -------------------------------------------------------------------------

  /**
   * Charge using a saved PayPal payment token
   */
  async chargeWithToken(
    paymentTokenId: string,
    amount: number,
    currency: string,
    metadata: ChargeRequest["metadata"]
  ): Promise<ChargeResponse> {
    this.validateAmount(amount, currency);

    this.log("chargeWithToken", { paymentTokenId, amount, currency });

    try {
      const accessToken = await this.getAccessToken();

      // Create and capture order with vaulted payment source
      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency.toUpperCase(),
                value: (amount / 100).toFixed(2),
              },
              description: `${metadata.type} - ${metadata.campaignTitle}`,
              custom_id: metadata.campaignId,
            },
          ],
          payment_source: {
            token: {
              id: paymentTokenId,
              type: "PAYMENT_METHOD_TOKEN",
            },
          },
        }),
      });

      const order = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        this.logError("chargeWithToken", order);
        return this.errorResponse(
          (order as { message?: string }).message || "Failed to charge with saved token"
        );
      }

      const purchaseUnits = (order.purchase_units as Array<{
        payments: { captures: Array<{ id: string; status: string }> };
      }>) || [];

      const capture = purchaseUnits[0]?.payments?.captures?.[0];

      this.log("chargeWithToken success", {
        orderId: order.id,
        captureId: capture?.id,
      });

      return this.successResponse(
        capture?.id || (order.id as string),
        amount,
        currency,
        { orderId: order.id, captureId: capture?.id }
      );
    } catch (error) {
      this.logError("chargeWithToken", error);
      return this.errorResponse(String(error));
    }
  }

  // -------------------------------------------------------------------------
  // Webhook Verification
  // -------------------------------------------------------------------------

  /**
   * Verify PayPal webhook signature
   */
  private async verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: headers["paypal-auth-algo"],
          cert_id: headers["paypal-cert-id"],
          signature: headers["paypal-signature"],
          timestamp: headers["paypal-timestamp"],
          webhook_id: this.getWebhookId(),
          webhook_event: JSON.parse(rawBody),
        }),
      });

      const result = (await response.json()) as { verification_status: string };
      return result.verification_status === "SUCCESS";
    } catch (error) {
      this.logError("verifyWebhookSignature", error);
      return false;
    }
  }

  /**
   * Process PayPal webhook events
   */
  async verify(payload: WebhookPayload): Promise<WebhookResponse> {
    this.log("verify", { eventType: payload.eventType });

    try {
      // Verify webhook signature in production
      if (process.env.NODE_ENV === "production") {
        const isValid = await this.verifyWebhookSignature(
          payload.headers,
          payload.rawBody
        );
        if (!isValid) {
          return { processed: false, error: "Invalid webhook signature" };
        }
      }

      const event = payload.data as Record<string, unknown>;
      const resource = (event.resource as Record<string, unknown>) || {};

      switch (payload.eventType) {
        // -----------------------------------------------------------------------
        // CHECKOUT.ORDER.APPROVED - Order approved by buyer
        // -----------------------------------------------------------------------
        case "CHECKOUT.ORDER.APPROVED": {
          const orderId = resource.id as string;
          this.log("webhook:CHECKOUT.ORDER.APPROVED", { orderId });
          return {
            processed: true,
            transactionId: orderId,
            status: "processing",
          };
        }

        // -----------------------------------------------------------------------
        // PAYMENT.CAPTURE.COMPLETED - Payment captured successfully
        // -----------------------------------------------------------------------
        case "PAYMENT.CAPTURE.COMPLETED": {
          const captureId = resource.id as string;
          const supplementary = (event as Record<string, unknown>).supplementary_data as Record<string, unknown> | undefined;
          const relatedIds = supplementary?.related_ids as Record<string, string> | undefined;
          const orderId = relatedIds?.order_id ||
            (resource as Record<string, string>).custom_id;
          this.log("webhook:PAYMENT.CAPTURE.COMPLETED", { captureId, orderId });
          return {
            processed: true,
            transactionId: captureId,
            status: "completed",
          };
        }

        // -----------------------------------------------------------------------
        // PAYMENT.CAPTURE.REFUNDED - Payment was refunded
        // -----------------------------------------------------------------------
        case "PAYMENT.CAPTURE.REFUNDED": {
          const captureId = resource.id as string;
          this.log("webhook:PAYMENT.CAPTURE.REFUNDED", { captureId });
          return {
            processed: true,
            transactionId: captureId,
            status: "refunded",
          };
        }

        // -----------------------------------------------------------------------
        // PAYMENT.Capture.DENIED - Payment capture was denied
        // -----------------------------------------------------------------------
        case "PAYMENT.CAPTURE.DENIED": {
          const captureId = resource.id as string;
          this.log("webhook:PAYMENT.CAPTURE.DENIED", { captureId });
          return {
            processed: true,
            transactionId: captureId,
            status: "failed",
          };
        }

        // -----------------------------------------------------------------------
        // VAULT.PAYMENT-TOKEN.CREATED - Payment token saved
        // -----------------------------------------------------------------------
        case "VAULT.PAYMENT-TOKEN.CREATED": {
          const token = resource as Record<string, unknown>;
          const tokenId = token.id as string;
          const customerId = token.customer_id as string;
          this.log("webhook:VAULT.PAYMENT-TOKEN.CREATED", { tokenId, customerId });
          return {
            processed: true,
            transactionId: tokenId,
            status: "pending",
          };
        }

        // -----------------------------------------------------------------------
        // VAULT.PAYMENT-TOKEN.DELETED - Payment token removed
        // -----------------------------------------------------------------------
        case "VAULT.PAYMENT-TOKEN.DELETED": {
          const token = resource as Record<string, unknown>;
          const tokenId = token.id as string;
          this.log("webhook:VAULT.PAYMENT-TOKEN.DELETED", { tokenId });
          return { processed: true };
        }

        // -----------------------------------------------------------------------
        // Checkout order events
        // -----------------------------------------------------------------------
        case "CHECKOUT.ORDER.COMPLETED": {
          const orderId = resource.id as string;
          this.log("webhook:CHECKOUT.ORDER.COMPLETED", { orderId });
          return {
            processed: true,
            transactionId: orderId,
            status: "completed",
          };
        }

        case "CHECKOUT.ORDER.VOIDED": {
          const orderId = resource.id as string;
          this.log("webhook:CHECKOUT.ORDER.VOIDED", { orderId });
          return {
            processed: true,
            transactionId: orderId,
            status: "cancelled",
          };
        }

        // -----------------------------------------------------------------------
        // Default - Unhandled event type
        // -----------------------------------------------------------------------
        default:
          this.log("webhook:unhandled", { eventType: payload.eventType });
          return { processed: true };
      }
    } catch (error) {
      this.logError("verify", error);
      return { processed: false, error: String(error) };
    }
  }
}
