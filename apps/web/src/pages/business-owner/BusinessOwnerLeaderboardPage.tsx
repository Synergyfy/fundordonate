// =============================================================================
// Business Owner Leaderboard Page
// Leaderboard rankings for business owners, wired to live backend API.
// =============================================================================

import { useState } from "react";
import { ArrowUp, ArrowDown, Minus, AlertCircle, RefreshCw } from "lucide-react";
import { useLeaderboard } from "@/services/leaderboard/hook";
import { usePlanCapabilities } from "@/hooks/usePlanCapabilities";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const TIER_COLORS: Record<string, string> = {
  PLATINUM: "text-purple-600",
  GOLD: "text-yellow-600",
  SILVER: "text-gray-500",
  BRONZE: "text-amber-600",
  Platinum: "text-purple-600",
  Gold: "text-yellow-600",
  Silver: "text-gray-500",
  Bronze: "text-amber-600",
};

const SCOPES = [
  { id: "city" as const, label: "City", feature: "leaderboard.city" },
  { id: "local_area" as const, label: "Local Area", feature: "leaderboard.local" },
  { id: "national" as const, label: "National", feature: "leaderboard.national" },
];

export default function BusinessOwnerLeaderboardPage() {
  const [scope, setScope] = useState<"city" | "local_area" | "national">("city");
  const plan = usePlanCapabilities();
  const allowedScopes = SCOPES.filter((item) => plan.can(item.feature));
  const effectiveScope = allowedScopes.some((item) => item.id === scope)
    ? scope
    : allowedScopes[0]?.id ?? "city";
  const { data, isLoading, error, refetch } = useLeaderboard({
    scope: effectiveScope,
  });

  const currentRank = data?.currentRank;
  const entries = data?.entries || [];
  const canTrackRank = plan.can("leaderboard.rank_tracking");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">See how your business ranks against others this season.</p>
        </div>

        {/* Scope selector — only scopes included in the plan are shown */}
        <div className="flex rounded-lg border bg-gray-50 p-1 text-xs font-semibold">
          {allowedScopes.map((item) => (
            <button
              key={item.id}
              onClick={() => setScope(item.id)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                effectiveScope === item.id
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="font-semibold text-red-900">Failed to load leaderboard rankings.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Your Rank Card */}
      {!isLoading && !error && currentRank && canTrackRank && (
        <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-primary-100">Your Rank</div>
              <div className="text-4xl font-bold">#{currentRank.rank}</div>
              <div className="text-sm text-primary-100 mt-1">Out of {currentRank.totalBusinesses} active businesses</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary-100">Total Contributed</div>
              <div className="text-2xl font-bold">{fmt(currentRank.totalContributed)}</div>
              <div className="flex items-center justify-end gap-1 text-xs text-primary-100 mt-1">
                <Minus className="h-3 w-3" /> Current season
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No ranked businesses found for the selected {scope.replace("_", " ")} scope.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500 w-16">Rank</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Location</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Tier</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Contributed</th>
                  {canTrackRank && <th className="px-4 py-3 font-medium text-gray-500 w-20">Change</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry: any) => {
                  const isYou = entry.isCurrentBusiness;
                  return (
                    <tr key={entry.businessId} className={`${isYou ? "bg-primary-50/70" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${entry.rank <= 3 ? "text-yellow-600" : "text-gray-400"}`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isYou ? "text-primary-700" : "text-gray-900"}`}>
                            {entry.name}
                          </span>
                          {isYou && (
                            <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{entry.location}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`font-bold text-xs ${TIER_COLORS[entry.membershipTier] || "text-gray-600"}`}>
                          {entry.membershipTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt(entry.totalContributed)}</td>
                      {canTrackRank && (
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-bold ${
                          entry.change > 0 ? "text-green-600" : entry.change < 0 ? "text-red-600" : "text-gray-400"
                        }`}>
                          {entry.change > 0 ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : entry.change < 0 ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {Math.abs(entry.change) || "—"}
                        </span>
                      </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
