// =============================================================================
// Business Discovery Page
// Filtered view of cities, boroughs, and high streets showing business
// participation, campaigns, and activation status.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, MapPin, Search, ArrowRight, TrendingUp, Target,
  ChevronDown, ChevronRight, Store,
} from "lucide-react";

// ───────────────────── Demo Data ─────────────────────

const DEMO_CITIES = [
  {
    id: "london",
    name: "London",
    status: "active" as const,
    activationProgress: 92,
    businessesParticipating: 420,
    activeCampaigns: 18,
    fundingTarget: 5000000,
    fundingRaised: 3850000,
    boroughs: [
      {
        id: "camden",
        name: "Camden",
        businessesParticipating: 85,
        activeCampaigns: 4,
        highStreets: [
          { id: "camden-high-street", name: "Camden High Street", businesses: 32, campaigns: 2 },
          { id: "chalk-farm-road", name: "Chalk Farm Road", businesses: 28, campaigns: 1 },
          { id: "judd-street", name: "Judd Street", businesses: 25, campaigns: 1 },
        ],
      },
      {
        id: "westminster",
        name: "Westminster",
        businessesParticipating: 110,
        activeCampaigns: 5,
        highStreets: [
          { id: "oxford-street", name: "Oxford Street", businesses: 45, campaigns: 2 },
          { id: "regent-street", name: "Regent Street", businesses: 38, campaigns: 2 },
          { id: "victoria-street", name: "Victoria Street", businesses: 27, campaigns: 1 },
        ],
      },
      {
        id: "islington",
        name: "Islington",
        businessesParticipating: 72,
        activeCampaigns: 3,
        highStreets: [
          { id: "upper-street", name: "Upper Street", businesses: 30, campaigns: 1 },
          { id: "angel-central", name: "Angel Central", businesses: 22, campaigns: 1 },
          { id: "canonbury-road", name: "Canonbury Road", businesses: 20, campaigns: 1 },
        ],
      },
    ],
  },
  {
    id: "manchester",
    name: "Manchester",
    status: "active" as const,
    activationProgress: 85,
    businessesParticipating: 310,
    activeCampaigns: 14,
    fundingTarget: 4000000,
    fundingRaised: 2900000,
    boroughs: [
      {
        id: "city-centre",
        name: "City Centre",
        businessesParticipating: 120,
        activeCampaigns: 6,
        highStreets: [
          { id: "market-street", name: "Market Street", businesses: 48, campaigns: 3 },
          { id: "deansgate", name: "Deansgate", businesses: 42, campaigns: 2 },
          { id: "oldham-street", name: "Oldham Street", businesses: 30, campaigns: 1 },
        ],
      },
      {
        id: "salford",
        name: "Salford",
        businessesParticipating: 65,
        activeCampaigns: 3,
        highStreets: [
          { id: "chapel-street", name: "Chapel Street", businesses: 28, campaigns: 1 },
          { id: "broad-street", name: "Broad Street", businesses: 20, campaigns: 1 },
          { id: "ordsall-lane", name: "Ordsall Lane", businesses: 17, campaigns: 1 },
        ],
      },
      {
        id: "stockport",
        name: "Stockport",
        businessesParticipating: 55,
        activeCampaigns: 2,
        highStreets: [
          { id: "merseyway", name: "Merseyway", businesses: 25, campaigns: 1 },
          { id: "edgeley-road", name: "Edgeley Road", businesses: 18, campaigns: 1 },
          { id: "great-portwood-street", name: "Great Portwood Street", businesses: 12, campaigns: 0 },
        ],
      },
    ],
  },
  {
    id: "birmingham",
    name: "Birmingham",
    status: "active" as const,
    activationProgress: 78,
    businessesParticipating: 245,
    activeCampaigns: 10,
    fundingTarget: 3500000,
    fundingRaised: 2200000,
    boroughs: [
      {
        id: "city-centre",
        name: "City Centre",
        businessesParticipating: 105,
        activeCampaigns: 5,
        highStreets: [
          { id: "new-street", name: "New Street", businesses: 45, campaigns: 2 },
          { id: "high-street", name: "High Street", businesses: 35, campaigns: 2 },
          { id: "corporation-street", name: "Corporation Street", businesses: 25, campaigns: 1 },
        ],
      },
      {
        id: "edgbaston",
        name: "Edgbaston",
        businessesParticipating: 50,
        activeCampaigns: 2,
        highStreets: [
          { id: "harborne-high-street", name: "Harborne High Street", businesses: 28, campaigns: 1 },
          { id: "bristol-road", name: "Bristol Road", businesses: 22, campaigns: 1 },
        ],
      },
      {
        id: "solihull",
        name: "Solihull",
        businessesParticipating: 40,
        activeCampaigns: 2,
        highStreets: [
          { id: "high-street-solihull", name: "High Street", businesses: 22, campaigns: 1 },
          { id: "stratford-road", name: "Stratford Road", businesses: 18, campaigns: 1 },
        ],
      },
    ],
  },
  {
    id: "leeds",
    name: "Leeds",
    status: "making_progress" as const,
    activationProgress: 65,
    businessesParticipating: 180,
    activeCampaigns: 8,
    fundingTarget: 3000000,
    fundingRaised: 1650000,
    boroughs: [
      {
        id: "city-centre",
        name: "City Centre",
        businessesParticipating: 85,
        activeCampaigns: 4,
        highStreets: [
          { id: "briggate", name: "Briggate", businesses: 38, campaigns: 2 },
          { id: "commercial-street", name: "Commercial Street", businesses: 28, campaigns: 1 },
          { id: "headrow", name: "Headrow", businesses: 19, campaigns: 1 },
        ],
      },
      {
        id: "headingley",
        name: "Headingley",
        businessesParticipating: 40,
        activeCampaigns: 2,
        highStreets: [
          { id: "otley-road", name: "Otley Road", businesses: 22, campaigns: 1 },
          { id: "north-lane", name: "North Lane", businesses: 18, campaigns: 1 },
        ],
      },
      {
        id: "horsforth",
        name: "Horsforth",
        businessesParticipating: 30,
        activeCampaigns: 1,
        highStreets: [
          { id: "town-street", name: "Town Street", businesses: 18, campaigns: 1 },
          { id: "new-road-side", name: "New Road Side", businesses: 12, campaigns: 0 },
        ],
      },
    ],
  },
  {
    id: "liverpool",
    name: "Liverpool",
    status: "making_progress" as const,
    activationProgress: 58,
    businessesParticipating: 150,
    activeCampaigns: 6,
    fundingTarget: 2500000,
    fundingRaised: 1100000,
    boroughs: [
      {
        id: "city-centre",
        name: "City Centre",
        businessesParticipating: 70,
        activeCampaigns: 3,
        highStreets: [
          { id: "church-street", name: "Church Street", businesses: 30, campaigns: 1 },
          { id: "lord-street", name: "Lord Street", businesses: 22, campaigns: 1 },
          { id: "strand", name: "Strand", businesses: 18, campaigns: 1 },
        ],
      },
      {
        id: "allerton",
        name: "Allerton",
        businessesParticipating: 40,
        activeCampaigns: 2,
        highStreets: [
          { id: "allerton-road", name: "Allerton Road", businesses: 22, campaigns: 1 },
          { id: "hunters-cross", name: "Hunters Cross", businesses: 18, campaigns: 1 },
        ],
      },
      {
        id: "woolton",
        name: "Woolton",
        businessesParticipating: 25,
        activeCampaigns: 1,
        highStreets: [
          { id: "woolton-street", name: "Woolton Street", businesses: 15, campaigns: 1 },
          { id: "allerton-road-woolton", name: "Allerton Road", businesses: 10, campaigns: 0 },
        ],
      },
    ],
  },
  {
    id: "bristol",
    name: "Bristol",
    status: "needs_activation" as const,
    activationProgress: 35,
    businessesParticipating: 95,
    activeCampaigns: 4,
    fundingTarget: 2000000,
    fundingRaised: 580000,
    boroughs: [
      {
        id: "city-centre",
        name: "City Centre",
        businessesParticipating: 45,
        activeCampaigns: 2,
        highStreets: [
          { id: "park-street", name: "Park Street", businesses: 20, campaigns: 1 },
          { id: "corn-street", name: "Corn Street", businesses: 15, campaigns: 1 },
          { id: "broadmead", name: "Broadmead", businesses: 10, campaigns: 0 },
        ],
      },
      {
        id: "clifton",
        name: "Clifton",
        businessesParticipating: 30,
        activeCampaigns: 1,
        highStreets: [
          { id: "queens-road", name: "Queens Road", businesses: 18, campaigns: 1 },
          { id: "gloucester-road", name: "Gloucester Road", businesses: 12, campaigns: 0 },
        ],
      },
      {
        id: "bedminster",
        name: "Bedminster",
        businessesParticipating: 20,
        activeCampaigns: 1,
        highStreets: [
          { id: "east-street", name: "East Street", businesses: 12, campaigns: 1 },
          { id: "north-street", name: "North Street", businesses: 8, campaigns: 0 },
        ],
      },
    ],
  },
];

type StatusMeta = { label: string; color: string; bg: string };

const STATUS_META: { [key: string]: StatusMeta } = {
  active: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
  making_progress: { label: "Making Progress", color: "text-blue-700", bg: "bg-blue-100" },
   needs_activation: { label: "Inactive", color: "text-amber-700", bg: "bg-amber-100" },
};

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

// ───────────────────── Page ─────────────────────

export default function BusinessDiscoveryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [expandedBorough, setExpandedBorough] = useState<string | null>(null);

  const filteredCities = DEMO_CITIES.filter((city) => {
    const matchesSearch = city.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || city.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleCity = (cityId: string) => {
    setExpandedCity(expandedCity === cityId ? null : cityId);
    setExpandedBorough(null);
  };

  const toggleBorough = (boroughId: string) => {
    setExpandedBorough(expandedBorough === boroughId ? null : boroughId);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-blue-300">UK Business Network</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Business Discovery</h1>
            <p className="mt-3 text-blue-200">Find businesses, campaigns and activation across cities, boroughs, and high streets in the UK.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════ FILTERS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cities..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "making_progress", label: "Making Progress" },
               { value: "needs_activation", label: "Inactive" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CITY CARDS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {filteredCities.map((city) => {
            const isExpanded = expandedCity === city.id;
            const statusMeta: StatusMeta = (STATUS_META[city.status] || STATUS_META.active) as StatusMeta;
            const fundingPct = city.fundingTarget > 0 ? Math.min(Math.round((city.fundingRaised / city.fundingTarget) * 100), 100) : 0;

            return (
              <div key={city.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                {/* City Header */}
                <button
                  onClick={() => toggleCity(city.id)}
                  className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <MapPin className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{city.name}</h3>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.bg} ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{city.businessesParticipating} businesses</span>
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" />{city.activeCampaigns} campaigns</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{fundingPct}% funded</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-gray-900">{fmt(city.fundingRaised)}</div>
                        <div className="text-[10px] text-gray-400">of {fmt(city.fundingTarget)}</div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Funding bar */}
                  <div className="mt-3 ml-8">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${fundingPct}%` }} />
                    </div>
                  </div>
                </button>

                {/* Boroughs (expanded) */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 px-5 py-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Boroughs & Local Areas</h4>
                    <div className="space-y-2">
                      {city.boroughs.map((borough) => {
                        const isBoroughExpanded = expandedBorough === borough.id;
                        return (
                          <div key={borough.id} className="rounded-xl border bg-white overflow-hidden">
                            <button
                              onClick={() => toggleBorough(borough.id)}
                              className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">{borough.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{borough.businessesParticipating} businesses</span>
                                  <span>{borough.activeCampaigns} campaigns</span>
                                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isBoroughExpanded ? "rotate-90" : ""}`} />
                                </div>
                              </div>
                            </button>

                            {/* High Streets (expanded) */}
                            {isBoroughExpanded && (
                              <div className="border-t bg-gray-50 px-4 py-3">
                                <div className="space-y-1">
                                  {borough.highStreets.map((hs) => (
                                    <div key={hs.id} className="flex items-center justify-between rounded-lg bg-white border px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-300">├─</span>
                                        <span className="text-sm text-gray-700">{hs.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{hs.businesses} businesses</span>
                                        <span>{hs.campaigns} campaigns</span>
                                        <Link
                                          to={`/uk-hub-activation/${city.id}/${borough.id}/${hs.id}`}
                                          className="text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                          View →
                                        </Link>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <Link
                        to={`/uk-hub-activation/${city.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View Full City Hub <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredCities.length === 0 && (
            <div className="rounded-2xl border bg-white p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">No cities match your search</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term or filter</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Join as a Business?</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            Find your city, explore founding member opportunities, and secure your spot as a Founding Business Member.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/uk-hub-activation/business" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Business Founding Programme →
            </Link>
            <Link to="/uk-hub-activation" className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              View UK Hub Overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
