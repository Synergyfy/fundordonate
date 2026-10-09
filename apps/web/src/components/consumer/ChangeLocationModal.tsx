import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  getAreaOptions,
  getCityOptions,
  getStreetOptions,
  type ExploreScope,
  type ScopeOption,
} from "@/data/consumerExploreData";
import type { ConsumerCommunity } from "@/data/consumerHomeData";

export interface LocationApplyPayload {
  scope: ExploreScope;
  community?: ConsumerCommunity;
}

interface ChangeLocationModalProps {
  open: boolean;
  initialScope: ExploreScope;
  currentLocationText: string;
  focusSearch?: boolean;
  onClose: () => void;
  onApply: (payload: LocationApplyPayload) => void;
  onUseMyLocation: () => void;
}

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

function filterOptions(list: ScopeOption[], query: string, selectedSlug?: string): ScopeOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (o) => o.slug === selectedSlug || o.name.toLowerCase().includes(q),
  );
}

export function ChangeLocationModal({
  open,
  initialScope,
  currentLocationText,
  focusSearch = false,
  onClose,
  onApply,
  onUseMyLocation,
}: ChangeLocationModalProps) {
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setCity(initialScope.citySlug ?? "");
    setArea(initialScope.areaSlug ?? "");
    setStreet(initialScope.streetSlug ?? "");
    setQuery("");
    if (focusSearch) searchRef.current?.focus();
  }, [open, focusSearch, initialScope.citySlug, initialScope.areaSlug, initialScope.streetSlug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const allCities = useMemo(() => getCityOptions(), []);
  const allAreas = useMemo(() => (city ? getAreaOptions(city) : []), [city]);
  const allStreets = useMemo(
    () => (city && area ? getStreetOptions(city, area) : []),
    [city, area],
  );

  const cities = filterOptions(allCities, query, city);
  const areas = filterOptions(allAreas, query, area);
  const streets = filterOptions(allStreets, query, street);

  if (!open) return null;

  const cityName = city ? allCities.find((o) => o.slug === city)?.name ?? city : undefined;
  const areaName = area ? allAreas.find((o) => o.slug === area)?.name ?? area : undefined;
  const streetName = street
    ? allStreets.find((o) => o.slug === street)?.name ?? street
    : undefined;

  const handleCityChange = (slug: string) => {
    setCity(slug);
    setArea("");
    setStreet("");
  };
  const handleAreaChange = (slug: string) => {
    setArea(slug);
    setStreet("");
  };

  const handleApply = () => {
    if (!city) return;
    const complete = Boolean(city && area && street && cityName && areaName && streetName);
    onApply({
      scope: {
        citySlug: city,
        areaSlug: area || undefined,
        streetSlug: street || undefined,
      },
      community:
        complete && cityName && areaName && streetName
          ? {
              citySlug: city,
              cityName,
              areaSlug: area,
              areaName,
              streetSlug: street,
              streetName,
            }
          : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change location"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Change location</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-500">
          Current: <span className="font-medium text-gray-700">{currentLocationText}</span>
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locations"
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">City</span>
            <select
              className={selectClass}
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Local Area</span>
            <select
              className={selectClass}
              value={area}
              disabled={!city}
              onChange={(e) => handleAreaChange(e.target.value)}
            >
              <option value="">All local areas</option>
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">High Street</span>
            <select
              className={selectClass}
              value={street}
              disabled={!area}
              onChange={(e) => setStreet(e.target.value)}
            >
              <option value="">All high streets</option>
              {streets.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onUseMyLocation}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
          >
            Use my location
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!city}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply location
          </button>
        </div>
      </div>
    </div>
  );
}
