// =============================================================================
// Explore Scope & Location Navigation
// Provides scope routing for consumer exploration. Location options come from
// the live public location tree (see `useExploreLocations`).
// =============================================================================

export interface ExploreScope {
  citySlug?: string;
  areaSlug?: string;
  streetSlug?: string;
}

export interface ScopeOption {
  slug: string;
  name: string;
}

export function scopeToPath(scope: ExploreScope): string {
  if (scope.citySlug && scope.areaSlug && scope.streetSlug) {
    return `/consumer/explore/city/${scope.citySlug}/area/${scope.areaSlug}/street/${scope.streetSlug}`;
  }
  if (scope.citySlug && scope.areaSlug) {
    return `/consumer/explore/city/${scope.citySlug}/area/${scope.areaSlug}`;
  }
  if (scope.citySlug) {
    return `/consumer/explore/city/${scope.citySlug}`;
  }
  return "/consumer/explore";
}

/** The most specific location reference available for API filtering. */
export function scopeToLocationRef(scope: ExploreScope): string | undefined {
  return scope.streetSlug || scope.areaSlug || scope.citySlug || undefined;
}
