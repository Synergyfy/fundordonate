// =============================================================================
// Business Owner Campaigns Page
// List of campaigns created by the business owner, wired to live backend API.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Target, Plus, Calendar, AlertCircle } from "lucide-react";
import { useBusinessCampaigns } from "@/services/campaign/hook";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type StatusFilter = "" | "ACTIVE" | "COMPLETED" | "DRAFT" | "PENDING_REVIEW";

export default function BusinessOwnerCampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const { data, isLoading, error } = useBusinessCampaigns(
    statusFilter ? { status: statusFilter } : undefined
  );

  const campaigns = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-sm text-gray-500">Manage your campaigns and track their progress.</p>
        </div>
        <Link
          to="/dashboard/campaign-centre"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Claim Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["", "ACTIVE", "PENDING_REVIEW", "COMPLETED", "DRAFT"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="font-semibold text-red-900">Failed to load campaigns.</p>
          <p className="text-xs text-red-700 mt-1">Please check your connection and try again.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && campaigns.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center border border-dashed">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900">No campaigns found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {statusFilter
              ? `There are no campaigns with status "${statusFilter}".`
              : "You haven't claimed or launched any campaigns yet."}
          </p>
          <Link
            to="/dashboard/campaign-centre"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" /> Claim a Campaign Template
          </Link>
        </div>
      )}

      {/* Campaign Cards */}
      {!isLoading && !error && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const pct = c.percentage;
            return (
              <Link
                key={c.id}
                to={`/dashboard/my-campaigns/${c.id}`}
                className="rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                    <p className="text-xs text-primary-700 font-medium">{c.templateName}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    c.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                    c.status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-500"
                  }`}>{c.status.replace("_", " ")}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{c.description || "No description provided."}</p>
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
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {c.backers} contributions</span>
                  {c.endDate && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ends {c.endDate.split("T")[0]}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
