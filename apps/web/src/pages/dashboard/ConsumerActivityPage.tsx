import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Coins,
  Heart,
  MapPin,
  Target,
  Trophy,
} from "lucide-react";
import {
  computeImpact,
  listContributions,
  type ConsumerContribution,
} from "@/data/consumerActivityData";
import { resolveCampaignForDetail } from "@/data/consumerExploreData";

type TabId = "contributions" | "campaigns" | "impact";

const TABS: { id: TabId; label: string }[] = [
  { id: "contributions", label: "Contributions" },
  { id: "campaigns", label: "Campaigns" },
  { id: "impact", label: "Impact" },
];

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ContributionRow({ contribution }: { contribution: ConsumerContribution }) {
  const c = contribution;
  return (
    <Link
      to={`/consumer/activity/contributions/${c.id}`}
      className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {c.campaignImage ? (
        <img
          src={c.campaignImage}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Heart className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary-700">
          {c.campaignTitle}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusChip status={c.status} />
          <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
          <span className="truncate font-mono text-xs text-gray-400">{c.reference}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-bold text-gray-900">{formatCurrency(c.amount)}</span>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500" />
      </div>
    </Link>
  );
}

interface MyCampaignCardData {
  slug: string;
  title: string;
  location: string;
  image?: string;
  contributed: number;
  latestStatus: string;
  goal: number;
  raised: number;
  deadline?: string;
  ended: boolean;
}

function buildCampaignGroups(items: ConsumerContribution[]): {
  active: MyCampaignCardData[];
  completed: MyCampaignCardData[];
} {
  const map = new Map<string, MyCampaignCardData>();
  const ascending = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const c of ascending) {
    const existing = map.get(c.campaignSlug);
    if (existing) {
      existing.contributed += c.amount;
      existing.latestStatus = c.status;
      continue;
    }
    const resolved = resolveCampaignForDetail(c.campaignSlug);
    const deadline = resolved?.campaign.deadline;
    map.set(c.campaignSlug, {
      slug: c.campaignSlug,
      title: resolved?.campaign.title ?? c.campaignTitle,
      location: resolved?.campaign.location ?? c.campaignLocation,
      image: resolved?.campaign.featuredImage ?? c.campaignImage,
      contributed: c.amount,
      latestStatus: c.status,
      goal: resolved?.campaign.goalAmount ?? 0,
      raised: resolved?.campaign.raisedAmount ?? 0,
      deadline,
      ended: !!deadline && new Date(deadline).getTime() <= Date.now(),
    });
  }
  const all = [...map.values()];
  return {
    active: all.filter((c) => !c.ended),
    completed: all.filter((c) => c.ended),
  };
}

function MyCampaignCard({ data }: { data: MyCampaignCardData }) {
  const pct =
    data.goal > 0 ? Math.min(100, Math.round((data.raised / data.goal) * 100)) : 0;
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {data.image ? (
          <img
            src={data.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Heart className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-bold text-gray-900">{data.title}</h4>
            <StatusChip status={data.latestStatus} />
          </div>
          {data.location ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{data.location}</span>
            </p>
          ) : null}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              <span className="font-bold text-gray-900">{formatCurrency(data.contributed)}</span>{" "}
              contributed
            </span>
            {data.deadline ? (
              <span className="text-gray-500">
                {data.ended ? "Ended" : `Ends ${formatDate(data.deadline)}`}
              </span>
            ) : null}
          </div>
          {data.goal > 0 && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-primary-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{pct}% funded</p>
            </div>
          )}
          <Link
            to={`/consumer/explore/campaign/${data.slug}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View Campaign
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function MyCampaignsSection({ items }: { items: ConsumerContribution[] }) {
  const groups = useMemo(() => buildCampaignGroups(items), [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-gray-300" />
        <h3 className="mt-3 text-base font-semibold text-gray-900">
          You have not supported any campaigns yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Campaigns you back or donate to will appear here.
        </p>
        <Link
          to="/consumer/explore"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Explore Campaigns
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const renderGroup = (label: string, cards: MyCampaignCardData[], emptyText: string) => (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {label} <span className="ml-1 text-gray-400">({cards.length})</span>
      </h2>
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
          {emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <MyCampaignCard key={card.slug} data={card} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {renderGroup("Active", groups.active, "No active campaigns right now.")}
      {renderGroup("Completed", groups.completed, "No completed campaigns yet.")}
    </div>
  );
}

function MyImpactSection({ items }: { items: ConsumerContribution[] }) {
  const impact = useMemo(() => computeImpact(items), [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
        <Trophy className="mx-auto h-8 w-8 text-gray-300" />
        <h3 className="mt-3 text-base font-semibold text-gray-900">
          No impact to show yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your impact is calculated from the campaigns you support.
        </p>
        <Link
          to="/consumer/explore"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Explore Campaigns
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const metrics = [
    {
      label: "Campaigns Supported",
      value: String(impact.campaignsSupported),
      icon: Target,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "Total Contributions",
      value: formatCurrency(impact.totalContributions),
      icon: Coins,
      color: "bg-pink-50 text-pink-700",
    },
    {
      label: "Communities Supported",
      value: String(impact.communitiesSupported),
      icon: MapPin,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "High Streets Supported",
      value: String(impact.highStreetsSupported),
      icon: Trophy,
      color: "bg-green-50 text-green-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m, i) => {
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
  );
}

export function ConsumerActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabId =
    tabParam === "campaigns" || tabParam === "impact" ? tabParam : "contributions";
  const [items, setItems] = useState<ConsumerContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listContributions()
      .then((list) => {
        if (!cancelled) {
          setItems(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTab = (id: TabId) => {
    const next = new URLSearchParams(searchParams);
    if (id === "contributions") next.delete("tab");
    else next.set("tab", id);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Activity</h1>

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
      ) : tab === "contributions" ? (
        items.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
            <Heart className="mx-auto h-8 w-8 text-gray-300" />
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              No contributions yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Contributions you make will show up here with their status and receipt.
            </p>
            <Link
              to="/consumer/explore"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Explore Campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {items.length} contribution{items.length === 1 ? "" : "s"}
            </p>
            {items.map((c) => (
              <ContributionRow key={c.id} contribution={c} />
            ))}
          </div>
        )
      ) : tab === "campaigns" ? (
        <MyCampaignsSection items={items} />
      ) : (
        <MyImpactSection items={items} />
      )}
    </div>
  );
}
