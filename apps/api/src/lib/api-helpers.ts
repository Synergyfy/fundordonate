// =============================================================================
// FundOrDonate — API Response Helpers
// Standardized response formatting and error handling.
// =============================================================================

import { Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { PAGINATION } from "@fundordonate/types";

// =============================================================================
// Response Builders
// =============================================================================

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    status: "success",
    data,
  });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendError(res: Response, message: string, statusCode = 500, code?: string): void {
  res.status(statusCode).json({
    status: "error",
    message,
    ...(code && { code }),
  });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number
): void {
  res.json({
    status: "success",
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// =============================================================================
// Pagination Parser
// =============================================================================

export function parsePagination(query: {
  page?: string | string[];
  limit?: string | string[];
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(typeof query.page === "string" ? query.page : String(PAGINATION.DEFAULT_PAGE), 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(typeof query.limit === "string" ? query.limit : String(PAGINATION.DEFAULT_LIMIT), 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// =============================================================================
// Error Helpers
// =============================================================================

export function throwNotFound(resource = "Resource"): never {
  throw new AppError(404, `${resource} not found`);
}

export function throwForbidden(message = "Insufficient permissions"): never {
  throw new AppError(403, message);
}

export function throwBadRequest(message: string): never {
  throw new AppError(400, message);
}

export function throwConflict(message: string): never {
  throw new AppError(409, message);
}

export function throwUnauthorized(message = "Authentication required"): never {
  throw new AppError(401, message);
}
