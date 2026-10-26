// =============================================================================
// Admin — City Management View
// Contextual view for a single city: Overview, Local Areas, High Streets,
// Campaigns, Progress tabs. Live backend API data.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, Globe, Store, Users, TrendingUp,
  BarChart3, Target, Search,
} from "lucide-react";
import { adminApi, type AdminLocation } from "@/services/admin";
import { hubProgressApi, type LocationStatsData } from "@/services/hub-progress";
import { formatCurrency } from "@/utils/formatters";

type CityTab = "overview" | "local-areas" | "high-streets" | "progress";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
  MAKING_PROGRESS: { label: "Making Progress", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  NEEDS_ACTIVATION: { label: "Inactive", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
};

export function CityManagementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [city, setCity] = useState<AdminLocation | null>(null);
  const [childLocations, setChildLocations] = useState<AdminLocation[]>([]);
  const [stats, setStats] = useState<LocationStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CityTab>("overview");
  const [search, setSearch] = useState("");

  const fetchCityAndChildren = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      let loc: AdminLocation;
      try {
        loc = await adminApi.getLocation(id);
      } catch {
        const res = await adminApi.getLocations({ search: id, limit: 5 });
        loc = (res.items || []).find((item) => item.slug === id) ?? res.items?.[0];
      }
      setCity(loc || null);
      if (loc?.id) {
        const childrenRes = await adminApi.getLocations({ parentId: loc.id, limit: 100 });
        setChildLocations(childrenRes.items || []);
        try {
          setStats(await hubProgressApi.getCityStats(loc.id));
        } catch {
          setStats(null);
        }
      }
    } catch {
      setCity(null);
      setChildLocations([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCityAndChildren();
  }, [fetchCityAndChildren]);

  const localAreas = useMemo(() => {
    return childLocations.filter((l) => l.type === "BOROUGH" || l.type === "LOCAL_AREA" || l.type === "DISTRICT");
  }, [childLocations]);

  const highStreets = useMemo(() => {
    return childLocations.filter((l) => l.type === "HIGH_STREET" || l.type === "COMMERCIAL_AREA");
  }, [childLocations]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="space-y-6">
        <Link to="/admin/hub-locations" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to UK Locations
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900">City not found</h2>
          <p className="mt-2 text-sm text-gray-500">The city "{id}" could not be found.</p>
        </div>
      </div>
    );
  }

  const statusKey = (() => {
    const value = (city.statusOverride || city.activationStatus || "").toUpperCase();
    if (value === "ACTIVE" || value === "ACTIVATED") return "ACTIVE";
    if (value === "IN_PROGRESS" || value === "MAKING_PROGRESS") return "MAKING_PROGRESS";
    return "NEEDS_ACTIVATION";
  })();
  const status = STATUS_META[statusKey] || STATUS_META.NEEDS_ACTIVATION;
  const raised = stats?.fundingRaised ?? city.fundingRaised ?? 0;
  const target = stats?.fundingTarget ?? city.targetAmount ?? 0;
  const progress = stats?.activationProgress ?? (target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin/hub-locations" className="hover:text-gray-700">Locations</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">{city.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-700">
              {city.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{city.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.color} ${status.border} border`}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">{city.slug} • {city.region || "United Kingdom"}</p>
            </div>
          </div>
          <Link
            to={`/admin/hub-locations/${city.id}`}
            className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Edit City Record
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {[
          { id: "overview", label: "Overview" },
          { id: "local-areas", label: `Local Areas (${localAreas.length})` },
          { id: "high-streets", label: `High Streets (${highStreets.length})` },
          { id: "progress", label: "Activation Progress" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CityTab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900">Hub Overview</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500">Local Areas</div>
                <div className="text-2xl font-bold text-gray-900">{localAreas.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500">High Streets</div>
                <div className="text-2xl font-bold text-gray-900">{highStreets.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500">Funding Target</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(target)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500">Funding Raised</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(raised)}</div>
              </div>
            </div>
            {city.description && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Description</h4>
                <p className="text-sm text-gray-700">{city.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "local-areas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Local Areas & Boroughs ({localAreas.length})</h3>
            </div>
            {localAreas.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No local areas registered for this city yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {localAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{area.name}</p>
                        <p className="text-xs text-gray-400">{area.type}</p>
                      </div>
                    </div>
                    <Link
                      to={`/admin/hub-locations/${area.id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "high-streets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">High Streets ({highStreets.length})</h3>
            </div>
            {highStreets.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No high streets registered for this city yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {highStreets.map((street) => (
                  <div key={street.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{street.name}</p>
                        <p className="text-xs text-gray-400">{street.slug}</p>
                      </div>
                    </div>
                    <Link
                      to={`/admin/hub-locations/${street.id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Activation Milestones</h3>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Funding Threshold</span>
                <span className="font-semibold text-gray-900">{progress}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Raised: {formatCurrency(raised)}</span>
                <span>Target: {formatCurrency(target)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
