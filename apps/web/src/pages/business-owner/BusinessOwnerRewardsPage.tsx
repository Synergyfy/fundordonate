// =============================================================================
// Business Owner Rewards Page
// View earned rewards and unlock new ones, wired to live backend API.
// =============================================================================

import { Award, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useRewards } from "@/services/reward/hook";

export default function BusinessOwnerRewardsPage() {
  const { data, isLoading, error, refetch } = useRewards();

  const earned = data?.earned || [];
  const locked = data?.locked || [];
  const earnedCount = data?.earnedCount || 0;
  const totalCount = data?.totalCount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
        <p className="text-sm text-gray-500">Track your earned rewards and see what's next to unlock.</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="font-semibold text-red-900">Failed to load rewards progress.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && (
        <>
          <div className="rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-100">Rewards Earned</div>
                <div className="text-4xl font-bold">{earnedCount} / {totalCount}</div>
              </div>
              <Award className="h-12 w-12 text-yellow-200" />
            </div>
          </div>

          {/* Earned Rewards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Earned Rewards</h2>
            {earned.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 border">
                No rewards unlocked yet. Keep contributing and launching campaigns to earn recognition!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {earned.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm border flex items-start gap-3">
                    <div className="text-3xl">{r.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                      {r.earnedAt && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check className="h-3 w-3" /> Earned on {r.earnedAt}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked Rewards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Locked Rewards</h2>
            {locked.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 border">
                All available rewards have been unlocked! 🏆
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locked.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm border border-dashed border-gray-300 flex items-start gap-3">
                    <div className="text-3xl opacity-40">{r.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{r.progress ?? 0}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.progress ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
