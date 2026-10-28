// =============================================================================
// Local Areas — Admin Activation
// Local area activation management with Consumer / Business Owner audience split.
// Rows are built from the live location hierarchy in the backend.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ChevronRight, Users, Building2, Globe, MapPin, Plus, X, Check,
  CheckCircle2, ShieldCheck, AlertTriangle, Loader2,
} from "lucide-react";
import { adminApi, type AdminCampaign, type AdminLocation, type LocationTreeNode } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";
import {
  HUB_STATUS_META,
  flattenLocationTree,
  getAreaTerminology,
  getHubStatusKey,
  getMetadata,
} from "@/utils/hubLocations";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

const MAX_ROWS = 100;

interface AreaRow {
  area: AdminLocation;
  cityName: string;
  cityId: string | null;
  terminology: string;
  highStreets: number;
  businesses: number;
  layerState: string;
}

export function LocalAreasPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [areas, setAreas] = useState<AdminLocation[]>([]);
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Apply-campaign modal
  const [selectedArea, setSelectedArea] = useState<AreaRow | null>(null);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const [boroughsRes, districtsRes, localAreasRes, citiesRes, treeRes] = await Promise.all([
        adminApi.getLocations({ type: "BOROUGH", limit: 100, includeInactive: true }),
        adminApi.getLocations({ type: "DISTRICT", limit: 100, includeInactive: true }),
        adminApi.getLocations({ type: "LOCAL_AREA", limit: 100, includeInactive: true }),
        adminApi.getLocations({ type: "CITY", limit: 100, includeInactive: true }).catch(() => ({ items: [] })),
        adminApi.getLocationTree().catch(() => ({ roots: [] })),
      ]);
      setAreas([
        ...(boroughsRes.items || []),
        ...(districtsRes.items || []),
        ...(localAreasRes.items || []),
      ]);
      setCities(citiesRes.items || []);
      setTree((treeRes as any).roots || []);
    } catch {
      setAreas([]);
      setCities([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const flatNodes = useMemo(() => flattenLocationTree(tree), [tree]);
  const cityById = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);

  const rows: AreaRow[] = useMemo(() => {
    return areas.map((area) => {
      const city = area.parentId ? cityById.get(area.parentId) : undefined;
      const streetCount = flatNodes.filter(
        (node) =>
          (node.type === "HIGH_STREET" || node.type === "COMMERCIAL_AREA") &&
          node.parentId === area.id,
      ).length;
      const meta = getMetadata(area);
      return {
        area,
        cityName: city?.name ?? "—",
        cityId: city?.id ?? area.parentId ?? null,
        terminology:
          (typeof meta.type === "string" && meta.type) ||
          getAreaTerminology(city ?? area),
        highStreets: streetCount,
        businesses: area.businessCount ?? 0,
        layerState: (typeof meta.layerState === "string" && meta.layerState) || "confirmed",
      };
    });
  }, [areas, cityById, flatNodes]);

  const confirmSuggested = async (area: AdminLocation) => {
    setConfirmingId(area.id);
    try {
      await adminApi.updateLocation(area.id, {
        isPublic: true,
        metadata: {
          ...getMetadata(area),
          layerState: "confirmed",
          confirmedAt: new Date().toISOString(),
        },
      });
      await fetchLocations();
    } catch (err: any) {
      alert(err?.message || "Failed to confirm this local area.");
    } finally {
      setConfirmingId(null);
    }
  };

  const filtered = useMemo(() => {
    return rows.filter(({ area, cityId }) => {
      if (search && !area.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (cityFilter !== "all" && cityId !== cityFilter) return false;
      return true;
    });
  }, [rows, search, cityFilter]);

  const visible = filtered.slice(0, MAX_ROWS);

  const totalHighStreets = useMemo(
    () => rows.reduce((acc, row) => acc + row.highStreets, 0),
    [rows],
  );

  const openApplyCampaign = async (row: AreaRow) => {
    setSelectedArea(row);
    setSelectedCampaignId("");
    setCampaignsLoading(true);
    try {
      const res = await adminApi.getCampaigns({ limit: 100 });
      setCampaigns(res.items || []);
    } catch {
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const applyCampaign = async () => {
    if (!selectedArea || !selectedCampaignId) return;
    setApplying(true);
    try {
      const existing = await adminApi
        .getCampaignLocations(selectedCampaignId)
        .catch(() => [] as any[]);
      const primaryLocationId =
        existing.find((entry: any) => entry.scope === "PRIMARY")?.locationId ?? undefined;
      const additionalLocationIds = existing
        .filter((entry: any) => entry.scope !== "PRIMARY")
        .map((entry: any) => entry.locationId)
        .filter(Boolean);

      if (selectedArea.area.id !== primaryLocationId) {
        additionalLocationIds.push(selectedArea.area.id);
      }

      await adminApi.setCampaignLocations(selectedCampaignId, {
        primaryLocationId,
        additionalLocationIds: [...new Set(additionalLocationIds)],
      });
      setSelectedArea(null);
      setToast(`Campaign applied to ${selectedArea.area.name}`);
      setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      alert(err?.message || "Failed to apply the campaign to this local area.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
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
              {rows.length} local areas • {totalHighStreets} high streets • named per city (Borough, District, Local Area…)
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
                ? "bg-primary-50 text-primary-700 font-semibold"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search local areas..."
            className="input-field w-full pl-9"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="all">All Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>

      {/* Local Area List */}
      <div className="rounded-xl bg-white border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Loading local areas…</div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No local areas found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map((row) => {
              const { area } = row;
              const statusKey = getHubStatusKey(area);
              const status = HUB_STATUS_META[statusKey];
              const raised = area.fundingRaised ?? area.raisedAmount ?? 0;
              const target = area.fundingTarget ?? area.targetAmount ?? 0;
              const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
              const suggested = row.layerState === "suggested";

              return (
                <div key={area.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${suggested ? "bg-amber-50 text-amber-700" : "bg-primary-100 text-primary-700"}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{area.name}</span>
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${status.bg} ${status.color} ${status.border}`}>
                        {status.label}
                      </span>
                      {suggested ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Suggested
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                          <ShieldCheck className="h-3 w-3" /> Official
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{row.terminology} · {row.cityName}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>{row.highStreets} high streets</span>
                      {audience !== "consumers" && <span>{row.businesses} businesses</span>}
                      <span>{formatCurrency(raised)} raised</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="hidden text-right sm:block flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(raised)}</div>
                    <div className="text-xs text-gray-400">of {formatCurrency(target)}</div>
                  </div>
                  {suggested && (
                    <button
                      onClick={() => confirmSuggested(area)}
                      disabled={confirmingId === area.id}
                      className="ml-2 flex flex-shrink-0 items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                    >
                      {confirmingId === area.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => openApplyCampaign(row)}
                    className="ml-2 flex flex-shrink-0 items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-[11px] font-medium text-primary-700 hover:bg-primary-100"
                  >
                    Apply Campaign
                  </button>
                  <Link
                    to={row.cityId ? `/admin/cities/${row.cityId}` : "/admin/cities"}
                    className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Manage <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        {filtered.length > MAX_ROWS && (
          <div className="border-t px-5 py-3 text-center text-xs text-gray-400">
            Showing {MAX_ROWS} of {filtered.length} local areas — refine the search or city filter to narrow down.
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Apply Campaign Modal */}
      {selectedArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Apply Existing Campaign</h3>
                <p className="text-xs text-gray-500">
                  Campaigns covering {selectedArea.area.name}, {selectedArea.cityName}
                </p>
              </div>
              <button onClick={() => setSelectedArea(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[320px] space-y-2 overflow-y-auto p-4">
              {campaignsLoading ? (
                <p className="py-6 text-center text-xs text-gray-400">Loading campaigns…</p>
              ) : campaigns.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No campaigns available yet.</p>
              ) : (
                campaigns.map((campaign) => (
                  <label
                    key={campaign.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedCampaignId === campaign.id
                        ? "border-primary-300 bg-primary-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="campaign"
                      checked={selectedCampaignId === campaign.id}
                      onChange={() => setSelectedCampaignId(campaign.id)}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      <div className="text-xs text-gray-500">
                        {String(campaign.status).replace(/_/g, " ").toUpperCase()}
                      </div>
                    </div>
                    {selectedCampaignId === campaign.id && <Check className="h-4 w-4 text-primary-600" />}
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t p-4">
              <button
                onClick={() => setSelectedArea(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!selectedCampaignId || applying}
                onClick={applyCampaign}
                className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applying ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
