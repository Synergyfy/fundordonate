// =============================================================================
// High Street Businesses Page
// Shows all businesses on a specific high street.
// =============================================================================

import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, Store, Search, Filter,
} from "lucide-react";
import { useState } from "react";
import { getBusinessesForHighStreet, getHighStreetsForArea } from "@/data/highStreetData";

export default function HighStreetBusinessesPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "participating" | "not_participating">("all");

  const streetData = useMemo(() => {
    const streets = getHighStreetsForArea(citySlug || "", localAreaSlug || "");
    return streets.find(s => s.slug === highStreetSlug) ?? null;
  }, [citySlug, localAreaSlug, highStreetSlug]);

  const allBusinesses = useMemo(() => {
    if (!citySlug || !localAreaSlug || !highStreetSlug) return [];
    return getBusinessesForHighStreet(citySlug, localAreaSlug, highStreetSlug);
  }, [citySlug, localAreaSlug, highStreetSlug]);

  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter(b => {
      const matchesSearch = searchQuery === "" ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" ||
        (filter === "participating" && b.participating) ||
        (filter === "not_participating" && !b.participating);
      return matchesSearch && matchesFilter;
    });
  }, [allBusinesses, searchQuery, filter]);

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = streetData?.name || highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";
  const participating = allBusinesses.filter(b => b.participating);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <Link
            to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white mb-4 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {streetName}
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-purple-300 mb-4 sm:gap-2 sm:text-sm">
            <Link to={`/uk-hub-activation/${citySlug}`} className="hover:text-white transition-colors">{cityName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to={`/business/${citySlug}/local-area`} className="hover:text-white transition-colors">{localAreaName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`} className="hover:text-white transition-colors">{streetName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-white">Businesses</span>
          </div>

          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Businesses on {streetName}
            </h1>
          </div>
          <p className="mt-2 text-sm text-purple-200 max-w-2xl">
            {participating.length} of {streetData?.totalBusinesses || allBusinesses.length} businesses are participating in the hub.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Search & Filter */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            {[
              { value: "all" as const, label: "All", count: allBusinesses.length },
              { value: "participating" as const, label: "Participating", count: participating.length },
              { value: "not_participating" as const, label: "Not Joined", count: allBusinesses.length - participating.length },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === opt.value
                    ? "border-purple-300 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-white border p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{allBusinesses.length}</div>
            <div className="text-xs text-gray-500">Total Businesses</div>
          </div>
          <div className="rounded-xl bg-white border p-3 text-center">
            <div className="text-lg font-bold text-green-600">{participating.length}</div>
            <div className="text-xs text-gray-500">Participating</div>
          </div>
          <div className="rounded-xl bg-white border p-3 text-center">
            <div className="text-lg font-bold text-gray-400">{allBusinesses.length - participating.length}</div>
            <div className="text-xs text-gray-500">Not Yet Joined</div>
          </div>
        </div>

        {/* Business List */}
        {filteredBusinesses.length === 0 ? (
          <div className="rounded-xl bg-white border p-8 text-center">
            <Store className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No businesses found</h3>
            <p className="mt-1 text-sm text-gray-500">Try a different search term or filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBusinesses.map((biz) => (
              <div key={biz.id} className="flex items-center gap-4 rounded-xl bg-white border p-4 hover:shadow-sm transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl flex-shrink-0">
                  {biz.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{biz.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      biz.participating ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {biz.participating ? "Participating" : "Not Joined"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{biz.type} · {biz.category}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{biz.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {biz.participating ? (
                    <>
                      <div className="text-sm font-bold text-green-600">£{biz.fundingContribution}</div>
                      <div className="text-[10px] text-gray-400">contributed</div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back CTA */}
        <div className="mt-8 text-center">
          <Link
            to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {streetName}
          </Link>
        </div>
      </div>
    </div>
  );
}
