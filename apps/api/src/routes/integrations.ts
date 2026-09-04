// =============================================================================
// Integration Routes
// Central Hub auth, VCard e-cards, Terminal payments, Share/QR endpoints
// =============================================================================

import { Router, Response } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { centralHubAdapter, vcardAdapter, terminalAdapter, shareService, getExternalReference } from "../integrations";
import { resolveCentralHubIdentity } from "../services/auth.service";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

// =============================================================================
// Central Hub Routes
// =============================================================================

// GET /integrations/central-hub/status — Check if Central Hub is enabled
router.get("/central-hub/status", (_req: AuthRequest, res: Response) => {
  const enabled = centralHubAdapter.isConfigured();
  res.json({ enabled });
});

// POST /integrations/central-hub/sso — Central Hub SSO for first-time and returning users
// This is a PUBLIC endpoint — no pre-authentication required.
// Handles both new users (creates FundOrDonate identity) and returning users (returns session).
router.post("/central-hub/sso", authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    // Exchange code for Central Hub user info
    const authResult = await centralHubAdapter.authenticate(code);
    if (!authResult.success || !authResult.user) {
      res.status(400).json({ error: authResult.error || "Central Hub authentication failed" });
      return;
    }

    // Resolve or create FundOrDonate identity
    const identity = await resolveCentralHubIdentity(authResult.user);

    res.json({
      success: true,
      user: identity.user,
      tokens: identity.tokens,
      isNewUser: identity.isNewUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Central Hub SSO failed" });
  }
});

// GET /integrations/central-hub/authorize - Get authorization URL
router.get("/central-hub/authorize", (req: AuthRequest, res: Response) => {
  try {
    const { state } = req.query;
    if (!state || typeof state !== "string") {
      res.status(400).json({ error: "State parameter is required" });
      return;
    }

    const url = centralHubAdapter.getAuthorizationUrl(state);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate authorization URL" });
  }
});

// POST /integrations/central-hub/callback - Exchange code for tokens and link user
router.post("/central-hub/callback", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    const result = await centralHubAdapter.authenticate(code);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Link the user
    const linkResult = await centralHubAdapter.linkUser(req.userId!, result.user!);
    if (!linkResult.success) {
      res.status(500).json({ error: linkResult.error });
      return;
    }

    res.json({ success: true, user: result.user });
  } catch (error) {
    res.status(500).json({ error: "Central Hub callback failed" });
  }
});

// DELETE /integrations/central-hub/unlink - Unlink user from Central Hub
router.delete("/central-hub/unlink", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await centralHubAdapter.unlinkUser(req.userId!);
    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unlink user" });
  }
});

// =============================================================================
// VCard Routes
// =============================================================================

// POST /integrations/vcard/ecard - Create an E-card
router.post("/vcard/ecard", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, rewardId, statedValue, benefitValue, currency } = req.body;

    if (!campaignId || !rewardId) {
      res.status(400).json({ error: "campaignId and rewardId are required" });
      return;
    }

    const result = await vcardAdapter.createEcard({
      campaignId,
      rewardId,
      donorUserId: req.userId!,
      statedValue: statedValue || 0,
      benefitValue: benefitValue || 0,
      currency: currency || "GBP",
      idempotencyKey: `${req.userId}_${rewardId}_${Date.now()}`,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, ecardId: result.ecardId, status: result.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to create E-card" });
  }
});

// GET /integrations/vcard/ecard/:ecardId/status - Get E-card status
router.get("/vcard/ecard/:ecardId/status", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ecardId = req.params.ecardId as string;
    const status = await vcardAdapter.getStatus(ecardId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to get E-card status" });
  }
});

// POST /integrations/vcard/ecard/:ecardId/revoke - Revoke an E-card
router.post("/vcard/ecard/:ecardId/revoke", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ecardId = req.params.ecardId as string;
    const result = await vcardAdapter.revokeEcard(ecardId);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to revoke E-card" });
  }
});

// GET /integrations/vcard/ecard/:ecardId/url - Get E-card URL
router.get("/vcard/ecard/:ecardId/url", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ecardId = req.params.ecardId as string;
    const message = req.query.message as string | undefined;
    const url = await vcardAdapter.getEcardUrl(ecardId, message);
    if (!url) {
      res.status(404).json({ error: "E-card not found" });
      return;
    }
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: "Failed to get E-card URL" });
  }
});

// =============================================================================
// Terminal Routes
// =============================================================================

// POST /integrations/terminal/payment - Process a payment
router.post("/terminal/payment", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, amount, currency, contributionType, description, reference } = req.body;

    if (!campaignId || !amount) {
      res.status(400).json({ error: "campaignId and amount are required" });
      return;
    }

    const result = await terminalAdapter.processPayment({
      amount,
      currency: currency || "GBP",
      campaignId,
      contributionType: contributionType || "external",
      description,
      reference,
      idempotencyKey: `term_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      transactionId: result.transactionId,
      status: result.status,
      clientSecret: result.clientSecret,
    });
  } catch (error) {
    res.status(500).json({ error: "Payment processing failed" });
  }
});

// GET /integrations/terminal/transaction/:transactionId/status - Get transaction status
router.get("/terminal/transaction/:transactionId/status", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const transactionId = req.params.transactionId as string;
    const status = await terminalAdapter.getStatus(transactionId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to get transaction status" });
  }
});

// POST /integrations/terminal/webhook - Terminal webhook receiver
router.post("/terminal/webhook", async (req: AuthRequest, res: Response) => {
  try {
    const event = req.body;

    // Verify the webhook
    const isValid = await terminalAdapter.verifyWebhook(event);
    if (!isValid) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    // Process the webhook
    const result = await terminalAdapter.processWebhook(event);
    if (!result.processed) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, donationId: result.donationId });
  } catch (error) {
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// =============================================================================
// Share / QR Routes
// =============================================================================

// GET /integrations/share/:campaignId/code - Get share code for campaign
router.get("/share/:campaignId/code", async (req: AuthRequest, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const code = await shareService.getOrCreateShareCode(campaignId);
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: "Failed to get share code" });
  }
});

// GET /integrations/share/:campaignId/qr - Generate QR code data
router.get("/share/:campaignId/qr", async (req: AuthRequest, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const baseUrl = (req.query.baseUrl as string) || `${req.protocol}://${req.get("host")}`;
    const qrData = await shareService.generateQRCode(campaignId, baseUrl);
    res.json(qrData);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// GET /integrations/share/:campaignId/url - Generate share URL
router.get("/share/:campaignId/url", async (req: AuthRequest, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const baseUrl = (req.query.baseUrl as string) || `${req.protocol}://${req.get("host")}`;
    const shareUrl = await shareService.generateShareUrl(campaignId, baseUrl);
    res.json(shareUrl);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate share URL" });
  }
});

// POST /integrations/share/:campaignId/record - Record a share event
router.post("/share/:campaignId/record", async (req: AuthRequest, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const { shareType, source, metadata } = req.body;

    if (!shareType) {
      res.status(400).json({ error: "shareType is required" });
      return;
    }

    const result = await shareService.recordShare({
      campaignId,
      shareType,
      source,
      metadata,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to record share" });
  }
});

// GET /integrations/share/:campaignId/stats - Get share statistics
router.get("/share/:campaignId/stats", async (req: AuthRequest, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const stats = await shareService.getShareStats(campaignId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get share stats" });
  }
});

// GET /integrations/share/validate/:code - Validate a share code
router.get("/share/validate/:code", async (req: AuthRequest, res: Response) => {
  try {
    const code = req.params.code as string;
    const result = await shareService.validateShareCode(code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to validate share code" });
  }
});

// =============================================================================
// External Reference Routes
// =============================================================================

// GET /integrations/references/:entityType/:entityId - Get all external references
router.get("/references/:entityType/:entityId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const { getAllExternalReferences } = await import("../integrations");
    const references = await getAllExternalReferences(
      entityType as "user" | "campaign" | "donation" | "reward" | "ecard" | "pledge",
      entityId
    );
    res.json(references);
  } catch (error) {
    res.status(500).json({ error: "Failed to get references" });
  }
});

// GET /integrations/references/:provider/:entityType/:entityId - Get specific reference
router.get("/references/:provider/:entityType/:entityId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const provider = req.params.provider as string;
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const reference = await getExternalReference(
      provider as "central_hub" | "vcard" | "terminal" | "mcom_rewards" | "mcom_mall",
      entityType as "user" | "campaign" | "donation" | "reward" | "ecard" | "pledge",
      entityId
    );
    if (!reference) {
      res.status(404).json({ error: "Reference not found" });
      return;
    }
    res.json(reference);
  } catch (error) {
    res.status(500).json({ error: "Failed to get reference" });
  }
});

export default router;
