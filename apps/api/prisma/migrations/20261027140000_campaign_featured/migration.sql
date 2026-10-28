-- Pin admin-created campaigns to the homepage featured carousel.

-- AlterTable
ALTER TABLE "business_campaigns" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "business_campaigns_status_isFeatured_idx" ON "business_campaigns"("status", "isFeatured");
