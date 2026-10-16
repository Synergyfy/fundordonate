// =============================================================================
// Admin — Locations Management Page
// List, filter, and manage all UK Hub locations.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import type { AdminLocation } from "@/services/admin/type";

export function AdminLocationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: locationsData, isLoading, refetch } = useQuery({
    queryKey: ["admin-locations-list"],
    queryFn: () => adminApi.getLocations({ limit: 100 }),
  });

  const locations = locationsData?.items || [];

  const filtered = useMemo(() => {
    return locations.filter((l) => {
      if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      return true;
    });
  }, [locations, searchQuery, typeFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UK Hub Locations</h1>
          <p className="text-sm text-gray-500">{locations.length} locations registered in the database</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Types</option>
          <option value="CITY">City</option>
          <option value="LOCAL_AREA">Local Area / Borough</option>
          <option value="HIGH_STREET">High Street</option>
        </select>
      </div>

      {/* Locations Table */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            No locations found matching your filter.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Location Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Parent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      l.activationStatus === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {l.activationStatus || "DRAFT"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.parentId || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/locations/${l.id}`}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
