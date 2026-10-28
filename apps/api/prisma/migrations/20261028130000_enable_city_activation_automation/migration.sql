-- Enable automatic city activation promotion for existing installations.
-- The scheduler evaluates each city against its activation rules every 15
-- minutes and promotes forward-only (Inactive -> Making Progress -> Active).
UPDATE "platform_settings"
SET "value" = jsonb_set("value", '{autoPromoteStatus}', 'true'::jsonb, true),
    "updatedAt" = NOW()
WHERE "key" = 'locations_rollup_config'
  AND ("value" ->> 'autoPromoteStatus') = 'false';
