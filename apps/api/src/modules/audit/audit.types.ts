import type { AuditLinkStatus } from "@prisma/client";
import type {
  AuditDiagnosticSummary,
  AuditSummary,
} from "@/mcom/audit-client.service";

/**
 * The 247GBS Audit view a business's snapshot resolves to. This is the single
 * shape every FundOrDonate surface (eligibility, campaign pre-fill, admin, hub)
 * should reason about — it never leaks provider transport details.
 */
export interface AuditStatusView {
  linkStatus: AuditLinkStatus;
  /** The owner has an MCOM identity and a 247GBS Audit account was found. */
  linked: boolean;
  /** A completed, consenting pre-audit is readable. */
  hasPreAudit: boolean;
  /** The user has consented to share (only true when `linkStatus = AVAILABLE`). */
  hasConsent: boolean;
  preAuditId: string | null;
  recommendedAuditType: string | null;
  destinationType: string | null;
  destinationTarget: string | null;
  consentVersion: string | null;
  preAuditCompletedAt: string | null;
  diagnostic: AuditDiagnosticSummary | null;
  /** Whether any audit sessions are mirrored. */
  auditCount: number;
  /** The latest COMPLETED audit's metrics, if any. */
  latestAudit: AuditSummary | null;
  syncedAt: string | null;
  /** The snapshot is older than the configured TTL (or never synced). */
  stale: boolean;
  lastError: string | null;
}
