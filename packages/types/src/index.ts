// =============================================================================
// Domain Constants — single source of truth
// =============================================================================
export * from "./constants";

import type { CampaignMode, CampaignStatus } from "./constants";

// =============================================================================
// Shared Utilities
// =============================================================================
export * from "./utils";

// =============================================================================
// Legacy Type Aliases (backward compatibility)
// These are string literal types used in interfaces below.
// The constants.ts file provides the runtime values.
// =============================================================================

export type UserRole = "admin" | "fundraiser" | "collaborator" | "backer" | "donor";

export type TransactionAction = "credit" | "debit";

export type TransactionType =
  | "earning"
  | "platform_fee"
  | "withdrawal_request"
  | "withdrawal_approval"
  | "withdrawal_rejection";

export type PayoutMethod = "paypal" | "bank" | "others";

export type CommentStatus = "approved" | "pending" | "spam";

export type RewardStatus = "active" | "inactive";

export type FundStatus = "active" | "inactive";

export type TributeType = "in_honor" | "in_memory";

// =============================================================================
// Core Models
// =============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  userType?: string;
  businessId?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignImage {
  id: string;
  url: string;
  alt?: string | null;
  order: number;
  createdAt: Date;
}

export interface CampaignTag {
  id: string;
  campaignId: string;
  tagId: string;
  tag?: Tag;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  goalAmount: number;
  raisedAmount: number;
  campaignTarget?: number | null;
  ownerContribution?: number | null;
  deadline: Date;
  featuredImage?: string | null;
  videoUrl?: string | null;
  mode: CampaignMode;
  status: CampaignStatus;
  creatorType?: string;
  platformFee?: number | null;
  settings?: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: User;
  categoryId?: string | null;
  category?: Category;
  fundId?: string | null;
  fund?: Fund;
  fundraiserId?: string | null;
  shareCode?: string | null;

  // Campaign Hierarchy
  parentId?: string | null;
  parent?: Campaign | null;
  children?: Campaign[];

  // Campaign Context
  location?: string | null;
  isEvergreen?: boolean;

  // Participation Configuration
  participationTypes?: string; // JSON array: ["fund","donate","sponsor"]
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;

  // Self-Funding Configuration
  selfFundingLevel?: string | null;
  isSelfFunding?: boolean;

  // Taxonomy
  campaignTypeId?: string | null;
  campaignType?: CampaignType | null;
  seasonId?: string | null;
  season?: CampaignSeason | null;
  membershipPlanId?: string | null;
  membershipPlan?: MembershipPlan | null;

  // Computed / Joined
  images?: CampaignImage[];
  tags?: CampaignTag[];
  rewards?: Reward[];
  _count?: { donations: number; pledges: number; comments?: number; bookmarks?: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Fund {
  id: string;
  title: string;
  description?: string | null;
  isDefault: boolean;
  status: string;
}

export interface Donation {
  id: string;
  uid: string;
  amount: number;
  recoveryFee: number;
  processingFee: number;
  tributeType?: string | null;
  tributeSalutation?: string | null;
  tributeTo?: string | null;
  tributeNotificationEmail?: string | null;
  tributeNotificationMessage?: string | null;
  notes?: string | null;
  status: string;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
  isAnonymous: boolean;
  isManual: boolean;
  contributionType: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  campaign?: Campaign;
  userId?: string | null;
  user?: User | null;
}

export interface Pledge {
  id: string;
  uid: string;
  amount: number;
  bonusSupportAmount: number;
  shippingCost: number;
  recoveryFee: number;
  processingFee: number;
  pledgeOption?: string | null;
  notes?: string | null;
  status: string;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  isManual: boolean;
  rewardInfo: string;
  userInfo: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  campaign?: Campaign;
  userId?: string | null;
  user?: User;
  rewardId?: string | null;
  reward?: Reward;
}

export interface Reward {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  deliveryDate?: Date | null;
  limit?: number | null;
  status: string;
  order: number;
  rewardType: string;
  statedValue: number;
  benefitValue: number;
  currency: string;
  eligibility: string;
  conversionRule: string;
  createdAt: Date;
  campaignId: string;
  campaign?: Campaign;
  items?: RewardItem[];
}

export interface RewardItem {
  id: string;
  title: string;
  description?: string | null;
  quantity: number;
  order: number;
  rewardId: string;
  downloads?: RewardItemDownload[];
}

export interface RewardItemDownload {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  rewardItemId: string;
}

export interface CampaignPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  authorId: string;
  author?: User;
}

export interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  userId: string;
  user?: User;
  parentId?: string | null;
}

export interface Bookmark {
  id: string;
  createdAt: Date;
  campaignId: string;
  userId: string;
}

export interface Wallet {
  id: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface WalletTransaction {
  id: string;
  uid: string;
  amount: number;
  type: string;
  referenceId?: string | null;
  referenceType?: string | null;
  note?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  walletId: string;
  wallet?: Wallet;
  campaignId?: string | null;
  pledgeId?: string | null;
  donationId?: string | null;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  amount: number;
  status: string;
  note?: string | null;
  method?: string | null;
  attachment?: string | null;
  payoutInfo: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  userId: string;
  user?: User;
  items?: WithdrawalItem[];
}

export interface WithdrawalItem {
  id: string;
  amount: number;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
  withdrawalRequestId: string;
  campaignId: string;
  campaign?: Campaign;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  tier: string;
  level: string;
  description?: string | null;
  price: number;
  duration: number | null;
  status: string;
  order: number;
  entitlements: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMembership {
  id: string;
  status: string;
  startDate: Date;
  endDate?: Date | null;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
  planId: string;
  plan?: MembershipPlan;
}

export interface CampaignType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  // Opportunity Configuration
  isOpportunity?: boolean;
  eligibleTiers?: string; // JSON array
  eligibleLevels?: string; // JSON array
  parentInitiative?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSeason {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignGroup {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignEvent {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalReference {
  id: string;
  provider: string;
  entityType: string;
  entityId: string;
  externalId: string;
  externalData: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignShare {
  id: string;
  code: string;
  shareType: string;
  source?: string | null;
  metadata: string;
  createdAt: Date;
  campaignId: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

export interface EmailVerificationToken {
  id: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// MCOM Integration
// =============================================================================

export interface ShareUrlData {
  campaignSlug: string;
  shareCode: string;
  baseUrl: string;
}

export interface QRCodeData {
  url: string;
  campaignSlug: string;
  shareCode: string;
}

export interface CentralHubConfig {
  baseUrl: string;
  apiVersion: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  enabled: boolean;
}

export interface CentralHubUserInfo {
  externalId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessId?: string;
  businessName?: string;
}

export interface CentralHubAuthResult {
  success: boolean;
  user?: CentralHubUserInfo;
  error?: string;
}

export interface VCardConfig {
  baseUrl: string;
  apiVersion: string;
  apiKey: string;
  enabled: boolean;
}

export interface VCardEcardRequest {
  campaignId: string;
  rewardId: string;
  donorUserId: string;
  statedValue: number;
  benefitValue: number;
  currency: string;
  idempotencyKey: string;
}

export interface VCardEcardResponse {
  success: boolean;
  ecardId?: string;
  status?: string;
  error?: string;
}

export interface VCardEcardStatus {
  ecardId: string;
  status: "pending" | "created" | "active" | "failed" | "revoked" | "cancelled";
  activatedAt?: Date;
  expiresAt?: Date;
}

export interface TerminalConfig {
  baseUrl: string;
  apiVersion: string;
  merchantId: string;
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export interface TerminalPaymentRequest {
  amount: number;
  currency: string;
  campaignId: string;
  contributionType: "owner" | "external";
  description?: string;
  reference?: string;
  idempotencyKey: string;
}

export interface TerminalPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  clientSecret?: string;
  error?: string;
}

export interface TerminalWebhookEvent {
  eventId: string;
  eventType: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: Date;
  signature: string;
  data: Record<string, unknown>;
}

export interface TerminalWebhookResult {
  processed: boolean;
  donationId?: string;
  error?: string;
}
