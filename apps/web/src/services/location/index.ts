import type {
  LocationFlatItem,
  LocationTreeBusiness,
  LocationTreeCity,
  LocationTreeHighStreet,
  LocationTreeLocalArea,
  LocationTreeNode,
  LocationTreeResponse,
} from "@/types/campaign-wizard";
import type {
  HubLocation,
  LocationPublicStatus,
} from "@/types/uk-hub";
import api from "../api";

const API_BASE = "/api";

// ── Location tree normalisation ──

interface RawLocationNode {
  id: string;
  name: string;
  slug: string;
  type?: string;
  parentId?: string | null;
  activationStatus?: string | null;
  publicStatus?: string | null;
  isActive?: boolean;
  children?: RawLocationNode[];
}

function toBaseNode(node: RawLocationNode, parentName: string): LocationTreeNode {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    type: node.type ?? "UNKNOWN",
    fullPath: [parentName, node.name].filter(Boolean).join(" / ") || null,
    publicStatus:
      node.publicStatus ??
      node.activationStatus ??
      (node.isActive === false ? "INACTIVE" : "ACTIVE"),
  };
}

/**
 * The public `/locations/tree` endpoint returns raw root locations with nested
 * `children`. The wizard expects a `{ national, cities }` shape with
 * `localAreas`, `highStreets` and `businesses` keys, so normalise it here.
 */
function normalizeLocationTree(raw: unknown): LocationTreeResponse {
  let roots: RawLocationNode[] = [];

  if (Array.isArray(raw)) {
    roots = raw as RawLocationNode[];
  } else if (raw && typeof raw === "object") {
    const candidate = raw as { cities?: unknown; data?: unknown };
    if (Array.isArray(candidate.cities)) {
      roots = candidate.cities as RawLocationNode[];
    } else if (Array.isArray(candidate.data)) {
      roots = candidate.data as RawLocationNode[];
    }
  }

  // The public tree is rooted at the National Hub. Location pickers want the
  // city layer, so unwrap a NATIONAL container before normalising.
  const nationalRoots = roots.filter((node) => (node.type ?? "").toUpperCase() === "NATIONAL");
  if (nationalRoots.length > 0) {
    roots = nationalRoots.flatMap((node) => node.children ?? []);
  }

  const cities: LocationTreeCity[] = roots
    .filter((node) => (node.type ?? "CITY").toUpperCase() === "CITY")
    .map((city) => {
      const cityBase = toBaseNode(city, "");
      const localAreas: LocationTreeLocalArea[] = (city.children ?? []).map(
        (area) => {
          const areaBase = toBaseNode(area, cityBase.fullPath ?? "");
          const highStreets: LocationTreeHighStreet[] = (area.children ?? []).map(
            (street) => {
              const streetBase = toBaseNode(street, areaBase.fullPath ?? "");
              const businesses: LocationTreeBusiness[] = (street.children ?? []).map(
                (business) => ({
                  ...toBaseNode(business, streetBase.fullPath ?? ""),
                  type: "BUSINESS",
                }),
              );
              return {
                ...streetBase,
                type: "HIGH_STREET",
                businesses,
              };
            },
          );
          return {
            ...areaBase,
            type: (areaBase.type as LocationTreeLocalArea["type"]) ?? "LOCAL_AREA",
            highStreets,
          };
        },
      );
      return {
        ...cityBase,
        type: "CITY",
        localAreas,
      };
    });

  return { national: null, cities };
}

// ── Public Endpoints ──

export async function fetchLocationTree(): Promise<LocationTreeResponse> {
  const res = await api.get<unknown>("/locations/tree");
  return normalizeLocationTree(res);
}

export async function resolveHubPath(path: string): Promise<any | null> {
  try {
    return await api.get("/locations/resolve", { params: { path } });
  } catch {
    return null;
  }
}

export async function fetchLocations(params?: {
  type?: string;
  parentId?: string;
  search?: string;
}): Promise<{ locations: LocationFlatItem[] }> {
  const res = await api.get<{ locations: LocationFlatItem[] }>("/locations", { params });
  return res;
}

export async function fetchCityDetail(slug: string): Promise<any> {
  const res = await api.get(`/hub/cities/${slug}`);
  return res;
}

export async function fetchHubCities(): Promise<HubLocation[]> {
  try {
    const res = await api.get<any[]>("/hub/cities");
    return (res || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: "CITY",
      status: (c.status || "active").toLowerCase(),
      publicStatus: c.publicStatus || (c.status === "ACTIVE" ? "ACTIVE" : c.status === "MAKING_PROGRESS" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"),
      region: c.region || "UK",
      population: c.population || "500,000",
      fundingTarget: c.fundingTarget || 100000,
      fundingRaised: c.fundingRaised || 0,
      latitude: c.latitude,
      longitude: c.longitude,
      mapX: c.mapX,
      mapY: c.mapY,
      mapVisible: c.mapEnabled ?? true,
      mapEnabled: c.mapEnabled ?? true,
      mapZoomLevel: c.mapZoomLevel ?? 6,
      fullPath: c.fullPath,
      primaryImage: c.imageOne,
      secondaryImage: c.imageTwo,
      shortDescription: c.shortDescription || `${c.name} Hub`,
      description: c.description || `${c.name} Hub Activation`,
      isActive: c.isActive ?? true,
      isPublic: c.isPublic ?? true,
      boroughsCount: c.boroughsCount || c.localAreasCount || 0,
      highStreetsCount: c.highStreetsCount || 0,
      businessesCount: c.businessesCount || 0,
    } as unknown as HubLocation));
  } catch {
    return [];
  }
}

// ── Admin Endpoints ──

export async function fetchAdminLocations(params?: {
  type?: string;
  parentId?: string;
  search?: string;
  includeInactive?: boolean;
}): Promise<{ locations: LocationFlatItem[] }> {
  const token = localStorage.getItem("fd_access_token");
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.parentId) qs.set("parentId", params.parentId);
  if (params?.search) qs.set("search", params.search);
  if (params?.includeInactive) qs.set("includeInactive", "true");

  const res = await fetch(`${API_BASE}/admin/locations?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch admin locations");
  return res.json();
}

// ── Pure Helper Functions ──

export function getEffectiveStatus(location: HubLocation): LocationPublicStatus {
  return location.statusOverride || location.publicStatus || "NEEDS_ACTIVATION";
}

export function getActivationProgress(location: HubLocation): number {
  const target = location.fundingTarget ?? 0;
  const raised = location.fundingRaised ?? 0;
  if (!location.activationThreshold || location.activationThreshold === 0) {
    return target > 0
      ? Math.min(Math.round((raised / target) * 100), 100)
      : 0;
  }
  const fundingPct = target > 0
    ? Math.min(Math.round((raised / target) * 100), 100)
    : 0;
  return Math.min(Math.round((fundingPct / location.activationThreshold) * 100), 100);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineDistance(lat1, lon1, lat2, lon2);
}

export interface SplitDestinationItem {
  slug: string;
  name: string;
  parentName?: string;
}

export interface SplitDestinations {
  cities: SplitDestinationItem[];
  boroughs: SplitDestinationItem[];
  highStreets: SplitDestinationItem[];
}

const CANONICAL_CITIES: SplitDestinationItem[] = [
  { slug: "birmingham", name: "Birmingham" },
  { slug: "manchester", name: "Manchester" },
  { slug: "london", name: "London" },
  { slug: "leeds", name: "Leeds" },
  { slug: "worcester", name: "Worcester" },
  { slug: "liverpool", name: "Liverpool" },
  { slug: "bristol", name: "Bristol" },
  { slug: "sheffield", name: "Sheffield" },
  { slug: "newcastle", name: "Newcastle" },
  { slug: "glasgow", name: "Glasgow" },
];

const CANONICAL_BOROUGHS: SplitDestinationItem[] = [
  { slug: "camden", name: "Camden", parentName: "London" },
  { slug: "islington", name: "Islington", parentName: "London" },
  { slug: "westminster", name: "Westminster", parentName: "London" },
  { slug: "digbeth", name: "Digbeth", parentName: "Birmingham" },
  { slug: "northern-quarter", name: "Northern Quarter", parentName: "Manchester" },
  { slug: "worcester-city-centre", name: "City Centre", parentName: "Worcester" },
];

const CANONICAL_HIGH_STREETS: SplitDestinationItem[] = [
  { slug: "camden-high-street", name: "Camden High Street", parentName: "Camden" },
  { slug: "upper-street", name: "Upper Street", parentName: "Islington" },
  { slug: "broad-street", name: "Broad Street", parentName: "Birmingham" },
  { slug: "deansgate", name: "Deansgate", parentName: "Manchester" },
  { slug: "worcester-high-street", name: "Worcester High Street", parentName: "City Centre" },
];

export function getSplitDestinations(scopeCitySlug?: string | null): SplitDestinations {
  const cities = scopeCitySlug
    ? CANONICAL_CITIES.filter((c) => c.slug === scopeCitySlug)
    : CANONICAL_CITIES;
  const boroughs = scopeCitySlug
    ? CANONICAL_BOROUGHS.filter((b) => {
        const city = CANONICAL_CITIES.find((c) => c.slug === scopeCitySlug);
        return city && b.parentName === city.name;
      })
    : CANONICAL_BOROUGHS;
  const highStreets = scopeCitySlug
    ? CANONICAL_HIGH_STREETS.filter((h) => {
        const borough = CANONICAL_BOROUGHS.find((b) => b.name === h.parentName);
        const city = CANONICAL_CITIES.find((c) => c.slug === scopeCitySlug);
        return borough && city && borough.parentName === city.name;
      })
    : CANONICAL_HIGH_STREETS;

  return { cities, boroughs, highStreets };
}

export async function getLocationBySlug(slug: string): Promise<HubLocation | null> {
  try {
    const res = await api.get<any>(`/locations/slug/${slug}`);
    return res;
  } catch {
    const city = CANONICAL_CITIES.find((c) => c.slug === slug);
    if (city) {
      return {
        id: city.slug,
        name: city.name,
        slug: city.slug,
        type: "CITY",
        internalLifecycle: "ACTIVE",
        publicStatus: "ACTIVE",
        isActive: true,
        isPublic: true,
        mapVisible: true,
        isFeaturedNationally: true,
        fundingTarget: 100000,
        fundingRaised: 45000,
        foundingBusinessTotal: 50,
        foundingBusinessAllocated: 25,
        foundingConsumerTotal: 200,
        foundingConsumerAllocated: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }
}

export async function getLocationById(id: string): Promise<HubLocation | null> {
  try {
    const res = await api.get<any>(`/locations/${id}`);
    return res;
  } catch {
    return null;
  }
}

export async function getCityWithHierarchy(citySlug: string) {
  try {
    const [city, hubCities] = await Promise.all([
      fetchCityDetail(citySlug),
      fetchHubCities().catch(() => []),
    ]);
    if (!city) return null;
    const hubCity = hubCities.find((item) => item.slug === citySlug || item.id === city.id);
    const localAreas = (city.children || []).map((area: any) => ({
      ...area,
      highStreets: area.children?.length ?? 0,
      highStreetsList: (area.children || []).map((hs: any) => ({
        ...hs,
      })),
    }));
    return {
      ...city,
      ...(hubCity || {}),
      localAreas,
    };
  } catch {
    return null;
  }
}

export async function getLocalAreasForCity(citySlug: string) {
  const detail = await getCityWithHierarchy(citySlug);
  if (detail?.localAreas && detail.localAreas.length > 0) {
    return detail.localAreas;
  }
  return CANONICAL_BOROUGHS.map((b) => ({
    id: b.slug,
    name: b.name,
    slug: b.slug,
    highStreets: 2,
    highStreetsList: CANONICAL_HIGH_STREETS.filter((h) => h.parentName === b.name).map((h) => ({
      id: h.slug,
      name: h.name,
      slug: h.slug,
    })),
  }));
}

export async function getHighStreetsForArea(citySlug: string, areaSlug: string) {
  const areas = await getLocalAreasForCity(citySlug);
  const matched = areas.find((a: any) => a.slug === areaSlug);
  if (matched?.highStreetsList && matched.highStreetsList.length > 0) {
    return matched.highStreetsList.map((hs: any) => ({
      ...hs,
      businesses: 12,
      campaigns: 2,
    }));
  }
  return CANONICAL_HIGH_STREETS.map((h) => ({
    id: h.slug,
    name: h.name,
    slug: h.slug,
    businesses: 10,
    campaigns: 1,
  }));
}

export const locationService = {
  fetchLocationTree,
  fetchLocations,
  fetchCityDetail,
  fetchHubCities,
  fetchAdminLocations,
  resolveHubPath,
  getEffectiveStatus,
  getActivationProgress,
  calculateDistance,
  getSplitDestinations,
  getLocationBySlug,
  getLocationById,
  getCityWithHierarchy,
  getLocalAreasForCity,
  getHighStreetsForArea,
};

export default locationService;
export type * from "./type";
