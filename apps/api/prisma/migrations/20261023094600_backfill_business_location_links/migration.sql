-- Backfill business.locationId for businesses created before the HubLocation
-- relationship existed. Prefer a matching high street, then local area, then city.
UPDATE "businesses" b
SET "locationId" = COALESCE(
  (
    SELECT h."id"
    FROM "hub_locations" h
    WHERE LOWER(h."name") = LOWER(b."highStreet")
      AND h."isActive" = true
    ORDER BY
      CASE h."type"
        WHEN 'HIGH_STREET' THEN 0
        WHEN 'COMMERCIAL_AREA' THEN 1
        ELSE 2
      END,
      h."id"
    LIMIT 1
  ),
  (
    SELECT h."id"
    FROM "hub_locations" h
    WHERE LOWER(h."name") = LOWER(b."localArea")
      AND h."isActive" = true
    ORDER BY
      CASE h."type"
        WHEN 'LOCAL_AREA' THEN 0
        WHEN 'BOROUGH' THEN 1
        WHEN 'DISTRICT' THEN 2
        ELSE 3
      END,
      h."id"
    LIMIT 1
  ),
  (
    SELECT h."id"
    FROM "hub_locations" h
    WHERE LOWER(h."name") = LOWER(b."city")
      AND h."type" = 'CITY'
      AND h."isActive" = true
    ORDER BY h."id"
    LIMIT 1
  )
)
WHERE b."locationId" IS NULL
  AND (
    COALESCE(b."highStreet", '') <> ''
    OR COALESCE(b."localArea", '') <> ''
    OR COALESCE(b."city", '') <> ''
  );

-- Give any newly linked campaigns a PRIMARY CampaignLocation.
INSERT INTO "campaign_locations" ("id", "campaignId", "locationId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), c."id", b."locationId", 'PRIMARY', NOW(), NOW()
FROM "business_campaigns" c
JOIN "businesses" b ON b."id" = c."businessId"
WHERE b."locationId" IS NOT NULL
ON CONFLICT ("campaignId", "locationId") DO NOTHING;
