import { useQuery } from "@tanstack/react-query";
import { hubProgressService } from "./index";

export const hubProgressKeys = {
  all: ["hub-progress"] as const,
  national: () => [...hubProgressKeys.all, "national"] as const,
  location: (id: string) => [...hubProgressKeys.all, "location", id] as const,
  city: (id: string) => [...hubProgressKeys.all, "city", id] as const,
  borough: (id: string) => [...hubProgressKeys.all, "borough", id] as const,
  highStreet: (id: string) => [...hubProgressKeys.all, "high-street", id] as const,
  rollUpConfig: () => [...hubProgressKeys.all, "rollup-config"] as const,
};

export function useNationalProgress() {
  return useQuery({
    queryKey: hubProgressKeys.national(),
    queryFn: () => hubProgressService.getNationalSummary(),
  });
}

export function useLocationStats(locationId?: string) {
  return useQuery({
    queryKey: hubProgressKeys.location(locationId || ""),
    queryFn: () => hubProgressService.getLocationStats(locationId!),
    enabled: !!locationId,
  });
}

export function useCityStats(cityId?: string) {
  return useQuery({
    queryKey: hubProgressKeys.city(cityId || ""),
    queryFn: () => hubProgressService.getCityStats(cityId!),
    enabled: !!cityId,
  });
}

export function useBoroughStats(boroughId?: string) {
  return useQuery({
    queryKey: hubProgressKeys.borough(boroughId || ""),
    queryFn: () => hubProgressService.getBoroughStats(boroughId!),
    enabled: !!boroughId,
  });
}

export function useHighStreetStats(highStreetId?: string) {
  return useQuery({
    queryKey: hubProgressKeys.highStreet(highStreetId || ""),
    queryFn: () => hubProgressService.getHighStreetStats(highStreetId!),
    enabled: !!highStreetId,
  });
}
