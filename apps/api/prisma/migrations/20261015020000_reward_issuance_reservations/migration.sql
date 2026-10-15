-- Reservation/cap support for reward issuance.
-- `rewardConfigId` attributes an issuance to a campaign reward rule so the
-- per-rule quantity cap can be enforced atomically (count of non-revoked/
-- non-failed issuances under an advisory lock). Status "PENDING" is used while
-- a provider call is in flight (no schema change needed — status is text).

ALTER TABLE "reward_issuances" ADD COLUMN "rewardConfigId" TEXT;

CREATE INDEX "reward_issuances_campaignId_rewardConfigId_idx"
  ON "reward_issuances"("campaignId", "rewardConfigId");
