-- AlterTable
ALTER TABLE "business_campaigns" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "campaign_posts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_posts_campaignId_createdAt_idx" ON "campaign_posts"("campaignId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "campaign_posts" ADD CONSTRAINT "campaign_posts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_posts" ADD CONSTRAINT "campaign_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
