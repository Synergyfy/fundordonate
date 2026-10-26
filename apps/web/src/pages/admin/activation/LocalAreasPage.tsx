// =============================================================================
// Local Areas — Admin Activation
// Local area activation management with live backend API data.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Users, Building2, Globe, Plus } from "lucide-react";
import { adminApi, type AdminLocation } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

export function LocalAreasPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [areas, setAreas] = useState<AdminLocation[]>([]);
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const [boroughsRes, districtRes, localAreasRes, citiesRes] = await Promise.all([
        adminApi.getLocations({ type: "BOROUGH", limit: 100 }),
        adminApi.getLocations({ type: "DISTRICT", limit: 100 }),
        adminApi.getLocations({ type: "LOCAL_AREA", limit: 100 }),
        adminApi.getLocations({ type: "CITY", limit: 50 }).catch(() => ({ items: [] })),
      ]);
      const combined = [...(boroughsRes.items || []), ...(districtRes.items || []), ...(localAreasRes.items || [])];
      setAreas(combined);
      setCities(citiesRes.items || []);
    } catch {
      setAreas([]);
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const filtered = useMemo(() => {
    return areas.filter((area) => {
      if (search && !area.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && area.parentId !== cityFilter) return false;
      return true;
    });
  }, [areas, search, cityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embedded && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">Local Areas</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Local Areas & Boroughs</h1>
            <p className="text-sm text-gray-500">Live operational monitoring of all {areas.length} registered UK local areas</p>
          </div>
          <Link
            to="/admin/hub-locations"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Location
          </Link>
        </div>
      )}

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
            placeholder="Search local areas..."
            className="input-field w-full pl-9"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="all">All Cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                <th className="px-5 py-3 text-left font-medium">Local Area</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Funding Raised</th>
                <th className="px-5 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Loading local areas...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No local areas found.</td>
                </tr>
              ) : (
                filtered.map((area) => {
                  const raised = (area as any).fundingRaised || 0;
                  const isActive = area.status === "ACTIVE";

                  return (
                    <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Globe className="h-4 w-4 text-primary-600 shrink-0" />
                          <span className="font-medium text-gray-900">{area.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {area.type}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {isActive ? "Active" : "In Progress"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-xs font-semibold text-gray-900">
                        {formatCurrency(raised)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          to={`/admin/hub-locations/${area.id}`}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          Manage →
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
    </div>
  );
}
