import { Router } from "express";
import { prisma } from "../lib/prisma";
import * as engagementService from "../services/engagement.service";
import { authenticate, authorize, optionalAuth, type AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { postCreateSchema, postUpdateSchema, commentCreateSchema, commentUpdateSchema, commentModerationSchema } from "../validations";

const engagementRouter = Router({ mergeParams: true });

// =============================================================================
// Campaign Posts (Updates)
// =============================================================================

engagementRouter.get("/posts", optionalAuth, async (req, res, next) => {
  try {
    const campaignId = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await engagementService.getPosts(campaignId, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

engagementRouter.get("/posts/:postId", optionalAuth, async (req, res, next) => {
  try {
    const post = await engagementService.getPostById(req.params.postId as string);
    res.json({ status: "success", data: post });
  } catch (error) {
    next(error);
  }
});

engagementRouter.post(
  "/posts",
  authenticate,
  validateBody(postCreateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const campaignId = req.params.id as string;
      const post = await engagementService.createPost(campaignId, req.userId!, req.userRole!, req.body);
      res.status(201).json({ status: "success", data: post });
    } catch (error) {
      next(error);
    }
  }
);

engagementRouter.put(
  "/posts/:postId",
  authenticate,
  validateBody(postUpdateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const post = await engagementService.updatePost(req.params.postId as string, req.userId!, req.userRole!, req.body);
      res.json({ status: "success", data: post });
    } catch (error) {
      next(error);
    }
  }
);

engagementRouter.delete("/posts/:postId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await engagementService.deletePost(req.params.postId as string, req.userId!, req.userRole!);
    res.json({ status: "success", message: "Post deleted" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Comments
// =============================================================================

engagementRouter.get("/comments", optionalAuth, async (req, res, next) => {
  try {
    const campaignId = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await engagementService.getComments(campaignId, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
});

engagementRouter.post(
  "/comments",
  authenticate,
  validateBody(commentCreateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const campaignId = req.params.id as string;
      const comment = await engagementService.createComment(campaignId, req.userId!, req.body);
      res.status(201).json({ status: "success", data: comment });
    } catch (error) {
      next(error);
    }
  }
);

engagementRouter.put(
  "/comments/:commentId",
  authenticate,
  validateBody(commentUpdateSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const comment = await engagementService.updateComment(req.params.commentId as string, req.userId!, req.body);
      res.json({ status: "success", data: comment });
    } catch (error) {
      next(error);
    }
  }
);

engagementRouter.delete("/comments/:commentId", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await engagementService.deleteComment(req.params.commentId as string, req.userId!, req.userRole!);
    res.json({ status: "success", message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
});

engagementRouter.patch(
  "/comments/:commentId/moderate",
  authenticate,
  authorize("admin"),
  validateBody(commentModerationSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const comment = await engagementService.moderateComment(req.params.commentId as string, req.body.status);
      res.json({ status: "success", data: comment });
    } catch (error) {
      next(error);
    }
  }
);

engagementRouter.get("/comments/pending/list", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const campaignId = req.query.campaignId as string | undefined;
    const comments = await engagementService.getPendingComments(campaignId);
    res.json({ status: "success", data: comments });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Bookmarks
// =============================================================================

engagementRouter.post("/bookmark", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const campaignId = req.params.id as string;
    const existing = await prisma.bookmark.findUnique({
      where: { campaignId_userId: { campaignId, userId: req.userId! } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { campaignId_userId: { campaignId, userId: req.userId! } },
      });
      res.json({ status: "success", data: { bookmarked: false } });
    } else {
      await prisma.bookmark.create({
        data: { campaignId, userId: req.userId! },
      });
      res.json({ status: "success", data: { bookmarked: true } });
    }
  } catch (error) {
    next(error);
  }
});

engagementRouter.get("/bookmark/check", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const campaignId = req.params.id as string;
    const existing = await prisma.bookmark.findUnique({
      where: { campaignId_userId: { campaignId, userId: req.userId! } },
    });
    res.json({ status: "success", data: { bookmarked: !!existing } });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Collaborators
// =============================================================================

engagementRouter.get("/collaborators", async (req: AuthRequest, res, next) => {
  try {
    const campaignId = req.params.id as string;
    const collaborators = await prisma.campaignCollaborator.findMany({
      where: { campaignId },
      include: {
        collaborator: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
        },
      },
    });
    res.json({ status: "success", data: collaborators });
  } catch (error) {
    next(error);
  }
});

export { engagementRouter };
