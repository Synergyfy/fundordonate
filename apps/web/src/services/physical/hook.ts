import { useQuery } from "@tanstack/react-query";
import { physicalService } from "./index";

export const physicalKeys = {
  all: ["physical"] as const,
  terminal: (id: string) => [...physicalKeys.all, "terminal", id] as const,
  lifetimeStats: (userId: string) => [...physicalKeys.all, "lifetime-stats", userId] as const,
  vcard: (userId: string) => [...physicalKeys.all, "vcard", userId] as const,
  journeys: (userId: string) => [...physicalKeys.all, "journeys", userId] as const,
};

export function useLifetimeStats(userId?: string) {
  return useQuery({
    queryKey: physicalKeys.lifetimeStats(userId || ""),
    queryFn: () => physicalService.getLifetimeStats(userId!),
    enabled: !!userId,
  });
}

export function useVCardRecognition(userId?: string) {
  return useQuery({
    queryKey: physicalKeys.vcard(userId || ""),
    queryFn: () => physicalService.getVCardRecognition(userId!),
    enabled: !!userId,
  });
}

export function useTerminal(terminalId?: string) {
  return useQuery({
    queryKey: physicalKeys.terminal(terminalId || ""),
    queryFn: () => physicalService.getTerminal(terminalId!),
    enabled: !!terminalId,
  });
}
