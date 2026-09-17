// =============================================================================
// Admin — Locations Management Page
// List, filter, and manage all UK Hub locations.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { ALL_LOCATIONS } from "@/data/ukHubData";
import { LocationHierarchyTree } from "@/components/admin/LocationHierarchyTree";
import { LocationForm } from "@/components/admin/LocationForm";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";
import type { LocationPublicStatus } from "@/types/uk-hub";
import type { LocationFormData } from "@/components/admin/LocationForm";

export function AdminLocationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LocationPublicStatus | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [view, setView] = useState<"list" | "tree">("list");

  const filtered = useMemo(() => {
    return ALL_LOCATIONS.filter(l => {
      if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "all" && l.publicStatus !== statusFilter) return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

  const handleCreate = (data: LocationFormData) => {
    console.log("Create location:", data);
    setShowCreateForm(false);
    // TODO: API call
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UK Hub Locations</h1>
          <p className="text-sm text-gray-500">{ALL_LOCATIONS.length} locations in the hierarchy</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add Location"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <LocationForm
          allLocations={ALL_LOCATIONS}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search locations…"
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as LocationPublicStatus | "all")}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="MAKING_PROGRESS">Making Progress</option>
           <option value="NEEDS_ACTIVATION">Inactive</option>
        </select>
        <div className="flex rounded-lg border">
          <button
            onClick={() => setView("list")}
            className={`rounded-l-lg px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-primary-50 text-primary-700" : "text-gray-500"}`}
          >
            List
          </button>
          <button
            onClick={() => setView("tree")}
            className={`rounded-r-lg px-3 py-1.5 text-sm font-medium ${view === "tree" ? "bg-primary-50 text-primary-700" : "text-gray-500"}`}
          >
            Tree
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "tree" ? (
        <LocationHierarchyTree locations={ALL_LOCATIONS} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Parent</th>
                <th className="px-4 py-3 font-medium text-gray-600">Funding</th>
                <th className="px-4 py-3 font-medium text-gray-600">Founding</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(l => {
                const statusMeta = LOCATION_PUBLIC_STATUS_META[l.publicStatus];
                const parent = l.parentId ? ALL_LOCATIONS.find(p => p.id === l.parentId) : null;
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{l.type === "CITY" ? "🏙️" : l.type === "BOROUGH" ? "🏘️" : "📍"}</span>
                        <div>
                          <Link to={`/admin/hub-locations/${l.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                            {l.name}
                          </Link>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{l.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{l.type}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: statusMeta.bgColor, color: statusMeta.color }}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{parent?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">£{(l.fundingRaised / 100).toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-gray-500">
                      🏢 {l.foundingBusinessAllocated}/{l.foundingBusinessTotal}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link to={`/admin/hub-locations/${l.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                          Edit →
                        </Link>
                        <Link
                          to={`/admin/campaigns/new?locationId=${l.id}&hierarchyLevel=${l.type === "CITY" ? "city" : l.type === "BOROUGH" ? "borough" : "high_street"}&locationName=${encodeURIComponent(l.name)}`}
                          className="text-green-600 hover:text-green-700 text-xs font-medium"
                        >
                          + Campaign →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No locations match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
