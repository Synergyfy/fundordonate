import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Compass,
  Gift,
  Heart,
  MapPin,
  Target,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { seasonApi, type Season } from "@/services/season.service";
import { userDashboardApi } from "@/services/user-dashboard.service";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import {
  findConsumerCampaign,
  getConsumerCommunity,
  getRecommendedCampaigns,
  type ConsumerCampaignRef,
} from "@/data/consumerHomeData";
import { getLocalStats } from "@/data/consumerActivityData";
import type { DemoCampaign } from "@/data/demo";

interface DashboardStats {
  totalContributed: number;
  campaignsBacked: number;
  rewardsEarned: number;
}

const LAST_VIEWED_KEY = "lastViewedCampaign";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const getModeLabel = (mode: string) => (mode === "fund" ? "Fund" : "Donate");

function normalizeStats(raw: unknown): DashboardStats {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<DashboardStats>;
  const toNumber = (v: number | undefined) =>
    typeof v === "number" && Number.isFinite(v) ? v : 0;
  return {
    totalContributed: toNumber(s.totalContributed),
    campaignsBacked: toNumber(s.campaignsBacked),
    rewardsEarned: toNumber(s.rewardsEarned),
  };
}

export function ConsumerHomePage() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalContributed: 0,
    campaignsBacked: 0,
    rewardsEarned: 0,
  });
  const [recommended, setRecommended] = useState<DemoCampaign[]>([]);
  const [continueCampaign, setContinueCampaign] = useState<ConsumerCampaignRef | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [seasonResult, statsResult, localResult] = await Promise.allSettled([
        seasonApi.getCurrent(),
        userDashboardApi.getStats(),
        getLocalStats(),
      ]);
      if (cancelled) return;
      setSeason(seasonResult.status === "fulfilled" ? seasonResult.value : null);
      const apiStats = normalizeStats(
        statsResult.status === "fulfilled" ? statsResult.value : null,
      );
      const hasApiData =
        apiStats.totalContributed > 0 ||
        apiStats.campaignsBacked > 0 ||
        apiStats.rewardsEarned > 0;
      if (!hasApiData && localResult.status === "fulfilled") {
        setStats(localResult.value);
      } else {
        setStats(apiStats);
      }
      setRecommended(getRecommendedCampaigns());
      const lastSlug = window.localStorage.getItem(LAST_VIEWED_KEY);
      setContinueCampaign(lastSlug ? findConsumerCampaign(lastSlug) : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const displayName = user?.firstName || user?.username?.split("@")[0] || "there";
  const community = getConsumerCommunity();

  const impact = [
    { label: "Total Supported", value: formatCurrency(stats.totalContributed), icon: Coins, color: "bg-pink-50 text-pink-700" },
    { label: "Campaigns Supported", value: String(stats.campaignsBacked), icon: Target, color: "bg-purple-50 text-purple-700" },
    { label: "Rewards Earned", value: String(stats.rewardsEarned), icon: Gift, color: "bg-amber-50 text-amber-700" },
  ];

  const actions = [
    { label: "Explore Campaigns", icon: Compass, to: "/consumer/explore", primary: true },
    { label: "My Contributions", icon: Heart, to: "/consumer/activity?tab=contributions", primary: false },
    { label: "My Rewards", icon: Gift, to: "/consumer/rewards", primary: false },
  ];

  const communityRows = [
    { label: "City", value: community.cityName },
    { label: "Local Area", value: community.areaName },
    { label: "High Street", value: community.streetName },
  ];

  return (
    <div className="space-y-6">
      <GreetingHeader name={displayName} />

      {season && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary-50 p-2">
                <CalendarDays className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Current Season
                </p>
                <p className="text-sm font-bold text-gray-900">{season.name}</p>
              </div>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              {season.status === "ACTIVE" ? "Active" : season.status}
            </span>
          </div>
          <p className="mt-2 pl-11 text-xs text-gray-500">
            {formatDate(season.startDate)} – {formatDate(season.endDate)}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Your Community
          </p>
          <Link
            to="/consumer/explore"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Browse
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {communityRows.map((row) => (
            <li key={row.label} className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary-500" />
              <span className="w-24 shrink-0 font-medium text-gray-500">{row.label}</span>
              <span className="truncate font-semibold text-gray-900">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {impact.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${
                  i === 0 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.color}`}>
                    {m.label}
                  </span>
                  <Icon className="h-4 w-4 text-gray-400" />
                </div>
                <p className="mt-3 text-xl font-bold text-gray-900">{m.value}</p>
              </div>
            );
          })}
        </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              to={a.to}
              className={
                a.primary
                  ? "flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                  : "flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              }
            >
              <Icon className="h-4 w-4" />
              {a.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
              Continue
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
              {continueCampaign
                ? `Continue with ${continueCampaign.title}`
                : "Continue supporting your community"}
            </p>
            {continueCampaign?.location ? (
              <p className="truncate text-xs text-gray-500">{continueCampaign.location}</p>
            ) : null}
          </div>
          <Link
            to={
              continueCampaign
                ? `/consumer/explore/campaign/${continueCampaign.slug}`
                : "/consumer/explore"
            }
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            {continueCampaign ? "Continue" : "Explore"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recommended campaigns</h2>
          <Link
            to="/consumer/explore"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View Campaigns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recommended.length === 0 ? (
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
            No campaigns to recommend yet.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => {
              const pct =
                c.goalAmount > 0
                  ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100))
                  : 0;
              return (
                <Link
                  key={c.slug}
                  to={`/consumer/explore/campaign/${c.slug}`}
                  className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {c.featuredImage ? (
                    <img
                      src={c.featuredImage}
                      alt={c.title}
                      className="h-32 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-32 w-full bg-gray-100" />
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                        {getModeLabel(c.mode)}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {formatCurrency(c.raisedAmount)} of {formatCurrency(c.goalAmount)}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-bold text-gray-900 group-hover:text-primary-700">
                      {c.title}
                    </h3>
                    <p className="truncate text-xs text-gray-500">{c.location}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-primary-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                      View Campaign
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
