// =============================================================================
// Location Registry — Frontend (no backend)
// Admin confirmation overlay for the UK location hierarchy.
//
// Spec rules encoded here:
//   - Geographic data only SUGGESTS cities, boundaries, local areas and high
//     streets. Nothing is "official" for a layer until Admin confirms it.
//   - Businesses/consumers may RECOMMEND missing high streets. A recommendation
//     never auto-creates an official location — it enters the registry as
//     "suggested" only after Admin approves it in the review queue, and becomes
//     official when Admin confirms it in the High Streets confirm step.
//   - Cities have different administrative structures: each city carries its
//     own area terminology (Borough / District / Local Area / ...).
// =============================================================================

import { getCities, getAreaTerminology } from "./ukHubData";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type LayerState = "suggested" | "confirmed" | "rejected";
export type LocationOrigin = "geographic data" | "manual" | "recommendation";
export type BoundaryMode = "detected" | "radius" | "custom";

export interface RegistryLocalArea {
  id: string;
  citySlug: string;
  slug: string;
  name: string;
  /** "Borough" | "District" | "Local Area" | ... — follows the city's terminology */
  type: string;
  source: LocationOrigin;
  state: LayerState;
  addedAt: string;
}

export interface RegistryHighStreet {
  id: string;
  citySlug: string;
  areaSlug: string;
  slug: string;
  name: string;
  postcodes: string[];
  source: LocationOrigin;
  /** "Geographic data", "Community recommendation — <name>", ... */
  suggestedBy: string;
  state: LayerState;
  addedAt: string;
}

export interface CitySetup {
  citySlug: string;
  cityName: string;
  /** Borough / District / Local Area / Council Area / Other */
  areaTerminology: string;
  boundaryMode: BoundaryMode;
  boundaryRadiusMiles?: number;
  boundaryState: LayerState;
  boundaryConfirmedAt?: string;
  /**
   * Per-layer confirmation state.
   * Key = slug of a detected local area / high street, or "*" for the wildcard
   * default that applies to every detected layer of the city.
   */
  areaStates: Record<string, LayerState>;
  streetStates: Record<string, LayerState>;
  /** Local areas added manually in the Add City wizard (not detected). */
  addedAreas: RegistryLocalArea[];
  /** High streets added by the wizard or by approved recommendations. */
  addedStreets: RegistryHighStreet[];
  updatedAt: string;
}

export interface ConfirmationChecklist {
  boundaryDone: boolean;
  areas: { confirmed: number; total: number; done: boolean };
  streets: { confirmed: number; total: number; done: boolean };
  allDone: boolean;
}

// -----------------------------------------------------------------------------
// Store (module-level, session lifetime — matches the demo-data convention)
// -----------------------------------------------------------------------------

const setups = new Map<string, CitySetup>();
let idCounter = 1000;

const now = () => new Date().toISOString().slice(0, 10);
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function seedSetup(citySlug: string): CitySetup {
  const city = getCities().find((c) => c.slug === citySlug);
  const status = city?.publicStatus;
  const active = status === "ACTIVE";
  const progressing = status === "MAKING_PROGRESS";

  return {
    citySlug,
    cityName: city?.name ?? citySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    areaTerminology: getAreaTerminology(citySlug),
    boundaryMode: "detected",
    boundaryState: active || progressing ? "confirmed" : "suggested",
    boundaryConfirmedAt: active || progressing ? now() : undefined,
    // Active & progressing cities already operate with their detected areas;
    // streets only become official layer-by-layer.
    areaStates: { "*": active || progressing ? "confirmed" : "suggested" },
    streetStates: { "*": active ? "confirmed" : "suggested" },
    addedAreas: [],
    addedStreets: [],
    updatedAt: now(),
  };
}

/** Get (lazily seeding) the confirmation setup for a city. */
export function getCitySetup(citySlug: string): CitySetup {
  let setup = setups.get(citySlug);
  if (!setup) {
    setup = seedSetup(citySlug);
    setups.set(citySlug, setup);
  }
  return setup;
}

/** All city setups (for admin overviews). */
export function getAllCitySetups(): CitySetup[] {
  return getCities().map((c) => getCitySetup(c.slug));
}

function touch(setup: CitySetup) {
  setup.updatedAt = now();
}

/**
 * Cities have different administrative structures — let the admin set the
 * naming for each city (Borough / District / Local Area / Council Area / ...).
 */
export function setAreaTerminology(citySlug: string, terminology: string): CitySetup {
  const setup = getCitySetup(citySlug);
  setup.areaTerminology = terminology.trim() || "Local Area";
  touch(setup);
  return setup;
}

// -----------------------------------------------------------------------------
// Layer state lookups
// -----------------------------------------------------------------------------

export function areaState(setup: CitySetup, areaSlug: string): LayerState {
  return setup.areaStates[areaSlug] ?? setup.areaStates["*"] ?? "suggested";
}

export function streetState(setup: CitySetup, streetSlug: string): LayerState {
  return setup.streetStates[streetSlug] ?? setup.streetStates["*"] ?? "suggested";
}

export function isAreaOfficial(citySlug: string, areaSlug: string): boolean {
  return areaState(getCitySetup(citySlug), areaSlug) === "confirmed";
}

export function isStreetOfficial(citySlug: string, streetSlug: string): boolean {
  return streetState(getCitySetup(citySlug), streetSlug) === "confirmed";
}

// -----------------------------------------------------------------------------
// Boundary (operating area) confirmation
// -----------------------------------------------------------------------------

export function setBoundary(
  citySlug: string,
  opts: { mode: BoundaryMode; radiusMiles?: number; confirmed: boolean }
): CitySetup {
  const setup = getCitySetup(citySlug);
  setup.boundaryMode = opts.mode;
  setup.boundaryRadiusMiles = opts.radiusMiles;
  setup.boundaryState = opts.confirmed ? "confirmed" : "suggested";
  setup.boundaryConfirmedAt = opts.confirmed ? now() : undefined;
  touch(setup);
  return setup;
}

// -----------------------------------------------------------------------------
// Local area confirmation
// -----------------------------------------------------------------------------

export function setAreaState(citySlug: string, areaSlug: string, state: LayerState): CitySetup {
  const setup = getCitySetup(citySlug);
  setup.areaStates[areaSlug] = state;
  touch(setup);
  return setup;
}

export function setAreaStates(citySlug: string, areaSlugs: string[], state: LayerState): CitySetup {
  const setup = getCitySetup(citySlug);
  for (const slug of areaSlugs) setup.areaStates[slug] = state;
  touch(setup);
  return setup;
}

/** Confirm every currently detected local area of the city (wildcard). */
export function confirmAllAreas(citySlug: string): CitySetup {
  const setup = getCitySetup(citySlug);
  setup.areaStates = { "*": "confirmed" };
  touch(setup);
  return setup;
}

export function addLocalArea(input: {
  citySlug: string;
  name: string;
  type?: string;
  source?: LocationOrigin;
  state?: LayerState;
}): RegistryLocalArea {
  const setup = getCitySetup(input.citySlug);
  const area: RegistryLocalArea = {
    id: nextId("ra"),
    citySlug: input.citySlug,
    slug: slugify(input.name),
    name: input.name,
    type: input.type ?? setup.areaTerminology,
    source: input.source ?? "manual",
    state: input.state ?? "confirmed",
    addedAt: now(),
  };
  setup.addedAreas.push(area);
  setup.areaStates[area.slug] = area.state;
  touch(setup);
  return area;
}

// -----------------------------------------------------------------------------
// High street confirmation
// -----------------------------------------------------------------------------

export function setStreetState(citySlug: string, streetSlug: string, state: LayerState): CitySetup {
  const setup = getCitySetup(citySlug);
  setup.streetStates[streetSlug] = state;
  const added = setup.addedStreets.find((s) => s.slug === streetSlug);
  if (added) added.state = state;
  touch(setup);
  return setup;
}

export function setStreetStates(citySlug: string, streetSlugs: string[], state: LayerState): CitySetup {
  const setup = getCitySetup(citySlug);
  for (const slug of streetSlugs) {
    setup.streetStates[slug] = state;
    const added = setup.addedStreets.find((s) => s.slug === slug);
    if (added) added.state = state;
  }
  touch(setup);
  return setup;
}

/** Confirm every currently detected high street of the city (wildcard). */
export function confirmAllStreets(citySlug: string): CitySetup {
  const setup = getCitySetup(citySlug);
  setup.streetStates = { "*": "confirmed" };
  for (const s of setup.addedStreets) if (s.state !== "rejected") s.state = "confirmed";
  touch(setup);
  return setup;
}

export function addHighStreet(input: {
  citySlug: string;
  areaSlug: string;
  name: string;
  postcodes?: string[];
  source?: LocationOrigin;
  suggestedBy?: string;
  state?: LayerState;
}): RegistryHighStreet {
  const setup = getCitySetup(input.citySlug);
  const street: RegistryHighStreet = {
    id: nextId("rs"),
    citySlug: input.citySlug,
    areaSlug: input.areaSlug,
    slug: slugify(input.name),
    name: input.name,
    postcodes: input.postcodes ?? [],
    source: input.source ?? "manual",
    suggestedBy: input.suggestedBy ?? "Admin",
    state: input.state ?? "suggested",
    addedAt: now(),
  };
  setup.addedStreets.push(street);
  setup.streetStates[street.slug] = street.state;
  touch(setup);
  return street;
}

/** Registry-added high streets (from wizard or approved recommendations). */
export function getAddedStreets(filter?: { citySlug?: string; state?: LayerState }): RegistryHighStreet[] {
  const all: RegistryHighStreet[] = [];
  for (const setup of setups.values()) {
    for (const street of setup.addedStreets) all.push(street);
  }
  return all.filter(
    (s) =>
      (!filter?.citySlug || s.citySlug === filter.citySlug) &&
      (!filter?.state || s.state === filter.state)
  );
}

/**
 * Confirmed registry-added streets for one area — used by highStreetData.ts so
 * the public hierarchy only ever shows OFFICIAL locations.
 */
export function getConfirmedStreetAdditions(citySlug: string, areaSlug: string): RegistryHighStreet[] {
  const setup = setups.get(citySlug);
  if (!setup) return [];
  return setup.addedStreets.filter((s) => s.areaSlug === areaSlug && s.state === "confirmed");
}

/** Confirmed registry-added local areas for one city (public hierarchy). */
export function getConfirmedAreaAdditions(citySlug: string): RegistryLocalArea[] {
  const setup = setups.get(citySlug);
  if (!setup) return [];
  return setup.addedAreas.filter((a) => a.state === "confirmed");
}

/** All registry-added local areas (any state) — used for duplicate checks. */
export function getAddedAreas(citySlug?: string): RegistryLocalArea[] {
  const all: RegistryLocalArea[] = [];
  for (const setup of setups.values()) {
    for (const area of setup.addedAreas) all.push(area);
  }
  return all.filter((a) => !citySlug || a.citySlug === citySlug);
}

// -----------------------------------------------------------------------------
// Monitoring — activation confirmation checklist
// -----------------------------------------------------------------------------

/**
 * Build the per-city confirmation checklist the admin monitors.
 * `detectedAreas` / `detectedStreets` are the currently detected totals the
 * caller passes in from the location data modules.
 */
export function getConfirmationChecklist(
  citySlug: string,
  totals: { detectedAreas: number; detectedStreets: number }
): ConfirmationChecklist {
  const setup = getCitySetup(citySlug);

  const areaSlugsWildcard = setup.areaStates["*"];
  const streetWildcard = setup.streetStates["*"];

  // Wildcards count as "all detected confirmed" when they are "confirmed";
  // otherwise fall back to counting explicit slug entries.
  const areasConfirmed = areaSlugsWildcard === "confirmed"
    ? totals.detectedAreas
    : Object.keys(setup.areaStates).filter(
        (k) => k !== "*" && setup.areaStates[k] === "confirmed"
      ).length;
  const streetsConfirmed = streetWildcard === "confirmed"
    ? totals.detectedStreets
    : Object.keys(setup.streetStates).filter(
        (k) => k !== "*" && setup.streetStates[k] === "confirmed"
      ).length;

  const boundaryDone = setup.boundaryState === "confirmed";
  const areas = {
    confirmed: areasConfirmed,
    total: totals.detectedAreas,
    done: totals.detectedAreas > 0 && areasConfirmed >= totals.detectedAreas,
  };
  const streets = {
    confirmed: streetsConfirmed,
    total: totals.detectedStreets,
    done: totals.detectedStreets > 0 && streetsConfirmed >= totals.detectedStreets,
  };

  return { boundaryDone, areas, streets, allDone: boundaryDone && areas.done && streets.done };
}
