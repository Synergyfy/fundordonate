// =============================================================================
// FundOrDonate — Admin Reward Routes
// Full CRUD for trigger-based reward tiers + items.
// =============================================================================

import { Router } from "express";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import * as rewardService from "../services/reward.service";
import { batchEvaluateCampaign } from "../services/reward-engine";
import { prisma } from "../lib/prisma";

const adminRewardsRouter = Router();

// All routes require admin role
adminRewardsRouter.use(authenticate, authorize("admin"));

// =============================================================================
// Rewards — CRUD
// =============================================================================

/**
 * POST /api/v1/admin/campaigns/:campaignId/rewards
 * Create a new reward tier for a campaign.
 */
adminRewardsRouter.post("/admin/campaigns/:campaignId/rewards", async (req: AuthRequest, res, next) => {
  try {
    const { campaignId } = req.params;

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return res.status(404).json({ status: "error", message: "Campaign not found" });
    }

    const reward = await rewardService.createReward({
      campaignId,
      title: req.body.title,
      description: req.body.description,
      order: req.body.order,
      triggerType: req.body.triggerType || "contribution",
      triggerConfig: req.body.triggerConfig,
      audience: req.body.audience,
      quantityType: req.body.quantityType,
      quantityLimit: req.body.quantityLimit,
      availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : null,
      availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : null,
      claimDeadlineDays: req.body.claimDeadlineDays,
      fulfilmentType: req.body.fulfilmentType,
      fulfilmentConfig: req.body.fulfilmentConfig,
      image: req.body.image,
      rewardType: req.body.rewardType,
      currency: req.body.currency,
      items: req.body.items,
    });

    res.status(201).json({ status: "success", data: reward });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/campaigns/:campaignId/rewards
 * List all rewards for a campaign.
 */
adminRewardsRouter.get("/admin/campaigns/:campaignId/rewards", async (req: AuthRequest, res, next) => {
  try {
    const { campaignId } = req.params;
    const rewards = await rewardService.getRewardsByCampaign(campaignId);
    res.json({ status: "success", data: rewards });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/rewards/:id
 * Get a single reward with items and campaign info.
 */
adminRewardsRouter.get("/admin/rewards/:id", async (req: AuthRequest, res, next) => {
  try {
    const reward = await rewardService.getRewardById(req.params.id);
    res.json({ status: "success", data: reward });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/rewards/:id
 * Update a reward tier.
 */
adminRewardsRouter.put("/admin/rewards/:id", async (req: AuthRequest, res, next) => {
  try {
    const reward = await rewardService.updateReward(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      order: req.body.order,
      triggerType: req.body.triggerType,
      triggerConfig: req.body.triggerConfig,
      audience: req.body.audience,
      quantityType: req.body.quantityType,
      quantityLimit: req.body.quantityLimit,
      availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : undefined,
      availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : undefined,
      claimDeadlineDays: req.body.claimDeadlineDays,
      fulfilmentType: req.body.fulfilmentType,
      fulfilmentConfig: req.body.fulfilmentConfig,
      image: req.body.image,
      rewardType: req.body.rewardType,
      currency: req.body.currency,
      status: req.body.status,
    });
    res.json({ status: "success", data: reward });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/admin/rewards/:id
 * Delete a reward tier and its items.
 */
adminRewardsRouter.delete("/admin/rewards/:id", async (req: AuthRequest, res, next) => {
  try {
    await rewardService.deleteReward(req.params.id);
    res.json({ status: "success", message: "Reward deleted" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Reward Items — CRUD
// =============================================================================

/**
 * POST /api/v1/admin/rewards/:rewardId/items
 * Add an item to a reward.
 */
adminRewardsRouter.post("/admin/rewards/:rewardId/items", async (req: AuthRequest, res, next) => {
  try {
    const item = await rewardService.createRewardItem(req.params.rewardId, {
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      physicalType: req.body.physicalType,
      assetType: req.body.assetType,
      assetUrl: req.body.assetUrl,
      assetFileName: req.body.assetFileName,
      quantity: req.body.quantity,
      order: req.body.order,
    });

    res.status(201).json({ status: "success", data: item });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/rewards/items/:itemId
 * Update a reward item.
 */
adminRewardsRouter.put("/admin/rewards/items/:itemId", async (req: AuthRequest, res, next) => {
  try {
    const item = await rewardService.updateRewardItem(req.params.itemId, {
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      physicalType: req.body.physicalType,
      assetType: req.body.assetType,
      assetUrl: req.body.assetUrl,
      assetFileName: req.body.assetFileName,
      quantity: req.body.quantity,
      order: req.body.order,
    });

    res.json({ status: "success", data: item });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/admin/rewards/items/:itemId
 * Delete a reward item.
 */
adminRewardsRouter.delete("/admin/rewards/items/:itemId", async (req: AuthRequest, res, next) => {
  try {
    await rewardService.deleteRewardItem(req.params.itemId);
    res.json({ status: "success", message: "Item deleted" });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/rewards/:rewardId/items/reorder
 * Reorder items within a reward.
 */
adminRewardsRouter.put("/admin/rewards/:rewardId/items/reorder", async (req: AuthRequest, res, next) => {
  try {
    await rewardService.reorderRewardItems(req.params.rewardId, req.body.itemIds);
    res.json({ status: "success", message: "Items reordered" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Campaign Qualification Mode
// =============================================================================

/**
 * PUT /api/v1/admin/campaigns/:campaignId/qualification-mode
 * Set campaign-level qualification mode (highest | cumulative).
 */
adminRewardsRouter.put("/admin/campaigns/:campaignId/qualification-mode", async (req: AuthRequest, res, next) => {
  try {
    const { campaignId } = req.params;
    const { mode } = req.body;

    if (!["highest", "cumulative"].includes(mode)) {
      return res.status(400).json({ status: "error", message: "Mode must be 'highest' or 'cumulative'" });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { qualificationMode: mode },
    });

    res.json({ status: "success", message: `Qualification mode set to ${mode}` });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Entitlements — Admin View
// =============================================================================

/**
 * GET /api/v1/admin/campaigns/:campaignId/entitlements
 * List all entitlements for a campaign.
 */
adminRewardsRouter.get("/admin/campaigns/:campaignId/entitlements", async (req: AuthRequest, res, next) => {
  try {
    const entitlements = await rewardService.getCampaignEntitlements(req.params.campaignId);
    res.json({ status: "success", data: entitlements });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/entitlements/:id/fulfill
 * Mark an entitlement as fulfilled (admin action).
 */
adminRewardsRouter.put("/admin/entitlements/:id/fulfill", async (req: AuthRequest, res, next) => {
  try {
    const entitlement = await rewardService.fulfillEntitlement(req.params.id, req.body.reference);
    res.json({ status: "success", data: entitlement });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/campaigns/:campaignId/rewards/evaluate
 * Batch evaluate and grant rewards for all eligible pledges (admin reprocessing).
 */
adminRewardsRouter.post("/admin/campaigns/:campaignId/rewards/evaluate", async (req: AuthRequest, res, next) => {
  try {
    const result = await batchEvaluateCampaign(req.params.campaignId);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

export { adminRewardsRouter };
