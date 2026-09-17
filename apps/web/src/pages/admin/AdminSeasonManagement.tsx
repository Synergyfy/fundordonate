// =============================================================================
// Admin — Season Management Page
// Create, edit, close seasons. View season performance and spillover rules.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Play, CheckCircle, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

interface Season {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  order: number;
  campaignCount?: number;
  totalRaised?: number;
  totalGoal?: number;
  createdAt: string;
}

interface SeasonFormData {
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  order: number;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  active: { color: "text-green-700", bg: "bg-green-100", icon: <Play className="h-3 w-3" /> },
  upcoming: { color: "text-blue-700", bg: "bg-blue-100", icon: <Calendar className="h-3 w-3" /> },
  completed: { color: "text-gray-700", bg: "bg-gray-100", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { color: "text-red-700", bg: "bg-red-100", icon: <AlertTriangle className="h-3 w-3" /> },
};

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const DEFAULT_FORM: SeasonFormData = {
  name: "",
  slug: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "upcoming",
  order: 0,
};

export function AdminSeasonManagement() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const loadSeasons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/taxonomy/seasons");
      setSeasons(res.data.data || []);
    } catch {
      // Demo fallback
      setSeasons([
        {
          id: "spring-2026",
          name: "Spring 2026",
          slug: "spring-2026",
          description: "Spring funding season for UK Hub Activation",
          startDate: "2026-03-01",
          endDate: "2026-05-31",
          status: "active",
          order: 1,
          campaignCount: 12,
          totalRaised: 234500,
          totalGoal: 500000,
          createdAt: "2026-01-15",
        },
        {
          id: "summer-2026",
          name: "Summer 2026",
          slug: "summer-2026",
          description: "Summer funding season",
          startDate: "2026-06-01",
          endDate: "2026-08-31",
          status: "upcoming",
          order: 2,
          campaignCount: 0,
          totalRaised: 0,
          totalGoal: 0,
          createdAt: "2026-01-15",
        },
        {
          id: "christmas-2026",
          name: "Christmas 2026",
          slug: "christmas-2026",
          description: "End-of-year giving season",
          startDate: "2026-11-01",
          endDate: "2026-12-31",
          status: "upcoming",
          order: 3,
          campaignCount: 0,
          totalRaised: 0,
          totalGoal: 0,
          createdAt: "2026-01-15",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSeasons(); }, [loadSeasons]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/taxonomy/seasons/${editingId}`, form);
      } else {
        await api.post("/taxonomy/seasons", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      loadSeasons();
    } catch {
      // Ignore — demo mode
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (season: Season) => {
    setForm({
      name: season.name,
      slug: season.slug,
      description: season.description || "",
      startDate: season.startDate ? season.startDate.split("T")[0] || "" : "",
      endDate: season.endDate ? season.endDate.split("T")[0] || "" : "",
      status: season.status,
      order: season.order,
    });
    setEditingId(season.id);
    setShowForm(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/taxonomy/seasons/${id}`, { status });
      loadSeasons();
    } catch {
      // Ignore — demo mode
    }
  };

  const activeSeason = seasons.find((s) => s.status === "active");
  const totalRaised = seasons.reduce((sum, s) => sum + (s.totalRaised || 0), 0);
  const totalCampaigns = seasons.reduce((sum, s) => sum + (s.campaignCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Season Management</h1>
          <p className="text-sm text-gray-500">Manage funding seasons and their lifecycle</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(DEFAULT_FORM); }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Season"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{seasons.length}</div>
          <div className="text-xs text-gray-500">Total Seasons</div>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{activeSeason ? 1 : 0}</div>
          <div className="text-xs text-gray-500">Active Season</div>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{totalCampaigns}</div>
          <div className="text-xs text-gray-500">Total Campaigns</div>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalRaised)}</div>
          <div className="text-xs text-gray-500">Total Raised</div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? "Edit Season" : "Create New Season"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
                placeholder="e.g. Spring 2027"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
                placeholder="spring-2027"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Season" : "Create Season"}
            </button>
          </div>
        </div>
      )}

      {/* Seasons List */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Season</th>
              <th className="px-4 py-3 font-medium text-gray-500">Dates</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Campaigns</th>
              <th className="px-4 py-3 font-medium text-gray-500">Progress</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            )}
            {!loading && seasons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No seasons found.</td>
              </tr>
            )}
            {!loading && seasons.map((s) => {
              const style = STATUS_STYLES[s.status] || STATUS_STYLES.upcoming || { color: "text-gray-600", bg: "bg-gray-100", icon: null };
              const progress = s.totalGoal && s.totalGoal > 0
                ? Math.min(Math.round((s.totalRaised || 0) / s.totalGoal * 100), 100)
                : 0;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.description || s.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(s.startDate || null)} — {formatDate(s.endDate || null)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.color}`}>
                      {style.icon}
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.campaignCount || 0}</td>
                  <td className="px-4 py-3">
                    {s.totalGoal && s.totalGoal > 0 ? (
                      <div>
                        <div className="text-xs text-gray-500">{formatCurrency(s.totalRaised || 0)} / {formatCurrency(s.totalGoal)}</div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleEdit(s)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                        Edit
                      </button>
                      {s.status === "upcoming" && (
                        <button onClick={() => handleStatusChange(s.id, "active")} className="text-xs font-medium text-green-600 hover:text-green-700">
                          Activate
                        </button>
                      )}
                      {s.status === "active" && (
                        <button onClick={() => handleStatusChange(s.id, "completed")} className="text-xs font-medium text-amber-600 hover:text-amber-700">
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
