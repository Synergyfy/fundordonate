import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { walletApi, type McomWalletBalance } from "@/services/wallet";

export function useWalletBalance() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery<McomWalletBalance>({
    queryKey: ["wallet-balance", user?.id],
    queryFn: () => walletApi.getBalance(),
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
