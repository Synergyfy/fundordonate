// =============================================================================
// Explore Scope & Location Navigation
// Provides scope routing and location options for consumer exploration.
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

const COMMON_UK_CITIES: ScopeOption[] = [
  { slug: "london", name: "London" },
  { slug: "manchester", name: "Manchester" },
  { slug: "birmingham", name: "Birmingham" },
  { slug: "leeds", name: "Leeds" },
  { slug: "glasgow", name: "Glasgow" },
  { slug: "bristol", name: "Bristol" },
  { slug: "sheffield", name: "Sheffield" },
  { slug: "edinburgh", name: "Edinburgh" },
  { slug: "liverpool", name: "Liverpool" },
  { slug: "cardiff", name: "Cardiff" },
];

export function getCityOptions(): ScopeOption[] {
  return COMMON_UK_CITIES;
}

export function getAreaOptions(citySlug: string): ScopeOption[] {
  if (citySlug.toLowerCase() === "london") {
    return [
      { slug: "camden", name: "Camden" },
      { slug: "westminster", name: "Westminster" },
      { slug: "islington", name: "Islington" },
      { slug: "hackney", name: "Hackney" },
      { slug: "kensington-chelsea", name: "Kensington and Chelsea" },
    ];
  }
  return [
    { slug: "central", name: "City Centre" },
    { slug: "north", name: "North" },
    { slug: "south", name: "South" },
  ];
}

export function getStreetOptions(_citySlug: string, areaSlug: string): ScopeOption[] {
  if (areaSlug.toLowerCase() === "camden") {
    return [
      { slug: "camden-high-street", name: "Camden High Street" },
      { slug: "chalk-farm-road", name: "Chalk Farm Road" },
    ];
  }
  return [
    { slug: "high-street", name: "High Street" },
    { slug: "market-street", name: "Market Street" },
  ];
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
