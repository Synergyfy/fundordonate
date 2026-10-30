-- Cache the full MCOM Central Hub SSO identity locally.
-- Central Hub remains the source of truth: FundOrDonate stores this snapshot
-- for display only and never lets users edit these fields locally.

-- AlterTable: users
ALTER TABLE "users"
  ADD COLUMN "profileType" TEXT,
  ADD COLUMN "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "jobTitle" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "postcode" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "mcomProfile" JSONB;

-- AlterTable: businesses — mirror the Central business profile in full.
ALTER TABLE "businesses"
  ADD COLUMN "mcomBusinessId" TEXT,
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "subCategory" TEXT,
  ADD COLUMN "openingHours" TEXT,
  ADD COLUMN "socialMedia" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "businesses_mcomBusinessId_key" ON "businesses"("mcomBusinessId");
