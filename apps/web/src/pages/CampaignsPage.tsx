import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, Target, MapPin, Clock, Users, X,
  SlidersHorizontal, ChevronDown, ArrowRight, Store,
} from "lucide-react";
import { HUB_LOCATIONS } from "@/data/hubActivation";
import { getDemoCampaignsForHighStreet, getLocalAreasForCity } from "@/data/highStreetData";
import type { DemoCampaign } from "@/data/demo";

/* ───────── helpers ───────── */

type CampaignWithLocation = DemoCampaign & {
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  streetSlug: string;
  streetName: string;
};

function getAllHighStreetCampaigns(): CampaignWithLocation[] {
  const all: CampaignWithLocation[] = [];
  const seen = new Set<string>();

  for (const loc of HUB_LOCATIONS) {
    const citySlug = loc.slug;
    const cityName = loc.name;
    const areas = getLocalAreasForCity(citySlug);

    for (const area of areas) {
      for (const street of area.highStreetsList) {
        const campaigns = getDemoCampaignsForHighStreet(citySlug, area.slug, street.slug);
        for (const c of campaigns) {
          if (!seen.has(c.slug)) {
            seen.add(c.slug);
            all.push({
              ...c,
              citySlug,
              cityName,
              areaSlug: area.slug,
              areaName: area.name,
              streetSlug: street.slug,
              streetName: street.name,
            });
          }
        }
      }
    }
  }
  return all;
}

function getCampaignUrl(c: CampaignWithLocation): string {
  const audience = c.targetAudience === "consumer" ? "consumer" : "business";
  return `/uk-hub-activation/${c.citySlug}/${c.areaSlug}/${c.streetSlug}/${audience}/campaign/${c.slug}`;
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function daysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getModeColor(mode: string): string {
  switch (mode) {
    case "fund": return "bg-primary-500/90 text-white";
    case "donate": return "bg-secondary-500/90 text-white";
    case "sponsor": return "bg-amber-500/90 text-white";
    default: return "bg-gray-500/90 text-white";
  }
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case "fund": return "Fund";
    case "donate": return "Donate";
    case "sponsor": return "Sponsor";
    default: return mode;
  }
}

/* ───────── component ───────── */

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAudience, setActiveAudience] = useState("all");
  const [activeSort, setActiveSort] = useState("trending");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedStreet, setSelectedStreet] = useState("all");

  const allCampaigns = useMemo(() => getAllHighStreetCampaigns(), []);

  // Derive filter options from campaigns
  const cities = useMemo(() => {
    const map = new Map<string, string>();
    allCampaigns.forEach(c => map.set(c.citySlug, c.cityName));
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCampaigns]);

  const areas = useMemo(() => {
    if (selectedCity === "all") {
      const map = new Map<string, string>();
      allCampaigns.forEach(c => map.set(c.areaSlug, c.areaName));
      return Array.from(map.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
    }
    const map = new Map<string, string>();
    allCampaigns.filter(c => c.citySlug === selectedCity).forEach(c => map.set(c.areaSlug, c.areaName));
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCampaigns, selectedCity]);

  const streets = useMemo(() => {
    let filtered = allCampaigns;
    if (selectedCity !== "all") filtered = filtered.filter(c => c.citySlug === selectedCity);
    if (selectedArea !== "all") filtered = filtered.filter(c => c.areaSlug === selectedArea);
    const map = new Map<string, string>();
    filtered.forEach(c => map.set(c.streetSlug, c.streetName));
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCampaigns, selectedCity, selectedArea]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    allCampaigns.forEach(c => {
      if (c.category) map.set(c.category.slug, c.category.name);
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [allCampaigns]);

  const filtered = useMemo(() => {
    let result = allCampaigns;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.shortDescription?.toLowerCase().includes(q) ||
        c.cityName.toLowerCase().includes(q) ||
        c.areaName.toLowerCase().includes(q) ||
        c.streetName.toLowerCase().includes(q) ||
        c.category?.name.toLowerCase().includes(q)
      );
    }

    if (selectedCity !== "all") result = result.filter(c => c.citySlug === selectedCity);
    if (selectedArea !== "all") result = result.filter(c => c.areaSlug === selectedArea);
    if (selectedStreet !== "all") result = result.filter(c => c.streetSlug === selectedStreet);

    if (activeCategory !== "all") {
      result = result.filter(c => c.category?.slug === activeCategory);
    }

    if (activeAudience !== "all") {
      result = result.filter(c => c.targetAudience === activeAudience);
    }

    switch (activeSort) {
      case "trending":
        result = [...result].sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0));
        break;
      case "ending":
        result = [...result].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        break;
      case "newest":
        result = [...result].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
        break;
      case "most-backed":
        result = [...result].sort((a, b) => {
          const aCount = (a._count?.donations ?? 0) + (a._count?.pledges ?? 0);
          const bCount = (b._count?.donations ?? 0) + (b._count?.pledges ?? 0);
          return bCount - aCount;
        });
        break;
    }

    return result;
  }, [allCampaigns, search, selectedCity, selectedArea, selectedStreet, activeCategory, activeAudience, activeSort]);

  const activeFilterCount = (selectedCity !== "all" ? 1 : 0) + (selectedArea !== "all" ? 1 : 0) + (selectedStreet !== "all" ? 1 : 0) + (activeCategory !== "all" ? 1 : 0) + (activeAudience !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 px-4 py-4 text-center text-white sm:py-6">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Explore Campaigns</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Discover local campaigns across UK high streets. Support businesses and communities in your area.
        </p>
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white/10 p-1 backdrop-blur-sm">
          <Search className="ml-3 h-5 w-5 text-white/60" />
          <input
            type="text"
            placeholder="Search campaigns, cities, areas or streets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/50 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="mr-1 rounded-full p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={activeSort}
              onChange={e => setActiveSort(e.target.value)}
              className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm hover:border-primary-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="trending">Trending</option>
              <option value="ending">Ending Soon</option>
              <option value="newest">Newest</option>
              <option value="most-backed">Most Backed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Audience pills */}
          {[
            { value: "all", label: "All Audiences", color: "bg-gray-900 text-white" },
            { value: "business", label: "Business", color: "bg-blue-600 text-white" },
            { value: "consumer", label: "Consumer", color: "bg-pink-600 text-white" },
          ].map(a => (
            <button
              key={a.value}
              onClick={() => setActiveAudience(a.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeAudience === a.value
                  ? a.color
                  : "border border-gray-200 bg-white text-gray-600 hover:border-primary-300"
              }`}
            >
              {a.label}
            </button>
          ))}

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced filters — Location */}
        {showFilters && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* City */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">City</label>
                <select
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setSelectedArea("all"); setSelectedStreet("all"); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="all">All Cities</option>
                  {cities.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Borough / Local Area */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Borough / Local Area</label>
                <select
                  value={selectedArea}
                  onChange={e => { setSelectedArea(e.target.value); setSelectedStreet("all"); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="all">All Areas</option>
                  {areas.map(a => (
                    <option key={a.slug} value={a.slug}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* High Street */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">High Street</label>
                <select
                  value={selectedStreet}
                  onChange={e => setSelectedStreet(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="all">All High Streets</option>
                  {streets.map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                <select
                  value={activeCategory}
                  onChange={e => setActiveCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSelectedCity("all");
                  setSelectedArea("all");
                  setSelectedStreet("all");
                  setActiveCategory("all");
                  setActiveAudience("all");
                }}
                className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedCity !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                <MapPin className="h-3 w-3" />
                {cities.find(c => c.slug === selectedCity)?.name}
                <button onClick={() => setSelectedCity("all")} className="ml-0.5 hover:text-primary-900"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedArea !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                {areas.find(a => a.slug === selectedArea)?.name}
                <button onClick={() => setSelectedArea("all")} className="ml-0.5 hover:text-primary-900"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedStreet !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                {streets.find(s => s.slug === selectedStreet)?.name}
                <button onClick={() => setSelectedStreet("all")} className="ml-0.5 hover:text-primary-900"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="mb-4 text-sm text-gray-500">
          {filtered.length} campaign{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Campaign grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Target className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No campaigns match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(c => {
              const progress = Math.min(Math.round((c.raisedAmount / c.goalAmount) * 100), 100);
              const dLeft = daysLeft(c.deadline);
              const href = getCampaignUrl(c);

              return (
                <Link
                  key={c.slug}
                  to={href}
                  className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50">
                    {c.featuredImage ? (
                      <img
                        src={c.featuredImage}
                        alt={c.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Target className="h-12 w-12 text-primary-200" />
                      </div>
                    )}
                    {/* Audience badge */}
                    <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm ${
                      c.targetAudience === "business"
                        ? "bg-blue-600 text-white"
                        : "bg-pink-600 text-white"
                    }`}>
                      {c.targetAudience === "business" ? (
                        <><Store className="h-3.5 w-3.5" /> For Business</>
                      ) : (
                        <><Users className="h-3.5 w-3.5" /> For Consumer</>
                      )}
                    </span>
                    {/* Mode badge */}
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${getModeColor(c.mode)}`}>
                      {getModeLabel(c.mode)}
                    </span>
                    {/* Days left */}
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      {dLeft}d left
                    </span>
                    {/* Location */}
                    <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      <MapPin className="h-3 w-3" />
                      {c.cityName} · {c.areaName}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {c.category && (
                      <span className="text-xs font-medium text-primary-600">{c.category.name}</span>
                    )}
                    <h3 className="mt-1 line-clamp-2 text-base font-bold text-gray-900 group-hover:text-primary-600">
                      {c.title}
                    </h3>
                    {c.shortDescription && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{c.shortDescription}</p>
                    )}

                    {/* Street name */}
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      {c.streetName}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(c.raisedAmount)}</span>
                      <span className="text-sm font-semibold text-secondary-600">{progress}%</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dLeft} day{dLeft !== 1 ? "s" : ""} left
                      </span>
                    </div>

                    {/* Author */}
                    <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {c.author?.firstName?.[0] ?? "U"}
                      </div>
                      <span className="text-xs text-gray-600">
                        {c.author?.firstName} {c.author?.lastName}
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-primary-500" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
