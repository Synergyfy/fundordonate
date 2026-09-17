import { Router } from "express";
import { z } from "zod";
import * as campaignService from "../services/campaign.service";
import { authenticate, authorize, optionalAuth, type AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { uploadSingle, uploadMultiple } from "../middleware/upload";
import { campaignCreateSchema, campaignUpdateSchema, campaignStatusSchema } from "../validations";
import { requireCampaignCreatorEligible, type AuthorizedRequest } from "../middleware/authorization";

const campaignsRouter = Router();

// =============================================================================
// Public Routes
// =============================================================================

campaignsRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await campaignService.listCampaigns({
      page,
      limit,
      search: req.query.search as string,
      status: req.query.status as any,
      mode: req.query.mode as any,
      authorId: req.query.authorId as string,
      fundraiserId: req.query.fundraiserId as string,
      categoryId: req.query.categoryId as string,
      tag: req.query.tag as string,
      campaignTypeId: req.query.campaignTypeId as string,
      seasonId: req.query.seasonId as string,
      hierarchyLevel: req.query.hierarchyLevel as string,
      locationId: req.query.locationId as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
    });

    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/featured", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const campaigns = await campaignService.getFeaturedCampaigns(limit);
    res.json({ status: "success", data: campaigns });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const campaign = await campaignService.getCampaignById(id);
    res.json({ status: "success", data: campaign });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/slug/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const campaign = await campaignService.getCampaignBySlug(slug);
    res.json({ status: "success", data: campaign });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Authenticated Routes - Campaign CRUD
// =============================================================================

campaignsRouter.post(
  "/",
  authenticate,
  requireCampaignCreatorEligible,
  validateBody(campaignCreateSchema),
  async (req: AuthorizedRequest, res, next) => {
    try {
      const campaign = await campaignService.createCampaign(req.userId!, req.body);
      res.status(201).json({ status: "success", data: campaign });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.put(
  "/:id",
  authenticate,
  validateBody(campaignUpdateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const id = req.params.id as string;
      const campaign = await campaignService.updateCampaign(id, req.userId!, req.userRole!, req.body);
      res.json({ status: "success", data: campaign });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.delete("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    await campaignService.deleteCampaign(id, req.userId!, req.userRole!);
    res.json({ status: "success", message: "Campaign moved to trash" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Status Management
// =============================================================================

campaignsRouter.patch(
  "/:id/status",
  authenticate,
  validateBody(campaignStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const id = req.params.id as string;
      const campaign = await campaignService.updateCampaignStatus(id, req.userId!, req.userRole!, req.body.status);
      res.json({ status: "success", data: campaign });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Image Management
// =============================================================================

campaignsRouter.post(
  "/:id/images",
  authenticate,
  uploadSingle("image"),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: "error", message: "No image file provided" });
      }

      const id = req.params.id as string;
      const imageUrl = `/uploads/${req.file.filename}`;
      const image = await campaignService.addCampaignImage(id, req.userId!, req.userRole!, {
        url: imageUrl,
        alt: req.body.alt,
      });

      res.status(201).json({ status: "success", data: image });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.post(
  "/:id/images/bulk",
  authenticate,
  uploadMultiple("images", 10),
  async (req: AuthRequest, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ status: "error", message: "No image files provided" });
      }

      const id = req.params.id as string;
      const images = await Promise.all(
        files.map((file) =>
          campaignService.addCampaignImage(id, req.userId!, req.userRole!, {
            url: `/uploads/${file.filename}`,
          })
        )
      );

      res.status(201).json({ status: "success", data: images });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.delete(
  "/:campaignId/images/:imageId",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const imageId = req.params.imageId as string;
      await campaignService.removeCampaignImage(imageId, req.userId!, req.userRole!);
      res.json({ status: "success", message: "Image removed" });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Bulk Actions (Admin only)
// =============================================================================

campaignsRouter.post(
  "/bulk-actions",
  authenticate,
  authorize("admin"),
  validateBody(z.object({
    ids: z.array(z.string().uuid()).min(1, "At least one campaign ID is required"),
    action: z.enum(["publish", "archive", "delete", "restore"]),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await campaignService.bulkAction(req.body.ids, req.body.action, req.userRole!);
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Trash Management (Admin only)
// =============================================================================

campaignsRouter.get("/trash/list", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await campaignService.getTrashCampaigns(page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.post(
  "/trash/restore/:id",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const campaign = await campaignService.restoreCampaign(id);
      res.json({ status: "success", data: campaign });
    } catch (error) {
      next(error);
    }
  }
);

campaignsRouter.delete("/trash/empty", authenticate, authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    const result = await campaignService.emptyTrash(req.body?.ids);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Campaign Hierarchy — parent/child relationships
// =============================================================================

campaignsRouter.get("/hierarchy/:id/children", async (req, res, next) => {
  try {
    const children = await campaignService.getCampaignChildren(req.params.id);
    res.json({ status: "success", data: children });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/hierarchy/:id/parent", async (req, res, next) => {
  try {
    const parent = await campaignService.getCampaignParent(req.params.id);
    res.json({ status: "success", data: parent });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/hierarchy/:id/tree", async (req, res, next) => {
  try {
    const tree = await campaignService.getHierarchyTree(req.params.id);
    res.json({ status: "success", data: tree });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Opportunities — approved campaign types with isOpportunity
// =============================================================================

campaignsRouter.get("/opportunities/types", async (_req, res, next) => {
  try {
    const types = await campaignService.listOpportunityTypes();
    res.json({ status: "success", data: types });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/opportunities/:typeSlug", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await campaignService.listCampaignsByOpportunity(req.params.typeSlug, {
      page,
      limit,
      status: req.query.status as any,
    });
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Self-Funding — campaigns with owner contribution
// =============================================================================

campaignsRouter.get("/self-funding", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await campaignService.listSelfFundingCampaigns({
      page,
      limit,
      level: req.query.level as string,
    });
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Enhanced List — supports new filter params
// =============================================================================

campaignsRouter.get("/discover", optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await campaignService.listCampaignsEnhanced({
      page,
      limit,
      search: req.query.search as string,
      status: req.query.status as any,
      mode: req.query.mode as any,
      authorId: req.query.authorId as string,
      fundraiserId: req.query.fundraiserId as string,
      categoryId: req.query.categoryId as string,
      tag: req.query.tag as string,
      campaignTypeId: req.query.campaignTypeId as string,
      seasonId: req.query.seasonId as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      // New filter params
      parentId: req.query.parentId as string,
      hierarchyLevel: req.query.hierarchyLevel as string,
      locationId: req.query.locationId as string,
      isEvergreen: req.query.isEvergreen === "true" ? true : req.query.isEvergreen === "false" ? false : undefined,
      isSelfFunding: req.query.isSelfFunding === "true" ? true : req.query.isSelfFunding === "false" ? false : undefined,
      selfFundingLevel: req.query.selfFundingLevel as string,
      location: req.query.location as string,
    });

    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

export { campaignsRouter };
