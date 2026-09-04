import { Router } from "express";
import * as paymentService from "../services/payment.service";
import { authenticate, optionalAuth, type AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { donationCreateSchema, pledgeCreateSchema } from "../validations";

const paymentsRouter = Router({ mergeParams: true });

// =============================================================================
// Donations
// =============================================================================

paymentsRouter.post(
  "/donations",
  optionalAuth,
  validateBody(donationCreateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const campaignId = req.params.id as string;
      const donation = await paymentService.createDonation(
        campaignId,
        req.userId || null,
        req.body
      );
      res.status(201).json({ status: "success", data: donation });
    } catch (error) {
      next(error);
    }
  }
);

paymentsRouter.get("/donations/:uid", async (req, res, next) => {
  try {
    const donation = await paymentService.getDonation(req.params.uid as string);
    res.json({ status: "success", data: donation });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get("/donations/list/all", optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getCampaignDonations(
      req.params.id as string,
      page,
      limit
    );
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Pledges
// =============================================================================

paymentsRouter.post(
  "/pledges",
  authenticate,
  validateBody(pledgeCreateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const campaignId = req.params.id as string;
      const pledge = await paymentService.createPledge(
        campaignId,
        req.userId!,
        req.body
      );
      res.status(201).json({ status: "success", data: pledge });
    } catch (error) {
      next(error);
    }
  }
);

paymentsRouter.get("/pledges/:uid", async (req, res, next) => {
  try {
    const pledge = await paymentService.getPledge(req.params.uid as string);
    res.json({ status: "success", data: pledge });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get("/pledges/list/all", optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getCampaignPledges(
      req.params.id as string,
      page,
      limit
    );
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.delete("/pledges/:pledgeId/cancel", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await paymentService.cancelPledge(req.params.pledgeId as string, req.userId!);
    res.json({ status: "success", message: "Pledge cancelled" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// User History
// =============================================================================

paymentsRouter.get("/user/donations", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getUserDonations(req.userId!, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get("/user/pledges", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getUserPledges(req.userId!, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

export { paymentsRouter };
