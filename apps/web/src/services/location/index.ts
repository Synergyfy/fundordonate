import type {
  LocationFlatItem,
  LocationTreeResponse,
} from "@/types/campaign-wizard";
import type {
  HubLocation,
  LocationPublicStatus,
} from "@/types/uk-hub";
import api from "../api";

const API_BASE = "/api";

// ── Public Endpoints ──

export async function fetchLocationTree(): Promise<LocationTreeResponse> {
  const res = await api.get<LocationTreeResponse>("/locations/tree");
  return res;
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
    const city = await fetchCityDetail(citySlug);
    if (!city) return null;
    const localAreas = (city.children || []).map((area: any) => ({
      id: area.id,
      name: area.name,
      slug: area.slug,
      highStreets: area.children?.length ?? 0,
      highStreetsList: (area.children || []).map((hs: any) => ({
        id: hs.id,
        name: hs.name,
        slug: hs.slug,
      })),
    }));
    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
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
