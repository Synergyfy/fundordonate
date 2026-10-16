import api from "../api";
import type {
  BulkImportResult,
  LocationMetrics,
  TargetCalculation,
  TargetCalculationConfig,
} from "./type";

export const targetCalculationService = {
  async getLocationMetrics(locationId: string): Promise<LocationMetrics | null> {
    try {
      const res = await api.get(`/target-calculation/metrics/${locationId}`);
      return res || null;
    } catch {
      return null;
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
      return null;
    }
  },

  async getTargetCalculation(locationId: string): Promise<TargetCalculation | null> {
    try {
      const res = await api.get(`/target-calculation/${locationId}`);
      return res || null;
    } catch {
      return null;
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
      return null;
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
