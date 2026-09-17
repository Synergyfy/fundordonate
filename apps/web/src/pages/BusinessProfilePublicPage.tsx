// =============================================================================
// Business Profile Public Page
// Public-facing business profile view.
// =============================================================================

import { Link, useParams } from "react-router-dom";
import {
  Target, TrendingUp, Award, Crown, Share2, Heart, ArrowLeft,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_BUSINESS = {
  name: "Sarah's Bakery",
  type: "Restaurant & Cafe",
  description: "Artisan bakery serving the Northern Quarter community since 2019. We're passionate about using local ingredients and supporting our neighbourhood.",
  location: "Manchester > Northern Quarter > Oldham Street",
  categories: ["Food & Drink", "Community"],
  membershipTier: "Gold",
  joinedAt: "March 2026",
  rank: 3,
  totalRaised: 125000,
  campaigns: [
    { id: "c1", name: "Feed Manchester", description: "Providing meals for families in need across Manchester.", raised: 50000, target: 75000, status: "ACTIVE" },
    { id: "c2", name: "Holiday Meal Drive", description: "Ensuring no one goes hungry during the holidays.", raised: 30000, target: 25000, status: "COMPLETED" },
    { id: "c3", name: "Youth Bakery Training", description: "Teaching young people valuable skills in baking and business.", raised: 25000, target: 50000, status: "ACTIVE" },
  ],
  rewards: ["Feed Manchester Champion", "Holiday Hero 2026", "Community Builder"],
};

export default function BusinessProfilePublicPage() {
  const { slug: _slug } = useParams();
  const business = DEMO_BUSINESS;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">{business.type} · {business.location}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 flex items-center gap-1">
                <Heart className="h-4 w-4" /> Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <div className="text-xl font-bold text-gray-900">{fmt(business.totalRaised)}</div>
            <div className="text-xs text-gray-500">Total Raised</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <Target className="mx-auto h-5 w-5 text-blue-500 mb-1" />
            <div className="text-xl font-bold text-gray-900">{business.campaigns.length}</div>
            <div className="text-xs text-gray-500">Campaigns</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <Award className="mx-auto h-5 w-5 text-yellow-500 mb-1" />
            <div className="text-xl font-bold text-gray-900">#{business.rank}</div>
            <div className="text-xs text-gray-500">Leaderboard</div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl bg-white p-5 shadow-sm border mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
          <p className="text-sm text-gray-600">{business.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {business.categories.map((c) => (
              <span key={c} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{c}</span>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Member since {business.joinedAt} · {business.membershipTier} Tier
          </div>
        </div>

        {/* Campaigns */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
          </div>
          <div className="divide-y">
            {business.campaigns.map((c) => {
              const pct = Math.min(100, Math.round((c.raised / c.target) * 100));
              return (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>{c.status}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{fmt(c.raised)} / {fmt(c.target)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rewards */}
        <div className="rounded-xl bg-white p-5 shadow-sm border">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Earned Recognition</h2>
          <div className="flex flex-wrap gap-2">
            {business.rewards.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700">
                <Award className="h-3 w-3" /> {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
