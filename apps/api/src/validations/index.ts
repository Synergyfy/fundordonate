import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  userType: z.enum(["donor", "fundraiser"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password must be at most 128 characters"),
});

export const campaignCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  goalAmount: z.number().int().positive("Goal must be a positive number"),
  deadline: z.string().datetime().or(z.date()),
  mode: z.enum(["donation", "crowdfunding"]).optional(),
  categoryId: z.string().uuid().optional(),
  fundId: z.string().uuid().optional(),
});

export const campaignUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  goalAmount: z.number().int().positive().optional(),
  deadline: z.string().datetime().or(z.date()).optional(),
  status: z.enum(["draft", "pending_review", "published", "ended", "archived"]).optional(),
  categoryId: z.string().uuid().optional(),
  fundId: z.string().uuid().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});
