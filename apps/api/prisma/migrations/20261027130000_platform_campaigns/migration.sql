-- Platform campaigns (admin-created) live on the same table as business
-- campaigns but are not owned by a business or a template.

-- AlterTable: allow admin-owned campaigns and store their presentation fields.
ALTER TABLE "business_campaigns"
  ALTER COLUMN "businessId" DROP NOT NULL,
  ALTER COLUMN "templateId" DROP NOT NULL,
  ADD COLUMN     "createdById" TEXT,
  ADD COLUMN     "shortDescription" TEXT,
  ADD COLUMN     "mode" TEXT,
  ADD COLUMN     "audience" "PreferredAudience",
  ADD COLUMN     "category" TEXT,
  ADD COLUMN     "imageUrl" TEXT;

-- AlterTable: platform contributions have no owning business.
ALTER TABLE "contributions" ALTER COLUMN "businessId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "business_campaigns_createdById_idx" ON "business_campaigns"("createdById");

-- AddForeignKey
ALTER TABLE "business_campaigns" ADD CONSTRAINT "business_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
