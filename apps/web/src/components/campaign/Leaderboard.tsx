// =============================================================================
// Leaderboard Component
// Reusable leaderboard display with configurable size.
// =============================================================================

import { useState, useEffect } from "react";
import { leaderboardApi, type Leaderboard, type LeaderboardEntry } from "@/services/leaderboard.service";
import { Trophy, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { getLeaderboardEntryAriaLabel } from "@/utils/accessibility";

const RANK_META: Record<number, { icon: string; color: string; bg: string }> = {
  1: { icon: "🥇", color: "text-amber-600", bg: "bg-amber-50" },
  2: { icon: "🥈", color: "text-gray-500", bg: "bg-gray-50" },
  3: { icon: "🥉", color: "text-orange-600", bg: "bg-orange-50" },
};

const TIER_BADGES: Record<string, { label: string; color: string }> = {
  NATIONAL: { label: "🇬🇧", color: "text-blue-600" },
  CITY: { label: "🏙️", color: "text-green-600" },
  BACKER: { label: "🤝", color: "text-purple-600" },
};

interface LeaderboardProps {
  /** The hierarchy scope */
  level: "campaign" | "city" | "borough" | "high_street" | "national";
  /** The scope ID (required for non-national) */
  scopeId?: string;
  /** Number of entries to show */
  size?: 5 | 10 | 50 | 100 | 500 | 1000;
  /** Whether this is an urgency-based leaderboard */
  isUrgency?: boolean;
  /** Number of qualifying spots (for urgency) */
  qualificationLimit?: number;
  /** Time window in hours (for urgency) */
  qualificationWindowHours?: number;
  /** Show as compact or full view */
  variant?: "compact" | "full";
  /** Title override */
  title?: string;
}

export function Leaderboard({
  level,
  scopeId,
  size = 10,
  isUrgency = false,
  qualificationLimit = 10,
  qualificationWindowHours = 72,
  variant = "full",
  title,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    setLoading(true);

    const fetchFn = isUrgency
      ? leaderboardApi.getUrgencyLeaderboard(level, scopeId!, qualificationLimit, qualificationWindowHours)
      : leaderboardApi.getLeaderboard(level, scopeId, size);

    fetchFn.then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, [level, scopeId, size, isUrgency, qualificationLimit, qualificationWindowHours]);

  // Countdown timer for urgency
  useEffect(() => {
    if (!isUrgency || !leaderboard?.entries?.[0]?.qualificationExpiresAt) return;

    const interval = setInterval(() => {
      const expiresAtStr = leaderboard?.entries?.[0]?.qualificationExpiresAt;
      if (!expiresAtStr) return;
      const expiresAt = new Date(expiresAtStr);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }, 60000);

    // Initial calculation
    const expiresAtInit = leaderboard?.entries?.[0]?.qualificationExpiresAt;
    if (expiresAtInit) {
      const expiresAt = new Date(expiresAtInit);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }

    return () => clearInterval(interval);
  }, [leaderboard, isUrgency]);

  const displayEntries = showAll ? leaderboard?.entries : leaderboard?.entries?.slice(0, size);
  const scopeLabel = level === "campaign" ? "Campaign" : level === "city" ? "City" : level === "borough" ? "Borough" : level === "high_street" ? "High Street" : "National";
  const displayTitle = title || `${scopeLabel} Leaderboard`;

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">{displayTitle}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200 mt-1" />
              </div>
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">{displayTitle}</h3>
        </div>
        <div className="flex items-center gap-3">
          {isUrgency && timeLeft && (
            <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
              <Clock className="h-4 w-4" />
              {timeLeft}
            </div>
          )}
          <span className="text-xs text-gray-500">
            {leaderboard.totalEntries} contributor{leaderboard.totalEntries !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Urgency Banner */}
      {isUrgency && (
        <div className="mb-4 rounded-xl bg-orange-50 p-3 text-center">
          <div className="text-sm font-bold text-orange-700">
            🏆 First {qualificationLimit} qualify!
          </div>
          <div className="text-xs text-orange-600">
            Top contributors earn exclusive rewards
          </div>
        </div>
      )}

      <div className="space-y-2" role="list" aria-label={displayTitle}>
        {displayEntries?.map((entry) => (
          <LeaderboardRow key={entry.id} entry={entry} variant={variant} />
        ))}
      </div>

      {leaderboard.entries.length > size && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {showAll ? "Show fewer" : `View all ${leaderboard.entries.length} contributors`}
          {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}

      <div className="mt-3 text-center text-xs text-gray-400">
        Updated {new Date(leaderboard.lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </div>
    </div>
  );
}

// =============================================================================
// Leaderboard Row
// =============================================================================

function LeaderboardRow({
  entry,
  variant,
}: {
  entry: LeaderboardEntry;
  variant: "compact" | "full";
}) {
  const rankMeta = RANK_META[entry.rank];
  const tierMeta = entry.backerTier ? TIER_BADGES[entry.backerTier] : null;
  const isQualified = entry.qualificationStatus === "qualified";
  const name = entry.user?.firstName
    ? `${entry.user.firstName} ${entry.user.lastName || ""}`.trim()
    : entry.user?.username || "Anonymous";

  const ariaLabel = getLeaderboardEntryAriaLabel(entry);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl p-2 transition-colors sm:gap-3 sm:p-3 ${
        isQualified
          ? "bg-green-50 border border-green-200"
          : rankMeta
          ? rankMeta.bg
          : "hover:bg-gray-50"
      }`}
      role="listitem"
      aria-label={ariaLabel}
    >
      {/* Rank */}
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold sm:h-8 sm:w-8 sm:text-sm ${
        rankMeta ? rankMeta.color : "text-gray-500"
      }`}>
        {rankMeta ? rankMeta.icon : entry.rank}
      </div>

      {/* Avatar */}
      {entry.user?.avatar ? (
        <img
          src={entry.user.avatar}
          alt=""
          className="h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 sm:h-10 sm:w-10 sm:text-sm">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs font-medium text-gray-900 truncate sm:text-sm">{name}</span>
          {entry.isOriginalFoundingMember && (
            <span className="hidden text-[10px] font-bold text-amber-600 sm:inline">⭐ Original</span>
          )}
          {tierMeta && variant === "full" && (
            <span className={`hidden text-xs sm:inline ${tierMeta.color}`}>{tierMeta.label}</span>
          )}
          {isQualified && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1 py-0.5 text-[8px] font-bold text-green-700 sm:px-1.5 sm:text-[9px]">
              ✓ Qualified
            </span>
          )}
        </div>
        {variant === "full" && (
          <div className="text-[10px] text-gray-500 sm:text-xs">
            {entry.campaignCount} campaign{entry.campaignCount !== 1 ? "s" : ""} backed
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="text-right">
        <div className="text-xs font-bold text-gray-900 sm:text-sm">
          £{(entry.totalContributed / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
        </div>
        {variant === "full" && (
          <div className="hidden text-[10px] text-gray-500 sm:block">total contributed</div>
        )}
      </div>
    </div>
  );
}
