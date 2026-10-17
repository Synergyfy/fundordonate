// =============================================================================
// 247GBS Audit — shared types for the FundOrDonate web app.
// Pre-audit/audit data is owned by 247GBS Audit; FundOrDonate reads its local
// snapshot via /business/me/audit*.
// =============================================================================

export type AuditLinkStatus =
  | "NOT_LINKED"
  | "NO_PRE_AUDIT"
  | "CONSENT_REQUIRED"
  | "AVAILABLE"
  | "ERROR";

export interface AuditDeepLinks {
  /** 247GBS Audit pre-audit entry point. */
  preAudit: string;
  /** 247GBS Audit sign-in (MCOM SSO) entry point. */
  signIn: string;
}

export interface AuditDiagnosticSummary {
  funding: {
    fundingNeedFormatted: string | null;
    ownContributionFormatted: string | null;
    otherContributionFormatted: string | null;
    fundingGapFormatted: string | null;
    status: "fully_funded" | "gap_identified" | "not_specified";
    timing: string | null;
    season: string | null;
  };
  operations: {
    excessStockLevel: string | null;
    spareCapacityLevel: string | null;
    spareCapacityType: string[];
  };
  business: {
    category: string | null;
    location: string | null;
    operatingStatus: string | null;
    identifiedNeeds: string[];
  };
  readiness: {
    level: "immediate" | "preparation_needed" | "blocked" | "not_specified";
    label: string;
    details: string[];
  };
  recommendation: {
    auditType: "SHORT_FORM" | "LONG_FORM";
    title: string;
    rationale: string;
    keyTakeaway: string;
  };
}

export interface AuditMetrics {
  capacityDrainPct: number;
  totalStockImpact: number;
  annualRecovery: number;
  impactScore: number;
}

export interface AuditSession {
  id: string;
  status: string;
  auditType: string | null;
  scopes: string[];
  sectorId: string | null;
  groupId: string | null;
  businessTypeId: string | null;
  preAuditSessionId: string | null;
  calculatedMetrics: AuditMetrics | null;
  aiInsight: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditStatus {
  linkStatus: AuditLinkStatus;
  linked: boolean;
  hasPreAudit: boolean;
  hasConsent: boolean;
  preAuditId: string | null;
  recommendedAuditType: string | null;
  destinationType: string | null;
  destinationTarget: string | null;
  consentVersion: string | null;
  preAuditCompletedAt: string | null;
  diagnostic: AuditDiagnosticSummary | null;
  auditCount: number;
  latestAudit: AuditSession | null;
  syncedAt: string | null;
  stale: boolean;
  lastError: string | null;
  deepLinks: AuditDeepLinks | null;
}
