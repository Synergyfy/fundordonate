import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { targetCalculationService } from "./index";

export const targetCalculationKeys = {
  all: ["target-calculation"] as const,
  metrics: (locationId: string) => [...targetCalculationKeys.all, "metrics", locationId] as const,
  calculation: (locationId: string) => [...targetCalculationKeys.all, "calc", locationId] as const,
  config: () => [...targetCalculationKeys.all, "config"] as const,
};

export function useLocationMetrics(locationId: string) {
  return useQuery({
    queryKey: targetCalculationKeys.metrics(locationId),
    queryFn: () => targetCalculationService.getLocationMetrics(locationId),
    enabled: !!locationId,
  });
}

export function useTargetCalculation(locationId: string) {
  return useQuery({
    queryKey: targetCalculationKeys.calculation(locationId),
    queryFn: () => targetCalculationService.getTargetCalculation(locationId),
    enabled: !!locationId,
  });
}

export function useTargetCalculationConfig() {
  return useQuery({
    queryKey: targetCalculationKeys.config(),
    queryFn: () => targetCalculationService.getConfig(),
  });
}

export function useRecalculateTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) => targetCalculationService.calculateTarget(locationId),
    onSuccess: (_, locationId) => {
      queryClient.invalidateQueries({ queryKey: targetCalculationKeys.calculation(locationId) });
    },
  });
}
