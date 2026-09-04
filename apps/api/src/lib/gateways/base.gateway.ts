import type {
  GatewayConfig,
  GatewayId,
  IPaymentGateway,
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  WebhookResponse,
} from "./types";
import { logger } from "../logger";

// =============================================================================
// Base Payment Gateway
// Common utilities shared by all gateway implementations
// =============================================================================

export abstract class BasePaymentGateway implements IPaymentGateway {
  abstract readonly id: GatewayId;
  abstract readonly name: string;

  protected config: GatewayConfig | null = null;

  // Abstract methods - must be implemented by subclasses
  abstract getConfig(): Promise<GatewayConfig>;
  abstract charge(request: ChargeRequest): Promise<ChargeResponse>;
  abstract refund(request: RefundRequest): Promise<RefundResponse>;
  abstract verify(payload: WebhookPayload): Promise<WebhookResponse>;
  abstract getPaymentMethods(): string[];
  abstract isConfigured(): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Common Utilities
  // -------------------------------------------------------------------------

  /**
   * Validate that the request amount is positive and within limits
   */
  protected validateAmount(amount: number, currency: string): void {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }
    if (!currency || currency.length !== 3) {
      throw new Error("Invalid currency code");
    }
  }

  /**
   * Validate currency is supported by this gateway
   */
  protected validateCurrency(currency: string, supported: string[]): void {
    if (!supported.includes(currency.toUpperCase())) {
      throw new Error(`Currency ${currency} is not supported by ${this.name}`);
    }
  }

  /**
   * Validate payment method is supported
   */
  protected validatePaymentMethod(method: string, supported: string[]): void {
    if (!supported.includes(method)) {
      throw new Error(`Payment method ${method} is not supported by ${this.name}`);
    }
  }

  /**
   * Generate a unique transaction ID
   */
  protected generateTransactionId(): string {
    return `${this.id}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Log gateway operations
   */
  protected log(operation: string, data: Record<string, unknown>): void {
    logger.info(`[${this.name}] ${operation}`, data);
  }

  /**
   * Log gateway errors
   */
  protected logError(operation: string, error: unknown): void {
    logger.error(`[${this.name}] ${operation} failed`, { error: String(error) });
  }

  /**
   * Create a success response
   */
  protected successResponse(
    transactionId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>
  ): ChargeResponse {
    return {
      success: true,
      transactionId,
      gatewayId: this.id,
      status: "completed",
      amount,
      currency,
      metadata,
    };
  }

  /**
   * Create a failure response
   */
  protected errorResponse(error: string): ChargeResponse {
    return {
      success: false,
      transactionId: "",
      gatewayId: this.id,
      status: "failed",
      amount: 0,
      currency: "",
      error,
    };
  }

  /**
   * Create a pending response
   */
  protected pendingResponse(
    transactionId: string,
    amount: number,
    currency: string,
    clientSecret?: string,
    redirectUrl?: string
  ): ChargeResponse {
    return {
      success: true,
      transactionId,
      gatewayId: this.id,
      status: "pending",
      amount,
      currency,
      clientSecret,
      redirectUrl,
    };
  }
}
