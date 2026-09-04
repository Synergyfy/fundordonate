import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { AUTH_CONFIG } from "../lib/config";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userType?: string;
  businessId?: string | null;
  dbUser?: any;
}

interface JwtPayload {
  userId: string;
  role: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, "Token expired"));
    }
    return next(new AppError(401, "Invalid token"));
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) {
      return next(new AppError(401, "Authentication required"));
    }

    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError(403, "You don't have permission to perform this action"));
    }

    next();
  };
}

export function requireOwnership(getOwnerId: (req: AuthRequest) => Promise<string | null>) {
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
        return next(new AppError(403, "You don't have permission to perform this action"));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// =============================================================================
// loadUser
// Loads the full user record from the database and attaches it to the request.
// Use this after authenticate when you need userType, businessId, or other
// server-side identity data that is NOT in the JWT.
// =============================================================================

export function loadUser(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.userId) {
    return next(new AppError(401, "Authentication required"));
  }

  prisma.user
    .findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        userType: true,
        businessId: true,
        emailVerified: true,
      },
    })
    .then((user) => {
      if (!user) {
        return next(new AppError(404, "User not found"));
      }
      req.dbUser = user;
      req.userType = user.userType;
      req.businessId = user.businessId;
      next();
    })
    .catch((error) => {
      next(error);
    });
}
