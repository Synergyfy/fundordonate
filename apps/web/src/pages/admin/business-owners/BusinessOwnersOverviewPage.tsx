// =============================================================================
// Business Owners Overview — Admin
// Business Owner activity command view with key metrics and drill-down.
// =============================================================================

import { Link } from "react-router-dom";
import { ChevronRight, Building2, Users, TrendingUp, Target, Trophy, Wallet, Star } from "lucide-react";

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_STATS = {
  totalBusinessOwners: 1240,
  activeBusinessOwners: 890,
  totalBusinesses: 680,
  businessesParticipating: 420,
  totalCampaigns: 89,
  activeCampaigns: 34,
  totalRaised: 8200000,
  totalTarget: 15000000,
  totalBackers: 3200,
  totalFoundingMembers: 480,
  totalMembership: 620,
  rewardsIssued: 156,
};

const DEMO_TOP_CAMPAIGNS = [
  { id: "c1", name: "Manchester Tech Hub Launch", raised: 420000, target: 500000, backers: 180, city: "Manchester" },
  { id: "c2", name: "Birmingham Green Initiative", raised: 280000, target: 350000, backers: 120, city: "Birmingham" },
  { id: "c3", name: "London Community Fund", raised: 650000, target: 800000, backers: 290, city: "London" },
  { id: "c4", name: "Leeds Digital Skills", raised: 150000, target: 200000, backers: 85, city: "Leeds" },
];

const DEMO_RECENT_ACTIVITY = [
  { time: "2 hours ago", text: "New Business Owner registered: TechStart Manchester", type: "registration" },
  { time: "5 hours ago", text: "Campaign reached 80%: Birmingham Green Initiative", type: "milestone" },
  { time: "1 day ago", text: "Business Owner campaign completed: Leeds Digital Skills", type: "completion" },
  { time: "2 days ago", text: "10 new businesses joined from London", type: "registration" },
];

export function BusinessOwnersOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Business Owners</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Business Owners</h1>
        <p className="text-sm text-gray-500">Business Owner activity overview across the platform</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Raised", value: fmt(DEMO_STATS.totalRaised), icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
          { label: "Active Campaigns", value: String(DEMO_STATS.activeCampaigns), icon: <Target className="h-4 w-4 text-blue-500" /> },
          { label: "Business Owners", value: DEMO_STATS.activeBusinessOwners.toLocaleString(), icon: <Users className="h-4 w-4 text-purple-500" /> },
          { label: "Businesses", value: DEMO_STATS.businessesParticipating.toLocaleString(), icon: <Building2 className="h-4 w-4 text-amber-500" /> },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white border p-4 flex items-center gap-3">
            {item.icon}
            <div>
              <div className="text-xs text-gray-400">{item.label}</div>
              <div className="text-lg font-bold text-gray-900">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-white border p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900">Seasonal Funding Progress</h3>
          <span className="text-sm font-bold text-primary-600">
            {DEMO_STATS.totalTarget > 0 ? Math.round((DEMO_STATS.totalRaised / DEMO_STATS.totalTarget) * 100) : 0}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${DEMO_STATS.totalTarget > 0 ? Math.round((DEMO_STATS.totalRaised / DEMO_STATS.totalTarget) * 100) : 0}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{fmt(DEMO_STATS.totalRaised)} raised</span>
          <span>{fmt(DEMO_STATS.totalTarget)} target</span>
        </div>
      </div>

      {/* Participation Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border p-4 text-center">
          <Star className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{DEMO_STATS.totalBackers.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Backers</div>
        </div>
        <div className="rounded-xl bg-white border p-4 text-center">
          <Trophy className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{DEMO_STATS.totalFoundingMembers.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Founding Members</div>
        </div>
        <div className="rounded-xl bg-white border p-4 text-center">
          <Wallet className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{DEMO_STATS.totalMembership.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Membership</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campaigns */}
        <div className="rounded-xl bg-white border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Top Campaigns</h3>
            <Link to="/admin/business-owners/campaigns" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {DEMO_TOP_CAMPAIGNS.map((c) => {
              const progress = c.target > 0 ? Math.round((c.raised / c.target) * 100) : 0;
              return (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    <span className="text-xs font-bold text-primary-600">{progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{fmt(c.raised)} of {fmt(c.target)}</span>
                    <span>{c.backers} backers</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white border">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {DEMO_RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">{a.time}</span>
                <span className="text-sm text-gray-700">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
