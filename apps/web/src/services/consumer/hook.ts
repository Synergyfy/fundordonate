import { useQuery } from "@tanstack/react-query";
import { consumerService } from "./index";

export const consumerKeys = {
  all: ["consumer"] as const,
  overview: () => [...consumerKeys.all, "overview"] as const,
  notifications: () => [...consumerKeys.all, "notifications"] as const,
};

export function useConsumerOverview() {
  return useQuery({
    queryKey: consumerKeys.overview(),
    queryFn: () => consumerService.getOverview(),
  });
}

export function useConsumerNotifications() {
  return useQuery({
    queryKey: consumerKeys.notifications(),
    queryFn: () => consumerService.getNotifications(),
  });
}
