-- CreateTable
CREATE TABLE "reward_issuances" (
    "id" TEXT NOT NULL,
    "externalIssuanceId" TEXT NOT NULL,
    "mcomRewardId" TEXT NOT NULL,
    "rewardTitle" TEXT,
    "rewardType" TEXT,
    "externalRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "campaignId" TEXT,
    "contributionId" TEXT,
    "userId" TEXT,
    "mcomUserId" TEXT,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "code" TEXT,
    "value" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_issuances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reward_issuances_externalIssuanceId_key" ON "reward_issuances"("externalIssuanceId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_issuances_idempotencyKey_key" ON "reward_issuances"("idempotencyKey");

-- CreateIndex
CREATE INDEX "reward_issuances_campaignId_idx" ON "reward_issuances"("campaignId");

-- CreateIndex
CREATE INDEX "reward_issuances_externalRef_idx" ON "reward_issuances"("externalRef");

-- CreateIndex
CREATE INDEX "reward_issuances_userId_idx" ON "reward_issuances"("userId");

-- CreateIndex
CREATE INDEX "reward_issuances_mcomRewardId_idx" ON "reward_issuances"("mcomRewardId");

-- CreateIndex
CREATE INDEX "reward_issuances_status_idx" ON "reward_issuances"("status");
