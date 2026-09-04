// =============================================================================
// UK Hub Map — Search Component
// Search by location name with autocomplete dropdown.
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { HubLocation } from "@/data/hubActivation";

interface MapSearchProps {
  locations: HubLocation[];
  onSelect: (slug: string) => void;
  className?: string;
}

export function MapSearch({ locations, onSelect, className }: MapSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length >= 2
    ? locations.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.slug.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search locations…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsOpen(false); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {results.map(l => (
            <button
              key={l.id}
              onClick={() => { onSelect(l.slug); setQuery(""); setIsOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="flex-shrink-0 text-lg">
                {l.status === "active" ? "🟢" : l.status === "making_progress" ? "🔵" : "🟡"}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-900">{l.name}</span>
                <span className="block truncate text-xs text-gray-500">{l.type.replace(/_/g, " ")}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white p-4 text-center text-sm text-gray-500 shadow-lg">
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
