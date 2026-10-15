// =============================================================================
// Campaign Tracking Page
// Allows consumers to track their contributions, bookmarks, rewards, and
// leaderboard position across all campaigns using live API data.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Gift,
  Heart,
  LayoutDashboard,
  Search,
  Star,
  Trophy,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { userDashboardApi, type UserDashboardStats } from "@/services/user-dashboard";
import { consumerApi } from "@/services/consumer";
import { leaderboardApi, type LeaderboardEntry } from "@/services/leaderboard";
import type { IssuedReward } from "@/types/rewards";

// ── Types ──

interface CampaignTrackingPageProps {
  userId?: string;
}

type TabId = "contributions" | "bookmarks" | "rewards" | "leaderboard";

export interface ConsumerTrackedContribution {
  id: string;
  campaignTitle: string;
  campaignSlug: string;
  amountPence: number;
  date: string;
  status: "completed" | "pending" | "failed";
  progressPct: number;
  type: string;
  reward?: string;
}

export interface BookmarkedCampaign {
  id: string;
  campaignTitle: string;
  campaignSlug: string;
  goalPence: number;
  raisedPence: number;
  deadline?: string;
  featuredImage?: string;
}

export interface TrackingStats {
  totalContributed: number;
  activeCampaigns: number;
  rewardsEarned: number;
  leaderboardPosition: number;
}

const CONTRIBUTION_TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  backer: { label: "Backer", emoji: "🤝", color: "text-primary-600 bg-primary-50" },
  founding_member: { label: "Founding Member", emoji: "👑", color: "text-amber-600 bg-amber-50" },
  founding_monthly: { label: "Founding Monthly", emoji: "🔄", color: "text-purple-600 bg-purple-50" },
  donate: { label: "Donate", emoji: "💚", color: "text-green-600 bg-green-50" },
  donation: { label: "Donation", emoji: "💚", color: "text-green-600 bg-green-50" },
  pledge: { label: "Pledge", emoji: "🤝", color: "text-primary-600 bg-primary-50" },
};

const DEFAULT_TYPE_META = { label: "Supporter", emoji: "🤝", color: "text-gray-600 bg-gray-50" };

// ── Helpers ──

function formatPence(pence: number): string {
  const gbp = (pence || 0) / 100;
  return `£${gbp.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-Components ──

function StatsCards({ stats }: { stats: TrackingStats }) {
  const cards = [
    {
      icon: TrendingUp,
      label: "Total Contributed",
      value: formatPence(stats.totalContributed),
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      icon: LayoutDashboard,
      label: "Active Campaigns",
      value: stats.activeCampaigns.toString(),
      color: "text-secondary-600",
      bg: "bg-secondary-50",
    },
    {
      icon: Gift,
      label: "Rewards Earned",
      value: stats.rewardsEarned.toString(),
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: Trophy,
      label: "Leaderboard Position",
      value: stats.leaderboardPosition > 0 ? `#${stats.leaderboardPosition}` : "—",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function ContributionsTab({
  contributions,
  loading,
}: {
  contributions: ConsumerTrackedContribution[];
  loading: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return contributions.filter((c) =>
      c.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contributions, searchQuery]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
        Loading contributions...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contributions..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-700">No contributions found</p>
          <p className="mt-1 text-xs text-gray-400">
            {searchQuery
              ? "Try adjusting your search query."
              : "Support high streets and local causes to see your activity here."}
          </p>
          <Link
            to="/campaigns"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const normalizedType = c.type.toLowerCase();
            const typeMeta = CONTRIBUTION_TYPE_META[normalizedType] ?? DEFAULT_TYPE_META;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{c.campaignTitle}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${typeMeta.color}`}
                      >
                        {typeMeta.emoji} {typeMeta.label}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(c.date)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPence(c.amountPence)}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : c.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {c.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {c.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Campaign progress</span>
                    <span className="font-medium">{c.progressPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, c.progressPct))}%` }}
                    />
                  </div>
                </div>

                {c.reward && (
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                    <Gift className="h-3.5 w-3.5" />
                    <span className="font-medium">{c.reward}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookmarksTab({
  bookmarks,
  onRemoveBookmark,
}: {
  bookmarks: BookmarkedCampaign[];
  onRemoveBookmark: (id: string) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <Bookmark className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-700">No bookmarks saved</p>
        <p className="mt-1 text-xs text-gray-400">
          Save campaigns you want to track or support later.
        </p>
        <Link
          to="/campaigns"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Discover Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((b) => {
        const progressPct =
          b.goalPence > 0 ? Math.round((b.raisedPence / b.goalPence) * 100) : 0;
        return (
          <div
            key={b.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{b.campaignTitle}</p>
                {b.deadline && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Ends {formatDate(b.deadline)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveBookmark(b.id)}
                title="Remove Bookmark"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-primary-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </button>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{formatPence(b.raisedPence)} raised</span>
                <span className="font-medium">{progressPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                of {formatPence(b.goalPence)} goal
              </p>
            </div>

            <Link
              to={b.campaignSlug ? `/campaigns/${b.campaignSlug}` : `/campaigns/${b.id}`}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              <Heart className="h-3.5 w-3.5" />
              Contribute
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function RewardsTab({
  rewards,
  loading,
}: {
  rewards: IssuedReward[];
  loading: boolean;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
        Loading rewards...
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <Gift className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-700">No rewards earned yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Back campaigns with reward tiers to unlock digital gift cards, vouchers, and badges.
        </p>
        <Link
          to="/campaigns"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Explore Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rewards.map((r) => {
        const isRedeemed = (r.status || "").toUpperCase() === "REDEEMED";
        const isIssued = (r.status || "").toUpperCase() === "ISSUED";
        return (
          <div
            key={r.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="font-semibold text-gray-900">{r.title}</p>
                </div>
                {r.campaignTitle && (
                  <p className="mt-0.5 text-xs text-gray-500">{r.campaignTitle}</p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isRedeemed
                    ? "bg-green-50 text-green-700"
                    : isIssued
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isRedeemed ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Redeemed
                  </>
                ) : isIssued ? (
                  "Active / Ready"
                ) : (
                  r.status
                )}
              </span>
            </div>

            {r.code && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 p-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Redemption Code
                  </span>
                  <p className="font-mono text-sm font-bold text-gray-900 tracking-wider">
                    {r.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(r.id, r.code!)}
                  className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50"
                >
                  {copiedId === r.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              {r.value ? (
                <span>Value: {formatPence(r.value * 100)}</span>
              ) : (
                <span />
              )}
              {r.earnedAt && <span>Earned {formatDate(r.earnedAt)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardTab({
  entries,
  currentUserId,
  loading,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  loading: boolean;
}) {
  const yourEntry = useMemo(() => {
    if (!currentUserId) return null;
    return entries.find((e) => e.userId === currentUserId);
  }, [entries, currentUserId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
        Loading leaderboard...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <Trophy className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-700">Leaderboard is warming up</p>
        <p className="mt-1 text-xs text-gray-400">
          Rankings update as contributors support local campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Your Position */}
      {yourEntry && (
        <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              #{yourEntry.rank}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary-900">Your Position</p>
              <p className="text-xs text-primary-600">
                {formatPence(yourEntry.totalContributed)} across {yourEntry.campaignCount} campaigns
              </p>
            </div>
            <Star className="h-5 w-5 text-primary-400" />
          </div>
        </div>
      )}

      {/* Top Contributors */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Top Contributors</h3>
        <div className="space-y-2">
          {entries.slice(0, 10).map((entry) => {
            const isTop3 = entry.rank <= 3;
            const rankEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
            const displayName =
              [entry.user?.firstName, entry.user?.lastName].filter(Boolean).join(" ") ||
              entry.user?.username ||
              `Contributor #${entry.rank}`;

            return (
              <div
                key={entry.id || entry.rank}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  isTop3 ? "bg-amber-50 border border-amber-100" : "bg-white border border-gray-100"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    isTop3
                      ? "text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {rankEmoji || entry.rank}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-500">
                    {entry.campaignCount} campaigns backed
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {formatPence(entry.totalContributed)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tabs ──

const TABS: { id: TabId; label: string; icon: typeof Heart }[] = [
  { id: "contributions", label: "My Contributions", icon: Heart },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
];

// ── Main Component ──

export function CampaignTrackingPage({ userId }: CampaignTrackingPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("contributions");

  const [stats, setStats] = useState<TrackingStats>({
    totalContributed: 0,
    activeCampaigns: 0,
    rewardsEarned: 0,
    leaderboardPosition: 0,
  });

  const [contributions, setContributions] = useState<ConsumerTrackedContribution[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedCampaign[]>([]);
  const [rewards, setRewards] = useState<IssuedReward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loadingContributions, setLoadingContributions] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Load Bookmarks from Local Storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fod_bookmarked_campaigns");
      if (raw) {
        setBookmarks(JSON.parse(raw));
      }
    } catch {
      setBookmarks([]);
    }
  }, []);

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem("fod_bookmarked_campaigns", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Load User Stats & Donations
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoadingContributions(true);
      try {
        const [statsRes, donationsRes] = await Promise.allSettled([
          userDashboardApi.getStats(),
          userDashboardApi.getDonations({ limit: 50 }),
        ]);

        if (!mounted) return;

        if (statsRes.status === "fulfilled" && statsRes.value) {
          const s = statsRes.value;
          setStats((prev) => ({
            ...prev,
            totalContributed: s.totalContributed || 0,
            activeCampaigns: s.campaignsBacked || 0,
            rewardsEarned: s.rewardsEarned || 0,
          }));
        }

        if (donationsRes.status === "fulfilled" && donationsRes.value) {
          const rawItems = (donationsRes.value as any)?.items || [];
          const mapped: ConsumerTrackedContribution[] = rawItems.map((item: any) => {
            const target = item.campaign?.targetAmount || 0;
            const raised = item.campaign?.raisedAmount || 0;
            const progress = target > 0 ? Math.round((raised / target) * 100) : 0;
            return {
              id: item.id,
              campaignTitle: item.campaign?.title || item.business?.name || "Community Campaign",
              campaignSlug: item.campaign?.slug || item.campaignId || "",
              amountPence: item.amount || 0,
              date: item.createdAt || new Date().toISOString(),
              status: ((item.status || "completed").toLowerCase()) as any,
              progressPct: progress,
              type: item.type || "backer",
              reward: item.rewardTitle || item.metadata?.rewardTitle,
            };
          });
          setContributions(mapped);
        }
      } catch {
        // Fallback to empty state
      } finally {
        if (mounted) setLoadingContributions(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Load Rewards
  useEffect(() => {
    let mounted = true;
    async function loadRewards() {
      setLoadingRewards(true);
      try {
        const res = await consumerApi.getRewards({ limit: 50 });
        if (!mounted) return;
        setRewards(res?.items || []);
        if (res?.total !== undefined) {
          setStats((prev) => ({ ...prev, rewardsEarned: res.total }));
        }
      } catch {
        if (mounted) setRewards([]);
      } finally {
        if (mounted) setLoadingRewards(false);
      }
    }

    loadRewards();
    return () => {
      mounted = false;
    };
  }, []);

  // Load Leaderboard
  useEffect(() => {
    let mounted = true;
    async function loadLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const res = await leaderboardApi.getLeaderboard("national", undefined, 10);
        if (!mounted) return;
        const entries = res?.entries || [];
        setLeaderboard(entries);
        if (userId) {
          const rankIdx = entries.findIndex((e: LeaderboardEntry) => e.userId === userId);
          if (rankIdx !== -1) {
            setStats((prev) => ({ ...prev, leaderboardPosition: rankIdx + 1 }));
          }
        }
      } catch {
        if (mounted) setLeaderboard([]);
      } finally {
        if (mounted) setLoadingLeaderboard(false);
      }
    }

    loadLeaderboard();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const renderTab = () => {
    switch (activeTab) {
      case "contributions":
        return (
          <ContributionsTab
            contributions={contributions}
            loading={loadingContributions}
          />
        );
      case "bookmarks":
        return (
          <BookmarksTab
            bookmarks={bookmarks}
            onRemoveBookmark={handleRemoveBookmark}
          />
        );
      case "rewards":
        return <RewardsTab rewards={rewards} loading={loadingRewards} />;
      case "leaderboard":
        return (
          <LeaderboardTab
            entries={leaderboard}
            currentUserId={userId}
            loading={loadingLeaderboard}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
              <LayoutDashboard className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Campaign Activity</h1>
              <p className="text-sm text-gray-500">Track your contributions and rewards</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Tab Navigation */}
        <div className="mt-6 overflow-x-auto">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">{renderTab()}</div>
      </div>
    </div>
  );
}
