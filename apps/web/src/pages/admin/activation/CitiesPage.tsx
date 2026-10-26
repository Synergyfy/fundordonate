// =============================================================================
// UK Cities — Admin Activation
// Main admin page for UK City Hubs. Shows all cities with live geographic coverage,
// activation readiness and progress from backend API.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, MapPin, LayoutGrid, List } from "lucide-react";
import { adminApi, type AdminLocation } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";

// ───────────────────── Status Filter Options ─────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "MAKING_PROGRESS", label: "Making Progress" },
  { value: "NEEDS_ACTIVATION", label: "Inactive" },
];

export function CitiesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLocations({ type: "CITY", limit: 100 });
      setCities(res.items || []);
    } catch {
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const filtered = useMemo(() => {
    return cities.filter((city) => {
      if (search && !city.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all") {
        const effective = city.status === "ACTIVE" ? "ACTIVE" : "NEEDS_ACTIVATION";
        if (statusFilter === "ACTIVE" && city.status !== "ACTIVE") return false;
        if (statusFilter === "NEEDS_ACTIVATION" && city.status === "ACTIVE") return false;
      }
      return true;
    });
  }, [cities, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const active = cities.filter((c) => c.status === "ACTIVE").length;
    return {
      all: cities.length,
      ACTIVE: active,
      NEEDS_ACTIVATION: cities.length - active,
      MAKING_PROGRESS: cities.length - active,
    };
  }, [cities]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!embedded && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">Cities</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">UK City Hubs</h1>
            <p className="text-sm text-gray-500">Live configuration and activation status for all {cities.length} UK cities</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "table" ? "bg-primary-50 text-primary-700" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "cards" ? "bg-primary-50 text-primary-700" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="input-field w-full pl-9"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label} ({statusCounts[opt.value as keyof typeof statusCounts] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-xl bg-white border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                  <th className="px-5 py-3 text-left font-medium">City</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Target</th>
                  <th className="px-5 py-3 text-right font-medium">Funding Raised</th>
                  <th className="px-5 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">Loading cities from database...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">No cities match criteria.</td>
                  </tr>
                ) : (
                  filtered.map((city) => {
                    const raised = (city as any).fundingRaised || 0;
                    const target = city.fundingTarget || 10000000;
                    const isActive = city.status === "ACTIVE";

                    return (
                      <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                              {city.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{city.name}</div>
                              <div className="text-xs text-gray-500">{city.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {isActive ? "Active" : "Making Progress"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-gray-600">
                          {formatCurrency(target)}
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-semibold text-gray-900">
                          {formatCurrency(raised)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/admin/cities/${city.id}`}
                              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                            >
                              Manage Hub →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((city) => {
            const raised = (city as any).fundingRaised || 0;
            const target = city.fundingTarget || 10000000;
            const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
            const isActive = city.status === "ACTIVE";

            return (
              <div key={city.id} className="rounded-xl border bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary-700">
                      {city.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{city.name}</h3>
                      <p className="text-xs text-gray-500">{city.slug}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {isActive ? "Active" : "In Progress"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Funding Progress</span>
                    <span className="font-bold text-gray-900">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                    <span>{formatCurrency(raised)}</span>
                    <span>{formatCurrency(target)}</span>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 flex justify-end">
                  <Link
                    to={`/admin/cities/${city.id}`}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Manage Hub →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
