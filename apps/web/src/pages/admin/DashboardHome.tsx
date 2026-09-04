import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/services/admin.service";

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

export function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentContribution[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [loading, setLoading] = useState(true);

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

  const metrics = [
    { label: "Total Raised", value: formatCurrency(stats?.totalRaised || 0), icon: "💰", change: "+12%" },
    { label: "Total Campaigns", value: stats?.totalCampaigns?.toString() || "0", icon: "🎯", change: "+5%" },
    { label: "Total Donations", value: formatCurrency(stats?.totalDonationsAmount || 0), icon: "❤️", change: "+8%" },
    { label: "Total Pledges", value: formatCurrency(stats?.totalPledgesAmount || 0), icon: "🤝", change: "+15%" },
    { label: "Total Users", value: stats?.totalUsers?.toString() || "0", icon: "👥", change: "+3%" },
    { label: "Published Campaigns", value: stats?.publishedCampaigns?.toString() || "0", icon: "✅", change: "+2%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-400">Welcome back, Admin</span>
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
          <Link to="/admin/users" className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">Manage Users</Link>
          <Link to="/admin/categories" className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100">Categories & Tags</Link>
          <Link to="/admin/hub-locations" className="rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100">Hub Locations</Link>
          <Link to="/admin/founding" className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">Founding Programmes</Link>
          <Link to="/admin/hub-content" className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">Hub Content</Link>
          <Link to="/admin/reports" className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">Reports & Analytics</Link>
          <Link to="/admin/backers" className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">Backers</Link>
          <Link to="/admin/businesses" className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">Businesses</Link>
          <Link to="/admin/consumers" className="rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100">Consumers</Link>
          <Link to="/admin/events" className="rounded-lg bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">Events</Link>
          <Link to="/admin/settings" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Settings</Link>
        </div>
      </div>
    </div>
  );
}
