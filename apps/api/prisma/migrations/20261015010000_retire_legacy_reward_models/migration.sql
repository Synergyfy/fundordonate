-- Retire the legacy gamification reward models.
-- Campaign rewards are now authored on CampaignTemplate.rewardsConfig and
-- issued/tracked via the RewardIssuance mirror (MCOM Rewards + local).
-- Drop children before parents to satisfy foreign keys.

DROP TABLE IF EXISTS "reward_fulfilments";
DROP TABLE IF EXISTS "business_earned_rewards";
DROP TABLE IF EXISTS "reward_definitions";
