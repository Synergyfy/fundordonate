// =============================================================================
// MCOM Integration Types
// Shared types for all MCOM integration adapters
// =============================================================================

export type IntegrationProvider = "central_hub" | "vcard" | "terminal" | "mcom_rewards" | "mcom_mall";

export type IntegrationEntityType = "user" | "campaign" | "donation" | "reward" | "ecard" | "pledge";

export type IntegrationStatus = "pending" | "active" | "failed" | "revoked" | "cancelled";

// =============================================================================
// External Reference
// =============================================================================

export interface ExternalReferenceData {
  provider: IntegrationProvider;
  entityType: IntegrationEntityType;
  entityId: string;
  externalId: string;
  externalData?: Record<string, unknown>;
  status: IntegrationStatus;
}

// =============================================================================
// Central Hub Types
// =============================================================================

export interface CentralHubConfig {
  baseUrl: string;
  apiVersion: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  enabled: boolean;
}

export interface CentralHubTokenExchange {
  code: string;
  redirectUri: string;
}

export interface CentralHubTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
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

// =============================================================================
// VCard Types
// =============================================================================

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

// =============================================================================
// Terminal Types
// =============================================================================

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

// =============================================================================
// QR / Share Types
// =============================================================================

export interface CampaignShareData {
  campaignId: string;
  shareType: "link" | "qr" | "referral" | "social";
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface QRCodeData {
  url: string;
  campaignSlug: string;
  shareCode: string;
}

export interface ShareUrlData {
  campaignSlug: string;
  shareCode: string;
  baseUrl: string;
}
