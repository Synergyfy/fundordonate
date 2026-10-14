import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contributionService } from "./index";
import { businessKeys } from "../business/hook";
import { campaignKeys } from "../campaign/hook";
import type { ContributionQueryDto, SelfFundDto } from "./type";

export const contributionKeys = {
  all: ["contributions"] as const,
  list: (query?: ContributionQueryDto) => [...contributionKeys.all, "list", query] as const,
};

export function useContributions(query?: ContributionQueryDto) {
  return useQuery({
    queryKey: contributionKeys.list(query),
    queryFn: () => contributionService.getContributions(query),
  });
}

export function useSelfFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, dto }: { campaignId: string; dto: SelfFundDto }) =>
      contributionService.selfFund(campaignId, dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(vars.campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.myCampaigns() });
      queryClient.invalidateQueries({ queryKey: businessKeys.overview() });
    },
  });
}
