// =============================================================================
// Backer Dashboard Page
// Business owner's backer view: tier, campaigns backed, funnel code, leaderboard, rewards.
// =============================================================================

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { backerApi } from "@/services/backer";
import { userDashboardApi } from "@/services/user-dashboard";
import { consumerApi } from "@/services/consumer";
import { BackerBadge, type BackerBadgeTier } from "@/components/hub/BackerBadge";
import {
  Gift, Copy, CheckCircle2, Heart, Trophy,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((p || 0) / 100);

const TIER_PROGRESS: { tier: BackerBadgeTier; label: string; requirement: string; minAmount: number }[] = [
  { tier: "BACKER", label: "Backer", requirement: "Make your first contribution", minAmount: 0 },
  { tier: "CITY", label: "City Hub Backer", requirement: "Contribute to 3+ city hub campaigns", minAmount: 5000 },
  { tier: "NATIONAL", label: "National Backer", requirement: "Contribute to campaigns in 3+ cities", minAmount: 25000 },
];

export default function BackerDashboardPage() {
  const [funnelCode, setFunnelCode] = useState("");
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: backerStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["backer-status"],
    queryFn: () => backerApi.getMyBackerStatus(),
  });

  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["backer-leaderboard"],
    queryFn: () => backerApi.getLeaderboard({ limit: 10 }),
  });

  const { data: userStats } = useQuery({
    queryKey: ["user-dashboard-stats"],
    queryFn: () => userDashboardApi.getStats(),
  });

  const { data: donationsData, isLoading: loadingDonations } = useQuery({
    queryKey: ["user-dashboard-donations"],
    queryFn: () => userDashboardApi.getDonations({ limit: 20 }),
  });

  const { data: rewardsData, isLoading: loadingRewards } = useQuery({
    queryKey: ["consumer-rewards"],
    queryFn: () => consumerApi.getRewards({ limit: 20 }),
  });

  const campaignsBacked = (donationsData as any)?.items || [];
  const rewardsList = rewardsData?.items || [];
  const totalContributed = userStats?.totalContributed || 0;
  const currentTier = (backerStatus?.statusType || "BACKER") as BackerBadgeTier;
  const currentTierIndex = TIER_PROGRESS.findIndex((t) => t.tier === currentTier);
  const nextTier = currentTierIndex < TIER_PROGRESS.length - 1 ? TIER_PROGRESS[currentTierIndex + 1] : null;

  const handleRedeem = async () => {
    if (!funnelCode.trim()) return;
    try {
      const result = await backerApi.redeemFunnelCode(funnelCode);
      setRedeemResult({
        success: result.success,
        message: result.success ? "Funnel code redeemed! Backer status upgraded." : "Invalid or expired funnel code.",
      });
      if (result.success) setFunnelCode("");
    } catch (err: any) {
      setRedeemResult({
        success: false,
        message: err?.response?.data?.message || "Failed to redeem funnel code.",
      });
    }
  };

  const handleCopyCode = async () => {
    try {
      const result = await backerApi.issueFunnelCode();
      if (result?.code) {
        await navigator.clipboard.writeText(result.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to generate funnel code:", err);
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
              <div className="text-xs text-gray-500">
                {backerStatus?.grantedAt
                  ? `Granted ${new Date(backerStatus.grantedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Active Supporter"}
              </div>
            </div>
          </div>
          {nextTier && (
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Next tier: {nextTier.label}</div>
              <div className="h-2 w-40 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${Math.min((totalContributed / nextTier.minAmount) * 100, 100)}%` }}
                />
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
          <div className="text-lg font-bold text-gray-900">{userStats?.campaignsBacked || campaignsBacked.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Rankings Active</div>
          <div className="text-lg font-bold text-gray-900">{leaderboard.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Rewards Earned</div>
          <div className="text-lg font-bold text-gray-900">{userStats?.rewardsEarned || rewardsList.length}</div>
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
          {loadingDonations ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading contributions...</div>
          ) : campaignsBacked.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="mx-auto h-8 w-8 text-gray-300 mb-1" />
              <p className="text-xs text-gray-500">No campaigns backed yet.</p>
              <Link to="/campaigns" className="mt-2 inline-block text-xs font-semibold text-primary-600 hover:underline">
                Explore Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaignsBacked.map((c: any) => {
                const target = c.campaign?.targetAmount || 0;
                const raised = c.campaign?.raisedAmount || 0;
                const progress = target > 0 ? Math.round((raised / target) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {c.campaign?.title || c.business?.name || "Community Cause"}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-sm font-bold text-gray-900">{fmt(c.amount)}</div>
                      <div className="text-[10px] text-gray-400">{progress}% funded</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaderboard Position */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Leaderboard</h3>
          {loadingLeaderboard ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center">
              <Trophy className="mx-auto h-8 w-8 text-gray-300 mb-1" />
              <p className="text-xs text-gray-500">Leaderboard is updating with new contributions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.userId || i} className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                      #{i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.firstName} {entry.lastName}</div>
                      <div className="text-[10px] text-gray-400">{entry.locationName || "United Kingdom"}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{fmt(entry.totalContributed)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rewards */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Rewards Earned</h3>
        {loadingRewards ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading rewards...</div>
        ) : rewardsList.length === 0 ? (
          <div className="py-8 text-center">
            <Gift className="mx-auto h-8 w-8 text-gray-300 mb-1" />
            <p className="text-xs text-gray-500">No rewards earned yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Contribute to campaigns with rewards to unlock them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rewardsList.map((r) => (
              <div key={r.id} className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <Gift className="mx-auto h-6 w-6 mb-2 text-green-500" />
                <div className="text-sm font-bold text-gray-900">{r.title}</div>
                {r.code && <div className="mt-1 font-mono text-xs font-bold text-gray-700">Code: {r.code}</div>}
                {r.earnedAt && (
                  <div className="text-[10px] text-green-600 mt-1">
                    Earned {new Date(r.earnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
