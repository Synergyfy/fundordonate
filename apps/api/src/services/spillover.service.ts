// =============================================================================
// Backend Stub — Spillover Service
// Placeholder for backend developer to implement.
// Handles surplus calculation, spillover rule evaluation, and redistribution.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Evaluate spillover rules for a campaign when its target is reached.
 *
 * Steps:
 * 1. Find all enabled SpilloverRules for this campaign (or season-wide defaults)
 * 2. Sort by priority (lower = higher priority)
 * 3. For each rule:
 *    a. Check if threshold is met (raisedAmount / goalAmount >= thresholdPercentage)
 *    b. Calculate surplus amount (raisedAmount - goalAmount)
 *    c. Apply allocationPercentage to determine how much of surplus this rule handles
 *    d. Execute the action (redistribute, hold, refund, donate, release)
 * 4. Create SurplusRecord for audit trail
 * 5. Cascade remaining surplus to next rule
 *
 * @param campaignId - The campaign whose target was reached
 * @returns Array of actions taken
 */
export async function evaluateSpilloverRules(campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      spilloverRules: { where: { isEnabled: true }, orderBy: { priority: "asc" } },
      season: true,
    },
  });

  const surplus = campaign.raisedAmount - campaign.goalAmount;
  if (surplus <= 0) return [];

  // Get rules: campaign-specific first, then season-wide defaults
  let rules = campaign.spilloverRules;

  if (campaign.seasonId) {
    const seasonDefaults = await prisma.spilloverRule.findMany({
      where: {
        seasonId: campaign.seasonId,
        campaignId: null,
        isEnabled: true,
      },
      orderBy: { priority: "asc" },
    });
    rules = [...rules, ...seasonDefaults];
  }

  const actions: Array<{
    campaignId: string;
    action: string;
    amount: number;
    targetId?: string;
    status: string;
  }> = [];

  let remainingSurplus = surplus;

  for (const rule of rules) {
    if (remainingSurplus <= 0) break;

    const ruleAmount = Math.floor(remainingSurplus * (rule.allocationPercentage / 100));
    if (ruleAmount <= 0) continue;

    // TODO: Implement each action type
    switch (rule.action) {
      case "redistribute_next":
        // Find next campaign in hierarchy and credit it
        // await redistributeToNextCampaign(campaignId, ruleAmount, rule.targetCampaignId);
        break;
      case "hold_for_next_season":
        // Hold in pool for target season
        // await holdForNextSeason(campaignId, ruleAmount, rule.targetSeasonId);
        break;
      case "refund_to_donors":
        // Proportionally refund to donors
        // await refundToDonors(campaignId, ruleAmount);
        break;
      case "donate_to_pool":
        // Donate to community pool
        // await donateToPool(campaignId, ruleAmount);
        break;
      case "release_to_owner":
        // Release to campaign owner
        // await releaseToOwner(campaignId, ruleAmount);
        break;
    }

    actions.push({
      campaignId,
      action: rule.action,
      amount: ruleAmount,
      targetId: rule.targetCampaignId || rule.targetSeasonId || null,
      status: "pending",
    });

    remainingSurplus -= ruleAmount;
  }

  // Create surplus record for audit
  await prisma.surplusRecord.create({
    data: {
      campaignId,
      goalAmount: campaign.goalAmount,
      raisedAmount: campaign.raisedAmount,
      surplusAmount: surplus,
      action: actions[0]?.action || "release_to_owner",
      targetId: actions[0]?.targetId || null,
      redistributedAmount: surplus - remainingSurplus,
      status: "pending",
    },
  });

  return actions;
}

/**
 * Get surplus records for a campaign.
 */
export async function getCampaignSurplus(campaignId: string) {
  return prisma.surplusRecord.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Process pending surplus records (called by cron job or manual trigger).
 */
export async function processPendingSurplus() {
  const pending = await prisma.surplusRecord.findMany({
    where: { status: "pending" },
    include: { campaign: true },
  });

  for (const record of pending) {
    try {
      // TODO: Execute the actual redistribution based on record.action
      await prisma.surplusRecord.update({
        where: { id: record.id },
        data: { status: "completed" },
      });
    } catch (error) {
      await prisma.surplusRecord.update({
        where: { id: record.id },
        data: { status: "failed" },
      });
    }
  }
}
