-- Phase 2: business-owned MCOM Rewards attached to a business campaign.
-- Coexists with template-level rewards (`campaign_templates.rewardsConfig`).
-- Additive only.

-- 1. Template gate: may a claiming business attach its own MCOM rewards?
ALTER TABLE "campaign_templates"
    ADD COLUMN "businessRewardsMode" TEXT NOT NULL DEFAULT 'disabled';

-- 2. Issuance mirror: distinguish business-owned issuances.
ALTER TABLE "reward_issuances"
    ADD COLUMN "businessRewardId" TEXT;
CREATE INDEX "reward_issuances_businessRewardId_idx" ON "reward_issuances"("businessRewardId");

-- 3. Campaign-level attachments of a business's own rewards.
CREATE TABLE "campaign_reward_attachments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "businessRewardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "rewardType" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "qualificationMode" TEXT NOT NULL DEFAULT 'independent',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxQuantity" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_reward_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaign_reward_attachments_campaignId_businessRewardId_key"
    ON "campaign_reward_attachments"("campaignId", "businessRewardId");
CREATE INDEX "campaign_reward_attachments_campaignId_idx"
    ON "campaign_reward_attachments"("campaignId");

ALTER TABLE "campaign_reward_attachments"
    ADD CONSTRAINT "campaign_reward_attachments_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "business_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
