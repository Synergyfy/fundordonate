// =============================================================================
// FundOrDonate — Backend Configuration
// Centralizes all environment variables and configuration.
// =============================================================================

import { FEATURE_FLAGS, AUTH, DEFAULT_CURRENCY } from "@fundordonate/types";

// =============================================================================
// Server Configuration
// =============================================================================

export const CONFIG = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  API_BASE: process.env.API_BASE || "/api/v1",
} as const;

// =============================================================================
// Authentication Configuration
// =============================================================================

export const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-do-not-use-in-production",
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || AUTH.ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_HOURS: parseInt(process.env.REFRESH_TOKEN_EXPIRY_HOURS || String(AUTH.REFRESH_TOKEN_EXPIRY_HOURS), 10),
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || String(AUTH.BCRYPT_SALT_ROUNDS), 10),
  VERIFICATION_TOKEN_EXPIRY_HOURS: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS || String(AUTH.VERIFICATION_TOKEN_EXPIRY_HOURS), 10),
  RESET_TOKEN_EXPIRY_HOURS: parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || String(AUTH.RESET_TOKEN_EXPIRY_HOURS), 10),
} as const;

// =============================================================================
// Email Configuration
// =============================================================================

export const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST || "localhost",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@fundordonate.com",
  SKIP_SEND: process.env.NODE_ENV === "development" && !process.env.SMTP_USER,
} as const;

// =============================================================================
// Application URL
// =============================================================================

export const APP_URL = process.env.APP_URL || "http://localhost:5173";

// =============================================================================
// Upload Configuration
// =============================================================================

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || String(5 * 1024 * 1024), 10), // 5MB
  ALLOWED_TYPES: (process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp,image/gif").split(","),
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
} as const;

// =============================================================================
// Pagination Defaults
// =============================================================================

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  FEATURED_LIMIT: 6,
} as const;

// =============================================================================
// Currency
// =============================================================================

export const CURRENCY_CONFIG = {
  DEFAULT: DEFAULT_CURRENCY,
  MINOR_UNITS: 100,
} as const;

// =============================================================================
// Feature Flags (from environment)
// =============================================================================

export const FEATURES = {
  ...FEATURE_FLAGS,
  // Override from environment
  STRIPE_ENABLED: process.env.STRIPE_ENABLED === "true",
  PAYPAL_ENABLED: process.env.PAYPAL_ENABLED === "true",
  OFFLINE_PAYMENT_ENABLED: process.env.OFFLINE_PAYMENT_ENABLED !== "false",
  DEMO_MODE_ENABLED: process.env.DEMO_MODE_ENABLED === "true" || (process.env.NODE_ENV === "development" && process.env.DEMO_MODE_ENABLED !== "false"),
  CENTRAL_HUB_ENABLED: process.env.MCOM_CENTRAL_HUB_ENABLED === "true",
  VCARD_ENABLED: process.env.MCOM_VCARD_ENABLED === "true",
  TERMINAL_ENABLED: process.env.MCOM_TERMINAL_ENABLED === "true",
} as const;

// =============================================================================
// MCOM Integration Configuration
// =============================================================================

export const MCOM_CONFIG = {
  CENTRAL_HUB: {
    URL: process.env.MCOM_CENTRAL_HUB_URL || "",
    API_VERSION: process.env.MCOM_CENTRAL_HUB_API_VERSION || "v1",
    CLIENT_ID: process.env.MCOM_CENTRAL_HUB_CLIENT_ID || "",
    CLIENT_SECRET: process.env.MCOM_CENTRAL_HUB_CLIENT_SECRET || "",
    REDIRECT_URI: process.env.MCOM_CENTRAL_HUB_REDIRECT_URI || `${CONFIG.CORS_ORIGIN}/api/v1/integrations/central-hub/callback`,
  },
  VCARD: {
    URL: process.env.MCOM_VCARD_URL || "",
    API_VERSION: process.env.MCOM_VCARD_API_VERSION || "v1",
    API_KEY: process.env.MCOM_VCARD_API_KEY || "",
  },
  TERMINAL: {
    URL: process.env.MCOM_TERMINAL_URL || "",
    API_VERSION: process.env.MCOM_TERMINAL_API_VERSION || "v1",
    MERCHANT_ID: process.env.MCOM_TERMINAL_MERCHANT_ID || "",
    API_KEY: process.env.MCOM_TERMINAL_API_KEY || "",
    WEBHOOK_SECRET: process.env.MCOM_TERMINAL_WEBHOOK_SECRET || "",
  },
} as const;
