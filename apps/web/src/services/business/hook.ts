import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessService } from "./index";
import type {
  BusinessOnboardingDto,
  UpdateBusinessProfileDto,
  UpdateBusinessSettingsDto,
} from "./type";

export const businessKeys = {
  all: ["business"] as const,
  overview: () => [...businessKeys.all, "overview"] as const,
  profile: () => [...businessKeys.all, "profile"] as const,
  settings: () => [...businessKeys.all, "settings"] as const,
};

export function useBusinessOverview() {
  return useQuery({
    queryKey: businessKeys.overview(),
    queryFn: () => businessService.getOverview(),
  });
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: businessKeys.profile(),
    queryFn: () => businessService.getProfile(),
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateBusinessProfileDto) => businessService.updateProfile(dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(businessKeys.profile(), updated);
      queryClient.invalidateQueries({ queryKey: businessKeys.overview() });
    },
  });
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: businessKeys.settings(),
    queryFn: () => businessService.getSettings(),
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateBusinessSettingsDto) => businessService.updateSettings(dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(businessKeys.settings(), updated);
    },
  });
}

export function useBusinessOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BusinessOnboardingDto) => businessService.onboard(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}
