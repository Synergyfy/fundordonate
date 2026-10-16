-- CreateEnum
CREATE TYPE "HubLocationType" AS ENUM ('NATIONAL', 'CITY', 'BOROUGH', 'DISTRICT', 'LOCAL_AREA', 'HIGH_STREET', 'COMMERCIAL_AREA');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "PreferredAudience" AS ENUM ('CONSUMER', 'BUSINESS', 'BOTH');

-- CreateEnum
CREATE TYPE "TemplateOrigin" AS ENUM ('AUDIT', 'DIRECT');

-- CreateEnum
CREATE TYPE "TemplateApprovalMode" AS ENUM ('AUTOMATIC', 'ADMIN_REVIEW');

-- CreateEnum
CREATE TYPE "BusinessCampaignStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('IN_STORE', 'ONLINE', 'FUNDING_SPLIT', 'SELF_FUNDING');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "hub_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "HubLocationType" NOT NULL DEFAULT 'CITY',
    "parentId" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "heroHeadline" TEXT,
    "heroSupportingText" TEXT,
    "postcodePrefix" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hub_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "businessType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "membershipTier" "MembershipTier" NOT NULL DEFAULT 'BRONZE',
    "membershipExpiry" TIMESTAMP(3),
    "preferredAudience" "PreferredAudience" NOT NULL DEFAULT 'BOTH',
    "campaignGoal" TEXT,
    "auditReference" TEXT,
    "preAuditAnswers" JSONB NOT NULL DEFAULT '{}',
    "locationId" TEXT,
    "city" TEXT NOT NULL,
    "localArea" TEXT NOT NULL,
    "highStreet" TEXT NOT NULL,
    "address" TEXT,
    "postcode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "campaignUpdates" BOOLEAN NOT NULL DEFAULT true,
    "leaderboardChanges" BOOLEAN NOT NULL DEFAULT true,
    "rewardsEarned" BOOLEAN NOT NULL DEFAULT true,
    "newBackers" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "seasonId" TEXT,
    "origin" "TemplateOrigin" NOT NULL DEFAULT 'DIRECT',
    "approvalMode" "TemplateApprovalMode" NOT NULL DEFAULT 'ADMIN_REVIEW',
    "minEligibilityTier" "MembershipTier" NOT NULL DEFAULT 'BRONZE',
    "minContributionRequired" BOOLEAN NOT NULL DEFAULT false,
    "minContributionAmount" INTEGER NOT NULL DEFAULT 0,
    "selfFundingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "selfFundingMode" TEXT NOT NULL DEFAULT 'optional',
    "selfFundingAmount" INTEGER NOT NULL DEFAULT 10000,
    "selfFundingRewardName" TEXT,
    "fieldsConfig" JSONB NOT NULL DEFAULT '[]',
    "rewardsConfig" JSONB NOT NULL DEFAULT '[]',
    "mcomAssetsConfig" JSONB NOT NULL DEFAULT '[]',
    "requirementsConfig" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_campaigns" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BusinessCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "targetAmount" INTEGER NOT NULL,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "businessContribution" INTEGER NOT NULL DEFAULT 0,
    "rewardTriggered" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "backerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_field_answers" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'business_input',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_field_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_requested_changes" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_requested_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "backerId" TEXT,
    "type" "ContributionType" NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "gateway" TEXT,
    "paymentIntentId" TEXT,
    "mcomChargeId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_earned_rewards" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_earned_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hub_locations_slug_key" ON "hub_locations"("slug");

-- CreateIndex
CREATE INDEX "hub_locations_parentId_idx" ON "hub_locations"("parentId");

-- CreateIndex
CREATE INDEX "hub_locations_type_idx" ON "hub_locations"("type");

-- CreateIndex
CREATE INDEX "hub_locations_slug_idx" ON "hub_locations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_ownerId_idx" ON "businesses"("ownerId");

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE INDEX "businesses_city_localArea_highStreet_idx" ON "businesses"("city", "localArea", "highStreet");

-- CreateIndex
CREATE INDEX "businesses_membershipTier_idx" ON "businesses"("membershipTier");

-- CreateIndex
CREATE INDEX "businesses_locationId_idx" ON "businesses"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_businessId_key" ON "business_settings"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_templates_slug_key" ON "campaign_templates"("slug");

-- CreateIndex
CREATE INDEX "campaign_templates_isActive_seasonId_idx" ON "campaign_templates"("isActive", "seasonId");

-- CreateIndex
CREATE INDEX "business_campaigns_businessId_status_idx" ON "business_campaigns"("businessId", "status");

-- CreateIndex
CREATE INDEX "business_campaigns_templateId_idx" ON "business_campaigns"("templateId");

-- CreateIndex
CREATE INDEX "business_campaigns_status_endDate_idx" ON "business_campaigns"("status", "endDate");

-- CreateIndex
CREATE INDEX "campaign_field_answers_campaignId_idx" ON "campaign_field_answers"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_field_answers_campaignId_fieldId_key" ON "campaign_field_answers"("campaignId", "fieldId");

-- CreateIndex
CREATE INDEX "campaign_requested_changes_campaignId_resolved_idx" ON "campaign_requested_changes"("campaignId", "resolved");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_reference_key" ON "contributions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_mcomChargeId_key" ON "contributions"("mcomChargeId");

-- CreateIndex
CREATE INDEX "contributions_businessId_createdAt_idx" ON "contributions"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "contributions_campaignId_status_idx" ON "contributions"("campaignId", "status");

-- CreateIndex
CREATE INDEX "contributions_type_idx" ON "contributions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "reward_definitions_code_key" ON "reward_definitions"("code");

-- CreateIndex
CREATE INDEX "business_earned_rewards_businessId_idx" ON "business_earned_rewards"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "business_earned_rewards_businessId_rewardId_key" ON "business_earned_rewards"("businessId", "rewardId");

-- AddForeignKey
ALTER TABLE "hub_locations" ADD CONSTRAINT "hub_locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "hub_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "hub_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_campaigns" ADD CONSTRAINT "business_campaigns_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_campaigns" ADD CONSTRAINT "business_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "campaign_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_field_answers" ADD CONSTRAINT "campaign_field_answers_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_requested_changes" ADD CONSTRAINT "campaign_requested_changes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_earned_rewards" ADD CONSTRAINT "business_earned_rewards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_earned_rewards" ADD CONSTRAINT "business_earned_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "reward_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
