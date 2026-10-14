// =============================================================================
// Campaign Templates — Admin
// Reusable campaign structures: browse, filter, and manage master templates.
// Live backend API connected.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight, Plus, Search, FileText, Copy, Archive, ArchiveRestore,
  Eye, Pencil, Gift,
} from "lucide-react";
import { adminApi, type AdminCampaignTemplate } from "@/services/admin";
import { formatDate } from "@/utils/formatters";

type TemplateStatus = "all" | "active" | "draft" | "archived";

export function CampaignTemplatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("status") as TemplateStatus) || "all";
  const [activeTab, setActiveTab] = useState<TemplateStatus>(initialTab);
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<AdminCampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTemplates();
      setTemplates(Array.isArray(data) ? data : (data as any)?.items || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeTab === "active" && !t.isActive) return false;
      if (activeTab === "draft" && t.isActive) return false;
      return true;
    });
  }, [templates, activeTab, search]);

  const handleTabChange = (tab: TemplateStatus) => {
    setActiveTab(tab);
    if (tab === "all") searchParams.delete("status");
    else searchParams.set("status", tab);
    setSearchParams(searchParams);
  };

  const handleToggleActive = async (template: AdminCampaignTemplate) => {
    try {
      await adminApi.updateTemplate(template.id, { isActive: !template.isActive });
      fetchTemplates();
    } catch (err) {
      console.error("Failed to update template:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Templates</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Templates</h1>
          <p className="text-sm text-gray-500">{templates.length} reusable campaign blueprints in system</p>
        </div>
        <Link
          to="/admin/campaigns/templates/new"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "all", label: "All Templates" },
          { id: "active", label: "Active" },
          { id: "draft", label: "Drafts" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TemplateStatus)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary-600 text-primary-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates by name..."
          className="input-field w-full pl-9"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-gray-400">Loading campaign templates...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
            No templates found.
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {t.category || "General"}
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {t.isActive ? "Active" : "Draft"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{t.name}</h3>
                {t.description && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{t.description}</p>}
              </div>

              <div className="border-t pt-3 mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Updated: {formatDate(t.updatedAt || t.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(t)}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <Link
                    to={`/admin/campaigns/templates/${t.id}/edit`}
                    className="font-medium text-gray-700 hover:text-gray-900"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
