// =============================================================================
// Rewards Display Component
// Shows available rewards for a city or borough location.
// =============================================================================

import { useState, useEffect } from "react";
import { rewardsApi, type CityReward, type BoroughReward } from "@/services/rewards.service";
import { Gift } from "lucide-react";

const REWARD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

interface RewardsDisplayProps {
  /** Location ID */
  locationId: string;
  /** Location level: city or borough */
  level: "city" | "borough";
  /** Location name for display */
  locationName: string;
  /** Compact or full display */
  variant?: "compact" | "full";
}

export function RewardsDisplay({ locationId, level, locationName, variant = "full" }: RewardsDisplayProps) {
  const [rewards, setRewards] = useState<(CityReward | BoroughReward)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFn = level === "city"
      ? rewardsApi.getCityRewards(locationId)
      : rewardsApi.getBoroughRewards(locationId);

    fetchFn.then((data) => {
      setRewards(data);
      setLoading(false);
    });
  }, [locationId, level]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">Rewards</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">
            {level === "city" ? "City" : "Borough"} Rewards
          </h3>
        </div>
        <span className="text-xs text-gray-500">{rewards.length} available</span>
      </div>

      <div className={`space-y-3 ${variant === "compact" ? "max-h-48 overflow-y-auto" : ""}`}>
        {rewards.map((reward) => {
          const colors = REWARD_COLORS[reward.badgeColor || "amber"] || { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
          return (
            <div
              key={reward.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${colors.border} ${colors.bg}`}
            >
              <span className="text-2xl">{reward.badgeIcon || "⭐"}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${colors.text}`}>{reward.title}</div>
                <div className="text-xs text-gray-600 line-clamp-1">{reward.description}</div>
                {reward.pointsValue && (
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    +{reward.pointsValue} points
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500">
                  {reward.grantedCount.toLocaleString()} granted
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {variant === "full" && (
        <div className="mt-4 text-center text-xs text-gray-400">
          Contribute to {locationName} campaigns to earn these rewards
        </div>
      )}
    </div>
  );
}
