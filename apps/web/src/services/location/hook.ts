import { useQuery } from "@tanstack/react-query";
import { locationService } from "./index";

export const locationKeys = {
  all: ["location"] as const,
  tree: () => [...locationKeys.all, "tree"] as const,
  list: (params?: Record<string, any>) => [...locationKeys.all, "list", params] as const,
  admin: (params?: Record<string, any>) => [...locationKeys.all, "admin", params] as const,
};

export function useLocationTreeQuery() {
  return useQuery({
    queryKey: locationKeys.tree(),
    queryFn: () => locationService.fetchLocationTree(),
  });
}

export function useLocationsQuery(params?: Parameters<typeof locationService.fetchLocations>[0]) {
  return useQuery({
    queryKey: locationKeys.list(params),
    queryFn: () => locationService.fetchLocations(params),
  });
}

export function useAdminLocationsQuery(params?: Parameters<typeof locationService.fetchAdminLocations>[0]) {
  return useQuery({
    queryKey: locationKeys.admin(params),
    queryFn: () => locationService.fetchAdminLocations(params),
  });
}
