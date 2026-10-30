// =============================================================================
// AdminCampaignWizard — Campaign Creation/Editing Wizard
// Orchestrates the 25-step guided wizard for creating and editing campaigns.
// Uses WizardShell for navigation and delegates to individual step components.
// =============================================================================

import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLocationTree } from "@/hooks/useLocationTree";
import { useAdminSeasons } from "@/services/admin/hook";
import { adminApi } from "@/services/admin";
import {
  WIZARD_STEPS,
  createDefaultWizardData,
  validateStep,
  type CampaignWizardData,
  type CampaignReward,
  type ContributionType,
  type StepId,
  type StretchTarget,
  type LeaderboardPrize,
} from "@/types/campaign-wizard";
import {
  fulfilmentKindLabel,
  isCentralFulfilmentKind,
} from "@/types/rewards";
import type { McomCatalogueReward } from "@/services/admin/type";
import {
  Search,
  CheckCircle,
  ChevronDown,
  Plus,
  MapPin,
  Building2,
  X,
  Upload,
  Download,
  Globe,
  Target,
  Trash2,
  Info,
  Users,
  User,
  Wallet,
  Award,
  Crown,
  Trophy,
  Medal,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";
import { WizardShell } from "./WizardShell";
import { FileUpload } from "@/components/ui/FileUpload";

// ── Shared Types ──

interface StepProps {
  formData: CampaignWizardData;
  onUpdate: (updates: Partial<CampaignWizardData>) => void;
  onNavigateToStep?: (stepId: StepId) => void;
  onSubmit?: () => void;
  fieldErrors?: Record<string, string>;
  published?: boolean;
}

// ── Validation Helpers ──

function formatAmount(value: string | number | undefined): string {
  if (!value && value !== 0) return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("en-GB");
}

function parseAmountInput(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function fieldErrorClass(fieldName: string, fieldErrors?: Record<string, string>): string {
  return fieldErrors?.[fieldName]
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50"
    : "border-slate-300 focus:border-amber-500 focus:ring-amber-500/20";
}

function FieldError({ name, fieldErrors }: { name: string; fieldErrors?: Record<string, string> }) {
  const msg = fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {msg}
    </p>
  );
}

function RequiredLabel({ label, name, fieldErrors }: { label: string; name: string; fieldErrors?: Record<string, string> }) {
  const hasError = !!fieldErrors?.[name];
  return (
    <label className={`block text-sm font-medium mb-1.5 ${hasError ? "text-red-600" : "text-slate-700"}`}>
      {label}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

// ── Campaign Type Options ──

const SCOPE_OPTIONS = [
  {
    value: "city" as const,
    icon: Building2,
    label: "City Campaign",
    description:
      "A campaign created to serve a particular city, with the option to include its local areas, boroughs, districts or high streets.",
    triggers: [
      "Show the city selection field.",
      "Allow Admin to select the city the campaign belongs to.",
      "Allow Admin to select applicable local areas, boroughs, districts or high streets, where needed.",
      "Associate the campaign with the selected locations.",
    ],
    locationRequired: "Yes — a city must be selected.",
  },
  {
    value: "independent" as const,
    icon: MapPin,
    label: "Independent Campaign",
    description:
      "A campaign that is not tied to a particular city or local area and can operate independently of the location hierarchy.",
    triggers: [
      "Skip the city and local-area selection steps.",
      "Allow Admin to configure the campaign without assigning it to a geographical location.",
      "Continue to the other campaign settings, such as audience, funding and access requirements.",
    ],
    locationRequired: "No.",
  },
];

// ── Category & Season Options ──

const CATEGORIES = [
  { value: "community", label: "Community" },
  { value: "environment", label: "Environment" },
  { value: "education", label: "Education" },
  { value: "arts", label: "Arts & Culture" },
  { value: "health", label: "Health & Wellbeing" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business & Enterprise" },
  { value: "youth", label: "Youth" },
];


const OBJECTIVE_OPTIONS = [
  { value: "raise_funds", label: "Raise Funds", description: "Collect financial contributions for a project or cause." },
  { value: "community_engagement", label: "Community Engagement", description: "Build community involvement and participation." },
  { value: "business_support", label: "Business Support", description: "Support local businesses and economic growth." },
  { value: "awareness", label: "Awareness", description: "Raise awareness for a cause or initiative." },
  { value: "events", label: "Events", description: "Fund and promote community events." },
];

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1 — Campaign Type (City Campaign / Independent Campaign)
// ═══════════════════════════════════════════════════════════════════════════

function StepScope({ formData, onUpdate, fieldErrors }: StepProps) {
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const { tree } = useLocationTree();

  const cities = tree?.cities || [];
  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );

  const handleCitySelect = (city: { id: string; name: string; slug: string }) => {
    onUpdate({
      cityName: city.name,
      citySlug: city.slug,
      cityId: city.id,
    });
    setCityDropdownOpen(false);
    setCitySearch("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Type</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose how this campaign is set up — tied to a city, or independent of the location hierarchy.
        </p>
      </div>

      {/* Campaign Type Cards */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${fieldErrors?.scope ? "ring-2 ring-red-500 rounded-xl p-1" : ""}`}>
        {SCOPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = formData.scope === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({
                scope: opt.value,
                // Independent campaigns have no location dependency — reset coverage
                ...(opt.value === "independent"
                  ? {
                      locationCoverage: createDefaultWizardData().locationCoverage,
                      cityId: "",
                      citySlug: "",
                      cityName: "",
                    }
                  : {}),
              })}
              className={`flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex w-full items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                  <span className="mt-1 block text-xs text-gray-500">{opt.description}</span>
                </div>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary-500" />
                )}
              </div>

              <div className="w-full rounded-lg border border-gray-100 bg-white/80 p-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  What it triggers
                </span>
                <ul className="mt-1.5 space-y-1">
                  {opt.triggers.map((trigger) => (
                    <li key={trigger} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-secondary-500" aria-hidden="true" />
                      {trigger}
                    </li>
                  ))}
                </ul>
                <span className="mt-2.5 inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-700">
                  Location required: {opt.locationRequired}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <FieldError name="scope" fieldErrors={fieldErrors} />

      {/* City Selector — shown only when scope = city */}
      {formData.scope === "city" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select City</label>

          {/* Dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition-colors ${fieldErrorClass("citySlug", fieldErrors)} hover:border-gray-400 focus:ring-1 focus:ring-primary-500`}
            >
              {formData.cityName ? (
                <span className="text-gray-900 font-medium">{formData.cityName}</span>
              ) : (
                <span className="text-gray-400">Select a city...</span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  cityDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                {/* Search input */}
                <div className="border-b border-gray-100 p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search cities..."
                      className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* City list */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredCities.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      No cities found
                    </div>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          formData.citySlug === city.slug
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {formData.citySlug === city.slug && (
                          <CheckCircle className="h-4 w-4 text-primary-500" />
                        )}
                        {city.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirmation message */}
          {formData.cityName && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p className="text-sm text-green-700">
                This campaign will operate within{" "}
                <strong>{formData.cityName}</strong>. You can choose which
                Local Areas and High Streets currently have access to
                the campaign in the next step.
              </p>
            </div>
          )}
          <FieldError name="citySlug" fieldErrors={fieldErrors} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 — Location Coverage (Multi-City)
// ═══════════════════════════════════════════════════════════════════════════

function StepLocations({ formData, onUpdate, fieldErrors }: StepProps) {
  const loc = useLocationTree(formData.locationCoverage);
  const [importText, setImportText] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; skipped: number; errors: string[] } | null>(null);
  const [expandedCityId, setExpandedCityId] = useState<string | null>(null);

  useEffect(() => {
    onUpdate({ locationCoverage: loc.coverage });
  }, [loc.coverage, onUpdate]);

  const handleImport = () => {
    const result = loc.importLocations(importText);
    setImportResult(result);
    if (result.success) {
      setImportText("");
      setTimeout(() => setImportResult(null), 4000);
    }
  };

  const handleExport = () => {
    const summary = loc.getSummary();
    const lines: string[] = ["City,Local Area,High Street,Business"];
    for (const city of summary.cities) {
      for (const area of city.areas) {
        for (const street of area.streets) {
          if (street.businesses.length > 0) {
            for (const biz of street.businesses) {
              lines.push(`${city.name},${area.name},${street.name},${biz.name}`);
            }
          } else {
            lines.push(`${city.name},${area.name},${street.name},`);
          }
        }
        if (area.streets.length === 0) {
          lines.push(`${city.name},${area.name},,`);
        }
      }
      if (city.areas.length === 0) {
        lines.push(`${city.name},,,`);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign-locations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loc.loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
          <p className="mt-1 text-sm text-gray-500">Loading location data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (loc.error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
          <p className="mt-1 text-sm text-gray-500">Where should this campaign be available?</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{loc.error}</p>
          <button
            type="button"
            onClick={loc.refresh}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tree = loc.tree;
  const summary = loc.getSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select which cities, local areas, high streets, and businesses this campaign covers.
        </p>
      </div>

      <FieldError name="locations" fieldErrors={fieldErrors} />

      {/* ── National Toggle ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              loc.coverage.includeNational ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">United Kingdom (National)</span>
              <span className="mt-0.5 block text-xs text-gray-500">Include all cities, areas, and high streets nationwide.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loc.toggleNational}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              loc.coverage.includeNational ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                loc.coverage.includeNational ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {loc.coverage.includeNational && (
          <div className="mt-3 rounded-lg bg-primary-50 p-3">
            <p className="text-xs text-primary-700">
              National coverage is enabled. All locations are included automatically.
            </p>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      {!loc.coverage.includeNational && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={loc.searchQuery}
              onChange={(e) => loc.setSearchQuery(e.target.value)}
              placeholder="Search cities, local areas, high streets, or businesses..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {loc.searchQuery && (
              <button
                type="button"
                onClick={() => loc.setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {loc.searchResults.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
              {loc.searchResults.map((result) => {
                const typeLabel = result.type === "city" ? "City" : result.type === "local_area" ? "Local Area" : result.type === "high_street" ? "High Street" : "Business";
                const typeColor = result.type === "city" ? "bg-blue-100 text-blue-700" : result.type === "local_area" ? "bg-green-100 text-green-700" : result.type === "high_street" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700";
                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                        {typeLabel}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{result.name}</span>
                      {result.fullPath && (
                        <span className="text-xs text-gray-400">{result.fullPath}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── City Selection ── */}
      {!loc.coverage.includeNational && tree && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Cities</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {loc.selectedCityCount} of {loc.totalCityCount} selected
              </span>
              <button
                type="button"
                onClick={loc.selectAllCities}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={loc.clearAllCities}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {tree.cities.map((city) => {
              const citySelected = loc.coverage.selectedCities.includes(city.id);
              const isExpanded = expandedCityId === city.id;
              const cityAreas = city.localAreas;
              const selectedAreaCount = cityAreas.filter((a) => loc.coverage.selectedLocalAreas.includes(a.id)).length;

              return (
                <div
                  key={city.id}
                  className={`rounded-lg border transition-colors ${
                    citySelected
                      ? "border-primary-200 bg-primary-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="flex cursor-pointer items-center gap-3 px-4 py-3"
                    onClick={() => loc.toggleCity(city)}
                  >
                    <input
                      type="checkbox"
                      checked={citySelected}
                      onChange={() => loc.toggleCity(city)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 text-sm font-medium text-gray-900">{city.name}</span>
                    <span className="text-xs text-gray-500">
                      {cityAreas.length} area{cityAreas.length !== 1 && "s"}
                      {citySelected && selectedAreaCount > 0 && (
                        <> &middot; {selectedAreaCount} selected</>
                      )}
                    </span>
                    {citySelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCityId(isExpanded ? null : city.id);
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* Expanded: Local Areas for this city */}
                  {citySelected && isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Local Areas</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => loc.selectAllLocalAreas(city.id)}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => loc.clearAllLocalAreas(city.id)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {cityAreas.map((area) => {
                          const areaSelected = loc.coverage.selectedLocalAreas.includes(area.id);
                          const selectedStreetCount = area.highStreets.filter(
                            (s) => loc.coverage.selectedHighStreets.includes(s.id),
                          ).length;

                          return (
                            <div
                              key={area.id}
                              className={`rounded-lg border transition-colors ${
                                areaSelected
                                  ? "border-primary-200 bg-white"
                                  : "border-gray-100"
                              }`}
                            >
                              <div
                                className="flex cursor-pointer items-center gap-3 px-3 py-2"
                                onClick={() => loc.toggleLocalArea(area)}
                              >
                                <input
                                  type="checkbox"
                                  checked={areaSelected}
                                  onChange={() => loc.toggleLocalArea(area)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="flex-1 text-sm text-gray-700">{area.name}</span>
                                <span className="text-xs text-gray-400">
                                  {area.highStreets.length} street{area.highStreets.length !== 1 && "s"}
                                  {areaSelected && selectedStreetCount > 0 && (
                                    <> &middot; {selectedStreetCount} selected</>
                                  )}
                                </span>
                              </div>

                              {/* High Streets within this area */}
                              {areaSelected && (
                                <div className="border-t border-gray-100 px-3 py-2">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-gray-500">High Streets</span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => loc.selectAllHighStreets(area.id)}
                                        className="text-xs text-primary-600 hover:text-primary-700"
                                      >
                                        All
                                      </button>
                                      <span className="text-gray-300">|</span>
                                      <button
                                        type="button"
                                        onClick={() => loc.clearAllHighStreets(area.id)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                      >
                                        None
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5">
                                    {area.highStreets.map((street) => {
                                      const streetSelected = loc.coverage.selectedHighStreets.includes(street.id);
                                      return (
                                        <button
                                          key={street.id}
                                          type="button"
                                          onClick={() => loc.toggleHighStreet(street)}
                                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                                            streetSelected
                                              ? "border-primary-200 bg-primary-50 text-primary-700"
                                              : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                                          }`}
                                        >
                                          {streetSelected ? (
                                            <CheckCircle className="h-3 w-3 text-primary-500" />
                                          ) : (
                                            <X className="h-3 w-3 text-gray-400" />
                                          )}
                                          {street.name}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Businesses within streets */}
                                  {area.highStreets.some((s) => loc.coverage.selectedHighStreets.includes(s.id)) && (
                                    <div className="mt-2 space-y-1.5 border-t border-gray-50 pt-2">
                                      {area.highStreets
                                        .filter((s) => loc.coverage.selectedHighStreets.includes(s.id))
                                        .map((street) => (
                                          <div key={street.id}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs text-gray-400">{street.name}</span>
                                              {street.businesses.length > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                  <button
                                                    type="button"
                                                    onClick={() => loc.selectAllBusinesses(street.id)}
                                                    className="text-xs text-primary-600 hover:text-primary-700"
                                                  >
                                                    All
                                                  </button>
                                                  <span className="text-gray-300">|</span>
                                                  <button
                                                    type="button"
                                                    onClick={() => loc.clearAllBusinesses(street.id)}
                                                    className="text-xs text-gray-500 hover:text-gray-700"
                                                  >
                                                    None
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                            {street.businesses.length > 0 ? (
                                              <div className="flex flex-wrap gap-1">
                                                {street.businesses.map((biz) => {
                                                  const bizSelected = loc.coverage.selectedBusinesses.includes(biz.id);
                                                  return (
                                                    <button
                                                      key={biz.id}
                                                      type="button"
                                                      onClick={() => loc.toggleBusiness(biz)}
                                                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs transition-colors ${
                                                        bizSelected
                                                          ? "border-purple-200 bg-purple-50 text-purple-700"
                                                          : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"
                                                      }`}
                                                    >
                                                      {biz.name}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-400 italic">No businesses listed</p>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Import / Export / Remove Actions ── */}
      {!loc.coverage.includeNational && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(!importOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            {(loc.selectedCityCount > 0 || loc.selectedLocalAreaCount > 0 || loc.selectedHighStreetCount > 0 || loc.selectedBusinessCount > 0) && (
              <button
                type="button"
                onClick={loc.removeSelected}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove All Selected
              </button>
            )}
          </div>

          {/* Import Panel */}
          {importOpen && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Paste CSV data (format: City,Local Area,High Street,Business)
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                placeholder={`Birmingham,Birmingham City Centre,New Street,Selfridges\nManchester,Manchester City Centre,Market Street,`}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => { setImportOpen(false); setImportText(""); setImportResult(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              {importResult && (
                <div className={`mt-3 rounded-lg p-3 text-sm ${importResult.success ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  <p>Imported: {importResult.imported} &middot; Skipped: {importResult.skipped}</p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-xs">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Coverage Summary ── */}
      {!loc.coverage.includeNational && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Coverage Summary</h3>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <div className="text-2xl font-bold text-primary-700">{loc.selectedCityCount}</div>
              <div className="text-xs text-primary-600">Cities</div>
            </div>
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <div className="text-2xl font-bold text-primary-700">{loc.selectedLocalAreaCount}</div>
              <div className="text-xs text-primary-600">Local Areas</div>
            </div>
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <div className="text-2xl font-bold text-primary-700">{loc.selectedHighStreetCount}</div>
              <div className="text-xs text-primary-600">High Streets</div>
            </div>
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <div className="text-2xl font-bold text-primary-700">{loc.selectedBusinessCount}</div>
              <div className="text-xs text-primary-600">Businesses</div>
            </div>
          </div>

          {/* Visual tree */}
          {summary.cities.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              {summary.cities.map((city) => (
                <div key={city.id} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4" />
                    {city.name}
                  </div>
                  {city.areas.length > 0 && (
                    <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                      {city.areas.map((area) => (
                        <div key={area.id}>
                          <div className="flex items-center gap-2 py-0.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-sm text-gray-700">{area.name}</span>
                          </div>
                          {area.streets.length > 0 && (
                            <div className="ml-5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                              {area.streets.map((street) => (
                                <div key={street.id}>
                                  <div className="flex items-center gap-2 py-0.5">
                                    <CheckCircle className="h-3 w-3 text-green-400" />
                                    <span className="text-xs text-gray-600">{street.name}</span>
                                  </div>
                                  {street.businesses.length > 0 && (
                                    <div className="ml-4 space-y-0.5 border-l border-gray-100 pl-2">
                                      {street.businesses.map((biz) => (
                                        <div key={biz.id} className="flex items-center gap-1.5 py-0.5">
                                          <CheckCircle className="h-2.5 w-2.5 text-purple-400" />
                                          <span className="text-xs text-gray-500">{biz.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {summary.cities.length === 0 && (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
              No locations selected yet. Use the city list above to select locations.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4 — Season & Programme
// ═══════════════════════════════════════════════════════════════════════════

function StepSeason({ formData, onUpdate }: StepProps) {
  const { data: seasonsData, isLoading: seasonsLoading, error: seasonsError } = useAdminSeasons({ limit: 100 });

  const dbSeasons = useMemo(() => {
    return (seasonsData?.items || []).map((s) => ({
      value: s.id,
      label: s.name,
      status: s.status,
      startDate: s.startDate ? new Date(s.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBD",
      endDate: s.endDate ? new Date(s.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBD",
      description: s.description,
    }));
  }, [seasonsData]);

  const toggleSeason = (seasonValue: string) => {
    const current = formData.seasonIds || [];
    const updated = current.includes(seasonValue)
      ? current.filter((s) => s !== seasonValue)
      : [...current, seasonValue];
    onUpdate({ seasonIds: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Season & Programme</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select which seasons this campaign runs in and provide a programme name.
        </p>
      </div>

      {/* Seasons Multi-Select */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Campaign Seasons</h3>
            <p className="text-xs text-gray-500">
              Choose one or more database seasons when this campaign will be active.
            </p>
          </div>
          <Link
            to="/admin/seasons/new"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            + Create Season
          </Link>
        </div>

        {seasonsLoading ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Loading seasons from database...
          </div>
        ) : seasonsError ? (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
            Failed to load seasons from database.
          </div>
        ) : dbSeasons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-xs text-gray-500 mb-2">No activation seasons found in database.</p>
            <Link
              to="/admin/seasons/new"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              + Create First Season
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {dbSeasons.map((season) => {
              const isSelected = (formData.seasonIds || []).includes(season.value);
              return (
                <button
                  key={season.value}
                  type="button"
                  onClick={() => toggleSeason(season.value)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                      isSelected
                        ? "border-primary-600 bg-primary-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="block text-sm font-semibold text-gray-900">{season.label}</span>
                      <span className={`inline-flex rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                        season.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {season.status}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {season.startDate} — {season.endDate}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {(formData.seasonIds || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(formData.seasonIds || []).map((s) => {
              const season = dbSeasons.find((se) => se.value === s);
              return season ? (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700"
                >
                  {season.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSeason(s);
                    }}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Programme Name */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Programme Name</h3>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Programme
        </label>
        <input
          type="text"
          value={formData.programmeName || ""}
          onChange={(e) => onUpdate({ programmeName: e.target.value })}
          placeholder="e.g. High Street Revival, Community First"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <p className="mt-2 text-xs text-gray-500">
          Optional. If your campaign is part of a larger programme, enter it here.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5 — Campaign Details
// ═══════════════════════════════════════════════════════════════════════════

function StepDetails({ formData, onUpdate, fieldErrors }: StepProps) {
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const generateCode = (citySlug?: string) => {
    const prefix = citySlug ? citySlug.substring(0, 3).toUpperCase() : "CAM";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${suffix}`;
  };

  useEffect(() => {
    if (!formData.campaignCode) {
      onUpdate({ campaignCode: generateCode(formData.citySlug) });
    }
  }, []);

  const filteredCategories = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const handleNameChange = (name: string) => {
    onUpdate({ title: name });
  };

  const addCategory = (value: string) => {
    onUpdate({ categoryId: value });
    setCategorySearch("");
    setShowCategoryDropdown(false);
  };

  const removeCategory = () => {
    onUpdate({ categoryId: "" });
  };

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      const slug = customCategory
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      addCategory(slug);
      setCustomCategory("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Give your campaign a name, description, category, and media.
        </p>
      </div>

      {/* Name & Code */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Identity</h3>
        <div>
          <RequiredLabel label="Campaign Name" name="title" fieldErrors={fieldErrors} />
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Birmingham Community Fund"
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${fieldErrorClass("title", fieldErrors)}`}
          />
          <FieldError name="title" fieldErrors={fieldErrors} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Campaign Code <span className="text-gray-400 font-normal">(auto-generated from city)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">/campaign/</span>
            <input
              type="text"
              value={formData.campaignCode || ""}
              onChange={(e) => onUpdate({ campaignCode: e.target.value })}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-mono focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => onUpdate({ campaignCode: generateCode(formData.citySlug) })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Short Description */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <RequiredLabel label="Short Description" name="shortDescription" fieldErrors={fieldErrors} />
        <textarea
          value={formData.shortDescription || ""}
          onChange={(e) => onUpdate({ shortDescription: e.target.value })}
          rows={2}
          maxLength={160}
          placeholder="A brief one-liner for the campaign card (max 160 characters)"
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${fieldErrorClass("shortDescription", fieldErrors)}`}
        />
        <FieldError name="shortDescription" fieldErrors={fieldErrors} />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {(formData.shortDescription || "").length}/160
        </p>
      </div>

      {/* Full Description */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Full Description</h3>
        <textarea
          value={formData.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={6}
          placeholder="Describe the campaign in detail. What is it about? Who does it help?"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Categories */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
        <p className="text-xs text-gray-500 mb-3">
          Select or add categories to help users find your campaign.
        </p>

        {/* Selected Categories */}
        {formData.categoryId && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(() => {
              const catOption = CATEGORIES.find((c) => c.value === formData.categoryId);
              return catOption ? (
                <span
                  key={formData.categoryId}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700"
                >
                  {catOption.label}
                  <button
                    type="button"
                    onClick={() => removeCategory()}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })()}
          </div>
        )}

        {/* Category Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setShowCategoryDropdown(true);
            }}
            onFocus={() => setShowCategoryDropdown(true)}
            onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          {showCategoryDropdown && categorySearch && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="max-h-48 overflow-y-auto py-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addCategory(cat.value)}
                      className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="mr-2 h-3.5 w-3.5 text-gray-400" />
                      {cat.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No matching categories</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Custom Category */}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomCategory();
              }
            }}
            placeholder="Add a custom category..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={addCustomCategory}
            disabled={!customCategory.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Media Upload / Link */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Media</h3>
        <p className="text-xs text-gray-500 mb-3">
          Add an image or video for the campaign banner.
        </p>
        <FileUpload
          value={formData.featuredImage || ""}
          onChange={(url) => {
            onUpdate({ featuredImage: url });
          }}
          label="Campaign Image / Video"
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6 — Campaign Objective
// ═══════════════════════════════════════════════════════════════════════════

function StepObjective({ formData, onUpdate, fieldErrors }: StepProps) {
  const CUSTOM_OBJECTIVES = [
    { value: "activate_city", label: "Activate City", description: "Bring new life and activity to the city centre." },
    { value: "fund_hub", label: "Fund Hub", description: "Create or fund a central community hub." },
    { value: "fund_local_area", label: "Fund Local Area", description: "Support a specific neighbourhood or district." },
    { value: "support_high_street", label: "Support High Street", description: "Help local high street businesses and traders." },
    { value: "fund_business", label: "Fund Business", description: "Provide grants or funding for local enterprises." },
    { value: "community_event", label: "Community Event", description: "Organise and fund community gatherings." },
    { value: "mcom_infrastructure", label: "M-Com Infrastructure", description: "Build infrastructure for mobile commerce." },
    { value: "business_expansion", label: "Business Expansion", description: "Help existing businesses grow and expand." },
    { value: "other", label: "Other", description: "A custom objective not listed above." },
  ];

  const allObjectives = [...OBJECTIVE_OPTIONS, ...CUSTOM_OBJECTIVES];

  const handleSelect = (value: string) => {
    onUpdate({ objective: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Objective</h2>
        <p className="mt-1 text-sm text-gray-500">
          What is the primary purpose of this campaign?
        </p>
      </div>

      {/* Objective Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Primary Objective *</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allObjectives.map((opt) => {
            const isSelected = formData.objective === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? "border-primary-600 bg-primary-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{opt.description}</span>
                </div>
                {isSelected && (
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Objective Details */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <RequiredLabel label="Objective Details" name="objective" fieldErrors={fieldErrors} />
        <p className="text-xs text-gray-500 mb-3">
          Provide more details about the selected objective.
        </p>
        <textarea
          value={formData.objectiveDetails || ""}
          onChange={(e) => onUpdate({ objectiveDetails: e.target.value })}
          rows={4}
          placeholder="Describe how this campaign will achieve its objective..."
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${fieldErrorClass("objective", fieldErrors)}`}
        />
        <FieldError name="objective" fieldErrors={fieldErrors} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7 — Funding Target
// ═══════════════════════════════════════════════════════════════════════════

function StepTarget({ formData, onUpdate, fieldErrors }: StepProps) {
  const hasTarget = formData.hasTarget ?? true;
  const targets: StretchTarget[] = formData.stretchTargets || [];

  const updateTarget = (index: number, field: keyof StretchTarget, value: string) => {
    const updated = targets.map((t, i) =>
      i === index ? { ...t, [field]: value } : t,
    );
    onUpdate({ stretchTargets: updated });
  };

  const addTarget = () => {
    onUpdate({
      stretchTargets: [
        ...targets,
        { id: `st-${Date.now()}`, name: "", amount: "" },
      ],
    });
  };

  const removeTarget = (index: number) => {
    onUpdate({
      stretchTargets: targets.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Funding Target</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set a funding goal and optional stretch targets for your campaign.
        </p>
      </div>

      {/* Has Target Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              hasTarget ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Target className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Set Funding Target</span>
              <span className="mt-0.5 block text-xs text-gray-500">Enable a monetary goal for this campaign.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ hasTarget: !hasTarget })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              hasTarget ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hasTarget ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {hasTarget && (
        <>
          {/* Target Amount */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Target Amount</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal Amount (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.targetAmount ? formatAmount(formData.targetAmount) : ""}
                  onChange={(e) => onUpdate({ targetAmount: parseAmountInput(e.target.value) })}
                  placeholder="0"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${fieldErrorClass("targetAmount", fieldErrors)}`}
                />
              </div>
              <FieldError name="targetAmount" fieldErrors={fieldErrors} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Starting Amount (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.startingAmount ? formatAmount(formData.startingAmount) : ""}
                  onChange={(e) => onUpdate({ startingAmount: parseAmountInput(e.target.value) })}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The amount already raised or seeded before launch.
              </p>
            </div>
          </div>

          {/* Stretch Targets */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Stretch Targets</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Add milestone goals beyond the main target.
                </p>
              </div>
              <button
                type="button"
                onClick={addTarget}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {targets.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                No stretch targets added. Click "Add" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {targets.map((target, index) => (
                  <div
                    key={target.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <span className="mt-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={target.name}
                        onChange={(e) => updateTarget(index, "name", e.target.value)}
                        placeholder="Stretch target name"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={target.amount ? formatAmount(target.amount) : ""}
                          onChange={(e) => updateTarget(index, "amount", parseAmountInput(e.target.value))}
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTarget(index)}
                      className="mt-2 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 9 — Campaign Schedule / Dates
// ═══════════════════════════════════════════════════════════════════════════

function StepDates({ formData, onUpdate, fieldErrors }: StepProps) {
  const scheduleMode = formData.periodMode || "season";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Schedule</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define when your campaign runs. Choose a season, set custom dates, or make it evergreen.
        </p>
      </div>

      {/* Schedule Mode Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule Mode</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { value: "season" as const, label: "Season", description: "Tied to a season defined in Step 4." },
            { value: "custom" as const, label: "Custom Dates", description: "Set specific start and end dates." },
            { value: "evergreen" as const, label: "Evergreen", description: "Campaign runs indefinitely with no end date." },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ periodMode: opt.value, isEvergreen: opt.value === "evergreen" })}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                scheduleMode === opt.value
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  scheduleMode === opt.value
                    ? "border-primary-600 bg-primary-600"
                    : "border-gray-300"
                }`}
              >
                {scheduleMode === opt.value && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{opt.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dates Fields */}
      {scheduleMode === "custom" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Custom Date Range</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <RequiredLabel label="Start Date & Time" name="startDate" fieldErrors={fieldErrors} />
              <div
                className={`relative rounded-lg border bg-white cursor-pointer ${fieldErrorClass("startDate", fieldErrors)}`}
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                  if (input) input.showPicker?.();
                }}
              >
                <input
                  type="datetime-local"
                  value={formData.startDate || ""}
                  onChange={(e) => onUpdate({ startDate: e.target.value })}
                  className="w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm focus:ring-0"
                />
              </div>
              <FieldError name="startDate" fieldErrors={fieldErrors} />
            </div>
            <div>
              <RequiredLabel label="End Date & Time" name="endDate" fieldErrors={fieldErrors} />
              <div
                className={`relative rounded-lg border bg-white cursor-pointer ${fieldErrorClass("endDate", fieldErrors)}`}
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                  if (input) input.showPicker?.();
                }}
              >
                <input
                  type="datetime-local"
                  value={formData.endDate || ""}
                  onChange={(e) => onUpdate({ endDate: e.target.value })}
                  className="w-full rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm focus:ring-0"
                />
              </div>
              <FieldError name="endDate" fieldErrors={fieldErrors} />
            </div>
          </div>
        </div>
      )}

      {/* Evergreen Info */}
      {scheduleMode === "evergreen" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Evergreen Campaign</p>
              <p className="mt-1 text-xs text-blue-700">
                This campaign will run indefinitely with no set end date. It will remain active and
                accepting contributions until manually deactivated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Season Info */}
      {scheduleMode === "season" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Season-based Schedule</p>
              <p className="mt-1 text-xs text-gray-500">
                The campaign dates will be derived from the seasons selected in Step 4. If multiple
                seasons are selected, the campaign spans the earliest start to the latest end date.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 10 — Audience Selection
// ═══════════════════════════════════════════════════════════════════════════

function StepAudience({ formData, onUpdate, fieldErrors }: StepProps) {
  const audience = formData.audience || "both";

  const AUDIENCE_OPTIONS = [
    {
      value: "both" as const,
      label: "Both",
      description: "Campaign is visible to both business owners and consumers.",
      icon: Users,
    },
    {
      value: "business" as const,
      label: "Business Owner",
      description: "Campaign is only visible to registered business owners.",
      icon: Building2,
    },
    {
      value: "consumer" as const,
      label: "Consumer",
      description: "Campaign is only visible to general consumers.",
      icon: User,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Audience Selection</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose who can view and participate in this campaign.
        </p>
      </div>

      <FieldError name="audience" fieldErrors={fieldErrors} />

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${fieldErrors?.audience ? "rounded-xl border-2 border-red-500 p-1" : ""}`}>
        {AUDIENCE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = audience === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ audience: opt.value })}
              className={`flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isSelected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                <span className="mt-1 block text-xs text-gray-500">{opt.description}</span>
              </div>
              {isSelected && (
                <CheckCircle className="ml-auto h-5 w-5 text-primary-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 11 — Participation Methods
// ═══════════════════════════════════════════════════════════════════════════

function StepParticipation({ formData, onUpdate, fieldErrors }: StepProps) {
  const participation = formData.participation || {
    backCampaign: true,
    foundingMember: false,
    foundingMemberMonthly: false,
    donateContribute: true,
  };

  const toggleMethod = (key: keyof typeof participation) => {
    onUpdate({
      participation: {
        ...participation,
        [key]: !participation[key],
      },
    });
  };

  const METHODS = [
    {
      key: "backCampaign" as const,
      label: "Back This Campaign",
      description: "Allow users to back the campaign with a one-time contribution.",
    },
    {
      key: "foundingMember" as const,
      label: "Founding Member",
      description: "Allow users to become founding members with special privileges.",
    },
    {
      key: "foundingMemberMonthly" as const,
      label: "Founding Monthly",
      description: "Allow founding members to contribute on a recurring monthly basis.",
    },
    {
      key: "donateContribute" as const,
      label: "Donate / Contribute",
      description: "Allow general donations and contributions to the campaign.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Participation Methods</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose how people can participate in this campaign.
        </p>
      </div>

      <FieldError name="participation" fieldErrors={fieldErrors} />

      <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 ${fieldErrors?.participation ? "!border-red-500" : ""}`}>
        {METHODS.map((method) => (
          <div
            key={method.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-4"
          >
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{method.label}</span>
              <span className="mt-0.5 block text-xs text-gray-500">{method.description}</span>
            </div>
            <button
              type="button"
              onClick={() => toggleMethod(method.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                participation[method.key] ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  participation[method.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 12 — Contribution Rules
// ═══════════════════════════════════════════════════════════════════════════

function StepContributionRules({ formData, onUpdate, fieldErrors }: StepProps) {
  const rules = formData.contributionRules || {
    minContribution: "",
    maxContribution: "",
    suggestedAmounts: [],
    allowCustomAmount: true,
    contributionTypes: ["money"] as ContributionType[],
  };
  const [newSuggestedAmount, setNewSuggestedAmount] = useState("");

  const updateRules = (updates: Partial<typeof rules>) => {
    onUpdate({ contributionRules: { ...rules, ...updates } });
  };

  const addSuggestedAmount = () => {
    const val = newSuggestedAmount.trim();
    if (val && !rules.suggestedAmounts.includes(val)) {
      updateRules({ suggestedAmounts: [...rules.suggestedAmounts, val] });
      setNewSuggestedAmount("");
    }
  };

  const removeSuggestedAmount = (amount: string) => {
    updateRules({ suggestedAmounts: rules.suggestedAmounts.filter((a) => a !== amount) });
  };

  const toggleContributionType = (type: string) => {
    const current = rules.contributionTypes;
    const updated = current.includes(type as ContributionType)
      ? current.filter((t) => t !== type)
      : [...current, type as ContributionType];
    updateRules({ contributionTypes: updated });
  };

  const CONTRIBUTION_TYPES = [
    { value: "money", label: "Money" },
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Contribution Rules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set the rules for how contributions are made to this campaign.
        </p>
      </div>

      {/* Min / Max Amounts */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Amount Limits</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel label="Minimum Amount (£)" name="minContribution" fieldErrors={fieldErrors} />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
              <input
                type="text"
                inputMode="numeric"
                value={rules.minContribution ? formatAmount(rules.minContribution) : ""}
                onChange={(e) => updateRules({ minContribution: parseAmountInput(e.target.value) })}
                placeholder="No minimum"
                className={`w-full rounded-lg border bg-white py-2.5 pl-7 pr-3 text-sm focus:ring-1 ${fieldErrorClass("minContribution", fieldErrors)}`}
              />
            </div>
            <FieldError name="minContribution" fieldErrors={fieldErrors} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum Amount (£)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
              <input
                type="text"
                inputMode="numeric"
                value={rules.maxContribution ? formatAmount(rules.maxContribution) : ""}
                onChange={(e) => updateRules({ maxContribution: parseAmountInput(e.target.value) })}
                placeholder="No maximum"
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Amounts */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested Amounts</h3>
        <p className="text-xs text-gray-500 mb-3">
          Add quick-select amounts that will be shown to contributors.
        </p>

        {rules.suggestedAmounts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {rules.suggestedAmounts.map((amount) => (
              <span
                key={amount}
                className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
              >
                £{amount}
                <button
                  type="button"
                  onClick={() => removeSuggestedAmount(amount)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
            <input
              type="text"
              inputMode="numeric"
              value={newSuggestedAmount ? formatAmount(newSuggestedAmount) : ""}
              onChange={(e) => setNewSuggestedAmount(parseAmountInput(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSuggestedAmount();
                }
              }}
              placeholder="Add amount..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={addSuggestedAmount}
            disabled={!newSuggestedAmount.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Allow Custom Amount */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-sm font-semibold text-gray-900">Allow Custom Amount</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Let contributors enter their own amount instead of only using suggested amounts.
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateRules({ allowCustomAmount: !rules.allowCustomAmount })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              rules.allowCustomAmount ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rules.allowCustomAmount ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Contribution Types */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contribution Types</h3>
        <p className="text-xs text-gray-500 mb-3">
          Select which types of contributions are accepted.
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTRIBUTION_TYPES.map((type) => {
            const isSelected = rules.contributionTypes.includes(type.value as ContributionType);
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleContributionType(type.value)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {isSelected ? (
                  <CheckCircle className="h-4 w-4 text-primary-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                {type.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 13 — Funding Allocation
// ═══════════════════════════════════════════════════════════════════════════

function StepAllocation({ formData, onUpdate, fieldErrors }: StepProps) {
  const allocation = formData.allocationRules || {
    enabled: false,
    required: false,
    destinations: [],
    allowSplit: false,
    minAllocation: "",
    maxDestinations: "",
  };

  const updateAllocation = (updates: Partial<typeof allocation>) => {
    onUpdate({ allocationRules: { ...allocation, ...updates } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Funding Allocation</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure how raised funds are allocated across destinations.
        </p>
      </div>

      {/* Enable Allocation */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              allocation.enabled ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Enable Funding Allocation</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Allow contributors to choose where their funds go.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateAllocation({ enabled: !allocation.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              allocation.enabled ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                allocation.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {allocation.enabled && (
        <>
          <FieldError name="allocationDestinations" fieldErrors={fieldErrors} />

          {/* Destinations */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Allocation Destinations</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Define where contributors can allocate their funds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newDest = {
                    id: `dest-${Date.now()}`,
                    type: "custom" as const,
                    locationId: "",
                    name: "",
                    description: "",
                    percentage: "",
                    fixedAmount: "",
                  };
                  updateAllocation({ destinations: [...allocation.destinations, newDest] });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Destination
              </button>
            </div>

            {allocation.destinations.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <Wallet className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No destinations added yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    const newDest = {
                      id: `dest-${Date.now()}`,
                      type: "custom" as const,
                      locationId: "",
                      name: "",
                      description: "",
                      percentage: "",
                      fixedAmount: "",
                    };
                    updateAllocation({ destinations: [...allocation.destinations, newDest] });
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="h-4 w-4" />
                  Add First Destination
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {allocation.destinations.map((dest, dIndex) => (
                  <div
                    key={dest.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {dIndex + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Destination Name</label>
                          <input
                            type="text"
                            value={dest.name}
                            onChange={(e) => {
                              const updated = allocation.destinations.map((d, i) =>
                                i === dIndex ? { ...d, name: e.target.value } : d
                              );
                              updateAllocation({ destinations: updated });
                            }}
                            placeholder="e.g. Community Hub, Local Business Fund"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={dest.description}
                            onChange={(e) => {
                              const updated = allocation.destinations.map((d, i) =>
                                i === dIndex ? { ...d, description: e.target.value } : d
                              );
                              updateAllocation({ destinations: updated });
                            }}
                            placeholder="Brief description of this destination"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Percentage (%)</label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={dest.percentage}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  if (Number(val) <= 100) {
                                    const updated = allocation.destinations.map((d, i) =>
                                      i === dIndex ? { ...d, percentage: val } : d
                                    );
                                    updateAllocation({ destinations: updated });
                                  }
                                }}
                                placeholder="0"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fixed Amount (£)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">£</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={dest.fixedAmount ? formatAmount(dest.fixedAmount) : ""}
                                onChange={(e) => {
                                  const updated = allocation.destinations.map((d, i) =>
                                    i === dIndex ? { ...d, fixedAmount: parseAmountInput(e.target.value) } : d
                                  );
                                  updateAllocation({ destinations: updated });
                                }}
                                placeholder="0"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = allocation.destinations.filter((_, i) => i !== dIndex);
                          updateAllocation({ destinations: updated });
                        }}
                        className="mt-2 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Required Toggle */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-semibold text-gray-900">Allocation Required</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Contributors must allocate funds before completing their contribution.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateAllocation({ required: !allocation.required })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  allocation.required ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allocation.required ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Allow Split Toggle */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-semibold text-gray-900">Allow Split Allocation</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Let contributors split their contribution across multiple destinations.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateAllocation({ allowSplit: !allocation.allowSplit })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  allocation.allowSplit ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allocation.allowSplit ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Min Allocation & Max Destinations */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Allocation Limits</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Allocation (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={allocation.minAllocation ? formatAmount(allocation.minAllocation) : ""}
                    onChange={(e) => updateAllocation({ minAllocation: parseAmountInput(e.target.value) })}
                    placeholder="No minimum"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Destinations</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={allocation.maxDestinations}
                  onChange={(e) => updateAllocation({ maxDestinations: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of destinations a contributor can allocate to.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 14 — Backer Rules
// ═══════════════════════════════════════════════════════════════════════════

function StepBackerRules({ formData, onUpdate }: StepProps) {
  const rules = formData.backerRules || {
    enabled: false,
    allowWholeCampaign: false,
    allowPercentage: false,
    allowFundingRequirement: false,
    minBackerAmount: "",
    maxBackers: "",
    backerBenefits: "",
  };

  const updateRules = (updates: Partial<typeof rules>) => {
    onUpdate({ backerRules: { ...rules, ...updates } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Backer Rules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure rules and requirements for campaign backers.
        </p>
      </div>

      {/* Enable Backer Rules */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              rules.enabled ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Enable Backer Rules</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Allow users to back the campaign with specific commitments.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateRules({ enabled: !rules.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              rules.enabled ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rules.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {rules.enabled && (
        <>
          {/* Backer Commitment Types */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Commitment Types</h3>
            <p className="text-xs text-gray-500 mb-3">
              Choose what kinds of backer commitments are allowed.
            </p>
            <div className="space-y-3">
              {[
                {
                  key: "allowWholeCampaign" as const,
                  label: "Back the Whole Campaign",
                  description: "Backer commits to supporting the entire campaign.",
                },
                {
                  key: "allowPercentage" as const,
                  label: "Back by Percentage",
                  description: "Backer commits a percentage of the campaign goal.",
                },
                {
                  key: "allowFundingRequirement" as const,
                  label: "Back a Specific Requirement",
                  description: "Backer pledges to a specific requirement or milestone.",
                },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <input
                    type="checkbox"
                    checked={rules[opt.key]}
                    onChange={() => updateRules({ [opt.key]: !rules[opt.key] })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                    <span className="block text-xs text-gray-500">{opt.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Backer Limits</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Backer Amount (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rules.minBackerAmount ? formatAmount(rules.minBackerAmount) : ""}
                    onChange={(e) => updateRules({ minBackerAmount: parseAmountInput(e.target.value) })}
                    placeholder="No minimum"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Backers</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rules.maxBackers}
                  onChange={(e) => updateRules({ maxBackers: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Benefits Description */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Backer Benefits</h3>
            <textarea
              value={rules.backerBenefits}
              onChange={(e) => updateRules({ backerBenefits: e.target.value })}
              rows={4}
              placeholder="Describe the benefits and perks backers receive..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 15 — Founding Member Rules
// ═══════════════════════════════════════════════════════════════════════════

function StepFoundingMemberRules({ formData, onUpdate }: StepProps) {
  const rules = formData.foundingMemberRules || {
    enabled: false,
    maxFoundingMembers: "",
    contributionRequired: "",
    campaignLocationAssociation: false,
    privileges: "",
    foundingMonthlyEnabled: false,
    foundingMonthlyContribution: "",
  };

  const updateRules = (updates: Partial<typeof rules>) => {
    onUpdate({ foundingMemberRules: { ...rules, ...updates } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Founding Member Rules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure the founding member programme for this campaign.
        </p>
      </div>

      {/* Enable Founding Members */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              rules.enabled ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Enable Founding Members</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Allow users to become founding members with special status.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateRules({ enabled: !rules.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              rules.enabled ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rules.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {rules.enabled && (
        <>
          {/* Core Settings */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Founding Member Settings</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Founding Members</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rules.maxFoundingMembers}
                  onChange={(e) => updateRules({ maxFoundingMembers: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contribution Required (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={rules.contributionRequired}
                    onChange={(e) => updateRules({ contributionRequired: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Location Association</label>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <span className="text-sm text-gray-700">Associate founding members with campaign locations</span>
                <button
                  type="button"
                  onClick={() => updateRules({ campaignLocationAssociation: !rules.campaignLocationAssociation })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    rules.campaignLocationAssociation ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rules.campaignLocationAssociation ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Optional. Associate founding members with a specific campaign location.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Founding Member Privileges</label>
              <textarea
                value={rules.privileges}
                onChange={(e) => updateRules({ privileges: e.target.value })}
                rows={3}
                placeholder="Describe the privileges and benefits founding members receive..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Founding Monthly */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-semibold text-gray-900">Founding Monthly</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Allow founding members to contribute on a recurring monthly basis.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateRules({ foundingMonthlyEnabled: !rules.foundingMonthlyEnabled })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  rules.foundingMonthlyEnabled ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rules.foundingMonthlyEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {rules.foundingMonthlyEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Contribution (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rules.foundingMonthlyContribution ? formatAmount(rules.foundingMonthlyContribution) : ""}
                    onChange={(e) => updateRules({ foundingMonthlyContribution: parseAmountInput(e.target.value) })}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 16 — Group Funding Rules
// ═══════════════════════════════════════════════════════════════════════════

function StepGroupRules({ formData, onUpdate, fieldErrors }: StepProps) {
  const rules = formData.groupRules || {
    enabled: false,
    minGroupSize: "",
    maxGroupSize: "",
    groupContributionRules: "",
    groupTarget: "",
    groupBenefits: "",
  };

  const updateRules = (updates: Partial<typeof rules>) => {
    onUpdate({ groupRules: { ...rules, ...updates } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Group Funding Rules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure rules for group contributions and team-based funding.
        </p>
      </div>

      {/* Enable Group Rules */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              rules.enabled ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Enable Group Funding</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Allow users to form groups and contribute together.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateRules({ enabled: !rules.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              rules.enabled ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rules.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {rules.enabled && (
        <>
          {/* Group Size */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Group Size</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <RequiredLabel label="Minimum Group Size" name="minGroupSize" fieldErrors={fieldErrors} />
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={rules.minGroupSize}
                  onChange={(e) => updateRules({ minGroupSize: e.target.value })}
                  placeholder="2"
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 ${fieldErrorClass("minGroupSize", fieldErrors)}`}
                />
                <FieldError name="minGroupSize" fieldErrors={fieldErrors} />
              </div>
              <div>
                <RequiredLabel label="Maximum Group Size" name="maxGroupSize" fieldErrors={fieldErrors} />
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={rules.maxGroupSize}
                  onChange={(e) => updateRules({ maxGroupSize: e.target.value })}
                  placeholder="Unlimited"
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 ${fieldErrorClass("maxGroupSize", fieldErrors)}`}
                />
                <FieldError name="maxGroupSize" fieldErrors={fieldErrors} />
              </div>
            </div>
          </div>

          {/* Group Contribution Rules */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Group Contribution Rules</h3>
            <textarea
              value={rules.groupContributionRules}
              onChange={(e) => updateRules({ groupContributionRules: e.target.value })}
              rows={3}
              placeholder="Define how group contributions work, e.g. minimum per member, pooled contributions..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Group Benefits */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Group Benefits</h3>
            <textarea
              value={rules.groupBenefits}
              onChange={(e) => updateRules({ groupBenefits: e.target.value })}
              rows={3}
              placeholder="Describe the benefits groups receive, e.g. group discounts, recognition, exclusive access..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 17 — Rewards
// ═══════════════════════════════════════════════════════════════════════════

function StepRewards({ formData, onUpdate, fieldErrors }: StepProps) {
  const hasRewards = formData.hasRewards || false;
  const qualificationMode = formData.qualificationMode || "highest";
  const rewards = formData.rewards || [];
  const campaignAudience = formData.audience || "both";
  const consumerOnlyCampaign = campaignAudience === "consumer";

  const [showPicker, setShowPicker] = useState(false);
  const [catalogue, setCatalogue] = useState<McomCatalogueReward[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");
  const [catalogueSearch, setCatalogueSearch] = useState("");

  const loadCatalogue = useCallback(async () => {
    setLoadingCatalogue(true);
    setCatalogueError("");
    try {
      const res = await adminApi.getMcomRewards({ limit: 100, source: "mcom vault" });
      setCatalogue(res?.data ?? []);
    } catch (err) {
      setCatalogueError(
        err instanceof Error ? err.message : "Failed to load MCOM Rewards",
      );
    } finally {
      setLoadingCatalogue(false);
    }
  }, []);

  useEffect(() => {
    if (showPicker) void loadCatalogue();
  }, [showPicker, loadCatalogue]);

  const rewardAudience = (item: McomCatalogueReward): "business" | "consumer" | "both" => {
    if (isCentralFulfilmentKind(item.fulfilmentKind) || item.consumerEligible === false) {
      return "business";
    }
    if (item.businessEligible === false) return "consumer";
    return "both";
  };

  const isDisallowedForCampaign = (item: {
    fulfilmentKind?: string | null;
    consumerEligible?: boolean | null;
  }) =>
    consumerOnlyCampaign &&
    (isCentralFulfilmentKind(item.fulfilmentKind) || item.consumerEligible === false);

  const toCampaignReward = (item: McomCatalogueReward): CampaignReward => ({
    id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: item.title,
    description: item.description ?? "",
    order: rewards.length,
    audience: rewardAudience(item),
    source: "mcom",
    mcomRewardId: item.id,
    mcomSource: item.source || "mcom vault",
    fulfilmentProvider: item.fulfilmentProvider ?? null,
    fulfilmentKind: item.fulfilmentKind ?? null,
    consumerEligible: item.consumerEligible ?? null,
    businessEligible: item.businessEligible ?? null,
    triggerType: "contribution",
    triggerConfig: { mode: "min" },
    quantityType: "unlimited",
    quantityLimit: null,
    claimDeadlineDays: 0,
    fulfilmentType: "mcom_asset",
    fulfilmentConfig: {},
    qualificationPeriod: "",
    expiryDays: 0,
    items: [],
  });

  const addFromCatalogue = (item: McomCatalogueReward) => {
    if (isDisallowedForCampaign(item)) return;
    if (rewards.some((r) => r.mcomRewardId === item.id)) return;
    onUpdate({ rewards: [...rewards, toCampaignReward(item)] });
  };

  const updateReward = (index: number, field: keyof CampaignReward, value: unknown) => {
    onUpdate({
      rewards: rewards.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    });
  };

  const updateTrigger = (index: number, patch: Partial<CampaignReward["triggerConfig"]>) => {
    onUpdate({
      rewards: rewards.map((r, i) =>
        i === index ? { ...r, triggerConfig: { ...r.triggerConfig, ...patch } } : r,
      ),
    });
  };

  const removeReward = (index: number) => {
    onUpdate({ rewards: rewards.filter((_, i) => i !== index) });
  };

  const filteredCatalogue = catalogue.filter((item) => {
    const term = catalogueSearch.toLowerCase();
    return (
      !term ||
      item.title.toLowerCase().includes(term) ||
      (item.description ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Rewards</h2>
        <p className="mt-1 text-sm text-gray-500">
          Campaign rewards are selected from the MCOM Rewards admin catalogue. FundOrDonate does not
          create or store its own reward catalogue for campaigns.
        </p>
      </div>

      <FieldError name="rewards" fieldErrors={fieldErrors} />

      {/* Enable Rewards */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              hasRewards ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Enable Rewards</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Offer rewards to contributors based on their participation level.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ hasRewards: !hasRewards })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              hasRewards ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hasRewards ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {hasRewards && (
        <>
          {/* Evaluation Mode */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Evaluation Mode</h3>
            <p className="text-xs text-gray-500 mb-3">
              How are multiple rewards evaluated for a single contributor?
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: "highest" as const, label: "Highest Reward", description: "Grant the highest qualifying reward only." },
                { value: "cumulative" as const, label: "Cumulative", description: "Grant all qualifying rewards cumulatively." },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ qualificationMode: opt.value })}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    qualificationMode === opt.value
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      qualificationMode === opt.value
                        ? "border-primary-600 bg-primary-600"
                        : "border-gray-300"
                    }`}
                  >
                    {qualificationMode === opt.value && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{opt.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rewards List */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">MCOM Rewards</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Rewards are fulfilled by MCOM Rewards (Mall or Central). Consumers cannot win
                  Central membership, access pass or Central coupon rewards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                <Award className="h-4 w-4" />
                Select MCOM Reward
              </button>
            </div>

            {rewards.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <Award className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No rewards configured yet.</p>
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                >
                  <Award className="h-4 w-4" />
                  Select MCOM Reward
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward, rIndex) => {
                  const disallowed = isDisallowedForCampaign(reward);
                  return (
                    <div key={reward.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="text-sm font-semibold text-gray-900">{reward.title}</h4>
                            <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                              {reward.fulfilmentProvider === "CENTRAL" || isCentralFulfilmentKind(reward.fulfilmentKind)
                                ? "Central"
                                : reward.fulfilmentProvider === "MALL"
                                  ? "Mall"
                                  : "MCOM"}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {reward.audience === "consumer"
                                ? "Consumer"
                                : reward.audience === "business"
                                  ? "Business"
                                  : "Both"}
                            </span>
                            {reward.fulfilmentKind && (
                              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                {fulfilmentKindLabel(reward.fulfilmentKind)}
                              </span>
                            )}
                          </div>
                          {reward.description && (
                            <p className="mt-1 text-xs text-gray-500">{reward.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeReward(rIndex)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove reward"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {disallowed && (
                        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          <AlertCircle className="h-3.5 w-3.5" />
                          This is a business-only Central reward and cannot be used on a consumer-only
                          campaign. Remove it or change the campaign audience.
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Trigger Type</label>
                          <select
                            value={reward.triggerType}
                            onChange={(e) => updateReward(rIndex, "triggerType", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="contribution">Contribution</option>
                            <option value="backer">Backer</option>
                            <option value="membership">Membership</option>
                            <option value="founding_monthly">Founding Monthly</option>
                            <option value="first_n">First N</option>
                            <option value="top_n">Top N</option>
                            <option value="leaderboard">Leaderboard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Qualifies when</label>
                          <select
                            value={reward.triggerConfig.mode}
                            onChange={(e) =>
                              updateTrigger(rIndex, {
                                mode: e.target.value as "min" | "range" | "exact",
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="min">Contribution at least</option>
                            <option value="range">Contribution between</option>
                            <option value="exact">Contribution exactly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Type</label>
                          <select
                            value={reward.quantityType}
                            onChange={(e) => {
                              const quantityType = e.target.value as "unlimited" | "limited";
                              onUpdate({
                                rewards: rewards.map((r, i) =>
                                  i === rIndex
                                    ? {
                                        ...r,
                                        quantityType,
                                        quantityLimit: quantityType === "limited" ? r.quantityLimit : null,
                                      }
                                    : r,
                                ),
                              });
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="unlimited">Unlimited</option>
                            <option value="limited">Limited</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                        {reward.triggerConfig.mode !== "range" && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {reward.triggerConfig.mode === "exact" ? "Exact (£)" : "Minimum (£)"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={reward.triggerConfig[reward.triggerConfig.mode] ?? ""}
                              onChange={(e) =>
                                updateTrigger(rIndex, {
                                  [reward.triggerConfig.mode]: e.target.value === "" ? undefined : Number(e.target.value),
                                })
                              }
                              placeholder="Any amount"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        )}
                        {reward.triggerConfig.mode === "range" && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Min (£)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={reward.triggerConfig.min ?? ""}
                                onChange={(e) =>
                                  updateTrigger(rIndex, {
                                    min: e.target.value === "" ? undefined : Number(e.target.value),
                                  })
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Max (£)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={reward.triggerConfig.max ?? ""}
                                onChange={(e) =>
                                  updateTrigger(rIndex, {
                                    max: e.target.value === "" ? undefined : Number(e.target.value),
                                  })
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </>
                        )}
                        {reward.quantityType === "limited" && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity cap</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={reward.quantityLimit ?? ""}
                              onChange={(e) =>
                                updateReward(
                                  rIndex,
                                  "quantityLimit",
                                  e.target.value === "" ? null : Math.max(1, Math.floor(Number(e.target.value))),
                                )
                              }
                              placeholder="e.g. 50"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">
                        The quantity cap is enforced server-side before any provider call. Provider stock
                        remains authoritative and is an additional limit.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* MCOM catalogue picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">MCOM admin rewards</h3>
                <p className="text-sm text-gray-500">
                  Admin-created rewards from the MCOM Rewards vault (source = &quot;mcom vault&quot;).
                </p>
              </div>
              <button onClick={() => setShowPicker(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-gray-200 px-6 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  placeholder="Search MCOM rewards..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {catalogueError && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  <span>{catalogueError}</span>
                  <button type="button" onClick={() => void loadCatalogue()} className="font-semibold underline">
                    Retry
                  </button>
                </div>
              )}
              {loadingCatalogue ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading MCOM Rewards…</div>
              ) : filteredCatalogue.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No MCOM admin rewards found. Ask the MCOM Rewards team to publish rewards to the
                  &quot;mcom vault&quot; source.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCatalogue.map((item) => {
                    const alreadyAdded = rewards.some((r) => r.mcomRewardId === item.id);
                    const disallowed = isDisallowedForCampaign(item);
                    const disabled = alreadyAdded || disallowed;
                    return (
                      <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                            <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                                {item.fulfilmentProvider === "CENTRAL" || isCentralFulfilmentKind(item.fulfilmentKind)
                                  ? "Central"
                                  : item.fulfilmentProvider === "MALL"
                                    ? "Mall"
                                    : "MCOM"}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                {rewardAudience(item) === "business"
                                  ? "Business only"
                                  : rewardAudience(item) === "consumer"
                                    ? "Consumer only"
                                    : "Consumer & business"}
                              </span>
                              {item.fulfilmentKind && (
                                <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                  {fulfilmentKindLabel(item.fulfilmentKind)}
                                </span>
                              )}
                              {typeof item.quantity === "number" && item.quantity > 0 && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                  {item.quantity} in stock
                                </span>
                              )}
                            </div>
                            {disallowed && (
                              <p className="mt-2 text-xs font-medium text-amber-700">
                                Business-only Central rewards are not available on consumer-only
                                campaigns.
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addFromCatalogue(item)}
                            disabled={disabled}
                            className={`ml-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                              disabled
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-primary-600 text-white hover:bg-primary-700"
                            }`}
                          >
                            {alreadyAdded ? "Added" : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STEP 18 — Leaderboard
// ═══════════════════════════════════════════════════════════════════════════

function StepLeaderboard({ formData, onUpdate }: StepProps) {
  const leaderboard = formData.leaderboard || { enabled: false, rankingMethod: "contribution_amount" as const, numberOfWinners: "", prizes: [] };

  const updateLeaderboard = (updates: Partial<typeof leaderboard>) => {
    onUpdate({ leaderboard: { ...leaderboard, ...updates } });
  };

  const addPrize = () => {
    const newPrize: LeaderboardPrize = {
      id: `lp-${Date.now()}`,
      position: "",
      positionRange: "",
      prizeDescription: "",
    };
    updateLeaderboard({ prizes: [...leaderboard.prizes, newPrize] });
  };

  const updatePrize = (index: number, field: keyof LeaderboardPrize, value: string) => {
    const updated = leaderboard.prizes.map((p, i) =>
      i === index ? { ...p, [field]: value } : p,
    );
    updateLeaderboard({ prizes: updated });
  };

  const removePrize = (index: number) => {
    updateLeaderboard({ prizes: leaderboard.prizes.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure a leaderboard to recognise top contributors and drive engagement.
        </p>
      </div>

      {/* Enable Leaderboard */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              leaderboard.enabled ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Enable Leaderboard</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Display a public leaderboard of top contributors.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateLeaderboard({ enabled: !leaderboard.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              leaderboard.enabled ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                leaderboard.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {leaderboard.enabled && (
        <>
          {/* Ranking Method & Winners */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ranking Method</label>
                <select
                  value={leaderboard.rankingMethod}
                  onChange={(e) => updateLeaderboard({ rankingMethod: e.target.value as "contribution_amount" | "number_of_contributions" | "participation" })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="contribution_amount">Total Amount Contributed</option>
                  <option value="number_of_contributions">Contribution Frequency</option>
                  <option value="participation">Participation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Winners</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={leaderboard.numberOfWinners}
                  onChange={(e) => updateLeaderboard({ numberOfWinners: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Prizes */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Prizes</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Define prizes for leaderboard positions.
                </p>
              </div>
              <button
                type="button"
                onClick={addPrize}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Prize
              </button>
            </div>

            {leaderboard.prizes.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                No prizes configured. Click "Add Prize" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.prizes.map((prize, index) => (
                  <div key={prize.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Medal className="mt-1 h-5 w-5 flex-shrink-0 text-amber-500" />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                        <input
                          type="text"
                          value={prize.position}
                          onChange={(e) => updatePrize(index, "position", e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Range End</label>
                        <input
                          type="text"
                          value={prize.positionRange}
                          onChange={(e) => updatePrize(index, "positionRange", e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={prize.prizeDescription}
                          onChange={(e) => updatePrize(index, "prizeDescription", e.target.value)}
                          placeholder="e.g. Gold Award"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrize(index)}
                      className="mt-1 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 19 — Terms & Conditions
// ═══════════════════════════════════════════════════════════════════════════

function StepTerms({ formData, onUpdate }: StepProps) {
  const terms = formData.terms || {
    campaignTerms: "",
    contributionTerms: "",
    rewardTerms: "",
    claimTerms: "",
    allocationTerms: "",
    refundCancellation: "",
    customConditions: "",
  };

  const updateTerms = (updates: Partial<typeof terms>) => {
    onUpdate({ terms: { ...terms, ...updates } });
  };

  const TEXTAREAS = [
    { key: "campaignTerms" as const, label: "Campaign Terms", placeholder: "Terms specific to this campaign..." },
    { key: "contributionTerms" as const, label: "Contribution Terms", placeholder: "Terms governing contributions..." },
    { key: "rewardTerms" as const, label: "Reward Terms", placeholder: "Terms for rewards and fulfilment..." },
    { key: "claimTerms" as const, label: "Claim Terms", placeholder: "Terms for claiming rewards..." },
    { key: "allocationTerms" as const, label: "Allocation Terms", placeholder: "Terms for fund allocation..." },
    { key: "refundCancellation" as const, label: "Refund & Cancellation", placeholder: "Refund and cancellation policy..." },
    { key: "customConditions" as const, label: "Custom Conditions", placeholder: "Any additional custom conditions..." },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Terms & Conditions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define the terms and conditions for this campaign.
        </p>
      </div>

      {TEXTAREAS.map((field) => (
        <div key={field.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{field.label}</h3>
          <textarea
            value={terms[field.key]}
            onChange={(e) => updateTerms({ [field.key]: e.target.value })}
            rows={4}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 21 — Preview
// ═══════════════════════════════════════════════════════════════════════════

function StepPreview({ formData, published }: StepProps) {
  const [viewMode, setViewMode] = useState<"consumer" | "business">("consumer");
  const { data: seasonsData } = useAdminSeasons({ limit: 100 });

  const seasonLabels = useMemo(() => {
    return (formData.seasonIds || []).map((s) => {
      const season = (seasonsData?.items || []).find((se) => se.id === s);
      return season?.name || s;
    });
  }, [formData.seasonIds, seasonsData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Preview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review how your campaign will appear to consumers and business owners, then publish it or save it as a draft.
        </p>
      </div>

      {/* Published confirmation */}
      {published && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-3 text-lg font-bold text-green-900">Campaign Published Successfully!</h3>
          <p className="mt-1 text-sm text-green-700">
            Your campaign is now live and visible to contributors. Redirecting to campaigns...
          </p>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode("consumer")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "consumer"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <User className="h-4 w-4" />
          Consumer View
        </button>
        <button
          type="button"
          onClick={() => setViewMode("business")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "business"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Business View
        </button>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Campaign Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <h3 className="text-lg font-bold">{formData.title || "Campaign Name"}</h3>
          <p className="mt-1 text-sm text-primary-100">
            {formData.shortDescription || "Campaign short description will appear here."}
          </p>
        </div>

        {/* Campaign Details */}
        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</span>
            <p className="mt-1 text-sm text-gray-700">
              {formData.description || "Full campaign description will appear here."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target</span>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formData.targetAmount ? `£${Number(formData.targetAmount).toLocaleString()}` : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Type</span>
              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {formData.scope === "city" ? `City — ${formData.cityName || "Not selected"}` : "Independent"}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Season</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {seasonLabels.length > 0 ? (
                seasonLabels.map((label) => (
                  <span key={label} className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">Not selected</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</span>
            <p className="mt-1 text-sm text-gray-700 capitalize">
              {(formData.audience || "both").replace("_", " ")}
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {formData.categoryId ? (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                  {CATEGORIES.find((c) => c.value === formData.categoryId)?.label || formData.categoryId}
                </span>
              ) : (
                <span className="text-sm text-gray-400">None</span>
              )}
            </div>
          </div>

          {viewMode === "business" && (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Business View:</strong> Additional business-specific information and participation options will be displayed here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Publish hint */}
      <div className="rounded-lg bg-amber-50 p-3">
        <p className="text-xs text-amber-700">
          <strong>Ready to publish?</strong> Click <strong>Submit &amp; Publish</strong> in the footer to make your
          campaign live, or <strong>Save Draft</strong> in the header to finish later.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN WIZARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AdminCampaignWizard() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<StepId>("campaign_type");
  const [formData, setFormData] = useState<CampaignWizardData>(() => createDefaultWizardData());
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string[]>>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handleUpdate = useCallback((updates: Partial<CampaignWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setFieldErrors({});
  }, []);

  const stepComponents: Record<StepId, React.FC<StepProps>> = {
    campaign_type: StepScope,
    locations: StepLocations,
    season: StepSeason,
    details: StepDetails,
    objective: StepObjective,
    target: StepTarget,
    dates: StepDates,
    audience: StepAudience,
    participation: StepParticipation,
    contribution_rules: StepContributionRules,
    allocation: StepAllocation,
    backer_rules: StepBackerRules,
    founding_member_rules: StepFoundingMemberRules,
    group_rules: StepGroupRules,
    rewards: StepRewards,
    leaderboard: StepLeaderboard,
    terms: StepTerms,
    preview: StepPreview,
  };

  // Skip the Locations step when the campaign is independent (no location dependency)
  const activeSteps = useMemo(
    () => (formData.scope === "independent" ? WIZARD_STEPS.filter((s) => s.id !== "locations") : WIZARD_STEPS),
    [formData.scope],
  );

  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  // Safety: if scope switched to independent while on the Locations step, return to Campaign Type
  useEffect(() => {
    if (formData.scope === "independent" && currentStep === "locations") {
      setCurrentStep("campaign_type");
    }
  }, [formData.scope, currentStep]);

  const validateCurrentStep = useCallback((): boolean => {
    const result = validateStep(currentStep, formData);
    setStepErrors((prev) => {
      const next = { ...prev };
      if (result.errors.length > 0) {
        next[currentStep] = result.errors;
      } else {
        delete next[currentStep];
      }
      return next;
    });
    setFieldErrors(result.fieldErrors);
    return result.valid;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (!isLastStep) {
      const nextStep = activeSteps[currentStepIndex + 1];
      if (nextStep) setCurrentStep(nextStep.id);
    }
  }, [currentStep, currentStepIndex, isFirstStep, isLastStep, validateCurrentStep, activeSteps]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      const prevStep = activeSteps[currentStepIndex - 1];
      if (prevStep) setCurrentStep(prevStep.id);
    }
  }, [currentStepIndex, isFirstStep, activeSteps]);

  const handleStepClick = useCallback((stepId: StepId) => {
    setCurrentStep(stepId);
  }, []);

  /**
   * Maps the wizard state onto the platform-campaign API payload. Wizard
   * campaign data is richer than the persisted campaign row; the remaining
   * configuration is stored in `settings` so it is not lost.
   */
  const buildCampaignPayload = useCallback(
    (status: "DRAFT" | "ACTIVE") => {
      const rawTarget = String(formData.targetAmount ?? "").replace(/[^0-9.]/g, "");
      const targetInPence =
        formData.hasTarget === false ? 0 : Math.round(Number(rawTarget) * 100);
      const startingAmountInPence = Math.round(
        Number(String(formData.startingAmount ?? "").replace(/[^0-9.]/g, "")) * 100,
      );

      const coverage = formData.locationCoverage;
      const primaryLocationId =
        formData.cityId || coverage.selectedCities[0] || undefined;
      const additionalLocationIds = Array.from(
        new Set([
          ...coverage.selectedCities,
          ...coverage.selectedLocalAreas,
          ...coverage.selectedHighStreets,
        ]),
      ).filter((id) => id && id !== primaryLocationId);

      const combineDate = (date: string, time: string, endOfDay: boolean) => {
        if (!date) return null;
        // The date picker already emits a `YYYY-MM-DDTHH:mm` value; older
        // callers pass a plain date plus a separate time.
        const raw = date.includes("T")
          ? date
          : `${date}T${time || (endOfDay ? "23:59:59" : "00:00:00")}`;
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
      };

      const audience =
        formData.audience === "business"
          ? "BUSINESS"
          : formData.audience === "consumer"
            ? "CONSUMER"
            : "BOTH";

      // A campaign that only accepts backing/pledges runs in fund mode;
      // anything that accepts donations runs in donation mode.
      const mode =
        formData.participation?.backCampaign &&
        formData.participation?.donateContribute === false
          ? "fund"
          : "donation";

      const category = formData.categoryId
        ? formData.categoryId
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : undefined;

      // Everything the admin configures in the wizard is persisted on the
      // campaign's `settings` JSON so the backend can validate and enforce it.
      const settings = JSON.parse(
        JSON.stringify({
          campaignCode: formData.campaignCode || undefined,
          campaignType: formData.campaignType,
          scope: formData.scope,
          cityId: formData.cityId || undefined,
          citySlug: formData.citySlug || undefined,
          cityName: formData.cityName || undefined,
          locationCoverage: coverage,
          seasonIds: formData.seasonIds,
          programmeName: formData.programmeName || undefined,
          objective: formData.objective || undefined,
          objectiveDetails: formData.objectiveDetails || undefined,
          hasTarget: formData.hasTarget !== false,
          startingAmount: formData.startingAmount || "0",
          startingAmountPence: startingAmountInPence,
          stretchTargets: formData.stretchTargets,
          periodMode: formData.periodMode,
          isEvergreen: formData.isEvergreen,
          additionalImages: formData.additionalImages,
          videoUrl: formData.videoUrl || undefined,
          participation: formData.participation,
          contributionRules: formData.contributionRules,
          allocationRules: formData.allocationRules,
          backerRules: formData.backerRules,
          foundingMemberRules: formData.foundingMemberRules,
          groupRules: formData.groupRules,
          rewards: formData.rewards,
          hasRewards: formData.hasRewards,
          qualificationMode: formData.qualificationMode,
          leaderboard: formData.leaderboard,
          terms: formData.terms,
          approval: formData.approval,
        }),
      );

      return {
        title:
          formData.title.trim() ||
          (status === "DRAFT" ? "Untitled Campaign Draft" : "Untitled Campaign"),
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim() || undefined,
        targetAmount: targetInPence,
        mode,
        audience,
        category,
        imageUrl: formData.featuredImage || formData.videoUrl || undefined,
        primaryLocationId,
        additionalLocationIds,
        startDate: combineDate(formData.startDate, formData.startTime, false),
        endDate: combineDate(formData.endDate, formData.endTime, true),
        status,
        isFeatured: status === "ACTIVE",
        settings,
      };
    },
    [formData],
  );

  /** Validates every visible step and jumps to the first invalid one. */
  const validateAllSteps = useCallback((): boolean => {
    const nextErrors: Partial<Record<StepId, string[]>> = {};
    let firstInvalid: StepId | null = null;

    for (const step of activeSteps) {
      const result = validateStep(step.id, formData);
      if (!result.valid) {
        nextErrors[step.id] = result.errors;
        if (!firstInvalid) firstInvalid = step.id;
      }
    }

    setStepErrors(nextErrors);
    if (firstInvalid) {
      setCurrentStep(firstInvalid);
      return false;
    }
    return true;
  }, [activeSteps, formData]);

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const payload = buildCampaignPayload("DRAFT");
      await adminApi.createCampaign(payload as any);
      navigate("/admin/campaigns");
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save campaign draft to database",
      );
    } finally {
      setSaving(false);
    }
  }, [buildCampaignPayload, navigate]);

  const handleSubmitPublish = useCallback(async () => {
    if (!validateAllSteps()) return;
    setPublishing(true);
    try {
      const payload = buildCampaignPayload("ACTIVE");
      await adminApi.createCampaign(payload as any);
      setCompletedSteps(new Set(activeSteps.map((step) => step.id)));
      setPublished(true);
      setTimeout(() => {
        navigate("/admin/campaigns");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to publish campaign:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to publish campaign to database",
      );
    } finally {
      setPublishing(false);
    }
  }, [validateAllSteps, buildCampaignPayload, activeSteps, navigate]);

  const StepComponent = stepComponents[currentStep];

  return (
    <WizardShell
      steps={activeSteps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      stepErrors={stepErrors}
      onStepClick={handleStepClick}
      onBack={handleBack}
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      onSubmitPublish={handleSubmitPublish}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      saving={saving}
      publishing={publishing}
    >
      <StepComponent
        formData={formData}
        onUpdate={handleUpdate}
        onNavigateToStep={handleStepClick}
        fieldErrors={fieldErrors}
        published={published}
      />
    </WizardShell>
  );
}
