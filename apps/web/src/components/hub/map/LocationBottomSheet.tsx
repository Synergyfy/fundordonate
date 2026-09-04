// =============================================================================
// UK Hub Map — Location Bottom Sheet (Mobile)
// Slide-up panel for mobile showing selected location details.
// =============================================================================

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, MapPin } from "lucide-react";
import type { HubLocation } from "@/data/hubActivation";
import { HUB_STATUS_META, getDemoCampaignsForLocation } from "@/data/hubActivation";
import { HubStatusBadge } from "../HubStatusBadge";

interface LocationBottomSheetProps {
  location: HubLocation | null;
  onClose: () => void;
}

export function LocationBottomSheet({ location, onClose }: LocationBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (location) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [location, onClose]);

  if (!location) return null;

  const meta = HUB_STATUS_META[location.status];
  const campaigns = getDemoCampaignsForLocation(location);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 sm:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t bg-white shadow-2xl transition-transform duration-300 sm:hidden"
        style={{ transform: location ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-white pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-4 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
              style={{ backgroundColor: meta.color }}
            >
              {location.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{location.name}</h3>
              <div className="flex items-center gap-2">
                <HubStatusBadge status={location.status} />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Activation</span>
              <span className="text-xs font-bold" style={{ color: meta.color }}>{location.activationProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${location.activationProgress}%`, backgroundColor: meta.color }}
              />
            </div>
          </div>

          {/* Activity */}
          {location.activity.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-1.5">Activity</h4>
              <ul className="space-y-1">
                {location.activity.slice(0, 3).map(a => (
                  <li key={a} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Campaigns */}
          {campaigns.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-1.5">Campaigns ({campaigns.length})</h4>
              <div className="space-y-1.5">
                {campaigns.slice(0, 2).map(c => (
                  <Link
                    key={c.slug}
                    to={`/campaigns/${c.slug}`}
                    className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:bg-primary-50"
                  >
                    <span className="truncate">{c.title}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-primary-500" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Link
              to={`/uk-hub-activation/${location.slug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <MapPin className="h-4 w-4" />
              View Hub
            </Link>
            <Link
              to={`/campaigns?location=${location.slug}`}
              className="flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Campaigns
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
