// =============================================================================
// UK Hub — Interactive Map Page
// Full-featured map page with search, filters, list view, legend, and bottom sheet.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Map, List } from "lucide-react";
import { HubBreadcrumb } from "@/components/hub/HubBreadcrumb";
import { UkMap } from "@/components/hub/UkMap";
import { MapSearch } from "@/components/hub/map/MapSearch";
import { MapFilters, type MapFiltersState } from "@/components/hub/map/MapFilters";
import { MapLegend } from "@/components/hub/map/MapLegend";
import { MapListView } from "@/components/hub/map/MapListView";
import { LocationBottomSheet } from "@/components/hub/map/LocationBottomSheet";
import { HUB_LOCATIONS, type HubLocation } from "@/data/hubActivation";

export default function UkHubMapPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<MapFiltersState>({
    status: "all",
    type: "all",
    founding: "all",
  });

  const filteredLocations = useMemo(() => {
    return HUB_LOCATIONS.filter((l: HubLocation) => {
      if (filters.status !== "all" && l.status !== filters.status) return false;
      if (filters.type !== "all" && l.type !== filters.type) return false;
      if (filters.founding === "business" && (!l.opportunities || l.opportunities.length === 0)) return false;
      if (filters.founding === "consumer" && l.status === "needs_activation") return false;
      return true;
    });
  }, [filters]);

  const selectedLocation = useMemo(
    () => (selectedSlug ? HUB_LOCATIONS.find((l: HubLocation) => l.slug === selectedSlug) ?? null : null),
    [selectedSlug]
  );

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug === selectedSlug ? null : slug);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <HubBreadcrumb items={[]} />
      </div>

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UK Hub Activation Map</h1>
            <p className="mt-1 text-gray-600">Explore cities, boroughs and local areas across the United Kingdom.</p>
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg border bg-white">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "map" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Map className="h-4 w-4" />
              Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "list" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <MapSearch
            locations={HUB_LOCATIONS}
            onSelect={handleSelect}
            className="w-full sm:max-w-xs"
          />
          <MapFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Results count */}
        <p className="mt-2 text-xs text-gray-500">
          {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
          {filters.status !== "all" || filters.type !== "all" || filters.founding !== "all" ? " (filtered)" : ""}
        </p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {view === "map" ? (
          <>
            {/* Map + Legend */}
            <div className="relative">
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm" style={{ height: "65vh", minHeight: 450 }}>
                <UkMap
                  locations={filteredLocations}
                  selectedSlug={selectedSlug}
                  onSelect={handleSelect}
                  statusFilter="all"
                />
              </div>
              <MapLegend className="absolute bottom-3 left-3 z-10" />
            </div>

            {/* Desktop side panel */}
            {selectedLocation && (
              <div className="mt-4 hidden sm:block">
                <div className="overflow-hidden rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{selectedLocation.name}</h2>
                      <p className="text-sm text-gray-500">{selectedLocation.shortDescription}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSlug(null)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">{selectedLocation.activationProgress}%</span>
                      <span className="text-gray-400"> activation</span>
                    </div>
                    {selectedLocation.communities && (
                      <span className="text-xs text-gray-400">{selectedLocation.communities}</span>
                    )}
                    <Link
                      to={`/uk-hub-activation/${selectedLocation.slug}`}
                      className="ml-auto rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      View Hub →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <MapListView
            locations={filteredLocations}
            onSelect={handleSelect}
            selectedSlug={selectedSlug}
          />
        )}
      </div>

      {/* Mobile bottom sheet */}
      <LocationBottomSheet
        location={selectedLocation}
        onClose={() => setSelectedSlug(null)}
      />

      {/* Back link */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/uk-hub-activation" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          ← Back to UK Hub
        </Link>
      </div>
    </div>
  );
}
