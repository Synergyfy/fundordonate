/**
 * Queue names and job payload contracts for the reward subsystem.
 *
 * Kept in a dependency-free module so producers, processors and services can
 * share them without importing each other (which would create DI-time cycles).
 */

/** Queue that carries reward issuance work off the payment critical path. */
export const REWARD_ISSUE_QUEUE = "reward-issue";

/** Holding queue for issuance jobs that exhausted their retries. */
export const REWARD_ISSUE_DLQ = "reward-issue-dlq";

/** Queue that drives scheduled and on-demand reward reconciliation. */
export const REWARD_RECONCILE_QUEUE = "reward-reconcile";

/** Queue that revokes rewards when a contribution is refunded. */
export const REWARD_REVOKE_QUEUE = "reward-revoke";

export interface RewardIssueJobData {
  contributionId: string;
}

export interface ReconcileCampaignJobData {
  campaignId: string;
}

export interface RewardRevokeJobData {
  contributionId: string;
}
