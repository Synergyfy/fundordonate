-- Reconciles schema drift: these tables/columns were previously created with
-- `prisma db push` and were never captured in a migration, so the migration
-- history did not reproduce the database. Additive only (no drops) — safe to
-- apply on top of the existing migrations in any environment.

-- CreateEnum
CREATE TYPE "FoundingAudience" AS ENUM ('BUSINESS', 'CONSUMER');

-- CreateEnum
CREATE TYPE "FoundingProgrammeStatus" AS ENUM ('OPEN', 'LIMITED', 'FULLY_ALLOCATED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FoundingMembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "hub_locations" ADD COLUMN     "activationStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "targetAmount" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programmeName" TEXT,
    "referenceCode" TEXT,
    "description" TEXT,
    "publicDescription" TEXT,
    "internalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 90,
    "overallTarget" BIGINT NOT NULL DEFAULT 0,
    "nationalTarget" BIGINT NOT NULL DEFAULT 0,
    "cityTargetDefault" BIGINT NOT NULL DEFAULT 0,
    "localAreaTargetDefault" BIGINT NOT NULL DEFAULT 0,
    "highStreetTargetDefault" BIGINT NOT NULL DEFAULT 0,
    "businessCampaignTargetDefault" BIGINT NOT NULL DEFAULT 0,
    "totalRaised" BIGINT NOT NULL DEFAULT 0,
    "totalContributions" INTEGER NOT NULL DEFAULT 0,
    "activeCampaigns" INTEGER NOT NULL DEFAULT 0,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "activationScope" JSONB NOT NULL DEFAULT '{}',
    "participationConfig" JSONB NOT NULL DEFAULT '{}',
    "engagementConfig" JSONB NOT NULL DEFAULT '{}',
    "spilloverConfig" JSONB NOT NULL DEFAULT '{}',
    "communicationConfig" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'NATIONAL',
    "locationId" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "venue" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "destinationDetails" JSONB NOT NULL DEFAULT '{}',
    "processedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founding_programmes" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "audience" "FoundingAudience" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "FoundingProgrammeStatus" NOT NULL DEFAULT 'OPEN',
    "totalAllocation" INTEGER NOT NULL DEFAULT 0,
    "allocatedCount" INTEGER NOT NULL DEFAULT 0,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "contributionConfig" JSONB NOT NULL DEFAULT '{}',
    "benefitConfig" JSONB NOT NULL DEFAULT '[]',
    "eligibilityConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founding_programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founding_memberships" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "MembershipTier" NOT NULL DEFAULT 'BRONZE',
    "accessLevel" TEXT NOT NULL DEFAULT 'standard',
    "status" "FoundingMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "contributionAmount" BIGINT NOT NULL DEFAULT 0,
    "isMonthly" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founding_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL DEFAULT 'web',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seasons_referenceCode_key" ON "seasons"("referenceCode");

-- CreateIndex
CREATE INDEX "seasons_status_idx" ON "seasons"("status");

-- CreateIndex
CREATE INDEX "seasons_startDate_endDate_idx" ON "seasons"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "platform_events_eventDate_idx" ON "platform_events"("eventDate");

-- CreateIndex
CREATE INDEX "platform_events_scope_locationId_idx" ON "platform_events"("scope", "locationId");

-- CreateIndex
CREATE INDEX "platform_events_isPublished_idx" ON "platform_events"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "platform_settings_category_idx" ON "platform_settings"("category");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "payout_requests_businessId_status_idx" ON "payout_requests"("businessId", "status");

-- CreateIndex
CREATE INDEX "payout_requests_status_createdAt_idx" ON "payout_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "founding_programmes_locationId_idx" ON "founding_programmes"("locationId");

-- CreateIndex
CREATE INDEX "founding_programmes_status_idx" ON "founding_programmes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "founding_programmes_locationId_audience_key" ON "founding_programmes"("locationId", "audience");

-- CreateIndex
CREATE INDEX "founding_memberships_programmeId_idx" ON "founding_memberships"("programmeId");

-- CreateIndex
CREATE INDEX "founding_memberships_userId_idx" ON "founding_memberships"("userId");

-- CreateIndex
CREATE INDEX "founding_memberships_status_idx" ON "founding_memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "founding_memberships_programmeId_userId_key" ON "founding_memberships"("programmeId", "userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_createdAt_idx" ON "support_tickets"("status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "campaign_templates" ADD CONSTRAINT "campaign_templates_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_events" ADD CONSTRAINT "platform_events_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "hub_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founding_programmes" ADD CONSTRAINT "founding_programmes_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "hub_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founding_memberships" ADD CONSTRAINT "founding_memberships_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "founding_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founding_memberships" ADD CONSTRAINT "founding_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

