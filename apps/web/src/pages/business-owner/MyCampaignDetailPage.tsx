// =============================================================================
// Business — My Campaign Detail
// Frontend-only sub-page for a claimed campaign:
//   - progress + business contribution + [Fund My Campaign] (Stripe / PayPal)
//   - Admin "Changes Required" → only the requested fields are reopened,
//     resubmission returns the campaign to Pending Review.
// =============================================================================

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, CircleAlert, Clock, Gift, PlayCircle, Sparkles,
  Target, Wallet,
} from "lucide-react";
import {
  CAMPAIGN_STATUS_META, BUSINESS_IDENTITY, formatGbp,
} from "@/data/businessCampaignAccess";
import {
  contributeToCampaign,
  getBusinessTemplate,
  getCampaignInstance,
  resubmitCampaign,
} from "@/data/campaignTemplateStore";
import {
  gatewayName,
  type PaymentGateway,
} from "@/components/business/PaymentGatewaySelector";
import { PaymentCheckoutModal } from "@/components/business/PaymentCheckoutModal";
import type { PaymentResult } from "@/services/payment.service";
import { DatePicker } from "@/components/ui/DatePicker";

export default function MyCampaignDetailPage() {
  const { campaignId } = useParams();
  const campaign = getCampaignInstance(campaignId);
  const template = getBusinessTemplate(campaign?.templateId);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [contributed, setContributed] = useState(campaign?.businessContribution ?? 0);
  const [reward, setReward] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitted, setResubmitted] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>("stripe");

  if (!campaign) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        <p className="font-semibold text-gray-900">Campaign not found.</p>
        <Link to="/dashboard/campaign-centre" className="mt-3 inline-block text-sm font-semibold text-primary-700">
          ← Back to Campaign Centre
        </Link>
      </div>
    );
  }

  const status = resubmitted && campaign.status === "changes_requested" ? "pending_review" : campaign.status;
  const meta = CAMPAIGN_STATUS_META[status];
  const pct = campaign.target > 0 ? Math.min(100, Math.round((campaign.raised / campaign.target) * 100)) : 0;
  const changesOpen = campaign.status === "changes_requested" && !resubmitted;
  const allAnswered = campaign.changes.every((c) => (answers[c.fieldId] ?? "").trim().length > 0);

  const handlePaymentSuccess = (payment: PaymentResult) => {
    const amount = template?.selfFunding.amount ?? 100;
    const rewardName = template?.selfFunding.rewardName ?? "E-Gift Card";
    if (campaignId) contributeToCampaign(campaignId, amount, rewardName);
    setContributed((v) => v + amount);
    setReward(rewardName);
    setGateway(payment.gateway);
  };

  const handleResubmit = () => {
    setResubmitting(true);
    setTimeout(() => {
      if (campaignId) resubmitCampaign(campaignId, answers);
      setResubmitting(false);
      setResubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/dashboard/campaign-centre"
          className="flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <ArrowLeft className="h-4 w-4" /> Campaign Centre
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <p className="text-sm text-gray-500">
              {template?.name} · {BUSINESS_IDENTITY.name}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.color}`}>{meta.label}</span>
        </div>
      </div>

      {/* Changes required */}
      {changesOpen && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
            <CircleAlert className="h-4 w-4" /> Changes Required — Admin feedback
          </p>
          <p className="mt-1 text-sm text-orange-800">
            Only the requested fields have been reopened. Everything else stays locked.
          </p>
          <div className="mt-4 space-y-3">
            {campaign.changes.map((c) => {
              const field = template?.fields.find((f) => f.id === c.fieldId);
              return (
                <div key={c.fieldId} className="rounded-lg border bg-white p-4">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                    {c.label}
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                      REQUESTED CHANGE
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{c.note}</p>
                  {field?.question && <p className="mt-2 text-xs font-medium text-gray-600">{field.question}</p>}
                  {field?.inputType === "textarea" ? (
                    <textarea
                      rows={2}
                      value={answers[c.fieldId] ?? ""}
                      onChange={(e) => setAnswers((p) => ({ ...p, [c.fieldId]: e.target.value }))}
                      placeholder="Update your answer…"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : field?.inputType === "date" ? (
                    <DatePicker
                      value={answers[c.fieldId] ?? ""}
                      onChange={(e) => setAnswers((p) => ({ ...p, [c.fieldId]: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <input
                      type={field?.inputType === "number" ? "number" : "text"}
                      value={answers[c.fieldId] ?? ""}
                      onChange={(e) => setAnswers((p) => ({ ...p, [c.fieldId]: e.target.value }))}
                      placeholder="Update your answer…"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={handleResubmit}
            disabled={!allAnswered || resubmitting}
            className="mt-4 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            {resubmitting ? "Resubmitting…" : "Resubmit for Review"}
          </button>
          {!allAnswered && (
            <p className="mt-2 text-xs text-orange-800">Answer every requested field to resubmit.</p>
          )}
        </div>
      )}

      {resubmitted && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
            <Clock className="h-4 w-4" /> Resubmitted — Pending Review
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Your updates are with the Admin. You will be notified once a decision is made.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-bold text-gray-900">Progress</p>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900">{formatGbp(campaign.raised)}</span>
          <span className="text-gray-500">of {formatGbp(campaign.target)} target</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Target</p>
            <p className="text-sm font-bold text-gray-900">{formatGbp(campaign.target)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Raised</p>
            <p className="text-sm font-bold text-gray-900">{formatGbp(campaign.raised)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Business Contribution</p>
            <p className="text-sm font-bold text-gray-900">{formatGbp(contributed)}</p>
          </div>
        </div>
      </div>

      {/* Self-funding */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
          <Wallet className="h-4 w-4" /> Fund My Campaign
        </p>
        <p className="mt-1 text-sm text-orange-800">
          This is Contribution B — it funds your own campaign and is separate from any unlock / eligibility
          contribution.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {contributed > (campaign.businessContribution ?? 0) ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" /> {formatGbp(contributed)} funded via {gatewayName(gateway)}
            </span>
          ) : (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <Gift className="h-4 w-4" />
              Fund {formatGbp(template?.selfFunding.amount ?? 100)}
            </button>
          )}
        </div>
        {reward && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700">
            <Sparkles className="h-4 w-4" /> Reward triggered: {reward}
          </div>
        )}
      </div>

      <PaymentCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Fund My Campaign"
        amount={template?.selfFunding.amount ?? 100}
        campaignId={campaignId}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
