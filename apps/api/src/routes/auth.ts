import { Router } from "express";
import * as authService from "../services/auth.service";
import { authenticate, type AuthRequest } from "../middleware/auth";

const authRouter = Router();

// =============================================================================
// Public Routes
// =============================================================================

authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName, userType } = req.body;

    const result = await authService.register({
      email,
      username,
      password,
      firstName,
      lastName,
      userType,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshTokens(refreshToken);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      status: "success",
      message: "If an account exists with this email, you'll receive a password reset link",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    res.json({
      status: "success",
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.body;

    await authService.verifyEmail(token);

    res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Authenticated Routes
// =============================================================================

authRouter.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.userId!);

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/resend-verification", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await authService.resendVerificationEmail(req.userId!);

    res.json({
      status: "success",
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/change-password", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.userId!, currentPassword, newPassword);

    res.json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout-all", authenticate, async (req: AuthRequest, res, next) => {
  try {
    await authService.logoutAll(req.userId!);

    res.json({
      status: "success",
      message: "Logged out from all devices",
    });
  } catch (error) {
    next(error);
  }
});

export { authRouter };
