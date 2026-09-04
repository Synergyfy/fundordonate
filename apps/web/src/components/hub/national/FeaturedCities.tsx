// =============================================================================
// National Hub — Featured Cities Section
// =============================================================================

import { Link } from "react-router-dom";
import { getFeaturedCities } from "@/data/ukHubData";
import { LocationCard } from "@/components/hub/LocationCard";

export function FeaturedCities() {
  const featured = getFeaturedCities();

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
        {featured.map(city => (
          <LocationCard key={city.id} location={city} variant="featured" />
        ))}
      </div>
    </section>
  );
}
