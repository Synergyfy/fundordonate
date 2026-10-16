-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "campaign_templates"
    ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN     "category" TEXT,
    ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'BOTH',
    ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN     "createdById" TEXT,
    ADD COLUMN     "updatedById" TEXT;

-- Backfill status from the legacy boolean so existing templates keep their state.
UPDATE "campaign_templates"
SET "status" = CASE
    WHEN "isActive" THEN 'ACTIVE'::"TemplateStatus"
    ELSE 'INACTIVE'::"TemplateStatus"
END;

-- CreateIndex
CREATE INDEX "campaign_templates_status_seasonId_idx" ON "campaign_templates"("status", "seasonId");
