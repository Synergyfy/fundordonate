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
  mode: z.enum(["donation", "crowdfunding", "fund", "sponsor"]).optional(),
  categoryId: z.string().uuid().optional(),
  fundId: z.string().uuid().optional(),
});

export const campaignUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  goalAmount: z.number().int().positive().optional(),
  deadline: z.string().datetime().or(z.date()).optional(),
  categoryId: z.string().uuid().optional(),
  fundId: z.string().uuid().optional(),
  featuredImage: z.string().optional(),
  videoUrl: z.string().optional(),
  platformFee: z.number().int().min(0).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const campaignStatusSchema = z.object({
  status: z.enum([
    "draft", "submitted", "pending_review", "approved", "rejected",
    "published", "active", "paused", "completed", "cancelled", "expired", "archived",
  ]),
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

export const postCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
});

export const postUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
});

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment is required").max(2000),
  parentId: z.string().uuid().optional(),
});

export const commentUpdateSchema = z.object({
  content: z.string().min(1, "Comment is required").max(2000),
});

export const commentModerationSchema = z.object({
  status: z.enum(["approved", "pending", "spam"]),
});

export const donationCreateSchema = z.object({
  amount: z.coerce.number().int().positive("Amount must be positive"),
  notes: z.string().max(1000).optional(),
  isAnonymous: z.boolean().optional(),
  tributeType: z.enum(["in_honor", "in_memory"]).optional(),
  tributeTo: z.string().max(100).optional(),
  tributeNotificationEmail: z.string().email().optional(),
  tributeNotificationMessage: z.string().max(500).optional(),
  paymentMethod: z.string().optional(),
});

export const pledgeCreateSchema = z.object({
  amount: z.coerce.number().int().positive("Amount must be positive"),
  rewardId: z.string().uuid().optional(),
  bonusSupportAmount: z.coerce.number().int().min(0).optional(),
  shippingCost: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.string().optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  order: z.number().int().min(0).optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  order: z.number().int().min(0).optional(),
});

export const tagCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

export const tagUpdateSchema = z.object({
  name: z.string().min(1).max(50),
});
