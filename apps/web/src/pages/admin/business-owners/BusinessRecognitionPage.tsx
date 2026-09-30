// =============================================================================
// Business Owner Recognition — Admin
// Badges and recognition awarded to business owners (frontend demo data).
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Award, BadgeCheck, Star } from "lucide-react";

type RecognitionCategory = "Milestone" | "Community" | "Growth" | "Consistency";

interface RecognitionEntry {
  id: string;
  badge: string;
  owner: string;
  business: string;
  city: string;
  category: RecognitionCategory;
  reason: string;
  status: "awarded" | "pending";
  awardedAt: string;
}

const DEMO_RECOGNITION: RecognitionEntry[] = [
  { id: "rc-1", badge: "Top Fundraiser", owner: "Michael Okafor", business: "Community Fund London", city: "London", category: "Growth", reason: "Raised over £100k across the season", status: "awarded", awardedAt: "2026-09-15" },
  { id: "rc-2", badge: "Community Champion", owner: "Sarah Chen", business: "Green Initiative Ltd", city: "Birmingham", category: "Community", reason: "Organised 3 high street community events", status: "awarded", awardedAt: "2026-09-12" },
  { id: "rc-3", badge: "Campaign Milestone", owner: "James Wilson", business: "TechStart Manchester", city: "Manchester", category: "Milestone", reason: "First business campaign to hit its target", status: "awarded", awardedAt: "2026-09-08" },
  { id: "rc-4", badge: "Consistent Supporter", owner: "Lisa Patel", business: "Liverpool Green Spaces", city: "Liverpool", category: "Consistency", reason: "Contributed in every season since launch", status: "awarded", awardedAt: "2026-09-04" },
  { id: "rc-5", badge: "Rising Star", owner: "Emma Thompson", business: "Digital Skills Leeds", city: "Leeds", category: "Growth", reason: "Fastest growing business owner this quarter", status: "pending", awardedAt: "2026-09-22" },
  { id: "rc-6", badge: "Community Champion", owner: "Priya Sharma", business: "Camden Coffee House", city: "London", category: "Community", reason: "Hosted weekly collection tin drive", status: "pending", awardedAt: "2026-09-24" },
  { id: "rc-7", badge: "Campaign Milestone", owner: "David Brown", business: "Bristol Tech Hub", city: "Bristol", category: "Milestone", reason: "Completed three funded campaigns in a row", status: "awarded", awardedAt: "2026-08-28" },
];

const CATEGORY_COLORS: Record<RecognitionCategory, string> = {
  Milestone: "bg-purple-100 text-purple-700",
  Community: "bg-green-100 text-green-700",
  Growth: "bg-blue-100 text-blue-700",
  Consistency: "bg-amber-100 text-amber-700",
};

const STATUS_COLORS: Record<RecognitionEntry["status"], string> = {
  awarded: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
};

const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export function BusinessRecognitionPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RecognitionEntry | null>(null);

  const filtered = useMemo(
    () =>
      DEMO_RECOGNITION.filter((r) => {
        const q = search.toLowerCase();
        if (search && !r.badge.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q) && !r.business.toLowerCase().includes(q)) return false;
        if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
        return true;
      }),
    [search, categoryFilter]
  );

  const stats = useMemo(
    () => ({
      total: DEMO_RECOGNITION.length,
      awarded: DEMO_RECOGNITION.filter((r) => r.status === "awarded").length,
      pending: DEMO_RECOGNITION.filter((r) => r.status === "pending").length,
      owners: new Set(DEMO_RECOGNITION.map((r) => r.owner)).size,
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/business-owners" className="hover:text-gray-700">Business Owners</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Recognition</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Business Owner Recognition</h1>
        <p className="text-sm text-gray-500">Badges and recognition awarded to business owners</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Award className="h-3.5 w-3.5" /> Total Awards</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><BadgeCheck className="h-3.5 w-3.5" /> Awarded</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.awarded}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Pending Approval</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Star className="h-3.5 w-3.5" /> Owners Recognised</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.owners}</div>
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
            placeholder="Search by badge, owner or business..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Categories</option>
          <option value="Milestone">Milestone</option>
          <option value="Community">Community</option>
          <option value="Growth">Growth</option>
          <option value="Consistency">Consistency</option>
        </select>
      </div>

      {/* Recognition grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-gray-400">
            No recognition entries match your filters.
          </div>
        )}
        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                  <Award className="h-4 w-4 text-primary-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.badge}</p>
                  <p className="text-xs text-gray-400">{r.business}</p>
                </div>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[r.status]}`}>
                {r.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-500">{r.reason}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[r.category]}`}>
                {r.category}
              </span>
              <span className="text-xs text-gray-400">{dateFmt(r.awardedAt)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recognition Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Badge</span><span className="text-right font-medium text-gray-800">{selected.badge}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Owner</span><span className="text-gray-800">{selected.owner}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Business</span><span className="text-right text-gray-800">{selected.business}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">City</span><span className="text-gray-800">{selected.city}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Category</span><span className="text-gray-800">{selected.category}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Reason</span><span className="text-right text-gray-800">{selected.reason}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Date</span><span className="text-gray-800">{dateFmt(selected.awardedAt)}</span></div>
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
