// =============================================================================
// Campaign Templates — Admin
// Reusable campaign structures: browse, filter, activate, duplicate, instantiate.
// Live backend API connected.
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight, Plus, Search, FileText, Copy, Play, X, Loader2, ShieldCheck,
} from "lucide-react";
import { adminApi, type AdminCampaignTemplate, type AdminLocation, type InstantiateSkipReason } from "@/services/admin";
import { formatDate } from "@/utils/formatters";

type TemplateTab = "all" | "active" | "draft";

/** Human labels for the eligibility rule ids stored in `config.access.eligibility`. */
const ELIGIBILITY_LABELS: Record<string, string> = {
  business_account: "Verified business account",
  pre_audit: "247GBS Audit pre-audit completed",
  membership_active: "Active membership",
  package_tier: "Purchased package tier",
  min_contribution: "Minimum platform contribution",
  admin_approval: "Admin review after claiming",
};

function accessConfigOf(t: AdminCampaignTemplate): {
  eligibility: string[];
  allowAssignmentOverride: boolean;
  minContribution?: string;
} {
  const access = (t?.config?.access ?? {}) as {
    eligibility?: string[];
    allowAssignmentOverride?: boolean;
    minContribution?: string;
  };
  return {
    eligibility: Array.isArray(access.eligibility) ? access.eligibility : [],
    allowAssignmentOverride: access.allowAssignmentOverride === true,
    minContribution: access.minContribution,
  };
}

const STATUS_META: Record<
  AdminCampaignTemplate["status"],
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-700" },
  INACTIVE: { label: "Inactive", className: "bg-amber-100 text-amber-700" },
  ARCHIVED: { label: "Archived", className: "bg-gray-100 text-gray-400" },
};

export function CampaignTemplatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("status") as TemplateTab) || "all";
  const [activeTab, setActiveTab] = useState<TemplateTab>(initialTab);
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<AdminCampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Instantiate modal state
  const [instantiateTarget, setInstantiateTarget] = useState<AdminCampaignTemplate | null>(null);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [instLocationId, setInstLocationId] = useState("");
  const [instBusinessIds, setInstBusinessIds] = useState("");
  const [instAmountGbp, setInstAmountGbp] = useState("50000");
  const [instDeadline, setInstDeadline] = useState("60");
  const [instForce, setInstForce] = useState(false);
  const [instSkipped, setInstSkipped] = useState<InstantiateSkipReason[]>([]);
  const [instBusy, setInstBusy] = useState(false);
  const [instMessage, setInstMessage] = useState<string | null>(null);
  const [instError, setInstError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!instantiateTarget) return;
    let cancelled = false;
    adminApi
      .getLocations({ limit: 100 })
      .then((res) => {
        if (!cancelled) setLocations(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [instantiateTarget]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeTab === "active" && t.status !== "ACTIVE") return false;
      if (activeTab === "draft" && t.status !== "DRAFT") return false;
      return true;
    });
  }, [templates, activeTab, search]);

  const handleTabChange = (tab: TemplateTab) => {
    setActiveTab(tab);
    if (tab === "all") searchParams.delete("status");
    else searchParams.set("status", tab);
    setSearchParams(searchParams);
  };

  const handleToggleStatus = async (template: AdminCampaignTemplate) => {
    const next = template.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(template.id);
    try {
      await adminApi.updateTemplateStatus(template.id, next);
      await fetchTemplates();
    } catch (err) {
      console.error("Failed to update template status:", err);
      alert((err as any)?.message ?? "Failed to update template status");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (template: AdminCampaignTemplate) => {
    setBusyId(template.id);
    try {
      await adminApi.duplicateTemplate(template.id);
      await fetchTemplates();
    } catch (err) {
      console.error("Failed to duplicate template:", err);
      alert((err as any)?.message ?? "Failed to duplicate template");
    } finally {
      setBusyId(null);
    }
  };

  const openInstantiate = (template: AdminCampaignTemplate) => {
    setInstantiateTarget(template);
    setInstLocationId("");
    setInstBusinessIds("");
    setInstAmountGbp("50000");
    setInstDeadline("60");
    setInstForce(false);
    setInstSkipped([]);
    setInstMessage(null);
    setInstError(null);
  };

  const submitInstantiate = async () => {
    if (!instantiateTarget) return;
    const businessIds = instBusinessIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!instLocationId && businessIds.length === 0) {
      setInstError("Select a hub location or enter at least one business ID.");
      return;
    }

    setInstBusy(true);
    setInstError(null);
    setInstMessage(null);
    setInstSkipped([]);

    try {
      const res = await adminApi.instantiateTemplate(instantiateTarget.id, {
        locationId: instLocationId || undefined,
        businessIds: businessIds.length ? businessIds : undefined,
        targetAmount: instAmountGbp ? Math.round(Number(instAmountGbp) * 100) : undefined,
        deadlineDays: instDeadline ? Number(instDeadline) : undefined,
        force: instForce || undefined,
      });

      const skipped = res.skipped ? `, ${res.skipped} skipped` : "";
      setInstMessage(
        res.message ?? `${res.count} campaign${res.count === 1 ? "" : "s"} created${skipped}.`,
      );
      setInstSkipped(res.skippedReasons ?? []);
      await fetchTemplates();
    } catch (err: any) {
      setInstError(err?.message ?? "Failed to instantiate template");
    } finally {
      setInstBusy(false);
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
            onClick={() => handleTabChange(tab.id as TemplateTab)}
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
          filtered.map((t) => {
            const statusMeta = STATUS_META[t.status] ?? STATUS_META.DRAFT;
            const isBusy = busyId === t.id;
            return (
              <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t.category || "General"}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{t.name}</h3>
                  {t.tagline && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{t.tagline}</p>}
                  <p className="text-xs text-gray-400">
                    {t.instantiatedCount ?? 0} campaign{(t.instantiatedCount ?? 0) === 1 ? "" : "s"} · v{t.version ?? 1}
                  </p>
                </div>

                <div className="border-t pt-3 mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>Updated: {formatDate(t.updatedAt || t.createdAt)}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(t)}
                      disabled={isBusy}
                      className="font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      {t.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDuplicate(t)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      title="Duplicate template"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                    <button
                      onClick={() => openInstantiate(t)}
                      disabled={t.status !== "ACTIVE"}
                      className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900 disabled:opacity-40"
                      title={t.status !== "ACTIVE" ? "Activate the template to instantiate" : "Instantiate"}
                    >
                      <Play className="h-3.5 w-3.5" /> Instantiate
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
            );
          })
        )}
      </div>

      {/* Instantiate modal */}
      {instantiateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Instantiate template</h2>
                <p className="mt-0.5 text-sm text-gray-500">{instantiateTarget.name}</p>
              </div>
              <button
                onClick={() => setInstantiateTarget(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hub location
                </label>
                <select
                  value={instLocationId}
                  onChange={(e) => setInstLocationId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">— None —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Instantiates a campaign draft for every business in this location.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Or specific business IDs <span className="text-gray-400">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={instBusinessIds}
                  onChange={(e) => setInstBusinessIds(e.target.value)}
                  placeholder="business-uuid-1, business-uuid-2"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Target (£)</label>
                  <input
                    type="number"
                    min={0}
                    value={instAmountGbp}
                    onChange={(e) => setInstAmountGbp(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={instDeadline}
                    onChange={(e) => setInstDeadline(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {(() => {
                const access = accessConfigOf(instantiateTarget);
                if (access.eligibility.length === 0) return null;
                return (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                      Eligibility enforced on assignment
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {access.eligibility.map((rule) => (
                        <li key={rule} className="text-xs text-gray-600">
                          · {ELIGIBILITY_LABELS[rule] ?? rule}
                          {rule === "min_contribution" && access.minContribution
                            ? ` (£${access.minContribution})`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    {access.allowAssignmentOverride ? (
                      <label className="mt-2.5 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        <input
                          type="checkbox"
                          checked={instForce}
                          onChange={(e) => setInstForce(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          <strong>Force assign</strong> — override eligibility and create campaigns for
                          ineligible businesses too.
                        </span>
                      </label>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Ineligible businesses are skipped. This template does not allow override.
                      </p>
                    )}
                  </div>
                );
              })()}

              {instError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                  {instError}
                </p>
              )}
              {instMessage && (
                <p className="rounded-lg border border-green-200 bg-green-50 p-2.5 text-sm text-green-700">
                  {instMessage}
                </p>
              )}
              {instSkipped.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                  <p className="text-xs font-semibold text-amber-800">
                    {instSkipped.length} business{instSkipped.length === 1 ? "" : "es"} skipped
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {instSkipped.map((s) => (
                      <li key={s.businessId} className="text-[11px] text-amber-800">
                        <strong>{s.businessName ?? s.businessId}</strong>: {s.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setInstantiateTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={submitInstantiate}
                disabled={instBusy}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {instBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Instantiate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
