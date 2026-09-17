// =============================================================================
// Business High Street Selection Page
// Business owner selects their high street within a local area.
// =============================================================================

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  ArrowRight, ChevronRight, ChevronDown, ChevronUp,
  Home, ArrowLeft, Search, Heart, TrendingUp, Calendar, Clock,
} from "lucide-react";
import { Tooltip, TOOLTIPS } from "@/components/ui/Tooltip";
import { getHighStreetsForArea, hasHighStreetData, getLocalAreaData, isCityNeedsActivation } from "@/data/highStreetData";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

export default function BusinessHighStreetSelectPage() {
  const { citySlug, localAreaSlug } = useParams<{ citySlug: string; localAreaSlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStreet, setExpandedStreet] = useState<string | null>(null);

  // Use unified high street data
  const highStreetsData = getHighStreetsForArea(citySlug || "", localAreaSlug || "");
  const cityHasData = hasHighStreetData(citySlug || "");
  const areaData = getLocalAreaData(citySlug || "", localAreaSlug || "");
  const cityNeedsActivation = isCityNeedsActivation(citySlug || "");

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const localAreaName = areaData?.name ?? (localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area");

  // Convert to format expected by the component
  const highStreets = useMemo(() => {
    const result: Record<string, {
      name: string;
      activationPct: number;
      totalBusinesses: number;
      participatingBusinesses: number;
      campaigns: number;
      fundingRaised: number;
      fundingTarget: number;
      communityActivity: number;
      description: string;
    }> = {};
    highStreetsData.forEach(street => {
      result[street.slug] = {
        name: street.name,
        activationPct: street.activationPct,
        totalBusinesses: street.totalBusinesses,
        participatingBusinesses: street.participatingBusinesses,
        campaigns: street.campaigns,
        fundingRaised: street.fundingRaised,
        fundingTarget: street.fundingTarget,
        communityActivity: street.communityActivities,
        description: street.description,
      };
    });
    return result;
  }, [highStreetsData]);

  const filteredStreets = useMemo(() => {
    return Object.entries(highStreets).filter(([_, street]) =>
      !searchQuery.trim() || street.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      street.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [highStreets, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to={`/business/${citySlug}/local-area`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-4 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {localAreaName}
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-blue-300 mb-4 sm:text-sm">
            <Link to={`/uk-hub-activation/${citySlug}`} className="hover:text-white transition-colors">
              {citySlug?.charAt(0).toUpperCase() + (citySlug?.slice(1) || "")} City Hub
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to={`/business/${citySlug}/local-area`} className="hover:text-white transition-colors">
              {localAreaName}
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-white">High Streets</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Select High Street</h1>
            <Tooltip content={TOOLTIPS.highStreet} />
          </div>
          <p className="mt-2 text-sm text-blue-200 max-w-2xl">
            Inside {localAreaName} — Choose the high street where your business is located.
          </p>

          {/* Season Info */}
          {currentSeason && (
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Calendar className="h-3.5 w-3.5 text-blue-300 sm:h-4 sm:w-4" />
                <span className="text-xs font-bold sm:text-sm">{currentSeason.name}</span>
                <span className="text-[10px] text-blue-200 sm:text-xs">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
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
            placeholder="Search high streets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* High Streets */}
        <h2 className="text-lg font-bold text-gray-900 mb-4 sm:text-xl">High Streets in {localAreaName}</h2>

        {cityNeedsActivation && !cityHasData ? (
          <div className="rounded-xl bg-white p-6 text-center border sm:p-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">Coming Soon</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              High streets in {localAreaName} are being set up.
              Check back soon to explore high streets in this area.
            </p>
            <Link
              to={`/business/${citySlug}/local-area`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              Return to Local Areas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : filteredStreets.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center border sm:p-8">
            <Home className="mx-auto h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
            <h3 className="mt-2 text-base font-bold text-gray-900 sm:text-lg">No High Streets Found</h3>
            <p className="mt-1 text-sm text-gray-500">No high streets are configured for this area yet.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredStreets.map(([id, street]) => {
              const isExpanded = expandedStreet === id;
              const fundingPct = Math.min(100, Math.round((street.fundingRaised / street.fundingTarget) * 100));

              return (
                <div key={id} className="rounded-xl bg-white border overflow-hidden">
                  <button
                    onClick={() => setExpandedStreet(isExpanded ? null : id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors sm:p-5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate sm:text-base">{street.name}</h3>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:px-2 sm:text-xs ${
                          street.activationPct >= 75 ? "bg-green-100 text-green-700" :
                          street.activationPct >= 50 ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {street.activationPct}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 truncate sm:text-sm">{street.description}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0 sm:h-5 sm:w-5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 sm:p-5">
                      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{street.activationPct}%</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">Activation</div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${street.activationPct}%` }} />
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{street.participatingBusinesses}/{street.totalBusinesses}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">Businesses</div>
                        </div>
                        <div className="rounded-lg bg-white p-2 text-center border">
                          <div className="text-lg font-bold text-gray-900 sm:text-xl">{street.campaigns}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">Campaigns</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-white p-2 border">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:text-xs">
                            <TrendingUp className="h-3 w-3" /> Funding
                          </div>
                          <div className="text-sm font-bold text-gray-900 sm:text-base">{fmt(street.fundingRaised)}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">of {fmt(street.fundingTarget)}</div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${fundingPct}%` }} />
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2 border">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 sm:text-xs">
                            <Heart className="h-3 w-3" /> Community
                          </div>
                          <div className="text-sm font-bold text-gray-900 sm:text-base">{street.communityActivity}</div>
                          <div className="text-[10px] text-gray-500 sm:text-xs">activities</div>
                        </div>
                      </div>

                      <Link
                        to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${id}/join`}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                      >
                        View High Street
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
