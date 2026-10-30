import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { planService } from "@/services/plans";
import type { CapabilityRule } from "@/services/plans/type";
import {
  readCapabilitySnapshot,
  writeCapabilitySnapshot,
  type CapabilitySnapshot,
} from "@/lib/plan-capability-cache";

const DISABLED: CapabilityRule = {
  enabled: false,
  limit: null,
  unlimited: false,
};

/** Five minutes: the UI stays instant, the server is checked occasionally. */
const REFRESH_MS = 5 * 60 * 1000;

/**
 * The effective capability set for the signed-in business user.
 *
 * 1. A cached snapshot is read synchronously from localStorage so pages render
 *    with the correct locks immediately — no DB round-trip on first paint.
 * 2. React Query revalidates in the background every five minutes / on focus.
 * 3. Only the snapshot `version` is sent; the API returns a tiny
 *    `{ unchanged: true }` response when nothing changed.
 *
 * The cache is a UX accelerator only. Every locked action is re-checked by the
 * API using its own Redis-backed capability cache.
 */
export function usePlanCapabilities() {
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const entitlement = useAuthStore((s) => s.entitlement);
  const isAuthenticated = authStatus === "authenticated";
  const userId = user?.id ?? null;
  const cached = readCapabilitySnapshot(userId);

  const { data, isLoading, isFetching, refetch } = useQuery<CapabilitySnapshot>({
    queryKey: ["plan-capabilities", userId],
    queryFn: async () => {
      const stored = readCapabilitySnapshot(userId);
      const response = await planService.getCapabilities(stored?.version);
      if (response?.unchanged && stored) {
        const refreshed = { ...stored, fetchedAt: Date.now() };
        writeCapabilitySnapshot(refreshed);
        return refreshed;
      }
      const snapshot: CapabilitySnapshot = {
        userId: userId!,
        version: response.version,
        source: response.source,
        kind: response.kind,
        planName: response.planName,
        expiresAt:
          typeof response.expiresAt === "string"
            ? response.expiresAt
            : response.expiresAt
              ? new Date(response.expiresAt).toISOString()
              : null,
        capabilities: response.capabilities ?? {},
        fetchedAt: Date.now(),
      };
      writeCapabilitySnapshot(snapshot);
      return snapshot;
    },
    initialData: cached ?? undefined,
    enabled: isAuthenticated && Boolean(userId),
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const capabilities: Record<string, CapabilityRule> =
    data?.capabilities ?? entitlement?.capabilities ?? {};

  const rule = (feature: string): CapabilityRule =>
    capabilities[feature] ?? DISABLED;

  return {
    capabilities,
    rule,
    can: (feature: string) => rule(feature).enabled,
    limit: (feature: string) => rule(feature).limit,
    isUnlimited: (feature: string) => rule(feature).unlimited,
    source: data?.source ?? entitlement?.source ?? "default",
    kind: data?.kind ?? entitlement?.entitlementKind ?? null,
    planName: data?.planName ?? entitlement?.planName ?? null,
    expiresAt: data?.expiresAt ?? entitlement?.expiresAt ?? null,
    version: data?.version ?? null,
    fetchedAt: data?.fetchedAt ?? null,
    isLoading: isAuthenticated && !data,
    isRefreshing: isFetching,
    refresh: refetch,
    isActive: Boolean(entitlement?.isActive),
  };
}
