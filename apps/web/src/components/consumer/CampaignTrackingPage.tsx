// =============================================================================
// Campaign Tracking Page
// Allows consumers to track their contributions, bookmarks, rewards, and
// leaderboard position across all campaigns.
// =============================================================================

import { useState } from "react";
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
} from "lucide-react";

// ── Types ──

interface CampaignTrackingPageProps {
  userId?: string;
}

type TabId = "contributions" | "bookmarks" | "rewards" | "leaderboard";

// ── Demo Data ──

const DEMO_STATS = {
  totalContributed: 127500,
  activeCampaigns: 7,
  rewardsEarned: 3,
  leaderboardPosition: 42,
};

const DEMO_CONTRIBUTIONS = [
  {
    id: "1",
    campaignTitle: "Brighton Digital Arts Centre",
    campaignSlug: "brighton-digital-arts-centre",
    amountPence: 50000,
    date: "2026-09-20",
    status: "completed" as const,
    progressPct: 72,
    type: "founding_member" as const,
    reward: "Gold Founding Member",
  },
  {
    id: "2",
    campaignTitle: "Manchester Community Garden",
    campaignSlug: "manchester-community-garden",
    amountPence: 25000,
    date: "2026-09-18",
    status: "completed" as const,
    progressPct: 45,
    type: "backer" as const,
    reward: undefined,
  },
  {
    id: "3",
    campaignTitle: "Edinburgh Youth Tech Hub",
    campaignSlug: "edinburgh-youth-tech-hub",
    amountPence: 10000,
    date: "2026-09-15",
    status: "pending" as const,
    progressPct: 88,
    type: "donate" as const,
    reward: "Supporter Badge",
  },
  {
    id: "4",
    campaignTitle: "Cardiff Sustainable Food Co-op",
    campaignSlug: "cardiff-sustainable-food-coop",
    amountPence: 20000,
    date: "2026-09-10",
    status: "completed" as const,
    progressPct: 31,
    type: "founding_monthly" as const,
    reward: "Monthly Patron",
  },
  {
    id: "5",
    campaignTitle: "Bristol Bike Workshop Initiative",
    campaignSlug: "bristol-bike-workshop",
    amountPence: 22500,
    date: "2026-09-05",
    status: "completed" as const,
    progressPct: 60,
    type: "backer" as const,
    reward: "Workshop Pass",
  },
];

const DEMO_BOOKMARKS = [
  {
    id: "b1",
    campaignTitle: "Liverpool Maker Space",
    campaignSlug: "liverpool-maker-space",
    goalPence: 500000,
    raisedPence: 325000,
    deadline: "2026-10-15",
    featuredImage: undefined,
  },
  {
    id: "b2",
    campaignTitle: "Glasgow Community Radio",
    campaignSlug: "glasgow-community-radio",
    goalPence: 200000,
    raisedPence: 80000,
    deadline: "2026-11-01",
    featuredImage: undefined,
  },
  {
    id: "b3",
    campaignTitle: "Leeds Urban Farm Expansion",
    campaignSlug: "leeds-urban-farm",
    goalPence: 750000,
    raisedPence: 600000,
    deadline: "2026-09-30",
    featuredImage: undefined,
  },
];

const DEMO_REWARDS = [
  {
    id: "r1",
    campaignTitle: "Brighton Digital Arts Centre",
    title: "Gold Founding Member",
    description: "Lifetime access to all events, name on the founders wall, exclusive quarterly updates.",
    claimed: true,
    amountPence: 50000,
  },
  {
    id: "r2",
    campaignTitle: "Edinburgh Youth Tech Hub",
    title: "Supporter Badge",
    description: "Digital badge and recognition on the campaign page.",
    claimed: false,
    amountPence: 10000,
  },
  {
    id: "r3",
    campaignTitle: "Bristol Bike Workshop Initiative",
    title: "Workshop Pass",
    description: "Free entry to 3 workshops in the first year of operation.",
    claimed: false,
    amountPence: 22500,
  },
];

const DEMO_LEADERBOARD = [
  { rank: 1, name: "Sarah M.", totalPence: 450000, campaigns: 12, avatar: undefined },
  { rank: 2, name: "James T.", totalPence: 380000, campaigns: 9, avatar: undefined },
  { rank: 3, name: "Priya K.", totalPence: 310000, campaigns: 15, avatar: undefined },
  { rank: 4, name: "Oliver W.", totalPence: 275000, campaigns: 8, avatar: undefined },
  { rank: 5, name: "Emma R.", totalPence: 250000, campaigns: 11, avatar: undefined },
  { rank: 42, name: "You", totalPence: 127500, campaigns: 5, avatar: undefined },
];

const CONTRIBUTION_TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  backer: { label: "Backer", emoji: "🤝", color: "text-primary-600 bg-primary-50" },
  founding_member: { label: "Founding Member", emoji: "👑", color: "text-amber-600 bg-amber-50" },
  founding_monthly: { label: "Founding Monthly", emoji: "🔄", color: "text-purple-600 bg-purple-50" },
  donate: { label: "Donate", emoji: "💚", color: "text-green-600 bg-green-50" },
};

const DEFAULT_TYPE_META = { label: "Unknown", emoji: "❓", color: "text-gray-600 bg-gray-50" };

// ── Helpers ──

function formatPence(pence: number): string {
  const gbp = pence / 100;
  return `£${gbp.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-Components ──

function StatsCards({ stats }: { stats: typeof DEMO_STATS }) {
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
      value: `#${stats.leaderboardPosition}`,
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

function ContributionsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = DEMO_CONTRIBUTIONS.filter((c) =>
    c.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="py-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No contributions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const typeMeta = CONTRIBUTION_TYPE_META[c.type] ?? CONTRIBUTION_TYPE_META.backer ?? DEFAULT_TYPE_META;
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
                          : "bg-amber-50 text-amber-700"
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
                      style={{ width: `${c.progressPct}%` }}
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

function BookmarksTab() {
  return (
    <div className="space-y-3">
      {DEMO_BOOKMARKS.map((b) => {
        const progressPct = Math.round((b.raisedPence / b.goalPence) * 100);
        return (
          <div
            key={b.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{b.campaignTitle}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Ends {formatDate(b.deadline)}
                </p>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-red-400 transition-colors">
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
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                of {formatPence(b.goalPence)} goal
              </p>
            </div>

            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
              <Heart className="h-3.5 w-3.5" />
              Contribute
            </button>
          </div>
        );
      })}
    </div>
  );
}

function RewardsTab() {
  return (
    <div className="space-y-3">
      {DEMO_REWARDS.map((r) => (
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
              <p className="mt-0.5 text-xs text-gray-500">{r.campaignTitle}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                r.claimed
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {r.claimed ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Claimed
                </>
              ) : (
                "Unclaimed"
              )}
            </span>
          </div>
          {r.description && (
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">{r.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Contribution: {formatPence(r.amountPence)}
            </span>
            {!r.claimed && (
              <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Claim Reward
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardTab() {
  const yourEntry = DEMO_LEADERBOARD.find((e) => e.name === "You");

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
                {formatPence(yourEntry.totalPence)} across {yourEntry.campaigns} campaigns
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
          {DEMO_LEADERBOARD.filter((e) => e.name !== "You")
            .slice(0, 5)
            .map((entry) => {
              const isTop3 = entry.rank <= 3;
              const rankEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
              return (
                <div
                  key={entry.rank}
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
                    {entry.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {entry.campaigns} campaigns backed
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatPence(entry.totalPence)}
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

export function CampaignTrackingPage({ userId: _userId }: CampaignTrackingPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("contributions");

  const renderTab = () => {
    switch (activeTab) {
      case "contributions":
        return <ContributionsTab />;
      case "bookmarks":
        return <BookmarksTab />;
      case "rewards":
        return <RewardsTab />;
      case "leaderboard":
        return <LeaderboardTab />;
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
        <StatsCards stats={DEMO_STATS} />

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
