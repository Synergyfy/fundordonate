// =============================================================================
// Business Campaigns — Admin
// Campaigns created and run by business owners (frontend demo data).
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Target, X, Users, TrendingUp } from "lucide-react";

interface BusinessCampaign {
  id: string;
  title: string;
  owner: string;
  business: string;
  city: string;
  mode: "donation" | "fund" | "sponsor";
  status: "DRAFT" | "PENDING REVIEW" | "ACTIVE" | "COMPLETED";
  raised: number; // £
  target: number; // £
  backers: number;
  createdAt: string;
}

const DEMO_BUSINESS_CAMPAIGNS: BusinessCampaign[] = [
  { id: "bc-1", title: "TechStart Manchester Starter Kits", owner: "James Wilson", business: "TechStart Manchester", city: "Manchester", mode: "fund", status: "ACTIVE", raised: 42000, target: 50000, backers: 180, createdAt: "2026-08-14" },
  { id: "bc-2", title: "Green Initiative Planters", owner: "Sarah Chen", business: "Green Initiative Ltd", city: "Birmingham", mode: "donation", status: "ACTIVE", raised: 28000, target: 35000, backers: 120, createdAt: "2026-08-22" },
  { id: "bc-3", title: "Community Fund London Grants", owner: "Michael Okafor", business: "Community Fund London", city: "London", mode: "fund", status: "ACTIVE", raised: 65000, target: 80000, backers: 290, createdAt: "2026-07-30" },
  { id: "bc-4", title: "Digital Skills Leeds Workshop", owner: "Emma Thompson", business: "Digital Skills Leeds", city: "Leeds", mode: "sponsor", status: "PENDING REVIEW", raised: 15000, target: 25000, backers: 85, createdAt: "2026-09-05" },
  { id: "bc-5", title: "Liverpool Green Spaces", owner: "Lisa Patel", business: "Liverpool Green Spaces", city: "Liverpool", mode: "donation", status: "COMPLETED", raised: 9500, target: 9500, backers: 45, createdAt: "2026-06-11" },
  { id: "bc-6", title: "Bristol Tech Hub Expansion", owner: "David Brown", business: "Bristol Tech Hub", city: "Bristol", mode: "fund", status: "DRAFT", raised: 0, target: 60000, backers: 0, createdAt: "2026-09-18" },
  { id: "bc-7", title: "Oldham Street Shopfront Fix", owner: "James Wilson", business: "TechStart Manchester", city: "Manchester", mode: "sponsor", status: "COMPLETED", raised: 12000, target: 12000, backers: 60, createdAt: "2026-05-02" },
];

const STATUS_COLORS: Record<BusinessCampaign["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  "PENDING REVIEW": "bg-amber-100 text-amber-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const MODE_LABELS: Record<BusinessCampaign["mode"], string> = {
  donation: "Donation",
  fund: "Funding",
  sponsor: "Sponsorship",
};

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export function BusinessCampaignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<BusinessCampaign | null>(null);

  const filtered = useMemo(
    () =>
      DEMO_BUSINESS_CAMPAIGNS.filter((c) => {
        const q = search.toLowerCase();
        if (search && !c.title.toLowerCase().includes(q) && !c.business.toLowerCase().includes(q) && !c.owner.toLowerCase().includes(q)) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        return true;
      }),
    [search, statusFilter]
  );

  const stats = useMemo(() => {
    const active = DEMO_BUSINESS_CAMPAIGNS.filter((c) => c.status === "ACTIVE");
    return {
      total: DEMO_BUSINESS_CAMPAIGNS.length,
      active: active.length,
      raised: DEMO_BUSINESS_CAMPAIGNS.reduce((sum, c) => sum + c.raised, 0),
      backers: DEMO_BUSINESS_CAMPAIGNS.reduce((sum, c) => sum + c.backers, 0),
    };
  }, []);

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
          <option value="PENDING REVIEW">Pending Review</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
              <th className="px-4 py-3 font-medium text-gray-500">Business Owner</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">City</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Progress</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No campaigns match your filters.</td></tr>
            )}
            {filtered.map((c) => {
              const pct = c.target > 0 ? Math.min(100, Math.round((c.raised / c.target) * 100)) : 0;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-400">Created {dateFmt(c.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{c.owner}</p>
                    <p className="text-xs text-gray-400">{c.business}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{c.city}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{MODE_LABELS[c.mode]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{gbp(c.raised)}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-0.5 text-[10px] text-gray-400">of {gbp(c.target)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(c)}
                      className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Campaign</span><span className="text-right font-medium text-gray-800">{selected.title}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Owner</span><span className="text-right text-gray-800">{selected.owner}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Business</span><span className="text-right text-gray-800">{selected.business}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">City</span><span className="text-right text-gray-800">{selected.city}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Type</span><span className="text-right text-gray-800">{MODE_LABELS[selected.mode]}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Raised</span><span className="font-semibold text-gray-900">{gbp(selected.raised)} of {gbp(selected.target)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Backers</span><span className="text-gray-800">{selected.backers}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Created</span><span className="text-gray-800">{dateFmt(selected.createdAt)}</span></div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
