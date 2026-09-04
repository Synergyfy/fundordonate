import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const userDashboardRouter = Router();
userDashboardRouter.use(authenticate);

// =============================================================================
// Donor Dashboard Stats
// =============================================================================

userDashboardRouter.get("/user/dashboard/stats", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const [totalDonations, totalPledges, bookmarks, campaignsBacked] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { userId, status: "completed" },
      }),
      prisma.pledge.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { userId, status: "completed" },
      }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.campaign.count({
        where: {
          OR: [
            { donations: { some: { userId, status: "completed" } } },
            { pledges: { some: { userId, status: "completed" } } },
          ],
        },
      }),
    ]);

    res.json({
      status: "success",
      data: {
        totalDonations: totalDonations._count,
        totalDonationsAmount: totalDonations._sum.amount || 0,
        totalPledges: totalPledges._count,
        totalPledgesAmount: totalPledges._sum.amount || 0,
        totalContributed: (totalDonations._sum.amount || 0) + (totalPledges._sum.amount || 0),
        bookmarkedCount: bookmarks,
        campaignsBacked,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Donation History
// =============================================================================

userDashboardRouter.get("/user/donations", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: { userId },
        include: {
          campaign: { select: { title: true, slug: true, featuredImage: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.donation.count({ where: { userId } }),
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

// =============================================================================
// Pledge History
// =============================================================================

userDashboardRouter.get("/user/pledges", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [pledges, total] = await Promise.all([
      prisma.pledge.findMany({
        where: { userId },
        include: {
          campaign: { select: { title: true, slug: true, featuredImage: true, deadline: true } },
          reward: { select: { title: true, amount: true, deliveryDate: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pledge.count({ where: { userId } }),
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

// =============================================================================
// Bookmarked Campaigns
// =============================================================================

userDashboardRouter.get("/user/bookmarks", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          campaign: {
            include: {
              author: { select: { firstName: true, lastName: true } },
              _count: { select: { donations: true, pledges: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    res.json({
      status: "success",
      data: {
        bookmarks,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

userDashboardRouter.post("/user/bookmarks/:campaignId", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;

    const existing = await prisma.bookmark.findUnique({
      where: { campaignId_userId: { campaignId: campaignId as string, userId } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { campaignId_userId: { campaignId: campaignId as string, userId } },
      });
      res.json({ status: "success", data: { bookmarked: false } });
    } else {
      await prisma.bookmark.create({ data: { userId, campaignId: campaignId as string } });
      res.json({ status: "success", data: { bookmarked: true } });
    }
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Annual Receipts
// =============================================================================

userDashboardRouter.get("/user/receipts", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [donations, pledges] = await Promise.all([
      prisma.donation.findMany({
        where: {
          userId,
          status: "completed",
          createdAt: { gte: startDate, lt: endDate },
        },
        include: {
          campaign: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pledge.findMany({
        where: {
          userId,
          status: "completed",
          createdAt: { gte: startDate, lt: endDate },
        },
        include: {
          campaign: { select: { title: true, slug: true } },
          reward: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
    const totalPledges = pledges.reduce((s, p) => s + p.amount, 0);

    res.json({
      status: "success",
      data: {
        year,
        donations,
        pledges,
        totalDonations,
        totalPledges,
        totalContributed: totalDonations + totalPledges,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Profile Settings
// =============================================================================

userDashboardRouter.get("/user/profile", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    res.json({ status: "success", data: user });
  } catch (error) {
    next(error);
  }
});

userDashboardRouter.put("/user/profile", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { firstName, lastName, username, bio, avatar } = req.body as {
      firstName?: string;
      lastName?: string;
      username?: string;
      bio?: string;
      avatar?: string;
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });

    res.json({ status: "success", data: user });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Change Password
// =============================================================================

userDashboardRouter.post("/user/change-password", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      throw new AppError(400, "Current and new password are required");
    }

    if (newPassword.length < 8) {
      throw new AppError(400, "New password must be at least 8 characters");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new AppError(401, "Current password is incorrect");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    res.json({ status: "success", message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Delete Account
// =============================================================================

userDashboardRouter.delete("/user/account", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { password } = req.body as { password: string };

    if (!password) {
      throw new AppError(400, "Password is required to delete account");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(401, "Password is incorrect");
    }

    // Delete user data
    await prisma.$transaction([
      prisma.bookmark.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.activity.deleteMany({ where: { userId } }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    res.json({ status: "success", message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Notification Preferences (placeholder)
// =============================================================================

userDashboardRouter.get("/user/notifications", async (_req: AuthRequest, res, next) => {
  try {
    res.json({
      status: "success",
      data: {
        emailDonations: true,
        emailCampaignUpdates: true,
        emailNewFollowers: true,
        emailWithdrawals: true,
        pushDonations: true,
        pushCampaignUpdates: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

userDashboardRouter.put("/user/notifications", async (req: AuthRequest, res, next) => {
  try {
    res.json({ status: "success", data: req.body });
  } catch (error) {
    next(error);
  }
});

export { userDashboardRouter };
