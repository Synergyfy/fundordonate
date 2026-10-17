// =============================================================================
// Admin — Engagement sections
// =============================================================================

import { useEffect, useState } from "react";
import { adminApi, type AdminReward } from "@/services/admin";
import { leaderboardApi, type Leaderboard } from "@/services/leaderboard";
import {
  AdminPageHeader,
  AdminLoading,
  AdminError,
  AdminEmpty,
  AdminTable,
  StatCard,
  fmtGbp,
} from "./shared";
import { Trophy, Sparkles, Award } from "lucide-react";

// ─── Rewards ────────────────────────────────────────────────────────────────

export function RewardsPage() {
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getRewards()
      .then((res) => {
        setRewards(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Rewards" description="Rewards configured across the platform." />
      <StatCard label="Total Rewards" value={rewards.length} />
      {rewards.length === 0 ? (
        <AdminEmpty message="No rewards configured yet." />
      ) : (
        <AdminTable columns={["Reward", "Code", "Audience", "Trigger", "Fulfilment"]}>
          {rewards.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                <span className="mr-1.5">{r.icon ?? "🎁"}</span>
                {r.name}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.code}</td>
              <td className="px-4 py-3 capitalize text-gray-500">{r.criteria?.audience ?? "—"}</td>
              <td className="px-4 py-3 capitalize text-gray-500">{r.criteria?.triggerMode ?? "—"}</td>
              <td className="px-4 py-3 capitalize text-gray-500">
                {(r.criteria?.fulfilmentType ?? "—").replace(/_/g, " ")}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Leaderboards ───────────────────────────────────────────────────────────

export function LeaderboardsPage() {
  const [overview, setOverview] = useState<{
    national: Leaderboard;
    cityLeaderboards: { cityId: string; cityName: string; entries: any[] }[];
    lastUpdated: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    leaderboardApi
      .getOverview()
      .then((res) => {
        setOverview(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;
  if (!overview) return <AdminEmpty message="No leaderboard data available yet." />;

  const nationalEntries = overview.national?.entries ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Leaderboards" description="National and per-city contributor leaderboards." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="National Entries" value={nationalEntries.length} />
        <StatCard label="City Leaderboards" value={overview.cityLeaderboards?.length ?? 0} />
        <StatCard label="Total Contributions" value={fmtGbp(overview.national?.totalEntries ?? 0)} sub="entries tracked" />
      </div>
      {nationalEntries.length === 0 ? (
        <AdminEmpty message="No national leaderboard entries yet." />
      ) : (
        <AdminTable columns={["Rank", "Contributor", "Total Contributed", "Campaigns"]}>
          {nationalEntries.map((e: any, i: number) => (
            <tr key={e.id ?? i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-bold text-gray-900">#{i + 1}</td>
              <td className="px-4 py-3 text-gray-900">{e.name ?? e.businessName ?? "—"}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">{fmtGbp(e.totalContributed ?? 0)}</td>
              <td className="px-4 py-3 text-gray-500">{e.campaignCount ?? 0}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Recognition (no backend yet) ───────────────────────────────────────────

export function RecognitionPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Recognition" description="Recognition tiers and badges." />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Recognition programmes</h2>
            <p className="text-sm text-gray-500">
              Configurable recognition tiers and badges are not available yet. Contributor recognition is
              currently derived from contribution milestones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Incentives (no backend yet) ───────────────────────────────────

export function CampaignIncentivesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Campaign Incentives" description="Incentives and bonus structures." />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Campaign incentives</h2>
            <p className="text-sm text-gray-500">
              Configurable campaign incentives are not available yet. Season engagement settings and reward
              rules control participation rewards today.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        <Trophy className="h-4 w-4" /> See <span className="font-medium text-gray-700">Rewards → Reward Rules</span> for
        current reward triggers.
      </div>
    </div>
  );
}
