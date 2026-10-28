import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userDashboardService } from "./index";

export const userDashboardKeys = {
  all: ["user-dashboard"] as const,
  stats: () => [...userDashboardKeys.all, "stats"] as const,
  profile: () => [...userDashboardKeys.all, "profile"] as const,
  donations: (params?: Record<string, any>) => [...userDashboardKeys.all, "donations", params] as const,
  pledges: (params?: Record<string, any>) => [...userDashboardKeys.all, "pledges", params] as const,
  notifications: () => [...userDashboardKeys.all, "notifications"] as const,
};

export function useMyContributions(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: userDashboardKeys.donations(params),
    queryFn: () => userDashboardService.getDonations(params),
  });
}

export function useUserDashboardStats() {
  return useQuery({
    queryKey: userDashboardKeys.stats(),
    queryFn: () => userDashboardService.getStats(),
  });
}

export function useUserDashboardProfile() {
  return useQuery({
    queryKey: userDashboardKeys.profile(),
    queryFn: () => userDashboardService.getProfile(),
  });
}

export function useUpdateUserDashboardProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof userDashboardService.updateProfile>[0]) =>
      userDashboardService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userDashboardKeys.profile() });
    },
  });
}
