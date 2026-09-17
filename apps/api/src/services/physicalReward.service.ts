// =============================================================================
// Backend Stub — Donation-Gated Rewards & Physical Reward Journey
// Placeholder for backend developer to implement.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================================
// DONATION-GATED REWARDS
// =============================================================================

/**
 * Get donation-gated rewards for a campaign or location.
 */
export async function getDonationGatedRewards(filters?: {
  campaignId?: string;
  locationId?: string;
  isActive?: boolean;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.campaignId) where.campaignIds = { has: filters.campaignId };
  if (filters?.locationId) where.locationIds = { has: filters.locationId };
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.donationGatedReward.findMany({
    where,
    orderBy: { minDonationPence: "asc" },
  });
}

/**
 * Check if a user qualifies for a donation-gated reward.
 */
export async function checkDonationGatedQualification(
  userId: string,
  rewardId: string
): Promise<{
  qualifies: boolean;
  currentAmount: number;
  requiredAmount: number;
  remainingAmount: number;
}> {
  const reward = await prisma.donationGatedReward.findUnique({
    where: { id: rewardId },
  });

  if (!reward || !reward.isActive) {
    return { qualifies: false, currentAmount: 0, requiredAmount: 0, remainingAmount: 0 };
  }

  // Calculate user's total donations that qualify
  const where: Record<string, unknown> = { userId };
  if (reward.campaignIds && reward.campaignIds.length > 0) {
    where.campaignId = { in: reward.campaignIds };
  }
  if (reward.locationIds && reward.locationIds.length > 0) {
    where.locationId = { in: reward.locationIds };
  }
  if (reward.windowStart || reward.windowEnd) {
    where.createdAt = {};
    if (reward.windowStart) (where.createdAt as any).gte = reward.windowStart;
    if (reward.windowEnd) (where.createdAt as any).lte = reward.windowEnd;
  }

  const totalDonated = await prisma.donation.aggregate({
    where,
    _sum: { amount: true },
  });

  const currentAmount = totalDonated._sum.amount || 0;
  const requiredAmount = reward.minDonationPence;
  const remainingAmount = Math.max(0, requiredAmount - currentAmount);

  return {
    qualifies: currentAmount >= requiredAmount,
    currentAmount,
    requiredAmount,
    remainingAmount,
  };
}

/**
 * Unlock a donation-gated reward for a user.
 */
export async function unlockDonationGatedReward(
  userId: string,
  rewardId: string
) {
  const qualification = await checkDonationGatedQualification(userId, rewardId);
  if (!qualification.qualifies) {
    throw new Error("User does not qualify for this reward");
  }

  // Check if already unlocked
  const existing = await prisma.rewardGrant.findFirst({
    where: { userId, rewardId },
  });
  if (existing) {
    return existing;
  }

  // Create reward grant
  const grant = await prisma.rewardGrant.create({
    data: {
      userId,
      rewardId,
      rewardType: "donation_gated",
      grantedAt: new Date(),
      claimed: false,
    },
  });

  // Update unlocked count
  await prisma.donationGatedReward.update({
    where: { id: rewardId },
    data: { unlockedCount: { increment: 1 } },
  });

  return grant;
}

// =============================================================================
// PHYSICAL REWARD COMPLETION JOURNEY
// =============================================================================

/**
 * Start a physical reward journey.
 * User reaches reward tier online → visits business → makes contribution → reward completed.
 */
export async function startPhysicalRewardJourney(
  userId: string,
  rewardId: string,
  businessId: string
) {
  // Check if user has already started this journey
  const existing = await prisma.physicalRewardJourney.findFirst({
    where: { userId, rewardId },
  });
  if (existing) {
    return existing;
  }

  // Generate redemption QR code
  const qrCode = `REWARD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const journey = await prisma.physicalRewardJourney.create({
    data: {
      userId,
      rewardId,
      onlineQualified: true,
      onlineQualifiedAt: new Date(),
      physicalRedeemed: false,
      redemptionBusinessId: businessId,
      redemptionQrCode: qrCode,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
    },
  });

  return journey;
}

/**
 * Complete physical reward redemption.
 * Called when user visits business and makes contribution.
 */
export async function completePhysicalRedemption(
  userId: string,
  journeyId: string,
  donationId: string
) {
  const journey = await prisma.physicalRewardJourney.findUnique({
    where: { id: journeyId },
  });

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (journey.physicalRedeemed) {
    throw new Error("Already redeemed");
  }

  if (journey.expiresAt && journey.expiresAt < new Date()) {
    throw new Error("Journey has expired");
  }

  // Update journey
  const updatedJourney = await prisma.physicalRewardJourney.update({
    where: { id: journeyId },
    data: {
      physicalRedeemed: true,
      physicalRedeemedAt: new Date(),
      status: "COMPLETED",
    },
  });

  // Create reward grant
  const grant = await prisma.rewardGrant.create({
    data: {
      userId,
      rewardId: journey.rewardId,
      rewardType: "physical_completion",
      campaignId: undefined, // Will be set from donation
      locationId: undefined,
      grantedAt: new Date(),
      claimed: true,
      claimedAt: new Date(),
    },
  });

  return { journey: updatedJourney, grant };
}

/**
 * Get user's physical reward journeys.
 */
export async function getUserPhysicalJourneys(userId: string) {
  return prisma.physicalRewardJourney.findMany({
    where: { userId },
    include: { reward: true, business: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get pending physical reward journeys for a business.
 */
export async function getBusinessPendingRedemptions(businessId: string) {
  return prisma.physicalRewardJourney.findMany({
    where: {
      redemptionBusinessId: businessId,
      onlineQualified: true,
      physicalRedeemed: false,
      status: "PENDING",
    },
    include: { user: true, reward: true },
    orderBy: { createdAt: "asc" },
  });
}

// =============================================================================
// VCARD RECOGNITION
// =============================================================================

/**
 * Get VCard recognition for a user.
 */
export async function getVCardRecognition(userId: string) {
  const recognitions = await prisma.vCardRecognition.findMany({
    where: { userId },
    orderBy: { awardedAt: "desc" },
  });

  // Determine highest recognition level
  const levels = ["none", "backer", "community_backer", "founding_member", "original_founder"];
  let highestLevel = "none";

  for (const r of recognitions) {
    const levelIndex = levels.indexOf(r.recognitionLevel);
    const highestIndex = levels.indexOf(highestLevel);
    if (levelIndex > highestIndex) {
      highestLevel = r.recognitionLevel;
    }
  }

  return {
    recognitions,
    highestLevel,
    displayInfo: getRecognitionDisplayInfo(highestLevel),
  };
}

/**
 * Award VCard recognition to a user.
 */
export async function awardVCardRecognition(
  userId: string,
  level: string,
  trigger: string,
  campaignId?: string,
  locationId?: string
) {
  const displayInfo = getRecognitionDisplayInfo(level);

  return prisma.vCardRecognition.create({
    data: {
      userId,
      recognitionLevel: level,
      trigger,
      campaignId,
      locationId,
      details: displayInfo,
      awardedAt: new Date(),
    },
  });
}

/**
 * Get recognition display info.
 */
function getRecognitionDisplayInfo(level: string) {
  const info: Record<string, any> = {
    none: {
      badgeIcon: "",
      badgeColor: "",
      title: "",
      description: "",
      pointsAwarded: 0,
    },
    backer: {
      badgeIcon: "🤝",
      badgeColor: "purple",
      title: "Backer",
      description: "Recognized community supporter",
      pointsAwarded: 50,
    },
    community_backer: {
      badgeIcon: "🏘️",
      badgeColor: "green",
      title: "Community Backer",
      description: "In-store donation supporter",
      pointsAwarded: 100,
    },
    founding_member: {
      badgeIcon: "⭐",
      badgeColor: "amber",
      title: "Founding Member",
      description: "Founding programme member",
      pointsAwarded: 500,
    },
    original_founder: {
      badgeIcon: "👑",
      badgeColor: "yellow",
      title: "Original Founding Member",
      description: "Among the first to join",
      pointsAwarded: 1000,
    },
  };
  return info[level] || info.none;
}
