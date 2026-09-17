// =============================================================================
// Business Owner Rewards Page
// View earned rewards and unlock new ones.
// =============================================================================

import { Award, Check } from "lucide-react";

const DEMO_REWARDS = [
  { id: "r1", name: "Feed Manchester Champion", description: "Contributed over £50,000 to Feed Manchester.", icon: "🏆", earned: true, earnedAt: "2026-08-15" },
  { id: "r2", name: "Holiday Hero 2026", description: "Participated in the Holiday Meal Drive.", icon: "🎄", earned: true, earnedAt: "2025-12-20" },
  { id: "r3", name: "Community Builder", description: "Supported 3+ community campaigns.", icon: "🏘️", earned: true, earnedAt: "2026-06-10" },
  { id: "r4", name: "Youth Champion", description: "Contributed over £20,000 to youth programmes.", icon: "🎓", earned: true, earnedAt: "2026-07-22" },
  { id: "r5", name: "Seasonal Star", description: "Top 5 contributor in any season.", icon: "⭐", earned: false, progress: 75 },
  { id: "r6", name: "City Leader", description: "Rank #1 in your city leaderboard.", icon: "👑", earned: false, progress: 60 },
  { id: "r7", name: "Platinum Achiever", description: "Reach £250,000 total contributions.", icon: "💎", earned: false, progress: 50 },
  { id: "r8", name: "Backer Magnet", description: "Attract 200+ backers to your campaigns.", icon: "🧲", earned: false, progress: 78 },
];

export default function BusinessOwnerRewardsPage() {
  const earned = DEMO_REWARDS.filter((r) => r.earned);
  const locked = DEMO_REWARDS.filter((r) => !r.earned);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
        <p className="text-sm text-gray-500">Track your earned rewards and see what's next to unlock.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-yellow-100">Rewards Earned</div>
            <div className="text-4xl font-bold">{earned.length} / {DEMO_REWARDS.length}</div>
          </div>
          <Award className="h-12 w-12 text-yellow-200" />
        </div>
      </div>

      {/* Earned Rewards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Earned Rewards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {earned.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm border flex items-start gap-3">
              <div className="text-3xl">{r.icon}</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Check className="h-3 w-3" /> Earned {r.earnedAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Rewards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Locked Rewards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locked.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm border border-dashed border-gray-300 flex items-start gap-3">
              <div className="text-3xl opacity-40">{r.icon}</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-500">{r.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{r.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
