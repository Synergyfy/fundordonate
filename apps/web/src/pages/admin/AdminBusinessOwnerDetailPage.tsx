// =============================================================================
// Admin Business Owner Detail Page
// Detailed view of a single business owner for admin management.
// =============================================================================

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Award, Edit3, Play, Ban, MessageSquare,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

interface BusinessOwnerDetail {
  id: string;
  name: string;
  email: string;
  businessName: string;
  businessType: string;
  location: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  tier: string;
  membershipExpiry: string;
  joinedAt: string;
  totalContributed: number;
  campaignsCount: number;
  rewardsEarned: number;
  rank: number;
  campaigns: { id: string; name: string; status: string; raised: number; target: number }[];
}

const DEMO_OWNER: BusinessOwnerDetail = {
  id: "bo-1",
  name: "Sarah Johnson",
  email: "sarah@sarahsbakery.com",
  businessName: "Sarah's Bakery",
  businessType: "Restaurant & Cafe",
  location: "Manchester > Northern Quarter",
  status: "ACTIVE",
  tier: "Gold",
  membershipExpiry: "2026-12-31",
  joinedAt: "2026-03-15",
  totalContributed: 125000,
  campaignsCount: 4,
  rewardsEarned: 8,
  rank: 3,
  campaigns: [
    { id: "c1", name: "Feed Manchester", status: "ACTIVE", raised: 50000, target: 75000 },
    { id: "c2", name: "Holiday Meal Drive", status: "COMPLETED", raised: 30000, target: 25000 },
    { id: "c3", name: "Youth Bakery Training", status: "ACTIVE", raised: 25000, target: 50000 },
    { id: "c4", name: "Community Kitchen", status: "DRAFT", raised: 0, target: 40000 },
  ],
};

export default function AdminBusinessOwnerDetailPage() {
  const { id: _id } = useParams();
  const [status, setStatus] = useState(DEMO_OWNER.status);
  const owner = DEMO_OWNER;

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/business-owners" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{owner.businessName}</h1>
          <p className="text-sm text-gray-500">{owner.name} · {owner.email}</p>
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
          <div className="text-lg font-bold text-gray-900">{fmt(owner.totalContributed)}</div>
          <div className="text-xs text-gray-500">Total Contributed</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{owner.campaignsCount}</div>
          <div className="text-xs text-gray-500">Campaigns</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{owner.rewardsEarned}</div>
          <div className="text-xs text-gray-500">Rewards</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">#{owner.rank}</div>
          <div className="text-xs text-gray-500">Leaderboard</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{owner.tier}</div>
          <div className="text-xs text-gray-500">Membership</div>
        </div>
      </div>

      {/* Business Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Business Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-gray-900">{owner.businessType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-900">{owner.location}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-900">{owner.joinedAt}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Membership Expiry</span><span className="text-gray-900">{owner.membershipExpiry}</span></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            <button className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> Edit Business Profile
            </button>
            <button className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Send Message
            </button>
            <button className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <Award className="h-4 w-4" /> View Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns */}
      <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-bold text-gray-900">Campaigns</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Raised</th>
              <th className="px-4 py-3 font-medium text-gray-500">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {owner.campaigns.map((c) => {
              const pct = c.target > 0 ? Math.min(100, Math.round((c.raised / c.target) * 100)) : 0;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      c.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(c.raised)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
