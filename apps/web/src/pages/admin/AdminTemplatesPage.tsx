// =============================================================================
// Admin — Campaign Templates Management
// Create, manage, and instantiate campaign templates.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { templateApi, type CampaignTemplate } from "@/services/template.service";
import { ArrowLeft, Plus, Copy, Archive, Clock, Users, Target } from "lucide-react";

const TEMPLATE_TYPES = [
  { value: "city_activation", label: "City Activation", icon: "🏙️", color: "blue" },
  { value: "borough_launch", label: "Borough Launch", icon: "🏘️", color: "green" },
  { value: "high_street_drive", label: "High Street Drive", icon: "🛒", color: "purple" },
  { value: "founder_recruitment", label: "Founder Recruitment", icon: "⭐", color: "amber" },
  { value: "seasonal", label: "Seasonal", icon: "🎄", color: "red" },
  { value: "national_initiative", label: "National Initiative", icon: "🇬🇧", color: "indigo" },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    type: "city_activation",
    title: "",
    description: "",
    mode: "fund",
    goalAmount: "",
    deadlineDays: "",
  });

  useEffect(() => {
    templateApi.getTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all"
    ? templates
    : templates.filter((t) => t.type === filter);

  const handleCreate = async () => {
    if (!newTemplate.title) {
      alert("Please enter a template title");
      return;
    }

    const created = await templateApi.createTemplate({
      ...newTemplate,
      goalAmount: Number(newTemplate.goalAmount) || 1000000,
      deadlineDays: Number(newTemplate.deadlineDays) || 30,
    } as any);

    if (created) {
      setTemplates([created, ...templates]);
      setShowCreateModal(false);
      setNewTemplate({ type: "city_activation", title: "", description: "", mode: "fund", goalAmount: "", deadlineDays: "" });
      alert("Template created!");
    }
  };

  const handleArchive = async (templateId: string) => {
    await templateApi.archiveTemplate(templateId);
    setTemplates(templates.map((t) => t.id === templateId ? { ...t, status: "ARCHIVED" } : t));
    alert("Template archived");
  };

  const handleInstantiate = async (template: CampaignTemplate) => {
    // In production, would show a modal to select location
    alert(`Instantiate "${template.title}" — Select a location to create a campaign instance`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaign Templates</h1>
              <p className="mt-1 text-gray-600">Create and manage templates for instantiating campaigns across locations.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New Template
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            All ({templates.length})
          </button>
          {TEMPLATE_TYPES.map((type) => {
            const count = templates.filter((t) => t.type === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === type.value ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {type.icon} {type.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const typeMeta = TEMPLATE_TYPES.find((t) => t.value === template.type);
            return (
              <div key={template.id} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeMeta?.icon || "📋"}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{template.title}</h3>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[template.status] || "bg-gray-100 text-gray-700"}`}>
                        {template.status}
                      </span>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{template.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <Target className="h-4 w-4 text-gray-400 mx-auto" />
                    <div className="text-xs font-bold text-gray-900">£{(template.goalAmount / 1000000).toFixed(1)}M</div>
                    <div className="text-[10px] text-gray-500">Goal</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <Clock className="h-4 w-4 text-gray-400 mx-auto" />
                    <div className="text-xs font-bold text-gray-900">{template.deadlineDays}d</div>
                    <div className="text-[10px] text-gray-500">Duration</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <Users className="h-4 w-4 text-gray-400 mx-auto" />
                    <div className="text-xs font-bold text-gray-900">{template.instantiatedCount}</div>
                    <div className="text-[10px] text-gray-500">Instances</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleInstantiate(template)}
                    disabled={template.status !== "ACTIVE"}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-3 w-3" />
                    Instantiate
                  </button>
                  <button
                    onClick={() => handleArchive(template.id)}
                    disabled={template.status === "ARCHIVED"}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Archive className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No templates found.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create your first template
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Template</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                  <select
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    placeholder="e.g. City Activation Campaign"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goal Amount (£)</label>
                    <input
                      type="number"
                      value={newTemplate.goalAmount}
                      onChange={(e) => setNewTemplate({ ...newTemplate, goalAmount: e.target.value })}
                      placeholder="100000"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={newTemplate.deadlineDays}
                      onChange={(e) => setNewTemplate({ ...newTemplate, deadlineDays: e.target.value })}
                      placeholder="30"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
