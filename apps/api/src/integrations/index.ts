// =============================================================================
// MCOM Integrations Index
// Central export point for all integration adapters and services
// =============================================================================

export { centralHubAdapter, centralHubMockAdapter, centralHubProductionAdapter } from "./central-hub";
export { vcardAdapter, vcardMockAdapter, vcardProductionAdapter } from "./vcard";
export { terminalAdapter, terminalMockAdapter, terminalProductionAdapter } from "./terminal";
export { shareService } from "./share";
export {
  createExternalReference,
  getExternalReference,
  getExternalReferenceByExternalId,
  updateExternalReferenceStatus,
  getAllExternalReferences,
  removeExternalReference,
  type IntegrationResult,
} from "./reference-store";

// Re-export types
export type {
  IntegrationProvider,
  IntegrationEntityType,
  IntegrationStatus,
  ExternalReferenceData,
  CentralHubConfig,
  CentralHubTokenExchange,
  CentralHubTokenResponse,
  CentralHubUserInfo,
  CentralHubAuthResult,
  VCardConfig,
  VCardEcardRequest,
  VCardEcardResponse,
  VCardEcardStatus,
  TerminalConfig,
  TerminalPaymentRequest,
  TerminalPaymentResponse,
  TerminalWebhookEvent,
  TerminalWebhookResult,
  CampaignShareData,
  QRCodeData,
  ShareUrlData,
} from "./types";
