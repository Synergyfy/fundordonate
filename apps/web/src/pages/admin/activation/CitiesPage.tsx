// =============================================================================
// UK Cities — Admin Activation
// Main admin page for UK City Hubs. Shows geographic coverage, activation
// readiness, operating-area confirmation and progress from the backend API.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ChevronRight, MapPin, Plus, LayoutGrid, List, Check, ShieldCheck,
} from "lucide-react";
import { adminApi, type AdminLocation, type LocationTreeNode } from "@/services/admin";
import { useAdminSeasons } from "@/services/admin/hook";
import { formatCurrency } from "@/utils/formatters";
import {
  HUB_STATUS_META,
  countCityLayers,
  flattenLocationTree,
  getHubStatusKey,
  getMetadata,
  getSeasonId,
  isBoundaryConfirmed,
} from "@/utils/hubLocations";

// ───────────────────── Status Filter Options ─────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "NEEDS_ACTIVATION", label: "Inactive" },
  { value: "MAKING_PROGRESS", label: "Making Progress" },
  { value: "ACTIVE", label: "Active" },
];

export function CitiesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: seasonsData, isLoading: seasonsLoading } = useAdminSeasons({ limit: 100 });
  const seasons = useMemo(() => seasonsData?.items ?? [], [seasonsData]);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const [citiesRes, treeRes] = await Promise.all([
        adminApi.getLocations({ type: "CITY", limit: 100, includeInactive: true }),
        adminApi.getLocationTree().catch(() => ({ roots: [] })),
      ]);
      setCities(citiesRes.items || []);
      setTree(treeRes.roots || []);
    } catch {
      setCities([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const flatNodes = useMemo(() => flattenLocationTree(tree), [tree]);

  const layerCounts = useMemo(() => {
    const map = new Map<string, ReturnType<typeof countCityLayers>>();
    for (const city of cities) {
      map.set(city.id, countCityLayers(city.id, flatNodes, { businesses: city.businessCount }));
    }
    return map;
  }, [cities, flatNodes]);

  const counts = (city: AdminLocation) =>
    layerCounts.get(city.id) ?? { localAreas: 0, highStreets: 0, businesses: city.businessCount ?? 0 };

  const seasonLabel = (city: AdminLocation) => {
    const seasonId = getSeasonId(city);
    if (!seasonId) return null;
    return seasons.find((season) => season.id === seasonId)?.name ?? seasonId;
  };

  const filtered = useMemo(() => {
    return cities.filter((city) => {
      if (search && !city.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && getHubStatusKey(city) !== statusFilter) return false;
      if (seasonFilter !== "all" && getSeasonId(city) !== seasonFilter) return false;
      return true;
    });
  }, [cities, search, statusFilter, seasonFilter]);

  const statusCounts = useMemo(() => {
    const result: Record<string, number> = { all: cities.length };
    for (const city of cities) {
      const key = getHubStatusKey(city);
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }, [cities]);

  const confirmBoundary = async (city: AdminLocation) => {
    setConfirmingId(city.id);
    try {
      const meta = getMetadata(city);
      await adminApi.updateLocation(city.id, {
        metadata: {
          ...meta,
          boundaryMode: meta.boundaryMode ?? "detected",
          boundaryConfirmed: true,
        },
      });
      await fetchCities();
    } catch (err: any) {
      alert(err?.message || "Failed to confirm the operating area. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  const boundaryChip = (city: AdminLocation, align: "center" | "left" = "center") => {
    const confirmed = isBoundaryConfirmed(city);
    return (
      <div className={`mt-1 flex items-center gap-1 ${align === "center" ? "justify-center" : ""}`}>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${
            confirmed
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
          title={
            confirmed
              ? "Operating area confirmed by admin"
              : "Operating area suggested by geographic data — not yet confirmed"
          }
        >
          {confirmed ? <ShieldCheck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {confirmed ? "Boundary confirmed" : "Boundary suggested"}
        </span>
        {!confirmed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              confirmBoundary(city);
            }}
            disabled={confirmingId === city.id}
            className="inline-flex items-center gap-0.5 rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            <Check className="h-3 w-3" /> {confirmingId === city.id ? "Saving…" : "Confirm"}
          </button>
        )}
      </div>
    );
  };

  const statusBadge = (city: AdminLocation) => {
    const meta = HUB_STATUS_META[getHubStatusKey(city)];
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color} ${meta.border}`}
      >
        {meta.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">UK Activation</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">Cities</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">UK Cities</h1>
            <p className="text-sm text-gray-500">
              Manage UK City Hubs, geographic coverage, activation readiness and progress.
            </p>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
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
          <button
            onClick={() => navigate("/admin/cities/new")}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add / Activate City
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const count = opt.value === "all" ? statusCounts.all : statusCounts[opt.value] || 0;
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
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  statusFilter === opt.value
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
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
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          disabled={seasonsLoading}
          className="input-field w-auto min-w-[180px]"
        >
          <option value="all">All Seasons</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
              {season.status === "ACTIVE" ? " (current)" : ""}
            </option>
          ))}
        </select>
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
                  <th className="px-5 py-3 text-center font-medium">Local Areas</th>
                  <th className="px-5 py-3 text-center font-medium">High Streets</th>
                  <th className="px-5 py-3 text-center font-medium">Businesses</th>
                  <th className="px-5 py-3 text-right font-medium">Target</th>
                  <th className="px-5 py-3 text-right font-medium">Funding Raised</th>
                  <th className="px-5 py-3 text-center font-medium">Operating Area</th>
                  <th className="px-5 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">Loading cities…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">No cities match criteria.</td>
                  </tr>
                ) : (
                  filtered.map((city) => {
                    const raised = city.fundingRaised ?? city.raisedAmount ?? 0;
                    const target = city.fundingTarget ?? city.targetAmount ?? 0;
                    const cityCounts = counts(city);
                    const season = seasonLabel(city);

                    return (
                      <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                              {city.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{city.name}</div>
                              <div className="text-xs text-gray-500">
                                {city.slug}
                                {season ? ` • ${season}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">{statusBadge(city)}</td>
                        <td className="px-5 py-4 text-center text-sm font-medium text-gray-700">
                          {cityCounts.localAreas}
                        </td>
                        <td className="px-5 py-4 text-center text-sm font-medium text-gray-700">
                          {cityCounts.highStreets}
                        </td>
                        <td className="px-5 py-4 text-center text-sm font-medium text-gray-700">
                          {cityCounts.businesses}
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-gray-600">
                          {formatCurrency(target)}
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-semibold text-gray-900">
                          {formatCurrency(raised)}
                        </td>
                        <td className="px-5 py-4 text-center">{boundaryChip(city)}</td>
                        <td className="px-5 py-4 text-center">
                          <Link
                            to={`/admin/cities/${city.id}`}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                          >
                            Manage Hub →
                          </Link>
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
            const raised = city.fundingRaised ?? city.raisedAmount ?? 0;
            const target = city.fundingTarget ?? city.targetAmount ?? 0;
            const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
            const cityCounts = counts(city);
            const season = seasonLabel(city);

            return (
              <div key={city.id} className="rounded-xl border bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary-700">
                      {city.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{city.name}</h3>
                      <p className="text-xs text-gray-500">{season ?? city.slug}</p>
                    </div>
                  </div>
                  {statusBadge(city)}
                </div>

                {boundaryChip(city, "left")}

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 py-2">
                    <div className="text-sm font-bold text-gray-900">{cityCounts.localAreas}</div>
                    <div className="text-[10px] text-gray-500">Areas</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 py-2">
                    <div className="text-sm font-bold text-gray-900">{cityCounts.highStreets}</div>
                    <div className="text-[10px] text-gray-500">Streets</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 py-2">
                    <div className="text-sm font-bold text-gray-900">{cityCounts.businesses}</div>
                    <div className="text-[10px] text-gray-500">Businesses</div>
                  </div>
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
          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              No cities match criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
