import { Response, NextFunction } from "express";
import { type AuthRequest } from "./auth";
import { hasPermission } from "../lib/roles";
import type { Permission, Role } from "@fundordonate/types";
import { AppError } from "./errorHandler";

/**
 * Middleware to check if authenticated user has a specific permission
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) {
      return next(new AppError(401, "Authentication required"));
    }

    if (!req.userRole) {
      return next(new AppError(403, "No role assigned"));
    }

    const hasAll = permissions.every((p) => hasPermission(req.userRole! as Role, p));

    if (!hasAll) {
      return next(new AppError(403, "Insufficient permissions"));
    }

    next();
  };
}

/**
 * Middleware to check if user owns the resource or is admin
 */
export function requireOwnershipOrAdmin(
  getOwnerId: (req: AuthRequest) => Promise<string | null>
) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return next(new AppError(401, "Authentication required"));
      }

      // Admins bypass ownership check
      if (req.userRole === "admin") {
        return next();
      }

      const ownerId = await getOwnerId(req);

      if (ownerId !== req.userId) {
        return next(new AppError(403, "You can only access your own resources"));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user is campaign author or collaborator
 */
export function requireCampaignAccess(
  getCampaignAuthorId: (req: AuthRequest) => Promise<string | null>,
  getCampaignCollaborators: (req: AuthRequest) => Promise<string[]>
) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return next(new AppError(401, "Authentication required"));
      }

      // Admins bypass
      if (req.userRole === "admin") {
        return next();
      }

      const authorId = await getCampaignAuthorId(req);

      // Check if user is the author
      if (authorId === req.userId) {
        return next();
      }

      // Check if user is a collaborator
      const collaborators = await getCampaignCollaborators(req);
      if (collaborators.includes(req.userId)) {
        return next();
      }

      return next(new AppError(403, "You don't have access to this campaign"));
    } catch (error) {
      next(error);
    }
  };
}
