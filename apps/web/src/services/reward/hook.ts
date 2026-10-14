import { useQuery } from "@tanstack/react-query";
import { rewardService } from "./index";

export const rewardKeys = {
  all: ["rewards"] as const,
  list: () => [...rewardKeys.all, "list"] as const,
  city: (id: string) => [...rewardKeys.all, "city", id] as const,
  borough: (id: string) => [...rewardKeys.all, "borough", id] as const,
  user: (userId: string) => [...rewardKeys.all, "user", userId] as const,
};

export function useRewards() {
  return useQuery({
    queryKey: rewardKeys.list(),
    queryFn: () => rewardService.getRewards(),
  });
}

export function useCityRewards(cityLocationId: string) {
  return useQuery({
    queryKey: rewardKeys.city(cityLocationId),
    queryFn: () => rewardService.getCityRewards(cityLocationId),
    enabled: !!cityLocationId,
  });
}

export function useBoroughRewards(boroughLocationId: string) {
  return useQuery({
    queryKey: rewardKeys.borough(boroughLocationId),
    queryFn: () => rewardService.getBoroughRewards(boroughLocationId),
    enabled: !!boroughLocationId,
  });
}

export function useUserRewards(userId: string) {
  return useQuery({
    queryKey: rewardKeys.user(userId),
    queryFn: () => rewardService.getUserRewards(userId),
    enabled: !!userId,
  });
}
