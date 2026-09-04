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
import { prisma } from "../prisma";

// =============================================================================
// Native (Offline) Payment Gateway
// Bank transfer, check, cash, manual recording
// =============================================================================

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swift?: string;
  iban?: string;
  instructions?: string;
  isDefault: boolean;
}

interface OfflinePaymentConfig {
  enabled: boolean;
  bankAccounts: BankAccount[];
  instructions: string;
  requireAdminApproval: boolean;
  maxPendingDays: number;
}

const DEFAULT_CONFIG: OfflinePaymentConfig = {
  enabled: true,
  bankAccounts: [],
  instructions:
    "Please transfer the amount to the bank account below. " +
    "Include your name and campaign title in the payment reference. " +
    "Your payment will be verified within 1-3 business days.",
  requireAdminApproval: true,
  maxPendingDays: 7,
};

export class NativeGateway extends BasePaymentGateway {
  readonly id: GatewayId = "native";
  readonly name = "Native (Offline)";

  private getConfigData(): OfflinePaymentConfig {
    const raw = process.env.OFFLINE_PAYMENT_CONFIG;
    if (raw) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }

  async isConfigured(): Promise<boolean> {
    return true; // Native gateway is always available
  }

  async getConfig(): Promise<GatewayConfig> {
    return {
      id: this.id,
      name: this.name,
      enabled: this.getConfigData().enabled,
      testMode: false,
      credentials: {},
      supportedPaymentMethods: ["bank_transfer", "check", "cash", "manual"],
      supportedCurrencies: ["usd", "eur", "gbp", "cad", "aud"],
      supportsRefunds: true,
      supportsWebhooks: false,
    };
  }

  getPaymentMethods(): string[] {
    return ["bank_transfer", "check", "cash", "manual"];
  }

  // -------------------------------------------------------------------------
  // Bank Transfer Instructions
  // -------------------------------------------------------------------------

  /**
   * Get bank accounts for display to donor
   */
  getBankAccounts(): BankAccount[] {
    return this.getConfigData().bankAccounts.filter((a) => a.isDefault || this.getConfigData().bankAccounts.length === 1);
  }

  /**
   * Get all bank accounts (admin only)
   */
  getAllBankAccounts(): BankAccount[] {
    return this.getConfigData().bankAccounts;
  }

  /**
   * Get payment instructions
   */
  getInstructions(): string {
    return this.getConfigData().instructions;
  }

  // -------------------------------------------------------------------------
  // Charge (Create Pending Payment)
  // -------------------------------------------------------------------------

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    this.validateAmount(request.amount, request.currency);

    this.log("charge - recording offline payment", {
      amount: request.amount,
      currency: request.currency,
      method: request.paymentMethod,
    });

    try {
      const transactionId = this.generateTransactionId();

      // Create a pending offline payment record in the database
      await prisma.donation.create({
        data: {
          uid: transactionId,
          amount: request.amount,
          campaignId: request.metadata.campaignId,
          userId: request.metadata.userId || null,
          transactionId,
          paymentEngine: "native",
          paymentMethod: request.paymentMethod,
          status: "pending",
          isAnonymous: request.metadata.isAnonymous || false,
          notes: [
            request.metadata.notes,
            `[Offline Payment] Method: ${request.paymentMethod}`,
          ]
            .filter(Boolean)
            .join(" | "),
        },
      });

      this.log("charge success - awaiting verification", { transactionId });

      return this.pendingResponse(
        transactionId,
        request.amount,
        request.currency,
        undefined,
        undefined
      );
    } catch (error) {
      this.logError("charge", error);
      return this.errorResponse(String(error));
    }
  }

  // -------------------------------------------------------------------------
  // Manual Payment Recording (Admin)
  // -------------------------------------------------------------------------

  /**
   * Admin records a manual payment (cash, check, bank transfer received)
   */
  async recordManualPayment(data: {
    campaignId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    donorName?: string;
    donorEmail?: string;
    notes?: string;
    referenceNumber?: string;
    receivedDate?: Date;
    adminId: string;
  }): Promise<{ success: boolean; transactionId: string; error?: string }> {
    this.log("recordManualPayment", {
      campaignId: data.campaignId,
      amount: data.amount,
      method: data.paymentMethod,
      adminId: data.adminId,
    });

    try {
      const transactionId = this.generateTransactionId();

      await prisma.donation.create({
        data: {
          uid: transactionId,
          amount: data.amount,
          campaignId: data.campaignId,
          userId: null,
          transactionId,
          paymentEngine: "native",
          paymentMethod: data.paymentMethod,
          status: "completed",
          isManual: true,
          isAnonymous: false,
          notes: [
            data.notes,
            `[Manual Payment] Method: ${data.paymentMethod}`,
            data.referenceNumber ? `Ref: ${data.referenceNumber}` : "",
            `Recorded by: ${data.adminId}`,
          ]
            .filter(Boolean)
            .join(" | "),
        },
      });

      this.log("recordManualPayment success", { transactionId });

      return { success: true, transactionId };
    } catch (error) {
      this.logError("recordManualPayment", error);
      return { success: false, transactionId: "", error: String(error) };
    }
  }

  // -------------------------------------------------------------------------
  // Offline Payment Verification (Admin)
  // -------------------------------------------------------------------------

  /**
   * Admin verifies an offline payment
   */
  async verifyOfflinePayment(
    transactionId: string,
    adminId: string,
    approved: boolean,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    this.log("verifyOfflinePayment", { transactionId, adminId, approved });

    try {
      const donation = await prisma.donation.findUnique({
        where: { uid: transactionId },
      });

      if (!donation) {
        return { success: false, error: "Payment not found" };
      }

      if (donation.status !== "pending") {
        return { success: false, error: `Payment is already ${donation.status}` };
      }

      await prisma.donation.update({
        where: { uid: transactionId },
        data: {
          status: approved ? "completed" : "failed",
          notes: [
            donation.notes,
            approved ? `[Verified by ${adminId}]` : `[Rejected by ${adminId}]`,
            notes,
          ]
            .filter(Boolean)
            .join(" | "),
        },
      });

      // Update campaign raised amount if approved
      if (approved) {
        await prisma.campaign.update({
          where: { id: donation.campaignId },
          data: { raisedAmount: { increment: donation.amount } },
        });
      }

      this.log("verifyOfflinePayment success", { transactionId, approved });

      return { success: true };
    } catch (error) {
      this.logError("verifyOfflinePayment", error);
      return { success: false, error: String(error) };
    }
  }

  // -------------------------------------------------------------------------
  // Offline Payment Status Tracking
  // -------------------------------------------------------------------------

  /**
   * Get pending offline payments (awaiting verification)
   */
  async getPendingPayments(
    page = 1,
    limit = 50
  ): Promise<{
    payments: Array<{
      uid: string;
      amount: number;
      campaignId: string;
      paymentMethod: string | null;
      notes: string | null;
      createdAt: Date;
      campaign: { title: string; slug: string } | null;
      user: { firstName: string | null; lastName: string | null; email: string } | null;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.donation.findMany({
        where: {
          paymentEngine: "native",
          status: "pending",
        },
        include: {
          campaign: { select: { title: true, slug: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.donation.count({
        where: { paymentEngine: "native", status: "pending" },
      }),
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
   * Get offline payment statistics
   */
  async getStats(): Promise<{
    pending: number;
    completed: number;
    failed: number;
    totalPendingAmount: number;
    totalCompletedAmount: number;
  }> {
    const [pending, completed, failed, pendingAmount, completedAmount] = await Promise.all([
      prisma.donation.count({
        where: { paymentEngine: "native", status: "pending" },
      }),
      prisma.donation.count({
        where: { paymentEngine: "native", status: "completed" },
      }),
      prisma.donation.count({
        where: { paymentEngine: "native", status: "failed" },
      }),
      prisma.donation.aggregate({
        where: { paymentEngine: "native", status: "pending" },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: { paymentEngine: "native", status: "completed" },
        _sum: { amount: true },
      }),
    ]);

    return {
      pending,
      completed,
      failed,
      totalPendingAmount: pendingAmount._sum.amount || 0,
      totalCompletedAmount: completedAmount._sum.amount || 0,
    };
  }

  // -------------------------------------------------------------------------
  // Refund (Manual)
  // -------------------------------------------------------------------------

  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.log("refund", { transactionId: request.transactionId });

    try {
      // Record refund request in the database
      const donation = await prisma.donation.findUnique({
        where: { uid: request.transactionId },
      });

      if (!donation) {
        return {
          success: false,
          refundId: "",
          status: "failed",
          amount: 0,
          error: "Original payment not found",
        };
      }

      // Create a new donation record as refund marker
      const refundId = this.generateTransactionId();
      await prisma.donation.create({
        data: {
          uid: refundId,
          amount: -(request.amount || donation.amount),
          campaignId: donation.campaignId,
          userId: donation.userId,
          transactionId: refundId,
          paymentEngine: "native",
          paymentMethod: "refund",
          status: "completed",
          isManual: true,
          notes: `Refund of original payment ${request.transactionId}. Reason: ${request.reason || "Not specified"}`,
        },
      });

      // Update campaign raised amount
      await prisma.campaign.update({
        where: { id: donation.campaignId },
        data: { raisedAmount: { decrement: request.amount || donation.amount } },
      });

      this.log("refund success", { refundId, amount: request.amount || donation.amount });

      return {
        success: true,
        refundId,
        status: "completed",
        amount: request.amount || donation.amount,
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

  async verify(_payload: WebhookPayload): Promise<WebhookResponse> {
    return { processed: false, error: "Native gateway does not support webhooks" };
  }
}
