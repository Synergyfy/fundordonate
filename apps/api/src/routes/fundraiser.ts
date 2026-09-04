import { Router } from "express";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const fundraiserRouter = Router();
fundraiserRouter.use(authenticate);
fundraiserRouter.use(authorize("fundraiser"));

// =============================================================================
// Overview Stats
// =============================================================================

fundraiserRouter.get("/fundraiser/stats", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const [campaigns, totalDonations, totalPledges, withdrawalRequests] = await Promise.all([
      prisma.campaign.findMany({
        where: { authorId: userId },
        select: { id: true, status: true, raisedAmount: true, goalAmount: true },
      }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { campaign: { authorId: userId }, status: "completed" },
      }),
      prisma.pledge.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { campaign: { authorId: userId }, status: "completed" },
      }),
      prisma.withdrawalRequest.findMany({
        where: { userId, status: { in: ["pending", "approved"] } },
        select: { items: { select: { amount: true } } },
      }),
    ]);

    const totalRaised = campaigns.reduce((sum: number, c: { raisedAmount: number }) => sum + c.raisedAmount, 0);
    const totalGoal = campaigns.reduce((sum: number, c: { goalAmount: number }) => sum + c.goalAmount, 0);
    const pendingWithdrawals = withdrawalRequests.reduce(
      (sum: number, wr: { items: { amount: number }[] }) => sum + wr.items.reduce((s: number, i: { amount: number }) => s + i.amount, 0),
      0,
    );
    const totalEarnings = totalRaised - pendingWithdrawals;

    res.json({
      status: "success",
      data: {
        totalCampaigns: campaigns.length,
        publishedCampaigns: campaigns.filter((c: { status: string }) => c.status === "published").length,
        draftCampaigns: campaigns.filter((c: { status: string }) => c.status === "draft").length,
        totalRaised,
        totalGoal,
        totalDonations: totalDonations._count,
        totalDonationsAmount: totalDonations._sum.amount || 0,
        totalPledges: totalPledges._count,
        totalPledgesAmount: totalPledges._sum.amount || 0,
        totalEarnings,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// My Campaigns
// =============================================================================

fundraiserRouter.get("/fundraiser/campaigns", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { authorId: userId };
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          _count: { select: { donations: true, pledges: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
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

fundraiserRouter.get("/fundraiser/campaigns/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id as string, authorId: userId },
      include: {
        _count: { select: { donations: true, pledges: true, posts: true } },
      },
    });

    if (!campaign) {
      res.status(404).json({ status: "error", message: "Campaign not found" });
      return;
    }

    res.json({ status: "success", data: campaign });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Earnings
// =============================================================================

fundraiserRouter.get("/fundraiser/earnings", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const campaigns = await prisma.campaign.findMany({
      where: { authorId: userId },
      select: { id: true, title: true, slug: true, raisedAmount: true, goalAmount: true },
    });

    const campaignIds = campaigns.map((c: { id: string }) => c.id);

    const [donations, pledges, withdrawalRequests] = await Promise.all([
      prisma.donation.findMany({
        where: { campaignId: { in: campaignIds }, status: "completed" },
        select: { amount: true, campaignId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pledge.findMany({
        where: { campaignId: { in: campaignIds }, status: "completed" },
        select: { amount: true, campaignId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.withdrawalRequest.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const earningsByCampaign = campaigns.map((c: { id: string; title: string; slug: string; raisedAmount: number; goalAmount: number }) => ({
      campaignId: c.id,
      title: c.title,
      slug: c.slug,
      raisedAmount: c.raisedAmount,
      goalAmount: c.goalAmount,
      donationsAmount: donations.filter((d: { campaignId: string }) => d.campaignId === c.id).reduce((s: number, d: { amount: number }) => s + d.amount, 0),
      pledgesAmount: pledges.filter((p: { campaignId: string }) => p.campaignId === c.id).reduce((s: number, p: { amount: number }) => s + p.amount, 0),
    }));

    const transactions = [
      ...donations.map((d: { amount: number; campaignId: string; createdAt: Date }) => ({
        type: "donation" as const,
        amount: d.amount,
        campaignId: d.campaignId,
        date: d.createdAt,
      })),
      ...pledges.map((p: { amount: number; campaignId: string; createdAt: Date }) => ({
        type: "pledge" as const,
        amount: p.amount,
        campaignId: p.campaignId,
        date: p.createdAt,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalRaised = campaigns.reduce((s: number, c: { raisedAmount: number }) => s + c.raisedAmount, 0);
    const totalWithdrawn = withdrawalRequests
      .filter((wr: { status: string }) => wr.status === "approved")
      .reduce((s: number, wr: { items: { amount: number }[] }) => s + wr.items.reduce((i: number, item: { amount: number }) => i + item.amount, 0), 0);
    const pendingWithdrawal = withdrawalRequests
      .filter((wr: { status: string }) => wr.status === "pending")
      .reduce((s: number, wr: { items: { amount: number }[] }) => s + wr.items.reduce((i: number, item: { amount: number }) => i + item.amount, 0), 0);

    res.json({
      status: "success",
      data: {
        totalRaised,
        totalWithdrawn,
        pendingWithdrawal,
        walletBalance: totalRaised - totalWithdrawn - pendingWithdrawal,
        earningsByCampaign,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Withdrawals
// =============================================================================

fundraiserRouter.get("/fundraiser/withdrawals", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId },
        include: { items: { include: { campaign: { select: { title: true, slug: true } } } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where: { userId } }),
    ]);

    res.json({
      status: "success",
      data: {
        withdrawals,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

fundraiserRouter.post("/fundraiser/withdrawals", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { amount, method, accountDetails, campaignIds } = req.body as {
      amount: number;
      method: string;
      accountDetails: string;
      campaignIds?: string[];
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ status: "error", message: "Invalid amount" });
      return;
    }

    // Check wallet balance
    const campaigns = await prisma.campaign.findMany({
      where: { authorId: userId },
      select: { id: true, raisedAmount: true },
    });
    const totalRaised = campaigns.reduce((s: number, c: { raisedAmount: number }) => s + c.raisedAmount, 0);

    const existingRequests = await prisma.withdrawalRequest.findMany({
      where: { userId, status: { in: ["pending", "approved"] } },
      include: { items: true },
    });
    const pendingAmount = existingRequests.reduce(
      (s: number, wr: { items: { amount: number }[] }) => s + wr.items.reduce((i: number, item: { amount: number }) => i + item.amount, 0),
      0,
    );

    const availableBalance = totalRaised - pendingAmount;

    if (amount > availableBalance) {
      res.status(400).json({
        status: "error",
        message: `Insufficient balance. Available: ${availableBalance / 100}`,
      });
      return;
    }

    // Create withdrawal request with items
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        method: method || "bank",
        status: "pending",
        payoutInfo: accountDetails || "{}",
        items: {
          create: campaignIds
            ? campaignIds.map((cid) => ({ campaignId: cid, amount: Math.floor(amount / campaignIds.length) }))
            : campaigns.map((c: { id: string; raisedAmount: number }) => ({ campaignId: c.id, amount: c.raisedAmount })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ status: "success", data: withdrawal });
  } catch (error) {
    next(error);
  }
});

fundraiserRouter.get("/fundraiser/withdrawals/:id", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: { id: req.params.id as string, userId },
      include: { items: { include: { campaign: { select: { title: true, slug: true } } } } },
    });

    if (!withdrawal) {
      res.status(404).json({ status: "error", message: "Withdrawal not found" });
      return;
    }

    res.json({ status: "success", data: withdrawal });
  } catch (error) {
    next(error);
  }
});

export { fundraiserRouter };
