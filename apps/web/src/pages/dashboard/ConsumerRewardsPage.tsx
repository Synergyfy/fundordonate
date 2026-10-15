import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gift,
  MapPin,
} from "lucide-react";
import { consumerService } from "@/services/consumer";
import { REWARD_CATEGORY_META, type IssuedReward } from "@/types/rewards";

type TabId = "available" | "redeemed" | "expired";

const TABS: { id: TabId; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "redeemed", label: "Redeemed" },
  { id: "expired", label: "Expired" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  ...REWARD_CATEGORY_META,
};

/** Which list tab an issuance belongs to. */
function tabFor(status: string): TabId {
  switch (status?.toUpperCase()) {
    case "REDEEMED":
      return "redeemed";
    case "EXPIRED":
    case "REVOKED":
      return "expired";
    case "ISSUED":
    case "FAILED": // needs activation — surface it as actionable, not expired
    default:
      return "available";
  }
}

function statusLabel(status: string): { label: string; className: string } {
  switch (status?.toUpperCase()) {
    case "REDEEMED":
      return { label: "Redeemed", className: "bg-green-50 text-green-700" };
    case "EXPIRED":
      return { label: "Expired", className: "bg-gray-100 text-gray-600" };
    case "REVOKED":
      return { label: "Revoked", className: "bg-red-50 text-red-700" };
    case "FAILED":
      return { label: "Action required", className: "bg-amber-50 text-amber-700" };
    case "ISSUED":
    default:
      return { label: "Available", className: "bg-amber-50 text-amber-700" };
  }
}

function RewardCard({ reward }: { reward: IssuedReward }) {
  const status = statusLabel(reward.status);
  const category = reward.rewardType ? CATEGORY_META[reward.rewardType] : undefined;

  return (
    <article className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-3">
        {reward.campaignImage ? (
          <img
            src={reward.campaignImage}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-50">
            <Gift className="h-6 w-6 text-primary-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-gray-900">
              {reward.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          {reward.campaignTitle && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{reward.campaignTitle}</span>
            </p>
          )}
          {category && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-600">
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
              <span>{category.label}</span>
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            {reward.expiresAt ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDate(reward.expiresAt)}
              </span>
            ) : (
              <span />
            )}
            <Link
              to={`/consumer/rewards/${reward.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View Reward
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

const EMPTY_COPY: Record<TabId, { title: string; body: string; cta: string }> = {
  available: {
    title: "No rewards available yet",
    body: "Rewards you qualify for will show up here once they are issued.",
    cta: "Explore Campaigns",
  },
  redeemed: {
    title: "No redeemed rewards yet",
    body: "Rewards you redeem will appear here.",
    cta: "View Available Rewards",
  },
  expired: {
    title: "No expired rewards",
    body: "Expired or revoked rewards will appear here.",
    cta: "View Available Rewards",
  },
};

export function ConsumerRewardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabId =
    tabParam === "redeemed" || tabParam === "expired" ? tabParam : "available";
  const [rewards, setRewards] = useState<IssuedReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    consumerService
      .getRewards({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setRewards(res?.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRewards([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTab = (id: TabId) => {
    const next = new URLSearchParams(searchParams);
    if (id === "available") next.delete("tab");
    else next.set("tab", id);
    setSearchParams(next, { replace: true });
  };

  const visible = useMemo(
    () => rewards.filter((r) => tabFor(r.status) === tab),
    [rewards, tab],
  );
  const empty = EMPTY_COPY[tab];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>

      <div className="flex rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Gift className="h-6 w-6 text-primary-500" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">
            {empty.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{empty.body}</p>
          <Link
            to={
              tab === "available"
                ? "/consumer/explore"
                : "/consumer/rewards?tab=available"
            }
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {empty.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {visible.length} reward{visible.length === 1 ? "" : "s"}
          </p>
          {visible.map((r) => (
            <RewardCard key={r.id} reward={r} />
          ))}
        </div>
      )}
    </div>
  );
}
