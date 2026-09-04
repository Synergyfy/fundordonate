// =============================================================================
// UK Hub Map — List View Component
// Alternative list-based view of locations.
// =============================================================================

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { HubLocation } from "@/data/hubActivation";
import { HUB_STATUS_META } from "@/data/hubActivation";
import { HubStatusBadge } from "../HubStatusBadge";

interface MapListViewProps {
  locations: HubLocation[];
  onSelect: (slug: string) => void;
  selectedSlug: string | null;
  className?: string;
}

export function MapListView({ locations, onSelect, selectedSlug, className }: MapListViewProps) {
  if (locations.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-12 text-sm text-gray-500 ${className || ""}`}>
        No locations match your filters.
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {locations.map(l => {
        const meta = HUB_STATUS_META[l.status];
        const isSelected = l.slug === selectedSlug;
        return (
          <button
            key={l.id}
            onClick={() => onSelect(l.slug)}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
              isSelected
                ? "border-primary-300 bg-primary-50 shadow-sm"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            {/* Status dot */}
            <div className="flex-shrink-0">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: meta.color }}
              >
                {l.name.charAt(0)}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-gray-900">{l.name}</span>
                <HubStatusBadge status={l.status} />
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{l.shortDescription}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{l.activationProgress}% activation</span>
                {l.communities && <span>· {l.communities}</span>}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <Link
                to={`/uk-hub-activation/${l.slug}`}
                onClick={e => e.stopPropagation()}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </button>
        );
      })}
    </div>
  );
}
