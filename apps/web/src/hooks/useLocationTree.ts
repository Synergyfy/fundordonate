// =============================================================================
// useLocationTree — Fetches location tree and manages multi-city selection state
// Used by the campaign wizard's StepLocations component.
// Supports: National → City → Local Area → High Street → Business hierarchy.
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLocationTree } from "@/services/location";
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

  // Guard against an unexpected payload shape (the API has returned a flat
  // list in the past) so consumers never crash on `tree.cities`.
  const cities = useMemo<LocationTreeCity[]>(
    () => (tree && Array.isArray(tree.cities) ? tree.cities : []),
    [tree],
  );

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocationTree();
      setTree(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load locations");
      setTree(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Build search index
  const searchResults = useMemo(() => {
    if (!cities.length || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchableLocation[] = [];

    for (const city of cities) {
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
  }, [cities, searchQuery]);

  // Counts
  const totalCityCount = cities.length;
  const selectedCityCount = coverage.selectedCities.length;

  const totalLocalAreaCount = useMemo(() => {
    return cities.reduce((sum, c) => sum + c.localAreas.length, 0);
  }, [cities]);

  const selectedLocalAreaCount = useMemo(() => {
    if (coverage.includeNational) return totalLocalAreaCount;
    return coverage.selectedLocalAreas.length;
  }, [coverage, totalLocalAreaCount]);

  const totalHighStreetCount = useMemo(() => {
    return cities.reduce((sum, c) => sum + c.localAreas.reduce((s, a) => s + a.highStreets.length, 0), 0);
  }, [cities]);

  const selectedHighStreetCount = useMemo(() => {
    if (coverage.includeNational) return totalHighStreetCount;
    return coverage.selectedHighStreets.length;
  }, [coverage, totalHighStreetCount]);

  const totalBusinessCount = useMemo(() => {
    return cities.reduce((sum, c) => sum + c.localAreas.reduce((s, a) => s + a.highStreets.reduce((st, h) => st + h.businesses.length, 0), 0), 0);
  }, [cities]);

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
    if (!cities.length) return;
    setCoverage((prev) => ({
      ...prev,
      selectedCities: cities.map((c) => c.id),
    }));
  }, [cities]);

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
    if (!cities.length) return;
    const city = cities.find((c) => c.id === cityId);
    if (!city) return;
    setCoverage((prev) => ({
      ...prev,
      selectedLocalAreas: [...new Set([...prev.selectedLocalAreas, ...city.localAreas.map((a) => a.id)])],
    }));
  }, [cities]);

  const clearAllLocalAreas = useCallback((cityId: string) => {
    if (!cities.length) return;
    const city = cities.find((c) => c.id === cityId);
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
  }, [cities]);

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
    if (!cities.length) return;
    for (const city of cities) {
      const area = city.localAreas.find((a) => a.id === areaId);
      if (area) {
        setCoverage((prev) => ({
          ...prev,
          selectedHighStreets: [...new Set([...prev.selectedHighStreets, ...area.highStreets.map((s) => s.id)])],
        }));
        break;
      }
    }
  }, [cities]);

  const clearAllHighStreets = useCallback((areaId: string) => {
    if (!cities.length) return;
    for (const city of cities) {
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
  }, [cities]);

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
    if (!cities.length) return;
    for (const city of cities) {
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
  }, [cities]);

  const clearAllBusinesses = useCallback((streetId: string) => {
    if (!cities.length) return;
    for (const city of cities) {
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
  }, [cities]);

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
    if (!cities.length) return { success: false, imported: 0, skipped: 0, errors: ["Location tree not loaded"] };

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

      const city = cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase() || c.slug.toLowerCase() === cityName.toLowerCase());
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
  }, [cities, coverage]);

  // Summary
  const getSummary = useCallback((): LocationSummary => {
    if (!cities.length) return { includeNational: false, cities: [], totalLocations: 0 };

    const summaryCities: LocationSummary["cities"] = [];
    let total = 0;

    for (const city of cities) {
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
      summaryCities.push({ id: city.id, name: city.name, areas });
    }

    if (coverage.includeNational) total += 1;

    return { includeNational: coverage.includeNational, cities: summaryCities, totalLocations: total };
  }, [cities, coverage]);

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
