-- AlterTable
ALTER TABLE "reward_issuances"
  ADD COLUMN     "fulfilmentProvider" TEXT,
  ADD COLUMN     "fulfilmentKind" TEXT,
  ADD COLUMN     "fulfilmentStatus" TEXT,
  ADD COLUMN     "fulfilmentRef" TEXT,
  ADD COLUMN     "fulfilmentCode" TEXT,
  ADD COLUMN     "fulfilmentError" TEXT,
  ADD COLUMN     "centralReference" TEXT,
  ADD COLUMN     "deepLink" TEXT,
  ADD COLUMN     "businessId" TEXT,
  ADD COLUMN     "businessName" TEXT,
  ADD COLUMN     "scope" JSONB,
  ADD COLUMN     "instructions" JSONB,
  ADD COLUMN     "fulfilledAt" TIMESTAMP(3),
  ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "campaign_reward_attachments"
  ADD COLUMN     "fulfilmentProvider" TEXT,
  ADD COLUMN     "fulfilmentKind" TEXT,
  ADD COLUMN     "audience" TEXT,
  ADD COLUMN     "businessId" TEXT,
  ADD COLUMN     "businessName" TEXT;

-- CreateIndex
CREATE INDEX "reward_issuances_fulfilmentStatus_idx" ON "reward_issuances"("fulfilmentStatus");
