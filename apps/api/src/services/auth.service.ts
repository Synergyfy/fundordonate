import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { generateToken, getTokenExpiry } from "../lib/tokens";
import { AUTH_CONFIG, APP_URL } from "../lib/config";
import {
  sendEmail,
  buildPasswordResetEmail,
  buildVerificationEmail,
} from "../lib/email";

// =============================================================================
// Types
// =============================================================================

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserPayload {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  userType: string;
  businessId?: string | null;
  emailVerified: boolean;
}

// =============================================================================
// Token Generation
// =============================================================================

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY as any });
}

function generateRefreshToken(): string {
  const array = new Uint8Array(40);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: getTokenExpiry(AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_HOURS),
    },
  });
}

async function createAuthTokens(userId: string, role: string): Promise<AuthTokens> {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(userId, refreshToken);
  return { accessToken, refreshToken };
}

function sanitizeUser(user: { password: string; id: string; email: string; username: string; firstName?: string | null; lastName?: string | null; avatar?: string | null; role: string; userType: string; businessId?: string | null; emailVerified: boolean; createdAt: Date; updatedAt: Date }): UserPayload {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    role: user.role,
    userType: user.userType,
    businessId: user.businessId,
    emailVerified: user.emailVerified,
  };
}

// =============================================================================
// Register
// =============================================================================

export async function register(data: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userType?: "donor" | "fundraiser";
}): Promise<{ user: UserPayload; tokens: AuthTokens }> {
  const { email, username, password, firstName, lastName, userType } = data;

  if (!email || !username || !password) {
    throw new AppError(400, "Email, username, and password are required");
  }

  if (password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters");
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError(409, "An account with this email already exists");
    }
    throw new AppError(409, "This username is already taken");
  }

  const hashedPassword = await bcrypt.hash(password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
  const role = userType === "fundraiser" ? "fundraiser" : "donor";
  const accountType = userType === "fundraiser" ? "business" : "consumer";

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      userType: accountType,
    },
  });

  const tokens = await createAuthTokens(user.id, user.role);

  // Send verification email
  const verificationToken = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      token: verificationToken,
      userId: user.id,
      expiresAt: getTokenExpiry(24),
    },
  });

  const appUrl = APP_URL;
  const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: user.email,
    ...buildVerificationEmail(verificationUrl),
  });

  return { user: sanitizeUser(user as never), tokens };
}

// =============================================================================
// Login
// =============================================================================

export async function login(
  email: string,
  password: string
): Promise<{ user: UserPayload; tokens: AuthTokens }> {
  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const tokens = await createAuthTokens(user.id, user.role);

  return { user: sanitizeUser(user as never), tokens };
}

// =============================================================================
// Refresh Token
// =============================================================================

export async function refreshTokens(
  refreshToken: string
): Promise<{ user: UserPayload; tokens: AuthTokens }> {
  if (!refreshToken) {
    throw new AppError(401, "Refresh token required");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, "Invalid refresh token");
  }

  if (storedToken.used) {
    // Token reuse detected - invalidate all user tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: storedToken.userId },
    });
    throw new AppError(401, "Token has been compromised. Please log in again.");
  }

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError(401, "Refresh token expired. Please log in again.");
  }

  // Mark current token as used
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { used: true },
  });

  // Generate new tokens
  const tokens = await createAuthTokens(storedToken.userId, storedToken.user.role);

  return { user: sanitizeUser(storedToken.user as never), tokens };
}

// =============================================================================
// Logout
// =============================================================================

export async function logout(refreshToken: string): Promise<void> {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// =============================================================================
// Password Reset
// =============================================================================

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal whether user exists
    return;
  }

  // Invalidate any existing reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const resetToken = generateToken();

  await prisma.passwordResetToken.create({
    data: {
      token: resetToken,
      userId: user.id,
      expiresAt: getTokenExpiry(1), // 1 hour
    },
  });

  const appUrl = APP_URL;
  const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    ...buildPasswordResetEmail(resetUrl),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  if (!token || !newPassword) {
    throw new AppError(400, "Token and new password are required");
  }

  if (newPassword.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters");
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    throw new AppError(400, "Invalid reset token");
  }

  if (resetToken.used) {
    throw new AppError(400, "Reset token has already been used");
  }

  if (new Date() > resetToken.expiresAt) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new AppError(400, "Reset token has expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
    // Invalidate all refresh tokens on password change
    prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);
}

// =============================================================================
// Email Verification
// =============================================================================

export async function verifyEmail(token: string): Promise<void> {
  if (!token) {
    throw new AppError(400, "Verification token required");
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    throw new AppError(400, "Invalid verification token");
  }

  if (verificationToken.used) {
    throw new AppError(400, "Email already verified");
  }

  if (new Date() > verificationToken.expiresAt) {
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
    throw new AppError(400, "Verification token has expired");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    }),
  ]);
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.emailVerified) {
    throw new AppError(400, "Email already verified");
  }

  // Invalidate existing tokens
  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const verificationToken = generateToken();

  await prisma.emailVerificationToken.create({
    data: {
      token: verificationToken,
      userId: user.id,
      expiresAt: getTokenExpiry(24),
    },
  });

  const appUrl = APP_URL;
  const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: user.email,
    ...buildVerificationEmail(verificationUrl),
  });
}

// =============================================================================
// Central Hub Identity Resolution
// =============================================================================
// After Central Hub authenticates a user, resolve or create the FundOrDonate identity.
// This is the boundary between Central Hub auth and FundOrDonate identity.

export interface CentralHubIdentityResult {
  user: UserPayload;
  tokens: AuthTokens;
  isNewUser: boolean;
}

export async function resolveCentralHubIdentity(centralHubUser: {
  externalId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessId?: string;
  businessName?: string;
}): Promise<CentralHubIdentityResult> {
  // Step 1: Find existing ExternalReference for this Central Hub user
  const existingRef = await prisma.externalReference.findUnique({
    where: {
      provider_entityType_externalId: {
        provider: "central_hub",
        entityType: "user",
        externalId: centralHubUser.externalId,
      },
    },
  });

  // Step 2: If linked, return existing user
  if (existingRef) {
    const user = await prisma.user.findUnique({ where: { id: existingRef.entityId } });
    if (user) {
      const tokens = await createAuthTokens(user.id, user.role);
      return { user: sanitizeUser(user as never), tokens, isNewUser: false };
    }
    // External reference points to deleted user — fall through to create
  }

  // Step 3: Check if a user with this email already exists (local account)
  const existingUser = await prisma.user.findUnique({ where: { email: centralHubUser.email } });

  if (existingUser) {
    // Link existing local account to Central Hub
    const { createExternalReference } = await import("../integrations/reference-store");
    await createExternalReference({
      provider: "central_hub",
      entityType: "user",
      entityId: existingUser.id,
      externalId: centralHubUser.externalId,
      externalData: {
        email: centralHubUser.email,
        firstName: centralHubUser.firstName,
        lastName: centralHubUser.lastName,
        businessId: centralHubUser.businessId,
        businessName: centralHubUser.businessName,
      },
      status: "active",
    });

    const tokens = await createAuthTokens(existingUser.id, existingUser.role);
    return { user: sanitizeUser(existingUser as never), tokens, isNewUser: false };
  }

  // Step 4: Create new FundOrDonate user from Central Hub identity
  const username = centralHubUser.email.split("@")[0] + "_" + Date.now().toString(36);
  const accountType = centralHubUser.businessId ? "business" : "consumer";
  const role = "donor"; // Default capability for new Central Hub users

  const newUser = await prisma.user.create({
    data: {
      email: centralHubUser.email,
      username,
      password: await bcrypt.hash(crypto.randomUUID(), AUTH_CONFIG.BCRYPT_SALT_ROUNDS),
      firstName: centralHubUser.firstName,
      lastName: centralHubUser.lastName,
      role,
      userType: accountType,
      businessId: centralHubUser.businessId || null,
      emailVerified: true, // Central Hub verified the email
    },
  });

  // Link the new user to Central Hub
  const { createExternalReference } = await import("../integrations/reference-store");
  await createExternalReference({
    provider: "central_hub",
    entityType: "user",
    entityId: newUser.id,
    externalId: centralHubUser.externalId,
    externalData: {
      email: centralHubUser.email,
      firstName: centralHubUser.firstName,
      lastName: centralHubUser.lastName,
      businessId: centralHubUser.businessId,
      businessName: centralHubUser.businessName,
    },
    status: "active",
  });

  const tokens = await createAuthTokens(newUser.id, newUser.role);
  return { user: sanitizeUser(newUser as never), tokens, isNewUser: true };
}

// =============================================================================
// Get Current User
// =============================================================================
// Get Current User
// =============================================================================

export async function getCurrentUser(userId: string): Promise<UserPayload> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user as never);
}

// =============================================================================
// Change Password
// =============================================================================

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
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

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    // Invalidate all other refresh tokens
    prisma.refreshToken.deleteMany({
      where: { userId, NOT: {} },
    }),
  ]);
}
