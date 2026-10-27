// =============================================================================
// All Campaigns — Admin
// Campaign directory with live backend API queries, status filtering, and actions.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, Plus } from "lucide-react";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";
import { adminApi, type AdminCampaign } from "@/services/admin";
import { formatCurrency } from "@/utils/formatters";

type StatusTab =
  | "all"
  | "draft"
  | "changes_required"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "closed"
  | "archived";

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending_review", label: "Pending Review" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Drafts" },
  { id: "changes_required", label: "Changes" },
  { id: "approved", label: "Approved" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

interface AllCampaignsPageProps {
  audience?: "business" | "consumer";
  forceStatus?: Exclude<StatusTab, "all">;
}

export function AllCampaignsPage({ audience, forceStatus }: AllCampaignsPageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus: StatusTab =
    forceStatus ?? ((searchParams.get("status")?.toLowerCase() as StatusTab) || "all");

  const [activeTab, setActiveTab] = useState<StatusTab>(initialStatus);
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === "all" ? undefined : activeTab.toUpperCase();
      const res = await adminApi.getCampaigns({
        status: statusParam,
        search: search || undefined,
        limit: 100,
      });
      const items = (res as any).campaigns || res.items || [];
      setCampaigns(items);
      setTotal(res.total || items.length);
    } catch {
      setCampaigns([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

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
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{viewTitle}</h1>
          <p className="text-sm text-gray-500">
            {total} live campaigns found in the system
          </p>
        </div>
        <Link
          to="/admin/campaigns/templates/new"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Campaign Template
        </Link>
      </div>

      {/* Status Tabs */}
      {!forceStatus && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns by title, category..."
          className="input-field w-full pl-9"
        />
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                <th className="px-5 py-3 text-left font-medium">Campaign</th>
                <th className="px-5 py-3 text-left font-medium">Category / Creator</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Funding Progress</th>
                <th className="px-5 py-3 text-right font-medium">Goal</th>
                <th className="px-5 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Loading live campaigns...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No campaigns found.</td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const raised = c.raisedAmount || 0;
                  const goal = c.goalAmount || 1;
                  const pct = Math.min(100, Math.round((raised / goal) * 100));

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link to={`/admin/campaigns/${c.id}`} className="font-semibold text-gray-900 hover:text-primary-600 block">
                          {c.title}
                        </Link>
                        <span className="text-xs text-gray-400">{c.slug || c.id}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        <div>{c.category?.name || "General"}</div>
                        <div className="text-gray-400">
                          {c.author ? `${c.author.firstName} ${c.author.lastName}` : "System"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <CampaignStatusBadge status={c.status as any} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-xs font-semibold text-gray-900">{formatCurrency(raised)}</div>
                        <div className="text-[11px] text-primary-600 font-bold">{pct}%</div>
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-gray-600 font-medium">
                        {formatCurrency(goal)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          to={`/admin/campaigns/${c.id}`}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
