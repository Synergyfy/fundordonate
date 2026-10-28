// =============================================================================
// Admin — City Management View
// Contextual view for a single city: Overview, Local Areas, High Streets,
// Campaigns, Activation Progress and Activation Rules.
// Hierarchy comes from the live location tree; rules live in the city metadata.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, MapPin, Globe, Store, Users, TrendingUp,
  BarChart3, Target, Search, Check, Save, Trash2,
} from "lucide-react";
import { adminApi, type AdminCampaign, type AdminLocation, type LocationTreeNode } from "@/services/admin";
import { useAdminSeasons } from "@/services/admin/hook";
import { hubProgressApi, type LocationStatsData } from "@/services/hub-progress";
import { formatCurrency } from "@/utils/formatters";
import {
  HUB_STATUS_META,
  DEFAULT_ACTIVE_RULES,
  DEFAULT_MAKING_PROGRESS_RULES,
  flattenLocationTree,
  getAreaTerminology,
  getCityActivationRules,
  getHubStatusKey,
  getMetadata,
  getSeasonId,
  isBoundaryConfirmed,
  isHighStreetType,
  isLocalAreaType,
  pluraliseTerm,
  type ActivationRule,
} from "@/utils/hubLocations";

type CityTab = "overview" | "local-areas" | "high-streets" | "campaigns" | "progress" | "rules";
type DrillView =
  | { type: "city" }
  | { type: "local-area"; id: string }
  | { type: "high-street"; id: string };

interface StreetRow {
  id: string;
  name: string;
  slug: string;
  areaId: string;
  areaName: string;
  postcodes: string[];
  targetAmount: number;
  businesses: number;
  status: string;
}

export function CityManagementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [city, setCity] = useState<AdminLocation | null>(null);
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [stats, setStats] = useState<LocationStatsData | null>(null);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CityTab>("overview");
  const [drill, setDrill] = useState<DrillView>({ type: "city" });
  const [search, setSearch] = useState("");

  // Activation rules (editable)
  const [rules, setRules] = useState<{
    makingProgress: ActivationRule[];
    active: ActivationRule[];
    makingProgressLogic: "AND" | "OR";
    activeLogic: "AND" | "OR";
  }>({
    makingProgress: [],
    active: [],
    makingProgressLogic: "AND",
    activeLogic: "AND",
  });
  const [savingRules, setSavingRules] = useState(false);
  const [rulesSaved, setRulesSaved] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: seasonsData } = useAdminSeasons({ limit: 100 });

  const resolveCity = useCallback(async (key: string): Promise<AdminLocation | null> => {
    try {
      return await adminApi.getLocation(key);
    } catch {
      const res = await adminApi.getLocations({ search: key, limit: 5 }).catch(() => ({ items: [] as AdminLocation[] }));
      return (res.items || []).find((item) => item.slug === key) ?? res.items?.[0] ?? null;
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const loc = await resolveCity(id);
      setCity(loc);
      if (!loc) return;

      const storedRules = getCityActivationRules(loc);
      const hasCustomRules =
        storedRules.makingProgress.length > 0 || storedRules.active.length > 0;
      setRules(
        hasCustomRules
          ? storedRules
          : {
              makingProgress: DEFAULT_MAKING_PROGRESS_RULES.map((rule) => ({ ...rule })),
              active: DEFAULT_ACTIVE_RULES.map((rule) => ({ ...rule })),
              makingProgressLogic: "AND",
              activeLogic: "AND",
            },
      );

      const [treeRes, citiesRes, statsRes, campaignsRes] = await Promise.all([
        adminApi.getLocationTree().catch(() => ({ roots: [] })),
        adminApi.getLocations({ type: "CITY", limit: 100, includeInactive: true }).catch(() => ({ items: [] })),
        hubProgressApi.getCityStats(loc.id).catch(() => null),
        adminApi.getCampaigns({ locationId: loc.id, limit: 50 }).catch(() => ({ items: [] })),
      ]);

      setTree((treeRes as any).roots || []);
      setCities((citiesRes as any).items || []);
      setStats(statsRes);
      setCampaigns((campaignsRes as any).items || []);
    } catch {
      setCity(null);
    } finally {
      setLoading(false);
    }
  }, [id, resolveCity]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const flatNodes = useMemo(() => flattenLocationTree(tree), [tree]);

  const cityNode = useMemo(() => {
    if (!city) return undefined;
    return flatNodes.find((node) => node.id === city.id) ??
      flatNodes.find((node) => node.slug === city.slug && node.type === "CITY");
  }, [flatNodes, city]);

  const cityKey = cityNode?.id ?? city?.id ?? "";

  const areas = useMemo(
    () => flatNodes.filter((node) => node.parentId === cityKey && isLocalAreaType(node.type)),
    [flatNodes, cityKey],
  );

  const areaIds = useMemo(() => new Set(areas.map((area) => area.id)), [areas]);

  const streets = useMemo<StreetRow[]>(() => {
    return flatNodes
      .filter((node) => isHighStreetType(node.type) && node.parentId && areaIds.has(node.parentId))
      .map((node) => {
        const area = areas.find((a) => a.id === node.parentId);
        const meta = getMetadata(node);
        return {
          id: node.id,
          name: node.name,
          slug: node.slug,
          areaId: node.parentId as string,
          areaName: area?.name ?? "—",
          postcodes: Array.isArray(meta.postcodes) ? (meta.postcodes as string[]) : [],
          targetAmount: node.targetAmount ?? 0,
          businesses: node.businessCount ?? 0,
          status: node.activationStatus ?? "",
        };
      });
  }, [flatNodes, areaIds, areas]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="space-y-6">
        <Link to="/admin/cities" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to UK Activation
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900">City not found</h2>
          <p className="mt-2 text-sm text-gray-500">The city "{id}" could not be found.</p>
        </div>
      </div>
    );
  }

  const status = HUB_STATUS_META[getHubStatusKey(city)];
  const areaTerminology = getAreaTerminology(city);
  const terminology = pluraliseTerm(areaTerminology);
  const seasonId = getSeasonId(city);
  const seasonName = seasonId
    ? seasonsData?.items?.find((season) => season.id === seasonId)?.name ?? seasonId
    : null;
  const boundaryConfirmed = isBoundaryConfirmed(city);
  const meta = getMetadata(city);
  const raised = stats?.fundingRaised ?? city.fundingRaised ?? city.raisedAmount ?? 0;
  const target = stats?.fundingTarget ?? city.fundingTarget ?? city.targetAmount ?? 0;
  const progress = stats?.activationProgress ?? (target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0);

  const currentArea = drill.type === "local-area" ? areas.find((a) => a.id === drill.id) : null;
  const currentStreet = drill.type === "high-street" ? streets.find((s) => s.id === drill.id) : null;

  const tabs: { id: CityTab; label: string; icon: typeof MapPin }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "local-areas", label: terminology, icon: Globe },
    { id: "high-streets", label: "High Streets", icon: Store },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "rules", label: "Activation Rules", icon: Check },
  ];

  const filteredAreas = areas.filter(
    (area) => !search || area.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredStreets = streets.filter((street) => {
    if (drill.type === "local-area" && street.areaId !== drill.id) return false;
    return !search || street.name.toLowerCase().includes(search.toLowerCase());
  });

  const breadcrumbs = [
    { label: "UK Activation", path: "/admin/cities" },
    { label: city.name, path: `/admin/cities/${city.id}` },
  ];

  const updateRule = (
    group: "makingProgress" | "active",
    ruleId: string,
    updates: Partial<ActivationRule>,
  ) => {
    setRules((prev) => ({
      ...prev,
      [group]: prev[group].map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
    }));
    setRulesSaved(false);
  };

  const setRuleLogic = (group: "makingProgress" | "active", logic: "AND" | "OR") => {
    setRules((prev) => ({
      ...prev,
      [group === "makingProgress" ? "makingProgressLogic" : "activeLogic"]: logic,
    }));
    setRulesSaved(false);
  };

  const saveRules = async () => {
    setSavingRules(true);
    try {
      await adminApi.updateLocation(city.id, {
        metadata: {
          ...meta,
          makingProgressRules: rules.makingProgress,
          makingProgressLogic: rules.makingProgressLogic,
          activeRules: rules.active,
          activeLogic: rules.activeLogic,
        },
      });
      setRulesSaved(true);
      setTimeout(() => setRulesSaved(false), 2500);
    } catch (err: any) {
      alert(err?.message || "Failed to save the activation rules.");
    } finally {
      setSavingRules(false);
    }
  };

  /** Public activation status: ACTIVATED → active, IN_PROGRESS → making progress, PENDING → inactive. */
  const changeActivationStatus = async (value: string) => {
    setSavingStatus(true);
    try {
      await adminApi.updateLocation(city.id, {
        activationStatus: value,
        statusOverride: "",
      });
      setCity((prev) => (prev ? { ...prev, activationStatus: value, statusOverride: "" } : prev));
    } catch (err: any) {
      alert(err?.message || "Failed to update the activation status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const deleteCity = async () => {
    const confirmed = window.confirm(
      `Soft-delete "${city.name}" and its local areas and high streets?\n\n` +
        "The records are hidden from the public site but retained in the database so history is preserved.",
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await adminApi.deleteLocation(city.id);
      navigate("/admin/cities");
    } catch (err: any) {
      alert(err?.message || "Failed to delete this city.");
      setDeleting(false);
    }
  };

  const overviewTile = (label: string, value: React.ReactNode) => (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <nav className="mb-2 flex items-center gap-1 text-xs text-gray-400">
          {breadcrumbs.map((bc, i) => (
            <span key={bc.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-700">{bc.label}</span>
              ) : (
                <Link to={bc.path} className="hover:text-gray-600">{bc.label}</Link>
              )}
            </span>
          ))}
          {drill.type !== "city" && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-gray-700">
                {currentArea?.name ?? currentStreet?.name}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {city.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{city.name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.bg} ${status.color} ${status.border}`}>
                  {status.label}
                </span>
                <span className="text-sm text-gray-500">Season: {seasonName ?? "None"}</span>
                <span className={`text-sm ${boundaryConfirmed ? "text-green-600" : "text-amber-600"}`}>
                  · {boundaryConfirmed ? "Operating area confirmed" : "Operating area suggested"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="city-status">
                Activation status
              </label>
              <select
                id="city-status"
                value={
                  getHubStatusKey(city) === "ACTIVE"
                    ? "ACTIVATED"
                    : getHubStatusKey(city) === "MAKING_PROGRESS"
                    ? "IN_PROGRESS"
                    : "PENDING"
                }
                onChange={(e) => changeActivationStatus(e.target.value)}
                disabled={savingStatus}
                className="input-field w-auto min-w-[160px]"
              >
                <option value="PENDING">Inactive</option>
                <option value="IN_PROGRESS">Making Progress</option>
                <option value="ACTIVATED">Active</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="city-switcher">
                Open another city
              </label>
              <select
                id="city-switcher"
                value={city.id}
                onChange={(e) => navigate(`/admin/cities/${e.target.value}`)}
                className="input-field w-auto min-w-[180px]"
              >
                {cities.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
            <Link
              to={`/admin/hub-locations/${city.id}`}
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Edit City Record
            </Link>
            <button
              onClick={deleteCity}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting…" : "Delete City"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">Activation Progress</span>
          <span className="text-sm font-bold text-gray-900">{progress}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>0%</span>
          <span>Making Progress</span>
          <span>Active</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setDrill({ type: "city" });
                setSearch("");
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* ═══════ OVERVIEW ═══════ */}
        {activeTab === "overview" && (
          <div className="space-y-5 p-5">
            <h3 className="text-sm font-bold text-gray-700">Overview</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overviewTile(terminology, areas.length)}
              {overviewTile("High Streets", streets.length)}
              {overviewTile("Campaigns", campaigns.length)}
              {overviewTile(
                "Businesses",
                areas.reduce((acc, area) => acc + (area.businessCount ?? 0), 0) +
                  streets.reduce((acc, street) => acc + street.businesses, 0),
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-xs text-gray-500">Funding Target</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(target)}</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <div className="mb-1 text-xs text-gray-500">Funding Raised</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(raised)}</div>
              </div>
            </div>

            {(city.description || city.shortDescription) && (
              <p className="text-sm text-gray-600">{city.description || city.shortDescription}</p>
            )}

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Operating Area & Hierarchy
              </h4>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Area terminology</dt>
                  <dd className="font-medium text-gray-900">{areaTerminology}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Boundary mode</dt>
                  <dd className="font-medium text-gray-900">{meta.boundaryMode ?? "Not set"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Radius</dt>
                  <dd className="font-medium text-gray-900">
                    {typeof meta.radiusMiles === "number" ? `${meta.radiusMiles} miles` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Confirmed</dt>
                  <dd className={`font-medium ${boundaryConfirmed ? "text-green-700" : "text-amber-700"}`}>
                    {boundaryConfirmed ? "Yes" : "Not yet"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("campaigns")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Target className="h-3.5 w-3.5" /> View Campaigns
              </button>
              <button
                onClick={() => setActiveTab("local-areas")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Users className="h-3.5 w-3.5" /> Manage Coverage
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <TrendingUp className="h-3.5 w-3.5" /> View Progress
              </button>
              <button
                onClick={() => setActiveTab("rules")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Check className="h-3.5 w-3.5" /> Activation Rules
              </button>
            </div>
          </div>
        )}

        {/* ═══════ LOCAL AREAS ═══════ */}
        {activeTab === "local-areas" && (
          <div className="p-5">
            {drill.type !== "local-area" ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-700">
                    {areas.length} {terminology}
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${terminology.toLowerCase()}...`}
                      className="input-field w-56 pl-9"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredAreas.map((area) => {
                    const areaStreets = streets.filter((street) => street.areaId === area.id);
                    const areaStatus = HUB_STATUS_META[getHubStatusKey(area)];
                    return (
                      <button
                        key={area.id}
                        onClick={() => setDrill({ type: "local-area", id: area.id })}
                        className="flex w-full items-center justify-between px-2 py-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{area.name}</span>
                              <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${areaStatus.bg} ${areaStatus.color} ${areaStatus.border}`}>
                                {areaStatus.label}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{areaTerminology}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{areaStreets.length} streets</span>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {filteredAreas.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No {terminology.toLowerCase()} registered for this city yet.
                  </div>
                )}
              </>
            ) : (
              currentArea && (
                <>
                  <button
                    onClick={() => { setDrill({ type: "city" }); setSearch(""); }}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to {terminology}
                  </button>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {currentArea.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{currentArea.name}</h3>
                      <div className="text-sm text-gray-500">{city.name}</div>
                    </div>
                  </div>
                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">High Streets</div>
                      <div className="text-xl font-bold text-gray-900">
                        {streets.filter((street) => street.areaId === currentArea.id).length}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Businesses</div>
                      <div className="text-xl font-bold text-gray-900">{currentArea.businessCount ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Target</div>
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(currentArea.targetAmount ?? 0)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDrill({ type: "city" });
                      setActiveTab("high-streets");
                      setSearch("");
                    }}
                    className="w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-left text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
                  >
                    View High Streets →
                  </button>
                </>
              )
            )}
          </div>
        )}

        {/* ═══════ HIGH STREETS ═══════ */}
        {activeTab === "high-streets" && (
          <div className="p-5">
            {drill.type !== "high-street" ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-700">{streets.length} High Streets</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search high streets..."
                      className="input-field w-56 pl-9"
                    />
                  </div>
                </div>
                {drill.type === "local-area" && currentArea && (
                  <button
                    onClick={() => { setDrill({ type: "city" }); setSearch(""); }}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to {terminology}
                  </button>
                )}
                <div className="divide-y divide-gray-100">
                  {filteredStreets.map((street) => (
                    <button
                      key={street.id}
                      onClick={() => setDrill({ type: "high-street", id: street.id })}
                      className="flex w-full items-center justify-between px-2 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{street.name}</div>
                          <div className="text-xs text-gray-500">{street.areaName}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>
                  ))}
                </div>
                {filteredStreets.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-500">No high streets registered yet.</div>
                )}
              </>
            ) : (
              currentStreet && (
                <>
                  <button
                    onClick={() => { setDrill({ type: "city" }); setSearch(""); }}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to High Streets
                  </button>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {currentStreet.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{currentStreet.name}</h3>
                      <div className="text-sm text-gray-500">{city.name} · {currentStreet.areaName}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-1 text-xs text-gray-500">Postcode Coverage</div>
                      <div className="flex flex-wrap gap-1">
                        {currentStreet.postcodes.length > 0 ? (
                          currentStreet.postcodes.map((postcode) => (
                            <span key={postcode} className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {postcode}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No postcodes set</span>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Businesses</div>
                        <div className="text-xl font-bold text-gray-900">{currentStreet.businesses}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Target</div>
                        <div className="text-xl font-bold text-gray-900">{formatCurrency(currentStreet.targetAmount)}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="text-xl font-bold text-gray-900">
                          {HUB_STATUS_META[getHubStatusKey({ activationStatus: currentStreet.status })].label}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* ═══════ CAMPAIGNS ═══════ */}
        {activeTab === "campaigns" && (
          <div className="p-5">
            <h3 className="mb-4 text-sm font-bold text-gray-700">Campaigns ({campaigns.length})</h3>
            {campaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                <Target className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No campaigns attached yet.</p>
                <p className="mt-1 text-xs text-gray-400">
                  Campaigns are created separately and attached to this city hub.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/admin/campaigns/${campaign.id}`}
                    className="flex items-center justify-between px-2 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      <div className="text-xs text-gray-500">
                        {String(campaign.status).replace(/_/g, " ").toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(campaign.raisedAmount ?? 0)}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        of {formatCurrency(campaign.goalAmount ?? 0)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ PROGRESS ═══════ */}
        {activeTab === "progress" && (
          <div className="space-y-4 p-5">
            <h3 className="text-sm font-bold text-gray-700">Activation Progress</h3>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-lg font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Raised {formatCurrency(raised)}</span>
                <span>Target {formatCurrency(target)}</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overviewTile(terminology, areas.length)}
              {overviewTile("High Streets", streets.length)}
              {overviewTile("Campaigns", campaigns.length)}
              {overviewTile("Status", <span className={status.color}>{status.label}</span>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Donations</div>
                <div className="text-lg font-bold text-gray-900">{stats?.totalDonations ?? 0}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Pledges</div>
                <div className="text-lg font-bold text-gray-900">{stats?.totalPledges ?? 0}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Backers</div>
                <div className="text-lg font-bold text-gray-900">{stats?.totalBackers ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ACTIVATION RULES ═══════ */}
        {activeTab === "rules" && (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-700">Activation Rules</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Rules decide when this city moves from Inactive → Making Progress → Active.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {rulesSaved && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                <button
                  onClick={saveRules}
                  disabled={savingRules}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" /> {savingRules ? "Saving…" : "Save Rules"}
                </button>
              </div>
            </div>

            {rules.makingProgress.length === 0 && rules.active.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                <Check className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No custom activation rules stored for this city.</p>
                <p className="mt-1 text-xs text-gray-400">
                  Default rules are evaluated automatically. Re-run the Add / Activate City wizard to customise them.
                </p>
                <button
                  onClick={() => navigate("/admin/cities/new")}
                  className="mt-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
                >
                  Open city wizard
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {([
                  { key: "makingProgress" as const, title: "Making Progress Rules", tone: "amber" },
                  { key: "active" as const, title: "Active Rules", tone: "green" },
                ]).map(({ key, title, tone }) => {
                  const logic = key === "makingProgress" ? rules.makingProgressLogic : rules.activeLogic;
                  return (
                  <div key={key} className="rounded-lg border border-gray-200">
                    <div className={`flex items-center justify-between gap-2 rounded-t-lg border-b px-4 py-2.5 ${tone === "amber" ? "bg-amber-50" : "bg-green-50"}`}>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${tone === "amber" ? "text-amber-700" : "text-green-700"}`}>
                        {title}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Combine</span>
                        {(["AND", "OR"] as const).map((option) => (
                          <button
                            key={option}
                            onClick={() => setRuleLogic(key, option)}
                            className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                              logic === option
                                ? "bg-gray-800 text-white"
                                : "bg-white/70 text-gray-500 hover:bg-white"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {rules[key].length === 0 ? (
                        <p className="px-4 py-4 text-xs text-gray-400">No rules configured.</p>
                      ) : (
                        rules[key].map((rule) => (
                          <div key={rule.id} className="flex items-center gap-3 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => updateRule(key, rule.id, { enabled: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              aria-label={`Enable ${rule.label}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm ${rule.enabled ? "font-medium text-gray-900" : "text-gray-400"}`}>
                                {rule.label}
                              </div>
                              <div className="text-[11px] text-gray-400">{rule.type.replace(/_/g, " ")}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={rule.threshold}
                                onChange={(e) => updateRule(key, rule.id, { threshold: Number(e.target.value) })}
                                className="w-16 rounded-md border border-gray-200 px-2 py-1 text-right text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-100"
                                aria-label={`${rule.label} threshold`}
                              />
                              <span className="w-5 text-xs text-gray-500">{rule.unit}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
