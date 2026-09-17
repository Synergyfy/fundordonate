// =============================================================================
// Global Season Selector
// Admin header component for selecting the operational season context.
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { seasonApi, type Season } from "@/services/season.service";
import { Calendar, ChevronDown, Check } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  DRAFT: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-primary-100 text-primary-700",
};

export function GlobalSeasonSelector({ onSeasonChange }: { onSeasonChange?: (season: Season | null) => void }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    seasonApi.list().then((res) => {
      setSeasons(res.seasons);
      const active = res.seasons.find((s) => s.status === "ACTIVE") || null;
      setCurrentSeason(active);
      setLoading(false);
      onSeasonChange?.(active);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (season: Season) => {
    setCurrentSeason(season);
    setOpen(false);
    onSeasonChange?.(season);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5">
        <Calendar className="h-4 w-4 text-gray-400 animate-pulse" />
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        aria-label="Select season context"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        {currentSeason ? (
          <>
            <span className="font-medium text-gray-900">{currentSeason.name}</span>
            <span className="hidden sm:inline text-xs text-gray-400">
              {new Date(currentSeason.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              {" — "}
              {new Date(currentSeason.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[currentSeason.status] || "bg-gray-100 text-gray-500"}`}>
              {currentSeason.status}
            </span>
          </>
        ) : (
          <span className="text-gray-400">No Active Season</span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500">Select Season Context</div>
          </div>
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSelect(season)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 ${
                currentSeason?.id === season.id ? "bg-primary-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{season.name}</span>
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[season.status] || "bg-gray-100 text-gray-500"}`}>
                    {season.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(season.startDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  {" — "}
                  {new Date(season.endDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </div>
              </div>
              {currentSeason?.id === season.id && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </button>
          ))}
          {seasons.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              No seasons configured
            </div>
          )}
        </div>
      )}
    </div>
  );
}
