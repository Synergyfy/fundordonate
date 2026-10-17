/**
 * Queue names and job payload contracts for the 247GBS Audit subsystem.
 *
 * Kept dependency-free so producers, processors and services can share them
 * without importing each other (which would create DI-time cycles).
 */

/** Queue that drives scheduled and on-demand audit snapshot reconciliation. */
export const AUDIT_RECONCILE_QUEUE = "audit-reconcile";

export interface AuditReconcileJobData {
  /** Reconcile a single business when set. */
  businessId?: string;
  /** Reconcile every business owned by this MCOM user when set. */
  mcomUserId?: string;
}
