// =============================================================================
// Admin Business Detail Page
// Detailed view of a business entity for admin management.
// =============================================================================

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Target, Edit3, Play, Ban, Users,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_BUSINESS = {
  id: "biz-1",
  name: "Sarah's Bakery",
  type: "Restaurant & Cafe",
  description: "Artisan bakery serving the Northern Quarter community since 2019.",
  owner: "Sarah Johnson",
  ownerEmail: "sarah@sarahsbakery.com",
  location: "Manchester > Northern Quarter > Oldham Street",
  status: "ACTIVE" as const,
  categories: ["Food & Drink", "Community"],
  joinedAt: "2026-03-15",
  totalContributed: 125000,
  campaignsCount: 4,
  activeBackers: 156,
  rewardsEarned: 8,
  inStoreContributions: 89000,
};

export default function AdminBusinessDetailPage() {
  const { id: _id } = useParams();
  const [status, setStatus] = useState<"ACTIVE" | "PENDING" | "SUSPENDED">(DEMO_BUSINESS.status);
  const business = DEMO_BUSINESS;

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/businesses" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-sm text-gray-500">{business.type} · {business.owner}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[status]}`}>
            {status}
          </span>
          {status === "ACTIVE" && (
            <button onClick={() => setStatus("SUSPENDED")} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
              <Ban className="inline h-3 w-3 mr-1" /> Suspend
            </button>
          )}
          {status === "SUSPENDED" && (
            <button onClick={() => setStatus("ACTIVE")} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50">
              <Play className="inline h-3 w-3 mr-1" /> Reactivate
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{fmt(business.totalContributed)}</div>
          <div className="text-xs text-gray-500">Total Contributed</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{business.campaignsCount}</div>
          <div className="text-xs text-gray-500">Campaigns</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{business.activeBackers}</div>
          <div className="text-xs text-gray-500">Active Backers</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{fmt(business.inStoreContributions)}</div>
          <div className="text-xs text-gray-500">In-Store</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{business.rewardsEarned}</div>
          <div className="text-xs text-gray-500">Rewards</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Business Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="text-gray-900">{business.owner}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{business.ownerEmail}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-900">{business.location}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Categories</span><span className="text-gray-900">{business.categories.join(", ")}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-900">{business.joinedAt}</span></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            <Link to={`/admin/business-owners/${business.id}`} className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <Users className="h-4 w-4" /> View Owner Profile
            </Link>
            <button className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> Edit Business
            </button>
            <button className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <Target className="h-4 w-4" /> View Campaigns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
