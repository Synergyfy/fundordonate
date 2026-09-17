// =============================================================================
// My Business Page
// Business owner's own business profile management.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Store, Edit3, Target, TrendingUp, Award, Crown, ExternalLink,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

interface MyBusiness {
  name: string;
  type: string;
  description: string;
  location: string;
  city: string;
  borough: string;
  highStreet: string;
  categories: string[];
  membershipTier: string;
  membershipExpiry: string;
  status: string;
  campaignGoal: string;
  preferredAudience: string;
  joinedAt: string;
}

const DEMO_BUSINESS: MyBusiness = {
  name: "Sarah's Bakery",
  type: "Restaurant & Cafe",
  description: "Artisan bakery serving the Northern Quarter community since 2019. We're passionate about using local ingredients and supporting our neighbourhood.",
  location: "Manchester > Northern Quarter > Oldham Street",
  city: "Manchester",
  borough: "Northern Quarter",
  highStreet: "Oldham Street",
  categories: ["Food & Drink", "Community"],
  membershipTier: "Gold",
  membershipExpiry: "2026-12-31",
  status: "ACTIVE",
  campaignGoal: "community",
  preferredAudience: "both",
  joinedAt: "2026-03-15",
};

export default function MyBusinessPage() {
  const [editing, setEditing] = useState(false);
  const business = DEMO_BUSINESS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Business</h1>
          <p className="text-sm text-gray-500">Manage your business profile and settings.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit3 className="h-4 w-4" /> {editing ? "Cancel" : "Edit"}
          </button>
          <Link
            to={`/business/${business.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <ExternalLink className="h-4 w-4" /> View Public Profile
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 ${
        business.status === "ACTIVE" ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
      }`}>
        <div className="flex items-center gap-2">
          <Store className={`h-5 w-5 ${business.status === "ACTIVE" ? "text-green-600" : "text-yellow-600"}`} />
          <span className={`text-sm font-bold ${business.status === "ACTIVE" ? "text-green-800" : "text-yellow-800"}`}>
            Business is {business.status === "ACTIVE" ? "Active" : "Pending Review"}
          </span>
          <span className="ml-auto text-xs text-gray-500">Since {business.joinedAt}</span>
        </div>
      </div>

      {/* Business Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{business.name}</h2>
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 mb-4">{business.description}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-gray-900">{business.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-900">{business.location}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Categories</span><span className="text-gray-900">{business.categories.join(", ")}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Audience</span><span className="text-gray-900 capitalize">{business.preferredAudience}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-bold text-gray-900">Membership</h3>
            </div>
            <div className="text-lg font-bold text-gray-900">{business.membershipTier}</div>
            <div className="text-xs text-gray-500">Expires {business.membershipExpiry}</div>
            <Link to="/membership" className="mt-3 block text-center rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100">
              Upgrade Tier
            </Link>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold text-gray-900">Quick Stats</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Active Campaigns</span><span className="font-bold text-gray-900">2</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Raised</span><span className="font-bold text-gray-900">{fmt(75000)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Leaderboard Rank</span><span className="font-bold text-gray-900">#3</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/business-owner" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <Store className="mx-auto h-6 w-6 text-primary-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Dashboard</div>
        </Link>
        <Link to="/business-owner/campaigns" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <Target className="mx-auto h-6 w-6 text-blue-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Campaigns</div>
        </Link>
        <Link to="/business-owner/rewards" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <Award className="mx-auto h-6 w-6 text-yellow-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Rewards</div>
        </Link>
        <Link to="/business-owner/leaderboards" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <TrendingUp className="mx-auto h-6 w-6 text-green-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Leaderboard</div>
        </Link>
      </div>
    </div>
  );
}
