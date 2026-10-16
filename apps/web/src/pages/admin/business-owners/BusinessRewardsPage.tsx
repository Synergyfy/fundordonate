// =============================================================================
// Business Owner Rewards — Admin
// Rewards issued to business owners and supporters for their campaigns (live data).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Gift, CheckCircle2, Package } from "lucide-react";
import { consumerApi } from "@/services/consumer";
import type { IssuedReward } from "@/types/rewards";

type RewardStatus = "issued" | "claimed" | "expired";

interface FormattedReward {
  id: string;
  name: string;
  business: string;
  owner: string;
  campaign: string;
  category: string;
  status: RewardStatus;
  value: number; // £
  issuedAt: string;
  code?: string | null;
}

const STATUS_META: Record<RewardStatus, { label: string; color: string }> = {
  issued: { label: "Issued", color: "bg-blue-100 text-blue-700" },
  claimed: { label: "Claimed", color: "bg-green-100 text-green-700" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500" },
};

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

type StatusTab = "all" | RewardStatus;

const TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "issued", label: "Issued" },
  { value: "claimed", label: "Claimed" },
  { value: "expired", label: "Expired" },
];

export function BusinessRewardsPage() {
  const [rewards, setRewards] = useState<FormattedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [selected, setSelected] = useState<FormattedReward | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadRewards() {
      setLoading(true);
      try {
        const res = await consumerApi.getRewards({ limit: 50 });
        if (!mounted) return;
        const items = res?.items || [];
        const mapped: FormattedReward[] = items.map((r: IssuedReward) => {
          const statusRaw = (r.status || "ISSUED").toLowerCase();
          const normStatus: RewardStatus =
            statusRaw === "redeemed" ? "claimed" : statusRaw === "expired" ? "expired" : "issued";

          return {
            id: r.id,
            name: r.title,
            business: r.campaignLocation || "UK Hub Partner",
            owner: "Participant",
            campaign: r.campaignTitle || "Campaign Reward",
            category: r.rewardType || "Campaign Tier",
            status: normStatus,
            value: r.value || 10,
            issuedAt: r.earnedAt || r.updatedAt || new Date().toISOString(),
            code: r.code,
          };
        });
        setRewards(mapped);
      } catch (err) {
        console.error("Failed to load business rewards:", err);
        if (mounted) setRewards([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRewards();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      rewards.filter((r) => {
        const q = search.toLowerCase();
        if (search && !r.name.toLowerCase().includes(q) && !r.business.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q)) return false;
        if (activeTab !== "all" && r.status !== activeTab) return false;
        return true;
      }),
    [rewards, search, activeTab]
  );

  const stats = useMemo(() => {
    const claimed = rewards.filter((r) => r.status === "claimed");
    return {
      total: rewards.length,
      claimed: claimed.length,
      pending: rewards.filter((r) => r.status === "issued").length,
      value: claimed.reduce((sum, r) => sum + r.value, 0),
    };
  }, [rewards]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/business-owners" className="hover:text-gray-700">Business Owners</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Business Owner Rewards</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Business Owner Rewards</h1>
        <p className="text-sm text-gray-500">Rewards issued to business owners for their campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Gift className="h-3.5 w-3.5" /> Total Rewards</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><CheckCircle2 className="h-3.5 w-3.5" /> Claimed</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.claimed}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Awaiting Claim</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{stats.pending}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Package className="h-3.5 w-3.5" /> Claimed Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(stats.value)}</div>
        </div>
      </div>

      {/* Search + tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reward, business or owner..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                activeTab === tab.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading rewards...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No rewards found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Reward</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Campaign</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Value</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Issued Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    {r.code && <div className="text-[10px] font-mono text-gray-500">{r.code}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.campaign}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_META[r.status]?.color || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_META[r.status]?.label || r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{gbp(r.value)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{dateFmt(r.issuedAt)}</td>
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
              <h2 className="text-lg font-bold text-gray-900">Reward Details</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400">Reward Name</span>
                <p className="font-semibold text-gray-900">{selected.name}</p>
              </div>
              {selected.code && (
                <div>
                  <span className="text-xs text-gray-400">Redemption Code</span>
                  <p className="font-mono font-bold text-gray-900">{selected.code}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-400">Campaign</span>
                <p className="text-gray-800">{selected.campaign}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Value</span>
                <p className="font-bold text-gray-900">{gbp(selected.value)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Status</span>
                <p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_META[selected.status]?.color || "bg-gray-100"}`}>
                    {STATUS_META[selected.status]?.label || selected.status}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Issued Date</span>
                <p className="text-gray-700">{dateFmt(selected.issuedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
