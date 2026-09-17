// =============================================================================
// UK Hub — Admin Campaign Wizard
// Step-by-step campaign creation/editing form (mobile-first).
// Admin creates ALL campaigns; users donate/pledge to them.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/services/admin.service";
import { getSplitDestinations } from "@/data/ukHubData";
import {
  RewardManager,
  RewardFormData,
} from "@/components/campaign/RewardManager";

// ───────────────────── Types ─────────────────────

type RewardRow = RewardFormData;

interface FaqRow {
  id: string;
  question: string;
  answer: string;
}

interface CampaignFormData {
  // Step 1 — Basic Info
  title: string;
  shortDescription: string;
  description: string;
  mode: "donation" | "crowdfunding" | "fund" | "sponsor";
  categoryId: string;
  tags: string[];
  // Step 2 — Goal & Duration
  goalAmount: string;
  currency: string;
  deadline: string;
  platformFee: string;
  isEvergreen: boolean;
  // Step 3 — Media
  featuredImagePreview: string;
  videoUrl: string;
  // Step 4 — Location & Season
  locationSlug: string;
  locationId: string;
  hierarchyLevel: "" | "national" | "city" | "borough" | "high_street" | "business";
  season: "" | "spring" | "summer" | "autumn" | "winter" | "evergreen";
  // Step 5 — Campaign Type & Hierarchy
  campaignType: string;
  parentCampaignId: string;
  isOpportunity: boolean;
  // Step 6 — Self-Funding
  isSelfFunding: boolean;
  selfFundingLevel: "" | "bronze" | "silver" | "gold" | "platinum";
  ownerContribution: string;
  campaignTarget: string;
  // Step 7 — Frontend Display
  isFeatured: boolean;
  isVisible: boolean;
  backerTiersEnabled: boolean;
  recurringEnabled: boolean;
  participationTypes: string[];
  // Step 8 — Rewards
  rewards: RewardRow[];
  qualificationMode: "highest" | "cumulative";
  // Step 9 — Settings
  commentSettings: "everyone" | "backers" | "disabled";
  socialSharing: boolean;
  faqs: FaqRow[];
  status: string;
}

const INITIAL_FORM: CampaignFormData = {
  title: "", shortDescription: "", description: "",
  mode: "donation", categoryId: "", tags: [],
  goalAmount: "", currency: "GBP", deadline: "", platformFee: "0", isEvergreen: false,
  featuredImagePreview: "", videoUrl: "",
  locationSlug: "", locationId: "", hierarchyLevel: "", season: "",
  campaignType: "", parentCampaignId: "", isOpportunity: false,
  isSelfFunding: false, selfFundingLevel: "", ownerContribution: "", campaignTarget: "",
  isFeatured: false, isVisible: true, backerTiersEnabled: false, recurringEnabled: false,
  participationTypes: [],
  rewards: [],
  qualificationMode: "highest",
  commentSettings: "everyone", socialSharing: true, faqs: [], status: "draft",
};

const STEPS = [
  { id: 1, label: "Basic Info", icon: "📝" },
  { id: 2, label: "Goal & Duration", icon: "🎯" },
  { id: 3, label: "Media", icon: "🖼️" },
  { id: 4, label: "Location & Season", icon: "📍" },
  { id: 5, label: "Type & Hierarchy", icon: "🔗" },
  { id: 6, label: "Self-Funding", icon: "💼" },
  { id: 7, label: "Frontend Display", icon: "👁️" },
  { id: 8, label: "Rewards", icon: "🎁" },
  { id: 9, label: "Settings & Publish", icon: "⚙️" },
];

const MODES = [
  { value: "donation", label: "Donation", desc: "Direct donations, no reward tiers" },
  { value: "crowdfunding", label: "Crowdfunding", desc: "Reward-based with pledge tiers" },
  { value: "fund", label: "Fund", desc: "Goal-driven funding campaign" },
  { value: "sponsor", label: "Sponsor", desc: "Sponsorship / partnership campaign" },
] as const;

const SEASONS = [
  { value: "spring", label: "Spring", emoji: "🌸" },
  { value: "summer", label: "Summer", emoji: "☀️" },
  { value: "autumn", label: "Autumn", emoji: "🍂" },
  { value: "winter", label: "Winter", emoji: "❄️" },
  { value: "evergreen", label: "Evergreen", emoji: "🌿" },
] as const;

const SELF_FUNDING_LEVELS = [
  { value: "bronze", label: "Bronze", color: "bg-orange-100 text-orange-700" },
  { value: "silver", label: "Silver", color: "bg-gray-100 text-gray-700" },
  { value: "gold", label: "Gold", color: "bg-yellow-100 text-yellow-700" },
  { value: "platinum", label: "Platinum", color: "bg-purple-100 text-purple-700" },
] as const;

const PARTICIPATION_OPTIONS = ["donation", "fund", "sponsor"];

const HIERARCHY_LEVELS = [
  { value: "national", label: "National", icon: "🇬🇧", desc: "UK-wide programme campaign" },
  { value: "city", label: "City", icon: "🏙️", desc: "City activation campaign" },
  { value: "borough", label: "Borough / Local Area", icon: "🏘️", desc: "Borough or district campaign" },
  { value: "high_street", label: "High Street", icon: "🛒", desc: "High street business community" },
  { value: "business", label: "Business", icon: "🏢", desc: "Individual business campaign" },
] as const;

let faqCounter = 0;

// ───────────────────── Component ─────────────────────

interface AdminCampaignWizardProps {
  campaignId?: string;
  onClose?: () => void;
  onSaved?: () => void;
}

export function AdminCampaignWizard({ campaignId, onClose, onSaved }: AdminCampaignWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CampaignFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(!!campaignId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  const isEdit = !!campaignId;

  // Load existing campaign for editing
  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    adminApi.getCampaign(campaignId)
      .then((c: any) => {
        setForm({
          title: c.title || "",
          shortDescription: c.shortDescription || "",
          description: c.description || "",
          mode: c.mode || "donation",
          categoryId: c.categoryId || "",
          tags: c.tags?.map((t: any) => t.tag?.name || t.name) || [],
          goalAmount: c.goalAmount ? String(c.goalAmount / 100) : "",
          currency: c.currency || "GBP",
          deadline: (c.deadline as string) ? new Date(c.deadline as string).toISOString().split("T")[0] || "" : "",
          platformFee: c.platformFee ? String(c.platformFee / 100) : "0",
          isEvergreen: c.isEvergreen || false,
          featuredImagePreview: c.featuredImage || "",
          videoUrl: c.videoUrl || "",
          locationSlug: c.location || "",
          locationId: c.locationId || "",
          hierarchyLevel: (c.hierarchyLevel as any) || "",
          season: (c.season as any) || "",
          campaignType: typeof c.campaignType === "object" ? c.campaignType?.slug || "" : c.campaignType || "",
          parentCampaignId: c.parentId || "",
          isOpportunity: c.campaignType?.isOpportunity || false,
          isSelfFunding: c.isSelfFunding || false,
          selfFundingLevel: (c.selfFundingLevel as any) || "",
          ownerContribution: c.ownerContribution ? String(c.ownerContribution / 100) : "",
          campaignTarget: c.campaignTarget ? String(c.campaignTarget / 100) : "",
          isFeatured: c.isFeatured || false,
          isVisible: c.isVisible !== false,
          backerTiersEnabled: c.backerTiersEnabled || false,
          recurringEnabled: c.recurringEnabled || false,
          participationTypes: c.participationTypes ? JSON.parse(c.participationTypes) : [],
          rewards: c.rewards?.map((r: any) => ({
            id: r.id || `r-${Date.now()}`,
            title: r.title || "",
            description: r.description || "",
            order: r.order || 0,
            triggerType: r.triggerType || "contribution",
            triggerConfig: r.triggerConfig || { mode: "min", min: "", max: "", exact: "" },
            audience: (r.audience as any) || "both",
            quantityType: (r.quantityType as any) || "unlimited",
            quantityLimit: r.quantityLimit ? String(r.quantityLimit) : "",
            availableFrom: r.availableFrom ? new Date(r.availableFrom).toISOString().slice(0, 16) : "",
            availableUntil: r.availableUntil ? new Date(r.availableUntil).toISOString().slice(0, 16) : "",
            claimDeadlineDays: r.claimDeadlineDays ? String(r.claimDeadlineDays) : "30",
            fulfilmentType: r.fulfilmentType || "manual",
            fulfilmentConfig: r.fulfilmentConfig || { type: "manual", url: "", webhookUrl: "", instructions: "" },
            image: r.image || "",
            rewardType: r.rewardType || "standard",
            items: r.items?.map((ri: any) => ({
              id: ri.id || `item-${Date.now()}`,
              title: ri.title || "",
              description: ri.description || "",
              physicalType: (ri.physicalType as any) || "digital",
              assetType: ri.assetType || "",
              assetUrl: ri.assetUrl || "",
              assetFileName: ri.assetFileName || "",
              quantity: ri.quantity ? String(ri.quantity) : "1",
              order: ri.order || 0,
            })) || [],
          })) || [],
          qualificationMode: (c.qualificationMode as any) || "highest",
          commentSettings: (() => {
            try { return JSON.parse(c.settings || "{}").commentSettings || "everyone"; }
            catch { return "everyone"; }
          })(),
          socialSharing: (() => {
            try { return JSON.parse(c.settings || "{}").socialSharing !== false; }
            catch { return true; }
          })(),
          faqs: (() => {
            try {
              const s = JSON.parse(c.settings || "{}");
              return (s.faqs || []).map((f: any) => ({
                id: f.id || `faq-${Date.now()}`,
                question: f.question || f.q || "",
                answer: f.answer || f.a || "",
              }));
            } catch { return []; }
          })(),
          status: c.status || "draft",
        });
      })
      .catch(() => setError("Failed to load campaign"))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const patch = (updates: Partial<CampaignFormData>) => setForm(f => ({ ...f, ...updates }));

  const dest = useMemo(() => getSplitDestinations(), []);

  // ─── Validation per step ───
  const canNext = () => {
    switch (step) {
      case 1: return form.title.trim().length > 0;
      case 2: return form.goalAmount !== "" && Number(form.goalAmount) > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      case 8: return form.mode !== "crowdfunding" || form.rewards.length > 0;
      case 9: return true;
      default: return true;
    }
  };

  // ─── Save ───
  const handleSave = async (statusOverride?: string) => {
    setSaving(true);
    setError("");
    try {
      const goalPence = Math.round(Number(form.goalAmount) * 100);
      const feePct = Number(form.platformFee) || 0;
      const settings = JSON.stringify({
        commentSettings: form.commentSettings,
        socialSharing: form.socialSharing,
        faqs: form.faqs,
      });

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        mode: form.mode,
        goalAmount: goalPence,
        currency: form.currency,
        deadline: form.deadline || undefined,
        platformFee: feePct,
        categoryId: form.categoryId || undefined,
        tags: form.tags,
        videoUrl: form.videoUrl || undefined,
        location: form.locationSlug || undefined,
        locationId: form.locationId || undefined,
        hierarchyLevel: form.hierarchyLevel || undefined,
        season: form.season || undefined,
        isEvergreen: form.isEvergreen,
        isFeatured: form.isFeatured,
        isVisible: form.isVisible,
        backerTiersEnabled: form.backerTiersEnabled,
        recurringEnabled: form.recurringEnabled,
        participationTypes: JSON.stringify(form.participationTypes),
        isSelfFunding: form.isSelfFunding,
        selfFundingLevel: form.selfFundingLevel || undefined,
        ownerContribution: form.ownerContribution ? Math.round(Number(form.ownerContribution) * 100) : undefined,
        campaignTarget: form.campaignTarget ? Math.round(Number(form.campaignTarget) * 100) : undefined,
        parentId: form.parentCampaignId || undefined,
        campaignType: form.campaignType || undefined,
        isOpportunity: form.isOpportunity,
        settings,
        status: statusOverride || form.status,
        qualificationMode: form.qualificationMode,
        rewards: form.mode === "crowdfunding" ? form.rewards.map((r, i) => ({
          title: r.title,
          description: r.description,
          order: i,
          triggerType: r.triggerType,
          triggerConfig: {
            mode: r.triggerConfig.mode,
            min: r.triggerConfig.min ? Math.round(Number(r.triggerConfig.min) * 100) : undefined,
            max: r.triggerConfig.max ? Math.round(Number(r.triggerConfig.max) * 100) : undefined,
            exact: r.triggerConfig.exact ? Math.round(Number(r.triggerConfig.exact) * 100) : undefined,
          },
          audience: r.audience,
          quantityType: r.quantityType,
          quantityLimit: r.quantityType === "limited" ? Number(r.quantityLimit) || undefined : undefined,
          availableFrom: r.availableFrom || undefined,
          availableUntil: r.availableUntil || undefined,
          claimDeadlineDays: Number(r.claimDeadlineDays) || 30,
          fulfilmentType: r.fulfilmentType,
          fulfilmentConfig: r.fulfilmentConfig,
          image: r.image || undefined,
          rewardType: r.rewardType,
          items: r.items.map(item => ({
            title: item.title,
            description: item.description || undefined,
            physicalType: item.physicalType,
            assetType: item.assetType || undefined,
            assetUrl: item.assetUrl || undefined,
            assetFileName: item.assetFileName || undefined,
            quantity: Number(item.quantity) || 1,
            order: item.order,
          })),
        })) : [],
      };

      if (isEdit && campaignId) {
        await adminApi.updateCampaign(campaignId, payload);
      } else {
        await adminApi.createCampaign(payload);
      }
      onSaved?.();
      if (!onClose) navigate("/admin/campaigns");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v: string) => v ? `£${Number(v).toLocaleString("en-GB", { maximumFractionDigits: 0 })}` : "—";

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const hintCls = "text-xs text-gray-400 mt-1";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  // ───────────────────── Render ─────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose ? (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
            ) : (
              <button onClick={() => navigate("/admin/campaigns")} className="text-gray-400 hover:text-gray-600" aria-label="Back">←</button>
            )}
            <h1 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Campaign" : "Create Campaign"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Step {step}/{STEPS.length}</span>
          </div>
        </div>
        {/* Step progress bar */}
        <div className="mt-2 flex gap-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s.id < step ? "bg-primary-500" : s.id === step ? "bg-primary-300" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step label */}
      <div className="border-b border-gray-100 bg-white px-4 py-2">
        <span className="text-sm font-semibold text-gray-700">
          {STEPS[step - 1]?.icon} {STEPS[step - 1]?.label}
        </span>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step content */}
      <div className="mx-auto max-w-2xl px-4 py-6">

        {/* ══════════ STEP 1 — Basic Info ══════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Campaign Title <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={e => patch({ title: e.target.value })} placeholder="e.g. Manchester High Street Revival" maxLength={200} className={inputCls} />
              <p className={hintCls}>{form.title.length}/200</p>
            </div>
            <div>
              <label className={labelCls}>Short Description <span className="text-red-500">*</span></label>
              <textarea value={form.shortDescription} onChange={e => patch({ shortDescription: e.target.value })} placeholder="1-2 sentences that appear in campaign cards" rows={3} maxLength={500} className={`${inputCls} resize-none`} />
              <p className={hintCls}>{form.shortDescription.length}/500</p>
            </div>
            <div>
              <label className={labelCls}>Full Description</label>
              <textarea value={form.description} onChange={e => patch({ description: e.target.value })} placeholder="Tell the story — why are we raising funds? How will the money be used?" rows={8} className={`${inputCls} resize-y`} />
            </div>
            <div>
              <label className={labelCls}>Campaign Mode <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <button key={m.value} type="button" onClick={() => patch({ mode: m.value })}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${form.mode === m.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className="block text-sm font-bold text-gray-900">{m.label}</span>
                    <span className="text-xs text-gray-500">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.categoryId} onChange={e => patch({ categoryId: e.target.value })} className={inputCls}>
                <option value="">Select category</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="environment">Environment</option>
                <option value="community">Community</option>
                <option value="arts">Arts & Culture</option>
                <option value="technology">Technology</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (tagInput.trim() && !form.tags.includes(tagInput.trim())) { patch({ tags: [...form.tags, tagInput.trim()] }); setTagInput(""); } } }}
                  placeholder="Type a tag, press Enter" className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => { if (tagInput.trim() && !form.tags.includes(tagInput.trim())) { patch({ tags: [...form.tags, tagInput.trim()] }); setTagInput(""); } }} className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                      {t}
                      <button type="button" onClick={() => patch({ tags: form.tags.filter(x => x !== t) })} className="hover:text-primary-900">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ STEP 2 — Goal & Duration ══════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Funding Goal (£) <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.goalAmount} onChange={e => patch({ goalAmount: e.target.value })} placeholder="e.g. 12000" className={inputCls} />
              <p className={hintCls}>The target amount to raise. Set a realistic goal.</p>
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={form.currency} onChange={e => patch({ currency: e.target.value })} className={inputCls}>
                <option value="GBP">£ GBP (British Pound)</option>
                <option value="EUR">€ EUR (Euro)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Campaign Deadline</label>
              <input type="date" value={form.deadline} onChange={e => patch({ deadline: e.target.value })} className={inputCls} />
              <p className={hintCls}>Recommended 30-60 days. Leave empty for open-ended.</p>
            </div>
            <div>
              <label className={labelCls}>Platform Fee (%)</label>
              <input type="number" min="0" max="20" value={form.platformFee} onChange={e => patch({ platformFee: e.target.value })} className={inputCls} />
              <p className={hintCls}>Optional fee deducted from donations. 0% = no fee.</p>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input type="checkbox" checked={form.isEvergreen} onChange={e => patch({ isEvergreen: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div>
                <span className="text-sm font-medium text-gray-900">Evergreen campaign</span>
                <p className="text-xs text-gray-500">Runs indefinitely — no deadline. Just update the label when the season changes.</p>
              </div>
            </label>
            {form.goalAmount && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">Goal Summary</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Goal</span><span className="font-medium">{fmt(form.goalAmount)}</span></div>
                  {Number(form.platformFee) > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Fee ({form.platformFee}%)</span><span className="font-medium text-red-600">-{fmt(String(Math.round(Number(form.goalAmount) * Number(form.platformFee) / 100)))}</span></div>
                  )}
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-1"><span className="font-medium">Net to campaign</span><span className="font-bold text-green-600">{fmt(String(Math.round(Number(form.goalAmount) * (100 - Number(form.platformFee)) / 100)))}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ STEP 3 — Media ══════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Featured Image</label>
              {form.featuredImagePreview ? (
                <div className="relative inline-block w-full">
                  <img src={form.featuredImagePreview} alt="Featured" className="h-48 w-full rounded-lg object-cover" />
                  <button type="button" onClick={() => patch({ featuredImagePreview: "" })} className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700 text-xs">✕</button>
                </div>
              ) : (
                <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                  <span className="text-3xl text-gray-300">📷</span>
                  <span className="mt-2 text-sm text-gray-500">Click to upload image</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WebP up to 10MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const r = new FileReader(); r.onload = () => patch({ featuredImagePreview: r.result as string }); r.readAsDataURL(file); }
                  }} />
                </label>
              )}
            </div>
            <div>
              <label className={labelCls}>Campaign Video URL</label>
              <input type="url" value={form.videoUrl} onChange={e => patch({ videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
              <p className={hintCls}>YouTube or Vimeo URL (optional)</p>
            </div>
          </div>
        )}

        {/* ══════════ STEP 4 — Location & Season ══════════ */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Bind to Location</label>
              <select value={form.locationSlug} onChange={e => {
                const slug = e.target.value;
                // Auto-detect hierarchy level from location group
                const group = dest.cities.some(c => c.slug === slug) ? "city"
                  : dest.boroughs.some(b => b.slug === slug) ? "borough"
                  : dest.highStreets.some(h => h.slug === slug) ? "high_street"
                  : "";
                // Find the locationId from the destination data
                const cityMatch = dest.cities.find(c => c.slug === slug);
                const boroughMatch = dest.boroughs.find(b => b.slug === slug);
                const hsMatch = dest.highStreets.find(h => h.slug === slug);
                const locId = (cityMatch as any)?.id || (boroughMatch as any)?.id || (hsMatch as any)?.id || "";
                patch({ locationSlug: slug, locationId: locId, hierarchyLevel: group as any });
              }} className={inputCls}>
                <option value="">No location binding (shows everywhere)</option>
                <optgroup label="National">
                  <option value="united-kingdom">🇬🇧 United Kingdom (National)</option>
                </optgroup>
                <optgroup label="Cities">
                  {dest.cities.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </optgroup>
                <optgroup label="Boroughs">
                  {dest.boroughs.map(b => <option key={b.slug} value={b.slug}>{b.name} ({b.cityName})</option>)}
                </optgroup>
                <optgroup label="High Streets">
                  {dest.highStreets.map(h => <option key={h.slug} value={h.slug}>{h.name}</option>)}
                </optgroup>
              </select>
              <p className={hintCls}>Campaigns bound to a location appear on that city/borough/high-street hub page.</p>
            </div>

            {/* Hierarchy Level */}
            <div>
              <label className={labelCls}>Campaign Hierarchy Level</label>
              <div className="grid grid-cols-2 gap-2">
                {HIERARCHY_LEVELS.map(l => (
                  <button key={l.value} type="button" onClick={() => patch({ hierarchyLevel: l.value as any })}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${form.hierarchyLevel === l.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className="block text-lg">{l.icon}</span>
                    <span className="block text-sm font-bold text-gray-900">{l.label}</span>
                    <span className="text-xs text-gray-500">{l.desc}</span>
                  </button>
                ))}
              </div>
              <p className={hintCls}>Determines where this campaign sits in the hierarchy. Auto-detected from location above.</p>
            </div>

            {/* Hierarchy Info Panel */}
            {form.hierarchyLevel && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-800">
                  {HIERARCHY_LEVELS.find(l => l.value === form.hierarchyLevel)?.icon}{" "}
                  This is a <span className="uppercase">{form.hierarchyLevel.replace("_", " ")}</span> campaign
                  {form.locationSlug && (
                    <> for <span className="font-bold">{dest.cities.find(c => c.slug === form.locationSlug)?.name || dest.boroughs.find(b => b.slug === form.locationSlug)?.name || dest.highStreets.find(h => h.slug === form.locationSlug)?.name || form.locationSlug}</span></>
                  )}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {form.hierarchyLevel === "national" && "This campaign supports the wider UK programme and appears on the National Hub."}
                  {form.hierarchyLevel === "city" && "When this campaign reaches its target, the city can progress to local area activation."}
                  {form.hierarchyLevel === "borough" && "This campaign activates a specific borough or local area within a city."}
                  {form.hierarchyLevel === "high_street" && "This campaign supports businesses and community on a specific high street."}
                  {form.hierarchyLevel === "business" && "This is an individual business campaign connected to its high street."}
                </p>
              </div>
            )}

            <div>
              <label className={labelCls}>Seasonal Tag</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => patch({ season: form.season === "" ? "" : "" })}
                  className={`rounded-lg border-2 p-2 text-center text-sm font-medium transition-all ${form.season === "" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                  None
                </button>
                {SEASONS.map(s => (
                  <button key={s.value} type="button" onClick={() => patch({ season: s.value })}
                    className={`rounded-lg border-2 p-2 text-center text-sm font-medium transition-all ${form.season === s.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
              <p className={hintCls}>Tag campaigns by season so they appear in seasonal sections on the homepage.</p>
            </div>
          </div>
        )}

        {/* ══════════ STEP 5 — Type & Hierarchy ══════════ */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Campaign Type</label>
              <select value={form.campaignType} onChange={e => patch({ campaignType: e.target.value })} className={inputCls}>
                <option value="">No specific type</option>
                <option value="community_hub">Community Hub</option>
                <option value="high_street">High Street</option>
                <option value="borough">Borough</option>
                <option value="city">City</option>
                <option value="business">Business</option>
                <option value="consumer">Consumer</option>
                <option value="seasonal">Seasonal</option>
                <option value="evergreen">Evergreen</option>
                <option value="opportunity">Opportunity</option>
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input type="checkbox" checked={form.isOpportunity} onChange={e => patch({ isOpportunity: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div>
                <span className="text-sm font-medium text-gray-900">Is an Opportunity</span>
                <p className="text-xs text-gray-500">Marks this as an opportunity campaign (appears in opportunity listings).</p>
              </div>
            </label>
            <div>
              <label className={labelCls}>Parent Campaign</label>
              <input type="text" value={form.parentCampaignId} onChange={e => patch({ parentCampaignId: e.target.value })} placeholder="Paste parent campaign ID (optional)" className={inputCls} />
              <p className={hintCls}>Link this campaign as a child of another campaign (hierarchy).</p>
            </div>
          </div>
        )}

        {/* ══════════ STEP 6 — Self-Funding ══════════ */}
        {step === 6 && (
          <div className="space-y-5">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input type="checkbox" checked={form.isSelfFunding} onChange={e => patch({ isSelfFunding: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div>
                <span className="text-sm font-medium text-gray-900">Enable Self-Funding</span>
                <p className="text-xs text-gray-500">The business owner funds part/all of this campaign from their own wallet.</p>
              </div>
            </label>
            {form.isSelfFunding && (
              <>
                <div>
                  <label className={labelCls}>Self-Funding Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SELF_FUNDING_LEVELS.map(l => (
                      <button key={l.value} type="button" onClick={() => patch({ selfFundingLevel: l.value as any })}
                        className={`rounded-lg border-2 p-3 text-center text-sm font-bold transition-all ${form.selfFundingLevel === l.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className={l.color + " rounded-full px-2 py-0.5 text-xs"}>{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Owner Contribution (£)</label>
                  <input type="number" min="0" value={form.ownerContribution} onChange={e => patch({ ownerContribution: e.target.value })} placeholder="e.g. 5000" className={inputCls} />
                  <p className={hintCls}>How much the owner is personally contributing.</p>
                </div>
                <div>
                  <label className={labelCls}>Campaign Target (£)</label>
                  <input type="number" min="0" value={form.campaignTarget} onChange={e => patch({ campaignTarget: e.target.value })} placeholder="e.g. 12000" className={inputCls} />
                  <p className={hintCls}>Total annual funding target (e.g. £12,000 for a full-year membership).</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ STEP 7 — Frontend Display ══════════ */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
              {[
                { key: "isFeatured", label: "Featured / Promoted", desc: "Appears on homepage hero and featured section" },
                { key: "isVisible", label: "Visible on Listings", desc: "Show in public campaign listings (uncheck to hide)" },
                { key: "backerTiersEnabled", label: "Backer Tiers", desc: "Enable backer tier badges for this campaign" },
                { key: "recurringEnabled", label: "Recurring Donations", desc: "Allow monthly/weekly recurring contributions" },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3">
                  <input type="checkbox" checked={form[item.key as keyof CampaignFormData] as boolean}
                    onChange={e => patch({ [item.key]: e.target.checked } as any)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className={labelCls}>Participation Types</label>
              <div className="flex flex-wrap gap-2">
                {PARTICIPATION_OPTIONS.map(p => (
                  <label key={p} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${form.participationTypes.includes(p) ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    <input type="checkbox" checked={form.participationTypes.includes(p)}
                      onChange={e => {
                        if (e.target.checked) patch({ participationTypes: [...form.participationTypes, p] });
                        else patch({ participationTypes: form.participationTypes.filter(x => x !== p) });
                      }}
                      className="sr-only" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </label>
                ))}
              </div>
              <p className={hintCls}>What types of participation this campaign accepts.</p>
            </div>
          </div>
        )}

        {/* ══════════ STEP 8 — Rewards ══════════ */}
        {step === 8 && (
          <div className="space-y-5">
            {form.mode !== "crowdfunding" ? (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <span className="text-3xl">🎁</span>
                <p className="mt-2 text-sm text-gray-600">Rewards are only available for <strong>Crowdfunding</strong> campaigns.</p>
                <p className="text-xs text-gray-400 mt-1">Current mode: {form.mode}. Go back to Step 1 to change mode.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Define trigger-based rewards. IF a participant qualifies → THEN they earn the reward.
                </p>
                <RewardManager
                  rewards={form.rewards}
                  onChangeRewards={rewards => patch({ rewards })}
                  qualificationMode={form.qualificationMode}
                  onChangeQualificationMode={mode => patch({ qualificationMode: mode })}
                />
              </>
            )}
          </div>
        )}

        {/* ══════════ STEP 9 — Settings & Publish ══════════ */}
        {step === 9 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Comment Settings</label>
              <div className="space-y-2">
                {[
                  { value: "everyone", label: "Everyone", desc: "Any visitor can comment" },
                  { value: "backers", label: "Backers Only", desc: "Only donors/pledgers" },
                  { value: "disabled", label: "Disabled", desc: "Turn off comments" },
                ].map(o => (
                  <label key={o.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.commentSettings === o.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="commentSettings" value={o.value} checked={form.commentSettings === o.value} onChange={() => patch({ commentSettings: o.value as any })} className="text-primary-600 focus:ring-primary-500" />
                    <div><span className="text-sm font-medium text-gray-900">{o.label}</span><p className="text-xs text-gray-500">{o.desc}</p></div>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input type="checkbox" checked={form.socialSharing} onChange={e => patch({ socialSharing: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div><span className="text-sm font-medium text-gray-900">Social Sharing</span><p className="text-xs text-gray-500">Show share buttons on the campaign page</p></div>
            </label>

            {/* FAQs */}
            <div>
              <label className={labelCls}>FAQs</label>
              <div className="space-y-3">
                {form.faqs.map((f, i) => (
                  <div key={f.id} className="rounded-lg border bg-gray-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">FAQ {i + 1}</span>
                      <button type="button" onClick={() => patch({ faqs: form.faqs.filter(x => x.id !== f.id) })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                     <input value={f.question} onChange={e => { const ff = [...form.faqs]; ff[i] = { id: f.id, question: e.target.value, answer: f.answer }; patch({ faqs: ff }); }} placeholder="Question" className={inputCls} />
                     <textarea value={f.answer} onChange={e => { const ff = [...form.faqs]; ff[i] = { id: f.id, question: f.question, answer: e.target.value }; patch({ faqs: ff }); }} placeholder="Answer" rows={2} className={`${inputCls} resize-none`} />
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newFaqQ} onChange={e => setNewFaqQ(e.target.value)} placeholder="New question" className={`${inputCls} flex-1`} />
                  <input value={newFaqA} onChange={e => setNewFaqA(e.target.value)} placeholder="Answer" className={`${inputCls} flex-1`} />
                  <button type="button" onClick={() => {
                    if (newFaqQ.trim() && newFaqA.trim()) {
                      faqCounter++;
                      patch({ faqs: [...form.faqs, { id: `faq-${faqCounter}-${Date.now()}`, question: newFaqQ.trim(), answer: newFaqA.trim() }] });
                      setNewFaqQ(""); setNewFaqA("");
                    }
                  }} className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Add</button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => patch({ status: e.target.value })} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p className={hintCls}>Set to "Published" or "Active" to make the campaign live.</p>
            </div>

            {/* Review summary */}
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <p className="text-sm font-bold text-gray-900">Campaign Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Title:</span> <span className="font-medium">{form.title || "—"}</span></div>
                <div><span className="text-gray-500">Mode:</span> <span className="font-medium capitalize">{form.mode}</span></div>
                <div><span className="text-gray-500">Goal:</span> <span className="font-medium">{fmt(form.goalAmount)}</span></div>
                <div><span className="text-gray-500">Deadline:</span> <span className="font-medium">{form.deadline || "Open-ended"}</span></div>
                <div><span className="text-gray-500">Hierarchy:</span> <span className="font-medium">{form.hierarchyLevel ? HIERARCHY_LEVELS.find(l => l.value === form.hierarchyLevel)?.icon + " " + HIERARCHY_LEVELS.find(l => l.value === form.hierarchyLevel)?.label : "None"}</span></div>
                <div><span className="text-gray-500">Location:</span> <span className="font-medium">{form.locationSlug || "None"}</span></div>
                <div><span className="text-gray-500">Season:</span> <span className="font-medium capitalize">{form.season || "None"}</span></div>
                <div><span className="text-gray-500">Featured:</span> <span className="font-medium">{form.isFeatured ? "Yes" : "No"}</span></div>
                <div><span className="text-gray-500">Visible:</span> <span className="font-medium">{form.isVisible ? "Yes" : "No"}</span></div>
                <div><span className="text-gray-500">Self-Funding:</span> <span className="font-medium">{form.isSelfFunding ? form.selfFundingLevel || "Yes" : "No"}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{form.status.replace(/_/g, " ")}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar — mobile-first */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length ? (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40">
              Next
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => handleSave()} disabled={saving}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40">
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Campaign"}
              </button>
              {!isEdit && (
                <button type="button" onClick={() => handleSave("active")} disabled={saving}
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40">
                  {saving ? "Saving..." : "Create & Publish"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
