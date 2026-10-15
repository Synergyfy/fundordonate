// =============================================================================
// Business Owner Leaderboards — Admin
// Ranking of business owners by funds raised (live database data).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trophy, TrendingUp, Users, Crown } from "lucide-react";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard";

interface FormattedRow {
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
  const [rows, setRows] = useState<FormattedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const res = await leaderboardService.getBusinessLeaderboard({ limit: 50 });
        if (!mounted) return;
        const entries: LeaderboardEntry[] = res?.entries || [];
        const mapped: FormattedRow[] = entries.map((e: any, idx: number) => {
          const bName = e.name || e.business?.name || e.user?.username || `Partner #${idx + 1}`;
          const raisedPence = e.totalContributed || 0;
          const raisedGbp = Math.round(raisedPence / 100);
          return {
            id: e.id || e.businessId || String(idx),
            owner: e.user ? `${e.user.firstName || ""} ${e.user.lastName || ""}`.trim() || bName : bName,
            business: bName,
            city: e.location || e.locationName || "UK Hub",
            seasonRaised: raisedGbp,
            allTimeRaised: e.allTimeRaised ? Math.round(e.allTimeRaised / 100) : raisedGbp,
            seasonCampaigns: e.campaignCount || 0,
            allTimeCampaigns: e.allTimeCampaigns || e.campaignCount || 0,
            backers: e.backerCount || e.backers || 0,
          };
        });
        setRows(mapped);
      } catch (err) {
        console.error("Failed to load business leaderboard:", err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => {
      mounted = false;
    };
  }, []);

  const ranked = useMemo(() => {
    const key = period === "season" ? "seasonRaised" : "allTimeRaised";
    return [...rows].sort((a, b) => b[key] - a[key]);
  }, [rows, period]);

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
            All-Time
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400">
          Loading leaderboard rankings from database...
        </div>
      ) : ranked.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
          No leaderboard entries available yet.
        </div>
      ) : (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Trophy className="h-3.5 w-3.5 text-amber-500" /> Ranked Businesses</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{ranked.length}</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><TrendingUp className="h-3.5 w-3.5 text-green-500" /> Total {period === "season" ? "Season" : "All-Time"} Raised</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{gbp(totalRaised)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Crown className="h-3.5 w-3.5 text-amber-500" /> Current Leader</div>
              <div className="mt-1 truncate text-lg font-bold text-gray-900">{podium[0]?.business || "—"}</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Users className="h-3.5 w-3.5" /> Total Backers</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{ranked.reduce((s, r) => s + r.backers, 0)}</div>
            </div>
          </div>

          {/* Podium */}
          {podium.length >= 3 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[podium[1], podium[0], podium[2]].map((row, idx) => {
                const actualRank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                const style = PODIUM_STYLES[actualRank - 1];
                const raised = period === "season" ? row.seasonRaised : row.allTimeRaised;
                const campaigns = period === "season" ? row.seasonCampaigns : row.allTimeCampaigns;
                return (
                  <div
                    key={row.id}
                    className={`relative rounded-xl border bg-white p-5 shadow-sm ring-2 ${style.ring} ${actualRank === 1 ? "md:-mt-2" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-gray-400">{row.city}</span>
                    </div>
                    <div className="mt-3">
                      <div className="font-bold text-gray-900">{row.business}</div>
                      <div className="text-xs text-gray-500">{row.owner}</div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500">{campaigns} campaigns · {row.backers} backers</span>
                      <span className="text-lg font-bold text-gray-900">{gbp(raised)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Rank</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Business</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Owner</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">City</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Raised ({period === "season" ? "Season" : "All-Time"})</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Campaigns</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Backers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranked.map((row, i) => {
                  const raised = period === "season" ? row.seasonRaised : row.allTimeRaised;
                  const campaigns = period === "season" ? row.seasonCampaigns : row.allTimeCampaigns;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-500">#{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.business}</td>
                      <td className="px-4 py-3 text-gray-600">{row.owner}</td>
                      <td className="px-4 py-3 text-gray-500">{row.city}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{gbp(raised)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{campaigns}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.backers}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
