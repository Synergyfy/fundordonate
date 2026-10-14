// =============================================================================
// Business Owner Dashboard Overview
// Main dashboard view for business owners wired to live backend API.
// =============================================================================

import { Link } from "react-router-dom";
import {
  Store, Target, TrendingUp, Award, Users, ArrowRight, Crown, BarChart3, AlertCircle, RefreshCw,
} from "lucide-react";
import { useBusinessOverview } from "@/services/business/hook";
import { WalletCard } from "@/components/wallet/WalletCard";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const QUICK_ACTIONS = [
  { label: "Campaign Centre", href: "/dashboard/campaign-centre", icon: Target, color: "text-blue-600 bg-blue-50" },
  { label: "View Leaderboard", href: "/dashboard/leaderboard", icon: BarChart3, color: "text-green-600 bg-green-50" },
  { label: "My Rewards", href: "/dashboard/rewards", icon: Award, color: "text-yellow-600 bg-yellow-50" },
  { label: "My Business", href: "/dashboard/my-business", icon: Store, color: "text-purple-600 bg-purple-50" },
];

export default function BusinessOwnerOverviewPage() {
  const { data, isLoading, error, refetch } = useBusinessOverview();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="h-20 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  const errStatus = (error as any)?.response?.status ?? (error as any)?.status;
  const errMsg = (error as any)?.response?.data?.message ?? (error as any)?.message ?? "";
  const isMissingProfile = errStatus === 404 || String(errMsg).toLowerCase().includes("onboarding") || String(errMsg).toLowerCase().includes("no business profile");

  if (isMissingProfile) {
    return (
      <div className="rounded-2xl border border-primary-200 bg-white p-8 sm:p-10 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-4">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Complete Your Business Setup</h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
          Welcome to FundorDonate! You haven't completed your business onboarding yet. Set up your business profile to activate your campaigns, unlock member rewards, and access all dashboard tools.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard/onboarding"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
            Start Business Onboarding <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <p className="font-semibold text-red-900">Failed to load business dashboard overview.</p>
        <p className="text-xs text-red-700 mt-1">{String(errMsg) || "Please ensure your backend server is running and you are logged in."}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const { stats, availableTemplateTeaser, recentCampaigns } = data;
  const activeCampaigns = (recentCampaigns || []).filter(
    (c) => !c.status || c.status === "ACTIVE" || (c.status as string).toUpperCase() === "ACTIVE"
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {stats.businessName}</h1>
            <p className="mt-1 text-primary-100">Here's how your business is making an impact this season.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-300">
              {stats.membershipTier} Tier
            </span>
            <Crown className="h-10 w-10 text-yellow-300" />
          </div>
        </div>
      </div>

      {/* MCOM Central Wallet Card */}
      <WalletCard
        title="Business MCOM Wallet"
        subtitle="Prepaid credits for self-funding campaigns and partner transactions"
      />

      {/* Campaign Available Teaser */}
      {availableTemplateTeaser && (
        <Link
          to="/dashboard/campaign-centre"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 hover:bg-primary-100 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 shadow-xs"><Target className="h-5 w-5 text-primary-600" /></div>
            <div>
              <p className="text-sm font-bold text-primary-900">A campaign template is available to you</p>
              <p className="text-xs text-primary-700">{availableTemplateTeaser.name} — {availableTemplateTeaser.tagline}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary-700">
            Open Campaign Centre <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      {/* KPI Stats */}
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
          <Link to="/dashboard/campaigns" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {activeCampaigns.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No active campaigns right now. Head over to the{" "}
            <Link to="/dashboard/campaign-centre" className="text-primary-600 font-semibold hover:underline">
              Campaign Centre
            </Link>{" "}
            to launch one.
          </div>
        ) : (
          <div className="divide-y">
            {activeCampaigns.map((c) => (
              <Link key={c.id} to={`/dashboard/my-campaigns/${c.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{c.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden max-w-xs">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{c.percentage}%</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-bold text-gray-900">{fmt(c.raised)}</div>
                  <div className="text-xs text-gray-500">of {fmt(c.target)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
