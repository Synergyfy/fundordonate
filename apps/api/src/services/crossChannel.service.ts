// =============================================================================
// Backend Stub — Cross-Channel Attribution Service
// Placeholder for backend developer to implement.
// Handles linking contributions across channels (web, terminal, QR, in-store, VCard).
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Link a terminal/QR contribution to a user account.
 *
 * Steps:
 * 1. Find user by email, phone, or VCard ID
 * 2. Create or update donation record with userId
 * 3. Merge contribution history
 * 4. Update lifetime stats
 * 5. Check and grant any earned rewards
 *
 * @param donationId - The donation to link
 * @param identifier - Email, phone, or VCard ID
 * @returns The linked donation
 */
export async function linkContributionToUser(
  donationId: string,
  identifier: string
) {
  // Find user by identifier
  let user = null;

  if (identifier.includes("@")) {
    // Email lookup
    user = await prisma.user.findFirst({ where: { email: identifier } });
  } else if (identifier.match(/^\+?[\d\s-]+$/)) {
    // Phone lookup
    user = await prisma.user.findFirst({ where: { phone: identifier } });
  } else {
    // VCard lookup
    const vcard = await prisma.vCard.findFirst({ where: { vcardId: identifier } });
    if (vcard) {
      user = await prisma.user.findUnique({ where: { id: vcard.userId } });
    }
  }

  if (!user) {
    throw new Error("User not found for identifier");
  }

  // Update donation with userId
  const donation = await prisma.donation.update({
    where: { id: donationId },
    data: {
      userId: user.id,
      linkedVia: identifier.includes("@")
        ? "email"
        : identifier.match(/^\+?[\d\s-]+$/)
        ? "phone"
        : "vcard",
    },
  });

  // Update lifetime stats
  await updateLifetimeStats(user.id);

  // Check and grant rewards
  await checkAndGrantCrossChannelRewards(user.id, donation);

  return { ...donation, userId: user.id };
}

/**
 * Update lifetime contribution stats for a user.
 */
export async function updateLifetimeStats(userId: string) {
  // Aggregate all donations
  const donations = await prisma.donation.aggregate({
    where: { userId },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Aggregate by channel
  const channelGroups = await prisma.donation.groupBy({
    by: ["channel"],
    where: { userId },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Aggregate by hierarchy level
  const hierarchyGroups = await prisma.donation.groupBy({
    by: ["hierarchyLevel"],
    where: { userId },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Count unique locations
  const uniqueLocations = await prisma.donation.findMany({
    where: { userId, locationId: { not: null } },
    select: { locationId: true },
    distinct: ["locationId"],
  });

  // Get first and last contribution
  const firstDonation = await prisma.donation.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const lastDonation = await prisma.donation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  // Count pledges
  const pledgeCount = await prisma.pledge.count({
    where: { userId },
  });

  // Check Community Backer status
  const inStoreDonations = await prisma.donation.count({
    where: { userId, channel: "in_store" },
  });

  const isCommunityBacker = inStoreDonations > 0;

  // Update or create lifetime stats
  const stats = await prisma.lifetimeStats.upsert({
    where: { userId },
    create: {
      userId,
      totalContributed: donations._sum.amount || 0,
      totalCampaignsBacked: donations._count.id,
      totalPledges: pledgeCount,
      channelBreakdown: {
        web: channelGroups.find((g) => g.channel === "web")?._sum.amount || 0,
        terminal: channelGroups.find((g) => g.channel === "terminal")?._sum.amount || 0,
        qr: channelGroups.find((g) => g.channel === "qr")?._sum.amount || 0,
        in_store: channelGroups.find((g) => g.channel === "in_store")?._sum.amount || 0,
        vcard: channelGroups.find((g) => g.channel === "vcard")?._sum.amount || 0,
        mobile_app: channelGroups.find((g) => g.channel === "mobile_app")?._sum.amount || 0,
      },
      hierarchyBreakdown: {
        national: hierarchyGroups.find((g) => g.hierarchyLevel === "national")?._sum.amount || 0,
        city: hierarchyGroups.find((g) => g.hierarchyLevel === "city")?._sum.amount || 0,
        borough: hierarchyGroups.find((g) => g.hierarchyLevel === "borough")?._sum.amount || 0,
        high_street: hierarchyGroups.find((g) => g.hierarchyLevel === "high_street")?._sum.amount || 0,
        business: hierarchyGroups.find((g) => g.hierarchyLevel === "business")?._sum.amount || 0,
      },
      firstContributionAt: firstDonation?.createdAt,
      lastContributionAt: lastDonation?.createdAt,
      uniqueLocationsBacked: uniqueLocations.length,
      isCommunityBacker,
      communityBackerAwardedAt: isCommunityBacker ? new Date() : null,
    },
    update: {
      totalContributed: donations._sum.amount || 0,
      totalCampaignsBacked: donations._count.id,
      totalPledges: pledgeCount,
      channelBreakdown: {
        web: channelGroups.find((g) => g.channel === "web")?._sum.amount || 0,
        terminal: channelGroups.find((g) => g.channel === "terminal")?._sum.amount || 0,
        qr: channelGroups.find((g) => g.channel === "qr")?._sum.amount || 0,
        in_store: channelGroups.find((g) => g.channel === "in_store")?._sum.amount || 0,
        vcard: channelGroups.find((g) => g.channel === "vcard")?._sum.amount || 0,
        mobile_app: channelGroups.find((g) => g.channel === "mobile_app")?._sum.amount || 0,
      },
      hierarchyBreakdown: {
        national: hierarchyGroups.find((g) => g.hierarchyLevel === "national")?._sum.amount || 0,
        city: hierarchyGroups.find((g) => g.hierarchyLevel === "city")?._sum.amount || 0,
        borough: hierarchyGroups.find((g) => g.hierarchyLevel === "borough")?._sum.amount || 0,
        high_street: hierarchyGroups.find((g) => g.hierarchyLevel === "high_street")?._sum.amount || 0,
        business: hierarchyGroups.find((g) => g.hierarchyLevel === "business")?._sum.amount || 0,
      },
      lastContributionAt: lastDonation?.createdAt,
      uniqueLocationsBacked: uniqueLocations.length,
      isCommunityBacker,
    },
  });

  return stats;
}

/**
 * Check and grant cross-channel rewards.
 */
async function checkAndGrantCrossChannelRewards(userId: string, donation: any) {
  // Check if this is the user's first in-store donation
  if (donation.channel === "in_store") {
    const inStoreCount = await prisma.donation.count({
      where: { userId, channel: "in_store" },
    });

    if (inStoreCount === 1) {
      // First in-store donation - grant Community Backer reward
      // TODO: Grant reward
    }
  }

  // Check if user has now contributed across multiple channels
  const channels = await prisma.donation.groupBy({
    by: ["channel"],
    where: { userId },
    _count: { id: true },
  });

  if (channels.length >= 3) {
    // Cross-channel supporter reward
    // TODO: Grant reward
  }
}

/**
 * Get user's lifetime stats.
 */
export async function getLifetimeStats(userId: string) {
  return prisma.lifetimeStats.findUnique({
    where: { userId },
  });
}

/**
 * Get contribution history across all channels.
 */
export async function getContributionHistory(
  userId: string,
  options?: { limit?: number; offset?: number; channel?: string }
) {
  const where: Record<string, unknown> = { userId };
  if (options?.channel) where.channel = options.channel;

  const donations = await prisma.donation.findMany({
    where,
    include: { campaign: { select: { id: true, title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  const total = await prisma.donation.count({ where });

  return { donations, total };
}
