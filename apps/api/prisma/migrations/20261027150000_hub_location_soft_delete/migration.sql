-- Soft delete for hub locations.
-- Deleted locations stay in the database (preserving business/campaign history)
-- but are hidden from public and admin listings.

-- AlterTable
ALTER TABLE "hub_locations" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "hub_locations_deletedAt_idx" ON "hub_locations"("deletedAt");
