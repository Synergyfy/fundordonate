import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { DEMO_LOCATIONS, DEMO_TAGS } from "@/data/demo";

export interface CampaignFilters {
  search: string;
  category: string;
  mode: string;
  status: string;
  sortBy: string;
  dateRange: string;
  location: string;
  tag: string;
  membership: string;
  evergreen: string;
  campaignType: string;
  season: string;
}

interface Props {
  filters: CampaignFilters;
  onChange: (filters: CampaignFilters) => void;
  categories: { id: string; name: string; slug: string }[];
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "mostFunded", label: "Most Funded" },
  { value: "endingSoon", label: "Ending Soon" },
  { value: "popular", label: "Most Popular" },
  { value: "mostBacked", label: "Most Backed" },
];

const MODE_OPTIONS = [
  { value: "", label: "All Modes" },
  { value: "donation", label: "Donate" },
  { value: "fund", label: "Fund" },
  { value: "sponsor", label: "Sponsor" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "published", label: "Active" },
  { value: "ended", label: "Ended" },
];

const DATE_OPTIONS = [
  { value: "", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const MEMBERSHIP_OPTIONS = [
  { value: "", label: "All Campaigns" },
  { value: "membership", label: "Membership Campaigns" },
  { value: "non-membership", label: "Non-Membership" },
];

const EVERGREEN_OPTIONS = [
  { value: "", label: "All Campaigns" },
  { value: "evergreen", label: "Evergreen" },
  { value: "seasonal", label: "Seasonal" },
];

const CAMPAIGN_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "local-hub", label: "Local Hub" },
  { value: "business", label: "Business" },
  { value: "community", label: "Community" },
  { value: "high-street", label: "High Street" },
  { value: "founding-membership", label: "Founding Membership" },
  { value: "self-funding", label: "Self-Funding" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "mcom-programme", label: "MCOM Programme" },
  { value: "247gbs", label: "247GBS Programme" },
];

const SEASON_OPTIONS = [
  { value: "", label: "All Seasons" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
  { value: "winter", label: "Winter" },
];

export function CampaignFilters({ filters, onChange, categories }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const update = (key: keyof CampaignFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeFilterCount = [
    filters.category,
    filters.mode,
    filters.status !== "published" ? filters.status : "",
    filters.dateRange,
    filters.location,
    filters.tag,
    filters.membership,
    filters.evergreen,
    filters.campaignType,
    filters.season,
  ].filter(Boolean).length;

  const clearAll = () => {
    onChange({
      search: filters.search,
      category: "",
      mode: "",
      status: "",
      sortBy: filters.sortBy,
      dateRange: "",
      location: "",
      tag: "",
      membership: "",
      evergreen: "",
      campaignType: "",
      season: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Search campaigns, local hubs or businesses"
          className="input-field w-full pl-10 pr-10"
        />
        {filters.search && (
          <button
            onClick={() => update("search", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sort & Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => update("sortBy", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          aria-label="Sort campaigns"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Quick Mode Filters */}
        <div className="hidden items-center gap-2 sm:flex">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update("mode", opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.mode === opt.value
                  ? opt.value === "donation"
                    ? "bg-secondary-600 text-white"
                    : opt.value === "fund"
                    ? "bg-primary-600 text-white"
                    : opt.value === "sponsor"
                    ? "bg-amber-500 text-white"
                    : "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-pressed={filters.mode === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Mobile Mode Filter */}
        <select
          value={filters.mode}
          onChange={(e) => update("mode", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none sm:hidden"
          aria-label="Filter by mode"
        >
          {MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            isOpen || activeFilterCount > 0
              ? "border-primary-300 bg-primary-50 text-primary-700"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
          aria-expanded={isOpen}
          aria-controls="advanced-filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.category && (
            <FilterChip
              label={categories.find((c) => c.id === filters.category)?.name || filters.category}
              onRemove={() => update("category", "")}
            />
          )}
          {filters.mode && (
            <FilterChip
              label={MODE_OPTIONS.find((m) => m.value === filters.mode)?.label || filters.mode}
              onRemove={() => update("mode", "")}
            />
          )}
          {filters.status && filters.status !== "published" && (
            <FilterChip
              label={STATUS_OPTIONS.find((s) => s.value === filters.status)?.label || filters.status}
              onRemove={() => update("status", "")}
            />
          )}
          {filters.location && (
            <FilterChip
              label={DEMO_LOCATIONS.find((l) => l.slug === filters.location)?.name || filters.location}
              onRemove={() => update("location", "")}
            />
          )}
          {filters.tag && (
            <FilterChip
              label={DEMO_TAGS.find((t) => t.slug === filters.tag)?.name || filters.tag}
              onRemove={() => update("tag", "")}
            />
          )}
          {filters.membership && (
            <FilterChip
              label={MEMBERSHIP_OPTIONS.find((m) => m.value === filters.membership)?.label || filters.membership}
              onRemove={() => update("membership", "")}
            />
          )}
          {filters.evergreen && (
            <FilterChip
              label={EVERGREEN_OPTIONS.find((e) => e.value === filters.evergreen)?.label || filters.evergreen}
              onRemove={() => update("evergreen", "")}
            />
          )}
          {filters.campaignType && (
            <FilterChip
              label={CAMPAIGN_TYPE_OPTIONS.find((t) => t.value === filters.campaignType)?.label || filters.campaignType}
              onRemove={() => update("campaignType", "")}
            />
          )}
          {filters.season && (
            <FilterChip
              label={SEASON_OPTIONS.find((s) => s.value === filters.season)?.label || filters.season}
              onRemove={() => update("season", "")}
            />
          )}
          <button
            onClick={clearAll}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded Advanced Filters */}
      {isOpen && (
        <div id="advanced-filters" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">All Locations</option>
                {DEMO_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.slug}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tag</label>
              <select
                value={filters.tag}
                onChange={(e) => update("tag", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">All Tags</option>
                {DEMO_TAGS.map((tag) => (
                  <option key={tag.id} value={tag.slug}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => update("dateRange", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Membership */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Membership</label>
              <select
                value={filters.membership}
                onChange={(e) => update("membership", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {MEMBERSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Evergreen */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Campaign Type</label>
              <select
                value={filters.evergreen}
                onChange={(e) => update("evergreen", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {EVERGREEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Campaign Category</label>
              <select
                value={filters.campaignType}
                onChange={(e) => update("campaignType", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {CAMPAIGN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Season */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Season</label>
              <select
                value={filters.season}
                onChange={(e) => update("season", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                {SEASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-primary-100"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
