import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { DEMO_HUB_EVENTS } from "@/data/ukHubData";
import { ALL_LOCATIONS } from "@/data/ukHubData";
import type { HubEvent } from "@/types/uk-hub";

type ScopeFilter = "" | "NATIONAL" | "CITY" | "CAMPAIGN";

interface EventFormData {
  title: string;
  description: string;
  scope: "NATIONAL" | "CITY" | "CAMPAIGN";
  citySlug: string;
  eventDate: string;
  venue: string;
  isPublic: boolean;
}

const INITIAL_FORM: EventFormData = {
  title: "",
  description: "",
  scope: "CITY",
  citySlug: "",
  eventDate: "",
  venue: "",
  isPublic: true,
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

const formatDate = (d: string | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d)) : "—";

const cities = ALL_LOCATIONS.filter((l) => l.type === "CITY");

function getEventScope(event: HubEvent): "NATIONAL" | "CITY" | "CAMPAIGN" {
  if (event.locationId === "uk-national") return "NATIONAL";
  if (event.locationId.startsWith("campaign-")) return "CAMPAIGN";
  return "CITY";
}

function getCityName(locationId: string): string {
  const city = ALL_LOCATIONS.find((l) => l.id === locationId);
  return city?.name || locationId;
}

const EXTRA_EVENTS: HubEvent[] = [
  {
    id: "he-3", locationId: "uk-national",
    title: "UK Hub National Launch",
    description: "The official launch of the UK Hub Activation Programme across all cities.",
    eventDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: "PUBLISHED",
    ctaLabel: "Register",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS", "CONSUMER"] }),
    createdAt: new Date().toISOString(),
  },
  {
    id: "he-4", locationId: "city-london",
    title: "London High Street Meetup",
    description: "Monthly meetup for London high street businesses and community members.",
    eventDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: "PUBLISHED",
    ctaLabel: "Join",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS", "CONSUMER"] }),
    createdAt: new Date().toISOString(),
  },
  {
    id: "he-5", locationId: "city-manchester",
    title: "Manchester Community Hub Workshop",
    description: "Workshop on setting up your local hub and maximising community engagement.",
    eventDate: new Date(Date.now() + 35 * 86400000).toISOString(),
    status: "DRAFT",
    ctaLabel: "Sign Up",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["CONSUMER"] }),
    createdAt: new Date().toISOString(),
  },
  {
    id: "he-6", locationId: "city-birmingham",
    title: "Birmingham Founding Members Evening",
    description: "Exclusive evening for Birmingham founding members to network and share feedback.",
    eventDate: new Date(Date.now() + 18 * 86400000).toISOString(),
    status: "PUBLISHED",
    ctaLabel: "RSVP",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["CONSUMER"] }),
    createdAt: new Date().toISOString(),
  },
  {
    id: "he-7", locationId: "city-leeds",
    title: "Leeds Business Partner Launch",
    description: "Launch event for Leeds business partners to learn about co-branded hub opportunities.",
    eventDate: new Date(Date.now() + 45 * 86400000).toISOString(),
    status: "DRAFT",
    ctaLabel: "Learn More",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS"] }),
    createdAt: new Date().toISOString(),
  },
  {
    id: "he-8", locationId: "city-liverpool",
    title: "Liverpool Hub Activation Day",
    description: "Community activation day with founding membership sign-ups and local business showcases.",
    eventDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    status: "PUBLISHED",
    ctaLabel: "Attend",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS", "CONSUMER"] }),
    createdAt: new Date().toISOString(),
  },
];

const ALL_EVENTS = [...DEMO_HUB_EVENTS, ...EXTRA_EVENTS];

export function EventsManagementPage() {
  const [events, setEvents] = useState<HubEvent[]>(ALL_EVENTS);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM);
  const [selected, setSelected] = useState<HubEvent | null>(null);

  const filtered = useMemo(() => {
    let list = events;
    if (scopeFilter) {
      list = list.filter((e) => getEventScope(e) === scopeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, scopeFilter, search]);

  const handleCreate = () => {
    if (!formData.title.trim()) return;
    const newEvent: HubEvent = {
      id: `he-${Date.now()}`,
      locationId: formData.scope === "NATIONAL" ? "uk-national" : formData.scope === "CITY" ? `city-${formData.citySlug}` : "campaign-1",
      title: formData.title,
      description: formData.description,
      eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
      status: "DRAFT",
      ctaLabel: "Register Interest",
      ctaUrl: "#",
      eligibleAudience: JSON.stringify({ audiences: ["BUSINESS", "CONSUMER"] }),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    setFormData(INITIAL_FORM);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this event?")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" } : e
      )
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">{filtered.length} events</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Create Event"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Event</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                className="input-field w-full"
                placeholder="Event title"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="input-field w-full"
                rows={3}
                placeholder="Event description"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Scope</label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData((f) => ({ ...f, scope: e.target.value as EventFormData["scope"] }))}
                  className="input-field w-full"
                >
                  <option value="NATIONAL">National</option>
                  <option value="CITY">City</option>
                  <option value="CAMPAIGN">Campaign</option>
                </select>
              </div>
              {formData.scope === "CITY" && (
                <div>
                  <label className="label">City</label>
                  <select
                    value={formData.citySlug}
                    onChange={(e) => setFormData((f) => ({ ...f, citySlug: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData((f) => ({ ...f, eventDate: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Venue</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData((f) => ({ ...f, venue: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Venue (optional)"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData((f) => ({ ...f, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Public event</span>
                </label>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Create Event
            </button>
          </div>
        </div>
      )}

      {/* Scope Tabs */}
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
        placeholder="Search events..."
        className="input-field w-full"
      />

      {/* Event Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm border border-gray-100">
            No events found.
          </div>
        )}
        {filtered.map((e) => {
          const scope = getEventScope(e);
          const isPast = e.eventDate ? new Date(e.eventDate) < new Date() : false;
          return (
            <div key={e.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[scope]}`}>
                      {scope}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {e.status}
                    </span>
                    {isPast && (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                        Past
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900 truncate">{e.title}</h3>
                  {e.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{e.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                    <span>{formatDate(e.eventDate)}</span>
                    {scope === "CITY" && <span>{getCityName(e.locationId)}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSelected(e)}
                  className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
                >
                  Details
                </button>
                <button
                  onClick={() => handleToggleStatus(e.id)}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  {e.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="text-gray-800 font-medium">{selected.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Scope</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[getEventScope(selected)]}`}>{getEventScope(selected)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${selected.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{selected.status}</span></div>
              {selected.description && <div><span className="text-gray-500">Description</span><p className="mt-1 text-gray-800">{selected.description}</p></div>}
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-800">{formatDate(selected.eventDate)}</span></div>
              {getEventScope(selected) === "CITY" && (
                <div className="flex justify-between"><span className="text-gray-500">City</span><span className="text-gray-800">{getCityName(selected.locationId)}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
