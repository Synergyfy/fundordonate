// =============================================================================
// FundOrDonate — Frontend Configuration
// Centralizes all Vite environment variables and frontend configuration.
// =============================================================================

// =============================================================================
// Environment Variables
// =============================================================================

const env = import.meta.env;

export const CONFIG = {
  API_URL: env.VITE_API_URL || "http://localhost:3001/api/v1",
  APP_NAME: env.VITE_APP_NAME || "FundOrDonate",
  APP_URL: env.VITE_APP_URL || window.location.origin,
  DEMO_MODE: env.VITE_DEMO_MODE === "true",
  NODE_ENV: env.MODE || "development",
} as const;

// =============================================================================
// Feature Flags (frontend-visible)
// Inlined due to known Vite/Rollup resolution issue with @fundordonate/types.
// Mirrors shared constants from packages/types/src/constants.ts.
// =============================================================================

export const FEATURES = {
  BUSINESS_CAMPAIGN_CREATION: false,
  CONSUMER_CAMPAIGN_CREATION: false,
  FUNDRAISER_CAMPAIGN_CREATION: false,
  MEMBERSHIP_PURCHASE: false,
  CENTRAL_HUB_ENABLED: false,
  VCARD_ENABLED: false,
  TERMINAL_ENABLED: false,
  QR_SHARE_ENABLED: true,
  OFFLINE_PAYMENT_ENABLED: true,
  STRIPE_ENABLED: false,
  PAYPAL_ENABLED: false,
  DEMO_MODE_ENABLED: CONFIG.DEMO_MODE || CONFIG.NODE_ENV === "development",
} as const;

// =============================================================================
// API Client Configuration
// =============================================================================

export const API_CONFIG = {
  BASE_URL: CONFIG.API_URL,
  TIMEOUT: parseInt(env.VITE_API_TIMEOUT || "30000", 10),
  RETRY_COUNT: parseInt(env.VITE_API_RETRY || "3", 10),
} as const;

// =============================================================================
// Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "fd_access_token",
  REFRESH_TOKEN: "fd_refresh_token",
  DEMO_MODE: "fd_demo_mode",
  DEMO_ROLE: "fd_demo_role",
  THEME: "fd_theme",
} as const;

// =============================================================================
// Pagination Defaults (frontend)
// =============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  CAMPAIGN_GRID_LIMIT: 12,
  FEATURED_LIMIT: 6,
  SEARCH_LIMIT: 10,
} as const;

// =============================================================================
// Campaign Display Constants
// =============================================================================

export const CAMPAIGN_DISPLAY = {
  CARD_IMAGE_ASPECT: "aspect-video",
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_PREVIEW: 200,
  PROGRESS_BAR_HEIGHT: "h-2",
  PROGRESS_BAR_HEIGHT_DETAIL: "h-3",
} as const;

// =============================================================================
// Form Constants
// =============================================================================

export const FORM_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  DEBOUNCE_MS: 300,
} as const;

// =============================================================================
// Central Hub (MCOM SSO) Configuration
// =============================================================================

export const CENTRAL_HUB_CONFIG = {
  CALLBACK_PATH: "/auth/central-hub/callback",
  STORAGE_KEY: "fd_central_hub_state",
} as const;
