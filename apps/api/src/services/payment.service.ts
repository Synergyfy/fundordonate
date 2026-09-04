import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError, AppError } from "../middleware/errorHandler";

function generateUid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// =============================================================================
// Donations (Donation Mode)
// =============================================================================

interface CreateDonationInput {
  amount: number;
  notes?: string;
  isAnonymous?: boolean;
  tributeType?: string;
  tributeTo?: string;
  tributeNotificationEmail?: string;
  tributeNotificationMessage?: string;
  paymentMethod?: string;
}

export async function createDonation(
  campaignId: string,
  userId: string | null,
  data: CreateDonationInput
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, mode: true, goalAmount: true, raisedAmount: true },
  });

  if (!campaign) throw new NotFoundError("Campaign");
  if (campaign.status !== ("published" as any)) throw new AppError(400, "Campaign is not accepting donations");
  if (campaign.mode !== ("donation" as any)) throw new AppError(400, "This campaign is not in donation mode");

  const donation = await prisma.donation.create({
    data: {
      uid: generateUid(),
      amount: data.amount,
      recoveryFee: 0,
      processingFee: 0,
      tributeType: data.tributeType || null,
      tributeTo: data.tributeTo || null,
      tributeNotificationEmail: data.tributeNotificationEmail || null,
      tributeNotificationMessage: data.tributeNotificationMessage || null,
      notes: data.notes || null,
      status: "completed", // In real app, this would be pending until payment confirmed
      paymentMethod: data.paymentMethod || "card",
      isAnonymous: data.isAnonymous || false,
      userInfo: JSON.stringify({}),
      campaignId,
      userId,
    },
    include: {
      campaign: {
        select: { id: true, title: true, slug: true, raisedAmount: true, goalAmount: true },
      },
    },
  });

  // Update campaign raised amount
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { raisedAmount: { increment: data.amount } },
  });

  return donation;
}

export async function getDonation(uid: string) {
  const donation = await prisma.donation.findUnique({
    where: { uid },
    include: {
      campaign: {
        select: { id: true, title: true, slug: true, featuredImage: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!donation) throw new NotFoundError("Donation");
  return donation;
}

export async function getUserDonations(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      include: {
        campaign: {
          select: { id: true, title: true, slug: true, featuredImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.donation.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCampaignDonations(campaignId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where: { campaignId, status: "completed" },
      include: {
        user: {
          select: { id: true, firstName: true, avatar: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.donation.count({ where: { campaignId, status: "completed" } }),
  ]);

  // Mask anonymous donations
  const masked = items.map((d) => {
    if (d.isAnonymous) {
      return { ...d, user: null, anonymous: true };
    }
    return d;
  });

  return { items: masked, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// =============================================================================
// Pledges (Crowdfunding Mode)
// =============================================================================

interface CreatePledgeInput {
  amount: number;
  rewardId?: string;
  bonusSupportAmount?: number;
  shippingCost?: number;
  notes?: string;
  paymentMethod?: string;
}

export async function createPledge(
  campaignId: string,
  userId: string,
  data: CreatePledgeInput
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, mode: true },
  });

  if (!campaign) throw new NotFoundError("Campaign");
  if (campaign.status !== ("published" as any)) throw new AppError(400, "Campaign is not accepting pledges");
  if (campaign.mode !== ("crowdfunding" as any)) throw new AppError(400, "This campaign is not in crowdfunding mode");

  // Validate reward if provided
  if (data.rewardId) {
    const reward = await prisma.reward.findUnique({
      where: { id: data.rewardId },
      select: { id: true, campaignId: true, limit: true, status: true },
    });

    if (!reward || reward.campaignId !== campaignId) {
      throw new NotFoundError("Reward");
    }
    if (reward.status !== ("active" as any)) {
      throw new AppError(400, "This reward is no longer available");
    }
  }

  const pledge = await prisma.pledge.create({
    data: {
      uid: generateUid(),
      amount: data.amount,
      bonusSupportAmount: data.bonusSupportAmount || 0,
      shippingCost: data.shippingCost || 0,
      recoveryFee: 0,
      processingFee: 0,
      notes: data.notes || null,
      status: "completed", // In real app, pending until payment confirmed
      paymentMethod: data.paymentMethod || "card",
      rewardInfo: JSON.stringify({ rewardId: data.rewardId || null }),
      userInfo: JSON.stringify({}),
      campaignId,
      userId,
      rewardId: data.rewardId || null,
    },
    include: {
      campaign: {
        select: { id: true, title: true, slug: true, raisedAmount: true, goalAmount: true },
      },
      reward: {
        select: { id: true, title: true, amount: true },
      },
    },
  });

  // Update campaign raised amount
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { raisedAmount: { increment: data.amount } },
  });

  return pledge;
}

export async function getPledge(uid: string) {
  const pledge = await prisma.pledge.findUnique({
    where: { uid },
    include: {
      campaign: {
        select: { id: true, title: true, slug: true, featuredImage: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      reward: {
        select: { id: true, title: true, amount: true, description: true },
      },
    },
  });

  if (!pledge) throw new NotFoundError("Pledge");
  return pledge;
}

export async function getUserPledges(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.pledge.findMany({
      where: { userId },
      include: {
        campaign: {
          select: { id: true, title: true, slug: true, featuredImage: true },
        },
        reward: {
          select: { id: true, title: true, amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pledge.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCampaignPledges(campaignId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.pledge.findMany({
      where: { campaignId, status: "completed" },
      include: {
        user: {
          select: { id: true, firstName: true, avatar: true, username: true },
        },
        reward: {
          select: { id: true, title: true, amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pledge.count({ where: { campaignId, status: "completed" } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function cancelPledge(pledgeId: string, userId: string) {
  const pledge = await prisma.pledge.findUnique({
    where: { id: pledgeId },
    select: { id: true, userId: true, status: true, amount: true, campaignId: true },
  });

  if (!pledge) throw new NotFoundError("Pledge");
  if (pledge.userId !== userId) throw new ForbiddenError("Not authorized");
  if (pledge.status !== ("completed" as any)) throw new AppError(400, "Pledge cannot be cancelled");

  await prisma.pledge.update({
    where: { id: pledgeId },
    data: { status: "cancelled" },
  });

  // Deduct from campaign raised amount
  await prisma.campaign.update({
    where: { id: pledge.campaignId },
    data: { raisedAmount: { decrement: pledge.amount } },
  });
}
