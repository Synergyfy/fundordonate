// =============================================================================
// Activation Progress — Admin
// UK-wide activation monitoring view with live backend API data.
// Shows National summary, city progress table, and audience filter.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Globe, Users, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { hubProgressApi, type NationalSummary } from "@/services/hub-progress";
import { adminApi, type AdminLocation } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";

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

export function ActivationProgressPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [audience, setAudience] = useState<Audience>("all");
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [summary, setSummary] = useState<NationalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hubProgressApi.getNationalSummary().catch(() => null),
      adminApi.getLocations({ type: "CITY", limit: 50 }).catch(() => ({ items: [], total: 0 })),
    ]).then(([sumRes, locsRes]) => {
      setSummary(sumRes);
      setCities(locsRes.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRaised = summary?.totalFundingRaised || cities.reduce((acc, c) => acc + ((c as any).fundingRaised || 0), 0);
  const totalTarget = summary?.totalFundingTarget || cities.reduce((acc, c) => acc + (c.fundingTarget || 10000000), 0);
  const activeCitiesCount = summary?.activeCitiesCount ?? cities.filter((c) => c.status === "ACTIVE").length;
  const progressCitiesCount = summary?.progressCitiesCount ?? cities.filter((c) => c.status !== "ACTIVE").length;

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
            to="/admin/hub-locations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Manage all locations
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
          <span className="text-sm font-bold text-primary-600">{cities.length} cities tracked</span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{cities.length}</div>
            <div className="text-xs text-gray-500">Total Cities</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-green-700">{activeCitiesCount}</div>
            <div className="text-xs text-gray-500">Active Cities</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-amber-700">{progressCitiesCount}</div>
            <div className="text-xs text-gray-500">Making Progress</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{formatCurrency(totalRaised)}</div>
            <div className="text-xs text-gray-500">Total Funding Raised</div>
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
      </div>

      {/* City Progress Table */}
      <div className="rounded-xl bg-white border shadow-xs">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Cities ({cities.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">City</th>
                <th className="px-5 py-3 text-center font-medium">Progress</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium hidden lg:table-cell">Funding</th>
                <th className="px-5 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Loading live city data...</td>
                </tr>
              ) : cities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No cities registered yet.</td>
                </tr>
              ) : (
                cities.map((city) => {
                  const statusKey = city.status === "ACTIVE" ? "ACTIVE" : "MAKING_PROGRESS";
                  const status = STATUS_META[statusKey];
                  const raised = (city as any).fundingRaised || 0;
                  const target = city.fundingTarget || 10000000;
                  const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

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
                                progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.color} ${status.border} border`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm font-medium text-gray-700">{formatCurrency(raised)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          to={`/admin/hub-locations/${city.id}`}
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
    </div>
  );
}
