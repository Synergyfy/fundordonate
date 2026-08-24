import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
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
