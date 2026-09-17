// =============================================================================
// Add / Activate City Wizard
// 8-step guided workflow: Find Location → Confirm City → City Setup →
// Local Areas → High Streets → HS Overview → Activation Rules → Review & Activate
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, ChevronRight, ChevronLeft, MapPin, Check, X, Globe,
  Building2, Users, Store, Target, CheckCircle, RefreshCw, Plus,
  TrendingUp, AlertCircle,
} from "lucide-react";
import { getLocalAreasForCity, getHighStreetsForArea } from "@/data/highStreetData";

// ───────────────────── Types ─────────────────────

interface CitySetupData {
  // Step 1: Location search
  searchQuery: string;
  selectedCity: string | null;

  // Step 2: City setup
  cityName: string;
  region: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  boundaryMode: "detected" | "radius" | "custom";
  radiusMiles: number;

  // Step 3: City hub config
  status: string;
  currentSeason: string;
  areaTerminology: string;

  // Step 4: Local areas
  localAreas: LocalAreaSetup[];

  // Step 4: High streets
  highStreets: HighStreetSetup[];

  // Step 5: Activation rules
  makingProgressRules: ActivationRule[];
  makingProgressLogic: "AND" | "OR";
  activeRules: ActivationRule[];
  activeLogic: "AND" | "OR";

  // Step 6: Review
  activateNow: boolean;
}

interface LocalAreaSetup {
  name: string;
  slug: string;
  included: boolean;
  type: string;
  status: string;
  source: string;
  highStreets: HighStreetSetup[];
}

interface HighStreetSetup {
  name: string;
  slug: string;
  localAreaSlug: string;
  confirmed: boolean;
  suggested: boolean;
  status: string;
  suggestedBy: string;
  postcodes: string[];
}

interface HighStreetRecommendation {
  id: string;
  name: string;
  postcode: string;
  localArea: string;
  city: string;
  businessCount: number;
  consumerCount: number;
  status: string;
}

interface ActivationRule {
  id: string;
  label: string;
  type: "campaign_coverage" | "campaign_participation" | "local_area_activity" | "high_street_activity" | "contribution";
  threshold: number;
  unit: "%" | "count";
  enabled: boolean;
  audience: "all" | "business" | "consumer";
  businessThreshold?: number;
  consumerThreshold?: number;
}

// ───────────────────── Demo UK Cities for Search ─────────────────────

const UK_CITIES = [
  { name: "London", region: "Greater London", lat: 51.5074, lng: -0.1278, population: "8,982,000" },
  { name: "Manchester", region: "Greater Manchester", lat: 53.4808, lng: -2.2426, population: "553,000" },
  { name: "Birmingham", region: "West Midlands", lat: 52.4862, lng: -1.8904, population: "1,145,000" },
  { name: "Leeds", region: "West Yorkshire", lat: 53.8008, lng: -1.5491, population: "812,000" },
  { name: "Liverpool", region: "Merseyside", lat: 53.4084, lng: -2.9916, population: "498,000" },
  { name: "Bristol", region: "Bristol", lat: 51.4545, lng: -2.5879, population: "472,000" },
  { name: "Glasgow", region: "Glasgow City", lat: 55.8642, lng: -4.2518, population: "635,000" },
  { name: "Edinburgh", region: "Edinburgh", lat: 55.9533, lng: -3.1883, population: "527,000" },
  { name: "Newcastle", region: "Tyne and Wear", lat: 54.9783, lng: -1.6178, population: "302,000" },
  { name: "Nottingham", region: "Nottinghamshire", lat: 52.9548, lng: -1.1581, population: "323,000" },
  { name: "Sheffield", region: "South Yorkshire", lat: 53.3811, lng: -1.4701, population: "584,000" },
  { name: "Leicester", region: "Leicestershire", lat: 52.6369, lng: -1.1398, population: "368,000" },
  { name: "Coventry", region: "West Midlands", lat: 52.4068, lng: -1.5197, population: "371,000" },
  { name: "Southampton", region: "Hampshire", lat: 50.9097, lng: -1.4044, population: "253,000" },
  { name: "Reading", region: "Berkshire", lat: 51.4543, lng: -0.9781, population: "218,000" },
  { name: "Bradford", region: "West Yorkshire", lat: 53.7960, lng: -1.7594, population: "366,000" },
];

// ───────────────────── Default Activation Rules ─────────────────────

// ── Default Making Progress Rules ──────────────────────
const DEFAULT_MAKING_PROGRESS_RULES: ActivationRule[] = [
  { id: "mp-campaign-coverage", label: "Campaign Coverage", type: "campaign_coverage", threshold: 30, unit: "%", enabled: true, audience: "all" },
  { id: "mp-campaign-participation", label: "Campaigns with Qualifying Activity", type: "campaign_participation", threshold: 30, unit: "%", enabled: true, audience: "all" },
  { id: "mp-local-area-activity", label: "Local Areas with Active/Progressing Campaigns", type: "local_area_activity", threshold: 3, unit: "count", enabled: true, audience: "all" },
  { id: "mp-high-street-activity", label: "High Streets with Qualifying Campaigns", type: "high_street_activity", threshold: 25, unit: "%", enabled: false, audience: "all" },
  { id: "mp-contribution", label: "Contribution Progress", type: "contribution", threshold: 20, unit: "%", enabled: false, audience: "all" },
];

// ── Default Active Rules ──────────────────────
const DEFAULT_ACTIVE_RULES: ActivationRule[] = [
  { id: "a-campaign-coverage", label: "Campaign Coverage", type: "campaign_coverage", threshold: 70, unit: "%", enabled: true, audience: "all" },
  { id: "a-campaign-participation", label: "Qualifying Participation", type: "campaign_participation", threshold: 50, unit: "%", enabled: true, audience: "all" },
  { id: "a-local-area-activity", label: "Local Areas with Qualifying Activity", type: "local_area_activity", threshold: 50, unit: "%", enabled: true, audience: "all" },
  { id: "a-high-street-activity", label: "High Streets with Qualifying Campaigns", type: "high_street_activity", threshold: 40, unit: "%", enabled: false, audience: "all" },
  { id: "a-contribution", label: "Contribution Target", type: "contribution", threshold: 50, unit: "%", enabled: false, audience: "all" },
];

// ───────────────────── Main Wizard ─────────────────────

const STEPS = [
  { id: "location", label: "Location", icon: MapPin },
  { id: "confirm", label: "Confirm City", icon: MapPin },
  { id: "setup", label: "City Setup", icon: Building2 },
  { id: "local-areas", label: "Local Areas", icon: Globe },
  { id: "high-streets", label: "High Streets", icon: Store },
  { id: "hs-overview", label: "HS Overview", icon: CheckCircle },
  { id: "rules", label: "Activation Rules", icon: Target },
  { id: "review", label: "Review & Activate", icon: CheckCircle },
];

export function AddCityWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [data, setData] = useState<CitySetupData>({
    searchQuery: "",
    selectedCity: null,
    cityName: "",
    region: "",
    country: "United Kingdom",
    description: "",
    latitude: 0,
    longitude: 0,
    boundaryMode: "detected",
    radiusMiles: 10,
    status: "NOT_ACTIVATED",
    currentSeason: "autumn-2026",
    areaTerminology: "Local Area",
    localAreas: [],
    highStreets: [],
    makingProgressRules: [...DEFAULT_MAKING_PROGRESS_RULES],
    makingProgressLogic: "AND",
    activeRules: [...DEFAULT_ACTIVE_RULES],
    activeLogic: "AND",
    activateNow: true,
  });

  const update = useCallback((updates: Partial<CitySetupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const goNext = () => {
    if (isLastStep) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (!isFirstStep) setCurrentStep((prev) => prev - 1);
  };

  const goToStep = (idx: number) => {
    if (idx <= Math.max(...completedSteps, currentStep) + 1) {
      setCurrentStep(idx);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepLocation data={data} update={update} />;
      case 1: return <StepConfirmCity data={data} update={update} />;
      case 2: return <StepCityHubConfig data={data} update={update} />;
      case 3: return <StepLocalAreas data={data} update={update} />;
      case 4: return <StepHighStreets data={data} update={update} />;
      case 5: return <StepHighStreetOverview data={data} />;
      case 6: return <StepActivationRules data={data} update={update} />;
      case 7: return <StepReview data={data} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link to="/admin" className="hover:text-gray-700">Admin</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link to="/admin/cities" className="hover:text-gray-700">Cities</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-gray-900 font-medium">Add / Activate City</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Add / Activate City</h1>
            </div>
            <button
              onClick={() => navigate("/admin/cities")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const isCompleted = completedSteps.has(idx);
              const isCurrent = idx === currentStep;
              const isClickable = idx <= Math.max(...completedSteps, currentStep) + 1;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => goToStep(idx)}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-primary-50 text-primary-700 border border-primary-200"
                        : isCompleted
                        ? "bg-green-50 text-green-700"
                        : isClickable
                        ? "text-gray-500 hover:bg-gray-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isCompleted
                        ? "bg-green-200 text-green-700"
                        : isCurrent
                        ? "bg-primary-200 text-primary-700"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`mx-1 h-px flex-1 ${isCompleted ? "bg-green-300" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 min-h-[500px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={isFirstStep}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            {!isLastStep && (
              <button
                onClick={() => {
                  setCompletedSteps((prev) => new Set([...prev, currentStep]));
                  navigate("/admin/cities");
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button>
            )}
            <button
              onClick={isLastStep ? () => {
                navigate(`/admin/cities/${data.cityName?.toLowerCase().replace(/\s+/g, "-") || "new"}`);
              } : goNext}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Create City Hub
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Step 1: Find Location ─────────────────────

function StepLocation({ data, update }: { data: CitySetupData; update: (u: Partial<CitySetupData>) => void }) {
  const [search, setSearch] = useState(data.searchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filtered = UK_CITIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (city: typeof UK_CITIES[0]) => {
    update({
      searchQuery: city.name,
      selectedCity: city.name,
      cityName: city.name,
      region: city.region,
      latitude: city.lat,
      longitude: city.lng,
    });
    setSearch(city.name);
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Find a UK City</h2>
        <p className="mt-1 text-sm text-gray-500">
          Search for a city or location in the United Kingdom to begin setting up a City Hub.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Search for a UK city</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              update({ searchQuery: e.target.value, selectedCity: null });
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Search for a UK city..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          {dropdownOpen && search && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                Search Results
              </div>
              {filtered.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleSelect(city)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{city.name}</div>
                    <div className="text-xs text-gray-500">{city.region}, United Kingdom</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {dropdownOpen && search && filtered.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="px-4 py-6 text-center">
                <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No cities found matching "{search}"</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!data.selectedCity && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Select a city from the search results to continue.</p>
          <p className="text-xs text-gray-400 mt-1">
            The frontend is designed to connect to Google Maps/Places API later.
          </p>
        </div>
      )}

      {data.selectedCity && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-bold text-green-800">Location Selected</span>
          </div>
          <div className="text-sm text-green-700">
            <strong>{data.cityName}</strong>
          </div>
          <div className="text-xs text-green-600 mt-1">
            {data.region}, United Kingdom
          </div>
          <div className="mt-2 text-xs text-green-600">
            Coordinates: {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Step 2: Confirm City ─────────────────────

function StepConfirmCity({ data, update }: { data: CitySetupData; update: (u: Partial<CitySetupData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Confirm City</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review the selected location and configure the city coverage area.
        </p>
      </div>

      {/* City Confirmation Card */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            {data.cityName?.charAt(0)}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{data.cityName}</div>
            <div className="text-sm text-gray-600">{data.region}</div>
            <div className="text-xs text-gray-400">United Kingdom</div>
          </div>
        </div>
      </div>

      {/* Map Preview */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Map Preview</h4>
        </div>
        <div className="relative h-64 bg-gray-200">
          {/* Placeholder map — will connect to Google Maps later */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <MapPin className="h-12 w-12 text-primary-400 mb-2" />
            <div className="text-sm font-medium text-gray-700">{data.cityName}</div>
            <div className="text-xs text-gray-500">{data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}</div>
            <div className="mt-3 rounded-lg bg-white/80 backdrop-blur px-3 py-1.5 text-xs text-gray-500">
              Google Maps integration will be connected here
            </div>
          </div>
          {/* Boundary overlay indicator */}
          <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Coverage</div>
            <div className="text-xs font-medium text-gray-700">
              {data.boundaryMode === "detected"
                ? "Detected city boundary"
                : data.boundaryMode === "radius"
                ? `${data.radiusMiles} mile radius`
                : "Custom boundary"}
            </div>
          </div>
        </div>
      </div>

      {/* City Coverage */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700">City Coverage</h4>
        <p className="text-xs text-gray-500">
          This is FundOrDonate's activation boundary. Google helps us discover the location; FundOrDonate remains responsible for what it activates.
        </p>

        <div className="space-y-2">
          {([
            { value: "detected", label: "Use detected city boundary", desc: "Use the geographic boundary detected from the location data." },
            { value: "radius", label: "Set radius", desc: "Define a custom radius around the city centre." },
            { value: "custom", label: "Custom boundary", desc: "Draw or define a custom boundary on the map." },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ boundaryMode: opt.value })}
              className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                data.boundaryMode === opt.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                  data.boundaryMode === opt.value
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300"
                }`}>
                  {data.boundaryMode === opt.value && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {data.boundaryMode === "radius" && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <label className="text-sm font-medium text-gray-700">Radius:</label>
            <input
              type="number"
              value={data.radiusMiles}
              onChange={(e) => update({ radiusMiles: parseInt(e.target.value) || 10 })}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-500">miles</span>
          </div>
        )}
      </div>

      {/* Detected Location Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Detected Location Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">City:</span>
            <span className="ml-2 font-medium text-gray-900">{data.cityName}</span>
          </div>
          <div>
            <span className="text-gray-500">Region:</span>
            <span className="ml-2 font-medium text-gray-900">{data.region}</span>
          </div>
          <div>
            <span className="text-gray-500">Latitude:</span>
            <span className="ml-2 font-medium text-gray-900">{data.latitude.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-gray-500">Longitude:</span>
            <span className="ml-2 font-medium text-gray-900">{data.longitude.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Step 3: City Hub Config ─────────────────────

function StepCityHubConfig({ data, update }: { data: CitySetupData; update: (u: Partial<CitySetupData>) => void }) {
  const seasons = [
    { value: "summer-2026", label: "Summer 2026" },
    { value: "autumn-2026", label: "Autumn 2026", current: true },
    { value: "winter-2026", label: "Winter 2026" },
    { value: "spring-2027", label: "Spring 2027" },
  ];

  const terminologyOptions = [
    { value: "Borough", desc: "Used for London and similar administrative areas" },
    { value: "District", desc: "Used for Manchester, Birmingham and similar" },
    { value: "Local Area", desc: "Generic term for any sub-city area" },
    { value: "Council Area", desc: "Used for council-administered regions" },
    { value: "Other", desc: "Custom terminology" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configure the City Hub</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set up the basic information for the {data.cityName} City Hub.
        </p>
      </div>

      {/* City Hub Header */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {data.cityName?.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{data.cityName}</div>
            <div className="text-sm text-gray-500">{data.region}, United Kingdom</div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Basic Information</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">City Name</label>
            <input
              type="text"
              value={data.cityName}
              onChange={(e) => update({ cityName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Country</label>
            <input
              type="text"
              value={data.country}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-400">UK is the fixed operating scope</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Status</label>
            <input
              type="text"
              value="Not Activated"
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-400">Status updates automatically based on activation rules</p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Current Season</label>
            <select
              value={data.currentSeason}
              onChange={(e) => update({ currentSeason: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {seasons.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}{s.current ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* City Terminology */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">City Terminology</h4>
          <p className="mt-1 text-xs text-gray-500">
            Choose the display label for sub-city areas. The underlying system uses "Local Area" generically.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">Local Area Display Name</label>
          <select
            value={data.areaTerminology}
            onChange={(e) => update({ areaTerminology: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            {terminologyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}</option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs text-gray-500 mb-2">Preview:</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{data.cityName}</span>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-primary-600">{data.areaTerminology}s</span>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-500">High Streets</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-400">
            Examples for {data.cityName}: {data.areaTerminology} 1, {data.areaTerminology} 2, {data.areaTerminology} 3...
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs text-blue-700">
            <strong>London uses:</strong> Borough (e.g. Westminster, Camden)
            <br />
            <strong>Manchester uses:</strong> District (e.g. City Centre, Northern Quarter)
            <br />
            <strong>Other cities:</strong> Local Area, Council Area, or custom
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Step 3: Local Areas ─────────────────────

function StepLocalAreas({ data, update }: { data: CitySetupData; update: (u: Partial<CitySetupData>) => void }) {
  const citySlug = data.cityName?.toLowerCase().replace(/\s+/g, "-") || "";
  const [selectedArea, setSelectedArea] = useState<LocalAreaSetup | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaType, setNewAreaType] = useState(data.areaTerminology || "Local Area");
  const [refreshing, setRefreshing] = useState(false);

  // Area terminology options
  const areaTypes = ["Borough", "District", "Local Area", "Council Area", "Other"];

  // Get discovered local areas from highStreetData
  const discoveredAreas = useMemo(() => {
    const areas = getLocalAreasForCity(citySlug);
    if (areas.length > 0) {
      return areas.map((area) => ({
        name: area.name,
        slug: area.slug,
        included: true,
        type: data.areaTerminology || "Borough",
        status: "NOT_ACTIVATED",
        source: "Geographic data",
        highStreets: area.highStreetsList.map((hs) => ({
          name: hs.name,
          slug: hs.slug,
          localAreaSlug: area.slug,
          confirmed: false,
          suggested: true,
          status: "SUGGESTED",
          suggestedBy: "Geographic data",
          postcodes: [],
        })),
      }));
    }
    // Fallback demo data if city not in highStreetData
    return [
      { name: `${data.areaTerminology || "Local Area"} 1`, slug: "area-1", included: true, type: data.areaTerminology || "Borough", status: "NOT_ACTIVATED", source: "Geographic data", highStreets: [] },
      { name: `${data.areaTerminology || "Local Area"} 2`, slug: "area-2", included: true, type: data.areaTerminology || "Borough", status: "NOT_ACTIVATED", source: "Geographic data", highStreets: [] },
      { name: `${data.areaTerminology || "Local Area"} 3`, slug: "area-3", included: true, type: data.areaTerminology || "Borough", status: "NOT_ACTIVATED", source: "Geographic data", highStreets: [] },
      { name: `${data.areaTerminology || "Local Area"} 4`, slug: "area-4", included: false, type: data.areaTerminology || "Borough", status: "NOT_ACTIVATED", source: "Geographic data", highStreets: [] },
      { name: `${data.areaTerminology || "Local Area"} 5`, slug: "area-5", included: false, type: data.areaTerminology || "Borough", status: "NOT_ACTIVATED", source: "Geographic data", highStreets: [] },
    ];
  }, [citySlug, data.areaTerminology]);

  // Initialize local areas if empty
  const localAreas = data.localAreas.length > 0 ? data.localAreas : discoveredAreas;
  const includedCount = localAreas.filter((a) => a.included).length;

  const toggleArea = (slug: string) => {
    const updated = localAreas.map((a) =>
      a.slug === slug ? { ...a, included: !a.included } : a
    );
    update({ localAreas: updated });
  };

  const toggleAll = (include: boolean) => {
    update({ localAreas: localAreas.map((a) => ({ ...a, included: include })) });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const slug = newAreaName.toLowerCase().replace(/\s+/g, "-");
    const newArea: LocalAreaSetup = {
      name: newAreaName,
      slug,
      included: true,
      type: newAreaType,
      status: "NOT_ACTIVATED",
      source: "Admin added",
      highStreets: [],
    };
    update({ localAreas: [...localAreas, newArea] });
    setNewAreaName("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Local Areas</h2>
        <p className="mt-1 text-sm text-gray-500">
          Detected geographic subdivisions for {data.cityName}. Select which areas to include in the City Hub.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-900">
            {localAreas.length} {data.areaTerminology || "Local Area"}s found
          </span>
          <span className="text-sm text-gray-500">
            · {includedCount} included
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => toggleAll(true)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Select All
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Deselect All
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add {data.areaTerminology || "Local Area"}
          </button>
        </div>
      </div>

      {/* Areas Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-10 px-4 py-3">
                  <span
                    onClick={() => {
                      const allIncluded = localAreas.every((a) => a.included);
                      toggleAll(!allIncluded);
                    }}
                    className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-colors ${
                      localAreas.length > 0 && localAreas.every((a) => a.included)
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {localAreas.length > 0 && localAreas.every((a) => a.included) && <Check className="h-3.5 w-3.5" />}
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Boundary</th>
                <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Source</th>
                <th className="px-4 py-3 text-right font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {localAreas.map((area) => (
                <tr
                  key={area.slug}
                  className={`transition-colors ${area.included ? "bg-primary-50/30" : "bg-gray-50/50"} hover:bg-gray-50`}
                >
                  <td className="px-4 py-3">
                    <span
                      onClick={() => toggleArea(area.slug)}
                      className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-colors ${
                        area.included
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {area.included && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedArea(area)}
                      className="text-left hover:underline"
                    >
                      <div className="font-medium text-gray-900">{area.name}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {area.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">Detected</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      area.included
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {area.included ? "Included" : "Excluded"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{area.source}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleArea(area.slug)}
                        className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                          area.included
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                        }`}
                      >
                        {area.included ? "Exclude" : "Include"}
                      </button>
                      <button
                        onClick={() => setSelectedArea(area)}
                        className="rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            Local areas are discovered from geographic data. You can include, exclude, or add areas as needed.
          </span>
        </div>
      </div>

      {/* ─── Area Detail Drawer ─── */}
      {selectedArea && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedArea(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedArea.name}</h3>
              <button
                onClick={() => setSelectedArea(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Parent City */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Parent City</span>
                <span className="text-sm font-medium text-gray-900">{data.cityName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium text-gray-900">{selectedArea.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedArea.included ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {selectedArea.included ? "Included" : "Excluded"}
                </span>
              </div>

              {/* Map Placeholder */}
              <div>
                <span className="text-sm text-gray-500 mb-2 block">Boundary</span>
                <div className="rounded-lg border border-gray-200 bg-gray-100 h-40 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Map boundary preview</span>
                  </div>
                </div>
              </div>

              {/* High Streets */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">High Streets</span>
                <span className="text-sm text-gray-900">
                  {selectedArea.highStreets.length > 0
                    ? `${selectedArea.highStreets.length} configured`
                    : "Not configured yet"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Campaigns</span>
                <span className="text-sm text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Source</span>
                <span className="text-xs text-gray-500">{selectedArea.source}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit
                </button>
                <button className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  View Map
                </button>
                <button
                  onClick={() => setSelectedArea(null)}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Local Area Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add {data.areaTerminology || "Local Area"}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Name</label>
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder={`e.g. ${data.areaTerminology || "Local Area"} name`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Type</label>
                <select
                  value={newAreaType}
                  onChange={(e) => setNewAreaType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {areaTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddArea}
                disabled={!newAreaName.trim()}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Add {data.areaTerminology || "Local Area"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Step 4: High Streets ─────────────────────

function StepHighStreets({ data, update }: { data: CitySetupData; update: (u: Partial<CitySetupData>) => void }) {
  const citySlug = data.cityName?.toLowerCase().replace(/\s+/g, "-") || "";
  const [selectedStreet, setSelectedStreet] = useState<HighStreetSetup | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecsPanel, setShowRecsPanel] = useState(false);
  const [newStreet, setNewStreet] = useState({ name: "", localArea: "", postcode: "" });
  const [newPostcode, setNewPostcode] = useState("");

  // Demo recommendations
  const DEMO_RECOMMENDATIONS: HighStreetRecommendation[] = [
    { id: "rec-1", name: "Chapel Walk", postcode: "SW1", localArea: "Westminster", city: data.cityName || "London", businessCount: 4, consumerCount: 3, status: "new" },
    { id: "rec-2", name: "Market Street", postcode: "N1", localArea: "Islington", city: data.cityName || "London", businessCount: 2, consumerCount: 5, status: "new" },
  ];

  // Get all high streets from included local areas
  const allHighStreets = useMemo(() => {
    const includedAreas = data.localAreas.filter((a) => a.included);
    const streets: HighStreetSetup[] = [];

    for (const area of includedAreas) {
      const areaData = getHighStreetsForArea(citySlug, area.slug);
      if (areaData.length > 0) {
        for (const hs of areaData) {
          streets.push({
            name: hs.name,
            slug: hs.slug,
            localAreaSlug: area.slug,
            confirmed: false,
            suggested: true,
            status: "SUGGESTED",
            suggestedBy: "Geographic data",
            postcodes: [],
          });
        }
      } else if (area.highStreets.length > 0) {
        streets.push(...area.highStreets.map((hs) => ({
          ...hs,
          status: hs.confirmed ? "CONFIRMED" : "SUGGESTED",
          suggestedBy: "Geographic data",
          postcodes: [],
        })));
      }
    }
    return streets;
  }, [citySlug, data.localAreas]);

  // Initialize high streets if empty
  const highStreets = data.highStreets.length > 0 ? data.highStreets : allHighStreets;
  const confirmedCount = highStreets.filter((hs) => hs.confirmed).length;
  const suggestedCount = highStreets.filter((hs) => !hs.confirmed).length;

  const confirmAll = () => {
    update({ highStreets: highStreets.map((hs) => ({ ...hs, confirmed: true, status: "CONFIRMED" })) });
  };

  const confirmStreet = (slug: string) => {
    const updated = highStreets.map((hs) =>
      hs.slug === slug ? { ...hs, confirmed: true, status: "CONFIRMED" } : hs
    );
    update({ highStreets: updated });
    setSelectedStreet(null);
  };

  const rejectStreet = (slug: string) => {
    const updated = highStreets.map((hs) =>
      hs.slug === slug ? { ...hs, confirmed: false, status: "REJECTED" } : hs
    );
    update({ highStreets: updated });
    setSelectedStreet(null);
  };

  const addPostcode = () => {
    if (!newPostcode.trim() || !selectedStreet) return;
    const updated = highStreets.map((hs) =>
      hs.slug === selectedStreet.slug
        ? { ...hs, postcodes: [...hs.postcodes, newPostcode] }
        : hs
    );
    update({ highStreets: updated });
    setSelectedStreet({ ...selectedStreet, postcodes: [...selectedStreet.postcodes, newPostcode] });
    setNewPostcode("");
  };

  const handleAddStreet = () => {
    if (!newStreet.name.trim()) return;
    const slug = newStreet.name.toLowerCase().replace(/\s+/g, "-");
    const newHS: HighStreetSetup = {
      name: newStreet.name,
      slug,
      localAreaSlug: newStreet.localArea || data.localAreas[0]?.slug || "",
      confirmed: false,
      suggested: true,
      status: "SUGGESTED",
      suggestedBy: "Admin added",
      postcodes: newStreet.postcode ? [newStreet.postcode] : [],
    };
    update({ highStreets: [...highStreets, newHS] });
    setNewStreet({ name: "", localArea: "", postcode: "" });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Identify High Streets</h2>
        <p className="mt-1 text-sm text-gray-500">
          High Streets may be identified automatically from geographic/place data, but FundOrDonate can also confirm High Streets using admin review and recommendations from businesses and consumers.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-900">
            {highStreets.length} High Streets
          </span>
          <span className="text-sm text-green-600">· {confirmedCount} confirmed</span>
          <span className="text-sm text-amber-600">· {suggestedCount} suggested</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecsPanel(!showRecsPanel)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Recommendations ({DEMO_RECOMMENDATIONS.length})
          </button>
          <button onClick={confirmAll} className="text-xs font-medium text-primary-600 hover:text-primary-700">
            Confirm All
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add / Identify High Street
          </button>
        </div>
      </div>

      {/* Suggested High Streets Table */}
      {highStreets.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-bold text-gray-600">High Street</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Local Area</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Suggested By</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {highStreets.map((hs) => (
                  <tr key={hs.slug} className={`hover:bg-gray-50 transition-colors ${
                    hs.confirmed ? "bg-green-50/30" : ""
                  }`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedStreet(hs)}
                        className="text-left hover:underline"
                      >
                        <div className="font-medium text-gray-900">{hs.name}</div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{hs.localAreaSlug}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        hs.confirmed
                          ? "bg-green-100 text-green-700"
                          : hs.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {hs.confirmed ? "Confirmed" : hs.status === "REJECTED" ? "Rejected" : "Suggested"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{hs.suggestedBy}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStreet(hs)}
                          className="rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          Review
                        </button>
                        {!hs.confirmed && (
                          <button
                            onClick={() => confirmStreet(hs.slug)}
                            className="rounded bg-green-100 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-200 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border border-dashed border-gray-300">
          <Store className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No high streets detected for the selected local areas.</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add / Identify High Street" to manually add one.</p>
        </div>
      )}

      {/* Recommendations Panel */}
      {showRecsPanel && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">High Street Recommendations</h4>
              <p className="text-xs text-gray-500">From Business Owners and Consumers</p>
            </div>
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {DEMO_RECOMMENDATIONS.length} new
            </span>
          </div>
          <div className="space-y-2">
            {DEMO_RECOMMENDATIONS.map((rec) => (
              <div key={rec.id} className="rounded-lg bg-white border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{rec.name}</div>
                    <div className="text-xs text-gray-500">{rec.localArea} · {rec.city}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Business Owners: {rec.businessCount} · Consumers: {rec.consumerCount}
                    </div>
                  </div>
                  <button className="rounded bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-200 transition-colors">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── High Street Detail Drawer ─── */}
      {selectedStreet && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedStreet(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedStreet.name}</h3>
              <button
                onClick={() => setSelectedStreet(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">City</span>
                  <span className="text-sm font-medium text-gray-900">{data.cityName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Local Area</span>
                  <span className="text-sm font-medium text-gray-900">{selectedStreet.localAreaSlug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Suggested by</span>
                  <span className="text-sm text-gray-700">{selectedStreet.suggestedBy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selectedStreet.confirmed
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {selectedStreet.confirmed ? "Confirmed" : "Suggested"}
                  </span>
                </div>
              </div>

              {/* Map Placeholder */}
              <div>
                <span className="text-sm text-gray-500 mb-2 block">Location</span>
                <div className="rounded-lg border border-gray-200 bg-gray-100 h-40 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Map location preview</span>
                  </div>
                </div>
              </div>

              {/* Postcodes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Postcodes / Coverage</span>
                </div>
                {selectedStreet.postcodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedStreet.postcodes.map((pc) => (
                      <span key={pc} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {pc}
                        <button
                          onClick={() => {
                            const updated = highStreets.map((hs) =>
                              hs.slug === selectedStreet.slug
                                ? { ...hs, postcodes: hs.postcodes.filter((p) => p !== pc) }
                                : hs
                            );
                            update({ highStreets: updated });
                            setSelectedStreet({ ...selectedStreet, postcodes: selectedStreet.postcodes.filter((p) => p !== pc) });
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-2">No postcodes configured yet</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPostcode}
                    onChange={(e) => setNewPostcode(e.target.value)}
                    placeholder="e.g. W1A"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    onKeyDown={(e) => e.key === "Enter" && addPostcode()}
                  />
                  <button
                    onClick={addPostcode}
                    disabled={!newPostcode.trim()}
                    className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                {!selectedStreet.confirmed ? (
                  <>
                    <button
                      onClick={() => rejectStreet(selectedStreet.slug)}
                      className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => confirmStreet(selectedStreet.slug)}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                    >
                      Confirm High Street
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedStreet(null)}
                    className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add High Street Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add / Identify High Street</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">High Street Name</label>
                <input
                  type="text"
                  value={newStreet.name}
                  onChange={(e) => setNewStreet({ ...newStreet, name: e.target.value })}
                  placeholder="e.g. Oxford Street"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Local Area</label>
                <select
                  value={newStreet.localArea}
                  onChange={(e) => setNewStreet({ ...newStreet, localArea: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select local area</option>
                  {data.localAreas.filter((a) => a.included).map((a) => (
                    <option key={a.slug} value={a.slug}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Postcode / Area</label>
                <input
                  type="text"
                  value={newStreet.postcode}
                  onChange={(e) => setNewStreet({ ...newStreet, postcode: e.target.value })}
                  placeholder="e.g. W1A"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search location..."
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Coverage</label>
                <div className="rounded-lg border border-gray-200 bg-gray-100 h-32 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Map coverage preview</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStreet}
                disabled={!newStreet.name.trim()}
                className="flex-1 rounded-lg border border-primary-300 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
              >
                Save as Suggested
              </button>
              <button
                onClick={() => {
                  handleAddStreet();
                  if (newStreet.name.trim()) {
                    const slug = newStreet.name.toLowerCase().replace(/\s+/g, "-");
                    confirmStreet(slug);
                  }
                }}
                disabled={!newStreet.name.trim()}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Confirm High Street
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Step 6: High Street Overview ─────────────────────

function StepHighStreetOverview({ data }: { data: CitySetupData }) {
  const includedAreas = data.localAreas.filter((a) => a.included);
  const confirmedStreets = data.highStreets.filter((hs) => hs.confirmed);
  const needsReview = data.highStreets.filter((hs) => !hs.confirmed && hs.status !== "REJECTED");

  // Group streets by local area
  const streetsByArea = confirmedStreets.reduce((acc, hs) => {
    const area = hs.localAreaSlug;
    if (!acc[area]) acc[area] = [];
    acc[area].push(hs);
    return acc;
  }, {} as Record<string, typeof confirmedStreets>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">High Street Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Summary of confirmed high streets across {data.cityName}.
        </p>
      </div>

      {/* City Summary Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            {data.cityName?.charAt(0)}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{data.cityName}</div>
            <div className="text-sm text-gray-500">{data.region}, United Kingdom</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{includedAreas.length}</div>
            <div className="text-xs text-gray-500">Local Areas</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.highStreets.length}</div>
            <div className="text-xs text-gray-500">High Streets</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{confirmedStreets.length}</div>
            <div className="text-xs text-green-600">Confirmed</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{needsReview.length}</div>
            <div className="text-xs text-amber-600">Needs Review</div>
          </div>
        </div>
      </div>

      {/* Drill-down: Area → High Streets */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Confirmed High Streets by Area</h3>
        {Object.entries(streetsByArea).length > 0 ? (
          Object.entries(streetsByArea).map(([areaSlug, streets]) => (
            <div key={areaSlug} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-900">{areaSlug}</span>
                </div>
                <span className="text-xs text-gray-500">{streets.length} high streets</span>
              </div>
              <div className="divide-y divide-gray-100">
                {streets.map((hs) => (
                  <div key={hs.slug} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <Store className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{hs.name}</span>
                    <span className="ml-auto inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 rounded-lg border border-dashed border-gray-300">
            <Store className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No confirmed high streets yet.</p>
            <p className="text-xs text-gray-400">Go back to High Streets step to confirm some.</p>
          </div>
        )}
      </div>

      {/* Drill-down path visualization */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="text-xs font-bold text-blue-600 mb-2">Drill-down Path</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-blue-800">{data.cityName}</span>
          <ChevronRight className="h-3 w-3 text-blue-400" />
          <span className="text-blue-600">{includedAreas[0]?.name || "Area"}</span>
          <ChevronRight className="h-3 w-3 text-blue-400" />
          <span className="text-blue-500">{confirmedStreets[0]?.name || "High Street"}</span>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          These are contextual views inside the city setup, not new permanent navigation pages.
        </p>
      </div>
    </div>
  );
}

// ───────────────────── Step 7: Activation Rules ─────────────────────

function StepActivationRules({ data, update }: { data: CitySetupData; update: (u: Partial<CitySetupData>) => void }) {
  const mpRules = data.makingProgressRules;
  const aRules = data.activeRules;
  const includedAreas = data.localAreas.filter((a) => a.included);
  const confirmedStreets = data.highStreets.filter((hs) => hs.confirmed);

  const updateMPRule = (id: string, updates: Partial<ActivationRule>) => {
    update({ makingProgressRules: mpRules.map((r) => (r.id === id ? { ...r, ...updates } : r)) });
  };
  const updateARule = (id: string, updates: Partial<ActivationRule>) => {
    update({ activeRules: aRules.map((r) => (r.id === id ? { ...r, ...updates } : r)) });
  };

  const renderRuleCard = (
    rule: ActivationRule,
    updateFn: (id: string, u: Partial<ActivationRule>) => void,
    color: "amber" | "green",
  ) => {
    const borderOn = color === "amber" ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50";
    const borderOff = "border-gray-200 bg-gray-50";
    const toggleOn = color === "amber" ? "bg-amber-600" : "bg-green-600";
    const labelOn = color === "amber" ? "text-amber-800" : "text-green-800";
    const inputBorder = color === "amber" ? "border-amber-300" : "border-green-300";
    const inputFocus = color === "amber" ? "focus:border-amber-500 focus:ring-amber-500" : "focus:border-green-500 focus:ring-green-500";

    return (
      <div className={`rounded-lg border p-4 transition-colors ${rule.enabled ? borderOn : borderOff}`}>
        {/* Row 1: toggle + label + threshold + unit */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => updateFn(rule.id, { enabled: !rule.enabled })}
              className={`relative h-6 w-11 rounded-full shrink-0 transition-colors ${rule.enabled ? toggleOn : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${rule.enabled ? "translate-x-[22px]" : ""}`} />
            </button>
            <span className={`text-sm font-medium truncate ${rule.enabled ? "text-gray-900" : "text-gray-500"}`}>
              {rule.label}
            </span>
          </div>

          {rule.enabled && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-gray-500">≥</span>
              <input
                type="number"
                value={rule.threshold}
                onChange={(e) => updateFn(rule.id, { threshold: parseInt(e.target.value) || 0 })}
                className={`w-14 rounded border ${inputBorder} bg-white px-2 py-1 text-sm text-center font-bold ${labelOn} ${inputFocus}`}
              />
              <span className="text-sm text-gray-500">{rule.unit === "%" ? "%" : rule.unit}</span>
            </div>
          )}
        </div>

        {/* Row 2: audience + separate thresholds */}
        {rule.enabled && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Activity applies to:</span>
            {(["all", "business", "consumer"] as const).map((a) => (
              <button
                key={a}
                onClick={() => updateFn(rule.id, { audience: a })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  rule.audience === a
                    ? color === "amber"
                      ? "bg-amber-600 text-white"
                      : "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {a === "all" ? "All" : a === "business" ? "Business" : "Consumer"}
              </button>
            ))}

            {rule.audience === "all" && (
              <div className="flex items-center gap-2 ml-2 text-xs text-gray-500">
                <span>Business threshold:</span>
                <input
                  type="number"
                  value={rule.businessThreshold ?? rule.threshold}
                  onChange={(e) => updateFn(rule.id, { businessThreshold: parseInt(e.target.value) || 0 })}
                  className={`w-12 rounded border ${inputBorder} bg-white px-1.5 py-0.5 text-center text-xs font-bold ${labelOn} ${inputFocus}`}
                />
                <span>{rule.unit === "%" ? "%" : rule.unit}</span>
                <span className="ml-1">Consumer threshold:</span>
                <input
                  type="number"
                  value={rule.consumerThreshold ?? rule.threshold}
                  onChange={(e) => updateFn(rule.id, { consumerThreshold: parseInt(e.target.value) || 0 })}
                  className={`w-12 rounded border ${inputBorder} bg-white px-1.5 py-0.5 text-center text-xs font-bold ${labelOn} ${inputFocus}`}
                />
                <span>{rule.unit === "%" ? "%" : rule.unit}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Helper to render a rule section ──
  const renderRuleSection = (
    title: string,
    rules: ActivationRule[],
    updateFn: (id: string, u: Partial<ActivationRule>) => void,
    logic: "AND" | "OR",
    onLogicChange: (l: "AND" | "OR") => void,
    color: "amber" | "green",
    statusLabel: string,
    statusBg: string,
    statusBorder: string,
    statusText: string,
    description: string,
  ) => {
    const enabledRules = rules.filter((r) => r.enabled);
    const lastEnabledIdx = rules.map((r, i) => (r.enabled ? i : -1)).filter((i) => i >= 0).pop() ?? -1;

    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Section header */}
        <div className={`flex items-center justify-between px-5 py-4 ${statusBg} border-b ${statusBorder}`}>
          <div>
            <div className={`text-xs font-bold ${statusText}`}>{statusLabel}</div>
            <div className="text-sm font-semibold text-gray-800">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Combine rules:</span>
            <button
              onClick={() => onLogicChange("AND")}
              className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                logic === "AND" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              AND
            </button>
            <button
              onClick={() => onLogicChange("OR")}
              className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                logic === "OR" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              OR
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-gray-500">{description}</p>
        </div>

        {/* Rules */}
        <div className="space-y-3 px-5 pb-5">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="relative">
              {idx < lastEnabledIdx && rule.enabled && (
                <div className="absolute -bottom-2 left-6 z-10">
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                    logic === "AND" ? "bg-gray-200 text-gray-600" : "bg-primary-100 text-primary-600"
                  }`}>
                    {logic}
                  </span>
                </div>
              )}
              {renderRuleCard(rule, updateFn, color)}
            </div>
          ))}
        </div>

        {/* Resulting rule summary */}
        {enabledRules.length > 0 && (
          <div className={`mx-5 mb-5 rounded-lg border ${statusBorder} ${statusBg} p-3`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Resulting Rule</div>
            <div className="text-sm text-gray-700">
              {enabledRules.map((r, i) => {
                const unitLabel = r.unit === "%" ? "%" : "count";
                const audienceLabel = r.audience === "all" ? "" : ` (${r.audience})`;
                return (
                  <span key={r.id}>
                    {i > 0 && (
                      <span className={`mx-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        logic === "AND" ? "bg-gray-200 text-gray-600" : "bg-primary-100 text-primary-600"
                      }`}>
                        {logic}
                      </span>
                    )}
                    <span className="font-medium">{r.label}</span>
                    <span className="text-gray-500"> ≥ </span>
                    <span className="font-bold">{r.threshold}{unitLabel}</span>
                    {audienceLabel && <span className="text-gray-400 text-xs">{audienceLabel}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {enabledRules.length === 0 && (
          <div className="mx-5 mb-5 rounded-lg border border-dashed border-gray-300 p-3 text-center text-xs text-gray-400">
            No conditions enabled — toggle at least one to define this transition.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Activation Rules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure the rules that determine when {data.cityName} transitions from Inactive → Making Progress → Active.
        </p>
      </div>

      {/* ── Three-State Flow Visualization ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Status Flow</div>
        <div className="flex items-center justify-between gap-3">
          {/* INACTIVE */}
          <div className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 mx-auto mb-2">
              <AlertCircle className="h-6 w-6 text-gray-500" />
            </div>
            <div className="text-sm font-bold text-gray-700">Inactive</div>
            <div className="text-[10px] text-gray-400 mt-1">City hub not yet active</div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <ChevronRight className="h-5 w-5 text-amber-400 rotate-0" />
            <span className="text-[9px] font-bold text-amber-500">RULES</span>
          </div>

          {/* MAKING PROGRESS */}
          <div className="flex-1 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200 mx-auto mb-2">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-sm font-bold text-amber-700">Making Progress</div>
            <div className="text-[10px] text-amber-500 mt-1">
              {mpRules.filter((r) => r.enabled).length} condition{mpRules.filter((r) => r.enabled).length !== 1 ? "s" : ""} configured
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <ChevronRight className="h-5 w-5 text-green-400 rotate-0" />
            <span className="text-[9px] font-bold text-green-500">RULES</span>
          </div>

          {/* ACTIVE */}
          <div className="flex-1 rounded-lg border-2 border-green-300 bg-green-50 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-200 mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm font-bold text-green-700">Active</div>
            <div className="text-[10px] text-green-500 mt-1">
              {aRules.filter((r) => r.enabled).length} condition{aRules.filter((r) => r.enabled).length !== 1 ? "s" : ""} configured
            </div>
          </div>
        </div>
      </div>

      {/* ── Making Progress Rules ── */}
      {renderRuleSection(
        "Making Progress",
        mpRules,
        updateMPRule,
        data.makingProgressLogic,
        (l) => update({ makingProgressLogic: l }),
        "amber",
        "MAKING PROGRESS",
        "bg-amber-50",
        "border-amber-200",
        "text-amber-600",
        "Define what must happen before this City Hub is considered to be making progress.",
      )}

      {/* ── Active Rules ── */}
      {renderRuleSection(
        "Active",
        aRules,
        updateARule,
        data.activeLogic,
        (l) => update({ activeLogic: l }),
        "green",
        "ACTIVE",
        "bg-green-50",
        "border-green-200",
        "text-green-600",
        "City becomes ACTIVE when all enabled conditions below are met.",
      )}

      {/* ── Live Data Summary ── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-700">Live Data Summary</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-xs text-blue-700">
          <div>
            <span className="text-blue-500">Local Areas:</span>{" "}
            <span className="font-bold">{includedAreas.length}</span>
          </div>
          <div>
            <span className="text-blue-500">High Streets:</span>{" "}
            <span className="font-bold">{confirmedStreets.length}</span>
          </div>
          <div>
            <span className="text-blue-500">Total Areas:</span>{" "}
            <span className="font-bold">{data.localAreas.length}</span>
          </div>
          <div>
            <span className="text-blue-500">Total Streets:</span>{" "}
            <span className="font-bold">{data.highStreets.length}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            These are configurable thresholds. You can adjust them at any time from the city management page.
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Step 6: Review & Activate ─────────────────────

function StepReview({ data }: { data: CitySetupData }) {
  const includedAreas = data.localAreas.filter((a) => a.included);
  const confirmedStreets = data.highStreets.filter((hs) => hs.confirmed);
  const mpEnabled = data.makingProgressRules.filter((r) => r.enabled);
  const aEnabled = data.activeRules.filter((r) => r.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review the configuration for {data.cityName} before creating the City Hub.
        </p>
      </div>

      {/* ── City ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">City</h4>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {data.cityName?.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{data.cityName || "—"}</div>
            <div className="text-sm text-gray-500">{data.region} · {data.country}</div>
          </div>
        </div>
      </div>

      {/* ── Current Season ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Current Season</h4>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
            {data.currentSeason || "—"}
          </span>
        </div>
      </div>

      {/* ── Coverage ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Coverage</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">City boundary</span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-green-700">
              <Check className="h-4 w-4 text-green-500" />
              Confirmed
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">Local Areas</span>
            <span className="text-sm font-bold text-gray-900">{includedAreas.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">High Streets</span>
            <span className="text-sm font-bold text-gray-900">{confirmedStreets.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">Campaigns</span>
            <span className="text-sm font-bold text-gray-900">0</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Campaigns are created separately and attached after the City Hub is active.
        </p>
      </div>

      {/* ── Activation Rules ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Activation Rules</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-bold text-amber-600 mb-1">Making Progress</div>
            <div className="flex items-center gap-2">
              {mpEnabled.length > 0 ? (
                <>
                  <span className="text-sm font-bold text-amber-800">Configured</span>
                  <Check className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <span className="text-sm text-amber-700">Not configured</span>
              )}
            </div>
            <div className="mt-1 text-[10px] text-amber-500">
              {mpEnabled.length} condition{mpEnabled.length !== 1 ? "s" : ""} · {data.makingProgressLogic}
            </div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-xs font-bold text-green-600 mb-1">Active</div>
            <div className="flex items-center gap-2">
              {aEnabled.length > 0 ? (
                <>
                  <span className="text-sm font-bold text-green-800">Configured</span>
                  <Check className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <span className="text-sm text-green-700">Not configured</span>
              )}
            </div>
            <div className="mt-1 text-[10px] text-green-500">
              {aEnabled.length} condition{aEnabled.length !== 1 ? "s" : ""} · {data.activeLogic}
            </div>
          </div>
        </div>
      </div>

      {/* ── Current Status ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Current Status</h4>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm font-bold text-gray-600">
            INACTIVE
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Creating the City Hub does not automatically make the City Active. No qualifying campaign activity exists yet.
        </p>
      </div>
    </div>
  );
}
