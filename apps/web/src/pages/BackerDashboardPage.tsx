// =============================================================================
// Backer Dashboard Page
// Business owner's backer view: tier, campaigns backed, funnel code, leaderboard, rewards.
// =============================================================================

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backerApi, type BackerStatus, type BackerLeaderboardEntry } from "@/services/backer.service";
import { BackerBadge, type BackerBadgeTier } from "@/components/hub/BackerBadge";
import {
  Gift, Copy, CheckCircle2,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const TIER_PROGRESS: { tier: BackerBadgeTier; label: string; requirement: string; minAmount: number }[] = [
  { tier: "BACKER", label: "Backer", requirement: "Make your first contribution", minAmount: 0 },
  { tier: "CITY", label: "City Hub Backer", requirement: "Contribute to 3+ city hub campaigns", minAmount: 5000 },
  { tier: "NATIONAL", label: "National Backer", requirement: "Contribute to campaigns in 3+ cities", minAmount: 25000 },
];

// Demo data
const DEMO_BACKER_STATUS: BackerStatus = {
  id: "backer-1",
  userId: "user-1",
  statusType: "CITY",
  sourceCampaignId: "camp-1",
  locationId: "manchester",
  locationName: "Manchester",
  cityCount: 3,
  grantedAt: "2026-07-15T10:00:00Z",
  visibility: "PUBLIC",
};

const DEMO_CAMPAIGNS_BACKED = [
  { id: "1", title: "Manchester Autumn Community Campaign", amount: 5000, date: "2026-09-08", progress: 62 },
  { id: "2", title: "Leeds High Street Revival", amount: 2500, date: "2026-08-20", progress: 45 },
  { id: "3", title: "Bristol Green Hub Fund", amount: 1500, date: "2026-08-10", progress: 78 },
  { id: "4", title: "Liverpool Community Centre", amount: 1000, date: "2026-07-25", progress: 90 },
];

const DEMO_LEADERBOARD: BackerLeaderboardEntry[] = [
  { userId: "u1", firstName: "Tech", lastName: "Hub Manchester", username: "techhub", backerTier: "NATIONAL", totalContributed: 25000, campaignCount: 8, locationName: "Manchester" },
  { userId: "u2", firstName: "Sarah", lastName: "Baker", username: "sarahb", backerTier: "CITY", totalContributed: 18000, campaignCount: 6, locationName: "Manchester" },
  { userId: "u3", firstName: "James", lastName: "Wilson", username: "jamesw", backerTier: "CITY", totalContributed: 12000, campaignCount: 5, locationName: "Leeds" },
  { userId: "u4", firstName: "Emily", lastName: "Chen", username: "emilyc", backerTier: "BACKER", totalContributed: 8000, campaignCount: 3, locationName: "Bristol" },
  { userId: "u5", firstName: "Michael", lastName: "Brown", username: "michaelb", backerTier: "BACKER", totalContributed: 5000, campaignCount: 2, locationName: "Liverpool" },
];

const DEMO_REWARDS = [
  { id: "1", title: "Early Supporter Badge", earned: true, date: "2026-07-15" },
  { id: "2", title: "City Hub Champion", earned: true, date: "2026-08-20" },
  { id: "3", title: "National Backer", earned: false, date: "" },
];

export default function BackerDashboardPage() {
  const [funnelCode, setFunnelCode] = useState("");
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: backerStatus } = useQuery({
    queryKey: ["backer-status"],
    queryFn: () => backerApi.getMyBackerStatus(),
    placeholderData: DEMO_BACKER_STATUS,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["backer-leaderboard"],
    queryFn: () => backerApi.getLeaderboard({ limit: 10 }),
    placeholderData: DEMO_LEADERBOARD,
  });

  const currentTier = (backerStatus?.statusType || "BACKER") as BackerBadgeTier;
  const totalContributed = DEMO_CAMPAIGNS_BACKED.reduce((s, c) => s + c.amount, 0);
  const currentTierIndex = TIER_PROGRESS.findIndex((t) => t.tier === currentTier);
  const nextTier = currentTierIndex < TIER_PROGRESS.length - 1 ? TIER_PROGRESS[currentTierIndex + 1] : null;
  const myLeaderboardPosition = leaderboard?.findIndex((e) => e.userId === "u1") ?? -1;

  const handleRedeem = async () => {
    if (!funnelCode.trim()) return;
    const result = await backerApi.redeemFunnelCode(funnelCode);
    setRedeemResult({
      success: result.success,
      message: result.success ? "Funnel code redeemed! Backer status upgraded." : "Invalid or expired funnel code.",
    });
    if (result.success) setFunnelCode("");
  };

  const handleCopyCode = async () => {
    const result = await backerApi.issueFunnelCode();
    if (result?.code) {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backer Dashboard</h1>
        <p className="text-sm text-gray-500">Track your backer status, contributions, and leaderboard position.</p>
      </div>

      {/* Tier Status */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackerBadge tier={currentTier} />
            <div>
              <div className="text-sm font-bold text-gray-900">Your Backer Tier</div>
              <div className="text-xs text-gray-500">Granted {backerStatus?.grantedAt ? new Date(backerStatus.grantedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}</div>
            </div>
          </div>
          {nextTier && (
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Next tier: {nextTier.label}</div>
              <div className="h-2 w-40 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min((totalContributed / nextTier.minAmount) * 100, 100)}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{fmt(totalContributed)} of {fmt(nextTier.minAmount)}</div>
            </div>
          )}
        </div>

        {/* Tier Steps */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {TIER_PROGRESS.map((t) => (
            <div key={t.tier} className={`rounded-lg border p-3 text-center ${t.tier === currentTier ? "border-primary-300 bg-primary-50" : "border-gray-200"}`}>
              <BackerBadge tier={t.tier} size="sm" showLabel={false} />
              <div className="text-xs font-bold text-gray-900 mt-1">{t.label}</div>
              <div className="text-[10px] text-gray-500">{t.requirement}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Total Contributed</div>
          <div className="text-lg font-bold text-gray-900">{fmt(totalContributed)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Campaigns Backed</div>
          <div className="text-lg font-bold text-gray-900">{DEMO_CAMPAIGNS_BACKED.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Leaderboard</div>
          <div className="text-lg font-bold text-gray-900">{myLeaderboardPosition >= 0 ? `#${myLeaderboardPosition + 1}` : "N/A"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Rewards</div>
          <div className="text-lg font-bold text-gray-900">{DEMO_REWARDS.filter((r) => r.earned).length}/{DEMO_REWARDS.length}</div>
        </div>
      </div>

      {/* Funnel Code */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Funnel Code</h3>
        <p className="text-xs text-gray-500 mb-4">Share your funnel code with others. When they redeem it, you both earn recognition.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleCopyCode} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Generate & Copy Code"}
          </button>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={funnelCode}
              onChange={(e) => setFunnelCode(e.target.value)}
              placeholder="Enter a funnel code to redeem"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button onClick={handleRedeem} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
              Redeem
            </button>
          </div>
        </div>
        {redeemResult && (
          <div className={`mt-3 rounded-lg p-3 text-xs ${redeemResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {redeemResult.message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaigns Backed */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Campaigns Backed</h3>
          <div className="space-y-3">
            {DEMO_CAMPAIGNS_BACKED.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{c.title}</div>
                  <div className="text-[10px] text-gray-400">{new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-bold text-gray-900">{fmt(c.amount)}</div>
                  <div className="text-[10px] text-gray-400">{c.progress}% funded</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Position */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Leaderboard</h3>
          <div className="space-y-2">
            {DEMO_LEADERBOARD.slice(0, 5).map((entry, i) => (
              <div key={entry.userId} className={`flex items-center justify-between rounded-lg p-3 ${entry.userId === "u1" ? "bg-primary-50 border border-primary-200" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    #{i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{entry.firstName} {entry.lastName}</div>
                    <div className="text-[10px] text-gray-400">{entry.locationName}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">{fmt(entry.totalContributed)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Rewards Earned</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_REWARDS.map((r) => (
            <div key={r.id} className={`rounded-lg border p-4 text-center ${r.earned ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-50"}`}>
              <Gift className={`mx-auto h-6 w-6 mb-2 ${r.earned ? "text-green-500" : "text-gray-300"}`} />
              <div className="text-sm font-bold text-gray-900">{r.title}</div>
              {r.earned && <div className="text-[10px] text-green-600 mt-1">Earned {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>}
              {!r.earned && <div className="text-[10px] text-gray-400 mt-1">Not yet earned</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
