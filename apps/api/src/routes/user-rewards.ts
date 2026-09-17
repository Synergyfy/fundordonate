// =============================================================================
// FundOrDonate — User Reward Routes
// Endpoints for users to view and claim their reward entitlements.
// =============================================================================

import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth";
import * as rewardService from "../services/reward.service";

const userRewardsRouter = Router();

// All routes require authentication
userRewardsRouter.use(authenticate);

/**
 * GET /api/v1/user/rewards
 * Get all entitlements for the current user.
 * Optional query: ?campaignId=xxx to filter by campaign.
 */
userRewardsRouter.get("/user/rewards", async (req: AuthRequest, res, next) => {
  try {
    const entitlements = await rewardService.getUserEntitlements(
      req.userId!,
      req.query.campaignId as string | undefined
    );
    res.json({ status: "success", data: entitlements });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/user/rewards/:id
 * Get a single entitlement detail.
 */
userRewardsRouter.get("/user/rewards/:id", async (req: AuthRequest, res, next) => {
  try {
    const entitlement = await rewardService.getEntitlementById(req.params.id);
    if (entitlement.userId !== req.userId) {
      return res.status(403).json({ status: "error", message: "Not your entitlement" });
    }
    res.json({ status: "success", data: entitlement });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/user/rewards/:id/claim
 * Claim an earned reward entitlement.
 */
userRewardsRouter.post("/user/rewards/:id/claim", async (req: AuthRequest, res, next) => {
  try {
    const entitlement = await rewardService.claimEntitlement(req.params.id, req.userId!);
    res.json({ status: "success", data: entitlement });
  } catch (error) {
    next(error);
  }
});

export { userRewardsRouter };
