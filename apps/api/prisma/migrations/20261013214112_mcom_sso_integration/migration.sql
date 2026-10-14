-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appPlan" JSONB,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasPaidVerificationFee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSsoSyncAt" TIMESTAMP(3),
ADD COLUMN     "mcomAccessToken" TEXT,
ADD COLUMN     "mcomBusinessId" TEXT,
ADD COLUMN     "mcomLinkedAt" TIMESTAMP(3),
ADD COLUMN     "mcomRefreshToken" TEXT,
ADD COLUMN     "mcomTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "mcomUserId" TEXT,
ADD COLUMN     "membershipLevel" TEXT,
ADD COLUMN     "membershipPlanName" TEXT,
ADD COLUMN     "membershipStatus" TEXT,
ADD COLUMN     "membershipTier" TEXT,
ADD COLUMN     "trialAccessExpiresAt" TIMESTAMP(3),
ADD COLUMN     "userType" TEXT NOT NULL DEFAULT 'consumer',
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "planName" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "quotas" JSONB NOT NULL DEFAULT '{}',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "tasksToComplete" JSONB NOT NULL DEFAULT '[]',
    "membershipPlanName" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_isActive_idx" ON "subscriptions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_mcomUserId_key" ON "users"("mcomUserId");

-- CreateIndex
CREATE INDEX "users_mcomUserId_idx" ON "users"("mcomUserId");

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

