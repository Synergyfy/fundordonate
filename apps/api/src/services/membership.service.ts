// =============================================================================
// FundOrDonate — Membership Domain Service
// Manages membership plans, user memberships, and entitlement lookups.
// All pricing and entitlements are configuration-driven, NOT hardcoded.
// =============================================================================

import { prisma } from "../lib/prisma";
import { MembershipTier, MembershipLevel, MembershipStatus, MembershipPlanStatus, slugify } from "@fundordonate/types";
import { NotFoundError } from "../middleware/errorHandler";
import { logger } from "../lib/logger";

// =============================================================================
// Types
// =============================================================================

export interface MembershipPlanInput {
  name: string;
  description?: string;
  tier: MembershipTier;
  level: MembershipLevel;
  price: number; // integer minor units
  duration: number | null; // days, null = lifetime
  entitlements: Record<string, unknown>; // JSON configuration
  order?: number;
  status?: MembershipPlanStatus;
}

export interface MembershipEntitlements {
  /** Maximum campaigns allowed (null = unlimited) */
  maxCampaigns?: number | null;
  /** Maximum reward tiers per campaign */
  maxRewards?: number | null;
  /** Maximum storage in MB */
  storageMb?: number | null;
  /** Whether custom branding is enabled */
  customBranding?: boolean;
  /** Whether priority support is enabled */
  prioritySupport?: boolean;
  /** Whether advanced analytics is enabled */
  advancedAnalytics?: boolean;
  /** Campaign target range (min/max in minor units) */
  campaignTargetMin?: number | null;
  campaignTargetMax?: number | null;
  /** Owner contribution percentage (0-100) */
  ownerContributionPercent?: number | null;
  /** Platform fee override (percentage, 0-100) */
  platformFeeOverride?: number | null;
  /** Custom fields per tier */
  [key: string]: unknown;
}

// =============================================================================
// Plan Management
// =============================================================================

export async function createPlan(data: MembershipPlanInput) {
  const slug = slugify(data.name);
  const plan = await prisma.membershipPlan.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      tier: data.tier,
      level: data.level,
      price: data.price,
      duration: data.duration,
      entitlements: JSON.stringify(data.entitlements),
      order: data.order ?? 0,
      status: data.status || MembershipPlanStatus.ACTIVE,
    },
  });

  logger.info(`Membership plan created: ${plan.id} (${plan.tier}/${plan.level})`);
  return plan;
}

export async function getPlans(filters?: { tier?: MembershipTier; level?: MembershipLevel; status?: MembershipPlanStatus }) {
  const where: Record<string, unknown> = {};
  if (filters?.tier) where.tier = filters.tier;
  if (filters?.level) where.level = filters.level;
  if (filters?.status) where.status = filters.status;

  return prisma.membershipPlan.findMany({
    where,
    orderBy: { order: "asc" },
  });
}

export async function getPlanById(id: string) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) throw new NotFoundError("Membership plan");
  return plan;
}

export async function updatePlan(id: string, data: Partial<MembershipPlanInput>) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) throw new NotFoundError("Membership plan");

  return prisma.membershipPlan.update({
    where: { id },
    data: {
      ...data,
      entitlements: data.entitlements ? JSON.stringify(data.entitlements) : undefined,
    },
  });
}

// =============================================================================
// User Membership Management
// =============================================================================

export async function getUserMembership(userId: string) {
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (!membership) return null;

  // Check expiration
  if (membership.endDate && new Date(membership.endDate) < new Date()) {
    await prisma.userMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.EXPIRED },
    });
    return null;
  }

  return membership;
}

export async function getMembershipEntitlements(userId: string): Promise<MembershipEntitlements | null> {
  const membership = await getUserMembership(userId);
  if (!membership?.plan) return null;

  return JSON.parse(membership.plan.entitlements) as MembershipEntitlements;
}

export async function checkMembershipEligibility(
  userId: string,
  requiredTier: MembershipTier,
  requiredLevel: MembershipLevel
): Promise<{ eligible: boolean; currentTier?: MembershipTier; currentLevel?: MembershipLevel }> {
  const membership = await getUserMembership(userId);
  if (!membership?.plan) {
    return { eligible: false };
  }

  const tierOrder = [MembershipTier.BRONZE, MembershipTier.SILVER, MembershipTier.GOLD, MembershipTier.PLATINUM];
  const levelOrder = [MembershipLevel.STANDARD, MembershipLevel.PRO, MembershipLevel.PRO_PLUS];

  const currentTierIndex = tierOrder.indexOf(membership.plan.tier as MembershipTier);
  const currentLevelIndex = levelOrder.indexOf(membership.plan.level as MembershipLevel);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  const requiredLevelIndex = levelOrder.indexOf(requiredLevel);

  const eligible = currentTierIndex >= requiredTierIndex && currentLevelIndex >= requiredLevelIndex;

  return {
    eligible,
    currentTier: membership.plan.tier as MembershipTier,
    currentLevel: membership.plan.level as MembershipLevel,
  };
}

// =============================================================================
// Entitlement Validation
// =============================================================================

export async function validateCampaignEntitlements(
  userId: string,
  campaignCount: number
): Promise<{ valid: boolean; reason?: string; entitlements?: MembershipEntitlements }> {
  const entitlements = await getMembershipEntitlements(userId);

  // No membership — check if platform allows creation without membership
  if (!entitlements) {
    return { valid: true, reason: "No membership — using platform defaults" };
  }

  // Check campaign limit
  if (entitlements.maxCampaigns !== null && entitlements.maxCampaigns !== undefined) {
    if (campaignCount >= entitlements.maxCampaigns) {
      return {
        valid: false,
        reason: `Campaign limit reached (${entitlements.maxCampaigns}). Upgrade your membership.`,
        entitlements,
      };
    }
  }

  return { valid: true, entitlements };
}

export async function validateCampaignTarget(
  userId: string,
  targetAmount: number
): Promise<{ valid: boolean; reason?: string }> {
  const entitlements = await getMembershipEntitlements(userId);

  if (!entitlements) return { valid: true };

  if (entitlements.campaignTargetMin !== null && entitlements.campaignTargetMin !== undefined) {
    if (targetAmount < entitlements.campaignTargetMin) {
      return {
        valid: false,
        reason: `Minimum campaign target is ${(entitlements.campaignTargetMin / 100).toFixed(2)}`,
      };
    }
  }

  if (entitlements.campaignTargetMax !== null && entitlements.campaignTargetMax !== undefined) {
    if (targetAmount > entitlements.campaignTargetMax) {
      return {
        valid: false,
        reason: `Maximum campaign target is ${(entitlements.campaignTargetMax / 100).toFixed(2)}`,
      };
    }
  }

  return { valid: true };
}

export async function getPlatformFeeOverride(userId: string): Promise<number | null> {
  const entitlements = await getMembershipEntitlements(userId);
  return entitlements?.platformFeeOverride ?? null;
}
