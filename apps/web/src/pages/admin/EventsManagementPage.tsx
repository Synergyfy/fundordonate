import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { adminApi, type AdminEvent, type AdminLocation } from "@/services/admin";
import { formatDate } from "@/utils/formatters";

type ScopeFilter = "" | "NATIONAL" | "CITY" | "CAMPAIGN";

interface EventFormData {
  title: string;
  description: string;
  scope: "NATIONAL" | "CITY" | "CAMPAIGN";
  locationId: string;
  eventDate: string;
  venue: string;
  isPublished: boolean;
}

const INITIAL_FORM: EventFormData = {
  title: "",
  description: "",
  scope: "CITY",
  locationId: "",
  eventDate: "",
  venue: "",
  isPublished: true,
};

const SCOPE_COLORS: Record<string, string> = {
  NATIONAL: "bg-purple-100 text-purple-700",
  CITY: "bg-blue-100 text-blue-700",
  CAMPAIGN: "bg-amber-100 text-amber-700",
};

const SCOPE_OPTIONS: { value: ScopeFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "NATIONAL", label: "National" },
  { value: "CITY", label: "City" },
  { value: "CAMPAIGN", label: "Campaign" },
];

export function EventsManagementPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [cities, setCities] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<EventFormData>(INITIAL_FORM);
  const [selected, setSelected] = useState<AdminEvent | null>(null);

  const fetchEventsAndCities = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, citiesRes] = await Promise.all([
        adminApi.getEvents({
          scope: scopeFilter || undefined,
          search: search || undefined,
        }),
        adminApi.getLocations({ type: "CITY", limit: 50 }).catch(() => ({ items: [] })),
      ]);
      setEvents(eventsRes.items || (eventsRes as any).events || []);
      setCities(citiesRes.items || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, search]);

  useEffect(() => {
    fetchEventsAndCities();
  }, [fetchEventsAndCities]);

  const handleCreate = async () => {
    if (!form.title || !form.eventDate) return;
    try {
      await adminApi.createEvent({
        title: form.title,
        description: form.description,
        scope: form.scope,
        locationId: form.locationId || undefined,
        eventDate: form.eventDate,
        venue: form.venue || undefined,
        isPublished: form.isPublished,
      });
      setShowCreate(false);
      setForm(INITIAL_FORM);
      fetchEventsAndCities();
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const scopeCounts = useMemo(() => {
    const c: Record<string, number> = { NATIONAL: 0, CITY: 0, CAMPAIGN: 0 };
    events.forEach((e) => {
      const sc = (e.scope || "CITY").toUpperCase();
      if (c[sc] !== undefined) c[sc]++;
    });
    return c;
  }, [events]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-sm text-gray-500">{events.length} hub and campaign events</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {showCreate ? "Cancel" : "Create Event"}
        </button>
      </div>

      {/* Scope KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {(["NATIONAL", "CITY", "CAMPAIGN"] as const).map((s) => (
          <div key={s} className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[s]}`}>{s}</span>
            <p className="mt-1 text-lg font-bold text-gray-900">{scopeCounts[s] || 0}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">New Hub Event</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Event title"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="label">Scope</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as any })}
                className="input-field w-full"
              >
                <option value="NATIONAL">National</option>
                <option value="CITY">City Hub</option>
                <option value="CAMPAIGN">Campaign</option>
              </select>
            </div>
            {form.scope === "CITY" && (
              <div>
                <label className="label">City Hub</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">Event Date</label>
              <DatePicker
                value={form.eventDate}
                onChange={(e: any) => setForm({ ...form, eventDate: e?.target?.value ?? e })}
                placeholder="Select date"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Venue / Meeting URL</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. Town Hall, Birmingham or Zoom URL"
                className="input-field w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Event details..."
                rows={3}
                className="input-field w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleCreate} className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700">
              Create Event
            </button>
          </div>
        </div>
      )}

      {/* Scope Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setScopeFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              scopeFilter === opt.value ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search events by title or venue..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Event</th>
              <th className="px-3 py-3 font-medium text-gray-500">Scope</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">City / Venue</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">Loading events...</td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">No events found.</td>
              </tr>
            ) : (
              events.map((e) => {
                const scope = (e.scope || "CITY").toUpperCase();
                const cityName = e.location?.name || "National";
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-gray-800">{e.title}</p>
                      {e.description && <p className="text-xs text-gray-400 truncate max-w-xs">{e.description}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[scope] || "bg-gray-100 text-gray-700"}`}>
                        {scope}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-gray-600">
                      {cityName} {e.venue ? `• ${e.venue}` : ""}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-600">
                      {formatDate(e.eventDate)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(e)}
                          className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
                          title="Delete Event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Scope</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[(selected.scope || "CITY").toUpperCase()]}`}>
                  {selected.scope}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="text-gray-800">{selected.location?.name || "National"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-800 font-medium">{formatDate(selected.eventDate)}</span>
              </div>
              {selected.venue && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Venue</span>
                  <span className="text-gray-800">{selected.venue}</span>
                </div>
              )}
              {selected.description && (
                <div className="border-t pt-2">
                  <span className="text-xs text-gray-500">Description:</span>
                  <p className="mt-1 text-xs text-gray-700">{selected.description}</p>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => handleDelete(selected.id)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Delete Event
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
