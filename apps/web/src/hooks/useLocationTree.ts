// =============================================================================
// useLocationTree — Fetches location tree and manages multi-city selection state
// Used by the campaign wizard's StepLocations component.
// Supports: National → City → Local Area → High Street → Business hierarchy.
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLocationTree } from "@/services/location.service";
import type {
  LocationTreeResponse,
  LocationTreeCity,
  LocationTreeLocalArea,
  LocationTreeHighStreet,
  LocationTreeBusiness,
  LocationCoverage,
} from "@/types/campaign-wizard";

export interface UseLocationTreeReturn {
  tree: LocationTreeResponse | null;
  loading: boolean;
  error: string | null;

  coverage: LocationCoverage;
  setCoverage: React.Dispatch<React.SetStateAction<LocationCoverage>>;

  // Flattened search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchableLocation[];

  // Summary counts
  totalCityCount: number;
  selectedCityCount: number;
  totalLocalAreaCount: number;
  selectedLocalAreaCount: number;
  totalHighStreetCount: number;
  selectedHighStreetCount: number;
  totalBusinessCount: number;
  selectedBusinessCount: number;

  // City actions
  toggleCity: (city: LocationTreeCity) => void;
  selectAllCities: () => void;
  clearAllCities: () => void;

  // Local area actions
  toggleLocalArea: (area: LocationTreeLocalArea) => void;
  selectAllLocalAreas: (cityId: string) => void;
  clearAllLocalAreas: (cityId: string) => void;

  // High street actions
  toggleHighStreet: (street: LocationTreeHighStreet) => void;
  selectAllHighStreets: (areaId: string) => void;
  clearAllHighStreets: (areaId: string) => void;

  // Business actions
  toggleBusiness: (business: LocationTreeBusiness) => void;
  selectAllBusinesses: (streetId: string) => void;
  clearAllBusinesses: (streetId: string) => void;

  // National
  toggleNational: () => void;

  // Bulk actions
  removeSelected: () => void;
  importLocations: (csv: string) => ImportResult;

  // Summary
  getSummary: () => LocationSummary;

  refresh: () => void;
}

export interface SearchableLocation {
  id: string;
  name: string;
  type: "city" | "local_area" | "high_street" | "business";
  cityName?: string;
  areaName?: string;
  streetName?: string;
  fullPath: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface LocationSummary {
  includeNational: boolean;
  cities: { id: string; name: string; areas: { id: string; name: string; streets: { id: string; name: string; businesses: { id: string; name: string }[] }[] }[] }[];
  totalLocations: number;
}

const DEMO_LOCATION_TREE: LocationTreeResponse = {
  national: {
    id: "uk-national",
    name: "United Kingdom",
    slug: "united-kingdom",
    type: "NATIONAL",
    fullPath: "/",
    publicStatus: "ACTIVE",
  },
  cities: [
    {
      id: "city-birmingham",
      name: "Birmingham",
      slug: "birmingham",
      type: "CITY",
      fullPath: "/birmingham",
      publicStatus: "ACTIVE",
      localAreas: [
        {
          id: "area-central",
          name: "Birmingham City Centre",
          slug: "birmingham-city-centre",
          type: "BOROUGH",
          fullPath: "/birmingham/birmingham-city-centre",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-new-street", name: "New Street", slug: "new-street", type: "HIGH_STREET", fullPath: "/birmingham/birmingham-city-centre/new-street", publicStatus: "ACTIVE", businesses: [
              { id: "biz-selfridges", name: "Selfridges Birmingham", slug: "selfridges", type: "BUSINESS", fullPath: "/birmingham/birmingham-city-centre/new-street/selfridges", publicStatus: "ACTIVE" },
              { id: "biz-boots-new-st", name: "Boots New Street", slug: "boots-new-street", type: "BUSINESS", fullPath: "/birmingham/birmingham-city-centre/new-street/boots", publicStatus: "ACTIVE" },
            ] },
            { id: "street-high-street", name: "High Street", slug: "high-street", type: "HIGH_STREET", fullPath: "/birmingham/birmingham-city-centre/high-street", publicStatus: "ACTIVE", businesses: [
              { id: "biz-primark", name: "Primark Birmingham", slug: "primark", type: "BUSINESS", fullPath: "/birmingham/birmingham-city-centre/high-street/primark", publicStatus: "ACTIVE" },
            ] },
            { id: "street-corporation-street", name: "Corporation Street", slug: "corporation-street", type: "HIGH_STREET", fullPath: "/birmingham/birmingham-city-centre/corporation-street", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-edgbaston",
          name: "Edgbaston",
          slug: "edgbaston",
          type: "BOROUGH",
          fullPath: "/birmingham/edgbaston",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-hagley-road", name: "Hagley Road", slug: "hagley-road", type: "HIGH_STREET", fullPath: "/birmingham/edgbaston/hagley-road", publicStatus: "ACTIVE", businesses: [
              { id: "biz-the-edgbaston", name: "The Edgbaston", slug: "the-edgbaston", type: "BUSINESS", fullPath: "/birmingham/edgbaston/hagley-road/the-edgbaston", publicStatus: "ACTIVE" },
            ] },
            { id: "street-bridge-road", name: "Bridge Road", slug: "bridge-road", type: "HIGH_STREET", fullPath: "/birmingham/edgbaston/bridge-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-moseley",
          name: "Moseley",
          slug: "moseley",
          type: "LOCAL_AREA",
          fullPath: "/birmingham/moseley",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-alcester-road", name: "Alcester Road", slug: "alcester-road", type: "HIGH_STREET", fullPath: "/birmingham/moseley/alcester-road", publicStatus: "ACTIVE", businesses: [
              { id: "biz-moseley-brewery", name: "Moseley Brewery", slug: "moseley-brewery", type: "BUSINESS", fullPath: "/birmingham/moseley/alcester-road/moseley-brewery", publicStatus: "ACTIVE" },
            ] },
            { id: "street-stone-road", name: "Stone Road", slug: "stone-road", type: "HIGH_STREET", fullPath: "/birmingham/moseley/stone-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-selly-oak",
          name: "Selly Oak",
          slug: "selly-oak",
          type: "DISTRICT",
          fullPath: "/birmingham/selly-oak",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-bristol-road", name: "Bristol Road", slug: "bristol-road", type: "HIGH_STREET", fullPath: "/birmingham/selly-oak/bristol-road", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-harborne-road", name: "Harborne Road", slug: "harborne-road", type: "HIGH_STREET", fullPath: "/birmingham/selly-oak/harborne-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
      ],
    },
    {
      id: "city-manchester",
      name: "Manchester",
      slug: "manchester",
      type: "CITY",
      fullPath: "/manchester",
      publicStatus: "ACTIVE",
      localAreas: [
        {
          id: "area-city-centre-mcr",
          name: "Manchester City Centre",
          slug: "manchester-city-centre",
          type: "BOROUGH",
          fullPath: "/manchester/manchester-city-centre",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-market-street-mcr", name: "Market Street", slug: "market-street", type: "HIGH_STREET", fullPath: "/manchester/manchester-city-centre/market-street", publicStatus: "ACTIVE", businesses: [
              { id: "biz-arndale", name: "Arndale Centre", slug: "arndale", type: "BUSINESS", fullPath: "/manchester/manchester-city-centre/market-street/arndale", publicStatus: "ACTIVE" },
            ] },
            { id: "street-deansgate", name: "Deansgate", slug: "deansgate", type: "HIGH_STREET", fullPath: "/manchester/manchester-city-centre/deansgate", publicStatus: "ACTIVE", businesses: [
              { id: "biz-deansgate-gatehouse", name: "The Gatehouse", slug: "gatehouse", type: "BUSINESS", fullPath: "/manchester/manchester-city-centre/deansgate/gatehouse", publicStatus: "ACTIVE" },
            ] },
            { id: "street-oldham-street", name: "Oldham Street", slug: "oldham-street", type: "HIGH_STREET", fullPath: "/manchester/manchester-city-centre/oldham-street", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-didsbury",
          name: "Didsbury",
          slug: "didsbury",
          type: "LOCAL_AREA",
          fullPath: "/manchester/didsbury",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-wilmslow-road", name: "Wilmslow Road", slug: "wilmslow-road", type: "HIGH_STREET", fullPath: "/manchester/didsbury/wilmslow-road", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-burton-road", name: "Burton Road", slug: "burton-road", type: "HIGH_STREET", fullPath: "/manchester/didsbury/burton-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-trafford",
          name: "Trafford",
          slug: "trafford",
          type: "BOROUGH",
          fullPath: "/manchester/trafford",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-sales", name: "Sales", slug: "sales", type: "HIGH_STREET", fullPath: "/manchester/trafford/sales", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-stretford-mall", name: "Stretford Mall", slug: "stretford-mall", type: "HIGH_STREET", fullPath: "/manchester/trafford/stretford-mall", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-levenshulme",
          name: "Levenshulme",
          slug: "levenshulme",
          type: "COMMERCIAL_AREA",
          fullPath: "/manchester/levenshulme",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-a56", name: "A56 / Stockport Road", slug: "a56-stockport-road", type: "HIGH_STREET", fullPath: "/manchester/levenshulme/a56-stockport-road", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-croft-street", name: "Croft Street", slug: "croft-street", type: "HIGH_STREET", fullPath: "/manchester/levenshulme/croft-street", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-salford",
          name: "Salford",
          slug: "salford",
          type: "BOROUGH",
          fullPath: "/manchester/salford",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-chapel-street", name: "Chapel Street", slug: "chapel-street", type: "HIGH_STREET", fullPath: "/manchester/salford/chapel-street", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-devonshire-street", name: "Devonshire Street", slug: "devonshire-street", type: "HIGH_STREET", fullPath: "/manchester/salford/devonshire-street", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
      ],
    },
    {
      id: "city-london",
      name: "London",
      slug: "london",
      type: "CITY",
      fullPath: "/london",
      publicStatus: "ACTIVE",
      localAreas: [
        {
          id: "area-westminster",
          name: "Westminster",
          slug: "westminster",
          type: "BOROUGH",
          fullPath: "/london/westminster",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-oxford-street", name: "Oxford Street", slug: "oxford-street", type: "HIGH_STREET", fullPath: "/london/westminster/oxford-street", publicStatus: "ACTIVE", businesses: [
              { id: "biz-selfridges-london", name: "Selfridges London", slug: "selfridges-london", type: "BUSINESS", fullPath: "/london/westminster/oxford-street/selfridges-london", publicStatus: "ACTIVE" },
              { id: "biz-john-lewis-oxford", name: "John Lewis Oxford Street", slug: "john-lewis", type: "BUSINESS", fullPath: "/london/westminster/oxford-street/john-lewis", publicStatus: "ACTIVE" },
            ] },
            { id: "street-regent-street", name: "Regent Street", slug: "regent-street", type: "HIGH_STREET", fullPath: "/london/westminster/regent-street", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-covent-garden", name: "Covent Garden", slug: "covent-garden", type: "HIGH_STREET", fullPath: "/london/westminster/covent-garden", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-camden",
          name: "Camden",
          slug: "camden",
          type: "BOROUGH",
          fullPath: "/london/camden",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-camden-high-street", name: "Camden High Street", slug: "camden-high-street", type: "HIGH_STREET", fullPath: "/london/camden/camden-high-street", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-chalk-farm-road", name: "Chalk Farm Road", slug: "chalk-farm-road", type: "HIGH_STREET", fullPath: "/london/camden/chalk-farm-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-islington",
          name: "Islington",
          slug: "islington",
          type: "BOROUGH",
          fullPath: "/london/islington",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-upper-street", name: "Upper Street", slug: "upper-street", type: "HIGH_STREET", fullPath: "/london/islington/upper-street", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-holloway-road", name: "Holloway Road", slug: "holloway-road", type: "HIGH_STREET", fullPath: "/london/islington/holloway-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
        {
          id: "area-southwark",
          name: "Southwark",
          slug: "southwark",
          type: "BOROUGH",
          fullPath: "/london/southwark",
          publicStatus: "ACTIVE",
          highStreets: [
            { id: "street-borough-high-street", name: "Borough High Street", slug: "borough-high-street", type: "HIGH_STREET", fullPath: "/london/southwark/borough-high-street", publicStatus: "ACTIVE", businesses: [] },
            { id: "street-walworth-road", name: "Walworth Road", slug: "walworth-road", type: "HIGH_STREET", fullPath: "/london/southwark/walworth-road", publicStatus: "ACTIVE", businesses: [] },
          ],
        },
      ],
    },
  ],
};

const DEFAULT_COVERAGE: LocationCoverage = {
  includeNational: false,
  selectedCities: [],
  excludedCities: [],
  selectedLocalAreas: [],
  excludedLocalAreas: [],
  selectedHighStreets: [],
  excludedHighStreets: [],
  selectedBusinesses: [],
  excludedBusinesses: [],
};

export function useLocationTree(initialCoverage?: LocationCoverage): UseLocationTreeReturn {
  const [tree, setTree] = useState<LocationTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<LocationCoverage>(initialCoverage ?? DEFAULT_COVERAGE);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocationTree();
      setTree(data);
    } catch {
      setTree(DEMO_LOCATION_TREE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Build search index
  const searchResults = useMemo(() => {
    if (!tree || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchableLocation[] = [];

    for (const city of tree.cities) {
      if (city.name.toLowerCase().includes(q) || city.slug.toLowerCase().includes(q)) {
        results.push({ id: city.id, name: city.name, type: "city", fullPath: city.fullPath ?? "" });
      }
      for (const area of city.localAreas) {
        if (area.name.toLowerCase().includes(q) || area.slug.toLowerCase().includes(q)) {
          results.push({ id: area.id, name: area.name, type: "local_area", cityName: city.name, fullPath: area.fullPath ?? "" });
        }
        for (const street of area.highStreets) {
          if (street.name.toLowerCase().includes(q) || street.slug.toLowerCase().includes(q)) {
            results.push({ id: street.id, name: street.name, type: "high_street", cityName: city.name, areaName: area.name, fullPath: street.fullPath ?? "" });
          }
          for (const biz of street.businesses) {
            if (biz.name.toLowerCase().includes(q) || biz.slug.toLowerCase().includes(q)) {
              results.push({ id: biz.id, name: biz.name, type: "business", cityName: city.name, areaName: area.name, streetName: street.name, fullPath: biz.fullPath ?? "" });
            }
          }
        }
      }
    }
    return results.slice(0, 20);
  }, [tree, searchQuery]);

  // Counts
  const totalCityCount = tree?.cities.length ?? 0;
  const selectedCityCount = coverage.selectedCities.length;

  const totalLocalAreaCount = useMemo(() => {
    if (!tree) return 0;
    return tree.cities.reduce((sum, c) => sum + c.localAreas.length, 0);
  }, [tree]);

  const selectedLocalAreaCount = useMemo(() => {
    if (coverage.includeNational) return totalLocalAreaCount;
    return coverage.selectedLocalAreas.length;
  }, [coverage, totalLocalAreaCount]);

  const totalHighStreetCount = useMemo(() => {
    if (!tree) return 0;
    return tree.cities.reduce((sum, c) => sum + c.localAreas.reduce((s, a) => s + a.highStreets.length, 0), 0);
  }, [tree]);

  const selectedHighStreetCount = useMemo(() => {
    if (coverage.includeNational) return totalHighStreetCount;
    return coverage.selectedHighStreets.length;
  }, [coverage, totalHighStreetCount]);

  const totalBusinessCount = useMemo(() => {
    if (!tree) return 0;
    return tree.cities.reduce((sum, c) => sum + c.localAreas.reduce((s, a) => s + a.highStreets.reduce((st, h) => st + h.businesses.length, 0), 0), 0);
  }, [tree]);

  const selectedBusinessCount = useMemo(() => {
    if (coverage.includeNational) return totalBusinessCount;
    return coverage.selectedBusinesses.length;
  }, [coverage, totalBusinessCount]);

  // National toggle
  const toggleNational = useCallback(() => {
    setCoverage((prev) => ({
      ...prev,
      includeNational: !prev.includeNational,
      selectedCities: prev.includeNational ? prev.selectedCities : [],
      selectedLocalAreas: prev.includeNational ? prev.selectedLocalAreas : [],
      selectedHighStreets: prev.includeNational ? prev.selectedHighStreets : [],
      selectedBusinesses: prev.includeNational ? prev.selectedBusinesses : [],
    }));
  }, []);

  // City actions
  const toggleCity = useCallback((city: LocationTreeCity) => {
    setCoverage((prev) => {
      const isSelected = prev.selectedCities.includes(city.id);
      if (isSelected) {
        // Remove city and all its children
        const areaIds = city.localAreas.map((a) => a.id);
        const streetIds = city.localAreas.flatMap((a) => a.highStreets.map((s) => s.id));
        const bizIds = city.localAreas.flatMap((a) => a.highStreets.flatMap((s) => s.businesses.map((b) => b.id)));
        return {
          ...prev,
          selectedCities: prev.selectedCities.filter((id) => id !== city.id),
          selectedLocalAreas: prev.selectedLocalAreas.filter((id) => !areaIds.includes(id)),
          selectedHighStreets: prev.selectedHighStreets.filter((id) => !streetIds.includes(id)),
          selectedBusinesses: prev.selectedBusinesses.filter((id) => !bizIds.includes(id)),
        };
      } else {
        return { ...prev, selectedCities: [...prev.selectedCities, city.id] };
      }
    });
  }, []);

  const selectAllCities = useCallback(() => {
    if (!tree) return;
    setCoverage((prev) => ({
      ...prev,
      selectedCities: tree.cities.map((c) => c.id),
    }));
  }, [tree]);

  const clearAllCities = useCallback(() => {
    setCoverage((prev) => ({
      ...prev,
      selectedCities: [],
      selectedLocalAreas: [],
      selectedHighStreets: [],
      selectedBusinesses: [],
    }));
  }, []);

  // Local area actions
  const toggleLocalArea = useCallback((area: LocationTreeLocalArea) => {
    setCoverage((prev) => {
      const isSelected = prev.selectedLocalAreas.includes(area.id);
      if (isSelected) {
        const streetIds = area.highStreets.map((s) => s.id);
        const bizIds = area.highStreets.flatMap((s) => s.businesses.map((b) => b.id));
        return {
          ...prev,
          selectedLocalAreas: prev.selectedLocalAreas.filter((id) => id !== area.id),
          selectedHighStreets: prev.selectedHighStreets.filter((id) => !streetIds.includes(id)),
          selectedBusinesses: prev.selectedBusinesses.filter((id) => !bizIds.includes(id)),
        };
      } else {
        return { ...prev, selectedLocalAreas: [...prev.selectedLocalAreas, area.id] };
      }
    });
  }, []);

  const selectAllLocalAreas = useCallback((cityId: string) => {
    if (!tree) return;
    const city = tree.cities.find((c) => c.id === cityId);
    if (!city) return;
    setCoverage((prev) => ({
      ...prev,
      selectedLocalAreas: [...new Set([...prev.selectedLocalAreas, ...city.localAreas.map((a) => a.id)])],
    }));
  }, [tree]);

  const clearAllLocalAreas = useCallback((cityId: string) => {
    if (!tree) return;
    const city = tree.cities.find((c) => c.id === cityId);
    if (!city) return;
    const areaIds = city.localAreas.map((a) => a.id);
    const streetIds = city.localAreas.flatMap((a) => a.highStreets.map((s) => s.id));
    const bizIds = city.localAreas.flatMap((a) => a.highStreets.flatMap((s) => s.businesses.map((b) => b.id)));
    setCoverage((prev) => ({
      ...prev,
      selectedLocalAreas: prev.selectedLocalAreas.filter((id) => !areaIds.includes(id)),
      selectedHighStreets: prev.selectedHighStreets.filter((id) => !streetIds.includes(id)),
      selectedBusinesses: prev.selectedBusinesses.filter((id) => !bizIds.includes(id)),
    }));
  }, [tree]);

  // High street actions
  const toggleHighStreet = useCallback((street: LocationTreeHighStreet) => {
    setCoverage((prev) => {
      const isSelected = prev.selectedHighStreets.includes(street.id);
      if (isSelected) {
        const bizIds = street.businesses.map((b) => b.id);
        return {
          ...prev,
          selectedHighStreets: prev.selectedHighStreets.filter((id) => id !== street.id),
          selectedBusinesses: prev.selectedBusinesses.filter((id) => !bizIds.includes(id)),
        };
      } else {
        return { ...prev, selectedHighStreets: [...prev.selectedHighStreets, street.id] };
      }
    });
  }, []);

  const selectAllHighStreets = useCallback((areaId: string) => {
    if (!tree) return;
    for (const city of tree.cities) {
      const area = city.localAreas.find((a) => a.id === areaId);
      if (area) {
        setCoverage((prev) => ({
          ...prev,
          selectedHighStreets: [...new Set([...prev.selectedHighStreets, ...area.highStreets.map((s) => s.id)])],
        }));
        break;
      }
    }
  }, [tree]);

  const clearAllHighStreets = useCallback((areaId: string) => {
    if (!tree) return;
    for (const city of tree.cities) {
      const area = city.localAreas.find((a) => a.id === areaId);
      if (area) {
        const streetIds = area.highStreets.map((s) => s.id);
        const bizIds = area.highStreets.flatMap((s) => s.businesses.map((b) => b.id));
        setCoverage((prev) => ({
          ...prev,
          selectedHighStreets: prev.selectedHighStreets.filter((id) => !streetIds.includes(id)),
          selectedBusinesses: prev.selectedBusinesses.filter((id) => !bizIds.includes(id)),
        }));
        break;
      }
    }
  }, [tree]);

  // Business actions
  const toggleBusiness = useCallback((business: LocationTreeBusiness) => {
    setCoverage((prev) => {
      const isSelected = prev.selectedBusinesses.includes(business.id);
      if (isSelected) {
        return { ...prev, selectedBusinesses: prev.selectedBusinesses.filter((id) => id !== business.id) };
      } else {
        return { ...prev, selectedBusinesses: [...prev.selectedBusinesses, business.id] };
      }
    });
  }, []);

  const selectAllBusinesses = useCallback((streetId: string) => {
    if (!tree) return;
    for (const city of tree.cities) {
      for (const area of city.localAreas) {
        const street = area.highStreets.find((s) => s.id === streetId);
        if (street) {
          setCoverage((prev) => ({
            ...prev,
            selectedBusinesses: [...new Set([...prev.selectedBusinesses, ...street.businesses.map((b) => b.id)])],
          }));
          return;
        }
      }
    }
  }, [tree]);

  const clearAllBusinesses = useCallback((streetId: string) => {
    if (!tree) return;
    for (const city of tree.cities) {
      for (const area of city.localAreas) {
        const street = area.highStreets.find((s) => s.id === streetId);
        if (street) {
          const bizIds = street.businesses.map((b) => b.id);
          setCoverage((prev) => ({
            ...prev,
            selectedBusinesses: prev.selectedBusinesses.filter((id) => !bizIds.includes(id)),
          }));
          return;
        }
      }
    }
  }, [tree]);

  // Remove all selected
  const removeSelected = useCallback(() => {
    setCoverage((prev) => ({
      ...prev,
      includeNational: false,
      selectedCities: [],
      selectedLocalAreas: [],
      selectedHighStreets: [],
      selectedBusinesses: [],
    }));
  }, []);

  // Import locations from CSV
  const importLocations = useCallback((csv: string): ImportResult => {
    if (!tree) return { success: false, imported: 0, skipped: 0, errors: ["Location tree not loaded"] };

    const lines = csv.trim().split("\n");
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes("city") ? 1 : 0;

    const newCities = new Set(coverage.selectedCities);
    const newAreas = new Set(coverage.selectedLocalAreas);
    const newStreets = new Set(coverage.selectedHighStreets);
    const newBiz = new Set(coverage.selectedBusinesses);

    for (let i = startIndex; i < lines.length; i++) {
      const parts = (lines[i] ?? "").split(",").map((p: string) => p.trim());
      const [cityName, areaName, streetName, bizName] = parts;

      if (!cityName) { skipped++; continue; }

      const city = tree.cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase() || c.slug.toLowerCase() === cityName.toLowerCase());
      if (!city) { errors.push(`Line ${i + 1}: City "${cityName}" not found`); skipped++; continue; }

      newCities.add(city.id);

      if (areaName) {
        const area = city.localAreas.find((a) => a.name.toLowerCase() === areaName.toLowerCase() || a.slug.toLowerCase() === areaName.toLowerCase());
        if (area) {
          newAreas.add(area.id);

          if (streetName) {
            const street = area.highStreets.find((s) => s.name.toLowerCase() === streetName.toLowerCase() || s.slug.toLowerCase() === streetName.toLowerCase());
            if (street) {
              newStreets.add(street.id);

              if (bizName) {
                const biz = street.businesses.find((b) => b.name.toLowerCase() === bizName.toLowerCase() || b.slug.toLowerCase() === bizName.toLowerCase());
                if (biz) {
                  newBiz.add(biz.id);
                  imported++;
                } else {
                  errors.push(`Line ${i + 1}: Business "${bizName}" not found on ${street.name}`);
                  skipped++;
                }
              } else {
                imported++;
              }
            } else {
              errors.push(`Line ${i + 1}: High Street "${streetName}" not found in ${area.name}`);
              skipped++;
            }
          } else {
            imported++;
          }
        } else {
          errors.push(`Line ${i + 1}: Local Area "${areaName}" not found in ${city.name}`);
          skipped++;
        }
      } else {
        imported++;
      }
    }

    setCoverage((prev) => ({
      ...prev,
      selectedCities: [...newCities],
      selectedLocalAreas: [...newAreas],
      selectedHighStreets: [...newStreets],
      selectedBusinesses: [...newBiz],
    }));

    return { success: errors.length === 0, imported, skipped, errors };
  }, [tree, coverage]);

  // Summary
  const getSummary = useCallback((): LocationSummary => {
    if (!tree) return { includeNational: false, cities: [], totalLocations: 0 };

    const cities: LocationSummary["cities"] = [];
    let total = 0;

    for (const city of tree.cities) {
      if (!coverage.selectedCities.includes(city.id) && !coverage.includeNational) continue;

      const areas: LocationSummary["cities"][number]["areas"] = [];

      for (const area of city.localAreas) {
        if (!coverage.selectedLocalAreas.includes(area.id) && !coverage.includeNational) continue;

        const streets: LocationSummary["cities"][number]["areas"][number]["streets"] = [];

        for (const street of area.highStreets) {
          if (!coverage.selectedHighStreets.includes(street.id) && !coverage.includeNational) continue;

          const businesses = street.businesses.filter(
            (b) => coverage.selectedBusinesses.includes(b.id) || coverage.includeNational,
          );
          total += businesses.length || 1;
          streets.push({ id: street.id, name: street.name, businesses });
        }

        total += streets.length || 1;
        areas.push({ id: area.id, name: area.name, streets });
      }

      total += areas.length || 1;
      cities.push({ id: city.id, name: city.name, areas });
    }

    if (coverage.includeNational) total += 1;

    return { includeNational: coverage.includeNational, cities, totalLocations: total };
  }, [tree, coverage]);

  return {
    tree,
    loading,
    error,
    coverage,
    setCoverage,
    searchQuery,
    setSearchQuery,
    searchResults,
    totalCityCount,
    selectedCityCount,
    totalLocalAreaCount,
    selectedLocalAreaCount,
    totalHighStreetCount,
    selectedHighStreetCount,
    totalBusinessCount,
    selectedBusinessCount,
    toggleCity,
    selectAllCities,
    clearAllCities,
    toggleLocalArea,
    selectAllLocalAreas,
    clearAllLocalAreas,
    toggleHighStreet,
    selectAllHighStreets,
    clearAllHighStreets,
    toggleBusiness,
    selectAllBusinesses,
    clearAllBusinesses,
    toggleNational,
    removeSelected,
    importLocations,
    getSummary,
    refresh: loadTree,
  };
}
