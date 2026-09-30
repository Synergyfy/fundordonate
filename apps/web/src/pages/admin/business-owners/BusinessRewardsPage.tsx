// =============================================================================
// Business Owner Rewards — Admin
// Rewards issued to business owners for their campaigns (frontend demo data).
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, X, Gift, CheckCircle2, Package } from "lucide-react";

type RewardStatus = "issued" | "claimed" | "expired";
type RewardCategory = "Backer" | "Founding Member" | "Donation" | "Sponsorship" | "Custom";

interface BusinessReward {
  id: string;
  name: string;
  business: string;
  owner: string;
  campaign: string;
  category: RewardCategory;
  status: RewardStatus;
  value: number; // £
  issuedAt: string;
}

const DEMO_BUSINESS_REWARDS: BusinessReward[] = [
  { id: "rw-1", name: "Standard Backer Reward", business: "TechStart Manchester", owner: "James Wilson", campaign: "Manchester Tech Hub Launch", category: "Backer", status: "claimed", value: 10, issuedAt: "2026-09-20" },
  { id: "rw-2", name: "Sponsor Recognition", business: "Green Initiative Ltd", owner: "Sarah Chen", campaign: "Birmingham Green Initiative", category: "Sponsorship", status: "issued", value: 250, issuedAt: "2026-09-19" },
  { id: "rw-3", name: "Founding Member Reward", business: "Community Fund London", owner: "Michael Okafor", campaign: "London Community Garden", category: "Founding Member", status: "claimed", value: 100, issuedAt: "2026-09-16" },
  { id: "rw-4", name: "E-Card Thank You", business: "Digital Skills Leeds", owner: "Emma Thompson", campaign: "Leeds Digital Skills Programme", category: "Donation", status: "claimed", value: 5, issuedAt: "2026-09-14" },
  { id: "rw-5", name: "Cashback Reward", business: "Liverpool Green Spaces", owner: "Lisa Patel", campaign: "Liverpool Youth Fund", category: "Custom", status: "issued", value: 50, issuedAt: "2026-09-12" },
  { id: "rw-6", name: "Loyalty Points Pack", business: "Bristol Tech Hub", owner: "David Brown", campaign: "Bristol Arts Centre", category: "Custom", status: "expired", value: 25, issuedAt: "2026-08-02" },
  { id: "rw-7", name: "Standard Backer Reward", business: "TechStart Manchester", owner: "James Wilson", campaign: "Oldham Street Shopfront Fix", category: "Backer", status: "expired", value: 10, issuedAt: "2026-07-18" },
  { id: "rw-8", name: "Sponsor Recognition", business: "Community Fund London", owner: "Michael Okafor", campaign: "London Tech Startup Fund", category: "Sponsorship", status: "issued", value: 250, issuedAt: "2026-09-08" },
];

const STATUS_META: Record<RewardStatus, { label: string; color: string }> = {
  issued: { label: "Issued", color: "bg-blue-100 text-blue-700" },
  claimed: { label: "Claimed", color: "bg-green-100 text-green-700" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500" },
};

const CATEGORY_COLORS: Record<RewardCategory, string> = {
  Backer: "bg-purple-100 text-purple-700",
  "Founding Member": "bg-amber-100 text-amber-700",
  Donation: "bg-blue-100 text-blue-700",
  Sponsorship: "bg-green-100 text-green-700",
  Custom: "bg-pink-100 text-pink-700",
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
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [selected, setSelected] = useState<BusinessReward | null>(null);

  const filtered = useMemo(
    () =>
      DEMO_BUSINESS_REWARDS.filter((r) => {
        const q = search.toLowerCase();
        if (search && !r.name.toLowerCase().includes(q) && !r.business.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q)) return false;
        if (activeTab !== "all" && r.status !== activeTab) return false;
        return true;
      }),
    [search, activeTab]
  );

  const stats = useMemo(() => {
    const claimed = DEMO_BUSINESS_REWARDS.filter((r) => r.status === "claimed");
    return {
      total: DEMO_BUSINESS_REWARDS.length,
      claimed: claimed.length,
      pending: DEMO_BUSINESS_REWARDS.filter((r) => r.status === "issued").length,
      value: claimed.reduce((sum, r) => sum + r.value, 0),
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

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-gray-400">
            No rewards match your filters.
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
                  <Gift className="h-4 w-4 text-primary-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.business}</p>
                </div>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_META[r.status].color}`}>
                {STATUS_META[r.status].label}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[r.category]}`}>{r.category}</span>
              <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{gbp(r.value)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span className="truncate">{r.owner}</span>
              <span>{dateFmt(r.issuedAt)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Reward Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Reward</span><span className="text-right font-medium text-gray-800">{selected.name}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Business</span><span className="text-right text-gray-800">{selected.business}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Owner</span><span className="text-gray-800">{selected.owner}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Campaign</span><span className="text-right text-gray-800">{selected.campaign}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Category</span><span className="text-gray-800">{selected.category}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Value</span><span className="font-semibold text-gray-900">{gbp(selected.value)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[selected.status].color}`}>{STATUS_META[selected.status].label}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Issued</span><span className="text-gray-800">{dateFmt(selected.issuedAt)}</span></div>
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
