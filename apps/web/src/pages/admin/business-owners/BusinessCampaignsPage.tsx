// =============================================================================
// Business Campaigns — Admin
// Campaigns created and run by business owners (live database data).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Target, X, Users, TrendingUp } from "lucide-react";
import { adminApi, type AdminCampaign } from "@/services/admin";

interface FormattedCampaign {
  id: string;
  title: string;
  owner: string;
  business: string;
  city: string;
  mode: "donation" | "fund";
  status: string;
  raised: number; // £
  target: number; // £
  backers: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  "PENDING REVIEW": "bg-amber-100 text-amber-700",
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export function BusinessCampaignsPage() {
  const [campaigns, setCampaigns] = useState<FormattedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<FormattedCampaign | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchCampaigns() {
      setLoading(true);
      try {
        const res = await adminApi.getCampaigns({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          limit: 50,
        });
        if (!mounted) return;
        const items = res?.items || [];
        const mapped: FormattedCampaign[] = items.map((c: any) => ({
          id: c.id,
          title: c.title || "Untitled Campaign",
          owner: c.business?.owner?.name || c.author?.name || c.business?.name || "Business Owner",
          business: c.business?.name || "Independent",
          city: c.business?.city || c.cityName || "United Kingdom",
          mode: (c.mode || "fund").toLowerCase() === "donate" ? "donation" : "fund",
          status: (c.status || "ACTIVE").toUpperCase(),
          raised: Math.round((c.raisedAmount || 0) / 100),
          target: Math.round((c.targetAmount || 0) / 100),
          backers: c.backerCount || c.backersCount || 0,
          createdAt: c.createdAt || new Date().toISOString(),
        }));
        setCampaigns(mapped);
      } catch (err) {
        console.error("Failed to load business campaigns:", err);
        if (mounted) setCampaigns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCampaigns();
    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "ACTIVE");
    return {
      total: campaigns.length,
      active: active.length,
      raised: campaigns.reduce((sum, c) => sum + c.raised, 0),
      backers: campaigns.reduce((sum, c) => sum + c.backers, 0),
    };
  }, [campaigns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/business-owners" className="hover:text-gray-700">Business Owners</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Business Campaigns</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Business Campaigns</h1>
        <p className="text-sm text-gray-500">Manage campaigns created by businesses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500"><Target className="h-3.5 w-3.5" /> Total Campaigns</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500"><TrendingUp className="h-3.5 w-3.5" /> Active</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500">Total Raised</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(stats.raised)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500"><Users className="h-3.5 w-3.5" /> Backers</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.backers}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by campaign, business or owner..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending Review</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No campaigns found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Campaign</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Business & Location</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Raised / Target</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Backers</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((c) => {
                const pct = c.target > 0 ? Math.min(100, Math.round((c.raised / c.target) * 100)) : 0;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{c.business}</div>
                      <div className="text-gray-400">{c.city}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs font-medium text-gray-600">{c.mode}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-gray-900">{gbp(c.raised)} of {gbp(c.target)}</div>
                      <div className="text-gray-400">{pct}%</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-500"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{c.backers}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(c)}
                        className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Campaign Details</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400">Title</span>
                <p className="font-semibold text-gray-900">{selected.title}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Business</span>
                <p className="text-gray-800">{selected.business} ({selected.owner})</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">City</span>
                <p className="text-gray-800">{selected.city}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gray-400">Raised</span>
                  <p className="font-bold text-gray-900">{gbp(selected.raised)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Target</span>
                  <p className="font-bold text-gray-900">{gbp(selected.target)}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400">Status</span>
                <p><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[selected.status] || "bg-gray-100"}`}>{selected.status}</span></p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Created</span>
                <p className="text-gray-700">{dateFmt(selected.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
