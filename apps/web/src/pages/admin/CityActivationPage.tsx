import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ALL_LOCATIONS } from "@/data/ukHubData";
import type { LocationInternalLifecycle, LocationPublicStatus } from "@/types/uk-hub";

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

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

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
  hasBoroughs: boolean;
  featured: boolean;
}

function buildActivationData(): ActivationRecord[] {
  const cities = ALL_LOCATIONS.filter((l) => l.type === "CITY");
  return cities.map((loc) => {
    const seed = loc as unknown as Record<string, unknown>;
    const region = (seed.region as string) || "";
    const lifecycle = (seed.lifecycle as LocationInternalLifecycle) || "IDENTIFIED";
    const publicStatus = loc.publicStatus;
    const activationProgress = (seed.activationProgress as number) || 0;
    const fundingTarget = loc.fundingTarget;
    const fundingRaised = loc.fundingRaised;
    const foundingBusinessAllocated = loc.foundingBusinessAllocated;
    const foundingBusinessTotal = loc.foundingBusinessTotal;
    const foundingConsumerAllocated = loc.foundingConsumerAllocated;
    const foundingConsumerTotal = loc.foundingConsumerTotal;
    const hasBoroughs = (seed.hasBoroughs as boolean) || false;
    const featured = (seed.featured as boolean) || false;

    return {
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      lifecycle,
      publicStatus,
      activationProgress,
      activationThreshold: loc.activationThreshold || 0,
      fundingTarget,
      fundingRaised,
      foundingBusinessAllocated,
      foundingBusinessTotal,
      foundingConsumerAllocated,
      foundingConsumerTotal,
      region,
      hasBoroughs,
      featured,
    };
  });
}

const ALL_ACTIVATION = buildActivationData();

export function CityActivationPage() {
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = ALL_ACTIVATION;
    if (lifecycleFilter) list = list.filter((c) => c.lifecycle === lifecycleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q));
    }
    return list;
  }, [lifecycleFilter, search]);

  const lifecycleCounts = useMemo(() => {
    const c: Record<string, number> = {};
    LIFECYCLE_ORDER.forEach((l) => { c[l] = 0; });
    ALL_ACTIVATION.forEach((a) => { c[a.lifecycle] = (c[a.lifecycle] || 0) + 1; });
    return c;
  }, []);

  const totalFunding = useMemo(() => ALL_ACTIVATION.reduce((s, a) => s + a.fundingRaised, 0), []);
  const totalTarget = useMemo(() => ALL_ACTIVATION.reduce((s, a) => s + a.fundingTarget, 0), []);
  const activeCount = ALL_ACTIVATION.filter((a) => a.lifecycle === "ACTIVE").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">City Activation</h1>
          <p className="text-sm text-gray-500">{ALL_ACTIVATION.length} cities across the UK Hub programme</p>
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
            {ALL_ACTIVATION.length > 0 ? Math.round(ALL_ACTIVATION.reduce((s, a) => s + a.activationProgress, 0) / ALL_ACTIVATION.length) : 0}%
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
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm border border-gray-100">
            No cities match your filters.
          </div>
        )}
        {filtered.map((city) => {
          const fundingPct = city.fundingTarget > 0 ? Math.round((city.fundingRaised / city.fundingTarget) * 100) : 0;
          const bizPct = city.foundingBusinessTotal > 0 ? Math.round((city.foundingBusinessAllocated / city.foundingBusinessTotal) * 100) : 0;
          const consPct = city.foundingConsumerTotal > 0 ? Math.round((city.foundingConsumerAllocated / city.foundingConsumerTotal) * 100) : 0;
          const atThreshold = city.activationProgress >= city.activationThreshold;

          return (
            <div key={city.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏙️</span>
                    <Link to={`/admin/hub-locations/${city.id}`} className="font-bold text-gray-900 hover:text-primary-600">
                      {city.name}
                    </Link>
                    {city.featured && <span className="text-xs text-amber-500">★</span>}
                  </div>
                  <p className="text-xs text-gray-500">{city.region}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIFECYCLE_COLORS[city.lifecycle] || "bg-gray-100 text-gray-600"}`}>
                  {city.lifecycle.replace(/_/g, " ")}
                </span>
              </div>

              {/* Activation Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Activation</span>
                  <span className={atThreshold ? "text-green-600 font-medium" : "text-gray-500"}>
                    {city.activationProgress}% / {city.activationThreshold}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${atThreshold ? "bg-green-500" : city.activationProgress > 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(city.activationProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Funding */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Funding</span>
                  <span className="text-gray-500">{fundingPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(fundingPct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{formatCurrency(city.fundingRaised)}</span>
                  <span>{formatCurrency(city.fundingTarget)}</span>
                </div>
              </div>

              {/* Founding Slots */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <span className="text-gray-500">Business: </span>
                  <span className="font-medium text-gray-700">{bizPct}%</span>
                  <span className="text-gray-400"> ({city.foundingBusinessAllocated}/{city.foundingBusinessTotal})</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Consumer: </span>
                  <span className="font-medium text-gray-700">{consPct}%</span>
                  <span className="text-gray-400"> ({city.foundingConsumerAllocated}/{city.foundingConsumerTotal})</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <Link to={`/admin/hub-locations/${city.id}`} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  Edit →
                </Link>
                {!atThreshold && (
                  <span className="text-xs text-amber-600">Below threshold</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
