// =============================================================================
// National Hub — Admin
// Aggregated UK-wide view: Cities, Local Areas, High Streets, Campaigns,
// Business Activity, Consumer Activity with audience filter.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Building2, ChevronRight, Globe, MapPin, Store, Target, TrendingUp } from "lucide-react";
import { getCities, getNationalHubSummary } from "@/data/ukHubData";
import { getLocalAreasForCity, getHighStreetsForCity } from "@/data/highStreetData";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
  MAKING_PROGRESS: { label: "Making Progress", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  NEEDS_ACTIVATION: { label: "Inactive", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  NOT_ACTIVATED: { label: "Inactive", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
};

export function NationalHubPage() {
  const [audience, setAudience] = useState<Audience>("all");

  const cities = useMemo(() => getCities(), []);
  const summary = useMemo(() => getNationalHubSummary(), []);

  const activeCities = cities.filter(c => c.publicStatus === "ACTIVE");
  const inactiveCities = cities.filter(c => c.publicStatus === "NEEDS_ACTIVATION");

  // Aggregate local areas and high streets across all cities
  const totalLocalAreas = useMemo(() => {
    let count = 0;
    cities.forEach(c => { count += getLocalAreasForCity(c.slug).length; });
    return count;
  }, [cities]);

  const totalHighStreets = useMemo(() => {
    let count = 0;
    cities.forEach(c => { count += getHighStreetsForCity(c.slug).length; });
    return count;
  }, [cities]);

  const overallActivation = cities.length > 0
    ? Math.round(cities.filter(c => c.publicStatus === "ACTIVE").length / cities.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">National Hub</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">UK National Hub</h1>
        <p className="text-sm text-gray-500">Aggregated activation overview across the entire UK network</p>
      </div>

      {/* Audience Filter */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {AUDIENCE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAudience(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              audience === tab.id
                ? "bg-primary-50 text-primary-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* UK National Hub Summary */}
      <div className="rounded-xl bg-white border p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🇬🇧</span>
          <h3 className="text-base font-bold text-gray-900">UK National Hub</h3>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.totalCities}</div>
            <div className="text-xs text-gray-500">Cities</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{activeCities.length}</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{inactiveCities.length}</div>
            <div className="text-xs text-gray-500">Inactive</div>
          </div>
        </div>

        {/* Overall Activation */}
        <div className="rounded-lg bg-primary-50 border border-primary-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-primary-700">Overall Activation</span>
            <span className="text-lg font-bold text-primary-800">{overallActivation}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-primary-100 overflow-hidden">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${overallActivation}%` }} />
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Local Areas</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{totalLocalAreas}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Store className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">High Streets</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{totalHighStreets}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Campaigns</span>
            </div>
            <div className="text-xl font-bold text-gray-900">0</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Business Activity</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{summary.totalFoundingBusiness}</div>
          </div>
        </div>

        {audience === "all" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <div className="text-[10px] font-bold text-blue-600 mb-1">CONSUMER ACTIVITY</div>
              <div className="text-lg font-bold text-gray-900">{summary.totalFoundingConsumer} spots</div>
              <div className="text-[10px] text-gray-500">Across {summary.totalCities} cities</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
              <div className="text-[10px] font-bold text-purple-600 mb-1">BUSINESS ACTIVITY</div>
              <div className="text-lg font-bold text-gray-900">{summary.totalFoundingBusiness} spots</div>
              <div className="text-[10px] text-gray-500">Across {summary.totalCities} cities</div>
            </div>
          </div>
        )}
      </div>

      {/* City List */}
      <div className="rounded-xl bg-white border">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Cities ({cities.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {cities.map((city) => {
            const status = STATUS_META[city.publicStatus] || STATUS_META.NOT_ACTIVATED;
            const progress = (city as any).activationProgress || 0;
            return (
              <Link
                key={city.id}
                to={`/admin/cities/${city.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0">
                  {city.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{city.name}</span>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${status?.bg ?? ''} ${status?.color ?? ''} ${status?.border ?? ''} border`}>
                      {status?.label ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">{progress}%</div>
                  <div className="text-xs text-gray-400">activation</div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
