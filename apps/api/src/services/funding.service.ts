// =============================================================================
// FundOrDonate — Funding Calculation Service
// Single authoritative implementation for all campaign financial calculations.
// All amounts are in integer minor units (pence/cents).
// =============================================================================

import { MINOR_UNITS } from "@fundordonate/types";

// =============================================================================
// Types
// =============================================================================

export interface CampaignFinancials {
  /** Total campaign target (campaignTarget or fallback to goalAmount) */
  effectiveTarget: number;
  /** Owner's self-funded contribution (contributionType = "owner") */
  ownerContribution: number;
  /** Total eligible external contributions (contributionType = "external") */
  externalContributions: number;
  /** Remaining amount to reach target */
  remainingAmount: number;
  /** Total raised including owner + external */
  totalRaised: number;
  /** Funding progress as percentage (0-100) */
  progressPercentage: number;
  /** Whether campaign target has been met */
  isFunded: boolean;
  /** Whether campaign is eligible for completion */
  isEligibleForCompletion: boolean;
}

export interface CampaignTargetInput {
  /** Authoritative campaign target (set by admin/membership) */
  campaignTarget?: number | null;
  /** Original goal amount from campaign creation */
  goalAmount: number;
  /** Owner self-funding contribution */
  ownerContribution?: number | null;
}

export interface ContributionInput {
  /** Amount in integer minor units */
  amount: number;
  /** Whether this is owner or external contribution */
  contributionType: "owner" | "external";
}

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculate the effective target for a campaign.
 * campaignTarget is authoritative if set; otherwise falls back to goalAmount.
 */
export function calculateEffectiveTarget(input: CampaignTargetInput): number {
  if (input.campaignTarget && input.campaignTarget > 0) {
    return input.campaignTarget;
  }
  return input.goalAmount;
}

/**
 * Sum eligible external contributions.
 * Only counts contributions with contributionType = "external" and status = "completed".
 */
export function calculateExternalContributions(contributions: ContributionInput[]): number {
  return contributions
    .filter((c) => c.contributionType === "external")
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Sum owner contributions.
 * Only counts contributions with contributionType = "owner" and status = "completed".
 */
export function calculateOwnerContribution(contributions: ContributionInput[]): number {
  return contributions
    .filter((c) => c.contributionType === "owner")
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Calculate remaining amount to reach target.
 * Never returns negative.
 */
export function calculateRemainingAmount(
  effectiveTarget: number,
  ownerContribution: number,
  eligibleExternalContributions: number
): number {
  const remaining = effectiveTarget - ownerContribution - eligibleExternalContributions;
  return Math.max(0, remaining);
}

/**
 * Calculate funding progress percentage (0-100).
 * Never exceeds 100%.
 */
export function calculateProgressPercentage(raised: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((raised / target) * 100), 100);
}

/**
 * Calculate full campaign financials from raw data.
 */
export function calculateCampaignFinancials(
  targetInput: CampaignTargetInput,
  contributions: ContributionInput[]
): CampaignFinancials {
  const effectiveTarget = calculateEffectiveTarget(targetInput);
  const ownerContribution = targetInput.ownerContribution ?? calculateOwnerContribution(contributions);
  const externalContributions = calculateExternalContributions(contributions);
  const totalRaised = ownerContribution + externalContributions;
  const remainingAmount = calculateRemainingAmount(effectiveTarget, ownerContribution, externalContributions);
  const progressPercentage = calculateProgressPercentage(totalRaised, effectiveTarget);
  const isFunded = remainingAmount === 0;
  const isEligibleForCompletion = isFunded || progressPercentage >= 100;

  return {
    effectiveTarget,
    ownerContribution,
    externalContributions,
    remainingAmount,
    totalRaised,
    progressPercentage,
    isFunded,
    isEligibleForCompletion,
  };
}

// =============================================================================
// Display Helpers (minor units → display)
// =============================================================================

export function formatProgress(raised: number, target: number): {
  raisedDisplay: string;
  targetDisplay: string;
  percentage: number;
} {
  return {
    raisedDisplay: formatMinorUnits(raised),
    targetDisplay: formatMinorUnits(target),
    percentage: calculateProgressPercentage(raised, target),
  };
}

function formatMinorUnits(amount: number): string {
  return (amount / MINOR_UNITS).toFixed(2);
}
