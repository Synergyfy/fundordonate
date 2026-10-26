// =============================================================================
// Admin — Founding Programmes Management Page
// Location-scoped business and consumer programmes backed by live API data.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, CheckCircle2, Gift, Loader2, Plus, RefreshCw, Trash2, UserRound, Users,
} from "lucide-react";
import { adminApi, type AdminLocation } from "@/services/admin";
import { FOUNDING_MEMBER_PILLARS } from "@/services/founding/foundingConfig";
import { formatCurrency, formatDate } from "@/utils/formatters";

type Tab = "programmes" | "members" | "benefits";

interface ProgrammeRow {
  id: string;
  locationId: string;
  locationName?: string;
  audience: "BUSINESS" | "CONSUMER";
  status: string;
  title: string;
  description?: string;
  totalAllocation: number;
  allocatedCount: number;
  remainingCount: number;
  memberCount: number;
  location?: { id: string; name: string; slug: string; type: string };
}

interface MembershipRow {
  id: string;
  memberName: string;
  email: string;
  programmeTitle: string;
  audience: "BUSINESS" | "CONSUMER";
  locationName: string;
  tier: string;
  status: string;
  contributionAmount: number;
  isMonthly?: boolean;
  grantedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LIMITED: "bg-amber-50 text-amber-700 border-amber-200",
  LIMIT_REACHED: "bg-orange-50 text-orange-700 border-orange-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
};

export function AdminFoundingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("programmes");
  const [programmes, setProgrammes] = useState<ProgrammeRow[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAudience, setFormAudience] = useState<"BUSINESS" | "CONSUMER">("BUSINESS");
  const [formLocationId, setFormLocationId] = useState("");
  const [formAllocation, setFormAllocation] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [programmeRows, membershipRows, locationsRes] = await Promise.all([
        adminApi.getFoundingProgrammes(),
        adminApi.getFoundingMemberships(),
        adminApi.getLocations({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setProgrammes(programmeRows || []);
      setMemberships(membershipRows || []);
      setLocations(locationsRes.items || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load founding programmes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityLocations = useMemo(
    () => locations.filter((location) => ["NATIONAL", "CITY", "BOROUGH", "DISTRICT", "LOCAL_AREA", "HIGH_STREET", "COMMERCIAL_AREA"].includes(location.type)),
    [locations],
  );

  const openCreate = () => {
    setShowCreateForm(true);
    setFormTitle("");
    setFormDescription("");
    setFormAudience("BUSINESS");
    setFormLocationId(cityLocations[0]?.id ?? "");
    setFormAllocation(50);
  };

  const handleCreate = async () => {
    if (!formLocationId || !formTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.createFoundingProgramme({
        locationId: formLocationId,
        audience: formAudience,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        totalAllocation: Number(formAllocation) || 0,
        status: "OPEN",
      });
      setShowCreateForm(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to create the programme.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (programme: ProgrammeRow) => {
    const nextStatus = programme.status === "OPEN" || programme.status === "LIMITED" ? "CLOSED" : "OPEN";
    setSaving(true);
    try {
      await adminApi.updateFoundingProgramme(programme.id, { status: nextStatus });
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to update the programme.");
    } finally {
      setSaving(false);
    }
  };

  const removeProgramme = async (programme: ProgrammeRow) => {
    if (!window.confirm(`Delete "${programme.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await adminApi.deleteFoundingProgramme(programme.id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete the programme.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <span>/</span>
            <span className="font-medium text-gray-900">Founding Programmes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Founding Programmes</h1>
          <p className="text-sm text-gray-500">
            {programmes.length} location-scoped programme{programmes.length === 1 ? "" : "s"} ·{" "}
            {memberships.length} membership{memberships.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={showCreateForm ? () => setShowCreateForm(false) : openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? "Cancel" : "Add Programme"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
        {([
          ["programmes", "Programmes"],
          ["members", "Members"],
          ["benefits", "Benefits"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showCreateForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">New Founding Programme</h2>
          <p className="mt-1 text-xs text-gray-500">
            A location can have one business programme and one consumer programme.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="e.g. Manchester Founding Business Member Programme"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
              <select
                value={formAudience}
                onChange={(event) => setFormAudience(event.target.value as "BUSINESS" | "CONSUMER")}
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="BUSINESS">Business</option>
                <option value="CONSUMER">Consumer</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <select
                value={formLocationId}
                onChange={(event) => setFormLocationId(event.target.value)}
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="">Select location</option>
                {cityLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} · {location.type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total allocation</label>
              <input
                type="number"
                min={0}
                value={formAllocation}
                onChange={(event) => setFormAllocation(Number(event.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !formLocationId || !formTitle.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Create Programme
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : activeTab === "programmes" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {programmes.map((programme) => {
            const business = programme.audience === "BUSINESS";
            const fillPct = programme.totalAllocation > 0
              ? Math.round((programme.allocatedCount / programme.totalAllocation) * 100)
              : 0;
            return (
              <div key={programme.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-2 ${business ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {business ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {programme.audience} · {programme.locationName || programme.location?.name}
                      </div>
                      <h3 className="font-bold text-gray-900">{programme.title}</h3>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[programme.status] || STATUS_STYLES.CLOSED}`}>
                    {programme.status.replace("_", " ")}
                  </span>
                </div>

                {programme.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{programme.description}</p>
                )}

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{programme.allocatedCount} / {programme.totalAllocation} allocated</span>
                    <span>{fillPct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(100, fillPct)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {programme.remainingCount} place{programme.remainingCount === 1 ? "" : "s"} remaining ·{" "}
                    {programme.memberCount} recorded member{programme.memberCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t pt-3">
                  <Link
                    to={`/founding/${programme.location?.slug || programme.locationId}?audience=${programme.audience.toLowerCase()}`}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View public page →
                  </Link>
                  <button
                    onClick={() => toggleStatus(programme)}
                    disabled={saving}
                    className="ml-auto rounded-lg border px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {programme.status === "OPEN" || programme.status === "LIMITED" ? "Close" : "Open"}
                  </button>
                  <button
                    onClick={() => removeProgramme(programme)}
                    disabled={saving || programme.memberCount > 0}
                    title={programme.memberCount > 0 ? "Programmes with members can only be closed" : "Delete programme"}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {programmes.length === 0 && (
            <div className="sm:col-span-2 rounded-xl border border-dashed bg-white p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-700">No founding programmes yet.</p>
              <p className="mt-1 text-xs text-gray-500">Create one to open founding membership for a city or local area.</p>
            </div>
          )}
        </div>
      ) : activeTab === "members" ? (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-3 font-medium text-gray-500">Member</th>
                <th className="px-3 py-3 font-medium text-gray-500">Programme</th>
                <th className="hidden px-3 py-3 font-medium text-gray-500 md:table-cell">Location</th>
                <th className="px-3 py-3 font-medium text-gray-500">Status</th>
                <th className="hidden px-3 py-3 font-medium text-gray-500 sm:table-cell">Contribution</th>
                <th className="hidden px-3 py-3 font-medium text-gray-500 md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {memberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{membership.memberName}</p>
                    <p className="text-xs text-gray-400">{membership.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-medium text-gray-700">{membership.programmeTitle}</p>
                    <span className={`text-[10px] font-semibold uppercase ${membership.audience === "BUSINESS" ? "text-blue-600" : "text-emerald-600"}`}>
                      {membership.audience}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-gray-500 md:table-cell">{membership.locationName}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      {membership.status}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-xs font-medium text-gray-700 sm:table-cell">
                    {formatCurrency(membership.contributionAmount)}
                    {membership.isMonthly ? " / month" : ""}
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-gray-500 md:table-cell">
                    {formatDate(membership.grantedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {memberships.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">No founding memberships recorded yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Benefits are attached per programme. These pillars describe the standard founding member offer.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDING_MEMBER_PILLARS.map((pillar) => (
              <div key={pillar.key} className="rounded-xl border bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pillar.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pillar.title}</h3>
                    <p className="text-xs text-gray-500">{pillar.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Per-programme benefits</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {programmes.flatMap((programme) =>
                (programme as any).benefits?.map((benefit: string) => (
                  <span key={`${programme.id}-${benefit}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {benefit}
                  </span>
                )) ?? [],
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
