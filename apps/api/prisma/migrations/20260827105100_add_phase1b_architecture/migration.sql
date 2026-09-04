-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "entitlements" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    CONSTRAINT "user_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_memberships_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaign_seasons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaign_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaign_group_memberships" (
    "campaignId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("campaignId", "groupId"),
    CONSTRAINT "campaign_group_memberships_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaign_group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "campaign_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaign_collection_memberships" (
    "campaignId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("campaignId", "collectionId"),
    CONSTRAINT "campaign_collection_memberships_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaign_collection_memberships_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "campaign_collections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "campaign_event_memberships" (
    "campaignId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("campaignId", "eventId"),
    CONSTRAINT "campaign_event_memberships_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaign_event_memberships_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "campaign_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "permalink" TEXT,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "goalAmount" INTEGER NOT NULL,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "mode" TEXT NOT NULL DEFAULT 'donation',
    "featuredImage" TEXT,
    "videoUrl" TEXT,
    "platformFee" INTEGER,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "creatorType" TEXT NOT NULL DEFAULT 'admin',
    "ownerContribution" INTEGER NOT NULL DEFAULT 0,
    "campaignTarget" INTEGER NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "publishedById" TEXT,
    "approvedAt" DATETIME,
    "publishedAt" DATETIME,
    "submittedAt" DATETIME,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "campaignTypeId" TEXT,
    "seasonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    "fundraiserId" TEXT,
    "categoryId" TEXT,
    "fundId" TEXT,
    "membershipPlanId" TEXT,
    CONSTRAINT "campaigns_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "campaigns_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "funds" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_campaignTypeId_fkey" FOREIGN KEY ("campaignTypeId") REFERENCES "campaign_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "campaign_seasons" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "membership_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_campaigns" ("approvedAt", "approvedById", "authorId", "campaignTarget", "categoryId", "createdAt", "creatorType", "deadline", "description", "featuredImage", "fundId", "fundraiserId", "goalAmount", "id", "mode", "ownerContribution", "permalink", "platformFee", "publishedAt", "publishedById", "raisedAmount", "rejectedAt", "rejectionReason", "settings", "shortDescription", "slug", "status", "submittedAt", "title", "updatedAt", "videoUrl") SELECT "approvedAt", "approvedById", "authorId", "campaignTarget", "categoryId", "createdAt", "creatorType", "deadline", "description", "featuredImage", "fundId", "fundraiserId", "goalAmount", "id", "mode", "ownerContribution", "permalink", "platformFee", "publishedAt", "publishedById", "raisedAmount", "rejectedAt", "rejectionReason", "settings", "shortDescription", "slug", "status", "submittedAt", "title", "updatedAt", "videoUrl" FROM "campaigns";
DROP TABLE "campaigns";
ALTER TABLE "new_campaigns" RENAME TO "campaigns";
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");
CREATE UNIQUE INDEX "campaigns_permalink_key" ON "campaigns"("permalink");
CREATE INDEX "campaigns_authorId_idx" ON "campaigns"("authorId");
CREATE INDEX "campaigns_fundraiserId_idx" ON "campaigns"("fundraiserId");
CREATE INDEX "campaigns_categoryId_idx" ON "campaigns"("categoryId");
CREATE INDEX "campaigns_fundId_idx" ON "campaigns"("fundId");
CREATE INDEX "campaigns_campaignTypeId_idx" ON "campaigns"("campaignTypeId");
CREATE INDEX "campaigns_seasonId_idx" ON "campaigns"("seasonId");
CREATE INDEX "campaigns_membershipPlanId_idx" ON "campaigns"("membershipPlanId");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "campaigns_mode_idx" ON "campaigns"("mode");
CREATE INDEX "campaigns_deadline_idx" ON "campaigns"("deadline");
CREATE INDEX "campaigns_createdAt_idx" ON "campaigns"("createdAt");
CREATE INDEX "campaigns_status_mode_idx" ON "campaigns"("status", "mode");
CREATE INDEX "campaigns_authorId_status_idx" ON "campaigns"("authorId", "status");
CREATE TABLE "new_donations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "recoveryFee" INTEGER NOT NULL DEFAULT 0,
    "processingFee" INTEGER NOT NULL DEFAULT 0,
    "tributeType" TEXT,
    "tributeSalutation" TEXT,
    "tributeTo" TEXT,
    "tributeNotificationEmail" TEXT,
    "tributeNotificationMessage" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "paymentEngine" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "userInfo" TEXT NOT NULL DEFAULT '{}',
    "contributionType" TEXT NOT NULL DEFAULT 'external',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT,
    "campaignId" TEXT NOT NULL,
    "fundId" TEXT,
    "userId" TEXT,
    CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "donations_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "funds" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_donations" ("amount", "campaignId", "createdAt", "createdBy", "fundId", "id", "isAnonymous", "isManual", "notes", "paymentEngine", "paymentMethod", "paymentStatus", "processingFee", "recoveryFee", "status", "transactionId", "tributeNotificationEmail", "tributeNotificationMessage", "tributeSalutation", "tributeTo", "tributeType", "uid", "updatedAt", "updatedBy", "userId", "userInfo") SELECT "amount", "campaignId", "createdAt", "createdBy", "fundId", "id", "isAnonymous", "isManual", "notes", "paymentEngine", "paymentMethod", "paymentStatus", "processingFee", "recoveryFee", "status", "transactionId", "tributeNotificationEmail", "tributeNotificationMessage", "tributeSalutation", "tributeTo", "tributeType", "uid", "updatedAt", "updatedBy", "userId", "userInfo" FROM "donations";
DROP TABLE "donations";
ALTER TABLE "new_donations" RENAME TO "donations";
CREATE UNIQUE INDEX "donations_uid_key" ON "donations"("uid");
CREATE INDEX "donations_campaignId_idx" ON "donations"("campaignId");
CREATE INDEX "donations_fundId_idx" ON "donations"("fundId");
CREATE INDEX "donations_userId_idx" ON "donations"("userId");
CREATE INDEX "donations_status_idx" ON "donations"("status");
CREATE INDEX "donations_transactionId_idx" ON "donations"("transactionId");
CREATE INDEX "donations_createdAt_idx" ON "donations"("createdAt");
CREATE INDEX "donations_campaignId_status_idx" ON "donations"("campaignId", "status");
CREATE INDEX "donations_userId_createdAt_idx" ON "donations"("userId", "createdAt");
CREATE TABLE "new_rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "deliveryDate" DATETIME,
    "limit" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order" INTEGER NOT NULL DEFAULT 0,
    "rewardType" TEXT NOT NULL DEFAULT 'standard',
    "statedValue" INTEGER NOT NULL DEFAULT 0,
    "benefitValue" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "eligibility" TEXT NOT NULL DEFAULT '{}',
    "conversionRule" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "campaignId" TEXT NOT NULL,
    CONSTRAINT "rewards_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_rewards" ("amount", "campaignId", "createdAt", "deliveryDate", "description", "id", "limit", "order", "status", "title", "updatedAt") SELECT "amount", "campaignId", "createdAt", "deliveryDate", "description", "id", "limit", "order", "status", "title", "updatedAt" FROM "rewards";
DROP TABLE "rewards";
ALTER TABLE "new_rewards" RENAME TO "rewards";
CREATE INDEX "rewards_campaignId_idx" ON "rewards"("campaignId");
CREATE INDEX "rewards_amount_idx" ON "rewards"("amount");
CREATE INDEX "rewards_rewardType_idx" ON "rewards"("rewardType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_slug_key" ON "membership_plans"("slug");

-- CreateIndex
CREATE INDEX "membership_plans_status_idx" ON "membership_plans"("status");

-- CreateIndex
CREATE INDEX "membership_plans_tier_idx" ON "membership_plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_tier_level_key" ON "membership_plans"("tier", "level");

-- CreateIndex
CREATE INDEX "user_memberships_userId_idx" ON "user_memberships"("userId");

-- CreateIndex
CREATE INDEX "user_memberships_planId_idx" ON "user_memberships"("planId");

-- CreateIndex
CREATE INDEX "user_memberships_status_idx" ON "user_memberships"("status");

-- CreateIndex
CREATE INDEX "user_memberships_userId_status_idx" ON "user_memberships"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_types_name_key" ON "campaign_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_types_slug_key" ON "campaign_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_seasons_name_key" ON "campaign_seasons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_seasons_slug_key" ON "campaign_seasons"("slug");

-- CreateIndex
CREATE INDEX "campaign_seasons_status_idx" ON "campaign_seasons"("status");

-- CreateIndex
CREATE INDEX "campaign_seasons_startDate_endDate_idx" ON "campaign_seasons"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_groups_name_key" ON "campaign_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_groups_slug_key" ON "campaign_groups"("slug");

-- CreateIndex
CREATE INDEX "campaign_group_memberships_groupId_idx" ON "campaign_group_memberships"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_collections_name_key" ON "campaign_collections"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_collections_slug_key" ON "campaign_collections"("slug");

-- CreateIndex
CREATE INDEX "campaign_collection_memberships_collectionId_idx" ON "campaign_collection_memberships"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_events_name_key" ON "campaign_events"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_events_slug_key" ON "campaign_events"("slug");

-- CreateIndex
CREATE INDEX "campaign_events_status_idx" ON "campaign_events"("status");

-- CreateIndex
CREATE INDEX "campaign_events_startDate_endDate_idx" ON "campaign_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "campaign_event_memberships_eventId_idx" ON "campaign_event_memberships"("eventId");
