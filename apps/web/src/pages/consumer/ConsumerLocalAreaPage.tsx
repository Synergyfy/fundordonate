// =============================================================================
// Consumer Local Area Page
// Shows local areas/boroughs for the selected city.
// =============================================================================

import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import {
  ArrowLeft, MapPin, Calendar,
  Building2, ChevronRight, Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import { useCountdown } from "@/hooks/useCountdown";
import { getLocalAreasForCity } from "@/data/highStreetData";

export default function ConsumerLocalAreaPage() {
  const { citySlug } = useParams<{ citySlug: string }>();

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const localAreas = useMemo(() => getLocalAreasForCity(citySlug || ""), [citySlug]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white">
        <div className="relative mx-auto max-w-4xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <Link
            to={`/uk-hub-activation/${citySlug}/consumer`}
            className="inline-flex items-center gap-1.5 text-xs text-green-300 hover:text-white mb-4 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Consumer Benefits
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 mb-3">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">CONSUMER</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl mb-2">
            Explore Local Areas
          </h1>
          <p className="text-green-100 text-sm sm:text-base max-w-2xl">
            Choose a local area in {cityName} to discover high streets and campaigns.
          </p>

          {/* Season Context */}
          {currentSeason && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Calendar className="h-4 w-4 text-green-300" />
                <span className="text-xs font-bold sm:text-sm">Current Season: {currentSeason.name}</span>
                {isActive && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-200 tabular-nums">
                    <span className="rounded bg-white/10 px-1 py-0.5">{countdown.days}d</span>
                    <span className="rounded bg-white/10 px-1 py-0.5">{countdown.hours}h</span>
                    <span className="rounded bg-white/10 px-1 py-0.5">{countdown.minutes}m</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Local Areas List */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Local Areas in {cityName}</h2>
          <p className="text-sm text-gray-500">Select a local area to explore its high streets and campaigns.</p>
        </div>

        {localAreas.length === 0 ? (
          <div className="rounded-xl bg-white border p-8 text-center">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">No Local Areas Found</h3>
            <p className="text-sm text-gray-500">
              Local areas for {cityName} are being set up. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {localAreas.map((area) => (
              <Link
                key={area.slug}
                to={`/uk-hub-activation/${citySlug}/consumer/${area.slug}`}
                className="rounded-xl bg-white border p-5 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      {area.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{area.highStreets} high streets</span>
                    </div>
                    {area.highStreetsList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {area.highStreetsList.slice(0, 3).map((hs) => (
                          <span key={hs.slug} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {hs.name}
                          </span>
                        ))}
                        {area.highStreetsList.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{area.highStreetsList.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
