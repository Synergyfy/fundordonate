import type { CapabilityMap, PlanFeature } from "@/services/plans/type";

/** Build a complete capability map for a plan variant / access pass draft. */
export function planCapabilities(
  features: PlanFeature[],
  existing?: CapabilityMap,
): CapabilityMap {
  const map: CapabilityMap = {};
  for (const feature of features) {
    const current = existing?.[feature.key];
    map[feature.key] = current ?? {
      enabled: feature.defaultEnabled,
      limit: feature.defaultLimit,
      unlimited: false,
    };
  }
  return map;
}
