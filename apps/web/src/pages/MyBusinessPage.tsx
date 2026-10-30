// =============================================================================
// My Business Page
// Business owner's own business profile management, wired to live backend API.
// =============================================================================

import { Link } from "react-router-dom";
import {
  Store, Target, TrendingUp, Award, Crown, ExternalLink, AlertCircle, RefreshCw,
} from "lucide-react";
import { useBusinessProfile } from "@/services/business/hook";
import { useAuthStore } from "@/stores/auth.store";
import { getCentralProfileUrl } from "@/lib/central-hub";

export default function MyBusinessPage() {
  const { data: business, isLoading, error, refetch } = useBusinessProfile();
  const authUser = useAuthStore((s) => s.user);
  const editProfileUrl = getCentralProfileUrl(
    authUser ?? { userType: "business", role: "business" },
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded bg-gray-200" />
        <div className="h-16 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-72 rounded-xl bg-gray-200" />
          <div className="h-72 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <p className="font-semibold text-red-900">Failed to load business profile.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const locationDisplay = `${business.highStreet}, ${business.localArea}, ${business.city} (${business.postcode})`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Business</h1>
          <p className="text-sm text-gray-500">Manage your business profile and public directory details.</p>
        </div>
        <div className="flex gap-2">
          <a
            href={editProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-xs"
          >
            <ExternalLink className="h-4 w-4" /> Edit on Central Hub
          </a>
          <Link
            to={`/business/${business.slug}`}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 shadow-xs"
          >
            <ExternalLink className="h-4 w-4" /> View Public Profile
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 shadow-xs ${
        business.status === "ACTIVE" ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
      }`}>
        <div className="flex items-center gap-2">
          <Store className={`h-5 w-5 ${business.status === "ACTIVE" ? "text-green-600" : "text-yellow-600"}`} />
          <span className={`text-sm font-bold ${business.status === "ACTIVE" ? "text-green-800" : "text-yellow-800"}`}>
            Business Status: {business.status}
          </span>
          <span className="ml-auto text-xs text-gray-500">
            Registered on {business.createdAt.split("T")[0]}
          </span>
        </div>
      </div>

      {/* Profile Details (read-only — Central Hub is the source of truth) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-xs text-blue-800">
              Business details are synced from MCOM Central Hub and cannot be
              edited here. Use <span className="font-semibold">Edit on Central Hub</span>{" "}
              to update your business name, contact details or address.
            </p>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{business.businessType}</p>
            </div>
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {business.description || "No business description provided yet."}
          </p>
          <div className="space-y-3 text-sm divide-y">
            <div className="flex justify-between py-1"><span className="text-gray-500">Location</span><span className="text-right text-gray-900 font-medium">{locationDisplay}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Address</span><span className="text-right text-gray-900 font-medium">{business.address || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Country</span><span className="text-gray-900 font-medium">{business.country || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Industry</span><span className="text-right text-gray-900 font-medium">{business.industry || business.businessType}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Category</span><span className="text-gray-900 font-medium">{business.category}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Subcategory</span><span className="text-gray-900 font-medium">{business.subCategory || business.subcategories?.join(", ") || "None"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Contact Email</span><span className="text-gray-900 font-medium">{business.email}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Phone</span><span className="text-gray-900 font-medium">{business.phone || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Website</span><span className="text-right text-gray-900 font-medium">{business.website || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Opening Hours</span><span className="text-right text-gray-900 font-medium">{business.openingHours || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Social Media</span><span className="text-right text-gray-900 font-medium">{business.socialMedia || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Target Audience</span><span className="text-gray-900 capitalize font-medium">{business.preferredAudience}</span></div>
          </div>
        </div>

        {/* Membership & Stats Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-bold text-gray-900">Membership Tier</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">{business.membershipTier}</div>
            <div className="text-xs text-gray-500 mt-1">
              {business.membershipExpiry ? `Expires ${business.membershipExpiry.split("T")[0]}` : "Active seasonal membership"}
            </div>
            <Link
              to="/membership"
              className="mt-4 block text-center rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
            >
              Manage / Upgrade Tier
            </Link>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold text-gray-900">Platform Activity</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Campaigns</span><span className="font-bold text-gray-900">{business._count?.campaigns ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Transactions</span><span className="font-bold text-gray-900">{business._count?.contributions ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rewards Unlocked</span><span className="font-bold text-gray-900">{business._count?.earnedRewards ?? 0}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/dashboard" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <Store className="mx-auto h-6 w-6 text-primary-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Dashboard</div>
        </Link>
        <Link to="/dashboard/campaigns" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <Target className="mx-auto h-6 w-6 text-blue-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Campaigns</div>
        </Link>
        <Link to="/dashboard/rewards" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <Award className="mx-auto h-6 w-6 text-yellow-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Rewards</div>
        </Link>
        <Link to="/dashboard/leaderboard" className="rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md transition-shadow">
          <TrendingUp className="mx-auto h-6 w-6 text-green-600 mb-2" />
          <div className="text-sm font-bold text-gray-900">Leaderboard</div>
        </Link>
      </div>
    </div>
  );
}
