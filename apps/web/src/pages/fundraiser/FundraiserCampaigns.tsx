import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fundraiserApi } from "@/services/fundraiser.service";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";

interface Campaign {
  id: string;
  title: string;
  slug: string;
  status: string;
  mode: string;
  goalAmount: number;
  raisedAmount: number;
  createdAt: string;
  _count: { donations: number; pledges: number; updates: number };
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);
const formatDate = (d: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

const STATUS_OPTIONS: { value: string; label: string }[] = [
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

export function FundraiserCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fundraiserApi.getCampaigns({ page, limit: 15, status: statusFilter || undefined });
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
        <Link to="/campaigns/create" className="btn-primary text-sm">+ New Campaign</Link>
      </div>

      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-44">
        <option value="">All Status</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <div className="space-y-3">
        {loading && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        )}
        {!loading && campaigns.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400">No campaigns yet.</p>
            <Link to="/campaigns/create" className="btn-primary mt-4 inline-block">Create Your First Campaign</Link>
          </div>
        )}
        {!loading && campaigns.map((c) => {
          const pct = c.goalAmount > 0 ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100) : 0;
          return (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/campaigns/${c.slug}`} className="text-base font-semibold text-gray-900 hover:text-primary-600 truncate">{c.title}</Link>
                    <CampaignStatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span>{c.mode}</span>
                    <span>Created {formatDate(c.createdAt)}</span>
                    <span>{c._count.donations} donations</span>
                    <span>{c._count.pledges} pledges</span>
                    <span>{c._count.updates} updates</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.raisedAmount)}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{pct.toFixed(0)}% of {formatCurrency(c.goalAmount)}</p>
                  </div>
                  <Link to={`/campaigns/${c.slug}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">View</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
