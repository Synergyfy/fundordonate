import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "./index";
import type { LoginCredentials } from "./type";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  entitlement: () => [...authKeys.all, "entitlement"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
      queryClient.invalidateQueries();
    },
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.adminLogin(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
      queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (refreshToken?: string) => authService.logout(refreshToken),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
