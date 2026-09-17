import { Router } from "express";
import { z } from "zod";
import * as gatewayService from "../services/gateway.service";
import { evaluateRewardTriggers } from "../services/reward-engine";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { logger } from "../lib/logger";
import { gatewayRegistry } from "../lib/gateways";
import type { PayPalGateway } from "../lib/gateways/paypal.gateway";
import type { StripeGateway } from "../lib/gateways/stripe.gateway";
import type { NativeGateway } from "../lib/gateways/native.gateway";

const chargeSchema = z.object({
  gatewayId: z.enum(["stripe", "paypal", "native"]),
  amount: z.number().positive(),
  currency: z.string().length(3).default("usd"),
  paymentMethod: z.string().min(1),
  campaignId: z.string().uuid(),
  type: z.enum(["donation", "pledge"]),
  rewardId: z.string().uuid().optional(),
  donorEmail: z.string().email().optional(),
  donorName: z.string().optional(),
  notes: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  tributeType: z.string().optional(),
  tributeTo: z.string().optional(),
  savePaymentMethod: z.boolean().optional(),
});

const refundSchema = z.object({
  gatewayId: z.enum(["stripe", "paypal", "native"]),
  transactionId: z.string().min(1),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

const gatewayRouter = Router();

// =============================================================================
// Public - Get available gateways
// =============================================================================

gatewayRouter.get("/gateways", async (_req, res, next) => {
  try {
    const gateways = await gatewayService.getAvailableGateways();
    res.json({ status: "success", data: gateways });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.get("/gateways/:gatewayId", async (req, res, next) => {
  try {
    const config = await gatewayService.getGatewayConfig(
      req.params.gatewayId as "stripe" | "paypal" | "native"
    );
    if (!config) {
      res.status(404).json({ status: "error", message: "Gateway not found or not configured" });
      return;
    }
    res.json({ status: "success", data: config });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Authenticated - Process charge
// =============================================================================

gatewayRouter.post(
  "/charge",
  authenticate,
  validateBody(chargeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { gatewayId, ...chargeData } = req.body;

      const response = await gatewayService.processCharge(gatewayId, {
        amount: chargeData.amount,
        currency: chargeData.currency,
        paymentMethod: chargeData.paymentMethod,
        savePaymentMethod: chargeData.savePaymentMethod,
        metadata: {
          campaignId: chargeData.campaignId,
          campaignTitle: "",
          type: chargeData.type,
          rewardId: chargeData.rewardId,
          donorEmail: chargeData.donorEmail,
          donorName: chargeData.donorName,
          notes: chargeData.notes,
          isAnonymous: chargeData.isAnonymous,
          tributeType: chargeData.tributeType,
          tributeTo: chargeData.tributeTo,
          userId: req.userId,
        },
      });

      if (!response.success) {
        res.status(400).json({ status: "error", message: response.error });
        return;
      }

      // ── Reward Engine: evaluate triggers after successful pledge ──
      let rewardEntitlements: Awaited<ReturnType<typeof evaluateRewardTriggers>> | null = null;

      if (chargeData.type === "pledge" && req.userId && chargeData.campaignId) {
        try {
          rewardEntitlements = await evaluateRewardTriggers(
            req.userId,
            chargeData.campaignId,
            chargeData.amount,
            response.transactionId
          );
        } catch (err) {
          // Don't fail the payment if reward evaluation fails
          logger.error("Reward engine error (non-fatal)", { error: String(err) });
        }
      }

      res.json({
        status: "success",
        data: {
          ...response,
          rewardEntitlements: rewardEntitlements?.entitlements || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Authenticated - Process refund
// =============================================================================

gatewayRouter.post(
  "/refund",
  authenticate,
  authorize("admin"),
  validateBody(refundSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { gatewayId, ...refundData } = req.body;

      const response = await gatewayService.processRefund(gatewayId, {
        transactionId: refundData.transactionId,
        amount: refundData.amount,
        reason: refundData.reason,
      });

      if (!response.success) {
        res.status(400).json({ status: "error", message: response.error });
        return;
      }

      res.json({ status: "success", data: response });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Webhooks (no auth - verified by gateway signature)
// =============================================================================

gatewayRouter.post("/webhooks/:gatewayId", async (req, res, next) => {
  try {
    const gatewayId = req.params.gatewayId as "stripe" | "paypal";

    const response = await gatewayService.processWebhook(gatewayId, {
      gatewayId,
      eventType: req.body.eventType || "unknown",
      rawBody: JSON.stringify(req.body),
      headers: req.headers as Record<string, string>,
      data: req.body.data || req.body,
    });

    logger.info(`Webhook processed for ${gatewayId}`, { response });

    res.json({ status: "success", data: response });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// User - Payment history
// =============================================================================

gatewayRouter.get("/payments/history", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await gatewayService.getUserPaymentHistory(req.userId!, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.get("/payments/:transactionId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const payment = await gatewayService.getPaymentByTransactionId(
      req.params.transactionId as string
    );
    if (!payment) {
      res.status(404).json({ status: "error", message: "Payment not found" });
      return;
    }
    res.json({ status: "success", data: payment });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Admin - All payments
// =============================================================================

gatewayRouter.get("/admin/payments", authenticate, authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const filters = {
      status: req.query.status as string | undefined,
      paymentEngine: req.query.gatewayId as string | undefined,
    };

    const result = await gatewayService.getAllPayments(page, limit, filters);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Stripe - PaymentIntent Management
// =============================================================================

function getStripeGateway(): StripeGateway | undefined {
  return gatewayRegistry.get("stripe") as StripeGateway | undefined;
}

gatewayRouter.post(
  "/stripe/payment-intents",
  authenticate,
  validateBody(
    z.object({
      amount: z.number().positive(),
      currency: z.string().length(3).default("usd"),
      campaignId: z.string().uuid(),
      type: z.enum(["donation", "pledge"]),
      campaignTitle: z.string().optional(),
      rewardId: z.string().uuid().optional(),
      donorEmail: z.string().email().optional(),
      donorName: z.string().optional(),
      notes: z.string().optional(),
      isAnonymous: z.boolean().optional(),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const stripe = getStripeGateway();
      if (!stripe) {
        res.status(503).json({ status: "error", message: "Stripe not configured" });
        return;
      }

      const response = await stripe.createPaymentIntent({
        amount: req.body.amount,
        currency: req.body.currency,
        paymentMethod: "card",
        metadata: {
          campaignId: req.body.campaignId,
          campaignTitle: req.body.campaignTitle || "",
          type: req.body.type,
          rewardId: req.body.rewardId,
          donorEmail: req.body.donorEmail,
          donorName: req.body.donorName,
          notes: req.body.notes,
          isAnonymous: req.body.isAnonymous,
          userId: req.userId,
        },
      });

      res.json({ status: "success", data: response });
    } catch (error) {
      next(error);
    }
  }
);

gatewayRouter.post(
  "/stripe/payment-intents/:piId/confirm",
  authenticate,
  validateBody(z.object({ paymentMethodId: z.string().min(1) })),
  async (req: AuthRequest, res, next) => {
    try {
      const stripe = getStripeGateway();
      if (!stripe) {
        res.status(503).json({ status: "error", message: "Stripe not configured" });
        return;
      }

      const result = await stripe.confirmPaymentIntent(
        req.params.piId as string,
        req.body.paymentMethodId
      );

      if (!result.success) {
        res.status(400).json({ status: "error", message: result.error });
        return;
      }

      // ── Reward Engine: fetch PI details and evaluate triggers ──
      let rewardEntitlements: Awaited<ReturnType<typeof evaluateRewardTriggers>> | null = null;

      if (req.userId) {
        try {
          const piDetails = await stripe.getPaymentIntent(req.params.piId as string);
          const piMetadata = (piDetails as any)?.metadata;
          const piAmount = Number((piDetails as any)?.amount) || 0;

          if (piMetadata?.campaignId && piMetadata?.type === "pledge" && piAmount > 0) {
            rewardEntitlements = await evaluateRewardTriggers(
              req.userId,
              piMetadata.campaignId,
              piAmount,
              req.params.piId as string
            );
          }
        } catch (err) {
          logger.error("Reward engine error (non-fatal)", { error: String(err) });
        }
      }

      res.json({
        status: "success",
        data: {
          status: result.status,
          rewardEntitlements: rewardEntitlements?.entitlements || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

gatewayRouter.get("/stripe/payment-intents/:piId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const stripe = getStripeGateway();
    if (!stripe) {
      res.status(503).json({ status: "error", message: "Stripe not configured" });
      return;
    }

    const intent = await stripe.getPaymentIntent(req.params.piId as string);
    if (!intent) {
      res.status(404).json({ status: "error", message: "PaymentIntent not found" });
      return;
    }
    res.json({ status: "success", data: intent });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.post("/stripe/payment-intents/:piId/cancel", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const stripe = getStripeGateway();
    if (!stripe) {
      res.status(503).json({ status: "error", message: "Stripe not configured" });
      return;
    }

    const cancelled = await stripe.cancelPaymentIntent(req.params.piId as string);
    if (!cancelled) {
      res.status(500).json({ status: "error", message: "Failed to cancel payment intent" });
      return;
    }
    res.json({ status: "success", message: "Payment intent cancelled" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Stripe - Refunds
// =============================================================================

gatewayRouter.get("/stripe/refunds/:refundId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const stripe = getStripeGateway();
    if (!stripe) {
      res.status(503).json({ status: "error", message: "Stripe not configured" });
      return;
    }

    const refund = await stripe.getRefund(req.params.refundId as string);
    if (!refund) {
      res.status(404).json({ status: "error", message: "Refund not found" });
      return;
    }
    res.json({ status: "success", data: refund });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// PayPal - Order Management
// =============================================================================

function getPayPalGateway(): PayPalGateway | undefined {
  return gatewayRegistry.get("paypal") as PayPalGateway | undefined;
}

gatewayRouter.post(
  "/paypal/orders",
  authenticate,
  validateBody(
    z.object({
      amount: z.number().positive(),
      currency: z.string().length(3).default("usd"),
      campaignId: z.string().uuid(),
      type: z.enum(["donation", "pledge"]),
      campaignTitle: z.string().optional(),
      rewardId: z.string().uuid().optional(),
      donorEmail: z.string().email().optional(),
      donorName: z.string().optional(),
      notes: z.string().optional(),
      isAnonymous: z.boolean().optional(),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const paypal = getPayPalGateway();
      if (!paypal) {
        res.status(503).json({ status: "error", message: "PayPal not configured" });
        return;
      }

      const response = await paypal.createOrder({
        amount: req.body.amount,
        currency: req.body.currency,
        paymentMethod: "paypal",
        metadata: {
          campaignId: req.body.campaignId,
          campaignTitle: req.body.campaignTitle || "",
          type: req.body.type,
          rewardId: req.body.rewardId,
          donorEmail: req.body.donorEmail,
          donorName: req.body.donorName,
          notes: req.body.notes,
          isAnonymous: req.body.isAnonymous,
          userId: req.userId,
        },
      });

      res.json({ status: "success", data: response });
    } catch (error) {
      next(error);
    }
  }
);

gatewayRouter.post("/paypal/orders/:orderId/capture", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const result = await paypal.captureOrder(req.params.orderId as string);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.get("/paypal/orders/:orderId", async (req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const order = await paypal.getOrder(req.params.orderId as string);
    if (!order) {
      res.status(404).json({ status: "error", message: "Order not found" });
      return;
    }
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// PayPal - Vault (Saved Payment Methods)
// =============================================================================

gatewayRouter.post("/paypal/vault/setup-token", authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const result = await paypal.createVaultSetupToken();
    if (result.error) {
      res.status(500).json({ status: "error", message: result.error });
      return;
    }
    res.json({ status: "success", data: { setupToken: result.setupToken } });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.post("/paypal/vault/approve", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const { setupTokenId } = req.body as { setupTokenId: string };
    const result = await paypal.approveVaultSetupToken(setupTokenId);
    if (result.error) {
      res.status(400).json({ status: "error", message: result.error });
      return;
    }
    res.json({ status: "success", data: { paymentTokenId: result.paymentTokenId } });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.get("/paypal/vault/tokens", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const customerId = req.userId!;
    const tokens = await paypal.listPaymentTokens(customerId);
    res.json({ status: "success", data: tokens });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.delete("/paypal/vault/tokens/:tokenId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const deleted = await paypal.deletePaymentToken(req.params.tokenId as string);
    if (!deleted) {
      res.status(500).json({ status: "error", message: "Failed to delete payment token" });
      return;
    }
    res.json({ status: "success", message: "Payment token deleted" });
  } catch (error) {
    next(error);
  }
});

gatewayRouter.post(
  "/paypal/charge-saved",
  authenticate,
  validateBody(
    z.object({
      paymentTokenId: z.string().min(1),
      amount: z.number().positive(),
      currency: z.string().length(3).default("usd"),
      campaignId: z.string().uuid(),
      type: z.enum(["donation", "pledge"]),
      campaignTitle: z.string().optional(),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const paypal = getPayPalGateway();
      if (!paypal) {
        res.status(503).json({ status: "error", message: "PayPal not configured" });
        return;
      }

      const response = await paypal.chargeWithToken(
        req.body.paymentTokenId,
        req.body.amount,
        req.body.currency,
        {
          campaignId: req.body.campaignId,
          campaignTitle: req.body.campaignTitle || "",
          type: req.body.type,
        }
      );

      if (!response.success) {
        res.status(400).json({ status: "error", message: response.error });
        return;
      }

      // ── Reward Engine: evaluate triggers after successful pledge ──
      let rewardEntitlements: Awaited<ReturnType<typeof evaluateRewardTriggers>> | null = null;

      if (req.body.type === "pledge" && req.userId && req.body.campaignId) {
        try {
          rewardEntitlements = await evaluateRewardTriggers(
            req.userId,
            req.body.campaignId,
            req.body.amount,
            response.transactionId
          );
        } catch (err) {
          logger.error("Reward engine error (non-fatal)", { error: String(err) });
        }
      }

      res.json({
        status: "success",
        data: {
          ...response,
          rewardEntitlements: rewardEntitlements?.entitlements || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// PayPal - Client Token (for SDK)
// =============================================================================

gatewayRouter.get("/paypal/client-token", async (_req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const clientToken = await paypal.getClientToken();
    res.json({ status: "success", data: { clientToken } });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// PayPal - Refund Details
// =============================================================================

gatewayRouter.get("/paypal/refunds/:refundId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const paypal = getPayPalGateway();
    if (!paypal) {
      res.status(503).json({ status: "error", message: "PayPal not configured" });
      return;
    }

    const refund = await paypal.getRefund(req.params.refundId as string);
    if (!refund) {
      res.status(404).json({ status: "error", message: "Refund not found" });
      return;
    }
    res.json({ status: "success", data: refund });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Offline / Native Payment
// =============================================================================

function getNativeGateway(): NativeGateway | undefined {
  return gatewayRegistry.get("native") as NativeGateway | undefined;
}

// Public: Get bank account instructions
gatewayRouter.get("/offline/instructions", async (_req, res, next) => {
  try {
    const native = getNativeGateway();
    if (!native) {
      res.status(503).json({ status: "error", message: "Offline payments not available" });
      return;
    }

    res.json({
      status: "success",
      data: {
        instructions: native.getInstructions(),
        bankAccounts: native.getBankAccounts(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all bank accounts
gatewayRouter.get("/offline/bank-accounts", authenticate, authorize("admin"), async (_req: AuthRequest, res, next) => {
  try {
    const native = getNativeGateway();
    if (!native) {
      res.status(503).json({ status: "error", message: "Offline payments not available" });
      return;
    }

    res.json({ status: "success", data: native.getAllBankAccounts() });
  } catch (error) {
    next(error);
  }
});

// Admin: Record manual payment
gatewayRouter.post(
  "/offline/record",
  authenticate,
  authorize("admin"),
  validateBody(
    z.object({
      campaignId: z.string().uuid(),
      amount: z.number().positive(),
      currency: z.string().length(3).default("usd"),
      paymentMethod: z.enum(["bank_transfer", "check", "cash", "manual"]),
      donorName: z.string().optional(),
      donorEmail: z.string().email().optional(),
      notes: z.string().optional(),
      referenceNumber: z.string().optional(),
      receivedDate: z.string().datetime().optional(),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const native = getNativeGateway();
      if (!native) {
        res.status(503).json({ status: "error", message: "Offline payments not available" });
        return;
      }

      const result = await native.recordManualPayment({
        ...req.body,
        adminId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ status: "error", message: result.error });
        return;
      }

      res.status(201).json({ status: "success", data: { transactionId: result.transactionId } });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: Get pending offline payments
gatewayRouter.get("/offline/pending", authenticate, authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    const native = getNativeGateway();
    if (!native) {
      res.status(503).json({ status: "error", message: "Offline payments not available" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await native.getPendingPayments(page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// Admin: Get offline payment stats
gatewayRouter.get("/offline/stats", authenticate, authorize("admin"), async (_req: AuthRequest, res, next) => {
  try {
    const native = getNativeGateway();
    if (!native) {
      res.status(503).json({ status: "error", message: "Offline payments not available" });
      return;
    }

    const stats = await native.getStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
});

// Admin: Verify/reject offline payment
gatewayRouter.post(
  "/offline/verify",
  authenticate,
  authorize("admin"),
  validateBody(
    z.object({
      transactionId: z.string().min(1),
      approved: z.boolean(),
      notes: z.string().optional(),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const native = getNativeGateway();
      if (!native) {
        res.status(503).json({ status: "error", message: "Offline payments not available" });
        return;
      }

      const result = await native.verifyOfflinePayment(
        req.body.transactionId,
        req.userId!,
        req.body.approved,
        req.body.notes
      );

      if (!result.success) {
        res.status(400).json({ status: "error", message: result.error });
        return;
      }

      res.json({ status: "success", message: req.body.approved ? "Payment verified" : "Payment rejected" });
    } catch (error) {
      next(error);
    }
  }
);

export { gatewayRouter };
