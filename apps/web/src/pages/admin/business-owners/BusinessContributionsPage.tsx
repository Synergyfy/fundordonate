// =============================================================================
// Business Contributions — Admin
// Contributions made by businesses and supporters to campaigns (live database data).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Coins, CheckCircle2, Clock } from "lucide-react";
import { adminApi, type RecentContribution } from "@/services/admin";

interface FormattedContribution {
  id: string;
  business: string;
  owner: string;
  campaign: string;
  type: string;
  amount: number; // £
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export function BusinessContributionsPage() {
  const [contributions, setContributions] = useState<FormattedContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<FormattedContribution | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchContributions() {
      setLoading(true);
      try {
        const res = await adminApi.getRecentContributions(50);
        if (!mounted) return;
        const items = res || [];
        const mapped: FormattedContribution[] = items.map((c: RecentContribution) => {
          const ownerName = c.backer
            ? [c.backer.firstName, c.backer.lastName].filter(Boolean).join(" ") || c.backer.email
            : "Contributor";
          const bName = c.business?.name || "Civic Community Hub";
          const campTitle = c.campaign?.title || "Community Campaign";
          const statusLower = (c.status || "completed").toLowerCase();
          const normalizedStatus = statusLower === "completed" ? "completed" : statusLower === "pending" ? "pending" : "failed";

          return {
            id: c.reference || c.id,
            business: bName,
            owner: ownerName,
            campaign: campTitle,
            type: String(c.type || "money").toLowerCase(),
            amount: Math.round((c.amount || 0) / 100),
            status: normalizedStatus as any,
            createdAt: c.createdAt || new Date().toISOString(),
          };
        });
        setContributions(mapped);
      } catch (err) {
        console.error("Failed to load business contributions:", err);
        if (mounted) setContributions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchContributions();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      contributions.filter((c) => {
        const q = search.toLowerCase();
        if (search && !c.business.toLowerCase().includes(q) && !c.owner.toLowerCase().includes(q) && !c.campaign.toLowerCase().includes(q)) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (typeFilter !== "all" && c.type !== typeFilter) return false;
        return true;
      }),
    [contributions, search, statusFilter, typeFilter]
  );

  const stats = useMemo(() => {
    const completed = contributions.filter((c) => c.status === "completed");
    return {
      total: contributions.length,
      value: completed.reduce((sum, c) => sum + c.amount, 0),
      completed: completed.length,
      pending: contributions.filter((c) => c.status === "pending").length,
    };
  }, [contributions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/business-owners" className="hover:text-gray-700">Business Owners</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Business Contributions</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Business Contributions</h1>
        <p className="text-sm text-gray-500">Contributions made by businesses to campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total Contributions</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Coins className="h-3.5 w-3.5" /> Completed Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(stats.value)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock className="h-3.5 w-3.5" /> Pending</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</div>
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
            placeholder="Search by business, owner or campaign..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Types</option>
          <option value="money">Money</option>
          <option value="pledge">Pledge</option>
          <option value="self_funding">Self Funding</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading contributions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No contributions found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Ref / Business</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Contributor</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Campaign</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div>{c.business}</div>
                    <div className="text-[10px] text-gray-400">{c.id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.owner}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{c.campaign}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{gbp(c.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{dateFmt(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(c)}
                      className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Contribution Details</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400">Reference</span>
                <p className="font-semibold text-gray-900">{selected.id}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Business</span>
                <p className="text-gray-800">{selected.business}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Contributor</span>
                <p className="text-gray-800">{selected.owner}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Campaign</span>
                <p className="font-semibold text-gray-900">{selected.campaign}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Amount</span>
                <p className="text-lg font-bold text-gray-900">{gbp(selected.amount)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Status</span>
                <p><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[selected.status] || "bg-gray-100"}`}>{selected.status}</span></p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Date</span>
                <p className="text-gray-700">{dateFmt(selected.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
