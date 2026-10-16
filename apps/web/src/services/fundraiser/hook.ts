import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fundraiserService } from "./index";
import type { RequestWithdrawalInput } from "./type";

export const fundraiserKeys = {
  all: ["fundraiser"] as const,
  stats: () => [...fundraiserKeys.all, "stats"] as const,
  campaigns: (params?: Record<string, any>) => [...fundraiserKeys.all, "campaigns", params] as const,
  campaign: (id: string) => [...fundraiserKeys.all, "campaign", id] as const,
  earnings: () => [...fundraiserKeys.all, "earnings"] as const,
  withdrawals: (params?: Record<string, any>) => [...fundraiserKeys.all, "withdrawals", params] as const,
};

export function useFundraiserStats() {
  return useQuery({
    queryKey: fundraiserKeys.stats(),
    queryFn: () => fundraiserService.getStats(),
  });
}

export function useFundraiserCampaigns(params?: Parameters<typeof fundraiserService.getCampaigns>[0]) {
  return useQuery({
    queryKey: fundraiserKeys.campaigns(params),
    queryFn: () => fundraiserService.getCampaigns(params),
  });
}

export function useFundraiserCampaign(id?: string) {
  return useQuery({
    queryKey: fundraiserKeys.campaign(id || ""),
    queryFn: () => fundraiserService.getCampaign(id!),
    enabled: !!id,
  });
}

export function useFundraiserEarnings() {
  return useQuery({
    queryKey: fundraiserKeys.earnings(),
    queryFn: () => fundraiserService.getEarnings(),
  });
}

export function useFundraiserWithdrawals(params?: Parameters<typeof fundraiserService.getWithdrawals>[0]) {
  return useQuery({
    queryKey: fundraiserKeys.withdrawals(params),
    queryFn: () => fundraiserService.getWithdrawals(params),
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestWithdrawalInput) => fundraiserService.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundraiserKeys.withdrawals() });
      queryClient.invalidateQueries({ queryKey: fundraiserKeys.earnings() });
    },
  });
}
