// =============================================================================
// UK Hub Map — Filters Component
// Filter by status, type, and founding availability.
// =============================================================================

import { Filter, Building2, UserRound, X } from "lucide-react";
import type { HubStatus } from "@/data/hubActivation";

export interface MapFiltersState {
  status: HubStatus | "all";
  type: "all" | "city" | "london_borough" | "metropolitan_borough";
  founding: "all" | "business" | "consumer";
}

interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (filters: MapFiltersState) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: HubStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Statuses", color: "text-gray-600" },
  { value: "active", label: "Active", color: "text-green-600" },
  { value: "making_progress", label: "Making Progress", color: "text-blue-600" },
  { value: "needs_activation", label: "Needs Activation", color: "text-amber-600" },
];

const TYPE_OPTIONS: { value: MapFiltersState["type"]; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "city", label: "Cities" },
  { value: "london_borough", label: "London Boroughs" },
  { value: "metropolitan_borough", label: "Metro Boroughs" },
];

const FOUNDING_OPTIONS: { value: MapFiltersState["founding"]; label: string; icon: typeof Building2 }[] = [
  { value: "all", label: "All", icon: Filter },
  { value: "business", label: "Business", icon: Building2 },
  { value: "consumer", label: "Consumer", icon: UserRound },
];

export function MapFilters({ filters, onChange, className }: MapFiltersProps) {
  const hasActiveFilters = filters.status !== "all" || filters.type !== "all" || filters.founding !== "all";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      {/* Status filter */}
      <div className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, status: opt.value })}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
              filters.status === opt.value
                ? opt.value === "all"
                  ? "bg-gray-100 text-gray-900"
                  : `${opt.color} bg-gray-50`
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={e => onChange({ ...filters, type: e.target.value as MapFiltersState["type"] })}
        className="rounded-lg border bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary-100"
      >
        {TYPE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Founding filter */}
      <div className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1">
        {FOUNDING_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, founding: opt.value })}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                filters.founding === opt.value
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title={opt.label}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ status: "all", type: "all", founding: "all" })}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
