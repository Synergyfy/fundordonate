// =============================================================================
// In-Store & Community — Admin
// Track in-store donations and community contributions (frontend demo data).
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Store, Heart, MapPin } from "lucide-react";

type InStoreChannel = "In-store" | "Community event" | "Collection tin" | "QR terminal";

interface InStoreContribution {
  id: string;
  location: string;
  business: string;
  city: string;
  channel: InStoreChannel;
  method: "Card" | "Cash" | "QR";
  amount: number; // £
  status: "completed" | "pending";
  createdAt: string;
}

const DEMO_IN_STORE: InStoreContribution[] = [
  { id: "IS-2081", location: "TechStart Manchester Counter", business: "TechStart Manchester", city: "Manchester", channel: "In-store", method: "Card", amount: 25, status: "completed", createdAt: "2026-09-26" },
  { id: "IS-2080", location: "Northern Quarter Market Stall", business: "Green Initiative Ltd", city: "Manchester", channel: "Community event", method: "Cash", amount: 110, status: "completed", createdAt: "2026-09-25" },
  { id: "IS-2079", location: "Green Initiative Ltd Reception", business: "Green Initiative Ltd", city: "Birmingham", channel: "Collection tin", method: "Cash", amount: 47, status: "completed", createdAt: "2026-09-24" },
  { id: "IS-2078", location: "Community Fund London Lobby", business: "Community Fund London", city: "London", channel: "QR terminal", method: "QR", amount: 60, status: "completed", createdAt: "2026-09-23" },
  { id: "IS-2077", location: "Digital Skills Leeds Reception", business: "Digital Skills Leeds", city: "Leeds", channel: "In-store", method: "Card", amount: 15, status: "pending", createdAt: "2026-09-22" },
  { id: "IS-2076", location: "Liverpool High Street Fair", business: "Liverpool Green Spaces", city: "Liverpool", channel: "Community event", method: "QR", amount: 220, status: "completed", createdAt: "2026-09-21" },
  { id: "IS-2075", location: "Bristol Tech Hub Café", business: "Bristol Tech Hub", city: "Bristol", channel: "QR terminal", method: "QR", amount: 35, status: "completed", createdAt: "2026-09-20" },
  { id: "IS-2074", location: "Oldham Street Till Point", business: "TechStart Manchester", city: "Manchester", channel: "In-store", method: "Card", amount: 10, status: "pending", createdAt: "2026-09-19" },
  { id: "IS-2073", location: "Birmingham Market Stall", business: "Community Fund London", city: "Birmingham", channel: "Community event", method: "Cash", amount: 85, status: "completed", createdAt: "2026-09-18" },
];

const STATUS_COLORS: Record<InStoreContribution["status"], string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
};

const CHANNELS: InStoreChannel[] = ["In-store", "Community event", "Collection tin", "QR terminal"];

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export function InStoreContributionsPage() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<InStoreContribution | null>(null);

  const filtered = useMemo(
    () =>
      DEMO_IN_STORE.filter((c) => {
        const q = search.toLowerCase();
        if (search && !c.location.toLowerCase().includes(q) && !c.business.toLowerCase().includes(q) && !c.city.toLowerCase().includes(q)) return false;
        if (channelFilter !== "all" && c.channel !== channelFilter) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        return true;
      }),
    [search, channelFilter, statusFilter]
  );

  const stats = useMemo(() => {
    const completed = DEMO_IN_STORE.filter((c) => c.status === "completed");
    const inStore = DEMO_IN_STORE.filter((c) => c.channel === "In-store" || c.channel === "QR terminal" || c.channel === "Collection tin");
    const community = DEMO_IN_STORE.filter((c) => c.channel === "Community event");
    return {
      total: DEMO_IN_STORE.length,
      value: completed.reduce((sum, c) => sum + c.amount, 0),
      inStoreValue: inStore.reduce((sum, c) => sum + c.amount, 0),
      communityValue: community.reduce((sum, c) => sum + c.amount, 0),
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
          <span className="text-gray-900 font-medium">In-Store &amp; Community</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">In-Store &amp; Community</h1>
        <p className="text-sm text-gray-500">Track in-store donations and community contributions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total Contributions</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Store className="h-3.5 w-3.5" /> In-Store Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(stats.inStoreValue)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Heart className="h-3.5 w-3.5" /> Community Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(stats.communityValue)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Completed Value</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{gbp(stats.value)}</div>
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
            placeholder="Search by location, business or city..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Channels</option>
          {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Reference</th>
              <th className="px-4 py-3 font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Channel</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Method</th>
              <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
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
                  <p className="font-medium text-gray-900">{c.location}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" /> {c.city} · {c.business}
                  </p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{c.channel}</span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-600 lg:table-cell">{c.method}</td>
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
              <h2 className="text-lg font-semibold text-gray-900">In-Store Contribution</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Reference</span><span className="font-mono text-gray-800">{selected.id}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Location</span><span className="text-right text-gray-800">{selected.location}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Business</span><span className="text-right text-gray-800">{selected.business}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">City</span><span className="text-gray-800">{selected.city}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Channel</span><span className="text-gray-800">{selected.channel}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Method</span><span className="text-gray-800">{selected.method}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900">{gbp(selected.amount)}</span></div>
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
