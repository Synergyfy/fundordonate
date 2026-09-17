// =============================================================================
// Activation Progress — Admin
// UK-wide activation monitoring view with real data from ukHubData.
// Shows National summary, city progress table, and audience filter.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Globe, Users, Building2, AlertTriangle, TrendingUp, Target, MapPin } from "lucide-react";
import { getCities, getNationalHubSummary } from "@/data/ukHubData";

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

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export function ActivationProgressPage() {
  const [audience, setAudience] = useState<Audience>("all");

  const cities = useMemo(() => getCities(), []);
  const summary = useMemo(() => getNationalHubSummary(), []);

  const activeCities = cities.filter(c => c.publicStatus === "ACTIVE");
  const progressCities = cities.filter(c => c.publicStatus === "MAKING_PROGRESS");
  const inactiveCities = cities.filter(c => c.publicStatus === "NEEDS_ACTIVATION");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Activation Progress</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">UK Activation Progress</h1>
        <p className="text-sm text-gray-500">Monitor activation across all UK cities</p>
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

      {/* National Summary */}
      <div className="rounded-xl bg-white border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇬🇧</span>
            <h3 className="text-base font-bold text-gray-900">National Overview</h3>
          </div>
          <span className="text-sm font-bold text-primary-600">{summary.totalCities} cities</span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{summary.totalCities}</div>
            <div className="text-[10px] text-gray-400">Cities</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-lg font-bold text-green-700">{summary.active}</div>
            <div className="text-[10px] text-green-600">Active</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <div className="text-lg font-bold text-amber-700">{summary.makingProgress}</div>
            <div className="text-[10px] text-amber-600">Making Progress</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-700">{summary.needsActivation}</div>
            <div className="text-[10px] text-gray-500">Inactive</div>
          </div>
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <div className="text-lg font-bold text-primary-700">{summary.totalFoundingBusiness + summary.totalFoundingConsumer}</div>
            <div className="text-[10px] text-primary-600">Businesses</div>
          </div>
        </div>

        {audience === "all" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <div className="text-[10px] font-bold text-blue-600 mb-1">CONSUMERS</div>
              <div className="text-lg font-bold text-gray-900">{fmt(summary.totalFundingRaised / 2)}</div>
              <div className="text-[10px] text-gray-500">Across {summary.totalCities} cities</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
              <div className="text-[10px] font-bold text-purple-600 mb-1">BUSINESS OWNERS</div>
              <div className="text-lg font-bold text-gray-900">{fmt(summary.totalFundingRaised / 2)}</div>
              <div className="text-[10px] text-gray-500">{summary.totalFoundingBusiness} founding spots allocated</div>
            </div>
          </div>
        )}
      </div>

      {/* City Progress Table */}
      <div className="rounded-xl bg-white border">
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
                <th className="px-5 py-3 text-center font-medium hidden md:table-cell">Local Areas</th>
                <th className="px-5 py-3 text-center font-medium hidden md:table-cell">High Streets</th>
                <th className="px-5 py-3 text-right font-medium hidden lg:table-cell">Funding</th>
                <th className="px-5 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cities.map((city) => {
                const status = STATUS_META[city.publicStatus] || STATUS_META.NOT_ACTIVATED;
                const progress = (city as any).activationProgress || 0;
                const fmtCurrency = (p: number) =>
                  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);
                return (
                  <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {city.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{city.name}</div>
                          <div className="text-xs text-gray-500">{(city as any).currentSeason || "No season"}</div>
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
                      {status && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.color} ${status.border} border`}>
                          {status.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-700">{(city as any).localAreaCount || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-700">{(city as any).highStreetCount || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-700">{fmtCurrency(city.fundingRaised || 0)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        to={`/admin/cities/${city.slug}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {cities.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No cities found.</p>
          </div>
        )}
      </div>

      {/* Summary by status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Active ({activeCities.length})</span>
          </div>
          {activeCities.length > 0 ? (
            <div className="space-y-1">
              {activeCities.map(c => (
                <Link key={c.id} to={`/admin/cities/${c.slug}`} className="block text-sm text-green-800 hover:underline">{c.name}</Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-600">No active cities yet.</p>
          )}
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">Making Progress ({progressCities.length})</span>
          </div>
          {progressCities.length > 0 ? (
            <div className="space-y-1">
              {progressCities.map(c => (
                <Link key={c.id} to={`/admin/cities/${c.slug}`} className="block text-sm text-amber-800 hover:underline">{c.name}</Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600">No cities in progress yet.</p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600">Inactive ({inactiveCities.length})</span>
          </div>
          {inactiveCities.length > 0 ? (
            <div className="space-y-1">
              {inactiveCities.map(c => (
                <Link key={c.id} to={`/admin/cities/${c.slug}`} className="block text-sm text-gray-700 hover:underline">{c.name}</Link>
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
