// =============================================================================
// Create Campaign — Multi-Step Flow
// Campaign creation with season, location, audience, and configuration steps.
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Calendar, MapPin, Target,
  Users, Building2, Globe, Gift, Trophy,
} from "lucide-react";

type Audience = "consumers" | "business_owners" | "both";

const STEPS = [
  { id: 1, label: "Season", icon: <Calendar className="h-4 w-4" /> },
  { id: 2, label: "Locations", icon: <MapPin className="h-4 w-4" /> },
  { id: 3, label: "Audience", icon: <Users className="h-4 w-4" /> },
  { id: 4, label: "Details", icon: <Target className="h-4 w-4" /> },
  { id: 5, label: "Configuration", icon: <Gift className="h-4 w-4" /> },
  { id: 6, label: "Review", icon: <Check className="h-4 w-4" /> },
];

const DEMO_SEASONS = [
  { id: "autumn-2026", name: "Autumn 2026", status: "ACTIVE", startDate: "2026-09-01", endDate: "2026-11-30" },
  { id: "winter-2026", name: "Winter 2026", status: "SCHEDULED", startDate: "2026-12-01", endDate: "2027-02-28" },
  { id: "summer-2026", name: "Summer 2026", status: "COMPLETED", startDate: "2026-06-01", endDate: "2026-08-31" },
  { id: "spring-2026", name: "Spring 2026", status: "COMPLETED", startDate: "2026-03-01", endDate: "2026-05-31" },
];

// Hierarchical location data: City > Borough > High Street
const DEMO_LOCATION_TREE: Record<string, { name: string; boroughs: Record<string, { name: string; highStreets: string[] }> }> = {
  london: {
    name: "London",
    boroughs: {
      camden: { name: "Camden", highStreets: ["Camden High Street", "Chalk Farm Road", "Judd Street"] },
      westminster: { name: "Westminster", highStreets: ["Oxford Street", "Regent Street", "Victoria Street"] },
      islington: { name: "Islington", highStreets: ["Upper Street", "Angel Central", "Canonbury Road"] },
    },
  },
  manchester: {
    name: "Manchester",
    boroughs: {
      "city-centre": { name: "City Centre", highStreets: ["Market Street", "Deansgate", "Oldham Street"] },
      salem: { name: "Salford", highStreets: ["Chapel Street", "Broad Street", "Ordsall Lane"] },
      stockport: { name: "Stockport", highStreets: ["Merseyway", "Edgeley Road", "Great Portwood Street"] },
    },
  },
  birmingham: {
    name: "Birmingham",
    boroughs: {
      "city-centre": { name: "City Centre", highStreets: ["New Street", "High Street", "Corporation Street"] },
      edgbaston: { name: "Edgbaston", highStreets: ["Harborne High Street", "Bristol Road"] },
      "solihull": { name: "Solihull", highStreets: ["High Street", "Stratford Road"] },
    },
  },
  leeds: {
    name: "Leeds",
    boroughs: {
      "city-centre": { name: "City Centre", highStreets: ["Briggate", "Commercial Street", "Headrow"] },
      "headingley": { name: "Headingley", highStreets: ["Otley Road", "North Lane"] },
      "horsforth": { name: "Horsforth", highStreets: ["Town Street", "New Road Side"] },
    },
  },
  liverpool: {
    name: "Liverpool",
    boroughs: {
      "city-centre": { name: "City Centre", highStreets: ["Church Street", "Lord Street", "Strand"] },
      "allerton": { name: "Allerton", highStreets: ["Allerton Road", "Hunters Cross"] },
      "woolton": { name: "Woolton", highStreets: ["Woolton Street", "Allerton Road"] },
    },
  },
  bristol: {
    name: "Bristol",
    boroughs: {
      "city-centre": { name: "City Centre", highStreets: ["Park Street", "Corn Street", "Broadmead"] },
      "clifton": { name: "Clifton", highStreets: ["Queens Road", "Gloucester Road"] },
      "bedminster": { name: "Bedminster", highStreets: ["East Street", "North Street"] },
    },
  },
};

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

  // Step 1: Season
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  // Step 2: Locations (hierarchical)
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

  const toggleCity = (cityId: string) => {
    setSelectedCities((prev) => {
      const next = prev.includes(cityId) ? prev.filter((c) => c !== cityId) : [...prev, cityId];
      // Remove boroughs and high streets from deselected cities
      if (prev.includes(cityId)) {
        const city = DEMO_LOCATION_TREE[cityId];
        if (city) {
          const boroughIds = Object.keys(city.boroughs);
          setSelectedBoroughs((b) => b.filter((id) => !boroughIds.includes(id)));
          setSelectedHighStreets((h) => {
            const hsToRemove = boroughIds.flatMap((bid) => city.boroughs[bid]?.highStreets || []);
            return h.filter((hs) => !hsToRemove.includes(hs));
          });
        }
      }
      return next;
    });
  };

  const toggleBorough = (cityId: string, boroughId: string) => {
    const key = `${cityId}:${boroughId}`;
    setSelectedBoroughs((prev) => {
      const next = prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key];
      // Remove high streets from deselected boroughs
      if (prev.includes(key)) {
        const city = DEMO_LOCATION_TREE[cityId];
        const borough = city?.boroughs[boroughId];
        if (borough) {
          setSelectedHighStreets((h) => h.filter((hs) => !borough.highStreets.includes(hs)));
        }
      }
      return next;
    });
  };

  const toggleHighStreet = (hs: string) => {
    setSelectedHighStreets((prev) => prev.includes(hs) ? prev.filter((h) => h !== hs) : [...prev, hs]);
  };

  const selectAllCities = () => {
    setSelectedCities(Object.keys(DEMO_LOCATION_TREE));
  };

  const hasLocations = selectedCities.length > 0 || selectedBoroughs.length > 0 || selectedHighStreets.length > 0;

  const totalLocationCount = selectedCities.length + selectedBoroughs.length + selectedHighStreets.length;

  const canNext = () => {
    switch (step) {
      case 1: return !!selectedSeason;
      case 2: return hasLocations;
      case 3: return true;
      case 4: return name.trim().length > 0 && !!target;
      case 5: return true;
      default: return true;
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    // TODO: API call
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    navigate("/admin/campaigns");
  };

  const selectedSeasonData = DEMO_SEASONS.find((s) => s.id === selectedSeason);

  // Build location display names from hierarchical selection
  const selectedLocationNames: string[] = [];
  selectedCities.forEach((cityId) => {
    const city = DEMO_LOCATION_TREE[cityId];
    if (city) selectedLocationNames.push(city.name);
  });
  selectedBoroughs.forEach((key) => {
    const parts = key.split(":");
    const cityId = parts[0];
    const boroughId = parts[1];
    if (!cityId || !boroughId) return;
    const city = DEMO_LOCATION_TREE[cityId];
    const borough = city?.boroughs[boroughId];
    if (borough) selectedLocationNames.push(`${borough.name} (${city?.name})`);
  });
  selectedHighStreets.forEach((hs) => selectedLocationNames.push(hs));

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate("/admin/campaigns")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Campaign</h1>
      <p className="text-sm text-gray-500 mb-6">Set up a new campaign with season, locations, and audience configuration.</p>

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
            <h2 className="text-lg font-bold text-gray-900">Select Season</h2>
            <p className="text-sm text-gray-500">Choose which season this campaign belongs to.</p>
            <div className="space-y-3">
              {DEMO_SEASONS.map((season) => (
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
                        season.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {season.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {" — "}
                      {new Date(season.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  {selectedSeason === season.id && <Check className="h-5 w-5 text-primary-600" />}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Locations (Hierarchical: City > Borough > High Street) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Select Locations</h2>
                <p className="text-sm text-gray-500">Choose cities, then drill down into boroughs and high streets.</p>
              </div>
              <button onClick={selectAllCities} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                Select All Cities
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(DEMO_LOCATION_TREE).map(([cityId, city]) => {
                const isCitySelected = selectedCities.includes(cityId);
                const cityBoroughs = Object.entries(city.boroughs);

                return (
                  <div key={cityId} className="rounded-lg border border-gray-200 overflow-hidden">
                    {/* City */}
                    <label className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      isCitySelected ? "bg-primary-50" : "hover:bg-gray-50"
                    }`}>
                      <input
                        type="checkbox"
                        checked={isCitySelected}
                        onChange={() => toggleCity(cityId)}
                        className="text-primary-600 rounded"
                      />
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-900">{city.name}</span>
                    </label>

                    {/* Boroughs (shown when city is selected) */}
                    {isCitySelected && cityBoroughs.length > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50 pl-6">
                        {cityBoroughs.map(([boroughId, borough]) => {
                          const boroughKey = `${cityId}:${boroughId}`;
                          const isBoroughSelected = selectedBoroughs.includes(boroughKey);

                          return (
                            <div key={boroughId}>
                              <label className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${
                                isBoroughSelected ? "bg-primary-50" : "hover:bg-gray-100"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isBoroughSelected}
                                  onChange={() => toggleBorough(cityId, boroughId)}
                                  className="text-primary-600 rounded"
                                />
                                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-800">{borough.name}</span>
                              </label>

                              {/* High Streets (shown when borough is selected) */}
                              {isBoroughSelected && borough.highStreets.length > 0 && (
                                <div className="border-t border-gray-100 bg-white pl-6">
                                  {borough.highStreets.map((hs) => (
                                    <label
                                      key={hs}
                                      className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${
                                        selectedHighStreets.includes(hs) ? "bg-primary-50" : "hover:bg-gray-50"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedHighStreets.includes(hs)}
                                        onChange={() => toggleHighStreet(hs)}
                                        className="text-primary-600 rounded"
                                      />
                                      <span className="text-xs text-gray-400">├─</span>
                                      <span className="text-sm text-gray-700">{hs}</span>
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

            {totalLocationCount > 0 && (
              <div className="text-xs text-gray-500">
                {selectedCities.length} city, {selectedBoroughs.length} borough, {selectedHighStreets.length} high street(s) selected
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
                  <strong>Both:</strong> Consumer and Business Owner participation streams are maintained separately.
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
                min="0"
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
            <p className="text-sm text-gray-500">Review your campaign configuration before creating.</p>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-400 mb-1">Campaign Name</div>
                <div className="text-sm font-bold text-gray-900">{name || "Not set"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Season</div>
                  <div className="text-sm font-bold text-gray-900">{selectedSeasonData?.name || "Not selected"}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Target</div>
                  <div className="text-sm font-bold text-gray-900">{target ? fmt(Number(target) * 100) : "Not set"}</div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-400 mb-1">Locations</div>
                <div className="flex flex-wrap gap-1">
                  {selectedLocationNames.map((name) => (
                    <span key={name} className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                      {name}
                    </span>
                  ))}
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
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
