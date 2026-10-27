import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { walletApi, type McomWalletBalance } from "@/services/wallet";

/**
 * Extracts a human-readable message from a wallet balance request failure.
 * Central Hub errors (unlinked wallet, unavailable service) must be surfaced
 * instead of being displayed as a real £0 balance.
 */
export function getWalletBalanceError(error: unknown): string {
  const apiMessage = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(apiMessage)) return apiMessage.join(", ");
  if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage;

  return (
    (error as Error)?.message ||
    "Could not load your MCOM wallet balance. Please try again."
  );
}

export function useWalletBalance() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const isAuthenticated = authStatus === "authenticated";

  return useQuery<McomWalletBalance>({
    queryKey: ["wallet-balance", user?.id],
    queryFn: () => walletApi.getBalance(),
    // `authStatus` is the source of truth — never keep a derived copy in the
    // store (zustand flattens getters into stale values on every `set`).
    // Admins authenticate locally and are not linked to an MCOM wallet, so
    // skip the request entirely instead of logging a 400 on every page.
    enabled:
      isAuthenticated && Boolean(user?.id) && user?.userType !== "admin",
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
