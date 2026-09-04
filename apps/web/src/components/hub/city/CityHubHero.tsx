// =============================================================================
// City Hub — Hero Section
// =============================================================================

import type { HubLocation } from "@/types/uk-hub";
import { LOCATION_TYPE_META } from "@/types/uk-hub";
import { getEffectiveStatus } from "@/services/locationResolver";
import { LocationStatusBadge } from "@/components/hub/HubStatusBadge";

interface CityHubHeroProps {
  location: HubLocation;
}

export function CityHubHero({ location }: CityHubHeroProps) {
  const effectiveStatus = getEffectiveStatus(location);
  const meta = LOCATION_TYPE_META[location.type];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {location.primaryImage && (
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${location.primaryImage}')` }} />
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{meta?.icon || "📍"}</span>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary-400">{location.type} Hub</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{location.name}</h1>
            </div>
          </div>
          <p className="mt-3 text-lg text-gray-300">{location.shortDescription}</p>
          <div className="mt-4 flex items-center gap-3">
            <LocationStatusBadge status={effectiveStatus} size="md" />
            {location.activationThreshold && (
              <span className="text-sm text-gray-400">Activation: {location.activationThreshold}%</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
