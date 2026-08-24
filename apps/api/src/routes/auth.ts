import { Router } from "express";
import * as authService from "../services/auth.service";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from "../validations";

const authRouter = Router();

// =============================================================================
// Public Routes (with stricter rate limiting)
// =============================================================================

authRouter.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post("/logout", async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  "/forgot-password",
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      await authService.requestPasswordReset(req.body.email);
      res.json({
        status: "success",
        message: "If an account exists with this email, you'll receive a password reset link",
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/reset-password",
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  async (req, res, next) => {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json({
        status: "success",
        message: "Password reset successfully. Please log in with your new password.",
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  async (req, res, next) => {
    try {
      await authService.verifyEmail(req.body.token);
      res.json({ status: "success", message: "Email verified successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Authenticated Routes
// =============================================================================

authRouter.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.userId!);
    res.json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/resend-verification", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await authService.resendVerificationEmail(req.userId!);
    res.json({ status: "success", message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.userId!, currentPassword, newPassword);
      res.json({ status: "success", message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post("/logout-all", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await authService.logoutAll(req.userId!);
    res.json({ status: "success", message: "Logged out from all devices" });
  } catch (error) {
    next(error);
  }
});

export { authRouter };
