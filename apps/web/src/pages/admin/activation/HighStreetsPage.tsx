// =============================================================================
// High Streets — Admin Activation
// High street activation management with live backend API data.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ChevronRight, Users, Building2, Globe, Store, Plus, ShieldCheck, MapPin,
  Check, AlertTriangle, Loader2,
} from "lucide-react";
import { adminApi, type AdminLocation, type LocationTreeNode } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";
import {
  HUB_STATUS_META,
  flattenLocationTree,
  getHubStatusKey,
  getMetadata,
  isLocalAreaType,
} from "@/utils/hubLocations";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

const MAX_ROWS = 100;

export function HighStreetsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [streets, setStreets] = useState<AdminLocation[]>([]);
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const [streetsRes, commercialRes, citiesRes, treeRes] = await Promise.all([
        adminApi.getLocations({ type: "HIGH_STREET", limit: 100, includeInactive: true }),
        adminApi.getLocations({ type: "COMMERCIAL_AREA", limit: 100, includeInactive: true }),
        adminApi.getLocations({ type: "CITY", limit: 100, includeInactive: true }).catch(() => ({ items: [] })),
        adminApi.getLocationTree().catch(() => ({ roots: [] })),
      ]);
      setStreets([...(streetsRes.items || []), ...(commercialRes.items || [])]);
      setCities(citiesRes.items || []);
      setTree((treeRes as any).roots || []);
    } catch {
      setStreets([]);
      setCities([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const flatNodes = useMemo(() => flattenLocationTree(tree), [tree]);
  const nodeById = useMemo(() => new Map(flatNodes.map((node) => [node.id, node])), [flatNodes]);

  /** Walk up the tree until we find the owning city. */
  const resolveParents = useCallback(
    (street: AdminLocation) => {
      const area = street.parentId ? nodeById.get(street.parentId) : undefined;
      const areaNode = area && isLocalAreaType(area.type) ? area : undefined;
      let cityNode: LocationTreeNode | undefined;
      let cursor = areaNode;
      while (cursor?.parentId) {
        const parent = nodeById.get(cursor.parentId);
        if (!parent) break;
        if (parent.type === "CITY") {
          cityNode = parent;
          break;
        }
        cursor = parent;
      }
      return {
        areaName: areaNode?.name ?? "—",
        areaId: areaNode?.id ?? street.parentId ?? null,
        cityName: cityNode?.name ?? "—",
        cityId: cityNode?.id ?? null,
      };
    },
    [nodeById],
  );

  const enriched = useMemo(
    () =>
      streets.map((street) => ({
        street,
        ...resolveParents(street),
        layerState:
          (getMetadata(street).layerState as string | undefined) ?? "confirmed",
        postcodes: Array.isArray(getMetadata(street).postcodes)
          ? (getMetadata(street).postcodes as string[])
          : [],
      })),
    [streets, resolveParents],
  );

  const confirmSuggested = async (street: AdminLocation) => {
    setConfirmingId(street.id);
    try {
      await adminApi.updateLocation(street.id, {
        isPublic: true,
        metadata: {
          ...getMetadata(street),
          layerState: "confirmed",
          confirmedAt: new Date().toISOString(),
        },
      });
      await fetchLocations();
    } catch (err: any) {
      alert(err?.message || "Failed to confirm this high street.");
    } finally {
      setConfirmingId(null);
    }
  };

  const filtered = useMemo(() => {
    return enriched.filter(({ street, cityId }) => {
      if (search && !street.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && cityId !== cityFilter) return false;
      return true;
    });
  }, [enriched, search, cityFilter]);

  const visible = filtered.slice(0, MAX_ROWS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {!embedded && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to="/admin/cities" className="hover:text-gray-700">Cities</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">High Streets</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">High Streets Activation</h1>
            <p className="text-sm text-gray-500">
              {streets.length} registered UK high streets across {cities.length} cities
            </p>
          </div>
        )}
        <button
          onClick={() => navigate("/admin/cities/new")}
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add High Street
        </button>
      </div>

      {/* Audience Filter */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {AUDIENCE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAudience(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              audience === tab.id
                ? "bg-primary-50 text-primary-700 font-semibold"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & City Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search high streets..."
            className="input-field w-full pl-9"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="all">All Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="rounded-xl bg-white border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Loading high streets…</div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No high streets found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map(({ street, areaName, cityName, cityId, postcodes, layerState }) => {
              const status = HUB_STATUS_META[getHubStatusKey(street)];
              const raised = street.fundingRaised ?? street.raisedAmount ?? 0;
              const target = street.fundingTarget ?? street.targetAmount ?? 0;
              const suggested = layerState === "suggested";

              return (
                <div key={street.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${suggested ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    <Store className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{street.name}</span>
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${status.bg} ${status.color} ${status.border}`}>
                        {status.label}
                      </span>
                      {suggested ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Suggested
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                          <ShieldCheck className="h-3 w-3" /> Official
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{areaName} · {cityName}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {postcodes.length > 0 ? (
                        postcodes.slice(0, 6).map((pc) => (
                          <span
                            key={pc}
                            className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                          >
                            {pc}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No postcode coverage set</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {audience !== "consumers" && <span>{street.businessCount ?? 0} businesses</span>}
                      <span>{formatCurrency(raised)} raised of {formatCurrency(target)}</span>
                    </div>
                  </div>
                  {suggested && (
                    <button
                      onClick={() => confirmSuggested(street)}
                      disabled={confirmingId === street.id}
                      className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                    >
                      {confirmingId === street.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Confirm
                    </button>
                  )}
                  <Link
                    to={cityId ? `/admin/cities/${cityId}` : "/admin/cities"}
                    className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Manage <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        {filtered.length > MAX_ROWS && (
          <div className="border-t px-5 py-3 text-center text-xs text-gray-400">
            Showing {MAX_ROWS} of {filtered.length} high streets — refine the search or city filter to narrow down.
          </div>
        )}
      </div>
    </div>
  );
}
