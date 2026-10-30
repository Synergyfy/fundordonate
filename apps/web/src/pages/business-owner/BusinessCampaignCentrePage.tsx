// =============================================================================
// Business Campaign Centre
// Live implementation of the Business Dashboard campaign template
// claim & setup flow entry point, wired to live backend API.
// =============================================================================

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck, Gift, KeyRound, Sparkles, Target, Wallet, AlertCircle, Trash2,
} from "lucide-react";
import {
  useBusinessTemplates,
  useClaimTemplate,
  useBusinessCampaigns,
  useDeleteCampaign,
} from "@/services/campaign/hook";
import { useBusinessAuditStatus } from "@/services/audit/hook";
import { BusinessTemplateCard } from "@/components/business/BusinessTemplateCard";
import { BusinessAuditCard } from "@/components/business/BusinessAuditCard";
import { PaymentCheckoutModal } from "@/components/business/PaymentCheckoutModal";
import { FeatureGate } from "@/components/plans/FeatureGate";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type Tab = "available" | "locked" | "campaigns";

const PREP_STEPS = [
  "Checking your eligibility",
  "Loading your campaign template",
  "Retrieving Public Pre-Audit & business profile",
  "Connecting your location & programme",
  "Attaching rewards & internal assets",
  "Identifying missing information",
];

const TABS: { id: Tab; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "locked", label: "Locked" },
  { id: "campaigns", label: "My Campaigns" },
];

export default function BusinessCampaignCentrePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("available");

  // Live queries
  const { data: templates = [], isLoading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useBusinessTemplates();
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useBusinessCampaigns();
  const claimMutation = useClaimTemplate();
  const deleteMutation = useDeleteCampaign();
  const { data: auditStatus } = useBusinessAuditStatus();
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  const campaigns = campaignsData?.items || [];

  /**
   * Send a business to 247GBS Audit when a locked template only needs its
   * pre-audit: sign in via Central Hub if not linked, otherwise open the
   * pre-audit flow.
   */
  const handleCompleteRequirement = (template: any) => {
    const unmet: any[] = (template?.requirements ?? []).filter((r: any) => !r.met);
    const auditReq = unmet.find((r) => r.action === "audit" || r.id === "pre_audit");
    if (!auditReq) return;
    const links = auditStatus?.deepLinks;
    if (!links) return;
    const url = auditStatus?.linkStatus === "NOT_LINKED" ? links.signIn : links.preAudit;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const [preparing, setPreparing] = useState<{ templateId: string; step: number } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [checkoutCampaignId, setCheckoutCampaignId] = useState<string | null>(null);

  const handleDeleteDraft = async (campaign: { id: string; title: string }) => {
    if (!window.confirm(`Delete the draft campaign "${campaign.title}"? This cannot be undone.`)) {
      return;
    }
    setClaimError(null);
    setDeleteBusyId(campaign.id);
    try {
      await deleteMutation.mutateAsync(campaign.id);
      await refetchCampaigns();
    } catch (err: any) {
      setClaimError(
        err?.response?.data?.message || err?.message || "Could not delete this draft campaign",
      );
    } finally {
      setDeleteBusyId(null);
    }
  };

  const available = templates.filter((t) => t.status === "available");
  const locked = templates.filter((t) => t.status === "locked");

  // Step-by-step preparation animation before claiming via backend mutation
  useEffect(() => {
    if (!preparing) return;
    if (preparing.step >= PREP_STEPS.length) {
      const id = preparing.templateId;
      const t = templates.find((x) => x.id === id);
      const timer = setTimeout(async () => {
        try {
          const result = await claimMutation.mutateAsync(id);
          navigate(
            `/dashboard/campaign-setup/${id}?campaign=${result.campaignId}&source=${t?.origin ?? "direct"}`
          );
        } catch (err: any) {
          setClaimError(err?.response?.data?.message || err?.message || "Failed to claim template");
          setPreparing(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => setPreparing((p) => (p ? { ...p, step: p.step + 1 } : p)),
      600
    );
    return () => clearTimeout(timer);
  }, [preparing, navigate, templates, claimMutation]);

  const checkoutCampaign = checkoutCampaignId
    ? (campaigns.find((c) => c.id === checkoutCampaignId) ?? null)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Centre</h1>
          <p className="text-sm text-gray-500">
            Claim an approved campaign template and set it up — the campaign is prepared for you, never started blank.
          </p>
        </div>
        <Link
          to="/dashboard/campaigns"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
        >
          All My Campaigns
        </Link>
      </div>

      {/* Two distinct contributions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-bold text-blue-900">A · Unlock / Eligibility</p>
          </div>
          <p className="mt-1 text-sm text-blue-800">
            Some templates require a membership tier, a minimum amount already raised through
            FundOrDonate, a completed pre-audit, or an Admin assigning the template to your
            business before you can claim them. This is separate from funding your own campaign.
          </p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-bold text-orange-900">B · Fund My Campaign</p>
          </div>
          <p className="mt-1 text-sm text-orange-800">
            Once your campaign exists you can fund it yourself. If the template configures it, your reward
            triggers automatically.
          </p>
        </div>
      </div>

      {/* 247GBS Audit status (source of truth for pre-audit templates) */}
      <BusinessAuditCard />

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
            {t.id === "available" && ` (${available.length})`}
            {t.id === "locked" && ` (${locked.length})`}
            {t.id === "campaigns" && ` (${campaigns.length})`}
          </button>
        ))}
      </div>

      {/* Errors */}
      {(claimError || templatesError || campaignsError) && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-semibold text-red-700">
              {claimError || "Error communicating with the Campaign Centre backend."}
            </p>
          </div>
          <button
            onClick={() => {
              setClaimError(null);
              refetchTemplates();
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {(templatesLoading || campaignsLoading) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {/* Tab: Campaigns */}
      {!templatesLoading && !campaignsLoading && tab === "campaigns" && (
        <div className="space-y-4">
          {/* Self-funding summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Wallet className="h-4 w-4 text-orange-500" /> Self-Funding
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Fund your own campaign from your business account. Rewards trigger automatically when the
                  template is configured for it.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {campaigns
                  .filter((c) => c.status === "ACTIVE" || c.status === "active")
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {c.title} · self-contributed {fmt(c.businessContribution)}
                      </span>
                      <button
                        onClick={() => setCheckoutCampaignId(c.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        Fund My Campaign
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-10 text-center">
              <Target className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">No campaigns launched yet.</p>
              <button onClick={() => setTab("available")} className="mt-3 text-sm font-semibold text-primary-700">
                Claim an available template →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {campaigns.map((c) => {
                const isDraft = String(c.status).toUpperCase() === "DRAFT";
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Link
                      to={`/dashboard/my-campaigns/${c.id}`}
                      className="block"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-bold text-gray-900">{c.title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.status === "ACTIVE" || c.status === "active"
                              ? "bg-green-100 text-green-700"
                              : c.status === "CHANGES_REQUESTED" || c.status === "changes_requested"
                              ? "bg-orange-100 text-orange-700"
                              : c.status === "PENDING_REVIEW" || c.status === "pending_review"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Target</p>
                          <p className="text-sm font-bold text-gray-900">{fmt(c.target)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Raised</p>
                          <p className="text-sm font-bold text-gray-900">{fmt(c.raised)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Yours</p>
                          <p className="text-sm font-bold text-gray-900">{fmt(c.businessContribution)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" /> Updated {c.createdAt.split("T")[0]}
                        </span>
                        {c.rewardTriggered && (
                          <span className="flex items-center gap-1 font-semibold text-green-700">
                            <Sparkles className="h-3 w-3" /> {c.rewardTriggered} triggered
                          </span>
                        )}
                      </div>
                    </Link>

                    {isDraft && (
                      <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          onClick={() => void handleDeleteDraft(c)}
                          disabled={deleteBusyId === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deleteBusyId === c.id ? "Deleting…" : "Delete draft"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Available / Locked Templates */}
      {!templatesLoading && !campaignsLoading && tab !== "campaigns" && (
        <FeatureGate feature="campaign.creation" label="Campaign creation">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(tab === "available" ? available : locked).map((t) => (
            <BusinessTemplateCard
              key={t.id}
              t={t as any}
              claiming={preparing?.templateId === t.id}
              onClaim={() => setPreparing({ templateId: t.id, step: 0 })}
              onCompleteRequirement={() => handleCompleteRequirement(t)}
            />
          ))}
          {(tab === "available" ? available : locked).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed bg-white p-10 text-center">
              <BadgeCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">
                {tab === "available" ? "No templates available right now." : "Nothing locked — every template is open to you."}
              </p>
              {tab === "locked" && (
                <button onClick={() => setTab("available")} className="mt-3 text-sm font-semibold text-primary-700">
                  View available templates →
                </button>
              )}
            </div>
          )}
        </div>
        </FeatureGate>
      )}

      {/* Preparing Your Campaign overlay */}
      {preparing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Preparing Your Campaign</h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              FundOrDonate is setting up your campaign from the approved template and your existing data.
            </p>
            <ul className="space-y-2.5">
              {PREP_STEPS.map((s, i) => {
                const done = preparing.step > i;
                const current = preparing.step === i;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? "bg-green-100 text-green-700" : current ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm ${done || current ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
                    {current && <span className="ml-auto text-xs font-medium text-primary-600">Working…</span>}
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(preparing.step / PREP_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <PaymentCheckoutModal
        open={checkoutCampaign !== null}
        onClose={() => setCheckoutCampaignId(null)}
        title="Fund My Campaign"
        amount={100}
        campaignId={checkoutCampaign?.id}
        onSuccess={async () => {
          await refetchCampaigns();
          setCheckoutCampaignId(null);
        }}
      />
    </div>
  );
}
