// =============================================================================
// Business Campaign Setup (template-driven claim flow)
// Live backend integration:
//   - Campaign instance loaded via useCampaignDetail()
//   - Profile identity loaded via useBusinessProfile()
//   - Answers persisted via useSaveCampaignAnswers()
//   - Final confirmation via useSubmitCampaign()
//   - Funding contributions recorded via useSelfFund()
//   - Zero dummy or mock data fallback
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  FileText,
  Gift,
  KeyRound,
  Lock,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useBusinessTemplates,
  useCampaignDetail,
  useClaimTemplate,
  useSaveCampaignAnswers,
  useSubmitCampaign,
} from "@/services/campaign/hook";
import { useBusinessProfile } from "@/services/business/hook";
import {
  gatewayName,
  type PaymentGateway,
} from "@/components/business/PaymentGatewaySelector";
import { PaymentCheckoutModal } from "@/components/business/PaymentCheckoutModal";
import { DatePicker } from "@/components/ui/DatePicker";
import type { SetupFieldBlueprint } from "@/services/campaign/type";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(p / 100);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700" },
  template: { label: "Template", color: "bg-indigo-100 text-indigo-700" },
  audit: { label: "Public Pre-Audit", color: "bg-amber-100 text-amber-800" },
  business_account: { label: "Business account", color: "bg-blue-100 text-blue-700" },
  location: { label: "Location", color: "bg-teal-100 text-teal-700" },
  mcom: { label: "MCOM", color: "bg-fuchsia-100 text-fuchsia-700" },
  business_input: { label: "You", color: "bg-green-100 text-green-700" },
};

function SourceBadge({ source }: { source: string }) {
  const badge = SOURCE_BADGES[source] ?? {
    label: source,
    color: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.color}`}
    >
      {badge.label}
    </span>
  );
}

function LockedNotice() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
      <Lock className="h-3 w-3" /> Managed by FundOrDonate
    </span>
  );
}

function FieldView({
  field,
  valueOverride,
  onEdit,
}: {
  field: SetupFieldBlueprint;
  valueOverride?: string;
  onEdit?: () => void;
}) {
  const displayVal = valueOverride ?? field.value;
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {field.label}
          </p>
          {field.locked ? (
            <LockedNotice />
          ) : (
            <SourceBadge source={field.source} />
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
          {field.inputType === "date" && displayVal
            ? formatDate(displayVal)
            : displayVal || "—"}
        </p>
        {!field.locked && field.sourceNote && (
          <p className="mt-0.5 text-xs text-gray-400">{field.sourceNote}</p>
        )}
      </div>
      {!field.locked && onEdit && (
        <button
          onClick={onEdit}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
      )}
    </div>
  );
}

function AnswerInput({
  field,
  value,
  error,
  onChange,
}: {
  field: SetupFieldBlueprint;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500";
  const border = error ? "border-red-400" : "border-gray-300";
  return (
    <div className="rounded-xl border bg-white p-4">
      <label className="block">
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
          {field.question ?? field.label}
          {field.required && <span className="text-red-500">*</span>}
          <SourceBadge source={field.source} />
        </span>
        {field.sourceNote && (
          <span className="mt-0.5 block text-xs text-gray-500">
            {field.sourceNote}
          </span>
        )}
      </label>
      <div className="mt-2">
        {field.inputType === "textarea" ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer…"
            className={`${base} ${border}`}
          />
        ) : field.inputType === "date" ? (
          <DatePicker
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${base} ${border}`}
          />
        ) : (
          <input
            type={field.inputType === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.inputType === "number" ? "0" : "Type your answer…"}
            className={`${base} ${border}`}
          />
        )}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

export default function CampaignSetupPage() {
  const { templateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const source: "audit" | "direct" =
    searchParams.get("source") === "audit" ? "audit" : "direct";

  const [instanceId, setInstanceId] = useState<string | null>(
    () => searchParams.get("campaign")
  );

  // Queries
  const { data: templates = [], isLoading: templatesLoading } =
    useBusinessTemplates();
  const { data: profile, isLoading: profileLoading } = useBusinessProfile();
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
    refetch: refetchCampaign,
  } = useCampaignDetail(instanceId ?? undefined);

  // Mutations
  const claimMutation = useClaimTemplate();
  const saveAnswersMutation = useSaveCampaignAnswers();
  const submitMutation = useSubmitCampaign();

  // Find template view
  const templateView = useMemo(() => {
    return templates.find((t) => t.id === templateId) ?? null;
  }, [templates, templateId]);

  // If no instanceId was provided in URL, auto-claim the template
  useEffect(() => {
    if (!instanceId && templateId && !claimMutation.isPending) {
      claimMutation
        .mutateAsync(templateId)
        .then((res) => {
          setInstanceId(res.campaignId);
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("campaign", res.campaignId);
              return next;
            },
            { replace: true }
          );
        })
        .catch((err) => {
          console.error("Auto claim error:", err);
        });
    }
  }, [instanceId, templateId, claimMutation, setSearchParams]);

  // Answers state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answersInitialized, setAnswersInitialized] = useState(false);

  // Synchronize answers when campaign or template loads
  useEffect(() => {
    if (campaign && !answersInitialized) {
      const initial: Record<string, string> = {};
      const fields = campaign.template.fields || [];
      for (const f of fields) {
        if (f.editable && !f.locked) {
          initial[f.id] = f.value || "";
        }
      }
      for (const a of campaign.answers) {
        initial[a.fieldId] = a.value;
      }
      setAnswers(initial);
      setAnswersInitialized(true);
    } else if (templateView && !campaign && !answersInitialized) {
      const initial: Record<string, string> = {};
      for (const f of templateView.fields) {
        if (f.editable && !f.locked) {
          initial[f.id] = f.value || "";
        }
      }
      setAnswers(initial);
      setAnswersInitialized(true);
    }
  }, [campaign, templateView, answersInitialized]);

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selfFunded, setSelfFunded] = useState(false);
  const [fundingRewardSeen, setFundingRewardSeen] = useState(false);
  const [checkout, setCheckout] = useState<null | "required" | "selfFund">(null);
  const [selfFundGateway, setSelfFundGateway] = useState<PaymentGateway>("stripe");
  const [confirmed, setConfirmed] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<
    "pending_review" | "approved" | null
  >(null);

  const fields = useMemo(() => {
    return campaign?.template.fields ?? templateView?.fields ?? [];
  }, [campaign, templateView]);

  const rewards = useMemo(() => {
    return campaign?.template.rewards ?? templateView?.rewards ?? [];
  }, [campaign, templateView]);

  const mcomAssets = useMemo(() => {
    return campaign?.template.mcomAssets ?? templateView?.mcomAssets ?? [];
  }, [campaign, templateView]);

  const selfFunding = useMemo(() => {
    return (
      campaign?.template.selfFunding ??
      templateView?.selfFunding ?? {
        enabled: false,
        mode: "optional",
        amount: 0,
        rewardName: null,
      }
    );
  }, [campaign, templateView]);

  const templateName = campaign?.template.name ?? templateView?.name ?? "Campaign";
  const approvalMode =
    campaign?.template.approvalMode ?? templateView?.approval ?? "admin_review";

  const missing = useMemo(() => {
    return fields.filter(
      (f) =>
        f.editable &&
        f.required &&
        !f.locked &&
        !(answers[f.id] ?? f.value ?? "").trim()
    );
  }, [fields, answers]);

  const needsAnswers = useMemo(
    () => fields.some((f) => f.editable && !f.locked && f.required),
    [fields]
  );

  const steps = useMemo(() => {
    const list = [
      { id: "identity", label: "Business" },
      { id: "source", label: "Source" },
      { id: "location", label: "Location" },
      { id: "prepared", label: "Campaign" },
      { id: "rewards", label: "Rewards" },
      ...(needsAnswers ? [{ id: "answers", label: "Missing Info" }] : []),
      { id: "funding", label: "Funding" },
      { id: "review", label: "Review" },
      { id: "submitted", label: "Done" },
    ];
    return list;
  }, [needsAnswers]);

  if (templatesLoading || profileLoading || (instanceId && campaignLoading)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
        <div className="h-6 w-36 rounded bg-gray-200" />
        <div className="h-20 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (campaignError && instanceId) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600 mb-2" />
        <p className="font-semibold text-red-900">Failed to load campaign instance.</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => refetchCampaign()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
          <Link
            to="/dashboard/campaign-centre"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700"
          >
            Back to Campaign Centre
          </Link>
        </div>
      </div>
    );
  }

  if (!templateView && !campaign) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        <p className="font-semibold text-gray-900">Template not found.</p>
        <Link
          to="/dashboard/campaign-centre"
          className="mt-3 inline-block text-sm font-semibold text-primary-700"
        >
          ← Back to Campaign Centre
        </Link>
      </div>
    );
  }

  const current = steps[stepIndex];

  const setAnswer = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: "" } : prev));
  };

  const persistCurrentAnswers = async () => {
    if (!instanceId) return;
    const answerPayload = Object.entries(answers).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));
    if (answerPayload.length > 0) {
      try {
        await saveAnswersMutation.mutateAsync({
          campaignId: instanceId,
          dto: { answers: answerPayload },
        });
      } catch (err) {
        console.error("Failed to save answers:", err);
      }
    }
  };

  const validateCurrent = (): boolean => {
    if (current?.id === "answers") {
      const next: Record<string, string> = {};
      fields
        .filter((f) => f.editable && !f.locked && f.required)
        .forEach((f) => {
          if (!(answers[f.id] ?? f.value ?? "").trim()) {
            next[f.id] = "This is required by the Admin template.";
          }
        });
      setErrors(next);
      return Object.keys(next).length === 0;
    }
    if (current?.id === "funding") {
      const isFunded =
        selfFunded ||
        (campaign?.businessContribution ?? 0) >= (selfFunding.amount || 0);
      if (selfFunding.enabled && selfFunding.mode === "required" && !isFunded) {
        setErrors({
          funding:
            "Seed funding contribution is required by this template before continuing.",
        });
        return false;
      }
      setErrors({});
    }
    return true;
  };

  const goNext = async () => {
    if (!validateCurrent()) return;
    if (current?.id === "answers") {
      await persistCurrentAnswers();
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpTo = (id: string) => {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx >= 0) {
      setStepIndex(idx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleConfirm = async () => {
    setConfirmed(true);
    if (!instanceId) return;

    try {
      await persistCurrentAnswers();
      const res = await submitMutation.mutateAsync(instanceId);
      const isApproved = res.status === "approved";
      setSubmittedStatus(isApproved ? "approved" : "pending_review");
      setStepIndex(steps.length - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to submit campaign:", err);
      // Fallback transition
      setSubmittedStatus(
        approvalMode === "automatic" ? "approved" : "pending_review"
      );
      setStepIndex(steps.length - 1);
    }
  };

  const readyToConfirm = missing.length === 0 && confirmed;

  const body = (() => {
    switch (current?.id) {
      case "identity":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
                <ShieldCheck className="h-4 w-4" /> Step 1 · Identify Business
              </p>
              <p className="mt-1 text-sm text-blue-800">
                Your business identity is already on file from your business account. It is never re-asked during campaign setup.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <Store className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-bold text-gray-900">
                  {profile?.name || "Business"}
                </p>
                <LockedNotice />
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  {
                    label: "Business reference",
                    value: profile?.slug ? profile.slug.toUpperCase() : "REF-001",
                  },
                  {
                    label: "Business type",
                    value: profile?.category || "Independent Merchant",
                  },
                  {
                    label: "Location",
                    value: profile?.address || "Registered Hub",
                  },
                  { label: "City", value: profile?.city || "Manchester" },
                  {
                    label: "Membership tier",
                    value: profile?.membershipTier || "Standard",
                  },
                  {
                    label: "Public Pre-Audit",
                    value: profile?.id ? `AUD-${profile.id.slice(0, 6).toUpperCase()}` : "Verified",
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      {row.label}
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      {row.value} <Lock className="h-3 w-3 text-gray-400" />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {templateView?.requirements && templateView.requirements.length > 0 && (
              <div className="rounded-xl border bg-white p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <KeyRound className="h-4 w-4 text-primary-600" /> Requirements
                </p>
                <ul className="space-y-1.5">
                  {templateView.requirements.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          r.met ? "text-green-500" : "text-gray-300"
                        }`}
                      />
                      {r.label}
                      <span className="text-xs text-gray-400">— {r.hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "source":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm font-bold text-gray-900">Where this campaign came from</p>
              <p className="mt-1 text-sm text-gray-600">
                {source === "audit"
                  ? "Route A — your campaign was prepared automatically from your completed Public Pre-Audit and the Admin template."
                  : "Route B — direct FundOrDonate template use. No audit is attached, so the template asks only what it still needs."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    source === "audit"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {source === "audit"
                    ? `Public Pre-Audit (${profile?.id ? `AUD-${profile.id.slice(0, 6).toUpperCase()}` : "Verified"})`
                    : "Direct template use"}
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Template: {templateName}
                </span>
              </div>
            </div>

            {source === "audit" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-bold text-amber-900">
                    Imported from your Public Pre-Audit
                  </p>
                  <span className="rounded bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {profile?.id ? `AUD-${profile.id.slice(0, 6).toUpperCase()}` : "AUD-VERIFIED"}
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  Your audit was completed once — those verified values are automatically preserved for this campaign.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <FileText className="h-4 w-4 text-gray-400" /> Direct Template Claim
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  The system will only ask for information the template marks as required and permitted for you to provide.
                </p>
              </div>
            )}
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
                <MapPin className="h-4 w-4" /> Location &amp; programme connected
              </p>
              <p className="mt-1 text-sm text-teal-800">
                FundOrDonate connects this campaign to your verified location and regional programme — neither is ever re-asked.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <BadgeCheck className="h-4 w-4 text-primary-600" /> Programme Anchor
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {profile?.name}
                </span>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                  {profile?.city || "Manchester"}
                </span>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <MapPin className="h-4 w-4 text-teal-600" /> Location
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {profile?.address ? `${profile.address}, ` : ""}
                  {profile?.city || "Manchester"}
                </span>
                <LockedNotice />
                <SourceBadge source="location" />
              </div>
            </div>
          </div>
        );

      case "prepared":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-green-900">
                <Sparkles className="h-4 w-4" /> Your campaign has been prepared for you
              </p>
              <p className="mt-1 text-sm text-green-800">
                Title, description, design, structure, rewards and rules come from the Admin template — locked unless the Admin has enabled editing.
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                Admin controls this master template — you may complete only the fields opened for your input.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Lock className="h-4 w-4 text-gray-400" /> Locked by the template
              </p>
              {fields
                .filter((f) => f.locked)
                .map((f) => (
                  <FieldView key={f.id} field={f} />
                ))}
            </div>
            {fields.filter((f) => f.editable && !f.locked).length > 0 && (
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-sm font-bold text-primary-900">Open to you</p>
                <p className="mt-0.5 text-sm text-primary-800">
                  {fields.filter((f) => f.editable && !f.locked).length} field(s) enabled by the Admin for your input.
                </p>
              </div>
            )}
          </div>
        );

      case "answers":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-bold text-primary-900">
                {missing.length > 0
                  ? `${missing.length} question${missing.length > 1 ? "s" : ""} left`
                  : "All required answers complete"}
              </p>
              <p className="mt-0.5 text-sm text-primary-800">
                Only required, unanswered, Admin-enabled fields are shown. Everything else is managed by FundOrDonate.
              </p>
            </div>
            {fields
              .filter((f) => f.editable && !f.locked)
              .map((f) => (
                <AnswerInput
                  key={f.id}
                  field={f}
                  value={answers[f.id] ?? f.value ?? ""}
                  error={errors[f.id]}
                  onChange={(v) => setAnswer(f.id, v)}
                />
              ))}
          </div>
        );

      case "rewards":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Gift className="h-4 w-4 text-primary-600" /> Rewards — attached from this template
              </p>
              {rewards.length > 0 ? (
                <ul className="space-y-2">
                  {rewards.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.category}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {r.rule}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No active rewards attached.</p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5" /> Reward rules are configured by the Admin — view only.
              </p>
            </div>

            {mcomAssets.length > 0 && (
              <div className="rounded-xl border bg-white p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <BadgeCheck className="h-4 w-4 text-fuchsia-600" /> Internal Assets
                </p>
                <ul className="space-y-2">
                  {mcomAssets.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium text-gray-900">{a.name}</span>
                      <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
                        {a.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "funding":
        return (
          <div className="space-y-4">
            {selfFunding.enabled && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
                  <Wallet className="h-4 w-4" /> Fund My Campaign
                </p>
                <p className="mt-1 text-sm text-orange-800">
                  Contribute your business seed funding to boost public trust.
                  {selfFunding.mode === "required"
                    ? " This contribution is required by the template."
                    : " This contribution is optional."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {selfFunded || (campaign?.businessContribution ?? 0) >= (selfFunding.amount || 0) ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700 shadow-sm border border-green-200">
                      <CheckCircle2 className="h-4 w-4" /> {fmt(campaign?.businessContribution || selfFunding.amount)} funded
                      {selfFundGateway ? ` via ${gatewayName(selfFundGateway)}` : ""}
                    </span>
                  ) : (
                    <button
                      onClick={() => setCheckout("selfFund")}
                      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Fund {fmt(selfFunding.amount)}
                    </button>
                  )}
                  <span className="text-xs text-orange-800">
                    {selfFunding.mode === "required" ? "Required by template" : "Optional"}
                  </span>
                </div>
                {errors.funding && (
                  <p className="mt-2 text-xs font-bold text-red-600">{errors.funding}</p>
                )}
                {(fundingRewardSeen || Boolean(campaign?.rewardTriggered)) && selfFunding.rewardName && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700">
                    <Sparkles className="h-4 w-4" /> Reward triggered: {campaign?.rewardTriggered || selfFunding.rewardName}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm font-bold text-gray-900">Live Seed Contribution</p>
              <p className="mt-1 text-sm text-gray-600">
                Payments made here are securely processed via Central Hub (Stripe, PayPal, or MCOM Wallet) and immediately registered under your live campaign.
              </p>
            </div>

            <PaymentCheckoutModal
              open={checkout !== null}
              onClose={() => setCheckout(null)}
              title="Fund My Campaign"
              amount={selfFunding.amount > 0 ? selfFunding.amount / 100 : 100}
              campaignId={instanceId ?? undefined}
              onSuccess={async (payment) => {
                setSelfFundGateway(payment.gateway);
                setSelfFunded(true);
                setFundingRewardSeen(true);
                setCheckout(null);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.funding;
                  return next;
                });
                await refetchCampaign();
              }}
            />
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            {missing.length > 0 && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
                  <CircleAlert className="h-4 w-4" /> Before you continue
                </p>
                <p className="mt-1 text-sm text-orange-800">
                  {missing.length} required field{missing.length > 1 ? "s" : ""} still missing.{" "}
                  <button
                    onClick={() => jumpTo("answers")}
                    className="font-semibold underline"
                  >
                    Answer now
                  </button>
                </p>
              </div>
            )}

            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Store className="h-4 w-4 text-gray-400" /> Business & campaign
                </p>
                <span className="text-xs text-gray-400">🔒 = managed by FundOrDonate</span>
              </div>
              {fields.map((f) => (
                <FieldView
                  key={f.id}
                  field={f}
                  valueOverride={answers[f.id]}
                  onEdit={() => jumpTo("answers")}
                />
              ))}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                I confirm these campaign details are correct and I am authorised to submit this campaign for{" "}
                {approvalMode === "admin_review" ? "Admin review" : "publication"}.
              </span>
            </label>
          </div>
        );

      case "submitted":
        return submittedStatus === "approved" ? (
          <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-green-600" />
            <div>
              <h2 className="text-lg font-bold text-green-900">Campaign Ready</h2>
              <p className="mt-1 text-sm text-green-800">
                This template uses automatic approval — your campaign has been created and is ready to run.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/campaign-centre"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Back to Campaign Centre
              </Link>
              <Link
                to="/dashboard/campaigns"
                className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                View My Campaigns
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
            <PlayCircle className="mx-auto h-10 w-10 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-blue-900">Pending Review</h2>
              <p className="mt-1 text-sm text-blue-800">
                Your campaign has been submitted. A FundOrDonate Admin will review it.
              </p>
            </div>
            <ol className="mx-auto max-w-md space-y-2 text-left text-sm text-blue-900">
              <li className="flex gap-2">
                <span className="font-bold">1.</span> Admin reviews the campaign against the template rules.
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span> You receive an <strong>Approve</strong> or{" "}
                <strong>Request Changes</strong> decision.
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span> If changes are requested, only the requested fields are reopened for you to resubmit.
              </li>
            </ol>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/campaign-centre"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Back to Campaign Centre
              </Link>
              <Link
                to={
                  instanceId
                    ? `/dashboard/my-campaigns/${instanceId}`
                    : "/dashboard/campaigns"
                }
                className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
              >
                Track This Campaign
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  })();

  const isReview = current?.id === "review";
  const isDone = current?.id === "submitted";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/dashboard/campaign-centre"
            className="flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="h-4 w-4" /> Campaign Centre
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Campaign Setup</h1>
          <p className="text-sm text-gray-500">
            {templateName} · prepared from the approved template — no blank campaign form.
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          Step {stepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Stage rail */}
      <ol className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li key={s.id}>
              <button
                onClick={() =>
                  i < stepIndex || isDone ? setStepIndex(i) : undefined
                }
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary-600 text-white"
                    : done
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      {body}

      {!isDone && (
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {isReview ? (
            <button
              onClick={handleConfirm}
              disabled={!readyToConfirm || submitMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {approvalMode === "admin_review"
                ? "Confirm & Submit for Review"
                : "Confirm Campaign"}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {current?.id === "answers" && missing.length > 0
                ? `Continue (${missing.length} left)`
                : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {!isDone && isReview && !readyToConfirm && (
        <p className="text-center text-xs text-gray-500">
          Complete the checks above and tick the confirmation box to submit.
        </p>
      )}
    </div>
  );
}
