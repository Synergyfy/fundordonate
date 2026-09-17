// =============================================================================
// Business Owner Campaigns Page
// List of campaigns created by the business owner.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Target, Plus, Calendar } from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_CAMPAIGNS = [
  { id: "c1", name: "Feed Manchester", description: "Providing meals for families in need across Manchester.", raised: 50000, target: 75000, status: "ACTIVE", backers: 89, endDate: "2026-06-30" },
  { id: "c2", name: "Holiday Meal Drive", description: "Ensuring no one goes hungry during the holidays.", raised: 30000, target: 25000, status: "COMPLETED", backers: 120, endDate: "2025-12-31" },
  { id: "c3", name: "Youth Bakery Training", description: "Teaching young people valuable skills in baking and business.", raised: 25000, target: 50000, status: "ACTIVE", backers: 45, endDate: "2026-09-30" },
  { id: "c4", name: "Community Kitchen", description: "Building a community kitchen for shared cooking events.", raised: 0, target: 40000, status: "DRAFT", backers: 0, endDate: "2026-12-31" },
];

type StatusFilter = "" | "ACTIVE" | "COMPLETED" | "DRAFT";

export default function BusinessOwnerCampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const filtered = statusFilter
    ? DEMO_CAMPAIGNS.filter((c) => c.status === statusFilter)
    : DEMO_CAMPAIGNS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-sm text-gray-500">Manage your campaigns and track their progress.</p>
        </div>
        <Link
          to="/admin/campaigns/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["", "ACTIVE", "COMPLETED", "DRAFT"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const pct = c.target > 0 ? Math.min(100, Math.round((c.raised / c.target) * 100)) : 0;
          return (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  c.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                  c.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                }`}>{c.status}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{c.description}</p>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-900">{fmt(c.raised)}</span>
                  <span className="text-gray-500">of {fmt(c.target)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {c.backers} backers</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ends {c.endDate}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
