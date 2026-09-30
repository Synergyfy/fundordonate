// =============================================================================
// All Campaigns — Admin
// Campaign directory with status tabs, search, filters, and detail links.
// =============================================================================

import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, Target, Plus, Calendar, MapPin, Copy, Globe } from "lucide-react";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";
import {
  getAdminCampaigns,
  summarizeCoverage,
  type AdminCampaign,
  type AdminCampaignStatus,
} from "@/data/adminCampaigns";

type StatusTab = "all" | AdminCampaignStatus;

type Campaign = AdminCampaign;

const STATUS_TABS: { id: StatusTab; label: string; count?: number }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "changes_required", label: "Changes" },
  { id: "pending_review", label: "Pending Review" },
  { id: "approved", label: "Approved" },
  { id: "scheduled", label: "Scheduled" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Closed" },
  { id: "archived", label: "Archived" },
];

const SCOPE_LABELS: Record<string, string> = {
  city: "City",
  independent: "Independent",
};

const AUDIENCE_LABELS: Record<string, string> = {
  both: "Business + Consumer",
  business: "Business",
  consumer: "Consumer",
};

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

interface AllCampaignsPageProps {
  /** Restrict the list to one audience (business / consumer campaigns menu views). */
  audience?: "business" | "consumer";
  /** Lock the status filter (e.g. the "Pending Review" menu view). */
  forceStatus?: Exclude<StatusTab, "all">;
}

export function AllCampaignsPage({ audience, forceStatus }: AllCampaignsPageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialStatus: StatusTab =
    forceStatus ?? ((searchParams.get("status") as StatusTab) || "all");
  const [activeTab, setActiveTab] = useState<StatusTab>(initialStatus);
  const [search, setSearch] = useState("");

  const campaigns = useMemo(() => getAdminCampaigns(), []);

  // Audience scope (both-audience campaigns appear in both views)
  const scoped = useMemo(() => {
    if (!audience) return campaigns;
    return campaigns.filter((c) => c.audience === audience || c.audience === "both");
  }, [campaigns, audience]);

  // Count campaigns per status (within the audience scope)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: scoped.length };
    for (const c of scoped) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return counts;
  }, [scoped]);

  // Filter campaigns
  const filtered = useMemo(() => {
    return scoped.filter((c) => {
      // Status tab
      if (activeTab !== "all" && c.status !== activeTab) return false;
      // Search — title, city and coverage set (areas, streets, postcodes)
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${c.title} ${c.cityName} ${summarizeCoverage(c)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [scoped, activeTab, search]);

  const handleDuplicate = (campaign: Campaign) => {
    const copyId = `${campaign.id}-copy`;
    navigate(`/admin/campaigns/new?duplicateFrom=${campaign.id}&copyId=${copyId}`);
  };

  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    if (tab === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", tab);
    }
    setSearchParams(searchParams);
  };

  const viewTitle =
    audience === "business"
      ? "Business Campaigns"
      : audience === "consumer"
        ? "Consumer Campaigns"
        : forceStatus === "pending_review"
          ? "Pending Review"
          : forceStatus
            ? STATUS_TABS.find((t) => t.id === forceStatus)?.label ?? "All Campaigns"
            : "All Campaigns";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/admin/campaigns" className="hover:text-gray-700">Campaigns</Link>
            {(audience || forceStatus) && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-gray-900 font-medium">{viewTitle}</span>
              </>
            )}
            {!audience && !forceStatus && (
              <span className="text-gray-900 font-medium">Campaigns</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{viewTitle}</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} of {scoped.length} campaigns
            {audience ? ` · ${audience === "business" ? "Business" : "Consumer"} audience (incl. both)` : " across all statuses"}
          </p>
        </div>
        <Link
          to="/admin/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Link>
      </div>

      {/* Status Tabs */}
      {!forceStatus ? (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeTab === tab.id
                        ? "bg-primary-100 text-primary-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 w-fit">
          <span className="text-xs font-semibold text-amber-700">
            Filtered: {STATUS_TABS.find((t) => t.id === forceStatus)?.label ?? forceStatus}
          </span>
          <Link to="/admin/campaigns" className="text-xs font-medium text-amber-700 underline hover:text-amber-900">
            View all campaigns
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          />
        </div>
      </div>

      {/* Campaign List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No campaigns found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or create a new campaign.</p>
            <Link
              to="/admin/campaigns/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Scope</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Coverage</th>
                <th className="px-5 py-3">Audience</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Progress</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((campaign) => {
                const progress = campaign.targetAmount > 0
                  ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
                  : 0;

                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                          <Target className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/campaigns/${campaign.id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate block"
                          >
                            {campaign.title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {campaign.season}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {SCOPE_LABELS[campaign.scope]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {campaign.cityName ? (
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {campaign.cityName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-1.5">
                        {campaign.coverage.national && (
                          <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        )}
                        <span
                          className="max-w-[220px] text-xs leading-relaxed text-gray-600"
                          title={summarizeCoverage(campaign)}
                        >
                          {summarizeCoverage(campaign)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                        {AUDIENCE_LABELS[campaign.audience]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">
                          {fmt(campaign.raisedAmount)} / {fmt(campaign.targetAmount)}
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 ml-auto">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/campaigns/${campaign.id}`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/campaigns/${campaign.id}/edit`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDuplicate(campaign)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          title="Duplicate campaign"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="text-center text-xs text-gray-400">
          Showing {filtered.length} of {scoped.length} campaigns
        </div>
      )}
    </div>
  );
}
