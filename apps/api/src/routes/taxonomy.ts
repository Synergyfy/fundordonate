import { Router } from "express";
import { z } from "zod";
import * as taxonomyService from "../services/taxonomy.service";
import * as taxonomyDomainService from "../services/taxonomy-domain.service";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { categoryCreateSchema, categoryUpdateSchema, tagCreateSchema, tagUpdateSchema } from "../validations";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const taxonomyRouter = Router();

// =============================================================================
// Categories - Public
// =============================================================================

taxonomyRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await taxonomyService.getCategories();
    res.json({ status: "success", data: categories });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.get("/categories/:id", async (req, res, next) => {
  try {
    const category = await taxonomyService.getCategoryById(req.params.id as string);
    res.json({ status: "success", data: category });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.get("/categories/slug/:slug", async (req, res, next) => {
  try {
    const category = await taxonomyService.getCategoryBySlug(req.params.slug as string);
    res.json({ status: "success", data: category });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Categories - Admin CRUD
// =============================================================================

taxonomyRouter.post(
  "/categories",
  authenticate,
  authorize("admin"),
  validateBody(categoryCreateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const category = await taxonomyService.createCategory(req.body);
      res.status(201).json({ status: "success", data: category });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.put(
  "/categories/:id",
  authenticate,
  authorize("admin"),
  validateBody(categoryUpdateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const category = await taxonomyService.updateCategory(req.params.id as string, req.body);
      res.json({ status: "success", data: category });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.delete("/categories/:id", authenticate, authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    await taxonomyService.deleteCategory(req.params.id as string);
    res.json({ status: "success", message: "Category deleted" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Tags - Public
// =============================================================================

taxonomyRouter.get("/tags", async (_req, res, next) => {
  try {
    const tags = await taxonomyService.getTags();
    res.json({ status: "success", data: tags });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.get("/tags/search", async (req, res, next) => {
  try {
    const query = (req.query.q as string) || "";
    const tags = await taxonomyService.searchTags(query);
    res.json({ status: "success", data: tags });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.get("/tags/:id", async (req, res, next) => {
  try {
    const tag = await taxonomyService.getTagById(req.params.id as string);
    res.json({ status: "success", data: tag });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Tags - Admin CRUD
// =============================================================================

taxonomyRouter.post(
  "/tags",
  authenticate,
  authorize("admin"),
  validateBody(tagCreateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const tag = await taxonomyService.createTag(req.body);
      res.status(201).json({ status: "success", data: tag });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.put(
  "/tags/:id",
  authenticate,
  authorize("admin"),
  validateBody(tagUpdateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const tag = await taxonomyService.updateTag(req.params.id as string, req.body);
      res.json({ status: "success", data: tag });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.delete("/tags/:id", authenticate, authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    await taxonomyService.deleteTag(req.params.id as string);
    res.json({ status: "success", message: "Tag deleted" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Campaign-Tag Assignment
// =============================================================================

taxonomyRouter.post(
  "/campaigns/:campaignId/tags",
  authenticate,
  validateBody(z.object({ tagId: z.string().uuid() })),
  async (req: AuthRequest, res, next) => {
    try {
      const campaignId = req.params.campaignId as string;
      // Verify campaign ownership or admin role
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { authorId: true } });
      if (!campaign) {
        return next(new AppError(404, "Campaign not found"));
      }
      if (campaign.authorId !== req.userId && req.userRole !== "admin") {
        return next(new AppError(403, "You can only modify tags on your own campaigns"));
      }
      await taxonomyService.addTagToCampaign(campaignId, req.body.tagId);
      res.json({ status: "success", message: "Tag added to campaign" });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.delete("/campaigns/:campaignId/tags/:tagId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const campaignId = req.params.campaignId as string;
    // Verify campaign ownership or admin role
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { authorId: true } });
    if (!campaign) {
      return next(new AppError(404, "Campaign not found"));
    }
    if (campaign.authorId !== req.userId && req.userRole !== "admin") {
      return next(new AppError(403, "You can only modify tags on your own campaigns"));
    }
    await taxonomyService.removeTagFromCampaign(campaignId, req.params.tagId as string);
    res.json({ status: "success", message: "Tag removed from campaign" });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.put(
  "/campaigns/:campaignId/tags/sync",
  authenticate,
  validateBody(z.object({ tags: z.array(z.string()).min(0) })),
  async (req: AuthRequest, res, next) => {
    try {
      const campaignId = req.params.campaignId as string;
      // Verify campaign ownership or admin role
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { authorId: true } });
      if (!campaign) {
        return next(new AppError(404, "Campaign not found"));
      }
      if (campaign.authorId !== req.userId && req.userRole !== "admin") {
        return next(new AppError(403, "You can only modify tags on your own campaigns"));
      }
      const tags = await taxonomyService.syncCampaignTags(campaignId, req.body.tags);
      res.json({ status: "success", data: tags });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Campaign Types
// =============================================================================

taxonomyRouter.get("/campaign-types", async (_req, res, next) => {
  try {
    const types = await taxonomyDomainService.getCampaignTypes();
    res.json({ status: "success", data: types });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.post(
  "/campaign-types",
  authenticate,
  authorize("admin"),
  validateBody(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const type = await taxonomyDomainService.createCampaignType(req.body);
      res.status(201).json({ status: "success", data: type });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Campaign Seasons
// =============================================================================

taxonomyRouter.get("/seasons", async (_req, res, next) => {
  try {
    const seasons = await taxonomyDomainService.getCampaignSeasons();
    res.json({ status: "success", data: seasons });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.post(
  "/seasons",
  authenticate,
  authorize("admin"),
  validateBody(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(["active", "upcoming", "completed", "cancelled"]).optional(),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const season = await taxonomyDomainService.createCampaignSeason({
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });
      res.status(201).json({ status: "success", data: season });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Campaign Groups
// =============================================================================

taxonomyRouter.get("/groups", async (_req, res, next) => {
  try {
    const groups = await taxonomyDomainService.getCampaignGroups();
    res.json({ status: "success", data: groups });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.post(
  "/groups",
  authenticate,
  authorize("admin"),
  validateBody(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const group = await taxonomyDomainService.createCampaignGroup(req.body);
      res.status(201).json({ status: "success", data: group });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.post(
  "/groups/:groupId/campaigns/:campaignId",
  authenticate,
  authorize("admin"),
  async (req: AuthRequest, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      const campaignId = req.params.campaignId as string;
      await taxonomyDomainService.addCampaignToGroup(campaignId, groupId);
      res.json({ status: "success", message: "Campaign added to group" });
    } catch (error) {
      next(error);
    }
  }
);

taxonomyRouter.delete(
  "/groups/:groupId/campaigns/:campaignId",
  authenticate,
  authorize("admin"),
  async (req: AuthRequest, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      const campaignId = req.params.campaignId as string;
      await taxonomyDomainService.removeCampaignFromGroup(campaignId, groupId);
      res.json({ status: "success", message: "Campaign removed from group" });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Campaign Collections
// =============================================================================

taxonomyRouter.get("/collections", async (_req, res, next) => {
  try {
    const collections = await taxonomyDomainService.getCampaignCollections();
    res.json({ status: "success", data: collections });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.post(
  "/collections",
  authenticate,
  authorize("admin"),
  validateBody(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const collection = await taxonomyDomainService.createCampaignCollection(req.body);
      res.status(201).json({ status: "success", data: collection });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Campaign Events
// =============================================================================

taxonomyRouter.get("/events", async (_req, res, next) => {
  try {
    const events = await taxonomyDomainService.getCampaignEvents();
    res.json({ status: "success", data: events });
  } catch (error) {
    next(error);
  }
});

taxonomyRouter.post(
  "/events",
  authenticate,
  authorize("admin"),
  validateBody(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const event = await taxonomyDomainService.createCampaignEvent({
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });
      res.status(201).json({ status: "success", data: event });
    } catch (error) {
      next(error);
    }
  }
);

export { taxonomyRouter };
