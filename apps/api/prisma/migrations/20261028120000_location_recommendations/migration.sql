-- Location recommendations review queue.
-- Community submissions are stored server-side so admins can review them from
-- any browser, then approved suggestions become HubLocations.

-- CreateEnum
CREATE TYPE "RecommendationKind" AS ENUM ('HIGH_STREET', 'LOCAL_AREA');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "location_recommendations" (
    "id" TEXT NOT NULL,
    "kind" "RecommendationKind" NOT NULL DEFAULT 'HIGH_STREET',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "postcodes" TEXT[],
    "note" TEXT,
    "suggestedBy" TEXT,
    "submittedByRole" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "areaId" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "createdLocationId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_recommendations_status_idx" ON "location_recommendations"("status");

-- CreateIndex
CREATE INDEX "location_recommendations_cityId_idx" ON "location_recommendations"("cityId");

-- CreateIndex
CREATE INDEX "location_recommendations_areaId_idx" ON "location_recommendations"("areaId");

-- AddForeignKey
ALTER TABLE "location_recommendations" ADD CONSTRAINT "location_recommendations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "hub_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_recommendations" ADD CONSTRAINT "location_recommendations_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "hub_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
