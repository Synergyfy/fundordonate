// =============================================================================
// Business — My Campaign Detail
// Live implementation for a claimed campaign instance:
//   - progress + business contribution + [Fund My Campaign] (Stripe / PayPal)
//   - Admin "Changes Required" feedback and resubmission
// =============================================================================

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, CircleAlert, Clock, Gift, PlayCircle, Sparkles,
  Target, Wallet, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  useCampaignDetail,
  useSaveCampaignAnswers,
  useSubmitCampaign,
} from "@/services/campaign/hook";
import { PaymentCheckoutModal } from "@/components/business/PaymentCheckoutModal";
import { DatePicker } from "@/components/ui/DatePicker";
import type { PaymentResult } from "@/services/payment";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export default function MyCampaignDetailPage() {
  const { campaignId } = useParams();
  const { data: campaign, isLoading, error, refetch } = useCampaignDetail(campaignId);
  const saveMutation = useSaveCampaignAnswers();
  const submitMutation = useSubmitCampaign();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resubmitted, setResubmitted] = useState(false);
  const [selfFundedSuccess, setSelfFundedSuccess] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-20 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600 mb-2" />
        <p className="font-semibold text-red-900">Campaign not found or failed to load.</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
          <Link
            to="/dashboard/campaign-centre"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to Campaign Centre
          </Link>
        </div>
      </div>
    );
  }

  const template = campaign.template;
  const status = resubmitted ? "PENDING_REVIEW" : campaign.status;
  const pct = campaign.target > 0 ? Math.min(100, Math.round((campaign.raised / campaign.target) * 100)) : 0;
  const changesOpen = (campaign.status === "CHANGES_REQUESTED" || campaign.status === "changes_requested") && !resubmitted;
  const allAnswered = campaign.changes.length === 0 || campaign.changes.every((c) => (answers[c.fieldId] ?? "").trim().length > 0);

  const handlePaymentSuccess = async (payment: PaymentResult) => {
    if (!campaignId) return;
    const amount = campaign?.template.selfFunding.amount || 10000;
    await refetch();
    setSelfFundedSuccess(`${fmt(amount)} contributed successfully via ${payment.gateway}!`);
  };

  const handleResubmit = async () => {
    if (!campaignId) return;
    const answerEntries = Object.entries(answers).map(([fieldId, value]) => ({ fieldId, value }));
    if (answerEntries.length > 0) {
      await saveMutation.mutateAsync({ campaignId, dto: { answers: answerEntries } });
    }
    await submitMutation.mutateAsync(campaignId);
    setResubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            <p className="text-sm text-gray-500">{template.name}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            status === "ACTIVE" ? "bg-green-100 text-green-700" :
            status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-800" :
            status === "CHANGES_REQUESTED" ? "bg-orange-100 text-orange-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Changes required notice */}
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
              const field = template.fields.find((f) => f.id === c.fieldId);
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
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    />
                  ) : field?.inputType === "date" ? (
                    <DatePicker
                      value={answers[c.fieldId] ?? ""}
                      onChange={(e) => setAnswers((p) => ({ ...p, [c.fieldId]: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <input
                      type={field?.inputType === "number" ? "number" : "text"}
                      value={answers[c.fieldId] ?? ""}
                      onChange={(e) => setAnswers((p) => ({ ...p, [c.fieldId]: e.target.value }))}
                      placeholder="Update your answer…"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={handleResubmit}
            disabled={!allAnswered || submitMutation.isPending}
            className="mt-4 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            {submitMutation.isPending ? "Resubmitting…" : "Resubmit for Review"}
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
            Your updates have been sent to the Admin team. You will be notified once reviewed.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-bold text-gray-900">Funding Progress</p>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900">{fmt(campaign.raised)}</span>
          <span className="text-gray-500">of {fmt(campaign.target)} target</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Target</p>
            <p className="text-sm font-bold text-gray-900">{fmt(campaign.target)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Raised</p>
            <p className="text-sm font-bold text-gray-900">{fmt(campaign.raised)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Your Self-Funding</p>
            <p className="text-sm font-bold text-gray-900">{fmt(campaign.businessContribution)}</p>
          </div>
        </div>
      </div>

      {/* Self-funding */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
          <Wallet className="h-4 w-4" /> Fund My Campaign
        </p>
        <p className="mt-1 text-sm text-orange-800">
          Fund your own campaign from your business account to kickstart momentum and unlock configured rewards.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {selfFundedSuccess ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700 border border-green-200">
              <CheckCircle2 className="h-4 w-4" /> {selfFundedSuccess}
            </span>
          ) : (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-xs"
            >
              <Gift className="h-4 w-4" />
              Fund {fmt(template.selfFunding.amount || 10000)}
            </button>
          )}
        </div>
        {campaign.rewardTriggered && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700 border border-green-200">
            <Sparkles className="h-4 w-4" /> Reward triggered: {campaign.rewardTriggered}
          </div>
        )}
      </div>

      <PaymentCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Fund My Campaign"
        amount={(template.selfFunding.amount || 10000) / 100}
        campaignId={campaignId}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
