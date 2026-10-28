// =============================================================================
// National Hub — Admin
// Aggregated UK-wide view: Cities, Local Areas, High Streets, Campaigns,
// Business Activity, Consumer Activity with audience filter. Live API backed.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Building2, ChevronRight, Globe, MapPin, Store, TrendingUp } from "lucide-react";
import { hubProgressApi, type NationalSummary } from "@/services/hub-progress";
import { adminApi, type AdminLocation } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";
import { HUB_STATUS_META, getHubStatusKey } from "@/utils/hubLocations";
import { CitiesPage } from "./CitiesPage";
import { LocalAreasPage } from "./LocalAreasPage";
import { HighStreetsPage } from "./HighStreetsPage";
import { ActivationProgressPage } from "./ActivationProgressPage";

type Audience = "all" | "consumers" | "business_owners";
type Section = "overview" | "cities" | "local-areas" | "high-streets" | "progress";

const SECTION_TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Hub Overview", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "cities", label: "Cities", icon: <MapPin className="h-3.5 w-3.5" /> },
  { id: "local-areas", label: "Local Areas", icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: "high-streets", label: "High Streets", icon: <Store className="h-3.5 w-3.5" /> },
  { id: "progress", label: "Activation Progress", icon: <TrendingUp className="h-3.5 w-3.5" /> },
];

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

export function NationalHubPage() {
  const [audience, setAudience] = useState<Audience>("all");
  const [section, setSection] = useState<Section>("overview");
  const [summary, setSummary] = useState<NationalSummary | null>(null);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hubProgressApi.getNationalSummary().catch(() => null),
      adminApi.getLocations({ limit: 100, includeInactive: true }).catch(() => ({ items: [], total: 0 })),
    ]).then(([sumRes, locsRes]) => {
      setSummary(sumRes);
      setLocations(locsRes.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cities = useMemo(() => locations.filter((l) => l.type === "CITY"), [locations]);
  const localAreas = useMemo(() => locations.filter((l) => l.type === "BOROUGH" || l.type === "DISTRICT" || l.type === "LOCAL_AREA"), [locations]);
  const highStreets = useMemo(() => locations.filter((l) => l.type === "HIGH_STREET" || l.type === "COMMERCIAL_AREA"), [locations]);

  const activeCitiesCount = summary?.activeCities ?? summary?.activeCitiesCount ?? cities.filter((c) => getHubStatusKey(c) === "ACTIVE").length;
  const totalFundingRaised = summary?.totalFundingRaised ?? cities.reduce((acc, c) => acc + ((c as any).fundingRaised || 0), 0);
  const totalFundingTarget = summary?.totalFundingTarget ?? cities.reduce((acc, c) => acc + (c.fundingTarget || 10000000), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">UK Activation</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UK Activation Hub</h1>
            <p className="text-sm text-gray-500">
              Aggregated activation overview — {cities.length} cities • {localAreas.length} local areas • {highStreets.length} high streets
            </p>
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {AUDIENCE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAudience(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  audience === tab.id
                    ? "bg-primary-50 text-primary-700 font-bold"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              section === tab.id
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {section === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Active UK Cities</span>
              <p className="mt-1 text-2xl font-bold text-green-700">{activeCitiesCount}</p>
              <span className="text-[11px] text-gray-400">of {cities.length} total cities</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Local Areas & Boroughs</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">{localAreas.length}</p>
              <span className="text-[11px] text-gray-400">across the UK</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">High Streets</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">{highStreets.length}</p>
              <span className="text-[11px] text-gray-400">active high streets</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">National Funding Raised</span>
              <p className="mt-1 text-2xl font-bold text-primary-700">{formatCurrency(totalFundingRaised)}</p>
              <span className="text-[11px] text-gray-400">target: {formatCurrency(totalFundingTarget)}</span>
            </div>
          </div>

          {/* Quick links to lower tiers */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Geographic Hierarchy Drilldown</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => setSection("cities")}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">Cities ({cities.length})</h4>
                  <p className="text-xs text-gray-500">View and configure UK cities</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button
                onClick={() => setSection("local-areas")}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">Local Areas ({localAreas.length})</h4>
                  <p className="text-xs text-gray-500">Boroughs and town centres</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button
                onClick={() => setSection("high-streets")}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">High Streets ({highStreets.length})</h4>
                  <p className="text-xs text-gray-500">Retail & business corridors</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Overall Activation */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Overall Activation</h3>
              <span className="text-lg font-bold text-primary-700">
                {cities.length > 0 ? Math.round((activeCitiesCount / cities.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{
                  width: `${cities.length > 0 ? Math.min(100, Math.round((activeCitiesCount / cities.length) * 100)) : 0}%`,
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <div className="text-[10px] font-bold text-blue-600 mb-1">CONSUMERS</div>
                <div className="text-lg font-bold text-gray-900">
                  {summary?.totalFoundingConsumer ?? 0} spots
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                <div className="text-[10px] font-bold text-purple-600 mb-1">BUSINESS OWNERS</div>
                <div className="text-lg font-bold text-gray-900">
                  {summary?.totalFoundingBusiness ?? 0} spots
                </div>
              </div>
            </div>
          </div>

          {/* City List */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Cities ({cities.length})</h3>
              <button
                onClick={() => setSection("cities")}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Manage cities →
              </button>
            </div>
            {cities.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No cities registered yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cities.map((city) => {
                  const meta = HUB_STATUS_META[getHubStatusKey(city)];
                  const raised = city.fundingRaised ?? city.raisedAmount ?? 0;
                  const target = city.fundingTarget ?? city.targetAmount ?? 0;
                  const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                  return (
                    <Link
                      key={city.id}
                      to={`/admin/cities/${city.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {city.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{city.name}</span>
                          <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color} ${meta.border}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${
                              progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold text-gray-900">{progress}%</div>
                        <div className="text-xs text-gray-400">activation</div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Sub-views */}
      {section === "cities" && <CitiesPage embedded />}
      {section === "local-areas" && <LocalAreasPage embedded />}
      {section === "high-streets" && <HighStreetsPage embedded />}
      {section === "progress" && <ActivationProgressPage embedded />}
    </div>
  );
}
