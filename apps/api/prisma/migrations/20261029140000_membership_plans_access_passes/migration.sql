-- Admin-authored membership plans, access passes and capability-based gating.

-- AlterTable: subscriptions — effective capability snapshot.
ALTER TABLE "subscriptions"
  ADD COLUMN "capabilities" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "entitlementKind" TEXT;

-- AlterTable: campaign_templates — premium template gating.
ALTER TABLE "campaign_templates"
  ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requiredFeature" TEXT;

-- CreateEnum
CREATE TYPE "PlanAccessLevel" AS ENUM ('STANDARD', 'PRO', 'PRO_PLUS');
CREATE TYPE "PlanAudience" AS ENUM ('BUSINESS', 'CONSUMER', 'BOTH');
CREATE TYPE "PlanOrderKind" AS ENUM ('MEMBERSHIP', 'ACCESS_PASS');
CREATE TYPE "PlanOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PlanEntitlementKind" AS ENUM ('MEMBERSHIP', 'ACCESS_PASS');
CREATE TYPE "PlanEntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'FORFEITED', 'CANCELLED');
CREATE TYPE "AccessPassCodeStatus" AS ENUM ('AVAILABLE', 'ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

-- CreateTable: plan_features
CREATE TABLE "plan_features" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "defaultEnabled" BOOLEAN NOT NULL DEFAULT false,
  "supportsLimit" BOOLEAN NOT NULL DEFAULT false,
  "defaultLimit" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plan_features_key_key" ON "plan_features"("key");
CREATE INDEX "plan_features_category_idx" ON "plan_features"("category");
CREATE INDEX "plan_features_isActive_idx" ON "plan_features"("isActive");

-- CreateTable: membership_plans
CREATE TABLE "membership_plans" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "audience" "PlanAudience" NOT NULL DEFAULT 'BOTH',
  "badge" TEXT,
  "color" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "membership_plans_slug_key" ON "membership_plans"("slug");
CREATE INDEX "membership_plans_isActive_sortOrder_idx" ON "membership_plans"("isActive", "sortOrder");

-- CreateTable: membership_plan_variants
CREATE TABLE "membership_plan_variants" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "accessLevel" "PlanAccessLevel" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "durationDays" INTEGER NOT NULL,
  "priceMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "capabilities" JSONB NOT NULL DEFAULT '{}',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "membership_plan_variants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "membership_plan_variants_planId_accessLevel_key" ON "membership_plan_variants"("planId", "accessLevel");
CREATE INDEX "membership_plan_variants_isActive_idx" ON "membership_plan_variants"("isActive");

-- CreateTable: access_passes
CREATE TABLE "access_passes" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "durationDays" INTEGER NOT NULL,
  "priceMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "capabilities" JSONB NOT NULL DEFAULT '{}',
  "codeValidityDays" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_passes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "access_passes_slug_key" ON "access_passes"("slug");
CREATE INDEX "access_passes_isActive_sortOrder_idx" ON "access_passes"("isActive", "sortOrder");

-- CreateTable: access_pass_codes
CREATE TABLE "access_pass_codes" (
  "id" TEXT NOT NULL,
  "accessPassId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" "AccessPassCodeStatus" NOT NULL DEFAULT 'AVAILABLE',
  "ownerId" TEXT,
  "orderId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "entitlementExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_pass_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "access_pass_codes_code_key" ON "access_pass_codes"("code");
CREATE UNIQUE INDEX "access_pass_codes_orderId_key" ON "access_pass_codes"("orderId");
CREATE INDEX "access_pass_codes_ownerId_status_idx" ON "access_pass_codes"("ownerId", "status");
CREATE INDEX "access_pass_codes_accessPassId_idx" ON "access_pass_codes"("accessPassId");
CREATE INDEX "access_pass_codes_status_expiresAt_idx" ON "access_pass_codes"("status", "expiresAt");

-- CreateTable: plan_orders
CREATE TABLE "plan_orders" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "PlanOrderKind" NOT NULL,
  "status" "PlanOrderStatus" NOT NULL DEFAULT 'PENDING',
  "planVariantId" TEXT,
  "accessPassId" TEXT,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "reference" TEXT NOT NULL,
  "mcomChargeId" TEXT,
  "paymentMethod" TEXT,
  "activationMode" TEXT NOT NULL DEFAULT 'immediate',
  "activatedAt" TIMESTAMP(3),
  "entitlementExpiresAt" TIMESTAMP(3),
  "accessPassCodeId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plan_orders_reference_key" ON "plan_orders"("reference");
CREATE UNIQUE INDEX "plan_orders_mcomChargeId_key" ON "plan_orders"("mcomChargeId");
CREATE INDEX "plan_orders_userId_createdAt_idx" ON "plan_orders"("userId", "createdAt" DESC);
CREATE INDEX "plan_orders_status_idx" ON "plan_orders"("status");
CREATE INDEX "plan_orders_kind_idx" ON "plan_orders"("kind");

-- CreateTable: user_entitlements
CREATE TABLE "user_entitlements" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "PlanEntitlementKind" NOT NULL,
  "status" "PlanEntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "planVariantId" TEXT,
  "accessPassId" TEXT,
  "orderId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'purchase',
  "planName" TEXT,
  "accessLevel" TEXT,
  "capabilities" JSONB NOT NULL DEFAULT '{}',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "forfeitedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_entitlements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "user_entitlements_userId_status_expiresAt_idx" ON "user_entitlements"("userId", "status", "expiresAt");
CREATE INDEX "user_entitlements_kind_idx" ON "user_entitlements"("kind");

-- AddForeignKey
ALTER TABLE "membership_plan_variants" ADD CONSTRAINT "membership_plan_variants_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_pass_codes" ADD CONSTRAINT "access_pass_codes_accessPassId_fkey" FOREIGN KEY ("accessPassId") REFERENCES "access_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_orders" ADD CONSTRAINT "plan_orders_planVariantId_fkey" FOREIGN KEY ("planVariantId") REFERENCES "membership_plan_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_orders" ADD CONSTRAINT "plan_orders_accessPassId_fkey" FOREIGN KEY ("accessPassId") REFERENCES "access_passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_planVariantId_fkey" FOREIGN KEY ("planVariantId") REFERENCES "membership_plan_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_accessPassId_fkey" FOREIGN KEY ("accessPassId") REFERENCES "access_passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the capability catalogue.
INSERT INTO "plan_features" ("id", "key", "name", "description", "category", "sortOrder", "defaultEnabled", "supportsLimit", "defaultLimit", "isActive", "updatedAt") VALUES
  (gen_random_uuid(), 'campaign.creation',       'Campaign creation',          'Claim a template and launch a campaign.',                                        'campaigns',    10, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'campaign.active_slots',   'Active campaign slots',      'How many campaigns a business can run at once.',                                'campaigns',    20, true,  true,  1,    true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'templates.premium',       'Premium templates',          'Access exclusive, higher-tier campaign templates.',                             'campaigns',    30, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'campaign.setup_tools',    'Campaign setup tools',       'Guided setup, editable fields and resubmission.',                               'campaigns',    40, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'rewards.attach',          'Attach rewards',             'Add reward-library rewards to campaigns.',                                     'rewards',      50, true,  true,  3,    true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'rewards.premium_library', 'Premium reward library',     'Access exclusive, high-value rewards.',                                        'rewards',      60, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'campaign.self_funding',   'Self-funding',               'Fund your own campaign from the business account.',                            'campaigns',    70, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'contributions.ledger',    'Contributions ledger',       'See in-store, online, split and self-funded contributions.',                    'contributions',80, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'contributions.filters',   'Contribution filters',       'Filter by channel and view transaction references.',                           'contributions',90, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'leaderboard.city',        'City leaderboard',           'City-level ranking.',                                                         'leaderboards',100, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'leaderboard.local',       'Local-area leaderboard',     'Local-area ranking.',                                                         'leaderboards',110, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'leaderboard.national',    'National leaderboard',       'National ranking.',                                                           'leaderboards',120, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'leaderboard.rank_tracking','Rank tracking',             'Position changes and total contributed versus peers.',                         'leaderboards',130, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'rewards.tracking',        'Rewards tracking',           'Earned rewards, values, codes and expiry.',                                    'rewards',     140, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'rewards.redemption',      'Reward redemption',          'Redeem reward codes.',                                                        'rewards',     150, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'profile.enhanced',        'Enhanced business profile',  'Logo, cover image and a richer public listing.',                               'profile',     160, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'profile.featured',        'Featured listing',           'Promoted placement in the business directory.',                                'profile',     170, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'analytics.insights',      'Performance insights',       'KPI overview, season contribution and rewards earned.',                        'analytics',   180, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'analytics.advanced',      'Advanced analytics',         'Campaign and season performance reports.',                                     'analytics',   190, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'notifications.weekly_digest','Weekly digest',           'Automated performance summary emails.',                                        'notifications',200, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'notifications.alerts',    'Alert preferences',          'Leaderboard shifts, new backers and reward unlocks.',                          'notifications',210, true,  false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'support.priority',        'Priority support',           'Faster, dedicated support channel.',                                          'support',     220, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'team.seats',              'Team seats',                 'Multiple users managing one business.',                                        'team',        230, false, true,  1,    true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'profile.badges',          'Recognition badges',         'Tier badges and founding-member recognition.',                                 'profile',     240, false, false, NULL, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'campaign.promotion',      'Campaign promotion',         'Boost or feature a campaign in discovery.',                                    'campaigns',   250, false, false, NULL, true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
