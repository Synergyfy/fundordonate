import { useQuery } from "@tanstack/react-query";
import { walletService } from "./index";

export const walletKeys = {
  all: ["wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  summary: () => [...walletKeys.all, "summary"] as const,
  transactions: (params?: Record<string, any>) => [...walletKeys.all, "transactions", params] as const,
};

export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
    staleTime: 30 * 1000,
  });
}

export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: () => walletService.getSummary(),
  });
}

export function useWalletTransactions(params?: Parameters<typeof walletService.getTransactions>[0]) {
  return useQuery({
    queryKey: walletKeys.transactions(params),
    queryFn: () => walletService.getTransactions(params),
  });
}
