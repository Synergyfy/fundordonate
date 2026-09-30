// =============================================================================
// Business Owner Leaderboards — Admin
// Ranking of business owners by funds raised (frontend demo data).
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trophy, TrendingUp, Users, Crown } from "lucide-react";

interface LeaderboardRow {
  id: string;
  owner: string;
  business: string;
  city: string;
  seasonRaised: number; // £
  allTimeRaised: number; // £
  seasonCampaigns: number;
  allTimeCampaigns: number;
  backers: number;
}

const DEMO_LEADERBOARD: LeaderboardRow[] = [
  { id: "bo-3", owner: "Michael Okafor", business: "Community Fund London", city: "London", seasonRaised: 65000, allTimeRaised: 148000, seasonCampaigns: 4, allTimeCampaigns: 9, backers: 290 },
  { id: "bo-1", owner: "James Wilson", business: "TechStart Manchester", city: "Manchester", seasonRaised: 42000, allTimeRaised: 96000, seasonCampaigns: 3, allTimeCampaigns: 7, backers: 180 },
  { id: "bo-2", owner: "Sarah Chen", business: "Green Initiative Ltd", city: "Birmingham", seasonRaised: 28000, allTimeRaised: 71000, seasonCampaigns: 2, allTimeCampaigns: 6, backers: 120 },
  { id: "bo-4", owner: "Emma Thompson", business: "Digital Skills Leeds", city: "Leeds", seasonRaised: 15000, allTimeRaised: 38000, seasonCampaigns: 1, allTimeCampaigns: 4, backers: 85 },
  { id: "bo-6", owner: "Lisa Patel", business: "Liverpool Green Spaces", city: "Liverpool", seasonRaised: 9500, allTimeRaised: 24000, seasonCampaigns: 1, allTimeCampaigns: 3, backers: 45 },
  { id: "bo-7", owner: "Priya Sharma", business: "Camden Coffee House", city: "London", seasonRaised: 7800, allTimeRaised: 19500, seasonCampaigns: 2, allTimeCampaigns: 3, backers: 38 },
  { id: "bo-8", owner: "Tom Bradley", business: "Sheffield Steel Works", city: "Sheffield", seasonRaised: 6100, allTimeRaised: 15400, seasonCampaigns: 1, allTimeCampaigns: 2, backers: 27 },
  { id: "bo-5", owner: "David Brown", business: "Bristol Tech Hub", city: "Bristol", seasonRaised: 4200, allTimeRaised: 12800, seasonCampaigns: 1, allTimeCampaigns: 2, backers: 22 },
];

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

type Period = "season" | "all";

const PODIUM_STYLES = [
  { ring: "ring-amber-300", bg: "bg-amber-100", text: "text-amber-700", label: "1st" },
  { ring: "ring-gray-300", bg: "bg-gray-100", text: "text-gray-700", label: "2nd" },
  { ring: "ring-orange-200", bg: "bg-orange-50", text: "text-orange-700", label: "3rd" },
];

export function BusinessLeaderboardsPage() {
  const [period, setPeriod] = useState<Period>("season");

  const ranked = useMemo(() => {
    const key = period === "season" ? "seasonRaised" : "allTimeRaised";
    return [...DEMO_LEADERBOARD].sort((a, b) => b[key] - a[key]);
  }, [period]);

  const totalRaised = ranked.reduce((sum, r) => sum + (period === "season" ? r.seasonRaised : r.allTimeRaised), 0);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/admin/business-owners" className="hover:text-gray-700">Business Owners</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Leaderboards</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Owner Leaderboards</h1>
          <p className="text-sm text-gray-500">Ranking of business owners by funds raised</p>
        </div>
        <div className="flex gap-1 self-start rounded-lg bg-gray-100 p-1 sm:self-auto">
          <button
            onClick={() => setPeriod("season")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              period === "season" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            This Season
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              period === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Trophy className="h-3.5 w-3.5" /> Ranked Owners</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{ranked.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><TrendingUp className="h-3.5 w-3.5" /> Total Raised</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(totalRaised)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Top Earner</div>
          <div className="mt-1 truncate text-lg font-bold text-gray-900">{ranked[0]?.owner || "—"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><Users className="h-3.5 w-3.5" /> Total Backers</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{ranked.reduce((s, r) => s + r.backers, 0)}</div>
        </div>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {podium.map((row, i) => {
          const style = PODIUM_STYLES[i]!;
          const raised = period === "season" ? row.seasonRaised : row.allTimeRaised;
          return (
            <div key={row.id} className={`rounded-xl border bg-white p-4 text-center shadow-sm ring-2 ${style.ring}`}>
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${style.bg}`}>
                {i === 0 ? <Crown className={`h-6 w-6 ${style.text}`} /> : <Trophy className={`h-6 w-6 ${style.text}`} />}
              </div>
              <div className={`mt-2 text-xs font-bold ${style.text}`}>{style.label} Place</div>
              <div className="mt-1 truncate text-sm font-semibold text-gray-900">{row.owner}</div>
              <div className="truncate text-xs text-gray-500">{row.business}</div>
              <div className="mt-2 text-lg font-bold text-gray-900">{gbp(raised)}</div>
              <div className="text-xs text-gray-400">{row.city}</div>
            </div>
          );
        })}
      </div>

      {/* Full ranking */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Rank</th>
              <th className="px-4 py-3 font-medium text-gray-500">Business Owner</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">City</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Campaigns</th>
              <th className="px-4 py-3 font-medium text-gray-500">Backers</th>
              <th className="px-4 py-3 font-medium text-gray-500">Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ranked.map((row, i) => {
              const raised = period === "season" ? row.seasonRaised : row.allTimeRaised;
              const campaigns = period === "season" ? row.seasonCampaigns : row.allTimeCampaigns;
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-50 text-orange-700" : "text-gray-500"
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.owner}</p>
                    <p className="text-xs text-gray-400">{row.business}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell">{row.city}</td>
                  <td className="hidden px-4 py-3 text-sm text-gray-600 lg:table-cell">{campaigns}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.backers}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{gbp(raised)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom 3 excluded note is unnecessary — rest shown above; keep summary */}
      <p className="text-center text-xs text-gray-400">
        {rest.length} more owners ranked below the podium · values shown for {period === "season" ? "the current season" : "all time"}
      </p>
    </div>
  );
}
