// =============================================================================
// Business Campaign Centre
// Frontend-only implementation of the Business Dashboard campaign template
// claim & setup flow entry point.
//   - Available templates  → [Claim Campaign] → "Preparing Your Campaign"
//   - Locked templates     → requirement checklist + [Complete Requirement]
//   - My Campaigns         → status cards + self-funding contribution panel
// Business never starts from a blank form: claim hands off to the
// template-driven setup wizard, not to the generic campaign builder.
// Claiming grants permission to use an Admin-owned master template — it never
// transfers ownership of the template.
// =============================================================================

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck, Clock, Gift, KeyRound, Sparkles, Target, Wallet,
} from "lucide-react";
import {
  formatGbp, type BusinessTemplate, type MyCampaign,
} from "@/data/businessCampaignAccess";
import {
  claimTemplate,
  completeRequirement,
  contributeToCampaign,
  getBusinessTemplate,
  getBusinessTemplates,
  getMyCampaigns,
} from "@/data/campaignTemplateStore";
import { BusinessTemplateCard } from "@/components/business/BusinessTemplateCard";
import { PaymentCheckoutModal } from "@/components/business/PaymentCheckoutModal";

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
  const [templates, setTemplates] = useState<BusinessTemplate[]>(() => getBusinessTemplates());
  const [campaigns, setCampaigns] = useState<MyCampaign[]>(() => getMyCampaigns());

  const [preparing, setPreparing] = useState<{ templateId: string; step: number } | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [checkoutCampaignId, setCheckoutCampaignId] = useState<string | null>(null);

  const available = templates.filter((t) => t.status === "available");
  const locked = templates.filter((t) => t.status === "locked");

  // Claim → "Preparing Your Campaign" ticking checklist → claim in the store
  // → setup wizard (permission to use the Admin-owned master template).
  useEffect(() => {
    if (!preparing) return;
    if (preparing.step >= PREP_STEPS.length) {
      const id = preparing.templateId;
      const t = templates.find((x) => x.id === id);
      const timer = setTimeout(() => {
        const result = claimTemplate(id);
        if (result.ok) {
          navigate(
            `/dashboard/campaign-setup/${id}?campaign=${result.campaignId}&source=${t?.origin ?? "direct"}`
          );
        } else {
          setClaimError(result.reason);
          setPreparing(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => setPreparing((p) => (p ? { ...p, step: p.step + 1 } : p)),
      700
    );
    return () => clearTimeout(timer);
  }, [preparing, navigate, templates]);

  const handleCompleteRequirement = (templateId: string) => {
    setUnlocking(templateId);
    setClaimError(null);
    setTimeout(() => {
      const template = getBusinessTemplates().find((t) => t.id === templateId);
      const unmet = template?.requirements.find((r) => !r.met);
      if (unmet) completeRequirement(unmet.id);
      setTemplates(getBusinessTemplates());
      setUnlocking(null);
    }, 900);
  };

  const checkoutCampaign = checkoutCampaignId
    ? (campaigns.find((c) => c.id === checkoutCampaignId) ?? null)
    : null;

  const TemplateCard = ({ t }: { t: BusinessTemplate }) => {
    const isClaiming = preparing?.templateId === t.id;
    return (
      <BusinessTemplateCard
        t={t}
        claiming={isClaiming}
        unlocking={unlocking === t.id}
        onClaim={() => setPreparing({ templateId: t.id, step: 0 })}
        onCompleteRequirement={() => handleCompleteRequirement(t.id)}
      />
    );
  };

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
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
            One £100 contribution may be required to unlock a template or confirm eligibility. It is separate from
            contributing to your campaign.
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

      {claimError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">{claimError}</p>
          <button
            onClick={() => setClaimError(null)}
            className="text-xs font-semibold text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {tab === "campaigns" ? (
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
                  .filter((c) => c.status === "active" || c.status === "approved")
                  .map((c) => {
                    const amount =
                      getBusinessTemplate(c.templateId)?.selfFunding.amount ?? 100;
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {c.title} · contributed {formatGbp(c.businessContribution)}
                        </span>
                        <button
                          onClick={() => setCheckoutCampaignId(c.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                        >
                          <Gift className="h-3.5 w-3.5" />
                          Fund {formatGbp(amount)}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                to={`/dashboard/my-campaigns/${c.id}`}
                className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-bold text-gray-900">{c.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "active"
                        ? "bg-green-100 text-green-700"
                        : c.status === "changes_requested"
                        ? "bg-orange-100 text-orange-700"
                        : c.status === "pending_review"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.status === "changes_requested"
                      ? "CHANGES REQUIRED"
                      : c.status === "pending_review"
                      ? "PENDING REVIEW"
                      : c.status.toUpperCase()}
                  </span>
                </div>

                {c.status === "changes_requested" && (
                  <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-800">
                      <Clock className="h-3.5 w-3.5" /> Admin requested {c.changes.length} change
                      {c.changes.length > 1 ? "s" : ""}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-orange-700">
                      {c.changes.map((ch) => (
                        <li key={ch.fieldId}>{ch.label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Target</p>
                    <p className="text-sm font-bold text-gray-900">{formatGbp(c.target)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Raised</p>
                    <p className="text-sm font-bold text-gray-900">{formatGbp(c.raised)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Yours</p>
                    <p className="text-sm font-bold text-gray-900">{formatGbp(c.businessContribution)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" /> Updated {c.updatedAt}
                  </span>
                  {c.rewardTriggered && (
                    <span className="flex items-center gap-1 font-semibold text-green-700">
                      <Sparkles className="h-3 w-3" /> {c.rewardTriggered} triggered
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(tab === "available" ? available : locked).map((t) => (
            <TemplateCard key={t.id} t={t} />
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
        amount={
          checkoutCampaign
            ? getBusinessTemplate(checkoutCampaign.templateId)?.selfFunding.amount ?? 100
            : 0
        }
        campaignId={checkoutCampaign?.id}
        onSuccess={() => {
          if (!checkoutCampaign) return;
          const amount =
            getBusinessTemplate(checkoutCampaign.templateId)?.selfFunding.amount ?? 100;
          contributeToCampaign(checkoutCampaign.id, amount, "£5 E-Gift Card");
          setCampaigns(getMyCampaigns());
        }}
      />
    </div>
  );
}
