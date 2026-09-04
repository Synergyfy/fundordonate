import { Router } from "express";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";
import {
  getAllRoles,
  getRolePermissions,
  getRoleDisplayName,
  getRoleDescription,
} from "../lib/roles";
import type { Role } from "@fundordonate/types";
import { prisma } from "../lib/prisma";

const rolesRouter = Router();

// =============================================================================
// Public - Get all roles with their permissions
// =============================================================================

rolesRouter.get("/roles", (_req, res) => {
  const roles = getAllRoles().map((role) => ({
    id: role,
    name: getRoleDisplayName(role),
    description: getRoleDescription(role),
    permissions: getRolePermissions(role),
  }));

  res.json({ status: "success", data: roles });
});

// =============================================================================
// Admin - Get user's role
// =============================================================================

rolesRouter.get("/users/:userId/role", authenticate, authorize("admin"), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId as string },
      select: { id: true, role: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    res.json({
      status: "success",
      data: {
        ...user,
        permissions: getRolePermissions(user.role as Role),
        roleName: getRoleDisplayName(user.role as Role),
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Admin - Update user's role
// =============================================================================

rolesRouter.put(
  "/users/:userId/role",
  authenticate,
  authorize("admin"),
  async (req: AuthRequest, res, next) => {
    try {
      const { role } = req.body as { role: string };
      const validRoles = getAllRoles();

      if (!validRoles.includes(role as Role)) {
        res.status(400).json({
          status: "error",
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
        return;
      }

      // Prevent changing own role
      if (req.params.userId === req.userId) {
        res.status(400).json({
          status: "error",
          message: "Cannot change your own role",
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id: req.params.userId as string },
        data: { role },
        select: { id: true, role: true, firstName: true, lastName: true, email: true },
      });

      res.json({
        status: "success",
        data: {
          ...user,
          permissions: getRolePermissions(role as Role),
          roleName: getRoleDisplayName(role as Role),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Admin - List users by role
// =============================================================================

rolesRouter.get(
  "/roles/:role/users",
  authenticate,
  authorize("admin"),
  async (req: AuthRequest, res, next) => {
    try {
      const { role } = req.params as { role: string };
      const validRoles = getAllRoles();

      if (!validRoles.includes(role as Role)) {
        res.status(400).json({ status: "error", message: "Invalid role" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: { role },
          select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.user.count({ where: { role } }),
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
  }
);

// =============================================================================
// Admin - Role statistics
// =============================================================================

rolesRouter.get(
  "/roles/stats",
  authenticate,
  authorize("admin"),
  async (_req: AuthRequest, res, next) => {
    try {
      const roles = getAllRoles();
      const stats = await Promise.all(
        roles.map(async (role) => ({
          role,
          name: getRoleDisplayName(role),
          count: await prisma.user.count({ where: { role } }),
        }))
      );

      res.json({ status: "success", data: stats });
    } catch (error) {
      next(error);
    }
  }
);

export { rolesRouter };
