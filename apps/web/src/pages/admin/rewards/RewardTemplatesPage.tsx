// =============================================================================
// Admin — Reward Templates Management
// Manage preconfigured reward structures for quick campaign setup.
// =============================================================================

import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Copy, Trash2, Award, Star, Gift, Tag, BarChart3, Search } from "lucide-react";

interface TemplateItem {
  title: string;
  description: string;
  physicalType: string;
  assetType: string;
}

interface RewardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  audience: string;
  rewardType: string;
  triggerMode: string;
  triggerMin: number;
  triggerMax?: number;
  fulfilmentType: string;
  itemsCount: number;
  usageCount: number;
}

const DEMO_TEMPLATES: RewardTemplate[] = [
  {
    id: "tpl-1",
    name: "Standard Backer Reward",
    description: "A standard reward for campaign backers with minimum contribution trigger",
    category: "backer",
    audience: "both",
    rewardType: "standard",
    triggerMode: "min",
    triggerMin: 10,
    fulfilmentType: "manual",
    itemsCount: 1,
    usageCount: 24,
  },
  {
    id: "tpl-2",
    name: "Founding Member Reward",
    description: "Exclusive reward for founding members with special recognition",
    category: "founding_member",
    audience: "both",
    rewardType: "standard",
    triggerMode: "min",
    triggerMin: 100,
    fulfilmentType: "internal",
    itemsCount: 3,
    usageCount: 12,
  },
  {
    id: "tpl-3",
    name: "E-Card Thank You",
    description: "Digital e-card sent as a thank you for contributions",
    category: "donation",
    audience: "consumer",
    rewardType: "ecard",
    triggerMode: "min",
    triggerMin: 5,
    fulfilmentType: "external_link",
    itemsCount: 1,
    usageCount: 45,
  },
  {
    id: "tpl-4",
    name: "Cashback Reward",
    description: "Percentage cashback on contribution amount",
    category: "custom",
    audience: "business",
    rewardType: "cashback",
    triggerMode: "range",
    triggerMin: 50,
    triggerMax: 500,
    fulfilmentType: "internal",
    itemsCount: 1,
    usageCount: 8,
  },
  {
    id: "tpl-5",
    name: "Loyalty Points Pack",
    description: "Award loyalty points based on contribution level",
    category: "custom",
    audience: "both",
    rewardType: "points",
    triggerMode: "min",
    triggerMin: 25,
    fulfilmentType: "webhook",
    itemsCount: 2,
    usageCount: 18,
  },
  {
    id: "tpl-6",
    name: "Sponsor Recognition",
    description: "Public recognition for sponsors of campaigns",
    category: "sponsorship",
    audience: "business",
    rewardType: "standard",
    triggerMode: "min",
    triggerMin: 250,
    fulfilmentType: "manual",
    itemsCount: 2,
    usageCount: 6,
  },
];

const CATEGORY_OPTIONS = [
  { value: "backer", label: "Backer" },
  { value: "founding_member", label: "Founding Member" },
  { value: "donation", label: "Donation" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "custom", label: "Custom" },
];

const AUDIENCE_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "consumer", label: "Consumer" },
  { value: "both", label: "Both" },
];

const REWARD_TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "ecard", label: "E-Card" },
  { value: "cashback", label: "Cashback" },
  { value: "points", label: "Points" },
  { value: "discount", label: "Discount" },
];

const TRIGGER_MODE_OPTIONS = [
  { value: "min", label: "Min" },
  { value: "range", label: "Range" },
  { value: "exact", label: "Exact" },
];

const FULFILMENT_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "internal", label: "Internal" },
  { value: "external_link", label: "External Link" },
  { value: "webhook", label: "Webhook" },
];

const CATEGORY_COLORS: Record<string, string> = {
  backer: "bg-blue-100 text-blue-700",
  founding_member: "bg-purple-100 text-purple-700",
  donation: "bg-green-100 text-green-700",
  sponsorship: "bg-amber-100 text-amber-700",
  custom: "bg-gray-100 text-gray-700",
};

const REWARD_TYPE_ICONS: Record<string, typeof Award> = {
  standard: Award,
  ecard: Gift,
  cashback: BarChart3,
  points: Star,
  discount: Tag,
};

function getDefaultForm() {
  return {
    name: "",
    description: "",
    category: "backer",
    audience: "both",
    rewardType: "standard",
    triggerMode: "min",
    triggerMin: "",
    triggerMax: "",
    fulfilmentType: "manual",
    items: [{ title: "", description: "", physicalType: "digital", assetType: "image" }] as TemplateItem[],
  };
}

export function RewardTemplatesPage() {
  const [templates, setTemplates] = useState<RewardTemplate[]>(DEMO_TEMPLATES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(getDefaultForm());

  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(getDefaultForm());
    setShowModal(true);
  };

  const handleOpenEdit = (template: RewardTemplate) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      description: template.description,
      category: template.category,
      audience: template.audience,
      rewardType: template.rewardType,
      triggerMode: template.triggerMode,
      triggerMin: String(template.triggerMin),
      triggerMax: template.triggerMax ? String(template.triggerMax) : "",
      fulfilmentType: template.fulfilmentType,
      items: [{ title: "", description: "", physicalType: "digital", assetType: "image" }],
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) return;

    if (editingId) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                name: form.name,
                description: form.description,
                category: form.category,
                audience: form.audience,
                rewardType: form.rewardType,
                triggerMode: form.triggerMode,
                triggerMin: Number(form.triggerMin) || 0,
                triggerMax: form.triggerMax ? Number(form.triggerMax) : undefined,
                fulfilmentType: form.fulfilmentType,
                itemsCount: form.items.length,
              }
            : t
        )
      );
    } else {
      const newTemplate: RewardTemplate = {
        id: `tpl-${Date.now()}`,
        name: form.name,
        description: form.description,
        category: form.category,
        audience: form.audience,
        rewardType: form.rewardType,
        triggerMode: form.triggerMode,
        triggerMin: Number(form.triggerMin) || 0,
        triggerMax: form.triggerMax ? Number(form.triggerMax) : undefined,
        fulfilmentType: form.fulfilmentType,
        itemsCount: form.items.length,
        usageCount: 0,
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    }

    setShowModal(false);
    setForm(getDefaultForm());
    setEditingId(null);
  };

  const handleDuplicate = (template: RewardTemplate) => {
    const duplicate: RewardTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
    };
    setTemplates((prev) => [duplicate, ...prev]);
  };

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUseTemplate = (template: RewardTemplate) => {
    alert(`Using template "${template.name}" — would navigate to campaign creation with this template preloaded.`);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { title: "", description: "", physicalType: "digital", assetType: "image" }],
    }));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reward Templates</h1>
              <p className="mt-1 text-gray-600">Preconfigured reward structures for quick campaign setup</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                categoryFilter === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All ({templates.length})
            </button>
            {CATEGORY_OPTIONS.map((cat) => {
              const count = templates.filter((t) => t.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    categoryFilter === cat.value ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const Icon = REWARD_TYPE_ICONS[template.rewardType] || Award;
            const categoryColor = CATEGORY_COLORS[template.category] || "bg-gray-100 text-gray-700";

            return (
              <div
                key={template.id}
                className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{template.name}</h3>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${categoryColor}`}>
                        {CATEGORY_OPTIONS.find((c) => c.value === template.category)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{template.description}</p>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-[10px] text-gray-500">Trigger</div>
                    <div className="text-xs font-bold text-gray-900">
                      {template.triggerMode === "range"
                        ? `£${template.triggerMin}-£${template.triggerMax}`
                        : `${template.triggerMode === "min" ? ">=" : "="}£${template.triggerMin}`}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-[10px] text-gray-500">Items</div>
                    <div className="text-xs font-bold text-gray-900">{template.itemsCount}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-[10px] text-gray-500">Used</div>
                    <div className="text-xs font-bold text-gray-900">{template.usageCount}×</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
                    {REWARD_TYPE_OPTIONS.find((r) => r.value === template.rewardType)?.label}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700">
                    {AUDIENCE_OPTIONS.find((a) => a.value === template.audience)?.label}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                    {FULFILMENT_OPTIONS.find((f) => f.value === template.fulfilmentType)?.label}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"
                  >
                    <Gift className="h-3 w-3" />
                    Use Template
                  </button>
                  <button
                    onClick={() => handleOpenEdit(template)}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    title="Duplicate"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No templates found.</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create your first template
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editingId ? "Edit Template" : "Create New Template"}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Standard Backer Reward"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Describe what this template provides..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>

                {/* Category / Audience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Audience</label>
                    <select
                      value={form.audience}
                      onChange={(e) => setForm({ ...form, audience: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reward Type / Trigger Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Reward Type</label>
                    <select
                      value={form.rewardType}
                      onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      {REWARD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Trigger Mode</label>
                    <select
                      value={form.triggerMode}
                      onChange={(e) => setForm({ ...form, triggerMode: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      {TRIGGER_MODE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trigger Amounts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {form.triggerMode === "exact" ? "Exact Amount (£)" : "Min Amount (£)"}
                    </label>
                    <input
                      type="number"
                      value={form.triggerMin}
                      onChange={(e) => setForm({ ...form, triggerMin: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  {form.triggerMode === "range" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (£)</label>
                      <input
                        type="number"
                        value={form.triggerMax}
                        onChange={(e) => setForm({ ...form, triggerMax: e.target.value })}
                        placeholder="500"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Fulfilment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Fulfilment Type</label>
                  <select
                    value={form.fulfilmentType}
                    onChange={(e) => setForm({ ...form, fulfilmentType: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {FULFILMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Template Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Template Items</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="h-3 w-3" />
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(idx, "title", e.target.value)}
                          placeholder="Item title"
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="Item description"
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={item.physicalType}
                            onChange={(e) => updateItem(idx, "physicalType", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                          >
                            <option value="digital">Digital</option>
                            <option value="physical">Physical</option>
                            <option value="service">Service</option>
                          </select>
                          <select
                            value={item.assetType}
                            onChange={(e) => updateItem(idx, "assetType", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="pdf">PDF</option>
                            <option value="link">Link</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm(getDefaultForm());
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
                >
                  {editingId ? "Save Changes" : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
