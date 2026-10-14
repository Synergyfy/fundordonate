import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { centralHubService } from "./index";

export const centralHubKeys = {
  all: ["central-hub"] as const,
  status: () => [...centralHubKeys.all, "status"] as const,
  entitlement: () => [...centralHubKeys.all, "entitlement"] as const,
};

export function useCentralHubStatus() {
  return useQuery({
    queryKey: centralHubKeys.status(),
    queryFn: () => centralHubService.getStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshEntitlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => centralHubService.refreshEntitlement(),
    onSuccess: (data) => {
      queryClient.setQueryData(centralHubKeys.entitlement(), data);
    },
  });
}
