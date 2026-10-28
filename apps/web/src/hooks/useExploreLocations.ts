// =============================================================================
// useExploreLocations — city / local area / high street options for the
// consumer Explore page, sourced from the live public location tree.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchLocationTree } from "@/services/location";
import type { ScopeOption } from "@/services/explore";

interface ExploreLocationIndex {
  cities: ScopeOption[];
  areasByCity: Record<string, ScopeOption[]>;
  /** Keyed by `${citySlug}/${areaSlug}`. */
  streetsByArea: Record<string, ScopeOption[]>;
}

const EMPTY_INDEX: ExploreLocationIndex = {
  cities: [],
  areasByCity: {},
  streetsByArea: {},
};

export interface ExploreLocations {
  cities: ScopeOption[];
  areasFor: (citySlug?: string) => ScopeOption[];
  streetsFor: (citySlug?: string, areaSlug?: string) => ScopeOption[];
  loading: boolean;
}

export function useExploreLocations(): ExploreLocations {
  const [index, setIndex] = useState<ExploreLocationIndex>(EMPTY_INDEX);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchLocationTree()
      .then((tree) => {
        if (cancelled) return;

        const next: ExploreLocationIndex = {
          cities: [],
          areasByCity: {},
          streetsByArea: {},
        };

        for (const city of tree.cities ?? []) {
          next.cities.push({ slug: city.slug, name: city.name });

          const areas: ScopeOption[] = [];
          for (const area of city.localAreas ?? []) {
            areas.push({ slug: area.slug, name: area.name });

            const streets = (area.highStreets ?? []).map((street) => ({
              slug: street.slug,
              name: street.name,
            }));
            next.streetsByArea[`${city.slug}/${area.slug}`] = streets;
          }
          next.areasByCity[city.slug] = areas;
        }

        setIndex(next);
      })
      .catch(() => {
        if (!cancelled) setIndex(EMPTY_INDEX);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const areasFor = useCallback(
    (citySlug?: string) =>
      citySlug ? (index.areasByCity[citySlug] ?? []) : [],
    [index],
  );

  const streetsFor = useCallback(
    (citySlug?: string, areaSlug?: string) =>
      citySlug && areaSlug
        ? (index.streetsByArea[`${citySlug}/${areaSlug}`] ?? [])
        : [],
    [index],
  );

  return useMemo(
    () => ({ cities: index.cities, areasFor, streetsFor, loading }),
    [index.cities, areasFor, streetsFor, loading],
  );
}
