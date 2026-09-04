import { Router } from "express";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const walletRouter = Router();
walletRouter.use(authenticate);

// =============================================================================
// Get Wallet Info
// =============================================================================

walletRouter.get("/wallet", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    let wallet = await prisma.wallet.findUnique({ where: { userId } });

    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId } });
    }

    res.json({ status: "success", data: wallet });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Wallet Transaction History
// =============================================================================

walletRouter.get("/wallet/transactions", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;
    const action = req.query.action as string | undefined;
    const skip = (page - 1) * limit;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.json({ status: "success", data: { transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } } });
      return;
    }

    const where: Record<string, unknown> = { walletId: wallet.id };
    if (type) where.type = type;
    if (action) where.action = action;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        include: {
          campaign: { select: { title: true, slug: true } },
          donation: { select: { uid: true, amount: true } },
          pledge: { select: { uid: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    res.json({
      status: "success",
      data: {
        transactions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Wallet Summary (earnings breakdown)
// =============================================================================

walletRouter.get("/wallet/summary", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.json({
        status: "success",
        data: {
          balance: 0,
          totalEarned: 0,
          totalFees: 0,
          totalWithdrawn: 0,
          pendingWithdrawal: 0,
          byCampaign: [],
        },
      });
      return;
    }

    // Get all transactions grouped by type
    const [credits, debits] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id, action: "credit", status: "completed" },
        select: { amount: true, type: true, campaignId: true, createdAt: true },
      }),
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id, action: "debit", status: "completed" },
        select: { amount: true, type: true, createdAt: true },
      }),
    ]);

    const totalEarned = credits
      .filter((c) => c.type === "earning")
      .reduce((s, c) => s + c.amount, 0);
    const totalFees = debits
      .filter((d) => d.type === "platform_fee")
      .reduce((s, d) => s + d.amount, 0);
    const totalWithdrawn = debits
      .filter((d) => d.type === "withdrawal_approval")
      .reduce((s, d) => s + d.amount, 0);
    const pendingWithdrawal = wallet.requestedAmount;

    // Earnings by campaign
    const campaignEarnings: Record<string, number> = {};
    credits.filter((c) => c.type === "earning" && c.campaignId).forEach((c) => {
      campaignEarnings[c.campaignId!] = (campaignEarnings[c.campaignId!] || 0) + c.amount;
    });

    const campaignIds = Object.keys(campaignEarnings);
    const campaigns = campaignIds.length > 0
      ? await prisma.campaign.findMany({
          where: { id: { in: campaignIds } },
          select: { id: true, title: true, slug: true },
        })
      : [];

    const byCampaign = campaigns.map((c) => ({
      campaignId: c.id,
      title: c.title,
      slug: c.slug,
      earned: campaignEarnings[c.id] || 0,
    }));

    res.json({
      status: "success",
      data: {
        balance: wallet.balance,
        totalEarned,
        totalFees,
        totalWithdrawn,
        pendingWithdrawal,
        byCampaign,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Admin: Credit Wallet (manual adjustment)
// =============================================================================

walletRouter.post("/wallet/credit", authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    const { userId, amount, type, referenceId, referenceType } = req.body as {
      userId: string;
      amount: number;
      type?: string;
      referenceId?: string;
      referenceType?: string;
    };

    if (!userId || !amount || amount <= 0) {
      throw new AppError(400, "Valid userId and amount are required");
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId } });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          amount,
          action: "credit",
          type: type || "earning",
          status: "completed",
          referenceId,
          referenceType,
        },
      });

      await tx.wallet.update({
        where: { id: wallet!.id },
        data: { balance: { increment: amount } },
      });

      return t;
    });

    res.status(201).json({ status: "success", data: transaction });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Admin: Debit Wallet (manual adjustment)
// =============================================================================

walletRouter.post("/wallet/debit", authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    const { userId, amount, type, referenceId, referenceType } = req.body as {
      userId: string;
      amount: number;
      type?: string;
      referenceId?: string;
      referenceType?: string;
    };

    if (!userId || !amount || amount <= 0) {
      throw new AppError(400, "Valid userId and amount are required");
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new AppError(404, "Wallet not found");
    }

    if (wallet.balance < amount) {
      throw new AppError(400, "Insufficient balance");
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          action: "debit",
          type: type || "platform_fee",
          status: "completed",
          referenceId,
          referenceType,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return t;
    });

    res.status(201).json({ status: "success", data: transaction });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Wallet Stats (admin)
// =============================================================================

walletRouter.get("/wallet/stats", authorize("admin"), async (_req: AuthRequest, res, next) => {
  try {
    const [totalBalance, totalRequested, totalWithdrawn, totalFees, walletCount] = await Promise.all([
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.wallet.aggregate({ _sum: { requestedAmount: true } }),
      prisma.wallet.aggregate({ _sum: { withdrawAmount: true } }),
      prisma.wallet.aggregate({ _sum: { platformFee: true } }),
      prisma.wallet.count(),
    ]);

    res.json({
      status: "success",
      data: {
        totalBalance: totalBalance._sum.balance || 0,
        totalRequested: totalRequested._sum.requestedAmount || 0,
        totalWithdrawn: totalWithdrawn._sum.withdrawAmount || 0,
        totalFees: totalFees._sum.platformFee || 0,
        walletCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { walletRouter };
