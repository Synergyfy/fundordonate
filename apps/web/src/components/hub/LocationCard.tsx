// =============================================================================
// UK Hub — Location Card Component
// Displays a city or borough location with status, progress, and actions.
// =============================================================================

import { Link } from "react-router-dom";
import type { HubLocation } from "@/types/uk-hub";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";
import { ProgressRing } from "./ProgressRing";
import { formatCurrency } from "@/data/ukHubData";

interface LocationCardProps {
  location: HubLocation;
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function LocationCard({ location, variant = "default", className }: LocationCardProps) {
  const effectiveStatus = location.statusOverride || location.publicStatus;
  const statusMeta = LOCATION_PUBLIC_STATUS_META[effectiveStatus];
  const fundingPct = location.fundingTarget > 0
    ? Math.min(Math.round((location.fundingRaised / location.fundingTarget) * 100), 100)
    : 0;
  const bizRemaining = Math.max(0, location.foundingBusinessTotal - location.foundingBusinessAllocated);
  const consRemaining = Math.max(0, location.foundingConsumerTotal - location.foundingConsumerAllocated);

  if (variant === "compact") {
    return (
      <Link
        to={`/uk-hub-activation/${location.slug}`}
        className={`flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-md ${statusMeta.borderColor} ${statusMeta.bgColor}${className ? ` ${className}` : ""}`}
      >
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white">
          {location.primaryImage ? (
            <img src={location.primaryImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg">🏙️</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-900">{location.name}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.bgColor} ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-gray-500">{formatCurrency(location.fundingRaised)} raised</div>
        </div>
        <div className="text-xs text-gray-400">→</div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        to={`/uk-hub-activation/${location.slug}`}
        className={`group relative block overflow-hidden rounded-xl border transition-all hover:shadow-lg ${statusMeta.borderColor}${className ? ` ${className}` : ""}`}
      >
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {location.primaryImage ? (
            <img
              src={location.primaryImage}
              alt={location.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">🏙️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{location.name}</h3>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.bgColor} ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="line-clamp-2 text-sm text-gray-600">{location.shortDescription}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold text-gray-900">{formatCurrency(location.fundingRaised)}</span>
              <span className="text-gray-400"> / {formatCurrency(location.fundingTarget)}</span>
            </div>
            <ProgressRing value={fundingPct} size={40} strokeWidth={4} animate={false} />
          </div>
          {(bizRemaining > 0 || consRemaining > 0) && (
            <div className="mt-2 flex gap-2 text-xs text-gray-500">
              {bizRemaining > 0 && <span>🏢 {bizRemaining} business spots left</span>}
              {consRemaining > 0 && <span>👤 {consRemaining} consumer spots left</span>}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      to={`/uk-hub-activation/${location.slug}`}
      className={`group block overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md ${statusMeta.borderColor}${className ? ` ${className}` : ""}`}
    >
      <div className="relative h-32 overflow-hidden bg-gray-100">
        {location.primaryImage ? (
          <img
            src={location.primaryImage}
            alt={location.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🏙️</div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.bgColor} ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">{location.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{location.shortDescription}</p>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-600">{formatCurrency(location.fundingRaised)} raised</span>
          <span className="font-medium text-primary-600">Explore →</span>
        </div>
      </div>
    </Link>
  );
}
