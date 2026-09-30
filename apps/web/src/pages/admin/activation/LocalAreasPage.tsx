// =============================================================================
// Local Areas — Admin Activation
// Local area activation management with Consumer/Business Owner audience split.
// Rows are built from real location data + the confirmation registry: geographic
// data only SUGGESTS areas; they are Official once the admin confirms them.
// =============================================================================

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, Users, Building2, Globe, MapPin, Plus, X, CheckCircle2, Check, ShieldCheck } from "lucide-react";
import { getCities } from "@/data/ukHubData";
import { getLocalAreasForCity, getHighStreetsForArea } from "@/data/highStreetData";
import { getCitySetup, areaState, streetState, setAreaState, type LayerState } from "@/data/locationRegistry";
import {
  getAdminCampaigns,
  getAdminCampaignsForLocation,
  summarizeCoverage,
  type AdminCampaign,
} from "@/data/adminCampaigns";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface AreaRow {
  id: string;
  name: string;
  slug: string;
  cityName: string;
  citySlug: string;
  type: string;
  layerState: LayerState;
  status: string;
  highStreets: number;
  highStreetsConfirmed: number;
  businesses: number;
  consumer: { raised: number; target: number; participants: number; campaigns: number; highStreetsActive: number };
  business: { raised: number; target: number; participants: number; campaigns: number; highStreetsActive: number; businessesParticipating?: number };
}

const STATUS_LABEL: Record<string, string> = {
  active: "ACTIVE",
  making_progress: "PREPARING",
  needs_activation: "NEEDS_ACTIVATION",
  coming_soon: "PREPARING",
};

/** Real rows: every city's local areas + their confirmation state. */
function buildAreaRows(): AreaRow[] {
  const rows: AreaRow[] = [];
  for (const city of getCities()) {
    const setup = getCitySetup(city.slug);
    for (const area of getLocalAreasForCity(city.slug)) {
      const streets = getHighStreetsForArea(city.slug, area.slug);
      const consumerRaised = Math.round(area.fundingRaised * 0.6);
      const consumerTarget = Math.round(area.fundingTarget * 0.6);
      const consumerCampaigns = Math.min(area.campaigns, Math.ceil(area.campaigns / 2));
      rows.push({
        id: `${city.slug}:${area.slug}`,
        name: area.name,
        slug: area.slug,
        cityName: city.name,
        citySlug: city.slug,
        type: setup.areaTerminology,
        layerState: areaState(setup, area.slug),
        status: STATUS_LABEL[area.status] ?? "NEEDS_ACTIVATION",
        highStreets: streets.length,
        highStreetsConfirmed: streets.filter((s) => streetState(setup, s.slug) === "confirmed").length,
        businesses: area.businesses,
        consumer: {
          raised: consumerRaised,
          target: consumerTarget,
          participants: Math.round(area.businesses * 2),
          campaigns: consumerCampaigns,
          highStreetsActive: Math.round(streets.length * (area.activationPct / 100)),
        },
        business: {
          raised: area.fundingRaised - consumerRaised,
          target: area.fundingTarget - consumerTarget,
          participants: Math.max(1, Math.round(area.businesses / 3)),
          campaigns: area.campaigns - consumerCampaigns,
          highStreetsActive: Math.round(streets.length * (area.activationPct / 100)),
          businessesParticipating: Math.round(area.businesses * 0.4),
        },
      });
    }
  }
  return rows;
}

const LAYER_BADGE: Record<LayerState, { label: string; className: string }> = {
  confirmed: { label: "Official", className: "bg-green-100 text-green-700" },
  suggested: { label: "Suggested", className: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", className: "bg-gray-100 text-gray-500" },
};

const MAX_ROWS = 60;

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PREPARING: "bg-blue-100 text-blue-700",
  NEEDS_ACTIVATION: "bg-amber-100 text-amber-700",
};

export function LocalAreasPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaRow | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [applyToast, setApplyToast] = useState(false);
  const [confirmToast, setConfirmToast] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Rebuilt after every confirmation so badges/counts update immediately.
  const allAreas = useMemo(() => buildAreaRows(), [refreshKey]);

  const cities = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allAreas) map.set(a.citySlug, a.cityName);
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [allAreas]);

  const filtered = useMemo(
    () =>
      allAreas.filter((a) => {
        if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (cityFilter !== "all" && a.citySlug !== cityFilter) return false;
        return true;
      }),
    [allAreas, search, cityFilter]
  );
  const visible = filtered.slice(0, MAX_ROWS);

  const campaignOptions: AdminCampaign[] = useMemo(() => {
    if (!selectedArea) return getAdminCampaigns();
    const covering = getAdminCampaignsForLocation(selectedArea.citySlug, selectedArea.slug);
    return covering.length > 0 ? covering : getAdminCampaigns();
  }, [selectedArea]);

  const confirmArea = (area: AreaRow) => {
    setAreaState(area.citySlug, area.slug, "confirmed");
    setRefreshKey((k) => k + 1);
    setConfirmToast(true);
    setTimeout(() => setConfirmToast(false), 2000);
  };

  const getAreaData = (area: AreaRow) => {
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
        {!embedded && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to="/admin/cities" className="hover:text-gray-700">Cities</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">Local Areas</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Local Areas</h1>
            <p className="text-sm text-gray-500">
              {(() => {
                const terms = Array.from(new Set(cities.map((c) => getCitySetup(c.slug).areaTerminology)));
                return terms.length > 0
                  ? `Called ${terms.join(", ")} — named per city`
                  : "Named per city (Borough, District, Local Area…)";
              })()}
            </p>
          </div>
        )}
        <button
          onClick={() => navigate("/admin/cities/new")}
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
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
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Local Area List */}
      <div className="rounded-xl bg-white border">
        <div className="divide-y divide-gray-100">
          {visible.map((area) => {
            const data = getAreaData(area);
            const progress = data.target > 0 ? Math.round((data.raised / data.target) * 100) : 0;
            const layerBadge = LAYER_BADGE[area.layerState];
            return (
              <div
                key={area.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <Link
                  to={`/admin/cities/${area.citySlug}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                </Link>
                <Link
                  to={`/admin/cities/${area.citySlug}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{area.name}</span>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[area.status] || "bg-gray-100 text-gray-500"}`}>
                      {area.status.replace(/_/g, " ")}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${layerBadge.className}`}>
                      {area.layerState === "confirmed" && <ShieldCheck className="h-3 w-3" />}
                      {layerBadge.label}
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
                    <span>{area.highStreetsConfirmed}/{area.highStreets} high streets confirmed</span>
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
                {area.layerState === "suggested" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      confirmArea(area);
                    }}
                    title="Geographic data suggested this local area — confirm to make it official"
                    className="ml-2 flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-medium text-green-700 hover:bg-green-100 flex-shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" /> Confirm
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedArea(area);
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
        {filtered.length > MAX_ROWS && (
          <div className="border-t px-5 py-3 text-center text-xs text-gray-400">
            Showing {MAX_ROWS} of {filtered.length} local areas — refine the search or city filter to narrow down.
          </div>
        )}
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

      {/* Confirm Toast */}
      {confirmToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <ShieldCheck className="h-4 w-4" />
          Local area confirmed as official
        </div>
      )}

      {/* Apply Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Apply Existing Campaign</h3>
                {selectedArea && (
                  <p className="text-xs text-gray-500">
                    Campaigns covering {selectedArea.name}, {selectedArea.cityName}
                  </p>
                )}
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {campaignOptions.map((camp) => (
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
                    <div className="text-xs text-gray-500">{camp.cityName} · {camp.status.replace(/_/g, " ").toUpperCase()}</div>
                    <div className="text-[10px] text-gray-400">{summarizeCoverage(camp)}</div>
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
