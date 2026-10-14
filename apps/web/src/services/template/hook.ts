import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templateService } from "./index";
import type { CampaignTemplate } from "./type";

export const templateKeys = {
  all: ["templates"] as const,
  list: (filters?: Record<string, any>) => [...templateKeys.all, "list", filters] as const,
  template: (id: string) => [...templateKeys.all, "template", id] as const,
  instances: (id: string) => [...templateKeys.all, "instances", id] as const,
};

export function useTemplates(filters?: Parameters<typeof templateService.getTemplates>[0]) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: () => templateService.getTemplates(filters),
  });
}

export function useTemplate(templateId?: string) {
  return useQuery({
    queryKey: templateKeys.template(templateId || ""),
    queryFn: () => templateService.getTemplate(templateId!),
    enabled: !!templateId,
  });
}

export function useTemplateInstances(templateId?: string) {
  return useQuery({
    queryKey: templateKeys.instances(templateId || ""),
    queryFn: () => templateService.getTemplateInstances(templateId!),
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CampaignTemplate>) => templateService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}
