-- Merge the duplicate "Oldham Street" high street record into the canonical
-- seed-created record. Both sit under the same Northern Quarter parent.
DO $$
DECLARE
  canonical_id TEXT := '927d197a-4175-491f-a12a-fac55d642eea';
  duplicate_id TEXT := '3dfbabf3-e996-4dc7-929f-a76fbf049559';
BEGIN
  IF EXISTS (SELECT 1 FROM "hub_locations" WHERE "id" = duplicate_id)
     AND EXISTS (SELECT 1 FROM "hub_locations" WHERE "id" = canonical_id) THEN
    UPDATE "businesses"
    SET "locationId" = canonical_id
    WHERE "locationId" = duplicate_id;

    -- Preserve campaign attribution, promoting to PRIMARY if either was primary.
    INSERT INTO "campaign_locations" ("id", "campaignId", "locationId", "scope", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), "campaignId", canonical_id, "scope", "createdAt", "updatedAt"
    FROM "campaign_locations"
    WHERE "locationId" = duplicate_id
    ON CONFLICT ("campaignId", "locationId") DO UPDATE
    SET "scope" = CASE
      WHEN "campaign_locations"."scope" = 'PRIMARY' OR EXCLUDED."scope" = 'PRIMARY' THEN 'PRIMARY'::"CampaignLocationScope"
      ELSE "campaign_locations"."scope"
    END;

    DELETE FROM "campaign_locations" WHERE "locationId" = duplicate_id;
    UPDATE "founding_programmes" SET "locationId" = canonical_id WHERE "locationId" = duplicate_id;
    UPDATE "platform_events" SET "locationId" = canonical_id WHERE "locationId" = duplicate_id;
    DELETE FROM "hub_locations" WHERE "id" = duplicate_id;
  END IF;
END $$;
