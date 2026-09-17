// =============================================================================
// UK Cities — Admin Activation
// Main admin page for UK City Hubs. Shows all cities with geographic coverage,
// activation readiness and progress. Derived from real data.
// =============================================================================

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ChevronRight, MapPin, Plus, LayoutGrid, List,
} from "lucide-react";
import { getCities, formatCurrency } from "@/data/ukHubData";
import { getCityStats } from "@/data/highStreetData";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";

// ───────────────────── Seasons ─────────────────────

const SEASONS = [
  { value: "all", label: "All Seasons" },
  { value: "summer-2026", label: "Summer 2026" },
  { value: "autumn-2026", label: "Autumn 2026", current: true },
  { value: "winter-2026", label: "Winter 2026" },
  { value: "spring-2027", label: "Spring 2027" },
];

// ───────────────────── Status Filter Options ─────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "NOT_ACTIVATED", label: "Not Activated" },
  { value: "NEEDS_ACTIVATION", label: "Inactive" },
  { value: "MAKING_PROGRESS", label: "Making Progress" },
  { value: "ACTIVE", label: "Active" },
];

// ───────────────────── Page ─────────────────────

export function CitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("autumn-2026");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const cities = useMemo(() => getCities(), []);

  const filtered = useMemo(() => {
    return cities.filter((city) => {
      if (search && !city.name.toLowerCase().includes(search.toLowerCase())) return false;

      if (statusFilter !== "all") {
        if (statusFilter === "NOT_ACTIVATED") {
          if (city.publicStatus !== "NEEDS_ACTIVATION") return false;
        } else if (city.publicStatus !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [cities, search, statusFilter]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cities.length };
    for (const city of cities) {
      counts[city.publicStatus] = (counts[city.publicStatus] || 0) + 1;
    }
    return counts;
  }, [cities]);

  // Get city stats from highStreetData
  const getCityRowData = (citySlug: string) => {
    const stats = getCityStats(citySlug) as any;
    if (stats) {
      return {
        localAreas: stats.totalLocalAreas,
        localAreasActive: stats.activeLocalAreas ?? 0,
        highStreets: stats.totalHighStreets,
        highStreetsActive: stats.activeHighStreets ?? 0,
        campaigns: stats.totalCampaigns,
        businesses: stats.totalBusinesses,
        businessesParticipating: stats.participatingBusinesses ?? 0,
      };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">UK Activation</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Cities</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UK Cities</h1>
          <p className="text-sm text-gray-500">Manage UK City Hubs, geographic coverage, activation readiness and progress.</p>
        </div>
        <button
          onClick={() => navigate("/admin/cities/new")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add / Activate City
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const count = opt.value === "all"
            ? statusCounts.all
            : statusCounts[opt.value] || 0;
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                statusFilter === opt.value ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          />
        </div>
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          {SEASONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}{s.current ? " (Current)" : ""}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode("table")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "table" ? "bg-primary-50 text-primary-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "cards" ? "bg-primary-50 text-primary-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Table View ─── */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-bold text-gray-600">City</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Local Areas</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">High Streets</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Campaigns</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Progress</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((city) => {
                  const statusMeta = LOCATION_PUBLIC_STATUS_META[city.publicStatus];
                  const citySeed = city as unknown as Record<string, unknown>;
                  const activationProgress = (citySeed.activationProgress as number) || 0;
                  const stats = getCityRowData(city.slug);

                  return (
                    <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                            {city.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{city.name}</div>
                            <div className="text-xs text-gray-400">{(citySeed.region as string) || "UK"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-gray-900">{stats?.localAreasActive ?? 0}</span>
                        <span className="text-gray-400"> / {stats?.localAreas ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-gray-900">{stats?.highStreetsActive ?? 0}</span>
                        <span className="text-gray-400"> / {stats?.highStreets ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-gray-900">{stats?.campaigns ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all ${
                                activationProgress >= 70 ? "bg-green-500" :
                                activationProgress >= 30 ? "bg-blue-500" : "bg-amber-400"
                              }`}
                              style={{ width: `${activationProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-10 text-right">{activationProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.bgColor} ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/cities/${city.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
                        >
                          Manage
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No cities match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Cards View ─── */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((city) => {
            const statusMeta = LOCATION_PUBLIC_STATUS_META[city.publicStatus];
            const citySeed = city as unknown as Record<string, unknown>;
            const activationProgress = (citySeed.activationProgress as number) || 0;
            const stats = getCityRowData(city.slug);

            return (
              <Link
                key={city.id}
                to={`/admin/cities/${city.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 flex-shrink-0">
                    {city.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-gray-900">{city.name}</h3>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.bgColor} ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span>{stats?.localAreasActive ?? 0}/{stats?.localAreas ?? 0} local areas</span>
                      <span>{stats?.highStreetsActive ?? 0}/{stats?.highStreets ?? 0} high streets</span>
                      <span>{stats?.campaigns ?? 0} campaigns</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          activationProgress >= 70 ? "bg-green-500" :
                          activationProgress >= 30 ? "bg-blue-500" : "bg-amber-400"
                        }`}
                        style={{ width: `${activationProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(city.fundingRaised)}</div>
                    <div className="text-xs text-gray-400">of {formatCurrency(city.fundingTarget)}</div>
                    <div className="text-xs font-medium text-primary-600 mt-1">{activationProgress}%</div>
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No cities match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
