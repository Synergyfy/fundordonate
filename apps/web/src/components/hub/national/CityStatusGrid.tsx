// =============================================================================
// National Hub — City Status Grid Section
// Shows cities grouped by status from locationService.
// =============================================================================

import { useState, useEffect } from "react";
import { locationService } from "@/services/location";
import { LocationCard } from "@/components/hub/LocationCard";
import { LocationStatusBadge } from "@/components/hub/HubStatusBadge";
import type { HubLocation } from "@/types/uk-hub";

export function CityStatusGrid() {
  const [cities, setCities] = useState<HubLocation[]>([]);

  useEffect(() => {
    locationService
      .fetchLocations({ type: "CITY" })
      .then((res) => {
        if (res?.locations) {
          const mapped: HubLocation[] = res.locations.map((l: any) => ({
            id: l.id,
            name: l.name,
            slug: l.slug,
            type: "CITY",
            internalLifecycle: l.internalLifecycle || "ACTIVE",
            publicStatus: l.publicStatus || (l.status === "active" ? "ACTIVE" : l.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"),
            isActive: l.isActive !== false,
            isPublic: l.isPublic !== false,
            mapVisible: true,
            isFeaturedNationally: Boolean(l.isFeaturedNationally),
            fundingTarget: Number(l.fundingTarget || 100000),
            fundingRaised: Number(l.fundingRaised || 0),
            foundingBusinessTotal: Number(l.foundingBusinessTotal || 50),
            foundingBusinessAllocated: Number(l.foundingBusinessAllocated || 0),
            foundingConsumerTotal: Number(l.foundingConsumerTotal || 200),
            foundingConsumerAllocated: Number(l.foundingConsumerAllocated || 0),
            primaryImage: l.primaryImage,
            createdAt: l.createdAt || new Date().toISOString(),
            updatedAt: l.updatedAt || new Date().toISOString(),
          }));
          setCities(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch cities:", err);
      });
  }, []);

  const activeCities = cities.filter((c) => c.publicStatus === "ACTIVE");
  const progressCities = cities.filter((c) => c.publicStatus === "MAKING_PROGRESS");
  const needsActivationCities = cities.filter((c) => c.publicStatus === "NEEDS_ACTIVATION");

  return (
    <>
      {activeCities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Active Cities</h2>
            <LocationStatusBadge status="ACTIVE" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCities.map((city) => (
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
            {progressCities.map((city) => (
              <LocationCard key={city.id} location={city} />
            ))}
          </div>
        </section>
      )}

      {needsActivationCities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Inactive</h2>
            <LocationStatusBadge status="NEEDS_ACTIVATION" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needsActivationCities.map((city) => (
              <LocationCard key={city.id} location={city} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
