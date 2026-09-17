// =============================================================================
// Backend Stub — Season Transition Service
// Placeholder for backend developer to implement.
// Handles season lifecycle, auto-transitions, and campaign completions.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Check if any seasons need to be transitioned.
 * Called by a cron job (e.g., daily at midnight).
 *
 * Steps:
 * 1. Find all ACTIVE seasons whose endDate has passed
 * 2. For each expired season:
 *    a. Trigger season transition
 *    b. Process all campaign surplus (spillover rules)
 *    c. Transition campaigns to next season or archive them
 *    d. Log the transition
 * 3. Find all UPCOMING seasons whose startDate has arrived
 *    a. Set them to ACTIVE
 */
export async function checkAndTransitionSeasons() {
  const now = new Date();

  // Find expired active seasons
  const expiredSeasons = await prisma.campaignSeason.findMany({
    where: {
      status: "active",
      endDate: { lt: now },
    },
    include: { campaigns: true },
  });

  for (const season of expiredSeasons) {
    await transitionSeason(season.id, "date_based");
  }

  // Find upcoming seasons that should now be active
  const upcomingToActivate = await prisma.campaignSeason.findMany({
    where: {
      status: "upcoming",
      startDate: { lte: now },
    },
  });

  for (const season of upcomingToActivate) {
    await prisma.campaignSeason.update({
      where: { id: season.id },
      data: { status: "active" },
    });
  }
}

/**
 * Transition a season to completed status.
 *
 * @param seasonId - The season to transition
 * @param trigger - What triggered the transition (date_based, campaign_completion, manual)
 * @param initiatedBy - Admin user ID if manual
 */
export async function transitionSeason(
  seasonId: string,
  trigger: string,
  initiatedBy?: string
) {
  const season = await prisma.campaignSeason.findUniqueOrThrow({
    where: { id: seasonId },
    include: {
      campaigns: {
        include: {
          spilloverRules: { where: { isEnabled: true } },
        },
      },
    },
  });

  const affectedCampaigns = season.campaigns;
  let totalSurplusDistributed = 0;
  const actions: Array<{
    campaignId: string;
    campaignTitle: string;
    action: string;
    amount: number;
    targetId?: string;
  }> = [];

  // Process each campaign's surplus
  for (const campaign of affectedCampaigns) {
    const surplus = campaign.raisedAmount - campaign.goalAmount;
    if (surplus > 0) {
      // TODO: Import and call evaluateSpilloverRules from spillover.service.ts
      // const spilloverActions = await evaluateSpilloverRules(campaign.id);
      // actions.push(...spilloverActions.map(a => ({ ...a, campaignTitle: campaign.title })));
      // totalSurplusDistributed += spilloverActions.reduce((sum, a) => sum + a.amount, 0);
    }

    // Mark campaign as completed if not already
    if (campaign.status !== "completed" && campaign.status !== "cancelled") {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "completed" },
      });
    }
  }

  // Create transition log
  await prisma.seasonTransitionLog.create({
    data: {
      seasonId,
      trigger,
      affectedCampaignCount: affectedCampaigns.length,
      totalSurplusDistributed,
      actions: JSON.stringify(actions),
      initiatedBy: initiatedBy || null,
    },
  });

  // Mark season as completed
  await prisma.campaignSeason.update({
    where: { id: seasonId },
    data: { status: "completed" },
  });

  return {
    seasonId,
    trigger,
    affectedCampaignCount: affectedCampaigns.length,
    totalSurplusDistributed,
    actions,
  };
}

/**
 * Get transition logs for a season.
 */
export async function getSeasonTransitions(seasonId: string) {
  return prisma.seasonTransitionLog.findMany({
    where: { seasonId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Manually trigger season completion (admin action).
 */
export async function manuallyCompleteSeason(seasonId: string, adminUserId: string) {
  return transitionSeason(seasonId, "manual", adminUserId);
}

/**
 * Auto-assign campaigns to the next season based on rules.
 * Called after a season transition.
 */
export async function autoAssignToNextSeason(seasonId: string) {
  const currentSeason = await prisma.campaignSeason.findUniqueOrThrow({
    where: { id: seasonId },
  });

  // Find the next season (by order)
  const nextSeason = await prisma.campaignSeason.findFirst({
    where: {
      order: { gt: currentSeason.order },
      status: "upcoming",
    },
    orderBy: { order: "asc" },
  });

  if (!nextSeason) return null;

  // Find campaigns in current season that could continue
  const campaignsToTransition = await prisma.campaign.findMany({
    where: {
      seasonId,
      status: { in: ["published", "active"] },
    },
  });

  // TODO: Implement transition logic based on campaign status and spillover rules
  // Some campaigns may be archived, some may move to next season

  return nextSeason;
}
