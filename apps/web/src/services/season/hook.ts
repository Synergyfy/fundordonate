import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { seasonService } from "./index";
import type { CreateSeasonPayload, SeasonAction, SeasonFilters } from "./type";

export const seasonKeys = {
  all: ["seasons"] as const,
  list: (filters?: SeasonFilters) => [...seasonKeys.all, "list", filters] as const,
  current: () => [...seasonKeys.all, "current"] as const,
  season: (id: string) => [...seasonKeys.all, "season", id] as const,
  metrics: (id: string) => [...seasonKeys.all, "metrics", id] as const,
  cityActivities: (id: string) => [...seasonKeys.all, "cities", id] as const,
  review: (id: string) => [...seasonKeys.all, "review", id] as const,
};

export function useSeasons(filters?: SeasonFilters) {
  return useQuery({
    queryKey: seasonKeys.list(filters),
    queryFn: () => seasonService.list(filters),
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: seasonKeys.current(),
    queryFn: () => seasonService.getCurrent(),
  });
}

export function useSeason(id?: string) {
  return useQuery({
    queryKey: seasonKeys.season(id || ""),
    queryFn: () => seasonService.getById(id!),
    enabled: !!id,
  });
}

export function useSeasonMetrics(id?: string) {
  return useQuery({
    queryKey: seasonKeys.metrics(id || ""),
    queryFn: () => seasonService.getMetrics(id!),
    enabled: !!id,
  });
}

export function useSeasonCityActivities(id?: string) {
  return useQuery({
    queryKey: seasonKeys.cityActivities(id || ""),
    queryFn: () => seasonService.getCityActivities(id!),
    enabled: !!id,
  });
}

export function useSeasonReview(id?: string) {
  return useQuery({
    queryKey: seasonKeys.review(id || ""),
    queryFn: () => seasonService.getReview(id!),
    enabled: !!id,
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSeasonPayload) => seasonService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.all });
    },
  });
}

export function usePerformSeasonAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seasonId, action }: { seasonId: string; action: SeasonAction }) =>
      seasonService.performAction(seasonId, action),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.season(vars.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.all });
    },
  });
}
