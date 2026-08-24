import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth";

const campaignsRouter = Router();

campaignsRouter.get("/", async (_req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        category: true,
      },
    });

    res.json({ status: "success", data: campaigns });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.get("/:id", async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        category: true,
        rewards: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ status: "error", message: "Campaign not found" });
    }

    res.json({ status: "success", data: campaign });
  } catch (error) {
    next(error);
  }
});

campaignsRouter.post("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { title, description, goalAmount, deadline, mode, categoryId } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const campaign = await prisma.campaign.create({
      data: {
        title,
        slug,
        description,
        goalAmount: parseInt(goalAmount),
        deadline: new Date(deadline),
        mode: mode || "donation",
        categoryId,
        authorId: req.userId!,
        status: "draft",
      },
    });

    res.status(201).json({ status: "success", data: campaign });
  } catch (error) {
    next(error);
  }
});

export { campaignsRouter };
