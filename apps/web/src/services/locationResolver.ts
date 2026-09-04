// =============================================================================
// UK Hub — Location Resolver Service
//
// Resolves URL paths to location hierarchy, builds breadcrumbs,
// and provides navigation helpers.
// =============================================================================

import type { BreadcrumbItem, HubLocation, LocationPublicStatus } from "@/types/uk-hub";
import {
  ALL_LOCATIONS,
  getLocationBySlug,
  getChildLocations,
  getAncestors,
} from "@/data/ukHubData";

// ───────────────────── Path Resolution ─────────────────────

/**
 * Given a URL path segment (e.g. "london/westminster"), resolve it to
 * the matching location and its ancestor chain.
 */
export function resolvePathToLocation(pathSegments: string[]): {
  location: HubLocation | null;
  ancestors: BreadcrumbItem[];
  children: HubLocation[];
  error: string | null;
} {
  const firstSegment = pathSegments[0];
  if (pathSegments.length === 0 || !firstSegment) {
    return { location: null, ancestors: [], children: [], error: "No path provided" };
  }

  const location = getLocationBySlug(firstSegment);
  if (!location) {
    return { location: null, ancestors: [], children: [], error: `Location not found: ${firstSegment}` };
  }

  // Verify the full path matches
  const expectedPath = location.fullPath || location.slug;
  const actualPath = pathSegments.join("/");
  if (expectedPath !== actualPath) {
    return { location: null, ancestors: [], children: [], error: `Path mismatch: expected ${expectedPath}, got ${actualPath}` };
  }

  const ancestors = getAncestors(location.id).map(a => ({
    label: a.name,
    slug: a.slug,
    fullPath: a.fullPath || a.slug,
    type: a.type,
  }));

  // Add the location itself to breadcrumbs
  ancestors.push({
    label: location.name,
    slug: location.slug,
    fullPath: location.fullPath || location.slug,
    type: location.type,
  });

  const children = getChildLocations(location.id);

  return { location, ancestors, children, error: null };
}

// ───────────────────── Effective Status ─────────────────────

/**
 * Calculate the effective public status, applying admin override if present.
 */
export function getEffectiveStatus(location: HubLocation): LocationPublicStatus {
  return location.statusOverride || location.publicStatus;
}

/**
 * Calculate activation progress as a percentage (0-100).
 */
export function getActivationProgress(location: HubLocation): number {
  if (!location.activationThreshold || location.activationThreshold === 0) {
    return location.fundingTarget > 0
      ? Math.min(Math.round((location.fundingRaised / location.fundingTarget) * 100), 100)
      : 0;
  }
  const fundingPct = location.fundingTarget > 0
    ? Math.min(Math.round((location.fundingRaised / location.fundingTarget) * 100), 100)
    : 0;
  return Math.min(Math.round((fundingPct / location.activationThreshold) * 100), 100);
}

// ───────────────────── Search ─────────────────────

/**
 * Search locations by name or slug (case-insensitive).
 */
export function searchLocations(query: string): HubLocation[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  return ALL_LOCATIONS.filter(
    l =>
      l.name.toLowerCase().includes(q) ||
      l.slug.toLowerCase().includes(q) ||
      (l.shortDescription && l.shortDescription.toLowerCase().includes(q))
  );
}

// ───────────────────── Filtering ─────────────────────

/**
 * Get locations filtered by type, status, and region.
 */
export function filterLocations(filters: {
  type?: string;
  status?: LocationPublicStatus;
  region?: string;
  onlyPublic?: boolean;
}): HubLocation[] {
  return ALL_LOCATIONS.filter(l => {
    if (filters.type && l.type !== filters.type) return false;
    if (filters.status && getEffectiveStatus(l) !== filters.status) return false;
    if (filters.onlyPublic && !l.isPublic) return false;
    return true;
  });
}

// ───────────────────── Nearby / Proximity ─────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get nearest locations to a given lat/lng, sorted by distance.
 */
export function getNearestLocations(
  lat: number,
  lng: number,
  limit = 10,
  typeFilter?: string
): (HubLocation & { distance: number })[] {
  return ALL_LOCATIONS
    .filter(l => {
      if (!l.latitude || !l.longitude) return false;
      if (typeFilter && l.type !== typeFilter) return false;
      return true;
    })
    .map(l => ({
      ...l,
      distance: haversineDistance(lat, lng, l.latitude!, l.longitude!),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
