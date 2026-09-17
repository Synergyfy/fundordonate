// =============================================================================
// Business Owner Dashboard Overview
// Main dashboard view for business owners.
// =============================================================================

import { Link } from "react-router-dom";
import {
  Store, Target, TrendingUp, Award, Users, ArrowRight, Crown, BarChart3,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_STATS = {
  businessName: "Sarah's Bakery",
  membershipTier: "Gold",
  totalContributed: 125000,
  activeCampaigns: 2,
  totalBackers: 156,
  leaderboardRank: 3,
  rewardsEarned: 8,
  currentSeasonContribution: 45000,
};

const RECENT_CAMPAIGNS = [
  { id: "c1", name: "Feed Manchester", raised: 50000, target: 75000, status: "ACTIVE" },
  { id: "c3", name: "Youth Bakery Training", raised: 25000, target: 50000, status: "ACTIVE" },
];

const QUICK_ACTIONS = [
  { label: "Create Campaign", href: "/admin/campaigns/new", icon: Target, color: "text-blue-600 bg-blue-50" },
  { label: "View Leaderboard", href: "/business-owner/leaderboard", icon: BarChart3, color: "text-green-600 bg-green-50" },
  { label: "My Rewards", href: "/business-owner/rewards", icon: Award, color: "text-yellow-600 bg-yellow-50" },
  { label: "My Business", href: "/business-owner/my-business", icon: Store, color: "text-purple-600 bg-purple-50" },
];

export default function BusinessOwnerOverviewPage() {
  const stats = DEMO_STATS;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {stats.businessName}</h1>
            <p className="mt-1 text-primary-100">Here's how your business is making an impact this season.</p>
          </div>
          <Crown className="h-10 w-10 text-yellow-300" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <div className="text-xl font-bold text-gray-900">{fmt(stats.totalContributed)}</div>
              <div className="text-xs text-gray-500">Total Contributed</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2"><Target className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.activeCampaigns}</div>
              <div className="text-xs text-gray-500">Active Campaigns</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2"><Users className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.totalBackers}</div>
              <div className="text-xs text-gray-500">Total Backers</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2"><BarChart3 className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <div className="text-xl font-bold text-gray-900">#{stats.leaderboardRank}</div>
              <div className="text-xs text-gray-500">Leaderboard Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.href}
              className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow"
            >
              <div className={`mx-auto rounded-lg p-2 w-fit ${action.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-2 text-sm font-bold text-gray-900">{action.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Active Campaigns */}
      <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Active Campaigns</h2>
          <Link to="/business-owner/campaigns" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y">
          {RECENT_CAMPAIGNS.map((c) => {
            const pct = Math.min(100, Math.round((c.raised / c.target) * 100));
            return (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{c.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden max-w-xs">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-bold text-gray-900">{fmt(c.raised)}</div>
                  <div className="text-xs text-gray-500">of {fmt(c.target)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
