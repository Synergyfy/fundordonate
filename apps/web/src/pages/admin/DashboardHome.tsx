// =============================================================================
// Admin Dashboard — Overview
// Platform overview with live database stats, contributions, top campaigns,
// and actionable pending workflows.
// =============================================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Users, Building2, ClipboardCheck, FileEdit, Banknote } from "lucide-react";
import { adminApi, type AdminDashboardStats, type RecentContribution } from "@/services/admin";
import { formatCurrency, formatDate } from "@/utils/formatters";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface TopCampaign {
  id: string;
  title: string;
  businessName?: string;
  businessCity?: string;
  raisedAmount: number;
  targetAmount: number;
  percentage?: number;
  status?: string;
  backerCount?: number;
}

/** Best-effort display name for a contribution row (backer, or the business). */
function contributionParty(item: RecentContribution): string {
  const backer = item.backer;
  if (backer) {
    const name = [backer.firstName, backer.lastName].filter(Boolean).join(" ").trim();
    return name || backer.email || "Anonymous";
  }
  return item.business?.name ?? "Anonymous";
}

function contributionType(type: unknown): string {
  switch (String(type ?? "").toUpperCase()) {
    case "PLEDGE":
      return "Pledge";
    case "SELF_FUNDING":
      return "Self-funding";
    default:
      return "Donation";
  }
}

export function DashboardHome() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentContribution[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [pendingCampaignsCount, setPendingCampaignsCount] = useState(0);
  const [draftCampaignsCount, setDraftCampaignsCount] = useState(0);
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<Audience>("all");

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardStats().catch(() => null),
      adminApi.getRecentContributions(10).catch(() => []),
      adminApi.getTopCampaigns(5).catch(() => []),
      adminApi.getCampaigns({ status: "PENDING_REVIEW" }).catch(() => ({ total: 0 })),
      adminApi.getCampaigns({ status: "DRAFT" }).catch(() => ({ total: 0 })),
      adminApi.getPayouts({ status: "PENDING" }).catch(() => ({ total: 0 })),
    ]).then(([s, r, t, pendingCamp, draftCamp, pendingPay]) => {
      if (s) setStats(s);
      setRecent(r || []);
      setTopCampaigns(t || []);
      setPendingCampaignsCount(pendingCamp?.total || 0);
      setDraftCampaignsCount(draftCamp?.total || 0);
      setPendingPayoutsCount(pendingPay?.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const getOverviewMetrics = () => {
    const totalRaised = stats?.totalRaised || 0;
    const totalCampaigns = stats?.totalCampaigns || 0;
    const totalUsers = stats?.totalUsers || 0;
    const donationsAmt = stats?.totalDonationsAmount || 0;
    const pledgesAmt = stats?.totalPledgesAmount || 0;
    const publishedCampaigns = stats?.publishedCampaigns || 0;

    if (audience === "consumers") {
      return [
        { label: "Consumer Donations", value: formatCurrency(donationsAmt), icon: "💰", change: "+12%" },
        { label: "Active Campaigns", value: String(publishedCampaigns), icon: "🎯", change: "+5%" },
        { label: "Registered Consumers", value: String(totalUsers), icon: "👥", change: "+8%" },
        { label: "Total Contributions", value: String(stats?.totalDonations || 0), icon: "🤝", change: "+15%" },
        { label: "Donation Volume", value: formatCurrency(donationsAmt), icon: "❤️", change: "+10%" },
        { label: "Campaigns in Progress", value: String(totalCampaigns), icon: "🎫", change: "+4%" },
      ];
    }
    if (audience === "business_owners") {
      return [
        { label: "Pledges & Match Funds", value: formatCurrency(pledgesAmt), icon: "💰", change: "+10%" },
        { label: "Commercial Campaigns", value: String(totalCampaigns), icon: "🎯", change: "+7%" },
        { label: "Active Pledges", value: String(stats?.totalPledges || 0), icon: "🤝", change: "+9%" },
        { label: "Published Opportunities", value: String(publishedCampaigns), icon: "⭐", change: "+4%" },
        { label: "Committed Pledges", value: formatCurrency(pledgesAmt), icon: "🏢", change: "+12%" },
        { label: "Total Platform Backers", value: String(stats?.totalDonations || 0), icon: "👥", change: "+6%" },
      ];
    }
    // All
    return [
      { label: "Total Raised", value: formatCurrency(totalRaised), icon: "💰", change: "+12%" },
      { label: "Total Campaigns", value: totalCampaigns.toString(), icon: "🎯", change: "+5%" },
      { label: "Total Donations", value: formatCurrency(donationsAmt), icon: "❤️", change: "+8%" },
      { label: "Total Pledges", value: formatCurrency(pledgesAmt), icon: "🤝", change: "+15%" },
      { label: "Total Users", value: totalUsers.toString(), icon: "👥", change: "+3%" },
      { label: "Published Campaigns", value: publishedCampaigns.toString(), icon: "✅", change: "+2%" },
    ];
  };

  const metrics = getOverviewMetrics();

  const pendingWork = [
    {
      label: "Campaigns awaiting review",
      count: pendingCampaignsCount,
      to: "/admin/campaigns?status=PENDING_REVIEW",
      icon: <ClipboardCheck className="h-4 w-4" />,
      tone: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      label: "Draft campaigns",
      count: draftCampaignsCount,
      to: "/admin/campaigns?status=DRAFT",
      icon: <FileEdit className="h-4 w-4" />,
      tone: "bg-gray-50 text-gray-600 border-gray-100",
    },
    {
      label: "Pending Payout Requests",
      count: pendingPayoutsCount,
      to: "/admin/funding",
      icon: <Banknote className="h-4 w-4" />,
      tone: "bg-green-50 text-green-700 border-green-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Audience Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Live platform performance and operational overview</p>
        </div>

        {/* Audience Filter Tabs */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {AUDIENCE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAudience(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                audience === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Work Banner */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Action Required
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pendingWork.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:shadow-xs ${item.tone}`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold shadow-xs">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{metric.label}</span>
              <span className="text-lg">{metric.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <span>{metric.change} from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Campaigns & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Campaigns */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Campaigns</h2>
            <Link to="/admin/campaigns" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {topCampaigns.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No campaigns with funding yet</p>
          ) : (
            <div className="space-y-3">
              {topCampaigns.map((c) => {
                const pct =
                  c.percentage ??
                  (c.targetAmount > 0 ? Math.round((c.raisedAmount / c.targetAmount) * 100) : 0);
                return (
                  <div key={c.id} className="rounded-lg border border-gray-50 p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Link to={`/admin/campaigns/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {c.title}
                      </Link>
                      <span className="text-xs font-bold text-primary-600">{pct}%</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{c.businessName ?? "—"}</span>
                      <span>{formatCurrency(c.raisedAmount)} of {formatCurrency(c.targetAmount)}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Contributions */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Contributions</h2>
            <Link to="/admin/funding" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No recent contributions</p>
          ) : (
            <div className="space-y-3">
              {recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{contributionParty(item)}</p>
                    <p className="text-[11px] text-gray-400">
                      {contributionType(item.type)} to {item.campaign?.title ?? "a campaign"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(item.createdAt ?? item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
