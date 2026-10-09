// =============================================================================
// Campaign Templates — Admin
// Reusable campaign structures: browse, filter, and manage master templates.
// =============================================================================

import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight, Plus, Search, FileText, Copy, Archive, ArchiveRestore,
  Eye, Pencil, Power, Gift, X, Calendar, Clock, Monitor, Lock,
} from "lucide-react";
import { BusinessTemplateCard } from "@/components/business/BusinessTemplateCard";
import {
  duplicateTemplate,
  getAdminTemplates,
  getTemplateForPreview,
  setTemplateLifecycle,
} from "@/data/campaignTemplateStore";

type TemplateStatus = "draft" | "active" | "inactive" | "archived";
type CampaignType = "donation" | "crowdfunding" | "fund";
type Audience = "business" | "consumer" | "both";

interface TemplateSummary {
  id: string;
  name: string;
  campaignType: CampaignType;
  audience: Audience;
  purpose: string;
  status: TemplateStatus;
  campaignsUsing: number;
  rewardsCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_TABS: { id: "all" | TemplateStatus; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "active", label: "Active Templates" },
  { id: "draft", label: "Draft Templates" },
  { id: "inactive", label: "Inactive Templates" },
  { id: "archived", label: "Archived Templates" },
];

const STATUS_BADGES: Record<TemplateStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-600" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-600" },
};

const TYPE_META: Record<CampaignType, { label: string; color: string }> = {
  donation: { label: "Donation", color: "bg-blue-100 text-blue-700" },
  crowdfunding: { label: "Crowdfunding", color: "bg-purple-100 text-purple-700" },
  fund: { label: "Fund", color: "bg-green-100 text-green-700" },
};

const AUDIENCE_META: Record<Audience, { label: string; color: string }> = {
  business: { label: "Business", color: "bg-blue-100 text-blue-700" },
  consumer: { label: "Consumer", color: "bg-pink-100 text-pink-700" },
  both: { label: "Both", color: "bg-indigo-100 text-indigo-700" },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Map a stored master template to the list-row summary shape. */
function toSummary(t: ReturnType<typeof getAdminTemplates>[number]): TemplateSummary {
  return {
    id: t.id,
    name: t.name,
    campaignType: t.campaignType,
    audience: t.audience,
    purpose: t.purpose,
    status: t.lifecycle,
    campaignsUsing: t.campaignsUsing,
    rewardsCount: t.rewards.length,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function CampaignTemplatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tick, setTick] = useState(0);
  const templates = useMemo(() => getAdminTemplates().map(toSummary), [tick]);
  const initialTab = (searchParams.get("status") as "all" | TemplateStatus) || "all";
  const [activeTab, setActiveTab] = useState<"all" | TemplateStatus>(initialTab);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<TemplateSummary | null>(null);
  const [previewing, setPreviewing] = useState<TemplateSummary | null>(null);

  const previewTemplate = useMemo(
    () => (previewing ? getTemplateForPreview(previewing.id) : undefined),
    [previewing, tick]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    for (const t of templates) counts[t.status] = (counts[t.status] || 0) + 1;
    return counts;
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (activeTab !== "all" && t.status !== activeTab) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [templates, activeTab, search]);

  const handleTabChange = (tab: "all" | TemplateStatus) => {
    setActiveTab(tab);
    if (tab === "all") searchParams.delete("status");
    else searchParams.set("status", tab);
    setSearchParams(searchParams);
  };

  const handleDuplicate = (template: TemplateSummary) => {
    duplicateTemplate(template.id);
    setTick((v) => v + 1);
  };

  const handleArchiveToggle = (id: string) => {
    const current = templates.find((t) => t.id === id);
    setTemplateLifecycle(id, current?.status === "archived" ? "draft" : "archived");
    setTick((v) => v + 1);
  };

  const handleActiveToggle = (id: string) => {
    const current = templates.find((t) => t.id === id);
    setTemplateLifecycle(id, current?.status === "active" ? "inactive" : "active");
    setTick((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin/campaigns" className="hover:text-gray-700">Campaigns</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Campaign Templates</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Templates</h1>
          <p className="text-sm text-gray-500">
            Admin-owned master templates businesses claim permission to use — you keep full
            ownership and control of every configuration.
          </p>
        </div>
        <Link
          to="/admin/campaigns/templates/new"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Template
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

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          />
        </div>
      </div>

      {/* Template List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No templates found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or create a new template.</p>
            <Link
              to="/admin/campaigns/templates/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Audience</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Campaigns Using</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((template) => {
                  const status = STATUS_BADGES[template.status];
                  const type = TYPE_META[template.campaignType];
                  const audience = AUDIENCE_META[template.audience];

                  return (
                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setViewing(template)}
                              className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate block text-left"
                            >
                              {template.name}
                            </button>
                            <p className="text-xs text-gray-400 truncate max-w-[260px]">{template.purpose}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${type.color}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${audience.color}`}>
                          {audience.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">{template.campaignsUsing}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            Created {fmtDate(template.createdAt)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-gray-400" />
                            Updated {fmtDate(template.updatedAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewing(template)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewing(template)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                            title="Preview as business"
                          >
                            <Monitor className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/campaigns/templates/${template.id}/edit`)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveToggle(template.id)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title={template.status === "archived" ? "Unarchive" : "Archive"}
                          >
                            {template.status === "archived" ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                          </button>
                          {template.status !== "archived" && (
                            <button
                              onClick={() => handleActiveToggle(template.id)}
                              className={`rounded-md px-2 py-1 text-xs font-medium ${
                                template.status === "active"
                                  ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={template.status === "active" ? "Deactivate" : "Activate"}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="text-center text-xs text-gray-400">
          Showing {filtered.length} of {templates.length} templates
        </div>
      )}

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewing(null)}
              className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 pr-8">{viewing.name}</h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGES[viewing.status].color}`}>
                    {STATUS_BADGES[viewing.status].label}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_META[viewing.campaignType].color}`}>
                    {TYPE_META[viewing.campaignType].label}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${AUDIENCE_META[viewing.audience].color}`}>
                    {AUDIENCE_META[viewing.audience].label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                    <Lock className="h-3 w-3" /> Master template · Admin owned
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-400 mb-1">Purpose</div>
                <p className="text-sm text-gray-700">{viewing.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Campaigns Using</div>
                  <div className="text-sm font-bold text-gray-900">{viewing.campaignsUsing}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Rewards Attached</div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    <Gift className="h-3.5 w-3.5 text-primary-500" />
                    {viewing.rewardsCount}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Date Created</div>
                  <div className="text-sm font-bold text-gray-900">{fmtDate(viewing.createdAt)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Last Updated</div>
                  <div className="text-sm font-bold text-gray-900">{fmtDate(viewing.updatedAt)}</div>
                </div>
              </div>
              {viewing.status === "draft" && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Draft template:</strong> businesses cannot see this template until it is activated.
                  </p>
                </div>
              )}
              {viewing.status === "inactive" && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs text-gray-600">
                    <strong>Inactive template:</strong> hidden from businesses, but all configuration is kept. Reactivate it to make it available again.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setPreviewing(viewing);
                  setViewing(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                <Monitor className="h-4 w-4" />
                Preview as Business
              </button>
              <button
                onClick={() => {
                  setViewing(null);
                  navigate(`/admin/campaigns/templates/${viewing.id}/edit`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <Pencil className="h-4 w-4" />
                Edit Template
              </button>
              <button
                onClick={() => setViewing(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Business Preview Modal — exactly what businesses see */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewing(null)}>
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewing(null)}
              className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 pr-8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-600">
                <Monitor className="h-3.5 w-3.5" />
                Business Campaign Centre preview
              </div>
              <h2 className="mt-1 text-lg font-bold text-gray-900">{previewing.name}</h2>
              <p className="text-xs text-gray-500">
                This is exactly how businesses see this template in their dashboard. Claiming grants
                permission to use this Admin-owned master template — never ownership.
              </p>
            </div>

            {previewTemplate ? (
              <BusinessTemplateCard t={previewTemplate} preview />
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">
                Template preview unavailable.
              </p>
            )}

            <button
              onClick={() => setPreviewing(null)}
              className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
