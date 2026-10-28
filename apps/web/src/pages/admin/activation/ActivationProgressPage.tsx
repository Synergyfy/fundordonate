// =============================================================================
// Activation Progress — Admin
// UK-wide activation monitoring view with live backend API data.
// Shows national summary, location establishment checklist, city progress
// table and an at-a-glance breakdown by status.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Globe, Users, Building2, MapPin, TrendingUp, Target,
  AlertTriangle, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { hubProgressApi, type NationalSummary } from "@/services/hub-progress";
import { adminApi, type AdminLocation, type LocationTreeNode } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";
import { getLocationRecommendationCounts } from "@/services/recommendations";
import {
  HUB_STATUS_META,
  countCityLayers,
  flattenLocationTree,
  getHubStatusKey,
  isBoundaryConfirmed,
} from "@/utils/hubLocations";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface CityRow {
  city: AdminLocation;
  localAreas: number;
  highStreets: number;
  businesses: number;
  boundaryConfirmed: boolean;
  progress: number;
  raised: number;
  target: number;
}

export function ActivationProgressPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [audience, setAudience] = useState<Audience>("all");
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [summary, setSummary] = useState<NationalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRecommendations, setPendingRecommendations] = useState(0);

  useEffect(() => {
    Promise.all([
      hubProgressApi.getNationalSummary().catch(() => null),
      adminApi.getLocations({ type: "CITY", limit: 100, includeInactive: true }).catch(() => ({ items: [], total: 0 })),
      adminApi.getLocationTree().catch(() => ({ roots: [] })),
    ]).then(([sumRes, locsRes, treeRes]) => {
      setSummary(sumRes);
      setCities(locsRes.items || []);
      setTree((treeRes as any).roots || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    getLocationRecommendationCounts()
      .then((counts) => setPendingRecommendations(counts.pending))
      .catch(() => setPendingRecommendations(0));
  }, []);

  const flatNodes = useMemo(() => flattenLocationTree(tree), [tree]);

  const rows: CityRow[] = useMemo(
    () =>
      cities.map((city) => {
        const counts = countCityLayers(city.id, flatNodes, { businesses: city.businessCount });
        const raised = city.fundingRaised ?? city.raisedAmount ?? 0;
        const target = city.fundingTarget ?? city.targetAmount ?? 0;
        return {
          city,
          localAreas: counts.localAreas,
          highStreets: counts.highStreets,
          businesses: counts.businesses,
          boundaryConfirmed: isBoundaryConfirmed(city),
          raised,
          target,
          progress: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
        };
      }),
    [cities, flatNodes],
  );

  const totalRaised = summary?.totalFundingRaised || rows.reduce((acc, r) => acc + r.raised, 0);
  const totalTarget = summary?.totalFundingTarget || rows.reduce((acc, r) => acc + r.target, 0);

  const byStatus = useMemo(() => {
    const groups: Record<string, CityRow[]> = { ACTIVE: [], MAKING_PROGRESS: [], NEEDS_ACTIVATION: [] };
    for (const row of rows) groups[getHubStatusKey(row.city)].push(row);
    return groups;
  }, [rows]);

  const establishment = useMemo(() => {
    const total = rows.length;
    const boundaries = rows.filter((r) => r.boundaryConfirmed).length;
    const areasDone = rows.filter((r) => r.localAreas > 0).length;
    const streetsDone = rows.filter((r) => r.highStreets > 0).length;
    const fullyConfirmed = rows.filter(
      (r) => r.boundaryConfirmed && r.localAreas > 0 && r.highStreets > 0,
    ).length;
    return { total, boundaries, areasDone, streetsDone, fullyConfirmed };
  }, [rows]);

  const layerChip = (done: boolean, label: string, title: string) => (
    <span
      title={title}
      className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${
        done
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embedded && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">Activation Progress</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">UK Activation Progress</h1>
            <p className="text-sm text-gray-500">Live operational monitoring across all UK cities</p>
          </div>
          <Link
            to="/admin/locations/recommendations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Location recommendations
            {pendingRecommendations > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingRecommendations} pending
              </span>
            )}
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

      {/* National Summary */}
      <div className="rounded-xl bg-white border p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇬🇧</span>
            <h3 className="text-base font-bold text-gray-900">National Overview</h3>
          </div>
          <span className="text-sm font-bold text-primary-600">{rows.length} cities tracked</span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{rows.length}</div>
            <div className="text-xs text-gray-500">Total Cities</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-lg font-bold text-green-700">{byStatus.ACTIVE.length}</div>
            <div className="text-xs text-green-600">Active Cities</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <div className="text-lg font-bold text-amber-700">{byStatus.MAKING_PROGRESS.length}</div>
            <div className="text-xs text-amber-600">Making Progress</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-700">{byStatus.NEEDS_ACTIVATION.length}</div>
            <div className="text-xs text-gray-500">Inactive</div>
          </div>
        </div>

        {/* National Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Overall National Progress</span>
            <span className="font-semibold text-gray-900">
              {totalTarget > 0 ? Math.round((totalRaised / totalTarget) * 100) : 0}% of {formatCurrency(totalTarget)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-600"
              style={{ width: `${Math.min(totalTarget > 0 ? (totalRaised / totalTarget) * 100 : 0, 100)}%` }}
            />
          </div>
        </div>

        {audience === "all" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <div className="text-[10px] font-bold text-blue-600 mb-1">CONSUMER ACTIVITY</div>
              <div className="text-lg font-bold text-gray-900">
                {summary?.totalFoundingConsumer ?? 0} spots
              </div>
              <div className="text-[10px] text-gray-500">Across {rows.length} cities</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
              <div className="text-[10px] font-bold text-purple-600 mb-1">BUSINESS ACTIVITY</div>
              <div className="text-lg font-bold text-gray-900">
                {summary?.totalFoundingBusiness ?? 0} spots
              </div>
              <div className="text-[10px] text-gray-500">
                {rows.reduce((acc, r) => acc + r.businesses, 0)} businesses registered
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Establishment — per-layer confirmation checklist */}
      <div className="rounded-xl bg-white border p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
            <h3 className="text-base font-bold text-gray-900">Location Establishment</h3>
          </div>
          <span className="text-xs text-gray-500">
            Geographic data only suggests locations — layers count here once Admin confirms them
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-lg font-bold text-green-700">
              {establishment.boundaries}<span className="text-sm text-green-600">/{establishment.total}</span>
            </div>
            <div className="text-[10px] text-green-600">Operating areas confirmed</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="text-lg font-bold text-blue-700">
              {establishment.areasDone}<span className="text-sm text-blue-600">/{establishment.total}</span>
            </div>
            <div className="text-[10px] text-blue-600">Cities with local areas</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <div className="text-lg font-bold text-amber-700">
              {establishment.streetsDone}<span className="text-sm text-amber-600">/{establishment.total}</span>
            </div>
            <div className="text-[10px] text-amber-600">Cities with high streets</div>
          </div>
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <div className="text-lg font-bold text-primary-700">
              {establishment.fullyConfirmed}<span className="text-sm text-primary-600">/{establishment.total}</span>
            </div>
            <div className="text-[10px] text-primary-600">Fully established city setups</div>
          </div>
        </div>
      </div>

      {/* City Progress Table */}
      <div className="rounded-xl bg-white border shadow-xs">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Cities ({rows.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">City</th>
                <th className="px-5 py-3 text-center font-medium">Progress</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium hidden md:table-cell">Local Areas</th>
                <th className="px-5 py-3 text-center font-medium hidden md:table-cell">High Streets</th>
                <th className="px-5 py-3 text-center font-medium">Confirmations</th>
                <th className="px-5 py-3 text-right font-medium hidden lg:table-cell">Funding</th>
                <th className="px-5 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">Loading live city data…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">No cities registered yet.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const { city } = row;
                  const status = HUB_STATUS_META[getHubStatusKey(city)];
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.progress >= 100 ? "bg-green-500" : row.progress >= 50 ? "bg-amber-500" : "bg-primary-500"
                              }`}
                              style={{ width: `${row.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.color} ${status.border}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span className={`text-sm font-medium ${row.localAreas > 0 ? "text-green-700" : "text-gray-700"}`}>
                          {row.localAreas}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span className={`text-sm font-medium ${row.highStreets > 0 ? "text-green-700" : "text-gray-700"}`}>
                          {row.highStreets}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {layerChip(
                            row.boundaryConfirmed,
                            "Boundary",
                            row.boundaryConfirmed ? "Operating area confirmed" : "Operating area not confirmed yet",
                          )}
                          {layerChip(
                            row.localAreas > 0,
                            "Areas",
                            row.localAreas > 0 ? `${row.localAreas} local areas registered` : "No local areas registered",
                          )}
                          {layerChip(
                            row.highStreets > 0,
                            "Streets",
                            row.highStreets > 0 ? `${row.highStreets} high streets registered` : "No high streets registered",
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm font-medium text-gray-700">{formatCurrency(row.raised)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          to={`/admin/cities/${city.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                        >
                          View
                          <ChevronRight className="h-3 w-3" />
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

      {/* Summary by status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Active ({byStatus.ACTIVE.length})</span>
          </div>
          {byStatus.ACTIVE.length > 0 ? (
            <div className="space-y-1">
              {byStatus.ACTIVE.map(({ city }) => (
                <Link key={city.id} to={`/admin/cities/${city.id}`} className="block text-sm text-green-800 hover:underline">
                  {city.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-600">No active cities yet.</p>
          )}
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">Making Progress ({byStatus.MAKING_PROGRESS.length})</span>
          </div>
          {byStatus.MAKING_PROGRESS.length > 0 ? (
            <div className="space-y-1">
              {byStatus.MAKING_PROGRESS.map(({ city }) => (
                <Link key={city.id} to={`/admin/cities/${city.id}`} className="block text-sm text-amber-800 hover:underline">
                  {city.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600">No cities in progress yet.</p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600">Inactive ({byStatus.NEEDS_ACTIVATION.length})</span>
          </div>
          {byStatus.NEEDS_ACTIVATION.length > 0 ? (
            <div className="space-y-1">
              {byStatus.NEEDS_ACTIVATION.map(({ city }) => (
                <Link key={city.id} to={`/admin/cities/${city.id}`} className="block text-sm text-gray-700 hover:underline">
                  {city.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">All cities are active or in progress.</p>
          )}
        </div>
      </div>
    </div>
  );
}
