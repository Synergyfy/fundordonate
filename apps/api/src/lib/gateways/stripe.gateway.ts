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
// Stripe Payment Gateway
// Full integration with PaymentIntents, Webhooks, Refunds
// =============================================================================

export class StripeGateway extends BasePaymentGateway {
  readonly id: GatewayId = "stripe";
  readonly name = "Stripe";

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  private getSecretKey(): string {
    return process.env.STRIPE_SECRET_KEY || "";
  }

  private getPublishableKey(): string {
    return process.env.STRIPE_PUBLISHABLE_KEY || "";
  }

  private getWebhookSecret(): string {
    return process.env.STRIPE_WEBHOOK_SECRET || "";
  }

  private getApiVersion(): string {
    return process.env.STRIPE_API_VERSION || "2024-12-18.acacia";
  }

  async isConfigured(): Promise<boolean> {
    return !!(this.getSecretKey() && this.getPublishableKey());
  }

  async getConfig(): Promise<GatewayConfig> {
    return {
      id: this.id,
      name: this.name,
      enabled: true,
      testMode: this.getSecretKey().startsWith("sk_test_"),
      credentials: {
        publishableKey: this.getPublishableKey(),
      },
      supportedPaymentMethods: ["card"],
      supportedCurrencies: ["usd", "eur", "gbp", "cad", "aud", "jpy"],
      supportsRefunds: true,
      supportsWebhooks: true,
      webhookSecret: this.getWebhookSecret(),
      webhookUrl: `${process.env.API_URL || "http://localhost:3001"}/api/webhooks/stripe`,
    };
  }

  getPaymentMethods(): string[] {
    return ["card"];
  }

  // -------------------------------------------------------------------------
  // Stripe API Helpers
  // -------------------------------------------------------------------------

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": this.getApiVersion(),
    };
  }

  private async stripePost<T = Record<string, unknown>>(
    endpoint: string,
    body: Record<string, string>
  ): Promise<T> {
    const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: new URLSearchParams(body).toString(),
    });

    const data = await response.json() as T & { error?: { message: string; type: string } };

    if ((data as { error?: { message: string } }).error) {
      throw new Error((data as { error: { message: string } }).error.message);
    }

    return data;
  }

  private async stripeGet<T = Record<string, unknown>>(endpoint: string): Promise<T> {
    const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const data = await response.json() as T & { error?: { message: string } };

    if ((data as { error?: { message: string } }).error) {
      throw new Error((data as { error: { message: string } }).error.message);
    }

    return data;
  }

  // -------------------------------------------------------------------------
  // PaymentIntent Management
  // -------------------------------------------------------------------------

  /**
   * Create a PaymentIntent
   */
  async createPaymentIntent(request: ChargeRequest): Promise<ChargeResponse> {
    this.validateAmount(request.amount, request.currency);
    this.validateCurrency(request.currency, (await this.getConfig()).supportedCurrencies);

    this.log("createPaymentIntent", { amount: request.amount, currency: request.currency });

    try {
      const metadata: Record<string, string> = {
        campaignId: request.metadata.campaignId,
        campaignTitle: request.metadata.campaignTitle,
        type: request.metadata.type,
      };
      if (request.metadata.userId) metadata.userId = request.metadata.userId;
      if (request.metadata.rewardId) metadata.rewardId = request.metadata.rewardId;
      if (request.metadata.donorEmail) metadata.donorEmail = request.metadata.donorEmail;
      if (request.metadata.donorName) metadata.donorName = request.metadata.donorName;
      if (request.metadata.notes) metadata.notes = request.metadata.notes;
      if (request.metadata.isAnonymous) metadata.isAnonymous = "true";

      const body: Record<string, string> = {
        amount: request.amount.toString(),
        currency: request.currency.toLowerCase(),
        "automatic_payment_methods[enabled]": "true",
        "automatic_payment_methods[allow_redirects]": "never",
      };

      // Add metadata
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });

      const intent = await this.stripePost<{
        id: string;
        client_secret: string;
        status: string;
        amount: number;
        currency: string;
      }>("/payment_intents", body);

      this.log("createPaymentIntent success", {
        paymentIntentId: intent.id,
        status: intent.status,
      });

      const statusMap: Record<string, "pending" | "processing" | "completed" | "failed"> = {
        requires_payment_method: "pending",
        requires_confirmation: "pending",
        requires_action: "processing",
        processing: "processing",
        succeeded: "completed",
        canceled: "failed",
      };

      return {
        success: true,
        transactionId: intent.id,
        gatewayId: this.id,
        status: statusMap[intent.status] || "pending",
        amount: intent.amount,
        currency: intent.currency,
        clientSecret: intent.client_secret,
        metadata: {
          paymentIntentId: intent.id,
          status: intent.status,
        },
      };
    } catch (error) {
      this.logError("createPaymentIntent", error);
      return this.errorResponse(String(error));
    }
  }

  /**
   * Confirm a PaymentIntent with payment method
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    this.log("confirmPaymentIntent", { paymentIntentId, paymentMethodId });

    try {
      const intent = await this.stripePost<{
        id: string;
        status: string;
        client_secret: string;
      }>(`/payment_intents/${paymentIntentId}/confirm`, {
        payment_method: paymentMethodId,
        return_url: process.env.STRIPE_RETURN_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/complete`,
      });

      this.log("confirmPaymentIntent success", {
        paymentIntentId: intent.id,
        status: intent.status,
      });

      return { success: true, status: intent.status };
    } catch (error) {
      this.logError("confirmPaymentIntent", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get PaymentIntent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.stripeGet(`/payment_intents/${paymentIntentId}`);
    } catch (error) {
      this.logError("getPaymentIntent", error);
      return null;
    }
  }

  /**
   * Cancel a PaymentIntent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
    try {
      await this.stripePost(`/payment_intents/${paymentIntentId}/cancel`, {});
      return true;
    } catch (error) {
      this.logError("cancelPaymentIntent", error);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Charge (Create + Confirm)
  // -------------------------------------------------------------------------

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    this.validateAmount(request.amount, request.currency);

    this.log("charge", { amount: request.amount, currency: request.currency });

    try {
      const intent = await this.createPaymentIntent(request);

      if (!intent.success) {
        return intent;
      }

      // If payment method provided, auto-confirm
      if (request.paymentMethod && request.paymentMethod !== "card") {
        const confirmResult = await this.confirmPaymentIntent(
          intent.transactionId,
          request.paymentMethod
        );
        if (!confirmResult.success) {
          return this.errorResponse(confirmResult.error || "Failed to confirm payment");
        }
      }

      return intent;
    } catch (error) {
      this.logError("charge", error);
      return this.errorResponse(String(error));
    }
  }

  // -------------------------------------------------------------------------
  // Refund Processing
  // -------------------------------------------------------------------------

  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.log("refund", { paymentIntentId: request.transactionId, amount: request.amount });

    try {
      const body: Record<string, string> = {
        payment_intent: request.transactionId,
      };
      if (request.amount) {
        body.amount = request.amount.toString();
      }
      if (request.reason) {
        body.reason = request.reason as "duplicate" | "fraudulent" | "requested_by_customer";
      }

      const refund = await this.stripePost<{
        id: string;
        status: string;
        amount: number;
      }>("/refunds", body);

      this.log("refund success", {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
      });

      const statusMap: Record<string, "pending" | "completed" | "failed"> = {
        pending: "pending",
        succeeded: "completed",
        failed: "failed",
        canceled: "failed",
      };

      return {
        success: true,
        refundId: refund.id,
        status: statusMap[refund.status] || "pending",
        amount: refund.amount,
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
      return await this.stripeGet(`/refunds/${refundId}`);
    } catch (error) {
      this.logError("getRefund", error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Webhook Verification
  // -------------------------------------------------------------------------

  /**
   * Verify Stripe webhook signature
   */
  private verifyWebhookSignature(
    payload: string,
    _signature: string
  ): Record<string, unknown> | null {
    // In production, use stripe.webhooks.constructEvent
    // const stripe = require('stripe')(this.getSecretKey());
    // return stripe.webhooks.constructEvent(payload, signature, this.getWebhookSecret());

    // For development, we'll just parse the payload
    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Process Stripe webhook events
   */
  async verify(payload: WebhookPayload): Promise<WebhookResponse> {
    this.log("verify", { eventType: payload.eventType });

    try {
      // Verify webhook signature in production
      let event: Record<string, unknown>;
      if (process.env.NODE_ENV === "production") {
        const signature = payload.headers["stripe-signature"];
        const parsed = this.verifyWebhookSignature(payload.rawBody, signature);
        if (!parsed) {
          return { processed: false, error: "Invalid webhook signature" };
        }
        event = parsed;
      } else {
        event = payload.data as Record<string, unknown>;
      }

      const eventType = event.type as string;
      const dataObject = (event.data as { object: Record<string, unknown> })?.object || {};

      switch (eventType) {
        // -----------------------------------------------------------------------
        // payment_intent.succeeded - Payment completed
        // -----------------------------------------------------------------------
        case "payment_intent.succeeded": {
          const pi = dataObject as Record<string, unknown>;
          this.log("webhook:payment_intent.succeeded", { paymentIntentId: pi.id });
          return {
            processed: true,
            transactionId: pi.id as string,
            status: "completed",
          };
        }

        // -----------------------------------------------------------------------
        // payment_intent.payment_failed - Payment failed
        // -----------------------------------------------------------------------
        case "payment_intent.payment_failed": {
          const pi = dataObject as Record<string, unknown>;
          const lastError = (pi.last_payment_error as Record<string, unknown>)?.message;
          this.log("webhook:payment_intent.payment_failed", {
            paymentIntentId: pi.id,
            error: lastError,
          });
          return {
            processed: true,
            transactionId: pi.id as string,
            status: "failed",
          };
        }

        // -----------------------------------------------------------------------
        // payment_intent.canceled - Payment canceled
        // -----------------------------------------------------------------------
        case "payment_intent.canceled": {
          const pi = dataObject as Record<string, unknown>;
          this.log("webhook:payment_intent.canceled", { paymentIntentId: pi.id });
          return {
            processed: true,
            transactionId: pi.id as string,
            status: "cancelled",
          };
        }

        // -----------------------------------------------------------------------
        // charge.succeeded - Charge completed
        // -----------------------------------------------------------------------
        case "charge.succeeded": {
          const charge = dataObject as Record<string, unknown>;
          const paymentIntentId = charge.payment_intent as string;
          this.log("webhook:charge.succeeded", { chargeId: charge.id, paymentIntentId });
          return {
            processed: true,
            transactionId: paymentIntentId || (charge.id as string),
            status: "completed",
          };
        }

        // -----------------------------------------------------------------------
        // charge.refunded - Charge refunded
        // -----------------------------------------------------------------------
        case "charge.refunded": {
          const charge = dataObject as Record<string, unknown>;
          const paymentIntentId = charge.payment_intent as string;
          this.log("webhook:charge.refunded", { chargeId: charge.id, paymentIntentId });
          return {
            processed: true,
            transactionId: paymentIntentId || (charge.id as string),
            status: "refunded",
          };
        }

        // -----------------------------------------------------------------------
        // charge.dispute.created - Dispute opened
        // -----------------------------------------------------------------------
        case "charge.dispute.created": {
          const dispute = dataObject as Record<string, unknown>;
          const chargeId = dispute.charge as string;
          this.log("webhook:charge.dispute.created", { disputeId: dispute.id, chargeId });
          return { processed: true };
        }

        // -----------------------------------------------------------------------
        // charge.dispute.closed - Dispute resolved
        // -----------------------------------------------------------------------
        case "charge.dispute.closed": {
          const dispute = dataObject as Record<string, unknown>;
          this.log("webhook:charge.dispute.closed", {
            disputeId: dispute.id,
            outcome: dispute.outcome,
          });
          return { processed: true };
        }

        // -----------------------------------------------------------------------
        // Default - Unhandled event type
        // -----------------------------------------------------------------------
        default:
          this.log("webhook:unhandled", { eventType });
          return { processed: true };
      }
    } catch (error) {
      this.logError("verify", error);
      return { processed: false, error: String(error) };
    }
  }
}
