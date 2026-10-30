-- AlterTable
ALTER TABLE "access_passes" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "membership_plan_variants" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];
