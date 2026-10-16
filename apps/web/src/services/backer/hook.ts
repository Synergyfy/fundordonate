import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backerService } from "./index";

export const backerKeys = {
  all: ["backer"] as const,
  myStatus: () => [...backerKeys.all, "my-status"] as const,
  userStatus: (userId: string) => [...backerKeys.all, "status", userId] as const,
  leaderboard: (params?: Record<string, any>) => [...backerKeys.all, "leaderboard", params] as const,
  locationStats: (locationId: string) => [...backerKeys.all, "location-stats", locationId] as const,
  adminBackers: (params?: Record<string, any>) => [...backerKeys.all, "admin", params] as const,
};

export function useMyBackerStatus() {
  return useQuery({
    queryKey: backerKeys.myStatus(),
    queryFn: () => backerService.getMyBackerStatus(),
  });
}

export function useUserBackerStatus(userId?: string) {
  return useQuery({
    queryKey: backerKeys.userStatus(userId || ""),
    queryFn: () => backerService.getUserBackerStatus(userId!),
    enabled: !!userId,
  });
}

export function useBackerLeaderboard(params: Parameters<typeof backerService.getLeaderboard>[0]) {
  return useQuery({
    queryKey: backerKeys.leaderboard(params),
    queryFn: () => backerService.getLeaderboard(params),
  });
}

export function useBackerLocationStats(locationId: string) {
  return useQuery({
    queryKey: backerKeys.locationStats(locationId),
    queryFn: () => backerService.getLocationStats(locationId),
    enabled: !!locationId,
  });
}

export function useRedeemFunnelCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => backerService.redeemFunnelCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backerKeys.myStatus() });
    },
  });
}
