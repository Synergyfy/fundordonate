// =============================================================================
// High Streets — Admin Activation
// High street activation management with Consumer/Business Owner audience split.
// =============================================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Users, Building2, Globe, Store, Plus, X, CheckCircle2, Check } from "lucide-react";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface HighStreetData {
  id: string; name: string; localAreaName: string; cityName: string; cityId: string; localAreaId: string;
  status: string; businesses: number;
  consumer: { raised: number; target: number; participants: number; campaigns: number };
  business: { raised: number; target: number; participants: number; campaigns: number; businessesParticipating?: number };
}

const DEMO_HIGH_STREETS: HighStreetData[] = [
  {
    id: "camden-high-st", name: "Camden High Street", localAreaName: "Camden", cityName: "London", cityId: "london", localAreaId: "camden",
    status: "ACTIVE", businesses: 18,
    consumer: { raised: 280000, target: 350000, participants: 160, campaigns: 1 },
    business: { raised: 210000, target: 280000, participants: 55, campaigns: 1, businessesParticipating: 12 },
  },
  {
    id: "covent-garden", name: "Covent Garden", localAreaName: "Westminster", cityName: "London", cityId: "london", localAreaId: "westminster",
    status: "ACTIVE", businesses: 22,
    consumer: { raised: 320000, target: 400000, participants: 180, campaigns: 1 },
    business: { raised: 250000, target: 320000, participants: 65, campaigns: 1, businessesParticipating: 15 },
  },
  {
    id: "oxford-street", name: "Oxford Street", localAreaName: "Westminster", cityName: "London", cityId: "london", localAreaId: "westminster",
    status: "ACTIVE", businesses: 35,
    consumer: { raised: 420000, target: 500000, participants: 240, campaigns: 2 },
    business: { raised: 340000, target: 420000, participants: 85, campaigns: 1, businessesParticipating: 22 },
  },
  {
    id: "islington-high-st", name: "Islington High Street", localAreaName: "Islington", cityName: "London", cityId: "london", localAreaId: "islington",
    status: "ACTIVE", businesses: 14,
    consumer: { raised: 180000, target: 250000, participants: 100, campaigns: 1 },
    business: { raised: 130000, target: 180000, participants: 35, campaigns: 1, businessesParticipating: 8 },
  },
  {
    id: "shoreditch-high-st", name: "Shoreditch High Street", localAreaName: "Hackney", cityName: "London", cityId: "london", localAreaId: "hackney",
    status: "PREPARING", businesses: 12,
    consumer: { raised: 95000, target: 200000, participants: 55, campaigns: 0 },
    business: { raised: 70000, target: 140000, participants: 20, campaigns: 0, businessesParticipating: 4 },
  },
  {
    id: "deansgate", name: "Deansgate", localAreaName: "Manchester City Centre", cityName: "Manchester", cityId: "manchester", localAreaId: "city-centre",
    status: "ACTIVE", businesses: 20,
    consumer: { raised: 310000, target: 400000, participants: 170, campaigns: 1 },
    business: { raised: 230000, target: 300000, participants: 60, campaigns: 1, businessesParticipating: 14 },
  },
  {
    id: "market-street-mcr", name: "Market Street", localAreaName: "Manchester City Centre", cityName: "Manchester", cityId: "manchester", localAreaId: "city-centre",
    status: "ACTIVE", businesses: 15,
    consumer: { raised: 240000, target: 320000, participants: 130, campaigns: 1 },
    business: { raised: 180000, target: 240000, participants: 45, campaigns: 1, businessesParticipating: 10 },
  },
  {
    id: "bull-ring", name: "Bull Ring", localAreaName: "Dudley", cityName: "Birmingham", cityId: "birmingham", localAreaId: "dudley",
    status: "ACTIVE", businesses: 16,
    consumer: { raised: 190000, target: 260000, participants: 100, campaigns: 1 },
    business: { raised: 140000, target: 200000, participants: 35, campaigns: 1, businessesParticipating: 8 },
  },
];

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PREPARING: "bg-blue-100 text-blue-700",
  NEEDS_ACTIVATION: "bg-amber-100 text-amber-700",
};

const DEMO_CAMPAIGNS = [
  { id: "camp-1", title: "London Spring Community Campaign", status: "ACTIVE", cityName: "London" },
  { id: "camp-2", title: "Manchester Autumn Business Drive", status: "ACTIVE", cityName: "Manchester" },
  { id: "camp-3", title: "Birmingham Winter High Streets Revival", status: "PREPARING", cityName: "Birmingham" },
  { id: "camp-4", title: "London Summer Consumer Rewards", status: "COMPLETED", cityName: "London" },
];

export function HighStreetsPage() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [, setSelectedStreetId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [applyToast, setApplyToast] = useState(false);

  const cities = [...new Set(DEMO_HIGH_STREETS.map((h) => h.cityName))];

  const filtered = DEMO_HIGH_STREETS.filter((h) => {
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter !== "all" && h.cityName !== cityFilter) return false;
    return true;
  });

  const getStreetData = (street: typeof DEMO_HIGH_STREETS[0]) => {
    if (audience === "consumers") return street.consumer;
    if (audience === "business_owners") return street.business;
    return {
      raised: street.consumer.raised + street.business.raised,
      target: street.consumer.target + street.business.target,
      participants: street.consumer.participants + street.business.participants,
      campaigns: street.consumer.campaigns + street.business.campaigns,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/admin/cities" className="hover:text-gray-700">Cities</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">High Streets</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">High Streets</h1>
          <p className="text-sm text-gray-500">High streets and commercial districts across the programme</p>
        </div>
        <button
          onClick={() => navigate("/admin/cities/new")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add High Street
        </button>
      </div>

      {/* Audience Tabs */}
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search high streets..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* High Street List */}
      <div className="rounded-xl bg-white border">
        <div className="divide-y divide-gray-100">
          {filtered.map((street) => {
            const data = getStreetData(street);
            const progress = data.target > 0 ? Math.round((data.raised / data.target) * 100) : 0;
            return (
              <div key={street.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <Link
                  to={`/admin/cities/${street.cityId}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 flex-shrink-0"
                >
                  <Store className="h-4 w-4 text-primary-600" />
                </Link>
                <Link
                  to={`/admin/cities/${street.cityId}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{street.name}</span>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[street.status] || "bg-gray-100 text-gray-500"}`}>
                      {street.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{street.localAreaName} · {street.cityName}</div>

                  {audience === "all" && (
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">C: {fmt(street.consumer.raised)}</span>
                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 rounded px-1.5 py-0.5">B: {fmt(street.business.raised)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{data.participants.toLocaleString()} participants</span>
                    <span>{data.campaigns} campaigns</span>
                    {audience !== "consumers" && <span>{street.business.businessesParticipating ?? 0}/{street.businesses} businesses</span>}
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                  </div>
                </Link>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">{fmt(data.raised)}</div>
                  <div className="text-xs text-gray-400">of {fmt(data.target)}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedStreetId(street.id);
                    setSelectedCampaignId("");
                    setShowCampaignModal(true);
                  }}
                  className="ml-2 flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-[11px] font-medium text-primary-700 hover:bg-primary-100 flex-shrink-0"
                >
                  Apply Campaign
                </button>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No high streets match your filters</p>
        </div>
      )}

      {/* Apply Campaign Toast */}
      {applyToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          Campaign applied successfully
        </div>
      )}

      {/* Apply Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-bold text-gray-900">Apply Existing Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {DEMO_CAMPAIGNS.map((camp) => (
                <label
                  key={camp.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCampaignId === camp.id ? "border-primary-300 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="campaign"
                    checked={selectedCampaignId === camp.id}
                    onChange={() => setSelectedCampaignId(camp.id)}
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{camp.title}</div>
                    <div className="text-xs text-gray-500">{camp.cityName} · {camp.status}</div>
                  </div>
                  {selectedCampaignId === camp.id && <Check className="h-4 w-4 text-primary-600" />}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!selectedCampaignId}
                onClick={() => {
                  setShowCampaignModal(false);
                  setApplyToast(true);
                  setTimeout(() => setApplyToast(false), 2500);
                }}
                className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
