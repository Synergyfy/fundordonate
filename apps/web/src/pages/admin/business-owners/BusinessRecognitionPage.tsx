// =============================================================================
// Business Owner Recognition — Admin
// Badges and recognition awarded to business owners based on live participant milestones.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Award, BadgeCheck, Star } from "lucide-react";
import { adminApi, type AdminBusiness } from "@/services/admin";

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
  const [entries, setEntries] = useState<RecognitionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RecognitionEntry | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadRecognition() {
      setLoading(true);
      try {
        const res = await adminApi.getBusinesses({ limit: 50 });
        if (!mounted) return;
        const items = res?.items || [];
        const mapped: RecognitionEntry[] = items.map((b: AdminBusiness, idx: number) => {
          const isGold = (b.membershipTier || "").toUpperCase() === "GOLD" || (b.membershipTier || "").toUpperCase() === "PLATINUM";
          const badge = isGold ? "Top Fundraiser" : (b.campaignCount || 0) > 1 ? "Community Champion" : "Founding Member Partner";
          const cat: RecognitionCategory = isGold ? "Growth" : (b.campaignCount || 0) > 1 ? "Community" : "Milestone";
          const reason = isGold
            ? `Achieved ${b.membershipTier} partner distinction.`
            : `Active participant in ${b.city} hub activation.`;

          return {
            id: `rec-${b.id || idx}`,
            badge,
            owner: b.name || "Business Partner",
            business: b.name || "Business",
            city: b.city || "United Kingdom",
            category: cat,
            reason,
            status: "awarded",
            awardedAt: new Date().toISOString(),
          };
        });
        setEntries(mapped);
      } catch (err) {
        console.error("Failed to load business recognition:", err);
        if (mounted) setEntries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRecognition();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      entries.filter((r) => {
        const q = search.toLowerCase();
        if (search && !r.badge.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q) && !r.business.toLowerCase().includes(q)) return false;
        if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
        return true;
      }),
    [entries, search, categoryFilter]
  );

  const stats = useMemo(
    () => ({
      total: entries.length,
      awarded: entries.filter((r) => r.status === "awarded").length,
      pending: entries.filter((r) => r.status === "pending").length,
      owners: new Set(entries.map((r) => r.owner)).size,
    }),
    [entries]
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
          <div className="text-xs text-gray-500">Pending Review</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Star className="h-3.5 w-3.5" /> Recognised Owners</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.owners}</div>
        </div>
      </div>

      {/* Search + filter */}
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading business recognition...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No recognition records found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Badge / Recognition</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Business & Owner</th>
                <th className="px-4 py-3 font-semibold text-gray-700">City</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Awarded</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{r.badge}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{r.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-gray-800">{r.business}</div>
                    <div className="text-gray-400">{r.owner}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.city}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[r.category]}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{dateFmt(r.awardedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(r)}
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
              <h2 className="text-lg font-bold text-gray-900">Recognition Details</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400">Badge</span>
                <p className="font-semibold text-gray-900">{selected.badge}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Recipient</span>
                <p className="text-gray-800">{selected.business} ({selected.owner})</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Location</span>
                <p className="text-gray-800">{selected.city}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Reason</span>
                <p className="text-gray-700">{selected.reason}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Category</span>
                <p><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${CATEGORY_COLORS[selected.category]}`}>{selected.category}</span></p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Awarded Date</span>
                <p className="text-gray-700">{dateFmt(selected.awardedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
