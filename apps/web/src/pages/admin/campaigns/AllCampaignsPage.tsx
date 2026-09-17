// =============================================================================
// All Campaigns — Admin
// Campaign directory with status tabs, search, filters, and detail links.
// =============================================================================

import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, Target, Plus, Calendar, MapPin, Copy } from "lucide-react";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";

type StatusTab = "all" | "draft" | "pending_review" | "scheduled" | "active" | "completed" | "archived";

interface Campaign {
  id: string;
  title: string;
  scope: "city" | "independent";
  cityName: string;
  audience: "business" | "consumer" | "both";
  status: string;
  raisedAmount: number;
  targetAmount: number;
  backers: number;
  startDate: string;
  endDate: string;
  season: string;
  createdAt: string;
}

const STATUS_TABS: { id: StatusTab; label: string; count?: number }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "pending_review", label: "Pending Review" },
  { id: "scheduled", label: "Scheduled" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

const DEMO_CAMPAIGNS: Campaign[] = [
  { id: "c1", title: "Manchester Tech Hub Launch", scope: "city", cityName: "Manchester", audience: "business", status: "active", raisedAmount: 420000, targetAmount: 500000, backers: 180, startDate: "2026-10-01", endDate: "2026-12-31", season: "Autumn 2026", createdAt: "2026-09-01" },
  { id: "c2", title: "Birmingham Green Initiative", scope: "city", cityName: "Birmingham", audience: "both", status: "active", raisedAmount: 280000, targetAmount: 350000, backers: 120, startDate: "2026-10-01", endDate: "2026-12-31", season: "Autumn 2026", createdAt: "2026-09-01" },
  { id: "c3", title: "London Community Garden", scope: "city", cityName: "London", audience: "consumer", status: "active", raisedAmount: 85000, targetAmount: 100000, backers: 420, startDate: "2026-10-01", endDate: "2026-12-31", season: "Autumn 2026", createdAt: "2026-09-01" },
  { id: "c4", title: "Leeds Digital Skills Programme", scope: "city", cityName: "Leeds", audience: "both", status: "draft", raisedAmount: 0, targetAmount: 200000, backers: 0, startDate: "", endDate: "", season: "Autumn 2026", createdAt: "2026-09-10" },
  { id: "c5", title: "Liverpool Youth Fund", scope: "city", cityName: "Liverpool", audience: "consumer", status: "pending_review", raisedAmount: 0, targetAmount: 80000, backers: 0, startDate: "", endDate: "", season: "Autumn 2026", createdAt: "2026-09-12" },
  { id: "c6", title: "Bristol Arts Centre", scope: "city", cityName: "Bristol", audience: "consumer", status: "completed", raisedAmount: 60000, targetAmount: 60000, backers: 150, startDate: "2026-07-01", endDate: "2026-09-15", season: "Summer 2026", createdAt: "2026-06-15" },
  { id: "c7", title: "Birmingham Food Bank Network", scope: "city", cityName: "Birmingham", audience: "both", status: "scheduled", raisedAmount: 0, targetAmount: 50000, backers: 0, startDate: "2026-10-15", endDate: "2026-12-15", season: "Autumn 2026", createdAt: "2026-09-08" },
  { id: "c8", title: "London Tech Startup Fund", scope: "city", cityName: "London", audience: "business", status: "active", raisedAmount: 650000, targetAmount: 800000, backers: 290, startDate: "2026-10-01", endDate: "2026-12-31", season: "Autumn 2026", createdAt: "2026-08-20" },
  { id: "c9", title: "Independent Bristol Makers", scope: "independent", cityName: "Bristol", audience: "consumer", status: "archived", raisedAmount: 15000, targetAmount: 20000, backers: 80, startDate: "2026-04-01", endDate: "2026-06-30", season: "Spring 2026", createdAt: "2026-03-15" },
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

export function AllCampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialStatus = (searchParams.get("status") as StatusTab) || "all";
  const [activeTab, setActiveTab] = useState<StatusTab>(initialStatus);
  const [search, setSearch] = useState("");

  // Count campaigns per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: DEMO_CAMPAIGNS.length };
    for (const c of DEMO_CAMPAIGNS) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return counts;
  }, []);

  // Filter campaigns
  const filtered = useMemo(() => {
    return DEMO_CAMPAIGNS.filter((c) => {
      // Status tab
      if (activeTab !== "all" && c.status !== activeTab) return false;
      // Search
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeTab, search]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Campaigns</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">All Campaigns</h1>
          <p className="text-sm text-gray-500">
            {DEMO_CAMPAIGNS.length} campaigns across all statuses
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
          Showing {filtered.length} of {DEMO_CAMPAIGNS.length} campaigns
        </div>
      )}
    </div>
  );
}
