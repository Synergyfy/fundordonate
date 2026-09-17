// =============================================================================
// Admin Dashboard — Overview
// Platform overview with Consumer/Business Owner audience switching.
// =============================================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Users, Building2 } from "lucide-react";
import { adminApi } from "@/services/admin.service";

type Audience = "all" | "consumers" | "business_owners";

const AUDIENCE_TABS: { id: Audience; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "consumers", label: "Consumers", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "business_owners", label: "Business Owners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface DashboardStats {
  totalCampaigns: number;
  publishedCampaigns: number;
  totalDonations: number;
  totalPledges: number;
  totalUsers: number;
  totalRaised: number;
  totalDonationsAmount: number;
  totalPledgesAmount: number;
}

interface RecentContribution {
  id: string;
  type: "donation" | "pledge";
  amount: number;
  campaign: string;
  user: string;
  date: Date;
}

interface TopCampaign {
  id: string;
  title: string;
  goalAmount: number;
  raisedAmount: number;
  author: { firstName: string; lastName: string };
  _count: { donations: number; pledges: number };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount / 100);

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

// Demo data for audience-specific metrics
const DEMO_AUDIENCE_DATA = {
  consumers: {
    totalRaised: 8200000, totalTarget: 15000000, campaigns: 68, participants: 5200,
    backers: 3200, foundingMembers: 480, membership: 620, rewardsIssued: 230,
  },
  business_owners: {
    totalRaised: 4200000, totalTarget: 8000000, campaigns: 34, participants: 1240,
    backers: 800, foundingMembers: 120, membership: 180, rewardsIssued: 95,
  },
};

export function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentContribution[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<Audience>("all");

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardStats(),
      adminApi.getRecentContributions(10),
      adminApi.getTopCampaigns(5),
    ]).then(([s, r, t]) => {
      setStats(s);
      setRecent(r);
      setTopCampaigns(t);
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

  const consumerData = DEMO_AUDIENCE_DATA.consumers;
  const businessData = DEMO_AUDIENCE_DATA.business_owners;

  const getOverviewMetrics = () => {
    if (audience === "consumers") {
      return [
        { label: "Total Raised", value: fmt(consumerData.totalRaised), icon: "💰", change: "+12%" },
        { label: "Active Campaigns", value: String(consumerData.campaigns), icon: "🎯", change: "+5%" },
        { label: "Participants", value: consumerData.participants.toLocaleString(), icon: "👥", change: "+8%" },
        { label: "Backers", value: consumerData.backers.toLocaleString(), icon: "🤝", change: "+15%" },
        { label: "Founding Members", value: String(consumerData.foundingMembers), icon: "⭐", change: "+3%" },
        { label: "Membership", value: String(consumerData.membership), icon: "🎫", change: "+2%" },
      ];
    }
    if (audience === "business_owners") {
      return [
        { label: "Total Raised", value: fmt(businessData.totalRaised), icon: "💰", change: "+10%" },
        { label: "Active Campaigns", value: String(businessData.campaigns), icon: "🎯", change: "+7%" },
        { label: "Business Owners", value: businessData.participants.toLocaleString(), icon: "🏢", change: "+12%" },
        { label: "Backers", value: businessData.backers.toLocaleString(), icon: "🤝", change: "+9%" },
        { label: "Founding Members", value: String(businessData.foundingMembers), icon: "⭐", change: "+4%" },
        { label: "Membership", value: String(businessData.membership), icon: "🎫", change: "+6%" },
      ];
    }
    // All
    return [
      { label: "Total Raised", value: formatCurrency(stats?.totalRaised || 0), icon: "💰", change: "+12%" },
      { label: "Total Campaigns", value: stats?.totalCampaigns?.toString() || "0", icon: "🎯", change: "+5%" },
      { label: "Total Donations", value: formatCurrency(stats?.totalDonationsAmount || 0), icon: "❤️", change: "+8%" },
      { label: "Total Pledges", value: formatCurrency(stats?.totalPledgesAmount || 0), icon: "🤝", change: "+15%" },
      { label: "Total Users", value: stats?.totalUsers?.toString() || "0", icon: "👥", change: "+3%" },
      { label: "Published Campaigns", value: stats?.publishedCampaigns?.toString() || "0", icon: "✅", change: "+2%" },
    ];
  };

  const getConsumerProgress = () => consumerData.totalTarget > 0 ? Math.round((consumerData.totalRaised / consumerData.totalTarget) * 100) : 0;
  const getBusinessProgress = () => businessData.totalTarget > 0 ? Math.round((businessData.totalRaised / businessData.totalTarget) * 100) : 0;
  const getAllProgress = () => {
    const total = consumerData.totalTarget + businessData.totalTarget;
    const raised = consumerData.totalRaised + businessData.totalRaised;
    return total > 0 ? Math.round((raised / total) * 100) : 0;
  };

  const metrics = getOverviewMetrics();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, Admin</p>
        </div>
        {/* Audience Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
          {AUDIENCE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAudience(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                audience === tab.id
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seasonal Progress */}
      <div className="rounded-xl bg-white border p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900">Seasonal Funding Progress</h3>
          <span className="text-sm font-bold text-primary-600">
            {audience === "consumers" ? getConsumerProgress() : audience === "business_owners" ? getBusinessProgress() : getAllProgress()}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${audience === "consumers" ? getConsumerProgress() : audience === "business_owners" ? getBusinessProgress() : getAllProgress()}%` }} />
        </div>
        {audience === "all" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5">
              <div className="text-[10px] font-bold text-blue-600 mb-1">CONSUMERS</div>
              <div className="text-sm font-bold text-gray-900">{fmt(consumerData.totalRaised)}</div>
              <div className="text-[10px] text-gray-500">{getConsumerProgress()}% of {fmt(consumerData.totalTarget)}</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-2.5">
              <div className="text-[10px] font-bold text-purple-600 mb-1">BUSINESS OWNERS</div>
              <div className="text-sm font-bold text-gray-900">{fmt(businessData.totalRaised)}</div>
              <div className="text-[10px] text-gray-500">{getBusinessProgress()}% of {fmt(businessData.totalTarget)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{m.icon}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{m.change}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{m.value}</p>
            <p className="text-sm text-gray-400">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Contributions */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Contributions</h2>
            <Link to="/admin/donations" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-gray-400">No contributions yet.</p>}
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.user}</p>
                  <p className="text-xs text-gray-400 truncate">{c.campaign}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(c.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Campaigns</h2>
            <Link to="/admin/campaigns" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-3">
            {topCampaigns.length === 0 && <p className="text-sm text-gray-400">No campaigns yet.</p>}
            {topCampaigns.map((c) => {
              const pct = c.goalAmount > 0 ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100) : 0;
              return (
                <div key={c.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                    <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{formatCurrency(c.raisedAmount)} raised</span>
                    <span>{c._count.donations + c._count.pledges} backers</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/campaigns" className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">Manage Campaigns</Link>
          <Link to="/admin/donations" className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100">View Donations</Link>
          <Link to="/admin/business-owners" className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100">Business Owners</Link>
          <Link to="/admin/consumer-overview" className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">Consumers</Link>
          <Link to="/admin/hub-locations" className="rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100">UK Activation</Link>
          <Link to="/admin/seasons" className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">Seasons</Link>
          <Link to="/admin/settings" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Settings</Link>
        </div>
      </div>
    </div>
  );
}
