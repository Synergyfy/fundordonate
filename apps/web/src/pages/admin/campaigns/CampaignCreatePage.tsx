// =============================================================================
// Create Campaign — Multi-Step Flow
// Campaign creation with live database seasons, hierarchical hub locations,
// audience targeting, and configuration steps.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Calendar, MapPin, Target,
  Users, Building2, Globe, Gift, Trophy, Loader2, AlertCircle, Plus
} from "lucide-react";
import { adminApi } from "@/services/admin";
import type { AdminSeason, LocationTreeNode } from "@/services/admin/type";

type Audience = "consumers" | "business_owners" | "both";

const STEPS = [
  { id: 1, label: "Season", icon: <Calendar className="h-4 w-4" /> },
  { id: 2, label: "Locations", icon: <MapPin className="h-4 w-4" /> },
  { id: 3, label: "Audience", icon: <Users className="h-4 w-4" /> },
  { id: 4, label: "Details", icon: <Target className="h-4 w-4" /> },
  { id: 5, label: "Configuration", icon: <Gift className="h-4 w-4" /> },
  { id: 6, label: "Review", icon: <Check className="h-4 w-4" /> },
];

const AUDIENCE_OPTIONS: { id: Audience; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "consumers", label: "Consumers", description: "Individual consumers and donors can participate.", icon: <Users className="h-5 w-5" /> },
  { id: "business_owners", label: "Business Owners", description: "Business owners and their businesses can participate.", icon: <Building2 className="h-5 w-5" /> },
  { id: "both", label: "Both", description: "Supports both Consumer and Business Owner streams separately.", icon: <Globe className="h-5 w-5" /> },
];

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export function CampaignCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live Database State
  const [seasons, setSeasons] = useState<AdminSeason[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [seasonsError, setSeasonsError] = useState<string | null>(null);

  const [locationTree, setLocationTree] = useState<LocationTreeNode[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Step 1: Season (DB UUID)
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  // Step 2: Locations (hierarchical DB UUIDs)
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>([]);
  const [selectedHighStreets, setSelectedHighStreets] = useState<string[]>([]);

  // Step 3: Audience
  const [audience, setAudience] = useState<Audience>("both");

  // Step 4: Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");

  // Step 5: Configuration
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [incentivesEnabled, setIncentivesEnabled] = useState(false);

  // Fetch real seasons and location tree from database
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      // 1. Fetch seasons
      try {
        setSeasonsLoading(true);
        setSeasonsError(null);
        const seasonsRes = await adminApi.getSeasons({ limit: 100 });
        if (mounted) {
          const list = seasonsRes.items || [];
          setSeasons(list);
          // Auto-select active season if available
          const active = list.find((s) => s.status === "ACTIVE") || list[0];
          if (active) {
            setSelectedSeason(active.id);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setSeasonsError(err?.response?.data?.message || err?.message || "Failed to load seasons from database");
        }
      } finally {
        if (mounted) setSeasonsLoading(false);
      }

      // 2. Fetch hierarchical locations
      try {
        setLocationsLoading(true);
        setLocationsError(null);
        const locRes = await adminApi.getLocationTree();
        if (mounted) {
          setLocationTree(locRes.roots || []);
        }
      } catch (err: any) {
        if (mounted) {
          setLocationsError(err?.response?.data?.message || err?.message || "Failed to load location tree from database");
        }
      } finally {
        if (mounted) setLocationsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Normalise cities from the tree (handles NATIONAL container or direct CITY roots)
  const cities = useMemo<LocationTreeNode[]>(() => {
    if (!locationTree || locationTree.length === 0) return [];
    const national = locationTree.find((n) => n.type === "NATIONAL");
    if (national && national.children && national.children.length > 0) {
      return national.children;
    }
    return locationTree.filter((n) => n.type === "CITY" || !n.parentId);
  }, [locationTree]);

  // Lookup maps for fast name resolution
  const locationMaps = useMemo(() => {
    const cityMap = new Map<string, LocationTreeNode>();
    const boroughMap = new Map<string, { node: LocationTreeNode; cityName: string }>();
    const streetMap = new Map<string, { node: LocationTreeNode; boroughName: string; cityName: string }>();

    for (const city of cities) {
      cityMap.set(city.id, city);
      for (const borough of city.children || []) {
        boroughMap.set(borough.id, { node: borough, cityName: city.name });
        for (const street of borough.children || []) {
          streetMap.set(street.id, { node: street, boroughName: borough.name, cityName: city.name });
        }
      }
    }
    return { cityMap, boroughMap, streetMap };
  }, [cities]);

  const toggleCity = (cityId: string) => {
    setSelectedCities((prev) => {
      const isDeselecting = prev.includes(cityId);
      if (isDeselecting) {
        const cityNode = locationMaps.cityMap.get(cityId);
        if (cityNode) {
          const childBoroughIds = (cityNode.children || []).map((b) => b.id);
          const childStreetIds = (cityNode.children || []).flatMap((b) => (b.children || []).map((s) => s.id));
          setSelectedBoroughs((b) => b.filter((id) => !childBoroughIds.includes(id)));
          setSelectedHighStreets((h) => h.filter((id) => !childStreetIds.includes(id)));
        }
        return prev.filter((c) => c !== cityId);
      } else {
        return [...prev, cityId];
      }
    });
  };

  const toggleBorough = (boroughId: string) => {
    setSelectedBoroughs((prev) => {
      const isDeselecting = prev.includes(boroughId);
      if (isDeselecting) {
        const bInfo = locationMaps.boroughMap.get(boroughId);
        if (bInfo) {
          const childStreetIds = (bInfo.node.children || []).map((s) => s.id);
          setSelectedHighStreets((h) => h.filter((id) => !childStreetIds.includes(id)));
        }
        return prev.filter((b) => b !== boroughId);
      } else {
        return [...prev, boroughId];
      }
    });
  };

  const toggleHighStreet = (hsId: string) => {
    setSelectedHighStreets((prev) => prev.includes(hsId) ? prev.filter((h) => h !== hsId) : [...prev, hsId]);
  };

  const selectAllCities = () => {
    setSelectedCities(cities.map((c) => c.id));
  };

  const clearAllCities = () => {
    setSelectedCities([]);
    setSelectedBoroughs([]);
    setSelectedHighStreets([]);
  };

  const hasLocations = selectedCities.length > 0 || selectedBoroughs.length > 0 || selectedHighStreets.length > 0;
  const totalLocationCount = selectedCities.length + selectedBoroughs.length + selectedHighStreets.length;

  const canNext = () => {
    switch (step) {
      case 1: return !!selectedSeason;
      case 2: return hasLocations;
      case 3: return true;
      case 4: return name.trim().length > 0 && !!target && Number(target) > 0;
      case 5: return true;
      default: return true;
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !target) return;
    setSaving(true);
    setSubmitError(null);

    try {
      const targetInPence = Math.round(Number(target) * 100);

      await adminApi.createTemplate({
        name: name.trim(),
        tagline: description.trim() || name.trim(),
        seasonId: selectedSeason || undefined,
        audience: audience === "both" ? "BOTH" : audience === "consumers" ? "CONSUMER" : "BUSINESS",
        status: "ACTIVE",
        category: "fund",
        config: {
          targetAmount: targetInPence,
          description: description.trim(),
          rewardsEnabled,
          leaderboardEnabled,
          incentivesEnabled,
          locations: {
            cityIds: selectedCities,
            boroughIds: selectedBoroughs,
            highStreetIds: selectedHighStreets,
          },
        },
      });

      navigate("/admin/campaigns");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to create campaign in database");
    } finally {
      setSaving(false);
    }
  };

  const selectedSeasonData = seasons.find((s) => s.id === selectedSeason);

  // Build location display names from hierarchical selection
  const selectedLocationNames = useMemo<string[]>(() => {
    const list: string[] = [];
    selectedCities.forEach((cityId) => {
      const city = locationMaps.cityMap.get(cityId);
      if (city) list.push(city.name);
    });
    selectedBoroughs.forEach((bId) => {
      const b = locationMaps.boroughMap.get(bId);
      if (b) list.push(`${b.node.name} (${b.cityName})`);
    });
    selectedHighStreets.forEach((hsId) => {
      const hs = locationMaps.streetMap.get(hsId);
      if (hs) list.push(`${hs.node.name} (${hs.boroughName})`);
    });
    return list;
  }, [selectedCities, selectedBoroughs, selectedHighStreets, locationMaps]);

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/admin/campaigns")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Campaign</h1>
      <p className="text-sm text-gray-500 mb-6">Set up a new campaign with database season, hub locations, and audience configuration.</p>

      {submitError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Creation Failed</p>
            <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                step === s.id
                  ? "bg-primary-600 text-white"
                  : step > s.id
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {step > s.id ? <Check className="h-3 w-3" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 mx-0.5" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl bg-white border p-6 min-h-[400px]">

        {/* Step 1: Season */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Select Season</h2>
                <p className="text-sm text-gray-500">Choose which active or scheduled season this campaign belongs to.</p>
              </div>
              <Link
                to="/admin/seasons/new"
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-3.5 w-3.5" /> New Season
              </Link>
            </div>

            {seasonsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-2" />
                <p className="text-sm">Loading seasons from database...</p>
              </div>
            ) : seasonsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Unable to load seasons</p>
                <p className="text-xs text-red-600 mt-1">{seasonsError}</p>
              </div>
            ) : seasons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <h3 className="text-sm font-semibold text-gray-800">No Seasons Found in Database</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Admin seasons must be created before launching seasonal campaigns.
                </p>
                <Link
                  to="/admin/seasons/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Create First Season
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {seasons.map((season) => (
                  <label
                    key={season.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedSeason === season.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="season"
                      checked={selectedSeason === season.id}
                      onChange={() => setSelectedSeason(season.id)}
                      className="text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{season.name}</span>
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          season.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : season.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {season.status}
                        </span>
                        {season.referenceCode && (
                          <span className="text-[10px] font-mono text-gray-400">
                            #{season.referenceCode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {season.startDate ? new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                        {" — "}
                        {season.endDate ? new Date(season.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                      </div>
                      {season.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{season.description}</p>
                      )}
                    </div>
                    {selectedSeason === season.id && <Check className="h-5 w-5 text-primary-600 flex-shrink-0" />}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Locations (Hierarchical: City > Borough/Local Area > High Street) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Select Locations</h2>
                <p className="text-sm text-gray-500">Choose cities from the UK Hub hierarchy, then drill down into local areas and high streets.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAllCities}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Select All Cities
                </button>
                {selectedCities.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllCities}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {locationsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-2" />
                <p className="text-sm">Loading location hierarchy from database...</p>
              </div>
            ) : locationsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Unable to load location hierarchy</p>
                <p className="text-xs text-red-600 mt-1">{locationsError}</p>
              </div>
            ) : cities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
                <MapPin className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <h3 className="text-sm font-semibold text-gray-800">No Hub Locations Found</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Active cities, boroughs, and high streets in the database will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cities.map((city) => {
                  const isCitySelected = selectedCities.includes(city.id);
                  const cityBoroughs = city.children || [];

                  return (
                    <div key={city.id} className="rounded-lg border border-gray-200 overflow-hidden">
                      {/* City */}
                      <label className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        isCitySelected ? "bg-primary-50" : "hover:bg-gray-50"
                      }`}>
                        <input
                          type="checkbox"
                          checked={isCitySelected}
                          onChange={() => toggleCity(city.id)}
                          className="text-primary-600 rounded"
                        />
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">{city.name}</span>
                        {city.activationStatus && (
                          <span className="text-[10px] uppercase font-bold text-gray-400 ml-auto">
                            {city.activationStatus}
                          </span>
                        )}
                      </label>

                      {/* Boroughs / Local Areas (shown when city is selected) */}
                      {isCitySelected && cityBoroughs.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50 pl-6">
                          {cityBoroughs.map((borough) => {
                            const isBoroughSelected = selectedBoroughs.includes(borough.id);
                            const highStreets = borough.children || [];

                            return (
                              <div key={borough.id}>
                                <label className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${
                                  isBoroughSelected ? "bg-primary-50" : "hover:bg-gray-100"
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={isBoroughSelected}
                                    onChange={() => toggleBorough(borough.id)}
                                    className="text-primary-600 rounded"
                                  />
                                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-800">{borough.name}</span>
                                  {borough.shortDescription && (
                                    <span className="text-[10px] text-gray-400 hidden sm:inline">
                                      — {borough.shortDescription}
                                    </span>
                                  )}
                                </label>

                                {/* High Streets (shown when borough is selected) */}
                                {isBoroughSelected && highStreets.length > 0 && (
                                  <div className="border-t border-gray-100 bg-white pl-6">
                                    {highStreets.map((hs) => (
                                      <label
                                        key={hs.id}
                                        className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${
                                          selectedHighStreets.includes(hs.id) ? "bg-primary-50" : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedHighStreets.includes(hs.id)}
                                          onChange={() => toggleHighStreet(hs.id)}
                                          className="text-primary-600 rounded"
                                        />
                                        <span className="text-xs text-gray-400">├─</span>
                                        <span className="text-sm text-gray-700">{hs.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalLocationCount > 0 && (
              <div className="text-xs text-gray-500">
                {selectedCities.length} city, {selectedBoroughs.length} borough/area, {selectedHighStreets.length} high street(s) selected
              </div>
            )}
          </div>
        )}

        {/* Step 3: Audience */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Select Audience</h2>
            <p className="text-sm text-gray-500">Who can participate in this campaign?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudience(opt.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all ${
                    audience === opt.id
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className={audience === opt.id ? "text-primary-600" : "text-gray-400"}>
                    {opt.icon}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                  <span className="text-[10px] text-gray-500">{opt.description}</span>
                </button>
              ))}
            </div>
            {audience === "both" && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-700">
                  <strong>Both:</strong> Consumer and Business Owner participation streams are maintained separately in the database.
                  You can view each stream independently or combined.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-lg font-bold text-gray-900">Campaign Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="e.g., London Community Garden Fund"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                rows={3}
                placeholder="Describe the campaign and its goals..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Target (£) *</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="50000"
                min="1"
              />
            </div>
          </div>
        )}

        {/* Step 5: Configuration */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Campaign Configuration</h2>
            <p className="text-sm text-gray-500">Optional features for this campaign.</p>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Rewards</div>
                    <div className="text-[10px] text-gray-500">Enable rewards for campaign participants</div>
                  </div>
                </div>
                <input type="checkbox" checked={rewardsEnabled} onChange={(e) => setRewardsEnabled(e.target.checked)} className="text-primary-600 rounded" />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Leaderboard</div>
                    <div className="text-[10px] text-gray-500">Track and display campaign leaderboard</div>
                  </div>
                </div>
                <input type="checkbox" checked={leaderboardEnabled} onChange={(e) => setLeaderboardEnabled(e.target.checked)} className="text-primary-600 rounded" />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Incentives</div>
                    <div className="text-[10px] text-gray-500">Enable contribution incentives and bonuses</div>
                  </div>
                </div>
                <input type="checkbox" checked={incentivesEnabled} onChange={(e) => setIncentivesEnabled(e.target.checked)} className="text-primary-600 rounded" />
              </label>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Review Campaign</h2>
            <p className="text-sm text-gray-500">Review your campaign configuration before persisting to the database.</p>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-400 mb-1">Campaign Name</div>
                <div className="text-sm font-bold text-gray-900">{name || "Not set"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Season</div>
                  <div className="text-sm font-bold text-gray-900">{selectedSeasonData?.name || "Not selected"}</div>
                  {selectedSeasonData?.referenceCode && (
                    <div className="text-xs text-gray-400 mt-0.5">#{selectedSeasonData.referenceCode}</div>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Target</div>
                  <div className="text-sm font-bold text-gray-900">{target ? fmt(Number(target) * 100) : "Not set"}</div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-400 mb-1">Locations ({selectedLocationNames.length})</div>
                <div className="flex flex-wrap gap-1">
                  {selectedLocationNames.length > 0 ? (
                    selectedLocationNames.map((locName) => (
                      <span key={locName} className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                        {locName}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No locations selected</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-400 mb-1">Audience</div>
                <div className="text-sm font-bold text-gray-900">
                  {audience === "both" ? "Consumer & Business Owner" : audience === "consumers" ? "Consumers" : "Business Owners"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-400">Rewards</div>
                  <div className="text-sm font-bold text-gray-900">{rewardsEnabled ? "Yes" : "No"}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-400">Leaderboard</div>
                  <div className="text-sm font-bold text-gray-900">{leaderboardEnabled ? "Yes" : "No"}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-400">Incentives</div>
                  <div className="text-sm font-bold text-gray-900">{incentivesEnabled ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
            disabled={!canNext()}
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving || !canNext()}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Create Campaign
          </button>
        )}
      </div>
    </div>
  );
}
