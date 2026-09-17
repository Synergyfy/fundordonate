// =============================================================================
// Backend Stub — Target Calculation Service
// Placeholder for backend developer to implement.
// Calculates funding targets based on real location data.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Default weights for target calculation.
 */
const DEFAULT_WEIGHTS = {
  population: 0.35,
  density: 0.25,
  areaSize: 0.15,
  economicIndex: 0.15,
  activityLevel: 0.10,
};

/**
 * Default configuration.
 */
const DEFAULT_CONFIG = {
  minTarget: 1000000, // £10,000
  maxTarget: 50000000, // £500,000
  populationMultiplier: 10, // £10 per person
  densityMultiplier: 5000, // £5,000 per person/sq km
  economicMultiplier: 200000, // £2,000 per economic index point
  autoCalculationEnabled: true,
  recalculationIntervalHours: 24,
};

/**
 * Calculate target for a location based on its metrics.
 *
 * Formula:
 * target = (population * populationWeight * populationMultiplier)
 *        + (density * densityWeight * densityMultiplier)
 *        + (areaSize * areaWeight * areaMultiplier)
 *        + (economicIndex * economicWeight * economicMultiplier)
 *        + (activityLevel * activityWeight * activityMultiplier)
 *
 * @param locationId - The location to calculate for
 * @param overrides - Optional weight/config overrides
 * @returns The calculated target
 */
export async function calculateTarget(
  locationId: string,
  overrides?: {
    weights?: Partial<typeof DEFAULT_WEIGHTS>;
    config?: Partial<typeof DEFAULT_CONFIG>;
  }
) {
  // Get location metrics
  const metrics = await prisma.locationMetrics.findUnique({
    where: { locationId },
  });

  if (!metrics) {
    throw new Error("Location metrics not found");
  }

  // Get config (or use defaults)
  const config = { ...DEFAULT_CONFIG, ...overrides?.config };
  const weights = { ...DEFAULT_WEIGHTS, ...overrides?.weights };

  // Normalize inputs to 0-1 scale
  const maxPopulation = 1000000; // 1M as max reference
  const maxDensity = 10000; // 10,000 per sq km as max
  const maxAreaSize = 500; // 500 sq km as max
  const maxEconomicIndex = 100;
  const maxActivityLevel = 100;

  const normalizedPopulation = Math.min((metrics.population || 0) / maxPopulation, 1);
  const normalizedDensity = Math.min((metrics.density || 0) / maxDensity, 1);
  const normalizedAreaSize = Math.min((metrics.areaSize || 0) / maxAreaSize, 1);
  const normalizedEconomicIndex = (metrics.economicIndex || 50) / maxEconomicIndex;
  const normalizedActivityLevel = (metrics.activityLevel || 50) / maxActivityLevel;

  // Calculate weighted score
  const weightedScore =
    normalizedPopulation * weights.population +
    normalizedDensity * weights.density +
    normalizedAreaSize * weights.areaSize +
    normalizedEconomicIndex * weights.economicIndex +
    normalizedActivityLevel * weights.activityLevel;

  // Calculate raw target
  const rawTarget =
    (metrics.population || 0) * weights.population * config.populationMultiplier +
    (metrics.density || 0) * weights.density * config.densityMultiplier +
    (metrics.areaSize || 0) * weights.areaSize * 100000 + // £100,000 per sq km
    (metrics.economicIndex || 50) * weights.economicIndex * config.economicMultiplier +
    (metrics.activityLevel || 50) * weights.activityLevel * 100000; // £100,000 per activity point

  // Clamp to min/max
  const calculatedTarget = Math.max(
    config.minTarget,
    Math.min(config.maxTarget, Math.round(rawTarget))
  );

  // Get existing calculation (if any)
  const existing = await prisma.targetCalculation.findUnique({
    where: { locationId },
  });

  // Determine final target
  let finalTarget = calculatedTarget;
  let status = "CALCULATED";

  if (existing?.overrideTarget) {
    finalTarget = existing.overrideTarget;
    status = "OVERRIDDEN";
  }

  // Upsert calculation
  const calculation = await prisma.targetCalculation.upsert({
    where: { locationId },
    create: {
      locationId,
      calculatedTarget,
      finalTarget,
      calculationMethod: "hybrid",
      status,
      weights,
      inputs: {
        population: metrics.population,
        density: metrics.density,
        areaSize: metrics.areaSize,
        economicIndex: metrics.economicIndex,
        activityLevel: metrics.activityLevel,
      },
      calculatedAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      calculatedTarget,
      ...(existing?.overrideTarget ? {} : { finalTarget: calculatedTarget }),
      weights,
      inputs: {
        population: metrics.population,
        density: metrics.density,
        areaSize: metrics.areaSize,
        economicIndex: metrics.economicIndex,
        activityLevel: metrics.activityLevel,
      },
      calculatedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return calculation;
}

/**
 * Override target for a location (admin action).
 */
export async function overrideTarget(
  locationId: string,
  overrideTarget: number,
  reason: string,
  approvedBy: string
) {
  const existing = await prisma.targetCalculation.findUnique({
    where: { locationId },
  });

  if (!existing) {
    throw new Error("No calculation found for this location");
  }

  return prisma.targetCalculation.update({
    where: { locationId },
    data: {
      overrideTarget,
      finalTarget: overrideTarget,
      status: "OVERRIDDEN",
      overrideReason: reason,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Approve a calculated target (admin action).
 */
export async function approveTarget(
  locationId: string,
  approvedBy: string
) {
  const existing = await prisma.targetCalculation.findUnique({
    where: { locationId },
  });

  if (!existing) {
    throw new Error("No calculation found for this location");
  }

  return prisma.targetCalculation.update({
    where: { locationId },
    data: {
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Get target calculation for a location.
 */
export async function getTargetCalculation(locationId: string) {
  return prisma.targetCalculation.findUnique({
    where: { locationId },
    include: { location: true },
  });
}

/**
 * Get all target calculations.
 */
export async function getAllTargetCalculations(filters?: {
  status?: string;
  method?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.method) where.calculationMethod = filters.method;

  return prisma.targetCalculation.findMany({
    where,
    include: { location: true },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Recalculate targets for all locations.
 */
export async function recalculateAllTargets() {
  const locations = await prisma.hubLocation.findMany({
    where: { type: { in: ["CITY", "BOROUGH"] } },
  });

  const results = [];
  for (const location of locations) {
    try {
      const calculation = await calculateTarget(location.id);
      results.push({ locationId: location.id, locationName: location.name, success: true, calculation });
    } catch (error: any) {
      results.push({ locationId: location.id, locationName: location.name, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Bulk import location metrics from CSV data.
 */
export async function bulkImportMetrics(data: {
  location: string;
  population?: number;
  density?: number;
  areaSize?: number;
  economicIndex?: number;
}[]) {
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const row of data) {
    try {
      // Find location by name
      const location = await prisma.hubLocation.findFirst({
        where: { name: { contains: row.location, mode: "insensitive" } },
      });

      if (!location) {
        results.push({ ...row, status: "skipped", error: "Location not found" });
        skippedCount++;
        continue;
      }

      // Upsert metrics
      await prisma.locationMetrics.upsert({
        where: { locationId: location.id },
        create: {
          locationId: location.id,
          locationName: location.name,
          population: row.population,
          density: row.density,
          areaSize: row.areaSize,
          economicIndex: row.economicIndex,
          dataSource: "imported",
          lastUpdated: new Date(),
        },
        update: {
          population: row.population,
          density: row.density,
          areaSize: row.areaSize,
          economicIndex: row.economicIndex,
          dataSource: "imported",
          lastUpdated: new Date(),
        },
      });

      results.push({ ...row, status: "success", locationId: location.id });
      successCount++;
    } catch (error: any) {
      results.push({ ...row, status: "error", error: error.message });
      errorCount++;
    }
  }

  return {
    totalRows: data.length,
    successCount,
    errorCount,
    skippedCount,
    results,
    completedAt: new Date(),
  };
}

/**
 * Update location metrics.
 */
export async function updateLocationMetrics(
  locationId: string,
  data: {
    population?: number;
    density?: number;
    areaSize?: number;
    economicIndex?: number;
    activityLevel?: number;
    dataSource?: string;
  }
) {
  const location = await prisma.hubLocation.findUnique({
    where: { id: locationId },
  });

  return prisma.locationMetrics.upsert({
    where: { locationId },
    create: {
      locationId,
      locationName: location?.name,
      ...data,
      lastUpdated: new Date(),
    },
    update: {
      ...data,
      lastUpdated: new Date(),
    },
  });
}

/**
 * Get default calculation config.
 */
export async function getCalculationConfig() {
  const config = await prisma.targetCalculationConfig.findFirst();
  return config || {
    id: "default",
    ...DEFAULT_CONFIG,
    defaultWeights: DEFAULT_WEIGHTS,
  };
}

/**
 * Update calculation config.
 */
export async function updateCalculationConfig(data: Partial<typeof DEFAULT_CONFIG & { defaultWeights: typeof DEFAULT_WEIGHTS }>) {
  const existing = await prisma.targetCalculationConfig.findFirst();

  if (existing) {
    return prisma.targetCalculationConfig.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.targetCalculationConfig.create({
    data: {
      id: "default",
      ...DEFAULT_CONFIG,
      defaultWeights: DEFAULT_WEIGHTS,
      ...data,
    } as any,
  });
}
