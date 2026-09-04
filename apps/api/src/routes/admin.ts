import { Router } from "express";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import * as campaignService from "../services/campaign.service";

const adminRouter = Router();

// All admin routes require admin role
adminRouter.use(authenticate, authorize("admin"));

// =============================================================================
// Dashboard Stats
// =============================================================================

adminRouter.get("/admin/stats", async (_req: AuthRequest, res, next) => {
  try {
    const [
      totalCampaigns,
      publishedCampaigns,
      totalDonations,
      totalPledges,
      totalUsers,
      raisedAmount,
      donationStats,
      pledgeStats,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "published" } }),
      prisma.donation.count({ where: { status: "completed" } }),
      prisma.pledge.count({ where: { status: "completed" } }),
      prisma.user.count(),
      prisma.campaign.aggregate({ _sum: { raisedAmount: true }, where: { status: "published" } }),
      prisma.donation.aggregate({ _sum: { amount: true }, where: { status: "completed" } }),
      prisma.pledge.aggregate({ _sum: { amount: true }, where: { status: "completed" } }),
    ]);

    res.json({
      status: "success",
      data: {
        totalCampaigns,
        publishedCampaigns,
        totalDonations,
        totalPledges,
        totalUsers,
        totalRaised: raisedAmount._sum.raisedAmount || 0,
        totalDonationsAmount: donationStats._sum.amount || 0,
        totalPledgesAmount: pledgeStats._sum.amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Revenue Chart Data
// =============================================================================

adminRouter.get("/admin/stats/revenue", async (req: AuthRequest, res, next) => {
  try {
    const period = (req.query.period as string) || "monthly";
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear() - 3, 0, 1);
        break;
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    const [donations, pledges] = await Promise.all([
      prisma.donation.findMany({
        where: { status: "completed", createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true },
      }),
      prisma.pledge.findMany({
        where: { status: "completed", createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // Group by period
    const revenueByPeriod: Record<string, { donations: number; pledges: number; total: number }> = {};

    donations.forEach((d) => {
      const key = period === "daily"
        ? d.createdAt.toISOString().split("T")[0]
        : `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!revenueByPeriod[key]) revenueByPeriod[key] = { donations: 0, pledges: 0, total: 0 };
      revenueByPeriod[key].donations += d.amount;
      revenueByPeriod[key].total += d.amount;
    });

    pledges.forEach((p) => {
      const key = period === "daily"
        ? p.createdAt.toISOString().split("T")[0]
        : `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!revenueByPeriod[key]) revenueByPeriod[key] = { donations: 0, pledges: 0, total: 0 };
      revenueByPeriod[key].pledges += p.amount;
      revenueByPeriod[key].total += p.amount;
    });

    const chartData = Object.entries(revenueByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({ period, ...data }));

    res.json({ status: "success", data: chartData });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Recent Contributions
// =============================================================================

adminRouter.get("/admin/stats/recent", async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const [donations, pledges] = await Promise.all([
      prisma.donation.findMany({
        where: { status: "completed" },
        include: {
          campaign: { select: { title: true, slug: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.pledge.findMany({
        where: { status: "completed" },
        include: {
          campaign: { select: { title: true, slug: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
          reward: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const contributions = [
      ...donations.map((d) => ({
        id: d.uid,
        type: "donation" as const,
        amount: d.amount,
        campaign: d.campaign.title,
        user: d.user ? `${d.user.firstName} ${d.user.lastName}` : "Anonymous",
        date: d.createdAt,
      })),
      ...pledges.map((p) => ({
        id: p.uid,
        type: "pledge" as const,
        amount: p.amount,
        campaign: p.campaign.title,
        user: p.user ? `${p.user.firstName} ${p.user.lastName}` : "Anonymous",
        date: p.createdAt,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);

    res.json({ status: "success", data: contributions });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Top Campaigns
// =============================================================================

adminRouter.get("/admin/stats/top-campaigns", async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const campaigns = await prisma.campaign.findMany({
      where: { status: "published" },
      include: {
        author: { select: { firstName: true, lastName: true } },
        _count: { select: { donations: true, pledges: true } },
      },
      orderBy: { raisedAmount: "desc" },
      take: limit,
    });

    res.json({ status: "success", data: campaigns });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Activity Feed
// =============================================================================

adminRouter.get("/admin/stats/activity", async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const activities = await prisma.activity.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        campaign: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({ status: "success", data: activities });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Campaign Management
// =============================================================================

adminRouter.get("/admin/campaigns", async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const mode = req.query.mode as string | undefined;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) where.title = { contains: search };
    if (status) where.status = status;
    if (mode) where.mode = mode;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { donations: true, pledges: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    res.json({
      status: "success",
      data: {
        campaigns,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/admin/campaigns/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const campaign = await campaignService.updateCampaignStatus(
      req.params.id as string,
      req.userId!,
      req.userRole!,
      status
    );
    res.json({ status: "success", data: campaign });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/admin/campaigns/bulk", async (req: AuthRequest, res, next) => {
  try {
    const { action, campaignIds } = req.body as { action: string; campaignIds: string[] };

    let updateData: Record<string, string> = {};
    switch (action) {
      case "publish": updateData = { status: "published" }; break;
      case "archive": updateData = { status: "archived" }; break;
      case "delete":
        await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
        res.json({ status: "success", message: "Campaigns deleted" });
        return;
      default:
        res.status(400).json({ status: "error", message: "Invalid action" });
        return;
    }

    await prisma.campaign.updateMany({ where: { id: { in: campaignIds } }, data: updateData });
    res.json({ status: "success", message: `Campaigns ${action}d` });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Donation Management
// =============================================================================

adminRouter.get("/admin/donations", async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: {
          campaign: { select: { title: true, slug: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.donation.count({ where }),
    ]);

    res.json({
      status: "success",
      data: {
        donations,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/donations/:id", async (req: AuthRequest, res, next) => {
  try {
    const donation = await prisma.donation.findUnique({
      where: { uid: req.params.id as string },
      include: {
        campaign: { select: { title: true, slug: true, authorId: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!donation) {
      res.status(404).json({ status: "error", message: "Donation not found" });
      return;
    }

    res.json({ status: "success", data: donation });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/admin/donations/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const donation = await prisma.donation.update({
      where: { uid: req.params.id as string },
      data: { status },
    });
    res.json({ status: "success", data: donation });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Pledge Management
// =============================================================================

adminRouter.get("/admin/pledges", async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [pledges, total] = await Promise.all([
      prisma.pledge.findMany({
        where,
        include: {
          campaign: { select: { title: true, slug: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
          reward: { select: { title: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pledge.count({ where }),
    ]);

    res.json({
      status: "success",
      data: {
        pledges,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/pledges/:id", async (req: AuthRequest, res, next) => {
  try {
    const pledge = await prisma.pledge.findUnique({
      where: { uid: req.params.id as string },
      include: {
        campaign: { select: { title: true, slug: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        reward: { select: { title: true, amount: true, description: true } },
      },
    });

    if (!pledge) {
      res.status(404).json({ status: "error", message: "Pledge not found" });
      return;
    }

    res.json({ status: "success", data: pledge });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/admin/pledges/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const pledge = await prisma.pledge.update({
      where: { uid: req.params.id as string },
      data: { status },
    });
    res.json({ status: "success", data: pledge });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// User Management
// =============================================================================

adminRouter.get("/admin/users", async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { donations: true, pledges: true, campaigns: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      status: "success",
      data: {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/admin/users/:id/role", async (req: AuthRequest, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["admin", "fundraiser", "collaborator", "backer", "donor"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ status: "error", message: "Invalid role" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    res.json({ status: "success", data: user });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Settings (placeholder)
// =============================================================================

adminRouter.get("/admin/settings", async (_req: AuthRequest, res) => {
  res.json({
    status: "success",
    data: {
      siteName: process.env.SITE_NAME || "FundorDonate",
      currency: "GBP",
      platformFee: 5,
      paymentGateways: ["stripe", "paypal", "native"],
    },
  });
});

adminRouter.put("/admin/settings", async (req: AuthRequest, res) => {
  res.json({ status: "success", data: req.body });
});

export { adminRouter };
