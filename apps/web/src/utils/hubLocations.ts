// =============================================================================
// Hub location helpers shared by the UK Activation admin pages.
// Keeps status derivation, layer typing and metadata access in one place so the
// Cities / Local Areas / High Streets / Progress views stay consistent.
// =============================================================================

import type { LocationTreeNode } from "@/services/admin";

export type HubStatusKey = "ACTIVE" | "MAKING_PROGRESS" | "NEEDS_ACTIVATION";

export interface HubStatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const HUB_STATUS_META: Record<HubStatusKey, HubStatusMeta> = {
  ACTIVE: {
    label: "Active",
    color: "text-green-700",
    bg: "bg-green-100",
    border: "border-green-200",
  },
  MAKING_PROGRESS: {
    label: "Making Progress",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-200",
  },
  NEEDS_ACTIVATION: {
    label: "Inactive",
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-200",
  },
};

type StatusSource = {
  status?: string | null;
  activationStatus?: string | null;
  statusOverride?: string | null;
  internalState?: string | null;
};

/** Collapse the many backend status values into the three public-facing states. */
export function getHubStatusKey(location: StatusSource): HubStatusKey {
  const value = (
    location.statusOverride ||
    location.activationStatus ||
    location.internalState ||
    location.status ||
    ""
  ).toUpperCase();

  if (value === "ACTIVE" || value === "ACTIVATED" || value === "ACTIVE_OPERATION") {
    return "ACTIVE";
  }
  if (
    value === "MAKING_PROGRESS" ||
    value === "IN_PROGRESS" ||
    value === "PREPARING" ||
    value === "LAUNCHING"
  ) {
    return "MAKING_PROGRESS";
  }
  return "NEEDS_ACTIVATION";
}

export function getHubStatusMeta(location: StatusSource): HubStatusMeta {
  return HUB_STATUS_META[getHubStatusKey(location)];
}

export const LOCAL_AREA_TYPES = ["BOROUGH", "DISTRICT", "LOCAL_AREA"] as const;
export const HIGH_STREET_TYPES = ["HIGH_STREET", "COMMERCIAL_AREA"] as const;

export function isLocalAreaType(type?: string | null): boolean {
  return !!type && (LOCAL_AREA_TYPES as readonly string[]).includes(type);
}

export function isHighStreetType(type?: string | null): boolean {
  return !!type && (HIGH_STREET_TYPES as readonly string[]).includes(type);
}

export function getMetadata(location: { metadata?: Record<string, any> | null }): Record<string, any> {
  return location.metadata ?? {};
}

/** Normalise the metadata JSON column from the API into an object. */
export function normaliseLocation<T extends { metadata?: unknown }>(location: T): T {
  if (location && (location.metadata === null || location.metadata === undefined)) {
    return { ...location, metadata: {} };
  }
  return location;
}

/** Per-city naming for the layer below a city (Borough / District / Local Area…). */
export function getAreaTerminology(location: { metadata?: Record<string, any> | null }): string {
  const value = getMetadata(location).areaTerminology;
  return typeof value === "string" && value.trim() ? value.trim() : "Local Area";
}

export function pluraliseTerm(term: string): string {
  if (!term) return "Local Areas";
  if (term.endsWith("s")) return term;
  if (term.endsWith("y")) return `${term.slice(0, -1)}ies`;
  return `${term}s`;
}

/** Operating area (boundary) is only official once an admin has confirmed it. */
export function isBoundaryConfirmed(location: { metadata?: Record<string, any> | null }): boolean {
  const meta = getMetadata(location);
  if (typeof meta.boundaryConfirmed === "boolean") return meta.boundaryConfirmed;
  // Legacy records created before confirmation tracking are treated as confirmed
  // only when an explicit boundary mode was stored by the wizard.
  return meta.boundaryMode === "detected" && meta.confirmed === true;
}

export function getSeasonId(location: { metadata?: Record<string, any> | null }): string | null {
  const meta = getMetadata(location);
  const value = meta.seasonId ?? meta.currentSeason;
  return typeof value === "string" && value ? value : null;
}

/** Flatten a location tree into a single array (parents before children). */
export function flattenLocationTree(nodes: LocationTreeNode[] = []): LocationTreeNode[] {
  const out: LocationTreeNode[] = [];
  const walk = (node: LocationTreeNode) => {
    out.push(node);
    (node.children ?? []).forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export interface CityLayerCounts {
  localAreas: number;
  highStreets: number;
  businesses: number;
}

/** Derive local area / high street / business counts for a city from the tree. */
export function countCityLayers(
  cityId: string,
  flatNodes: LocationTreeNode[],
  fallback?: { businesses?: number },
): CityLayerCounts {
  const children = flatNodes.filter((n) => n.parentId === cityId);
  const areas = children.filter((n) => isLocalAreaType(n.type));
  const areaIds = new Set(areas.map((a) => a.id));
  const streets = flatNodes.filter(
    (n) => isHighStreetType(n.type) && n.parentId && areaIds.has(n.parentId),
  );
  const businesses = children.reduce((acc, n) => acc + (n.businessCount ?? 0), 0) +
    streets.reduce((acc, n) => acc + (n.businessCount ?? 0), 0);

  return {
    localAreas: areas.length,
    highStreets: streets.length,
    businesses: fallback?.businesses ?? businesses,
  };
}

export interface ActivationRule {
  id: string;
  label: string;
  type: string;
  threshold: number;
  unit: string;
  enabled: boolean;
  audience?: "all" | "business" | "consumer";
  businessThreshold?: number;
  consumerThreshold?: number;
}

/** Mirrors the backend defaults so admins can review/tune them in the city view. */
export const DEFAULT_MAKING_PROGRESS_RULES: ActivationRule[] = [
  { id: "mp-campaign-coverage", label: "Campaign Coverage", type: "campaign_coverage", threshold: 30, unit: "%", enabled: true, audience: "all" },
  { id: "mp-campaign-participation", label: "Campaigns with Qualifying Activity", type: "campaign_participation", threshold: 30, unit: "%", enabled: true, audience: "all" },
  { id: "mp-local-area-activity", label: "Local Areas with Active/Progressing Campaigns", type: "local_area_activity", threshold: 3, unit: "count", enabled: true, audience: "all" },
  { id: "mp-high-street-activity", label: "High Streets with Qualifying Campaigns", type: "high_street_activity", threshold: 25, unit: "%", enabled: false, audience: "all" },
  { id: "mp-contribution", label: "Contribution Progress", type: "contribution", threshold: 20, unit: "%", enabled: false, audience: "all" },
];

export const DEFAULT_ACTIVE_RULES: ActivationRule[] = [
  { id: "a-campaign-coverage", label: "Campaign Coverage", type: "campaign_coverage", threshold: 70, unit: "%", enabled: true, audience: "all" },
  { id: "a-campaign-participation", label: "Qualifying Participation", type: "campaign_participation", threshold: 50, unit: "%", enabled: true, audience: "all" },
  { id: "a-local-area-activity", label: "Local Areas with Qualifying Activity", type: "local_area_activity", threshold: 50, unit: "%", enabled: true, audience: "all" },
  { id: "a-high-street-activity", label: "High Streets with Qualifying Campaigns", type: "high_street_activity", threshold: 40, unit: "%", enabled: false, audience: "all" },
  { id: "a-contribution", label: "Contribution Target", type: "contribution", threshold: 50, unit: "%", enabled: false, audience: "all" },
];

/** Read the activation rules an admin confirmed when creating the city hub. */
export function getCityActivationRules(city: {
  metadata?: Record<string, any> | null;
}): {
  makingProgress: ActivationRule[];
  active: ActivationRule[];
  makingProgressLogic: "AND" | "OR";
  activeLogic: "AND" | "OR";
} {
  const meta = getMetadata(city);
  const mp = Array.isArray(meta.makingProgressRules) ? meta.makingProgressRules : [];
  const active = Array.isArray(meta.activeRules) ? meta.activeRules : [];
  return {
    makingProgress: mp,
    active,
    makingProgressLogic: meta.makingProgressLogic === "OR" ? "OR" : "AND",
    activeLogic: meta.activeLogic === "OR" ? "OR" : "AND",
  };
}
