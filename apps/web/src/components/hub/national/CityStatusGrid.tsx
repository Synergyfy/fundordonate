// =============================================================================
// National Hub — City Status Grid Section
// Shows cities grouped by status.
// =============================================================================

import { getCitiesByStatus } from "@/data/ukHubData";
import { LocationCard } from "@/components/hub/LocationCard";
import { LocationStatusBadge } from "@/components/hub/HubStatusBadge";

export function CityStatusGrid() {
  const activeCities = getCitiesByStatus("ACTIVE");
  const progressCities = getCitiesByStatus("MAKING_PROGRESS");
  const needsActivationCities = getCitiesByStatus("NEEDS_ACTIVATION");

  return (
    <>
      {activeCities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Active Cities</h2>
            <LocationStatusBadge status="ACTIVE" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCities.map(city => (
              <LocationCard key={city.id} location={city} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {progressCities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Making Progress</h2>
            <LocationStatusBadge status="MAKING_PROGRESS" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progressCities.map(city => (
              <LocationCard key={city.id} location={city} />
            ))}
          </div>
        </section>
      )}

      {needsActivationCities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Needs Activation</h2>
            <LocationStatusBadge status="NEEDS_ACTIVATION" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needsActivationCities.map(city => (
              <LocationCard key={city.id} location={city} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
