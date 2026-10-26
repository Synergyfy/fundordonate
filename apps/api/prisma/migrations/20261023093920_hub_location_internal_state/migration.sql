-- CreateEnum
CREATE TYPE "HubLocationInternalState" AS ENUM ('DRAFT', 'PLANNED', 'PREPARING', 'LAUNCHING', 'ACTIVE_OPERATION', 'ARCHIVED');

-- AlterTable
ALTER TABLE "hub_locations" ADD COLUMN     "internalState" "HubLocationInternalState" NOT NULL DEFAULT 'DRAFT';

-- Seed existing lifecycle state from the operational/public status.
UPDATE "hub_locations"
SET "internalState" = CASE
  WHEN "isActive" = false THEN 'ARCHIVED'::"HubLocationInternalState"
  WHEN UPPER("activationStatus") IN ('ACTIVATED', 'ACTIVE') THEN 'ACTIVE_OPERATION'::"HubLocationInternalState"
  WHEN UPPER("activationStatus") IN ('IN_PROGRESS', 'MAKING_PROGRESS') THEN 'LAUNCHING'::"HubLocationInternalState"
  ELSE 'PLANNED'::"HubLocationInternalState"
END;
