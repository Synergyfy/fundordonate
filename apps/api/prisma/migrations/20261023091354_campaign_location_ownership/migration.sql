-- CreateEnum
CREATE TYPE "CampaignLocationScope" AS ENUM ('PRIMARY', 'SECONDARY', 'INCLUDED');

-- CreateTable
CREATE TABLE "campaign_locations" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "scope" "CampaignLocationScope" NOT NULL DEFAULT 'INCLUDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_locations_campaignId_scope_idx" ON "campaign_locations"("campaignId", "scope");

-- CreateIndex
CREATE INDEX "campaign_locations_locationId_scope_idx" ON "campaign_locations"("locationId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_locations_campaignId_locationId_key" ON "campaign_locations"("campaignId", "locationId");

-- AddForeignKey
ALTER TABLE "campaign_locations" ADD CONSTRAINT "campaign_locations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_locations" ADD CONSTRAINT "campaign_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "hub_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill PRIMARY attribution from each business's current HubLocation.
INSERT INTO "campaign_locations" ("id", "campaignId", "locationId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), c."id", b."locationId", 'PRIMARY', NOW(), NOW()
FROM "business_campaigns" c
JOIN "businesses" b ON b."id" = c."businessId"
WHERE b."locationId" IS NOT NULL
ON CONFLICT ("campaignId", "locationId") DO NOTHING;
