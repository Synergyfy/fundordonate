// =============================================================================
// Business Contributions — Admin
// Contributions made by businesses to campaigns (frontend demo data).
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Coins, CheckCircle2, Clock } from "lucide-react";

interface BusinessContribution {
  id: string;
  business: string;
  owner: string;
  campaign: string;
  type: "money" | "product" | "service";
  amount: number; // £ (money) or estimated value for product/service
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

const DEMO_CONTRIBUTIONS: BusinessContribution[] = [
  { id: "BC-1041", business: "TechStart Manchester", owner: "James Wilson", campaign: "Manchester Tech Hub Launch", type: "money", amount: 5000, status: "completed", createdAt: "2026-09-21" },
  { id: "BC-1040", business: "Green Initiative Ltd", owner: "Sarah Chen", campaign: "Birmingham Green Initiative", type: "product", amount: 1200, status: "completed", createdAt: "2026-09-20" },
  { id: "BC-1039", business: "Community Fund London", owner: "Michael Okafor", campaign: "London Community Garden", type: "money", amount: 7500, status: "pending", createdAt: "2026-09-19" },
  { id: "BC-1038", business: "Digital Skills Leeds", owner: "Emma Thompson", campaign: "Leeds Digital Skills Programme", type: "service", amount: 2500, status: "completed", createdAt: "2026-09-17" },
  { id: "BC-1037", business: "Liverpool Green Spaces", owner: "Lisa Patel", campaign: "Liverpool Youth Fund", type: "money", amount: 950, status: "completed", createdAt: "2026-09-15" },
  { id: "BC-1036", business: "Bristol Tech Hub", owner: "David Brown", campaign: "Bristol Arts Centre", type: "product", amount: 400, status: "failed", createdAt: "2026-09-14" },
  { id: "BC-1035", business: "TechStart Manchester", owner: "James Wilson", campaign: "Birmingham Food Bank Network", type: "money", amount: 1500, status: "completed", createdAt: "2026-09-11" },
  { id: "BC-1034", business: "Community Fund London", owner: "Michael Okafor", campaign: "London Tech Startup Fund", type: "service", amount: 3000, status: "pending", createdAt: "2026-09-09" },
];

const STATUS_COLORS: Record<BusinessContribution["status"], string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<BusinessContribution["type"], string> = {
  money: "Money",
  product: "Product",
  service: "Service",
};

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export function BusinessContributionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<BusinessContribution | null>(null);

  const filtered = useMemo(
    () =>
      DEMO_CONTRIBUTIONS.filter((c) => {
        const q = search.toLowerCase();
        if (search && !c.business.toLowerCase().includes(q) && !c.owner.toLowerCase().includes(q) && !c.campaign.toLowerCase().includes(q)) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (typeFilter !== "all" && c.type !== typeFilter) return false;
        return true;
      }),
    [search, statusFilter, typeFilter]
  );

  const stats = useMemo(() => {
    const completed = DEMO_CONTRIBUTIONS.filter((c) => c.status === "completed");
    return {
      total: DEMO_CONTRIBUTIONS.length,
      value: completed.reduce((sum, c) => sum + c.amount, 0),
      completed: completed.length,
      pending: DEMO_CONTRIBUTIONS.filter((c) => c.status === "pending").length,
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
          <option value="product">Product</option>
          <option value="service">Service</option>
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
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Reference</th>
              <th className="px-4 py-3 font-medium text-gray-500">Business</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Campaign</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Value</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No contributions match your filters.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.business}</p>
                  <p className="text-xs text-gray-400">{c.owner}</p>
                </td>
                <td className="hidden max-w-[180px] truncate px-4 py-3 text-sm text-gray-600 md:table-cell">{c.campaign}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{TYPE_LABELS[c.type]}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{gbp(c.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-gray-400 md:table-cell">{dateFmt(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(c)}
                    className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Contribution Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Reference</span><span className="font-mono text-gray-800">{selected.id}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Business</span><span className="text-right text-gray-800">{selected.business}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Owner</span><span className="text-gray-800">{selected.owner}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Campaign</span><span className="text-right text-gray-800">{selected.campaign}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Type</span><span className="text-gray-800">{TYPE_LABELS[selected.type]}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Value</span><span className="font-semibold text-gray-900">{gbp(selected.amount)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Date</span><span className="text-gray-800">{dateFmt(selected.createdAt)}</span></div>
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
