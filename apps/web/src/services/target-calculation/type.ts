export interface LocationMetrics {
  id: string;
  locationId: string;
  locationName?: string;
  population?: number;
  density?: number;
  areaSize?: number;
  economicIndex?: number;
  activityLevel?: number;
  activeCampaignCount?: number;
  registeredUsers?: number;
  foundingMemberCount?: number;
  dataSource?: string;
  lastUpdated?: string;
  lastVerified?: string;
}

export interface TargetCalculation {
  id: string;
  locationId: string;
  locationName?: string;
  calculatedTarget: number;
  overrideTarget?: number;
  finalTarget: number;
  calculationMethod: string;
  status: string;
  weights: {
    population: number;
    density: number;
    areaSize: number;
    economicIndex: number;
    activityLevel: number;
  };
  inputs: {
    population?: number;
    density?: number;
    areaSize?: number;
    economicIndex?: number;
    activityLevel?: number;
  };
  overrideReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  calculatedAt: string;
  updatedAt: string;
}

export interface TargetCalculationConfig {
  id: string;
  defaultWeights: {
    population: number;
    density: number;
    areaSize: number;
    economicIndex: number;
    activityLevel: number;
  };
  minTarget: number;
  maxTarget: number;
  populationMultiplier: number;
  densityMultiplier: number;
  economicMultiplier: number;
  autoCalculationEnabled: boolean;
  recalculationIntervalHours: number;
  lastCalculatedAt?: string;
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: {
    location: string;
    population?: number;
    density?: number;
    areaSize?: number;
    economicIndex?: number;
    status: string;
    error?: string;
    locationId?: string;
  }[];
  completedAt: string;
}
