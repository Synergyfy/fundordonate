import api from "../api";
import type {
  BulkImportResult,
  LocationMetrics,
  TargetCalculation,
  TargetCalculationConfig,
} from "./type";

function getDemoMetrics(locationId: string): LocationMetrics {
  const demoData: Record<string, Partial<LocationMetrics>> = {
    london: { population: 8982000, density: 5598, areaSize: 1572, economicIndex: 78, activityLevel: 85 },
    birmingham: { population: 1145000, density: 4221, areaSize: 267, economicIndex: 62, activityLevel: 70 },
    manchester: { population: 553000, density: 4719, areaSize: 117, economicIndex: 65, activityLevel: 75 },
    leeds: { population: 793000, density: 1420, areaSize: 559, economicIndex: 60, activityLevel: 65 },
    liverpool: { population: 498000, density: 4192, areaSize: 119, economicIndex: 55, activityLevel: 60 },
  };

  const data = demoData[locationId] || { population: 300000, density: 3000, areaSize: 100, economicIndex: 55, activityLevel: 50 };

  return {
    id: `metrics-${locationId}`,
    locationId,
    ...data,
    activeCampaignCount: Math.floor(Math.random() * 20) + 5,
    registeredUsers: Math.floor((data.population || 300000) * 0.02),
    foundingMemberCount: Math.floor((data.population || 300000) * 0.005),
    dataSource: "census",
    lastUpdated: new Date().toISOString(),
  };
}

function getDemoCalculation(locationId: string): TargetCalculation {
  const metrics = getDemoMetrics(locationId);
  const weights = { population: 0.35, density: 0.25, areaSize: 0.15, economicIndex: 0.15, activityLevel: 0.10 };

  const calculatedTarget = Math.round(
    (metrics.population || 0) * weights.population * 10 +
    (metrics.density || 0) * weights.density * 5000 +
    (metrics.areaSize || 0) * weights.areaSize * 100000 +
    (metrics.economicIndex || 50) * weights.economicIndex * 200000 +
    (metrics.activityLevel || 50) * weights.activityLevel * 100000,
  );

  const clampedTarget = Math.max(1000000, Math.min(50000000, calculatedTarget));

  return {
    id: `calc-${locationId}`,
    locationId,
    calculatedTarget: clampedTarget,
    finalTarget: clampedTarget,
    calculationMethod: "hybrid",
    status: "CALCULATED",
    weights,
    inputs: {
      population: metrics.population,
      density: metrics.density,
      areaSize: metrics.areaSize,
      economicIndex: metrics.economicIndex,
      activityLevel: metrics.activityLevel,
    },
    calculatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getDemoConfig(): TargetCalculationConfig {
  return {
    id: "default",
    defaultWeights: { population: 0.35, density: 0.25, areaSize: 0.15, economicIndex: 0.15, activityLevel: 0.10 },
    minTarget: 1000000,
    maxTarget: 50000000,
    populationMultiplier: 10,
    densityMultiplier: 5000,
    economicMultiplier: 200000,
    autoCalculationEnabled: true,
    recalculationIntervalHours: 24,
  };
}

export const targetCalculationService = {
  async getLocationMetrics(locationId: string): Promise<LocationMetrics | null> {
    try {
      const res = await api.get(`/target-calculation/metrics/${locationId}`);
      return res || null;
    } catch {
      return getDemoMetrics(locationId);
    }
  },

  async updateLocationMetrics(locationId: string, data: Partial<LocationMetrics>): Promise<LocationMetrics | null> {
    try {
      return await api.put(`/target-calculation/metrics/${locationId}`, data);
    } catch {
      return null;
    }
  },

  async calculateTarget(locationId: string): Promise<TargetCalculation | null> {
    try {
      const res = await api.post(`/target-calculation/calculate/${locationId}`);
      return res || null;
    } catch {
      return getDemoCalculation(locationId);
    }
  },

  async getTargetCalculation(locationId: string): Promise<TargetCalculation | null> {
    try {
      const res = await api.get(`/target-calculation/${locationId}`);
      return res || null;
    } catch {
      return getDemoCalculation(locationId);
    }
  },

  async getAllCalculations(filters?: { status?: string; method?: string }): Promise<TargetCalculation[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.method) params.set("method", filters.method);
      const res = await api.get(`/target-calculation?${params.toString()}`);
      return res || [];
    } catch {
      return [];
    }
  },

  async overrideTarget(locationId: string, target: number, reason: string): Promise<TargetCalculation | null> {
    try {
      return await api.put(`/target-calculation/override/${locationId}`, { target, reason });
    } catch {
      return null;
    }
  },

  async approveTarget(locationId: string): Promise<TargetCalculation | null> {
    try {
      return await api.put(`/target-calculation/approve/${locationId}`);
    } catch {
      return null;
    }
  },

  async recalculateAll(): Promise<{ locationId: string; locationName: string; success: boolean }[]> {
    try {
      const res = await api.post("/target-calculation/recalculate-all");
      return res || [];
    } catch {
      return [];
    }
  },

  async bulkImport(data: { location: string; population?: number; density?: number; areaSize?: number; economicIndex?: number }[]): Promise<BulkImportResult> {
    try {
      const res = await api.post("/target-calculation/bulk-import", { data });
      return res || { totalRows: 0, successCount: 0, errorCount: 0, skippedCount: 0, results: [], completedAt: new Date().toISOString() };
    } catch {
      return {
        totalRows: data.length,
        successCount: 0,
        errorCount: data.length,
        skippedCount: 0,
        results: data.map((d) => ({ ...d, status: "error", error: "API not available" })),
        completedAt: new Date().toISOString(),
      };
    }
  },

  async getConfig(): Promise<TargetCalculationConfig | null> {
    try {
      const res = await api.get("/target-calculation/config");
      return res || null;
    } catch {
      return getDemoConfig();
    }
  },

  async updateConfig(data: Partial<TargetCalculationConfig>): Promise<TargetCalculationConfig | null> {
    try {
      return await api.put("/target-calculation/config", data);
    } catch {
      return null;
    }
  },
};

export const targetCalculationApi = targetCalculationService;
export default targetCalculationService;
export type * from "./type";
