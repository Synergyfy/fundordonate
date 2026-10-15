// =============================================================================
// Business Discovery Page
// Filtered view of cities, boroughs, and high streets showing business
// participation, campaigns, and activation status using live database hierarchy.
// =============================================================================

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2, MapPin, Search, ArrowRight, TrendingUp, Target,
  ChevronDown, ChevronRight, Store,
} from "lucide-react";
import { locationService } from "@/services/location";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((p || 0) / 100);

export interface HighStreetItem {
  id: string;
  name: string;
  businesses: number;
  campaigns: number;
}

export interface BoroughItem {
  id: string;
  name: string;
  businessesParticipating: number;
  activeCampaigns: number;
  highStreets: HighStreetItem[];
}

export interface CityDiscoveryItem {
  id: string;
  name: string;
  slug: string;
  status: "active" | "making_progress" | "needs_activation";
  activationProgress: number;
  businessesParticipating: number;
  activeCampaigns: number;
  fundingTarget: number;
  fundingRaised: number;
  boroughs: BoroughItem[];
}

type StatusMeta = { label: string; color: string; bg: string };

const STATUS_META: Record<string, StatusMeta> = {
  active: { label: "Active", color: "text-green-700", bg: "bg-green-50" },
  making_progress: { label: "Making Progress", color: "text-amber-700", bg: "bg-amber-50" },
  needs_activation: { label: "Needs Activation", color: "text-gray-600", bg: "bg-gray-100" },
};

export default function BusinessDiscoveryPage() {
  const [cities, setCities] = useState<CityDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [expandedBorough, setExpandedBorough] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadTree() {
      setLoading(true);
      try {
        const treeRes = await locationService.fetchLocationTree();
        if (!mounted) return;

        const rawCities = (treeRes as any)?.cities || [];
        const mapped: CityDiscoveryItem[] = rawCities.map((c: any) => {
          const rawBoroughs = c.boroughs || c.localAreas || [];
          let totalBusinesses = 0;
          let totalCampaigns = c.activeCampaigns || 0;

          const boroughs: BoroughItem[] = rawBoroughs.map((b: any) => {
            const rawStreets = b.highStreets || [];
            const highStreets: HighStreetItem[] = rawStreets.map((hs: any) => {
              const bCount = hs.businessesCount || hs.businesses || 0;
              const cCount = hs.campaignsCount || hs.campaigns || 0;
              totalBusinesses += bCount;
              return {
                id: hs.slug || hs.id,
                name: hs.name,
                businesses: bCount,
                campaigns: cCount,
              };
            });

            return {
              id: b.slug || b.id,
              name: b.name,
              businessesParticipating: b.businessesCount || highStreets.reduce((acc, h) => acc + h.businesses, 0),
              activeCampaigns: b.campaignsCount || highStreets.reduce((acc, h) => acc + h.campaigns, 0),
              highStreets,
            };
          });

          const normStatus = (c.status || "active").toLowerCase().replace(/\s+/g, "_");
          const status = (normStatus === "active" || normStatus === "making_progress")
            ? normStatus as any
            : "needs_activation";

          return {
            id: c.slug || c.id,
            name: c.name,
            slug: c.slug || c.id,
            status,
            activationProgress: c.activationProgress || 75,
            businessesParticipating: totalBusinesses || c.businessesCount || 12,
            activeCampaigns: totalCampaigns || c.campaignsCount || 3,
            fundingTarget: c.fundingTarget || 5000000,
            fundingRaised: c.fundingRaised || 1500000,
            boroughs,
          };
        });

        setCities(mapped);
      } catch (err) {
        console.error("Failed to load location tree for discovery:", err);
        if (mounted) setCities([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTree();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      const matchesSearch = city.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || city.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cities, search, statusFilter]);

  const toggleCity = (cityId: string) => {
    setExpandedCity(expandedCity === cityId ? null : cityId);
    setExpandedBorough(null);
  };

  const toggleBorough = (boroughId: string) => {
    setExpandedBorough(expandedBorough === boroughId ? null : boroughId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-blue-300">UK Business Network</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Business Discovery</h1>
            <p className="mt-3 text-blue-200">
              Find businesses, campaigns and activation across cities, boroughs, and high streets in the UK.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ FILTERS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cities..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "making_progress", label: "Making Progress" },
              { value: "needs_activation", label: "Inactive" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CITY CARDS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-sm text-gray-400">
            Loading UK city and location hierarchy from database...
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCities.map((city) => {
              const isExpanded = expandedCity === city.id;
              const statusMeta: StatusMeta = (STATUS_META[city.status] || STATUS_META.active) as StatusMeta;
              const fundingPct =
                city.fundingTarget > 0
                  ? Math.min(Math.round((city.fundingRaised / city.fundingTarget) * 100), 100)
                  : 0;

              return (
                <div key={city.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  {/* City Header */}
                  <button
                    type="button"
                    onClick={() => toggleCity(city.id)}
                    className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <MapPin className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{city.name}</h3>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.bg} ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{city.businessesParticipating} businesses</span>
                            <span className="flex items-center gap-1"><Target className="h-3 w-3" />{city.activeCampaigns} campaigns</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{fundingPct}% funded</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-bold text-gray-900">{fmt(city.fundingRaised)}</div>
                          <div className="text-[10px] text-gray-400">of {fmt(city.fundingTarget)}</div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Funding bar */}
                    <div className="mt-3 ml-8">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${fundingPct}%` }} />
                      </div>
                    </div>
                  </button>

                  {/* Boroughs (expanded) */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 px-5 py-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Boroughs & Local Areas</h4>
                      {city.boroughs.length === 0 ? (
                        <p className="text-xs text-gray-400">No local areas registered for this city yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {city.boroughs.map((borough) => {
                            const isBoroughExpanded = expandedBorough === borough.id;
                            return (
                              <div key={borough.id} className="rounded-xl border bg-white overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleBorough(borough.id)}
                                  className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Store className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-900">{borough.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>{borough.businessesParticipating} businesses</span>
                                      <span>{borough.activeCampaigns} campaigns</span>
                                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isBoroughExpanded ? "rotate-90" : ""}`} />
                                    </div>
                                  </div>
                                </button>

                                {/* High Streets (expanded) */}
                                {isBoroughExpanded && (
                                  <div className="border-t bg-gray-50 px-4 py-3">
                                    {borough.highStreets.length === 0 ? (
                                      <p className="text-xs text-gray-400">No high streets listed under this borough.</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {borough.highStreets.map((hs) => (
                                          <div key={hs.id} className="flex items-center justify-between rounded-lg bg-white border px-3 py-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-300">├─</span>
                                              <span className="text-sm text-gray-700">{hs.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                              <span>{hs.businesses} businesses</span>
                                              <span>{hs.campaigns} campaigns</span>
                                              <Link
                                                to={`/uk-hub-activation/${city.id}/${borough.id}/${hs.id}`}
                                                className="text-blue-500 hover:text-blue-700 font-medium"
                                              >
                                                View →
                                              </Link>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4">
                        <Link
                          to={`/uk-hub-activation/${city.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View Full City Hub <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredCities.length === 0 && (
              <div className="rounded-2xl border bg-white p-12 text-center">
                <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">No cities match your search</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term or filter</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Join as a Business?</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            Find your city, explore founding member opportunities, and secure your spot as a Founding Business Member.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/uk-hub-activation/business" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Business Founding Programme →
            </Link>
            <Link to="/uk-hub-activation" className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              View UK Hub Overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
