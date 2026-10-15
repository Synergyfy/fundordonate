// =============================================================================
// Business Search Page
// Business owner searches for their business or adds a new one.
// =============================================================================

import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season";
import { adminApi } from "@/services/admin";
import {
  Store, MapPin, Calendar, Clock,
  Search, ChevronRight, Plus, ArrowRight,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
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
  }, [targetDate]);

  return timeLeft;
}

export default function BusinessSearchPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const [search, setSearch] = useState("");

  const { data: bizData, isLoading: loadingBusinesses } = useQuery({
    queryKey: ["businesses", citySlug, search],
    queryFn: async () => {
      try {
        const res = await adminApi.getBusinesses({ city: citySlug, search: search.trim() || undefined, limit: 50 });
        return res?.items || [];
      } catch {
        return [];
      }
    },
  });

  const businesses = (bizData || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    category: b.category || "Business",
    location: b.address || b.highStreet || `${b.city || "UK"}`,
    status: (b.status || "").toLowerCase() === "active" ? "participating" : "available",
  }));

  const filtered = search.trim()
    ? businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : businesses;

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

  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link to={`/business/${citySlug}`} className="hover:text-white transition-colors">
              {citySlug?.charAt(0).toUpperCase() + (citySlug?.slice(1) || "")} Business Hub
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/business/${citySlug}/local-area/${localAreaSlug}`} className="hover:text-white transition-colors">
              {localAreaName}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/business/${citySlug}/local-area/${localAreaSlug}/high-streets`} className="hover:text-white transition-colors">
              High Streets
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{streetName}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your business</h1>
          <p className="mt-2 text-blue-200 max-w-2xl">
            Search for your business or add it if it's not already listed.
          </p>

          {/* Season Info */}
          {currentSeason && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
                <Calendar className="h-4 w-4 text-blue-300" />
                <span className="text-sm font-bold">{currentSeason.name}</span>
                <span className="text-xs text-blue-200">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
              {isActive && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-300" />
                  <div className="flex gap-1">
                    {[
                      { value: countdown.days, label: "d" },
                      { value: countdown.hours, label: "h" },
                      { value: countdown.minutes, label: "m" },
                    ].map((item) => (
                      <span key={item.label} className="rounded bg-white/20 px-2 py-1 text-xs font-bold tabular-nums">
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

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Box */}
        <div className="rounded-xl bg-white p-6 shadow-sm border mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Is your business already here?</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Search by business name to see if it's already registered on the platform.
          </p>
        </div>

        {/* Search Results */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-900">
              {search.trim() ? `Results for "${search}"` : `Businesses on ${streetName}`}
            </h3>
          </div>

          {loadingBusinesses ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading businesses...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Store className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-bold text-gray-900">
                {search.trim() ? "No businesses found" : "No businesses listed"}
              </h3>
              <p className="mt-1 text-gray-500">
                {search.trim()
                  ? "Try a different search or add your business below."
                  : "Be the first to add your business to this high street."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((biz) => (
                <div key={biz.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{biz.name}</h4>
                        {biz.status === "participating" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                            <CheckCircle className="h-3 w-3" /> Participating
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                            <AlertCircle className="h-3 w-3" /> Available
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" /> {biz.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {biz.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {biz.status === "available" ? (
                        <Link
                          to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/claim/${biz.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                        >
                          This is my business <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Link
                          to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/claim/${biz.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Business CTA */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Add your business</h3>
              <p className="mt-1 text-sm text-gray-600">
                Can't find your business? Add it to the platform and start participating in your local community.
              </p>
              <Link
                to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/add`}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add my business
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
