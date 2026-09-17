// =============================================================================
// useLocationTree — Fetches location tree and manages selection state
// Used by the campaign wizard's StepLocations component.
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLocationTree } from "@/services/location.service";
import type {
  LocationTreeResponse,
  LocationTreeCity,
  LocationTreeLocalArea,
  LocationTreeHighStreet,
  LocationCoverage,
} from "@/types/campaign-wizard";

export interface UseLocationTreeReturn {
  tree: LocationTreeResponse | null;
  loading: boolean;
  error: string | null;

  // Selection state
  coverage: LocationCoverage;
  setCoverage: React.Dispatch<React.SetStateAction<LocationCoverage>>;

  // Helper getters
  selectedCity: LocationTreeCity | null;
  selectedLocalAreaCount: number;
  totalLocalAreaCount: number;
  selectedHighStreetCount: number;
  totalHighStreetCount: number;

  // Actions
  selectCity: (city: LocationTreeCity) => void;
  toggleLocalArea: (area: LocationTreeLocalArea) => void;
  toggleHighStreet: (street: LocationTreeHighStreet) => void;
  setAllLocalAreas: (selected: boolean) => void;
  setAllHighStreets: (selected: boolean) => void;
  excludeLocalArea: (areaId: string) => void;
  includeLocalArea: (areaId: string) => void;
  excludeHighStreet: (streetId: string) => void;
  includeHighStreet: (streetId: string) => void;

  // Summary
  getSummary: () => {
    cityName: string;
    localAreaMode: string;
    highStreetMode: string;
    selectedLocalAreas: string[];
    excludedLocalAreas: string[];
    selectedHighStreets: string[];
    excludedHighStreets: string[];
  };

  refresh: () => void;
}

const DEMO_LOCATION_TREE: LocationTreeResponse = {
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
            { id: "street-new-street", name: "New Street", slug: "new-street", type: "HIGH_STREET", fullPath: "/birmingham/birmingham-city-centre/new-street", publicStatus: "ACTIVE" },
            { id: "street-high-street", name: "High Street", slug: "high-street", type: "HIGH_STREET", fullPath: "/birmingham/birmingham-city-centre/high-street", publicStatus: "ACTIVE" },
            { id: "street-corporation-street", name: "Corporation Street", slug: "corporation-street", type: "HIGH_STREET", fullPath: "/birmingham/birmingham-city-centre/corporation-street", publicStatus: "ACTIVE" },
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
            { id: "street-hagley-road", name: "Hagley Road", slug: "hagley-road", type: "HIGH_STREET", fullPath: "/birmingham/edgbaston/hagley-road", publicStatus: "ACTIVE" },
            { id: "street-bridge-road", name: "Bridge Road", slug: "bridge-road", type: "HIGH_STREET", fullPath: "/birmingham/edgbaston/bridge-road", publicStatus: "ACTIVE" },
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
            { id: "street-alcester-road", name: "Alcester Road", slug: "alcester-road", type: "HIGH_STREET", fullPath: "/birmingham/moseley/alcester-road", publicStatus: "ACTIVE" },
            { id: "street-stone-road", name: "Stone Road", slug: "stone-road", type: "HIGH_STREET", fullPath: "/birmingham/moseley/stone-road", publicStatus: "ACTIVE" },
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
            { id: "street-bristol-road", name: "Bristol Road", slug: "bristol-road", type: "HIGH_STREET", fullPath: "/birmingham/selly-oak/bristol-road", publicStatus: "ACTIVE" },
            { id: "street-harborne-road", name: "Harborne Road", slug: "harborne-road", type: "HIGH_STREET", fullPath: "/birmingham/selly-oak/harborne-road", publicStatus: "ACTIVE" },
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
            { id: "street-market-street-mcr", name: "Market Street", slug: "market-street", type: "HIGH_STREET", fullPath: "/manchester/manchester-city-centre/market-street", publicStatus: "ACTIVE" },
            { id: "street-deansgate", name: "Deansgate", slug: "deansgate", type: "HIGH_STREET", fullPath: "/manchester/manchester-city-centre/deansgate", publicStatus: "ACTIVE" },
            { id: "street-oldham-street", name: "Oldham Street", slug: "oldham-street", type: "HIGH_STREET", fullPath: "/manchester/manchester-city-centre/oldham-street", publicStatus: "ACTIVE" },
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
            { id: "street-wilmslow-road", name: "Wilmslow Road", slug: "wilmslow-road", type: "HIGH_STREET", fullPath: "/manchester/didsbury/wilmslow-road", publicStatus: "ACTIVE" },
            { id: "street-burton-road", name: "Burton Road", slug: "burton-road", type: "HIGH_STREET", fullPath: "/manchester/didsbury/burton-road", publicStatus: "ACTIVE" },
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
            { id: "street-sales", name: "Sales", slug: "sales", type: "HIGH_STREET", fullPath: "/manchester/trafford/sales", publicStatus: "ACTIVE" },
            { id: "street-stretford-mall", name: "Stretford Mall", slug: "stretford-mall", type: "HIGH_STREET", fullPath: "/manchester/trafford/stretford-mall", publicStatus: "ACTIVE" },
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
            { id: "street-a56", name: "A56 / Stockport Road", slug: "a56-stockport-road", type: "HIGH_STREET", fullPath: "/manchester/levenshulme/a56-stockport-road", publicStatus: "ACTIVE" },
            { id: "street-croft-street", name: "Croft Street", slug: "croft-street", type: "HIGH_STREET", fullPath: "/manchester/levenshulme/croft-street", publicStatus: "ACTIVE" },
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
            { id: "street-chapel-street", name: "Chapel Street", slug: "chapel-street", type: "HIGH_STREET", fullPath: "/manchester/salford/chapel-street", publicStatus: "ACTIVE" },
            { id: "street-devonshire-street", name: "Devonshire Street", slug: "devonshire-street", type: "HIGH_STREET", fullPath: "/manchester/salford/devonshire-street", publicStatus: "ACTIVE" },
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
            { id: "street-oxford-street", name: "Oxford Street", slug: "oxford-street", type: "HIGH_STREET", fullPath: "/london/westminster/oxford-street", publicStatus: "ACTIVE" },
            { id: "street-regent-street", name: "Regent Street", slug: "regent-street", type: "HIGH_STREET", fullPath: "/london/westminster/regent-street", publicStatus: "ACTIVE" },
            { id: "street-covent-garden", name: "Covent Garden", slug: "covent-garden", type: "HIGH_STREET", fullPath: "/london/westminster/covent-garden", publicStatus: "ACTIVE" },
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
            { id: "street-camden-high-street", name: "Camden High Street", slug: "camden-high-street", type: "HIGH_STREET", fullPath: "/london/camden/camden-high-street", publicStatus: "ACTIVE" },
            { id: "street-chalk-farm-road", name: "Chalk Farm Road", slug: "chalk-farm-road", type: "HIGH_STREET", fullPath: "/london/camden/chalk-farm-road", publicStatus: "ACTIVE" },
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
            { id: "street-upper-street", name: "Upper Street", slug: "upper-street", type: "HIGH_STREET", fullPath: "/london/islington/upper-street", publicStatus: "ACTIVE" },
            { id: "street-holloway-road", name: "Holloway Road", slug: "holloway-road", type: "HIGH_STREET", fullPath: "/london/islington/holloway-road", publicStatus: "ACTIVE" },
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
            { id: "street-borough-high-street", name: "Borough High Street", slug: "borough-high-street", type: "HIGH_STREET", fullPath: "/london/southwark/borough-high-street", publicStatus: "ACTIVE" },
            { id: "street-walworth-road", name: "Walworth Road", slug: "walworth-road", type: "HIGH_STREET", fullPath: "/london/southwark/walworth-road", publicStatus: "ACTIVE" },
          ],
        },
      ],
    },
  ],
};

const DEFAULT_COVERAGE: LocationCoverage = {
  mode: "all",
  selectedLocalAreas: [],
  excludedLocalAreas: [],
  highStreetMode: "all",
  selectedHighStreets: [],
  excludedHighStreets: [],
};

export function useLocationTree(initialCoverage?: LocationCoverage): UseLocationTreeReturn {
  const [tree, setTree] = useState<LocationTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<LocationCoverage>(
    initialCoverage ?? DEFAULT_COVERAGE,
  );
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>("");

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

  // Find selected city from tree
  const selectedCity = useMemo(() => {
    if (!tree || !selectedCitySlug) return null;
    return tree.cities.find((c) => c.slug === selectedCitySlug) ?? null;
  }, [tree, selectedCitySlug]);

  // Count helpers
  const totalLocalAreaCount = useMemo(() => {
    if (!selectedCity) return 0;
    return selectedCity.localAreas.length;
  }, [selectedCity]);

  const totalHighStreetCount = useMemo(() => {
    if (!selectedCity) return 0;
    return selectedCity.localAreas.reduce((sum, a) => sum + a.highStreets.length, 0);
  }, [selectedCity]);

  const selectedLocalAreaCount = useMemo(() => {
    if (coverage.mode === "all") return totalLocalAreaCount - coverage.excludedLocalAreas.length;
    return coverage.selectedLocalAreas.length;
  }, [coverage, totalLocalAreaCount]);

  const selectedHighStreetCount = useMemo(() => {
    if (!selectedCity) return 0;
    if (coverage.highStreetMode === "all") {
      let total = 0;
      for (const area of selectedCity.localAreas) {
        total += area.highStreets.length;
      }
      return total - coverage.excludedHighStreets.length;
    }
    return coverage.selectedHighStreets.length;
  }, [coverage, selectedCity]);

  // Actions
  const selectCity = useCallback((city: LocationTreeCity) => {
    setSelectedCitySlug(city.slug);
    setCoverage(DEFAULT_COVERAGE);
  }, []);

  const toggleLocalArea = useCallback(
    (area: LocationTreeLocalArea) => {
      setCoverage((prev) => {
        const isSelected = prev.mode === "all"
          ? !prev.excludedLocalAreas.includes(area.id)
          : prev.selectedLocalAreas.includes(area.id);

        if (prev.mode === "all") {
          return {
            ...prev,
            excludedLocalAreas: isSelected
              ? [...prev.excludedLocalAreas, area.id]
              : prev.excludedLocalAreas.filter((id) => id !== area.id),
          };
        } else {
          return {
            ...prev,
            selectedLocalAreas: isSelected
              ? prev.selectedLocalAreas.filter((id) => id !== area.id)
              : [...prev.selectedLocalAreas, area.id],
          };
        }
      });
    },
    [],
  );

  const toggleHighStreet = useCallback(
    (street: LocationTreeHighStreet) => {
      setCoverage((prev) => {
        const isSelected = prev.highStreetMode === "all"
          ? !prev.excludedHighStreets.includes(street.id)
          : prev.selectedHighStreets.includes(street.id);

        if (prev.highStreetMode === "all") {
          return {
            ...prev,
            excludedHighStreets: isSelected
              ? [...prev.excludedHighStreets, street.id]
              : prev.excludedHighStreets.filter((id) => id !== street.id),
          };
        } else {
          return {
            ...prev,
            selectedHighStreets: isSelected
              ? prev.selectedHighStreets.filter((id) => id !== street.id)
              : [...prev.selectedHighStreets, street.id],
          };
        }
      });
    },
    [],
  );

  const setAllLocalAreas = useCallback((selected: boolean) => {
    setCoverage((prev) => ({
      ...prev,
      mode: selected ? "all" : "selected",
      selectedLocalAreas: [],
      excludedLocalAreas: [],
    }));
  }, []);

  const setAllHighStreets = useCallback((selected: boolean) => {
    setCoverage((prev) => ({
      ...prev,
      highStreetMode: selected ? "all" : "selected",
      selectedHighStreets: [],
      excludedHighStreets: [],
    }));
  }, []);

  const excludeLocalArea = useCallback((areaId: string) => {
    setCoverage((prev) => ({
      ...prev,
      excludedLocalAreas: [...prev.excludedLocalAreas, areaId],
    }));
  }, []);

  const includeLocalArea = useCallback((areaId: string) => {
    setCoverage((prev) => ({
      ...prev,
      excludedLocalAreas: prev.excludedLocalAreas.filter((id) => id !== areaId),
    }));
  }, []);

  const excludeHighStreet = useCallback((streetId: string) => {
    setCoverage((prev) => ({
      ...prev,
      excludedHighStreets: [...prev.excludedHighStreets, streetId],
    }));
  }, []);

  const includeHighStreet = useCallback((streetId: string) => {
    setCoverage((prev) => ({
      ...prev,
      excludedHighStreets: prev.excludedHighStreets.filter((id) => id !== streetId),
    }));
  }, []);

  const getSummary = useCallback(() => {
    return {
      cityName: selectedCity?.name ?? "",
      localAreaMode: coverage.mode === "all" ? "All" : "Selected",
      highStreetMode: coverage.highStreetMode === "all" ? "All" : "Selected",
      selectedLocalAreas: coverage.selectedLocalAreas,
      excludedLocalAreas: coverage.excludedLocalAreas,
      selectedHighStreets: coverage.selectedHighStreets,
      excludedHighStreets: coverage.excludedHighStreets,
    };
  }, [selectedCity, coverage]);

  return {
    tree,
    loading,
    error,
    coverage,
    setCoverage,
    selectedCity,
    selectedLocalAreaCount,
    totalLocalAreaCount,
    selectedHighStreetCount,
    totalHighStreetCount,
    selectCity,
    toggleLocalArea,
    toggleHighStreet,
    setAllLocalAreas,
    setAllHighStreets,
    excludeLocalArea,
    includeLocalArea,
    excludeHighStreet,
    includeHighStreet,
    getSummary,
    refresh: loadTree,
  };
}
