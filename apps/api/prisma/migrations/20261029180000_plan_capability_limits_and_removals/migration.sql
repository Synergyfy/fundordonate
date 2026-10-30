-- Plan catalogue adjustments:
--   * campaign claims is a new quota
--   * premium templates carry a quota
--   * durations for plan variants are fixed by access level (not stored edits)
--   * remove setup tools, self-funding, reward tracking/redemption and team seats

-- Add the claim quota to the capability catalogue.
INSERT INTO "plan_features" ("id", "key", "name", "description", "category", "sortOrder", "defaultEnabled", "supportsLimit", "defaultLimit", "isActive", "updatedAt")
VALUES (gen_random_uuid(), 'campaign.claim_limit', 'Campaign claims', 'How many campaigns the business can claim in total.', 'campaigns', 15, true, true, 2, true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "sortOrder" = EXCLUDED."sortOrder",
  "supportsLimit" = true,
  "defaultLimit" = 2,
  "isActive" = true;

-- Premium templates now support a numeric quota.
UPDATE "plan_features"
SET "supportsLimit" = true,
    "defaultLimit" = 1,
    "description" = 'Access premium templates, with a cap on how many the business can hold.'
WHERE "key" = 'templates.premium';

-- Remove retired capabilities.
DELETE FROM "plan_features"
WHERE "key" IN (
  'campaign.setup_tools',
  'campaign.self_funding',
  'rewards.tracking',
  'rewards.redemption',
  'team.seats'
);

-- Remove retired keys from every stored capability snapshot.
UPDATE "membership_plan_variants"
SET "capabilities" = "capabilities"
  - 'campaign.setup_tools'
  - 'campaign.self_funding'
  - 'rewards.tracking'
  - 'rewards.redemption'
  - 'team.seats';

UPDATE "access_passes"
SET "capabilities" = "capabilities"
  - 'campaign.setup_tools'
  - 'campaign.self_funding'
  - 'rewards.tracking'
  - 'rewards.redemption'
  - 'team.seats';

UPDATE "user_entitlements"
SET "capabilities" = "capabilities"
  - 'campaign.setup_tools'
  - 'campaign.self_funding'
  - 'rewards.tracking'
  - 'rewards.redemption'
  - 'team.seats';

UPDATE "subscriptions"
SET "capabilities" = "capabilities"
  - 'campaign.setup_tools'
  - 'campaign.self_funding'
  - 'rewards.tracking'
  - 'rewards.redemption'
  - 'team.seats';

UPDATE "subscriptions"
SET "features" = ARRAY(
  SELECT f FROM unnest("features") AS f
  WHERE f NOT IN (
    'campaign.setup_tools',
    'campaign.self_funding',
    'rewards.tracking',
    'rewards.redemption',
    'team.seats'
  )
);

-- Backfill the new claim quota into plans and passes.
UPDATE "membership_plan_variants"
SET "capabilities" = jsonb_set(
  "capabilities",
  '{campaign.claim_limit}',
  '{"enabled": true, "limit": 3, "unlimited": false}'::jsonb,
  true
)
WHERE NOT ("capabilities" ? 'campaign.claim_limit');

UPDATE "access_passes"
SET "capabilities" = jsonb_set(
  "capabilities",
  '{campaign.claim_limit}',
  '{"enabled": true, "limit": 3, "unlimited": false}'::jsonb,
  true
)
WHERE NOT ("capabilities" ? 'campaign.claim_limit');

-- Existing premium entitlements should start with a sensible cap.
UPDATE "membership_plan_variants"
SET "capabilities" = jsonb_set(
  "capabilities",
  '{templates.premium}',
  ("capabilities" -> 'templates.premium') || '{"limit": 1, "unlimited": false}'::jsonb,
  true
)
WHERE "capabilities" ? 'templates.premium';

UPDATE "access_passes"
SET "capabilities" = jsonb_set(
  "capabilities",
  '{templates.premium}',
  ("capabilities" -> 'templates.premium') || '{"limit": 1, "unlimited": false}'::jsonb,
  true
)
WHERE "capabilities" ? 'templates.premium';

UPDATE "user_entitlements"
SET "capabilities" = jsonb_set(
  "capabilities",
  '{templates.premium}',
  ("capabilities" -> 'templates.premium') || '{"limit": 1, "unlimited": false}'::jsonb,
  true
)
WHERE "capabilities" ? 'templates.premium';

UPDATE "subscriptions"
SET "capabilities" = jsonb_set(
  "capabilities",
  '{templates.premium}',
  ("capabilities" -> 'templates.premium') || '{"limit": 1, "unlimited": false}'::jsonb,
  true
)
WHERE "capabilities" ? 'templates.premium';

-- Fixed plan durations. Standard = 90, Pro = 180, Pro+ = 365.
UPDATE "membership_plan_variants" SET "durationDays" = 90 WHERE "accessLevel" = 'STANDARD';
UPDATE "membership_plan_variants" SET "durationDays" = 180 WHERE "accessLevel" = 'PRO';
UPDATE "membership_plan_variants" SET "durationDays" = 365 WHERE "accessLevel" = 'PRO_PLUS';
