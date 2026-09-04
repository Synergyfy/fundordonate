import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ALL_LOCATIONS } from "@/data/ukHubData";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";
import type { LocationPublicStatus } from "@/types/uk-hub";

type VisibilityFilter = "" | "VISIBLE" | "HIDDEN";

interface MapMarker {
  id: string;
  name: string;
  slug: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  mapZoomLevel: number | null;
  mapVisible: boolean;
  publicStatus: LocationPublicStatus;
  fundingRaised: number;
  foundingBusinessAllocated: number;
  foundingBusinessTotal: number;
}

function buildMarkers(): MapMarker[] {
  return ALL_LOCATIONS.filter((l) => l.type === "CITY").map((loc) => ({
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    type: loc.type,
    latitude: loc.latitude ?? null,
    longitude: loc.longitude ?? null,
    mapZoomLevel: loc.mapZoomLevel ?? null,
    mapVisible: loc.mapVisible,
    publicStatus: loc.publicStatus,
    fundingRaised: loc.fundingRaised,
    foundingBusinessAllocated: loc.foundingBusinessAllocated,
    foundingBusinessTotal: loc.foundingBusinessTotal,
  }));
}

const ALL_MARKERS = buildMarkers();

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MAKING_PROGRESS: "bg-blue-100 text-blue-700",
  NEEDS_ACTIVATION: "bg-yellow-100 text-yellow-700",
};

export function MapManagementPage() {
  const [markers, setMarkers] = useState<MapMarker[]>(ALL_MARKERS);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editZoom, setEditZoom] = useState<number>(6);
  const [editVisible, setEditVisible] = useState(true);

  const filtered = useMemo(() => {
    let list = markers;
    if (visibilityFilter === "VISIBLE") list = list.filter((m) => m.mapVisible);
    if (visibilityFilter === "HIDDEN") list = list.filter((m) => !m.mapVisible);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [markers, visibilityFilter, search]);

  const visibleCount = markers.filter((m) => m.mapVisible).length;
  const hiddenCount = markers.length - visibleCount;
  const avgZoom = markers.length > 0 ? Math.round(markers.reduce((s, m) => s + (m.mapZoomLevel || 6), 0) / markers.length) : 6;

  const handleSave = (id: string) => {
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, mapZoomLevel: editZoom, mapVisible: editVisible } : m
      )
    );
    setEditingId(null);
  };

  const startEdit = (m: MapMarker) => {
    setEditingId(m.id);
    setEditZoom(m.mapZoomLevel || 6);
    setEditVisible(m.mapVisible);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UK Map Management</h1>
          <p className="text-sm text-gray-500">{markers.length} map markers across the UK</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Visible</span>
          <p className="mt-1 text-lg font-bold text-green-700">{visibleCount}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Hidden</span>
          <p className="mt-1 text-lg font-bold text-gray-500">{hiddenCount}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Avg Zoom</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{avgZoom}</p>
        </div>
      </div>

      {/* Visibility Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["", "VISIBLE", "HIDDEN"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVisibilityFilter(v)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              visibilityFilter === v ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {v || "All"}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by city name..."
        className="input-field w-full"
      />

      {/* Markers Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">City</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Coordinates</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Zoom</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Visible</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Founding</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  No markers found.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <Link to={`/admin/hub-locations/${m.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                    {m.name}
                  </Link>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.publicStatus] || "bg-gray-100 text-gray-600"}`}>
                    {LOCATION_PUBLIC_STATUS_META[m.publicStatus]?.label || m.publicStatus}
                  </span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  {m.latitude != null && m.longitude != null ? (
                    <span className="font-mono text-xs text-gray-500">
                      {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-sm text-gray-600">
                  {m.mapZoomLevel || "—"}
                </td>
                <td className="px-3 py-3 hidden lg:table-cell">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.mapVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {m.mapVisible ? "Visible" : "Hidden"}
                  </span>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-500">
                  {m.foundingBusinessAllocated}/{m.foundingBusinessTotal}
                </td>
                <td className="px-3 py-3">
                  {editingId === m.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={editZoom}
                        onChange={(e) => setEditZoom(Number(e.target.value))}
                        className="w-14 rounded border px-2 py-1 text-xs text-center"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={editVisible}
                          onChange={(e) => setEditVisible(e.target.checked)}
                          className="rounded"
                        />
                        Public
                      </label>
                      <button onClick={() => handleSave(m.id)} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-50">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(m)} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
