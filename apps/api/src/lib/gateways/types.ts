// =============================================================================
// Payment Gateway Interfaces & Contracts
// =============================================================================

export type GatewayId = "stripe" | "paypal" | "native" | "woocommerce";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled" | "denied";

export type RefundStatus = "pending" | "processing" | "completed" | "failed";

export type WebhookEventType =
  | "payment.completed"
  | "payment.failed"
  | "payment.refunded"
  | "payment.capture.completed"
  | "payment.capture.failed"
  | "CHECKOUT.ORDER.APPROVED"
  | "CHECKOUT.ORDER.COMPLETED"
  | "CHECKOUT.ORDER.VOIDED"
  | "PAYMENT.CAPTURE.COMPLETED"
  | "PAYMENT.CAPTURE.REFUNDED"
  | "PAYMENT.CAPTURE.DENIED"
  | "VAULT.PAYMENT-TOKEN.CREATED"
  | "VAULT.PAYMENT-TOKEN.DELETED"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled"
  | "charge.succeeded"
  | "charge.refunded"
  | "charge.dispute.created"
  | "charge.dispute.closed";

// =============================================================================
// Gateway Configuration
// =============================================================================

export interface GatewayConfig {
  id: GatewayId;
  name: string;
  enabled: boolean;
  testMode: boolean;
  credentials: Record<string, string>;
  supportedPaymentMethods: string[];
  supportedCurrencies: string[];
  supportsRefunds: boolean;
  supportsWebhooks: boolean;
  webhookSecret?: string;
  webhookUrl?: string;
}

// =============================================================================
// Charge Request / Response
// =============================================================================

export interface ChargeRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  metadata: ChargeMetadata;
  savePaymentMethod?: boolean;
}

export interface ChargeMetadata {
  campaignId: string;
  campaignTitle: string;
  userId?: string;
  type: "donation" | "pledge";
  rewardId?: string;
  donorEmail?: string;
  donorName?: string;
  notes?: string;
  isAnonymous?: boolean;
  tributeType?: string;
  tributeTo?: string;
}

export interface ChargeResponse {
  success: boolean;
  transactionId: string;
  gatewayId: GatewayId;
  status: PaymentStatus;
  amount: number;
  currency: string;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Refund Request / Response
// =============================================================================

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  status: RefundStatus;
  amount: number;
  error?: string;
}

// =============================================================================
// Webhook Request / Response
// =============================================================================

export interface WebhookPayload {
  gatewayId: GatewayId;
  eventType: WebhookEventType;
  rawBody: string;
  headers: Record<string, string>;
  data: Record<string, unknown>;
}

export interface WebhookResponse {
  processed: boolean;
  transactionId?: string;
  status?: PaymentStatus;
  error?: string;
}

// =============================================================================
// Payment Gateway Interface
// =============================================================================

export interface IPaymentGateway {
  readonly id: GatewayId;
  readonly name: string;

  getConfig(): Promise<GatewayConfig>;
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  verify(payload: WebhookPayload): Promise<WebhookResponse>;
  getPaymentMethods(): string[];
  isConfigured(): Promise<boolean>;
}
