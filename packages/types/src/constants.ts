// =============================================================================
// FundOrDonate — Shared Domain Constants
// Single source of truth for all domain enums, constants, and validation rules.
// Both backend (apps/api) and frontend (apps/web) consume these.
// =============================================================================

// =============================================================================
// USER DOMAIN
// =============================================================================

/** User account type — separate from role. Determines what kind of entity the user is. */
export const UserType = {
  ADMIN: "admin",
  BUSINESS: "business",
  CONSUMER: "consumer",
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];

/** RBAC role — determines what actions the user can perform. Separate from UserType. */
export const Role = {
  ADMIN: "admin",
  FUNDRAISER: "fundraiser",
  COLLABORATOR: "collaborator",
  BACKER: "backer",
  DONOR: "donor",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// =============================================================================
// PERMISSIONS
// =============================================================================

export const Permission = {
  // Campaign
  CAMPAIGN_CREATE: "campaign:create",
  CAMPAIGN_READ: "campaign:read",
  CAMPAIGN_UPDATE: "campaign:update",
  CAMPAIGN_DELETE: "campaign:delete",
  CAMPAIGN_PUBLISH: "campaign:publish",
  CAMPAIGN_ARCHIVE: "campaign:archive",
  CAMPAIGN_MANAGE_OWN: "campaign:manage_own",
  CAMPAIGN_MANAGE_ASSIGNED: "campaign:manage_assigned",
  CAMPAIGN_SUBMIT: "campaign:submit",
  CAMPAIGN_APPROVE: "campaign:approve",
  CAMPAIGN_REJECT: "campaign:reject",

  // Donation
  DONATION_CREATE: "donation:create",
  DONATION_READ: "donation:read",
  DONATION_MANAGE: "donation:manage",

  // Pledge
  PLEDGE_CREATE: "pledge:create",
  PLEDGE_READ: "pledge:read",
  PLEDGE_MANAGE: "pledge:manage",

  // Comment
  COMMENT_CREATE: "comment:create",
  COMMENT_MODERATE: "comment:moderate",

  // User
  USER_READ: "user:read",
  USER_MANAGE: "user:manage",
  USER_DELETE: "user:delete",

  // Payment
  PAYMENT_PROCESS: "payment:process",
  PAYMENT_REFUND: "payment:refund",

  // Withdrawal
  WITHDRAWAL_REQUEST: "withdrawal:request",
  WITHDRAWAL_APPROVE: "withdrawal:approve",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_MANAGE: "settings:manage",

  // Reports
  REPORTS_VIEW: "reports:view",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

// =============================================================================
// CAMPAIGN DOMAIN
// =============================================================================

/** Campaign fundraising mode */
export const CampaignMode = {
  DONATION: "donation",
  CROWDFUNDING: "crowdfunding",
  FUND: "fund",
  SPONSOR: "sponsor",
} as const;
export type CampaignMode = (typeof CampaignMode)[keyof typeof CampaignMode];

/** Campaign lifecycle status — 12 states with controlled transitions */
export const CampaignStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  PUBLISHED: "published",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  ARCHIVED: "archived",
  REJECTED: "rejected",
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

/** Who created the campaign */
export const CampaignCreatorType = {
  ADMIN: "admin",
  BUSINESS: "business",
  FUNDRAISER: "fundraiser",
  CONSUMER: "consumer",
} as const;
export type CampaignCreatorType = (typeof CampaignCreatorType)[keyof typeof CampaignCreatorType];

// =============================================================================
// FINANCIAL DOMAIN
// =============================================================================

/** Contribution type — distinguishes owner self-funding from external donations */
export const ContributionType = {
  OWNER: "owner",
  EXTERNAL: "external",
} as const;
export type ContributionType = (typeof ContributionType)[keyof typeof ContributionType];

/** Default currency (configurable per campaign/donation) */
export const DEFAULT_CURRENCY = "GBP";

/** All amounts are stored in integer minor units (pence for GBP, cents for USD) */
export const MINOR_UNITS = 100;

// =============================================================================
// REWARD DOMAIN
// =============================================================================

/** Reward types */
export const RewardType = {
  STANDARD: "standard",
  ECARD: "ecard",
  CASHBACK: "cashback",
  POINTS: "points",
  DISCOUNT: "discount",
} as const;
export type RewardType = (typeof RewardType)[keyof typeof RewardType];

// =============================================================================
// MEMBERSHIP DOMAIN
// =============================================================================

/** Membership tier */
export const MembershipTier = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
} as const;
export type MembershipTier = (typeof MembershipTier)[keyof typeof MembershipTier];

/** Membership level */
export const MembershipLevel = {
  STANDARD: "standard",
  PRO: "pro",
  PRO_PLUS: "pro+",
} as const;
export type MembershipLevel = (typeof MembershipLevel)[keyof typeof MembershipLevel];

// =============================================================================
// SELF-FUNDING DOMAIN
// =============================================================================

/** Self-funding campaign levels with default configuration values.
 *  These are admin-configurable defaults, not hardcoded business rules. */
export const SelfFundingLevel = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
} as const;
export type SelfFundingLevel = (typeof SelfFundingLevel)[keyof typeof SelfFundingLevel];

/** Default self-funding configuration (admin-configurable, not permanent business rules). */
export const SELF_FUNDING_DEFAULTS: Record<SelfFundingLevel, { target: number; ownerContribution: number; remaining: number }> = {
  bronze:   { target: 30000,  ownerContribution: 12000, remaining: 18000 },
  silver:   { target: 80000,  ownerContribution: 24000, remaining: 56000 },
  gold:     { target: 195000, ownerContribution: 39000, remaining: 156000 },
  platinum: { target: 300000, ownerContribution: 30000, remaining: 270000 },
} as const;

/** User membership status */
export const MembershipStatus = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

/** Membership plan status */
export const MembershipPlanStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
export type MembershipPlanStatus = (typeof MembershipPlanStatus)[keyof typeof MembershipPlanStatus];

// =============================================================================
// TAXONOMY DOMAIN
// =============================================================================

/** Campaign type status */
export const CampaignTypeStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
export type CampaignTypeStatus = (typeof CampaignTypeStatus)[keyof typeof CampaignTypeStatus];

/** Season status */
export const SeasonStatus = {
  ACTIVE: "active",
  UPCOMING: "upcoming",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export type SeasonStatus = (typeof SeasonStatus)[keyof typeof SeasonStatus];

// =============================================================================
// PAYMENT DOMAIN
// =============================================================================

/** Payment status */
export const PaymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Gateway identifiers */
export const GatewayId = {
  STRIPE: "stripe",
  PAYPAL: "paypal",
  NATIVE: "native",
} as const;
export type GatewayId = (typeof GatewayId)[keyof typeof GatewayId];

// =============================================================================
// WALLET DOMAIN
// =============================================================================

/** Wallet transaction status */
export const WalletTransactionStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REVERSED: "reversed",
} as const;
export type WalletTransactionStatus = (typeof WalletTransactionStatus)[keyof typeof WalletTransactionStatus];

/** Wallet transaction action */
export const WalletTransactionAction = {
  CREDIT: "credit",
  DEBIT: "debit",
  WITHDRAWAL: "withdrawal",
  REFUND: "refund",
  FEE: "fee",
} as const;
export type WalletTransactionAction = (typeof WalletTransactionAction)[keyof typeof WalletTransactionAction];

// =============================================================================
// WITHDRAWAL DOMAIN
// =============================================================================

/** Withdrawal request status */
export const WithdrawalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
} as const;
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

// =============================================================================
// CAMPAIGN STATUS TRANSITIONS
// =============================================================================

/** Valid status transitions — server-side enforcement */
export const VALID_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["pending_review", "rejected", "cancelled"],
  pending_review: ["approved", "rejected"],
  approved: ["published", "cancelled"],
  published: ["active", "paused", "cancelled", "archived"],
  active: ["paused", "completed", "cancelled", "expired"],
  paused: ["active", "cancelled"],
  completed: ["archived"],
  cancelled: ["draft", "archived"],
  expired: ["archived", "draft"],
  archived: ["draft"],
  rejected: ["draft", "cancelled"],
};

/** Which roles can trigger each status transition */
export const STATUS_TRANSITION_ACTORS: Record<CampaignStatus, Role[]> = {
  draft: ["admin", "fundraiser"],
  submitted: ["admin", "fundraiser"],
  pending_review: ["admin"],
  approved: ["admin"],
  published: ["admin"],
  active: ["admin", "fundraiser"],
  paused: ["admin", "fundraiser"],
  completed: ["admin", "fundraiser"],
  cancelled: ["admin", "fundraiser"],
  expired: ["admin"],
  archived: ["admin"],
  rejected: ["admin"],
};

// =============================================================================
// API / PAGINATION
// =============================================================================

/** Default pagination values */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  FEATURED_LIMIT: 6,
} as const;

/** Standard API response shape */
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: string[];
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// AUTH
// =============================================================================

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY_HOURS: 7 * 24,
  BCRYPT_SALT_ROUNDS: 12,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  VERIFICATION_TOKEN_EXPIRY_HOURS: 24,
  RESET_TOKEN_EXPIRY_HOURS: 1,
} as const;

// =============================================================================
// CAMPAIGN CREATOR TYPES (configurable)
// =============================================================================

/** Currently enabled creator types. Admin-only creation is the initial controlled model.
 *  Business/fundraiser/consumer creation can be activated by adding to this list. */
export const ENABLED_CAMPAIGN_CREATOR_TYPES: CampaignCreatorType[] = [
  CampaignCreatorType.ADMIN,
];

// =============================================================================
// FEATURE FLAGS (configurable)
// =============================================================================

/** Feature flags — control which functionality is enabled.
 *  Use environment variables or database config to override. */
export const FEATURE_FLAGS = {
  /** Enable business campaign creation */
  BUSINESS_CAMPAIGN_CREATION: false,
  /** Enable consumer campaign creation */
  CONSUMER_CAMPAIGN_CREATION: false,
  /** Enable fundraiser campaign creation */
  FUNDRAISER_CAMPAIGN_CREATION: false,
  /** Enable membership purchase flow */
  MEMBERSHIP_PURCHASE: false,
  /** Enable MCOM Central Hub integration */
  CENTRAL_HUB_ENABLED: false,
  /** Enable MCOM VCard integration */
  VCARD_ENABLED: false,
  /** Enable MCOM Terminal integration */
  TERMINAL_ENABLED: false,
  /** Enable QR/share tracking */
  QR_SHARE_ENABLED: true,
  /** Enable offline payment */
  OFFLINE_PAYMENT_ENABLED: true,
  /** Enable Stripe payment */
  STRIPE_ENABLED: false,
  /** Enable PayPal payment */
  PAYPAL_ENABLED: false,
  /** Enable demo mode (MUST be false in production) */
  DEMO_MODE_ENABLED: false,
} as const;

// =============================================================================
// INTEGRATION STATUS
// =============================================================================

/** Integration status labels — clearly marks what is real vs mock */
export const IntegrationStatus = {
  REAL: "REAL",
  MOCK: "MOCK",
  ARCHITECTURE_ONLY: "ARCHITECTURE_ONLY",
  REQUIRES_EXTERNAL_API: "REQUIRES_EXTERNAL_API",
} as const;
export type IntegrationStatus = (typeof IntegrationStatus)[keyof typeof IntegrationStatus];
