// =============================================================================
// Local Areas — Admin Activation
// Local area activation management with Consumer/Business Owner audience split.
// =============================================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Users, Building2, Globe, MapPin, Plus, X, CheckCircle2, Check } from "lucide-react";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface LocalAreaData {
  id: string; name: string; cityName: string; cityId: string; type: string; status: string;
  highStreets: number; businesses: number;
  consumer: { raised: number; target: number; participants: number; campaigns: number; highStreetsActive: number };
  business: { raised: number; target: number; participants: number; campaigns: number; highStreetsActive: number; businessesParticipating?: number };
}

const DEMO_LOCAL_AREAS: LocalAreaData[] = [
  {
    id: "camden", name: "Camden", cityName: "London", cityId: "london", type: "Borough", status: "ACTIVE",
    highStreets: 4, businesses: 38,
    consumer: { raised: 850000, target: 1000000, participants: 480, campaigns: 3, highStreetsActive: 3 },
    business: { raised: 620000, target: 800000, participants: 160, campaigns: 2, highStreetsActive: 2, businessesParticipating: 22 },
  },
  {
    id: "westminster", name: "Westminster", cityName: "London", cityId: "london", type: "Borough", status: "ACTIVE",
    highStreets: 5, businesses: 42,
    consumer: { raised: 920000, target: 1100000, participants: 520, campaigns: 3, highStreetsActive: 4 },
    business: { raised: 710000, target: 900000, participants: 180, campaigns: 2, highStreetsActive: 3, businessesParticipating: 28 },
  },
  {
    id: "islington", name: "Islington", cityName: "London", cityId: "london", type: "Borough", status: "ACTIVE",
    highStreets: 3, businesses: 28,
    consumer: { raised: 620000, target: 800000, participants: 340, campaigns: 2, highStreetsActive: 2 },
    business: { raised: 450000, target: 600000, participants: 120, campaigns: 1, highStreetsActive: 2, businessesParticipating: 16 },
  },
  {
    id: "hackney", name: "Hackney", cityName: "London", cityId: "london", type: "Borough", status: "PREPARING",
    highStreets: 3, businesses: 22,
    consumer: { raised: 380000, target: 700000, participants: 210, campaigns: 1, highStreetsActive: 1 },
    business: { raised: 280000, target: 500000, participants: 80, campaigns: 1, highStreetsActive: 1, businessesParticipating: 10 },
  },
  {
    id: "tower-hamlets", name: "Tower Hamlets", cityName: "London", cityId: "london", type: "Borough", status: "PREPARING",
    highStreets: 3, businesses: 18,
    consumer: { raised: 280000, target: 600000, participants: 160, campaigns: 1, highStreetsActive: 1 },
    business: { raised: 200000, target: 400000, participants: 60, campaigns: 1, highStreetsActive: 1, businessesParticipating: 8 },
  },
  {
    id: "city-centre", name: "Manchester City Centre", cityName: "Manchester", cityId: "manchester", type: "District", status: "ACTIVE",
    highStreets: 3, businesses: 32,
    consumer: { raised: 950000, target: 1200000, participants: 480, campaigns: 3, highStreetsActive: 3 },
    business: { raised: 680000, target: 900000, participants: 180, campaigns: 2, highStreetsActive: 2, businessesParticipating: 20 },
  },
  {
    id: "salford", name: "Salford", cityName: "Manchester", cityId: "manchester", type: "Borough", status: "ACTIVE",
    highStreets: 2, businesses: 18,
    consumer: { raised: 520000, target: 700000, participants: 280, campaigns: 2, highStreetsActive: 2 },
    business: { raised: 380000, target: 500000, participants: 100, campaigns: 1, highStreetsActive: 1, businessesParticipating: 12 },
  },
  {
    id: "dudley", name: "Dudley", cityName: "Birmingham", cityId: "birmingham", type: "Borough", status: "ACTIVE",
    highStreets: 2, businesses: 14,
    consumer: { raised: 380000, target: 500000, participants: 200, campaigns: 1, highStreetsActive: 1 },
    business: { raised: 260000, target: 400000, participants: 70, campaigns: 1, highStreetsActive: 1, businessesParticipating: 8 },
  },
  {
    id: "wolverhampton", name: "Wolverhampton", cityName: "Birmingham", cityId: "birmingham", type: "Borough", status: "PREPARING",
    highStreets: 2, businesses: 12,
    consumer: { raised: 220000, target: 400000, participants: 120, campaigns: 1, highStreetsActive: 0 },
    business: { raised: 150000, target: 300000, participants: 40, campaigns: 0, highStreetsActive: 0, businessesParticipating: 4 },
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

export function LocalAreasPage() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [, setSelectedAreaId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [applyToast, setApplyToast] = useState(false);

  const cities = [...new Set(DEMO_LOCAL_AREAS.map((a) => a.cityName))];

  const filtered = DEMO_LOCAL_AREAS.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter !== "all" && a.cityName !== cityFilter) return false;
    return true;
  });

  const getAreaData = (area: typeof DEMO_LOCAL_AREAS[0]) => {
    if (audience === "consumers") return area.consumer;
    if (audience === "business_owners") return area.business;
    return {
      raised: area.consumer.raised + area.business.raised,
      target: area.consumer.target + area.business.target,
      participants: area.consumer.participants + area.business.participants,
      campaigns: area.consumer.campaigns + area.business.campaigns,
      highStreetsActive: Math.max(area.consumer.highStreetsActive, area.business.highStreetsActive),
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
            <span className="text-gray-900 font-medium">Local Areas</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Local Areas</h1>
          <p className="text-sm text-gray-500">Boroughs, districts, and local authority areas</p>
        </div>
        <button
          onClick={() => navigate("/admin/cities/new")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Local Area
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
            placeholder="Search local areas..."
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

      {/* Local Area List */}
      <div className="rounded-xl bg-white border">
        <div className="divide-y divide-gray-100">
          {filtered.map((area) => {
            const data = getAreaData(area);
            const progress = data.target > 0 ? Math.round((data.raised / data.target) * 100) : 0;
            return (
              <div
                key={area.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <Link
                  to={`/admin/cities/${area.cityId}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                </Link>
                <Link
                  to={`/admin/cities/${area.cityId}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{area.name}</span>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[area.status] || "bg-gray-100 text-gray-500"}`}>
                      {area.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400">{area.type} · {area.cityName}</span>
                  </div>

                  {audience === "all" && (
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">C: {fmt(area.consumer.raised)}</span>
                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 rounded px-1.5 py-0.5">B: {fmt(area.business.raised)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{data.participants.toLocaleString()} participants</span>
                    <span>{data.campaigns} campaigns</span>
                    <span>{data.highStreetsActive}/{area.highStreets} high streets</span>
                    {audience !== "consumers" && <span>{area.business.businessesParticipating ?? 0}/{area.businesses} businesses</span>}
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
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedAreaId(area.id);
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
          <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No local areas match your filters</p>
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
