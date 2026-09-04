// =============================================================================
// Terminal Integration Adapter
// Handles payment processing via MCOM Terminal POS integration
// =============================================================================

import { prisma } from "../lib/prisma";
import type {
  TerminalConfig,
  TerminalPaymentRequest,
  TerminalPaymentResponse,
  TerminalWebhookEvent,
  TerminalWebhookResult,
} from "./types";
import { createExternalReference } from "./reference-store";

const getConfig = (): TerminalConfig => ({
  baseUrl: process.env.MCOM_TERMINAL_URL || "",
  apiVersion: process.env.MCOM_TERMINAL_API_VERSION || "v1",
  merchantId: process.env.MCOM_TERMINAL_MERCHANT_ID || "",
  apiKey: process.env.MCOM_TERMINAL_API_KEY || "",
  webhookSecret: process.env.MCOM_TERMINAL_WEBHOOK_SECRET || "",
  enabled: process.env.MCOM_TERMINAL_ENABLED === "true",
});

// =============================================================================
// Mock Adapter
// =============================================================================

export const terminalMockAdapter = {
  isConfigured: (): boolean => getConfig().enabled,

  async processPayment(request: TerminalPaymentRequest): Promise<TerminalPaymentResponse> {
    if (!getConfig().enabled) {
      return { success: false, error: "Terminal integration is not enabled" };
    }

    // MOCK: Generate a fake transaction ID
    const transactionId = `term_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store the mapping
    await createExternalReference({
      provider: "terminal",
      entityType: "donation",
      entityId: "", // Will be filled when donation is created
      externalId: transactionId,
      externalData: {
        campaignId: request.campaignId,
        amount: request.amount,
        currency: request.currency,
        contributionType: request.contributionType,
        description: request.description,
        reference: request.reference,
        idempotencyKey: request.idempotencyKey,
      },
      status: "pending",
    });

    return {
      success: true,
      transactionId,
      status: "completed",
    };
  },

  async verifyWebhook(_event: TerminalWebhookEvent): Promise<boolean> {
    if (!getConfig().enabled) {
      return false;
    }

    // MOCK: Accept all webhooks in development
    return true;
  },

  async processWebhook(event: TerminalWebhookEvent): Promise<TerminalWebhookResult> {
    if (!getConfig().enabled) {
      return { processed: false, error: "Terminal integration is not enabled" };
    }

    // Find the donation by transaction ID
    const donation = await prisma.donation.findFirst({
      where: { transactionId: event.transactionId },
    });

    if (!donation) {
      return { processed: false, error: "Donation not found" };
    }

    // Update donation status
    const statusMap: Record<string, string> = {
      pending: "pending",
      processing: "pending",
      completed: "completed",
      failed: "failed",
    };

    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: statusMap[event.status] || donation.status },
    });

    return { processed: true, donationId: donation.id };
  },

  async getStatus(transactionId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    if (!getConfig().enabled) {
      return { status: "unavailable" };
    }

    // MOCK: Return completed status
    return {
      status: "completed",
      details: {
        transactionId,
        amount: 0,
        currency: "GBP",
      },
    };
  },
};

// =============================================================================
// Production Adapter (requires real MCOM Terminal API)
// =============================================================================

export const terminalProductionAdapter = {
  isConfigured: (): boolean => {
    const config = getConfig();
    return config.enabled && !!(config.baseUrl && config.merchantId && config.apiKey);
  },

  async processPayment(request: TerminalPaymentRequest): Promise<TerminalPaymentResponse> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "X-Merchant-Id": config.merchantId,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        reference: request.reference,
        metadata: {
          campaignId: request.campaignId,
          contributionType: request.contributionType,
        },
        idempotencyKey: request.idempotencyKey,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json() as {
      transactionId: string;
      status: string;
      clientSecret?: string;
    };

    // Store the mapping
    await createExternalReference({
      provider: "terminal",
      entityType: "donation",
      entityId: "",
      externalId: data.transactionId,
      externalData: {
        campaignId: request.campaignId,
        amount: request.amount,
        currency: request.currency,
        contributionType: request.contributionType,
        idempotencyKey: request.idempotencyKey,
      },
      status: data.status as "pending",
    });

    return {
      success: true,
      transactionId: data.transactionId,
      status: data.status as "pending" | "processing" | "completed" | "failed",
      clientSecret: data.clientSecret,
    };
  },

  async verifyWebhook(event: TerminalWebhookEvent): Promise<boolean> {
    const config = getConfig();
    const crypto = await import("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(JSON.stringify(event))
      .digest("hex");
    return event.signature === expectedSignature;
  },

  async processWebhook(event: TerminalWebhookEvent): Promise<TerminalWebhookResult> {
    return terminalMockAdapter.processWebhook(event);
  },

  async getStatus(transactionId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/payments/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "X-Merchant-Id": config.merchantId,
      },
    });

    if (!response.ok) {
      return { status: "unavailable" };
    }

    return response.json() as Promise<{ status: string; details?: Record<string, unknown> }>;
  },
};

// =============================================================================
// Active Adapter
// =============================================================================

export const terminalAdapter = {
  isConfigured: (): boolean => terminalProductionAdapter.isConfigured(),

  async processPayment(request: TerminalPaymentRequest): Promise<TerminalPaymentResponse> {
    if (!terminalProductionAdapter.isConfigured()) {
      return terminalMockAdapter.processPayment(request);
    }
    return terminalProductionAdapter.processPayment(request);
  },

  async verifyWebhook(event: TerminalWebhookEvent): Promise<boolean> {
    if (!terminalProductionAdapter.isConfigured()) {
      return terminalMockAdapter.verifyWebhook(event);
    }
    return terminalProductionAdapter.verifyWebhook(event);
  },

  async processWebhook(event: TerminalWebhookEvent): Promise<TerminalWebhookResult> {
    if (!terminalProductionAdapter.isConfigured()) {
      return terminalMockAdapter.processWebhook(event);
    }
    return terminalProductionAdapter.processWebhook(event);
  },

  async getStatus(transactionId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    if (!terminalProductionAdapter.isConfigured()) {
      return terminalMockAdapter.getStatus(transactionId);
    }
    return terminalProductionAdapter.getStatus(transactionId);
  },
};

export default terminalAdapter;
