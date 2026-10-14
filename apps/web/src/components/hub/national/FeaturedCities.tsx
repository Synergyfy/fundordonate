// =============================================================================
// National Hub — Featured Cities Section
// Wire to locationService for featured cities.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { locationService } from "@/services/location";
import { LocationCard } from "@/components/hub/LocationCard";
import type { HubLocation } from "@/types/uk-hub";

export function FeaturedCities() {
  const [featured, setFeatured] = useState<HubLocation[]>([]);

  useEffect(() => {
    locationService
      .fetchLocations({ type: "CITY" })
      .then((res) => {
        if (res?.locations) {
          const mapped: HubLocation[] = res.locations
            .filter((l: any) => l.isFeaturedNationally !== false)
            .slice(0, 6)
            .map((l: any) => ({
              id: l.id,
              name: l.name,
              slug: l.slug,
              type: "CITY",
              internalLifecycle: l.internalLifecycle || "ACTIVE",
              publicStatus: l.publicStatus || (l.status === "active" ? "ACTIVE" : l.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"),
              isActive: l.isActive !== false,
              isPublic: l.isPublic !== false,
              mapVisible: true,
              isFeaturedNationally: true,
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
          setFeatured(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch featured cities:", err);
      });
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Featured Cities</h2>
        <Link to="/uk-hub-activation/map" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          View all on map →
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((city) => (
          <LocationCard key={city.id} location={city} variant="featured" />
        ))}
      </div>
    </section>
  );
}
