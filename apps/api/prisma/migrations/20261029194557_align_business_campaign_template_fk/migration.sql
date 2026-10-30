-- DropForeignKey
ALTER TABLE "business_campaigns" DROP CONSTRAINT "business_campaigns_templateId_fkey";

-- AddForeignKey
ALTER TABLE "business_campaigns" ADD CONSTRAINT "business_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "campaign_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
