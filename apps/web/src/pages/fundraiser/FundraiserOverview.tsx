import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fundraiserApi } from "@/services/fundraiser.service";

interface FundraiserStats {
  totalCampaigns: number;
  publishedCampaigns: number;
  draftCampaigns: number;
  totalRaised: number;
  totalGoal: number;
  totalDonations: number;
  totalDonationsAmount: number;
  totalPledges: number;
  totalPledgesAmount: number;
  totalEarnings: number;
  pendingWithdrawals: number;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

export function FundraiserOverview() {
  const [stats, setStats] = useState<FundraiserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fundraiserApi.getStats().then((s) => {
      setStats(s);
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
    { label: "Total Raised", value: formatCurrency(stats?.totalRaised || 0), icon: "💰", color: "bg-green-50 text-green-700" },
    { label: "My Campaigns", value: stats?.totalCampaigns?.toString() || "0", icon: "🎯", color: "bg-blue-50 text-blue-700" },
    { label: "Total Donations", value: formatCurrency(stats?.totalDonationsAmount || 0), icon: "❤️", color: "bg-pink-50 text-pink-700" },
    { label: "Total Pledges", value: formatCurrency(stats?.totalPledgesAmount || 0), icon: "🤝", color: "bg-purple-50 text-purple-700" },
    { label: "Wallet Balance", value: formatCurrency(stats?.totalEarnings || 0), icon: "🏦", color: "bg-indigo-50 text-indigo-700" },
    { label: "Pending Withdrawals", value: formatCurrency(stats?.pendingWithdrawals || 0), icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fundraiser Dashboard</h1>
        <Link to="/campaigns/create" className="btn-primary text-sm">+ New Campaign</Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{m.icon}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.color}`}>{m.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign Progress */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Campaign Progress</h2>
          <Link to="/fundraiser/campaigns" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm text-gray-600">Published Campaigns</span>
            <span className="text-sm font-semibold text-green-700">{stats?.publishedCampaigns || 0}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm text-gray-600">Draft Campaigns</span>
            <span className="text-sm font-semibold text-gray-700">{stats?.draftCampaigns || 0}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm text-gray-600">Goal Progress</span>
            <span className="text-sm font-semibold text-primary-700">
              {stats?.totalGoal ? Math.round((stats.totalRaised / stats.totalGoal) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/campaigns/create" className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">Create Campaign</Link>
          <Link to="/fundraiser/campaigns" className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">My Campaigns</Link>
          <Link to="/fundraiser/earnings" className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100">View Earnings</Link>
          <Link to="/fundraiser/withdrawals" className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100">Withdraw Funds</Link>
        </div>
      </div>
    </div>
  );
}
