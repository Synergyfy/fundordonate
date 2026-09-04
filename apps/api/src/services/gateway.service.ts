import { gatewayRegistry } from "../lib/gateways";
import type {
  GatewayConfig,
  GatewayId,
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  WebhookResponse,
} from "../lib/gateways/types";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

// =============================================================================
// Payment Gateway Service
// Orchestrates payment processing across gateways
// =============================================================================

/**
 * Initialize all payment gateways
 */
export async function initializeGateways(): Promise<void> {
  await gatewayRegistry.initialize();
}

/**
 * Get all available gateway configurations for the frontend
 */
export async function getAvailableGateways(): Promise<GatewayConfig[]> {
  return gatewayRegistry.getAvailableConfigs();
}

/**
 * Get a specific gateway's configuration
 */
export async function getGatewayConfig(gatewayId: GatewayId): Promise<GatewayConfig | null> {
  const gateway = gatewayRegistry.get(gatewayId);
  if (!gateway) return null;

  const configured = await gateway.isConfigured();
  if (!configured) return null;

  return gateway.getConfig();
}

/**
 * Process a charge through the specified gateway
 */
export async function processCharge(
  gatewayId: GatewayId,
  request: ChargeRequest
): Promise<ChargeResponse> {
  const gateway = gatewayRegistry.get(gatewayId);
  if (!gateway) {
    return {
      success: false,
      transactionId: "",
      gatewayId,
      status: "failed",
      amount: 0,
      currency: request.currency,
      error: `Gateway ${gatewayId} not found`,
    };
  }

  const configured = await gateway.isConfigured();
  if (!configured) {
    return {
      success: false,
      transactionId: "",
      gatewayId,
      status: "failed",
      amount: 0,
      currency: request.currency,
      error: `Gateway ${gatewayId} is not configured`,
    };
  }

  // Process the charge
  const response = await gateway.charge(request);

  // Record the transaction in the database
  if (response.transactionId) {
    try {
      await prisma.donation.create({
        data: {
          uid: response.transactionId,
          amount: request.amount,
          campaignId: request.metadata.campaignId,
          userId: request.metadata.userId || null,
          transactionId: response.transactionId,
          paymentEngine: gatewayId,
          paymentMethod: request.paymentMethod,
          status: response.status === "completed" ? "completed" : "pending",
          isAnonymous: request.metadata.isAnonymous || false,
          notes: request.metadata.notes || null,
          tributeType: request.metadata.tributeType || null,
          tributeTo: request.metadata.tributeTo || null,
        },
      });
    } catch (error) {
      logger.error("Failed to record donation", { error: String(error) });
    }
  }

  return response;
}

/**
 * Process a refund through the original gateway
 */
export async function processRefund(
  gatewayId: GatewayId,
  request: RefundRequest
): Promise<RefundResponse> {
  const gateway = gatewayRegistry.get(gatewayId);
  if (!gateway) {
    return {
      success: false,
      refundId: "",
      status: "failed",
      amount: 0,
      error: `Gateway ${gatewayId} not found`,
    };
  }

  return gateway.refund(request);
}

/**
 * Process a webhook event
 */
export async function processWebhook(
  gatewayId: GatewayId,
  payload: WebhookPayload
): Promise<WebhookResponse> {
  const gateway = gatewayRegistry.get(gatewayId);
  if (!gateway) {
    return { processed: false, error: `Gateway ${gatewayId} not found` };
  }

  const response = await gateway.verify(payload);

  // Update donation status based on webhook
  if (response.processed && response.transactionId && response.status) {
    try {
      await prisma.donation.updateMany({
        where: { transactionId: response.transactionId },
        data: { status: response.status as string },
      });
    } catch (error) {
      logger.error("Failed to update donation from webhook", { error: String(error) });
    }
  }

  return response;
}

/**
 * Get payment history for a user
 */
export async function getUserPaymentHistory(
  userId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      include: { campaign: { select: { id: true, title: true, slug: true, featuredImage: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.donation.count({ where: { userId } }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get payment details by transaction ID
 */
export async function getPaymentByTransactionId(transactionId: string) {
  return prisma.donation.findUnique({
    where: { uid: transactionId },
    include: {
      campaign: { select: { id: true, title: true, slug: true, featuredImage: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

/**
 * Admin: Get all payments with filters
 */
export async function getAllPayments(
  page = 1,
  limit = 50,
  filters?: {
    status?: string;
    paymentEngine?: string;
  }
) {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.paymentEngine) where.paymentEngine = filters.paymentEngine;

  const [payments, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      include: {
        campaign: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.donation.count({ where }),
  ]);

  return {
    payments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
