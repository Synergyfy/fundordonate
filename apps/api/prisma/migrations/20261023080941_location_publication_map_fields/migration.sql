-- AlterTable
ALTER TABLE "hub_locations" ADD COLUMN     "fullPath" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mapEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mapZoomLevel" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "primaryImage" TEXT,
ADD COLUMN     "secondaryImage" TEXT,
ADD COLUMN     "statusOverride" TEXT;

-- CreateIndex
CREATE INDEX "hub_locations_fullPath_idx" ON "hub_locations"("fullPath");

-- CreateIndex
CREATE INDEX "hub_locations_mapEnabled_idx" ON "hub_locations"("mapEnabled");

-- Ensure the UK National Hub root exists and attach any orphan root locations.
INSERT INTO "hub_locations" ("id", "name", "slug", "type", "fullPath", "isActive", "isPublic", "mapEnabled", "mapZoomLevel", "activationStatus", "metadata", "updatedAt")
VALUES (gen_random_uuid(), 'United Kingdom National Hub', 'united-kingdom', 'NATIONAL', 'united-kingdom', true, true, false, 5, 'ACTIVATED', '{}', NOW())
ON CONFLICT ("slug") DO NOTHING;

UPDATE "hub_locations"
SET "parentId" = (SELECT "id" FROM "hub_locations" WHERE "slug" = 'united-kingdom')
WHERE "parentId" IS NULL
  AND "slug" <> 'united-kingdom';

-- Backfill canonical hierarchy paths for every location.
WITH RECURSIVE location_tree AS (
  SELECT "id", "slug", "parentId", "slug"::text AS path
  FROM "hub_locations"
  WHERE "parentId" IS NULL
  UNION ALL
  SELECT child."id", child."slug", child."parentId", (parent.path || '/' || child."slug")
  FROM "hub_locations" child
  JOIN location_tree parent ON child."parentId" = parent."id"
)
UPDATE "hub_locations" target
SET "fullPath" = location_tree.path
FROM location_tree
WHERE target."id" = location_tree."id";

