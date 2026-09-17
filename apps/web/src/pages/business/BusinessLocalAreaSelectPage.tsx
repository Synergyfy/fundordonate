// =============================================================================
// Business Local Area Selection Page
// Business owner selects their local area within a city.
// =============================================================================

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  Calendar, Clock,
  ArrowRight, ChevronRight, ChevronDown, ChevronUp,
  Search, ArrowLeft,
} from "lucide-react";
import { Tooltip, TOOLTIPS } from "@/components/ui/Tooltip";
import { getLocalAreasForCity, hasHighStreetData, isCityNeedsActivation } from "@/data/highStreetData";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useState(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  });

  return timeLeft;
}

export default function BusinessLocalAreaSelectPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  // Use unified high street data
  const localAreasData = getLocalAreasForCity(citySlug || "");
  const cityHasData = hasHighStreetData(citySlug || "");
  const cityNeedsActivation = isCityNeedsActivation(citySlug || "");

  // Convert to the format expected by the component
  const areas = useMemo(() => {
    const result: Record<string, {
      name: string;
      activationPct: number;
      businesses: number;
      highStreets: number;
      campaigns: number;
      fundingRaised: number;
      fundingTarget: number;
      description: string;
    }> = {};
    localAreasData.forEach(area => {
      result[area.slug] = {
        name: area.name,
        activationPct: area.activationPct,
        businesses: area.businesses,
        highStreets: area.highStreets,
        campaigns: area.campaigns,
        fundingRaised: area.fundingRaised,
        fundingTarget: area.fundingTarget,
        description: area.description,
      };
    });
    return result;
  }, [localAreasData]);

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return Object.entries(areas);
    return Object.entries(areas).filter(([_, area]) =>
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [areas, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to={`/uk-hub-activation/${citySlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-4 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {citySlug?.charAt(0).toUpperCase() + (citySlug?.slice(1) || "")} Business Hub
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-blue-300 mb-4 sm:text-sm">
            <Link to={`/uk-hub-activation/${citySlug}`} className="hover:text-white transition-colors">
              {citySlug?.charAt(0).toUpperCase() + (citySlug?.slice(1) || "")} Business Hub
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-white">Select Local Area</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Select your local area</h1>
            <Tooltip content={TOOLTIPS.localArea} />
          </div>
          <p className="mt-2 text-sm text-blue-200 max-w-2xl">
            Choose the local area where your business is located.
          </p>

          {/* Season Info */}
          {currentSeason && (
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Calendar className="h-3.5 w-3.5 text-blue-300 sm:h-4 sm:w-4" />
                <span className="text-xs font-bold sm:text-sm">{currentSeason.name}</span>
                <span className="text-[10px] text-blue-200 sm:text-xs">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
              {isActive && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-blue-300 sm:h-4 sm:w-4" />
                  <div className="flex gap-1">
                    {[
                      { value: countdown.days, label: "d" },
                      { value: countdown.hours, label: "h" },
                      { value: countdown.minutes, label: "m" },
                    ].map((item) => (
                      <span key={item.label} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums sm:px-2 sm:text-xs">
                        {String(item.value).padStart(2, "0")}{item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search local areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Local Area Dropdowns */}
        <div className="space-y-2 sm:space-y-3">
          {cityNeedsActivation && !cityHasData ? (
            <div className="rounded-xl bg-white p-6 text-center border sm:p-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 sm:text-lg">Coming Soon</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                High streets in {citySlug?.charAt(0).toUpperCase() + (citySlug?.slice(1) || "")} are being set up.
                Check back soon to explore local areas and high streets.
              </p>
              <Link
                to={`/uk-hub-activation/${citySlug}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                Return to City Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center border sm:p-8">
              <Search className="mx-auto h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
              <h3 className="mt-2 text-base font-bold text-gray-900 sm:text-lg">No areas found</h3>
              <p className="mt-1 text-sm text-gray-500">Try a different search term.</p>
            </div>
          ) : (
            filteredAreas.map(([id, area]) => {
              const isExpanded = expandedArea === id;
              const fundingPct = Math.min(100, Math.round((area.fundingRaised / area.fundingTarget) * 100));
              
              return (
                <div key={id} className="rounded-xl bg-white border overflow-hidden">
                  <button
                    onClick={() => setExpandedArea(isExpanded ? null : id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors sm:p-5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate sm:text-base">{area.name}</h3>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:px-2 sm:text-xs ${
                          area.activationPct >= 75 ? "bg-green-100 text-green-700" :
                          area.activationPct >= 50 ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {area.activationPct}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 truncate sm:text-sm">{area.description}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0 sm:h-5 sm:w-5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 sm:p-5">
                      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{area.activationPct}%</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">Activation</div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${area.activationPct}%` }} />
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{area.businesses}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">Businesses</div>
                        </div>
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{area.highStreets}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">High Streets</div>
                        </div>
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{area.campaigns}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">Campaigns</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500 sm:text-xs">Funding Progress</span>
                          <span className="text-[10px] font-bold text-gray-700 sm:text-xs">{fundingPct}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${fundingPct}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-500 sm:text-xs">{fmt(area.fundingRaised)} raised</span>
                          <span className="text-[10px] text-gray-500 sm:text-xs">of {fmt(area.fundingTarget)}</span>
                        </div>
                      </div>

                      <Link
                        to={`/business/${citySlug}/local-area/${id}/high-streets`}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                      >
                        Explore {area.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
