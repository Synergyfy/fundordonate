// =============================================================================
// Admin — City Management View
// Contextual view for a single city: Overview, Local Areas, High Streets,
// Campaigns, Progress tabs. Created after "Create City Hub" in the wizard.
// =============================================================================

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, MapPin, Globe, Store, Users, TrendingUp,
  BarChart3, Target, Search,
} from "lucide-react";
import { getCities, getAreaTerminology } from "@/data/ukHubData";
import { getLocalAreasForCity, getHighStreetsForArea } from "@/data/highStreetData";

type CityTab = "overview" | "local-areas" | "high-streets" | "campaigns" | "progress";
type DrillView = { type: "city" } | { type: "local-area"; slug: string } | { type: "high-street"; slug: string; areaSlug: string };

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
  MAKING_PROGRESS: { label: "Making Progress", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  NEEDS_ACTIVATION: { label: "Inactive", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  NOT_ACTIVATED: { label: "Inactive", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
};

export function CityManagementPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<CityTab>("overview");
  const [drill, setDrill] = useState<DrillView>({ type: "city" });
  const [search, setSearch] = useState("");

  const cities = getCities();
  const city = cities.find(c => c.slug === id || c.id === id);

  const includedAreas = useMemo(() => {
    if (!city) return [];
    return getLocalAreasForCity(city.slug);
  }, [city]);

  const confirmedStreets = useMemo(() => {
    if (!city) return [];
    const all: Array<{ name: string; slug: string; areaName: string; areaSlug: string; postcodes: string[] }> = [];
    includedAreas.forEach(area => {
      getHighStreetsForArea(city.slug, area.slug).forEach(hs => {
        all.push({ ...hs, areaName: area.name, areaSlug: area.slug, postcodes: [] });
      });
    });
    return all;
  }, [city, includedAreas]);

  if (!city) {
    return (
      <div className="space-y-6">
        <Link to="/admin/cities" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Cities
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900">City not found</h2>
          <p className="mt-2 text-sm text-gray-500">The city "{id}" could not be found.</p>
        </div>
      </div>
    );
  }

  const status = STATUS_META[city.publicStatus] || STATUS_META.NOT_ACTIVATED;
  const areaTerminology = getAreaTerminology(city.slug);
  const terminology = { singular: areaTerminology, plural: areaTerminology.endsWith("s") ? areaTerminology : `${areaTerminology}s` };
  const progress = (city as any).activationProgress || 0;

  // ── Drill-down context ──
  const currentArea = drill.type === "local-area" ? includedAreas.find(a => a.slug === drill.slug) : null;
  const currentStreet = drill.type === "high-street" ? confirmedStreets.find(s => s.slug === drill.slug) : null;

  const tabs: { id: CityTab; label: string; icon: typeof MapPin }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "local-areas", label: terminology.plural, icon: Globe },
    { id: "high-streets", label: "High Streets", icon: Store },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  // ── Breadcrumb ──
  const breadcrumbs = [
    { label: "Cities", path: "/admin/cities" },
    { label: city.name, path: `/admin/cities/${city.slug}` },
  ];
  if (drill.type === "local-area" && currentArea) {
    breadcrumbs.push({ label: currentArea.name, path: "" });
  }
  if (drill.type === "high-street" && currentStreet) {
    breadcrumbs.push({ label: currentStreet.areaName, path: "" });
    breadcrumbs.push({ label: currentStreet.name, path: "" });
  }

  // ── Filtered lists ──
  const filteredAreas = includedAreas.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const filteredStreets = confirmedStreets.filter(s => {
    if (drill.type === "local-area") return s.areaSlug === drill.slug && (!search || s.name.toLowerCase().includes(search.toLowerCase()));
    return !search || s.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <nav className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {bc.path ? (
                <Link to={bc.path} className="hover:text-gray-600">{bc.label}</Link>
              ) : (
                <span className="text-gray-700 font-medium">{bc.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {city.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{city.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {status && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${status.bg} ${status.color} ${status.border} border`}>
                    {status.label}
                  </span>
                )}
                <span className="text-sm text-gray-500">Season: {(city as any).currentSeason || "None"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">Activation Progress</span>
          <span className="text-sm font-bold text-gray-900">{progress}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>0%</span>
          <span>Making Progress</span>
          <span>Active</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setDrill({ type: "city" }); setSearch(""); }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
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
          <div className="p-5 space-y-5">
            <h3 className="text-sm font-bold text-gray-700">Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">{terminology.plural}</div>
                <div className="text-2xl font-bold text-gray-900">{includedAreas.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">High Streets</div>
                <div className="text-2xl font-bold text-gray-900">{confirmedStreets.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Campaigns</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className={`text-2xl font-bold ${status?.color ?? ''}`}>{status?.label ?? 'Unknown'}</div>
              </div>
            </div>
            {city.description && (
              <p className="text-sm text-gray-600">{city.description}</p>
            )}
          </div>
        )}

        {/* ═══════ LOCAL AREAS ═══════ */}
        {activeTab === "local-areas" && (
          <div className="p-5">
            {drill.type === "city" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-700">{includedAreas.length} {terminology.plural}</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${terminology.plural.toLowerCase()}...`}
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm w-56 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredAreas.map(area => (
                    <button
                      key={area.slug}
                      onClick={() => setDrill({ type: "local-area", slug: area.slug })}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{area.name}</div>
                          <div className="text-xs text-gray-500">{(area as any).type ?? ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {getHighStreetsForArea(city.slug, area.slug).length} streets
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
                {filteredAreas.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-500">No {terminology.plural.toLowerCase()} found.</div>
                )}
              </>
            )}

            {drill.type === "local-area" && currentArea && (
              <>
                <button
                  onClick={() => { setDrill({ type: "city" }); setSearch(""); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to {terminology.plural}
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {currentArea.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{currentArea.name}</h3>
                    <div className="text-sm text-gray-500">{city.name}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">High Streets</div>
                    <div className="text-xl font-bold text-gray-900">
                      {getHighStreetsForArea(city.slug, currentArea.slug).length}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Campaigns</div>
                    <div className="text-xl font-bold text-gray-900">0</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDrill({ type: "city" });
                    setActiveTab("high-streets");
                    setSearch("");
                  }}
                  className="w-full rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors text-left"
                >
                  View High Streets →
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══════ HIGH STREETS ═══════ */}
        {activeTab === "high-streets" && (
          <div className="p-5">
            {drill.type === "city" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-700">{confirmedStreets.length} High Streets</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search high streets..."
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm w-56 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredStreets.map(hs => (
                    <button
                      key={hs.slug}
                      onClick={() => setDrill({ type: "high-street", slug: hs.slug, areaSlug: hs.areaSlug })}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{hs.name}</div>
                          <div className="text-xs text-gray-500">{hs.areaName}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>
                  ))}
                </div>
                {filteredStreets.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-500">No high streets found.</div>
                )}
              </>
            )}

            {drill.type === "high-street" && currentStreet && (
              <>
                <button
                  onClick={() => { setDrill({ type: "city" }); setSearch(""); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to High Streets
                </button>
                <div className="flex items-center gap-3 mb-4">
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
                    <div className="text-xs text-gray-500 mb-1">Postcode Coverage</div>
                    <div className="flex flex-wrap gap-1">
                      {currentStreet.postcodes.length > 0 ? currentStreet.postcodes.map(pc => (
                        <span key={pc} className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">{pc}</span>
                      )) : (
                        <span className="text-sm text-gray-400">No postcodes set</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Businesses</div>
                      <div className="text-xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Campaigns</div>
                      <div className="text-xl font-bold text-gray-900">0</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "View Campaigns", icon: Target },
                      { label: "View Businesses", icon: Users },
                      { label: "View Progress", icon: TrendingUp },
                      { label: "Manage Coverage", icon: MapPin },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <btn.icon className="h-3.5 w-3.5" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════ CAMPAIGNS ═══════ */}
        {activeTab === "campaigns" && (
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Campaigns</h3>
            <div className="text-center py-8 rounded-lg border border-dashed border-gray-300">
              <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No campaigns attached yet.</p>
              <p className="text-xs text-gray-400 mt-1">Campaigns are created separately and attached to this city hub.</p>
            </div>
          </div>
        )}

        {/* ═══════ PROGRESS ═══════ */}
        {activeTab === "progress" && (
          <div className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700">Activation Progress</h3>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-lg font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-primary-500"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">{terminology.plural}</div>
                <div className="text-lg font-bold text-gray-900">{includedAreas.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">High Streets</div>
                <div className="text-lg font-bold text-gray-900">{confirmedStreets.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Campaigns</div>
                <div className="text-lg font-bold text-gray-900">0</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Status</div>
                <div className={`text-lg font-bold ${status?.color ?? ''}`}>{status?.label ?? 'Unknown'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
