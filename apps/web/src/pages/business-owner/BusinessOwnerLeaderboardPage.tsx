// =============================================================================
// Business Owner Leaderboard Page
// Leaderboard rankings for business owners.
// =============================================================================

import { ArrowUp, ArrowDown, Minus } from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_LEADERBOARD = [
  { rank: 1, name: "Green Valley Cafe", location: "Birmingham", tier: "Platinum", totalContributed: 285000, change: 0 },
  { rank: 2, name: "Manchester Books Ltd", location: "Leeds", tier: "Gold", totalContributed: 198000, change: 2 },
  { rank: 3, name: "Sarah's Bakery", location: "Manchester", tier: "Gold", totalContributed: 125000, change: -1 },
  { rank: 4, name: "The Local Pub", location: "Liverpool", tier: "Silver", totalContributed: 95000, change: 1 },
  { rank: 5, name: "Tech Hub Manchester", location: "Manchester", tier: "Silver", totalContributed: 82000, change: -2 },
  { rank: 6, name: "Blue Sky Fitness", location: "London", tier: "Gold", totalContributed: 78000, change: 3 },
  { rank: 7, name: "The Corner Shop", location: "Bristol", tier: "Bronze", totalContributed: 45000, change: 0 },
  { rank: 8, name: "Fresh Bites", location: "Leeds", tier: "Bronze", totalContributed: 38000, change: 1 },
];

const TIER_COLORS: Record<string, string> = {
  Platinum: "text-purple-600", Gold: "text-yellow-600", Silver: "text-gray-500", Bronze: "text-amber-600",
};

export default function BusinessOwnerLeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500">See how your business ranks against others this season.</p>
      </div>

      {/* Your Rank Card */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-primary-100">Your Rank</div>
            <div className="text-4xl font-bold">#3</div>
            <div className="text-sm text-primary-100 mt-1">Sarah's Bakery · Manchester</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-100">Total Contributed</div>
            <div className="text-2xl font-bold">{fmt(125000)}</div>
            <div className="flex items-center gap-1 text-sm text-red-200 mt-1">
              <ArrowDown className="h-3 w-3" /> -1 from last season
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">Rank</th>
              <th className="px-4 py-3 font-medium text-gray-500">Business</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Location</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Tier</th>
              <th className="px-4 py-3 font-medium text-gray-500">Contributed</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DEMO_LEADERBOARD.map((entry) => {
              const isYou = entry.rank === 3;
              return (
                <tr key={entry.rank} className={`${isYou ? "bg-primary-50" : "hover:bg-gray-50"}`}>
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
                      {isYou && <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">YOU</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{entry.location}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`font-bold text-xs ${TIER_COLORS[entry.tier]}`}>{entry.tier}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(entry.totalContributed)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-bold ${
                      entry.change > 0 ? "text-green-600" : entry.change < 0 ? "text-red-600" : "text-gray-400"
                    }`}>
                      {entry.change > 0 ? <ArrowUp className="h-3 w-3" /> : entry.change < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {Math.abs(entry.change) || "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
