import { useQuery } from "@tanstack/react-query";
import { leaderboardService } from "./index";
import type { LeaderboardQueryDto } from "./type";

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (query?: LeaderboardQueryDto) => [...leaderboardKeys.all, "list", query] as const,
  geo: (level: string, scopeId?: string, top?: number) =>
    [...leaderboardKeys.all, "geo", level, scopeId, top] as const,
  overview: () => [...leaderboardKeys.all, "overview"] as const,
};

export function useLeaderboard(query?: LeaderboardQueryDto) {
  return useQuery({
    queryKey: leaderboardKeys.list(query),
    queryFn: () => leaderboardService.getLeaderboard(query),
  });
}

export function useGeographicLeaderboard(
  level: "campaign" | "city" | "borough" | "high_street" | "national",
  scopeId?: string,
  top: number = 100,
) {
  return useQuery({
    queryKey: leaderboardKeys.geo(level, scopeId, top),
    queryFn: () => leaderboardService.getLeaderboard(level, scopeId, top),
  });
}

export function useLeaderboardOverview() {
  return useQuery({
    queryKey: leaderboardKeys.overview(),
    queryFn: () => leaderboardService.getOverview(),
  });
}
