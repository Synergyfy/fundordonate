-- 247GBS Audit integration: local snapshot of a business owner's pre-audit +
-- audit state, plus a per-audit mirror. Additive only; the legacy
-- `businesses.auditReference` / `businesses.preAuditAnswers` columns are left in
-- place (deprecated) so nothing breaks mid-migration.

-- 1. Link/pre-audit state for a business.
CREATE TYPE "AuditLinkStatus" AS ENUM (
  'NOT_LINKED',
  'NO_PRE_AUDIT',
  'CONSENT_REQUIRED',
  'AVAILABLE',
  'ERROR'
);

ALTER TABLE "businesses"
  ADD COLUMN "auditLinkStatus" "AuditLinkStatus" NOT NULL DEFAULT 'NOT_LINKED',
  ADD COLUMN "auditPreAuditId" TEXT,
  ADD COLUMN "auditRecommendedType" TEXT,
  ADD COLUMN "auditDestinationType" TEXT,
  ADD COLUMN "auditDestinationTarget" TEXT,
  ADD COLUMN "auditConsentVersion" TEXT,
  ADD COLUMN "auditPreAuditCompletedAt" TIMESTAMP(3),
  ADD COLUMN "auditDiagnostic" JSONB,
  ADD COLUMN "auditLinkedAt" TIMESTAMP(3),
  ADD COLUMN "auditSyncedAt" TIMESTAMP(3),
  ADD COLUMN "auditLastError" TEXT;

-- 2. Local mirror of the provider's audit sessions (no raw answers).
CREATE TABLE "audit_session_mirrors" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "auditType" TEXT,
  "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sectorId" TEXT,
  "groupId" TEXT,
  "businessTypeId" TEXT,
  "preAuditSessionId" TEXT,
  "calculatedMetrics" JSONB,
  "aiInsight" JSONB,
  "completedAt" TIMESTAMP(3),
  "providerCreatedAt" TIMESTAMP(3),
  "providerUpdatedAt" TIMESTAMP(3),
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "audit_session_mirrors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "audit_session_mirrors_auditId_key"
  ON "audit_session_mirrors"("auditId");
CREATE INDEX "audit_session_mirrors_businessId_idx"
  ON "audit_session_mirrors"("businessId");
CREATE INDEX "audit_session_mirrors_status_idx"
  ON "audit_session_mirrors"("status");

ALTER TABLE "audit_session_mirrors"
  ADD CONSTRAINT "audit_session_mirrors_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
