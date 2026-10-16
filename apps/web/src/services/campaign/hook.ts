import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignService } from "./index";
import type { CampaignQueryDto, SaveCampaignAnswersDto } from "./type";
import { businessKeys } from "../business/hook";

export const campaignKeys = {
  all: ["campaigns"] as const,
  list: (params?: Record<string, any>) => [...campaignKeys.all, "list", params] as const,
  byId: (id: string) => [...campaignKeys.all, "id", id] as const,
  bySlug: (slug: string) => [...campaignKeys.all, "slug", slug] as const,
  featured: (limit?: number) => [...campaignKeys.all, "featured", limit] as const,
  templates: () => [...campaignKeys.all, "templates"] as const,
  myCampaigns: (query?: CampaignQueryDto) => [...campaignKeys.all, "my", query] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
  rewardAttachments: (id: string) => [...campaignKeys.all, "reward-attachments", id] as const,
  comments: (id: string, page?: number) => [...campaignKeys.all, "comments", id, page] as const,
};

export function useCampaignList(params: Parameters<typeof campaignService.list>[0]) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignService.list(params),
  });
}

export function useCampaignById(id?: string) {
  return useQuery({
    queryKey: campaignKeys.byId(id || ""),
    queryFn: () => campaignService.getById(id!),
    enabled: !!id,
  });
}

export function useCampaignBySlug(slug?: string) {
  return useQuery({
    queryKey: campaignKeys.bySlug(slug || ""),
    queryFn: () => campaignService.getBySlug(slug!),
    enabled: !!slug,
  });
}

export function useFeaturedCampaigns(limit = 6) {
  return useQuery({
    queryKey: campaignKeys.featured(limit),
    queryFn: () => campaignService.getFeatured(limit),
  });
}

export function useBusinessTemplates() {
  return useQuery({
    queryKey: campaignKeys.templates(),
    queryFn: () => campaignService.getTemplates(),
  });
}

export function useClaimTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => campaignService.claimTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.overview() });
    },
  });
}

export function useBusinessCampaigns(query?: CampaignQueryDto) {
  return useQuery({
    queryKey: campaignKeys.myCampaigns(query),
    queryFn: () => campaignService.getMyCampaigns(query),
  });
}

export function useCampaignDetail(campaignId?: string) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId || ""),
    queryFn: () => campaignService.getCampaignDetail(campaignId!),
    enabled: !!campaignId,
  });
}

export function useCampaignRewardAttachments(campaignId?: string) {
  return useQuery({
    queryKey: campaignKeys.rewardAttachments(campaignId || ""),
    queryFn: () => campaignService.getCampaignRewardAttachments(campaignId!),
    enabled: !!campaignId,
  });
}

export function useSaveCampaignAnswers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, dto }: { campaignId: string; dto: SaveCampaignAnswersDto }) =>
      campaignService.saveAnswers(campaignId, dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(vars.campaignId) });
    },
  });
}

export function useSubmitCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.submitForReview(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.myCampaigns() });
      queryClient.invalidateQueries({ queryKey: businessKeys.overview() });
    },
  });
}
