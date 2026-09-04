// =============================================================================
// FundOrDonate — Authorization Middleware
// Server-authoritative authorization primitives.
// Builds on auth.ts (authentication) to enforce what authenticated users may do.
// =============================================================================

import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "./errorHandler";
import type { AuthRequest } from "./auth";
import { ENABLED_CAMPAIGN_CREATOR_TYPES } from "@fundordonate/types";

// =============================================================================
// AuthRequest Extension
// =============================================================================

export interface AuthorizedRequest extends AuthRequest {
  userType?: string;
  businessId?: string | null;
  campaign?: any;
  user?: any;
}

// =============================================================================
// requireUserType
// Loads the full user from DB and verifies userType matches allowed types.
// Use this for account-type-level authorization (admin/business/consumer).
// =============================================================================

export function requireUserType(...allowedTypes: string[]) {
  return async (req: AuthorizedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return next(new AppError(401, "Authentication required"));
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, role: true, userType: true, businessId: true },
      });

      if (!user) {
        return next(new AppError(404, "User not found"));
      }

      if (!allowedTypes.includes(user.userType)) {
        return next(new ForbiddenError("Insufficient account type"));
      }

      req.userType = user.userType;
      req.businessId = user.businessId;
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// =============================================================================
// loadCampaign
// Loads a campaign from the database and attaches it to the request.
// Validates campaign exists before proceeding.
// =============================================================================

export function loadCampaign(paramName = "id") {
  return async (req: AuthorizedRequest, _res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params[paramName] as string;
      if (!campaignId) {
        return next(new AppError(400, "Campaign ID is required"));
      }

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          authorId: true,
          status: true,
          mode: true,
          creatorType: true,
          fundraiserId: true,
        },
      });

      if (!campaign) {
        return next(new NotFoundError("Campaign"));
      }

      req.campaign = campaign;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// =============================================================================
// requireCampaignOwnerOrAdmin
// Checks that the authenticated user is the campaign author or an admin.
// Must be used AFTER authenticate and loadCampaign.
// =============================================================================

export function requireCampaignOwnerOrAdmin(
  req: AuthorizedRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return next(new AppError(401, "Authentication required"));
  }

  if (!req.campaign) {
    return next(new NotFoundError("Campaign"));
  }

  const isOwner = req.campaign.authorId === req.userId;
  const isAdmin = req.userRole === "admin";

  if (!isOwner && !isAdmin) {
    return next(new ForbiddenError("You can only manage your own campaigns"));
  }

  next();
}

// =============================================================================
// requireCampaignCollaboratorOrOwnerOrAdmin
// Checks that the authenticated user is a collaborator on the campaign,
// the campaign author, or an admin.
// Must be used AFTER authenticate and loadCampaign.
// =============================================================================

export async function requireCampaignCollaboratorOrOwnerOrAdmin(
  req: AuthorizedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return next(new AppError(401, "Authentication required"));
    }

    if (!req.campaign) {
      return next(new NotFoundError("Campaign"));
    }

    const isAdmin = req.userRole === "admin";
    const isOwner = req.campaign.authorId === req.userId;

    if (isAdmin || isOwner) {
      return next();
    }

    const collaborator = await prisma.campaignCollaborator.findUnique({
      where: {
        campaignId_collaboratorId: {
          campaignId: req.campaign.id,
          collaboratorId: req.userId,
        },
      },
    });

    if (!collaborator) {
      return next(new ForbiddenError("You are not authorized to manage this campaign"));
    }

    next();
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// requireCampaignCreatorEligible
// Verifies that the authenticated user is eligible to create campaigns
// based on ENABLED_CAMPAIGN_CREATOR_TYPES and their userType/role.
// Must be used AFTER authenticate.
// =============================================================================

export async function requireCampaignCreatorEligible(
  req: AuthorizedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return next(new AppError(401, "Authentication required"));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, role: true, userType: true },
    });

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    // Admin can always create
    if (user.userType === "admin" || user.role === "admin") {
      req.userType = user.userType;
      req.user = user;
      return next();
    }

    // Check if the user's userType is in ENABLED_CAMPAIGN_CREATOR_TYPES
    const isEligible = ENABLED_CAMPAIGN_CREATOR_TYPES.includes(user.userType as any);

    if (!isEligible) {
      return next(new ForbiddenError("Your account type is not authorized to create campaigns"));
    }

    req.userType = user.userType;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// Helper: canUserManageCampaign
// Boolean helper for inline checks. Returns true if user can manage the campaign.
// Use this in service functions where middleware is not appropriate.
// =============================================================================

export async function canUserManageCampaign(
  userId: string,
  userRole: string,
  campaignId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { authorId: true },
  });

  if (!campaign) {
    return { allowed: false, reason: "Campaign not found" };
  }

  if (userRole === "admin") {
    return { allowed: true };
  }

  if (campaign.authorId === userId) {
    return { allowed: true };
  }

  const collaborator = await prisma.campaignCollaborator.findUnique({
    where: {
      campaignId_collaboratorId: {
        campaignId,
        collaboratorId: userId,
      },
    },
  });

  if (collaborator) {
    return { allowed: true };
  }

  return { allowed: false, reason: "Not authorized to manage this campaign" };
}

// =============================================================================
// Helper: isUserCampaignCollaborator
// Boolean helper to check if a user is a collaborator on a specific campaign.
// =============================================================================

export async function isUserCampaignCollaborator(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const collaborator = await prisma.campaignCollaborator.findUnique({
    where: {
      campaignId_collaboratorId: {
        campaignId,
        collaboratorId: userId,
      },
    },
  });

  return !!collaborator;
}
