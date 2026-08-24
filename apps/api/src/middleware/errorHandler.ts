import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // AppError (operational errors)
  if (err instanceof AppError) {
    logger.warn(`[${err.statusCode}] ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => {
      const path = e.path.join(".");
      return path ? `${path}: ${e.message}` : e.message;
    });

    logger.warn("[400] Validation error", {
      url: req.originalUrl,
      errors: messages,
    });

    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: messages,
    });
  }

  // Multer file upload errors
  if (err.message?.includes("MulterError") || err.name === "MulterError") {
    logger.warn("[400] Upload error", { message: err.message });

    return res.status(400).json({
      status: "error",
      message: "File upload error",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired",
    });
  }

  // Unexpected errors
  logger.error("Unexpected error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  return res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}
