import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "@/services/admin.service";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";
import type {
  CampaignStatus as CampaignStatusType,
} from "@fundordonate/types";

const STATUS_TRANSITIONS: Record<CampaignStatusType, CampaignStatusType[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["pending_review", "rejected", "cancelled"],
  pending_review: ["approved", "rejected"],
  approved: ["published", "cancelled"],
  published: ["active", "paused", "cancelled", "archived"],
  active: ["paused", "completed", "cancelled", "expired"],
  paused: ["active", "cancelled"],
  completed: ["archived"],
  cancelled: ["draft", "archived"],
  expired: ["archived", "draft"],
  archived: ["draft"],
  rejected: ["draft", "cancelled"],
};

interface CampaignRow {
  id: string;
  title: string;
  slug: string;
  status: CampaignStatusType;
  mode: string;
  goalAmount: number;
  raisedAmount: number;
  author: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
  _count: { donations: number; pledges: number };
  isFeatured?: boolean;
  isVisible?: boolean;
  location?: string;
  season?: string;
  isSelfFunding?: boolean;
}

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

const CAMPAIGN_MODES: string[] = ["donation", "crowdfunding", "fund", "sponsor"];

const STATUS_OPTIONS: { value: CampaignStatusType; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
  { value: "rejected", label: "Rejected" },
];

export function CampaignsManagement() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<CampaignRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCampaigns({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        mode: modeFilter || undefined,
      });
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.totalPages);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, modeFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTransition = async (id: string, status: string) => {
    try {
      await adminApi.updateCampaignStatus(id, status);
      await load();
    } catch {
      /* ignore */
    }
  };

  const validTargets = selected ? (STATUS_TRANSITIONS[selected.status] ?? []) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{campaigns.length} campaigns</span>
          <button onClick={() => navigate("/admin/campaigns/new")} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            + Create Campaign
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search campaigns..."
          className="input-field"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={modeFilter}
          onChange={(e) => { setModeFilter(e.target.value); setPage(1); }}
          className="input-field"
        >
          <option value="">All Modes</option>
          {CAMPAIGN_MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Campaign</th>
              <th className="px-3 py-3 font-medium text-gray-500">Owner</th>
              <th className="px-3 py-3 font-medium text-gray-500">Mode</th>
              <th className="px-3 py-3 font-medium text-gray-500">Progress</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            )}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">No campaigns found.</td>
              </tr>
            )}
            {!loading && campaigns.map((c) => {
              const pct = c.goalAmount > 0 ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100) : 0;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <Link to={`/campaigns/${c.slug}`} className="font-semibold text-gray-800 hover:text-primary-600">{c.title}</Link>
                    <p className="text-xs text-gray-400">{c._count.donations} donations · {c._count.pledges} pledges</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.isFeatured && <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Featured</span>}
                      {c.isVisible === false && <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">Hidden</span>}
                      {c.location && <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">{c.location}</span>}
                      {c.season && <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">{c.season}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {c.author ? `${c.author.firstName} ${c.author.lastName}` : "N/A"}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 capitalize">{c.mode}</td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.raisedAmount)}</p>
                    <p className="text-xs text-gray-400">{pct.toFixed(0)}% of {formatCurrency(c.goalAmount)}</p>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <CampaignStatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => navigate(`/admin/campaigns/${c.id}/edit`)} className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50">
                        Edit
                      </button>
                      <button onClick={() => setSelected(c)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <CampaignStatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mode</span>
                <span className="text-gray-800 capitalize">{selected.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Raised</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selected.raisedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Goal</span>
                <span className="text-gray-800">{formatCurrency(selected.goalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Owner</span>
                <span className="text-gray-800">{selected.author ? `${selected.author.firstName} ${selected.author.lastName}` : "N/A"}</span>
              </div>
            </div>

            {validTargets.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {validTargets.map((target) => (
                    <button
                      key={target}
                      onClick={() => { handleTransition(selected.id, target); setSelected(null); }}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                    >
                      {target.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Link
                to={`/campaigns/${selected.slug}`}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => setSelected(null)}
              >
                View Campaign
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
