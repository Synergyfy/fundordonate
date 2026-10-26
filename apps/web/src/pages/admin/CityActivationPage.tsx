import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminLocation } from "@/services/admin";
import type { LocationInternalLifecycle, LocationPublicStatus } from "@/types/uk-hub";
import { formatCurrency } from "@/utils/formatters";

type LifecycleFilter = "" | LocationInternalLifecycle;

const LIFECYCLE_ORDER: LocationInternalLifecycle[] = [
  "IDENTIFIED", "PREPARING", "LAUNCHING", "ACTIVATING", "ACTIVE", "EXPANDING",
];

const LIFECYCLE_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  IDENTIFIED: "bg-yellow-100 text-yellow-700",
  PREPARING: "bg-blue-100 text-blue-700",
  LAUNCHING: "bg-indigo-100 text-indigo-700",
  ACTIVATING: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPANDING: "bg-teal-100 text-teal-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const LIFECYCLE_FILTERS: { value: LifecycleFilter; label: string }[] = [
  { value: "", label: "All" },
  ...LIFECYCLE_ORDER.map((l) => ({ value: l, label: l.replace(/_/g, " ") })),
];

interface ActivationRecord {
  id: string;
  name: string;
  slug: string;
  lifecycle: LocationInternalLifecycle;
  publicStatus: LocationPublicStatus;
  activationProgress: number;
  activationThreshold: number;
  fundingTarget: number;
  fundingRaised: number;
  foundingBusinessAllocated: number;
  foundingBusinessTotal: number;
  foundingConsumerAllocated: number;
  foundingConsumerTotal: number;
  region: string;
}

export function CityActivationPage() {
  const [cities, setCities] = useState<ActivationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("");
  const [search, setSearch] = useState("");

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLocations({ type: "CITY", limit: 100 });
      const records: ActivationRecord[] = (res.items || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        slug: loc.slug || loc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        lifecycle: (loc.internalLifecycle || (loc.activationStatus === "ACTIVATED" ? "ACTIVE_OPERATION" : "LAUNCHING")) as LocationInternalLifecycle,
        publicStatus: (loc.statusOverride || (loc.activationStatus === "ACTIVATED" ? "ACTIVE" : loc.activationStatus === "IN_PROGRESS" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION")) as LocationPublicStatus,
        activationProgress: loc.activationProgress ?? (loc.fundingTarget > 0 ? Math.min(100, Math.round((loc.fundingRaised / loc.fundingTarget) * 100)) : 0),
        activationThreshold: loc.activationThreshold || 80,
        fundingTarget: loc.fundingTarget || loc.targetAmount || 0,
        fundingRaised: loc.fundingRaised || 0,
        foundingBusinessAllocated: loc.foundingBusinessAllocated || 0,
        foundingBusinessTotal: loc.foundingBusinessTotal || 0,
        foundingConsumerAllocated: loc.foundingConsumerAllocated || 0,
        foundingConsumerTotal: loc.foundingConsumerTotal || 0,
        region: loc.region || loc.metadata?.region || "United Kingdom",
      }));
      setCities(records);
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
    let list = cities;
    if (lifecycleFilter) list = list.filter((c) => c.lifecycle === lifecycleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q));
    }
    return list;
  }, [cities, lifecycleFilter, search]);

  const lifecycleCounts = useMemo(() => {
    const c: Record<string, number> = {};
    LIFECYCLE_ORDER.forEach((l) => { c[l] = 0; });
    cities.forEach((a) => { c[a.lifecycle] = (c[a.lifecycle] || 0) + 1; });
    return c;
  }, [cities]);

  const totalFunding = useMemo(() => cities.reduce((s, a) => s + a.fundingRaised, 0), [cities]);
  const totalTarget = useMemo(() => cities.reduce((s, a) => s + a.fundingTarget, 0), [cities]);
  const activeCount = cities.filter((a) => a.lifecycle === "ACTIVE").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">City Activation</h1>
          <p className="text-sm text-gray-500">{cities.length} cities across the UK Hub programme</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Active Cities</span>
          <p className="mt-1 text-lg font-bold text-green-700">{activeCount}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Total Raised</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(totalFunding)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Total Target</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Avg Progress</span>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {cities.length > 0 ? Math.round(cities.reduce((s, a) => s + a.activationProgress, 0) / cities.length) : 0}%
          </p>
        </div>
      </div>

      {/* Lifecycle Flow */}
      <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Activation Lifecycle Flow</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {LIFECYCLE_ORDER.map((stage, i) => (
            <div key={stage} className="flex items-center">
              <div className={`rounded-lg px-3 py-2 text-center min-w-[80px] ${
                stage === "ACTIVE" ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
              }`}>
                <p className="text-xs font-medium text-gray-700">{stage.replace(/_/g, " ")}</p>
                <p className="text-lg font-bold text-gray-900">{lifecycleCounts[stage] || 0}</p>
              </div>
              {i < LIFECYCLE_ORDER.length - 1 && (
                <span className="mx-1 text-gray-300">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {LIFECYCLE_FILTERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLifecycleFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              lifecycleFilter === opt.value ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by city name or region..."
        className="input-field w-full"
      />

      {/* City Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-2 py-10 text-center text-gray-400">Loading cities...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm border border-gray-100">
            No cities match your filters.
          </div>
        ) : (
          filtered.map((city) => {
            const fundingPct = city.fundingTarget > 0 ? Math.round((city.fundingRaised / city.fundingTarget) * 100) : 0;
            const bizPct = city.foundingBusinessTotal > 0 ? Math.round((city.foundingBusinessAllocated / city.foundingBusinessTotal) * 100) : 0;
            const consPct = city.foundingConsumerTotal > 0 ? Math.round((city.foundingConsumerAllocated / city.foundingConsumerTotal) * 100) : 0;

            return (
              <div key={city.id} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-gray-400">{city.region}</span>
                    <h3 className="font-bold text-gray-900">{city.name}</h3>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIFECYCLE_COLORS[city.lifecycle]}`}>
                    {city.lifecycle}
                  </span>
                </div>

                {/* Activation Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Activation Progress</span>
                    <span className="font-medium text-gray-700">{city.activationProgress}% (target {city.activationThreshold}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${city.activationProgress >= city.activationThreshold ? "bg-green-500" : "bg-primary-500"}`}
                      style={{ width: `${Math.min(city.activationProgress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Progress Details */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="text-gray-400">Funding</span>
                    <p className="font-bold text-gray-900">{fundingPct}%</p>
                    <span className="text-[10px] text-gray-400">{formatCurrency(city.fundingRaised)}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="text-gray-400">Founding Biz</span>
                    <p className="font-bold text-gray-900">{bizPct}%</p>
                    <span className="text-[10px] text-gray-400">{city.foundingBusinessAllocated}/{city.foundingBusinessTotal}</span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="text-gray-400">Founding Cons</span>
                    <p className="font-bold text-gray-900">{consPct}%</p>
                    <span className="text-[10px] text-gray-400">{city.foundingConsumerAllocated}/{city.foundingConsumerTotal}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status: {city.publicStatus}</span>
                  <Link
                    to={`/admin/hub-locations/${city.id}`}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Manage Hub →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
