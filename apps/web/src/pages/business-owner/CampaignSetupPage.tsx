// =============================================================================
// Business Campaign Setup (template-driven claim flow)
// Frontend-only staging of the Business Dashboard campaign template claim &
// setup flow (Stages 1–14). The business NEVER gets the generic campaign
// builder: the campaign is prepared from the Admin template + audit answers,
// and only Admin-enabled fields can be answered.
//   Stages: Identify Business → Source → Import/Prepare → Missing Info →
//   Rewards & MCOM → Self-Funding + Required Contribution → Review →
//   Confirm → Pending Review / Automatic Approval.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, CircleAlert, FileText,
  Gift, KeyRound, Lock, MapPin, PlayCircle, ShieldCheck, Sparkles, Store,
  Wallet,
} from "lucide-react";
import {
  AUDIT_ANSWERS, BUSINESS_IDENTITY, SOURCE_BADGES, editableFields, formatDate,
  formatGbp, lockedFieldsOnly, missingFields,
  type SetupField, type SetupFieldSource,
} from "@/data/businessCampaignAccess";
import {
  claimTemplate,
  getBusinessTemplate,
  getCampaignInstance,
  saveAnswers,
  submitForReview,
} from "@/data/campaignTemplateStore";
import {
  gatewayName,
  type PaymentGateway,
} from "@/components/business/PaymentGatewaySelector";
import { PaymentCheckoutModal } from "@/components/business/PaymentCheckoutModal";
import { DatePicker } from "@/components/ui/DatePicker";

const LOCATION_LEVEL_LABELS: Record<string, string> = {
  national: "National",
  city: "City",
  local_area: "Local Area",
  high_street: "High Street",
  business: "Business",
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: SetupFieldSource }) {
  const badge = SOURCE_BADGES[source];
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.color}`}>
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

function FieldView({ field, onEdit }: { field: SetupField; onEdit?: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field.label}</p>
          {field.locked ? <LockedNotice /> : <SourceBadge source={field.source} />}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
          {field.inputType === "date" && field.value ? formatDate(field.value) : field.value || "—"}
        </p>
        {!field.locked && <p className="mt-0.5 text-xs text-gray-400">{field.sourceNote}</p>}
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
  field: SetupField;
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
        <span className="mt-0.5 block text-xs text-gray-500">{field.sourceNote}</span>
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

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

interface SubmittedState {
  status: "pending_review" | "approved";
}

export default function CampaignSetupPage() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const source: "audit" | "direct" = searchParams.get("source") === "audit" ? "audit" : "direct";

  const template = getBusinessTemplate(templateId);
  const [instanceId, setInstanceId] = useState<string | null>(() =>
    searchParams.get("campaign")
  );
  const instance = getCampaignInstance(instanceId ?? undefined);

  // Direct URL visit without a claimed instance → claim now (the claim is
  // permission to use the Admin-owned master template, never ownership).
  useEffect(() => {
    if (!template || instanceId) return;
    const result = claimTemplate(template.id);
    if (result.ok) setInstanceId(result.campaignId);
  }, [template, instanceId]);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const base = Object.fromEntries(
      (template?.fields ?? [])
        .filter((f) => f.editable && !f.locked)
        .map((f) => [f.id, f.value])
    );
    return { ...base, ...(instance?.answers ?? {}) };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selfFunded, setSelfFunded] = useState(false);
  const [fundingRewardSeen, setFundingRewardSeen] = useState(false);
  const [paidRequired, setPaidRequired] = useState(false);
  const [checkout, setCheckout] = useState<null | "required" | "selfFund">(null);
  const [requiredGateway, setRequiredGateway] = useState<PaymentGateway>("stripe");
  const [selfFundGateway, setSelfFundGateway] = useState<PaymentGateway>("stripe");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null);

  const needsAnswers = useMemo(
    () => (template ? template.fields.some((f) => f.editable && !f.locked && f.required && !f.value.trim()) : false),
    [template]
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

  if (!template) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        <p className="font-semibold text-gray-900">Template not found.</p>
        <Link to="/dashboard/campaign-centre" className="mt-3 inline-block text-sm font-semibold text-primary-700">
          ← Back to Campaign Centre
        </Link>
      </div>
    );
  }

  const missing = missingFields(template.fields, answers);
  const requiredContribution = template.contributionRequirement;
  const current = steps[stepIndex];

  const setAnswer = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: "" } : prev));
  };

  const validateCurrent = (): boolean => {
    if (current?.id !== "answers") return true;
    const next: Record<string, string> = {};
    template.fields
      .filter((f) => f.editable && !f.locked && f.required)
      .forEach((f) => {
        if (!(answers[f.id] ?? "").trim()) next[f.id] = "This is required by the Admin template.";
      });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    if (instanceId) saveAnswers(instanceId, answers);
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

  const handleConfirm = () => {
    setConfirmed(true);
    let status: "pending_review" | "approved";
    if (instanceId) {
      saveAnswers(instanceId, answers);
      const result = submitForReview(instanceId);
      status = result?.status === "approved" ? "approved" : "pending_review";
    } else {
      status = template.approval === "admin_review" ? "pending_review" : "approved";
    }
    setSubmitted({ status });
    setStepIndex(steps.length - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const auditPanel = (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 text-amber-700" />
        <p className="text-sm font-bold text-amber-900">Imported from your Public Pre-Audit</p>
        <span className="rounded bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          {BUSINESS_IDENTITY.auditReference}
        </span>
      </div>
      <p className="mb-3 text-xs text-amber-800">
        Your audit was asked once — those answers are reused here and never asked again.
      </p>
      <ul className="space-y-1.5">
        {AUDIT_ANSWERS.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2">
            <span className="text-xs text-gray-600">{a.label}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900">{a.value}</span>
              <SourceBadge source="audit" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const readyToConfirm =
    missing.length === 0 &&
    (!requiredContribution.required || paidRequired) &&
    confirmed;

  const body = (() => {
    switch (current?.id) {
      // ---------------------------------------------------------------------
      // Stage 1 — Identify Business (locked, known once)
      // ---------------------------------------------------------------------
      case "identity":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
                <ShieldCheck className="h-4 w-4" /> Step 1 · Identify Business
              </p>
              <p className="mt-1 text-sm text-blue-800">
                Your business identity is already on file. It is never re-asked during campaign setup.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <Store className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-bold text-gray-900">{BUSINESS_IDENTITY.name}</p>
                <LockedNotice />
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  { label: "Business reference", value: BUSINESS_IDENTITY.reference },
                  { label: "Business type", value: `${BUSINESS_IDENTITY.businessType} · ${BUSINESS_IDENTITY.category}` },
                  { label: "Location", value: `${BUSINESS_IDENTITY.highStreet}, ${BUSINESS_IDENTITY.localArea}` },
                  { label: "City", value: BUSINESS_IDENTITY.city },
                  { label: "Membership tier", value: BUSINESS_IDENTITY.membershipTier },
                  { label: "Public Pre-Audit", value: BUSINESS_IDENTITY.auditReference },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{row.label}</dt>
                    <dd className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      {row.value} <Lock className="h-3 w-3 text-gray-400" />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <KeyRound className="h-4 w-4 text-primary-600" /> Requirements
              </p>
              <ul className="space-y-1.5">
                {template.requirements.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className={`h-4 w-4 ${r.met ? "text-green-500" : "text-gray-300"}`} />
                    {r.label}
                    <span className="text-xs text-gray-400">— {r.hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      // ---------------------------------------------------------------------
      // Stage 2 — Identify Source (audit vs direct)
      // ---------------------------------------------------------------------
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
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${source === "audit" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}>
                  {source === "audit" ? "Public Pre-Audit (AUD-000123)" : "Direct template use"}
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Template: {template.name}
                </span>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  Access: {template.accessType}
                </span>
              </div>
            </div>
            {source === "audit" ? (
              auditPanel
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <FileText className="h-4 w-4 text-gray-400" /> No completed audit on file
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  You can still claim this template. The system will only ask for information the template marks as
                  required and permitted for you to provide.
                </p>
              </div>
            )}
          </div>
        );

      // ---------------------------------------------------------------------
      // Step 5 (spec) — Connect the campaign to its location & programme
      // ---------------------------------------------------------------------
      case "location":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
                <MapPin className="h-4 w-4" /> Location &amp; programme connected
              </p>
              <p className="mt-1 text-sm text-teal-800">
                FundOrDonate connects this campaign to the relevant location and programme from
                your business profile and the Admin template — neither is ever re-asked.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <BadgeCheck className="h-4 w-4 text-primary-600" /> Programme
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {template.season}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {template.structure.mode} campaign
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {BUSINESS_IDENTITY.name}
                </span>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <MapPin className="h-4 w-4 text-teal-600" /> Location
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {instance?.locationLabel ??
                    `${BUSINESS_IDENTITY.highStreet}, ${BUSINESS_IDENTITY.localArea}, ${BUSINESS_IDENTITY.city}`}
                </span>
                <LockedNotice />
                <SourceBadge source="location" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {template.structure.config.location.levels.map((level) => (
                  <span
                    key={level}
                    className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700"
                  >
                    {LOCATION_LEVEL_LABELS[level] ?? level}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {template.structure.config.location.allowMultiple
                  ? "This template allows multiple location selections."
                  : "This template anchors the campaign to a single connected location."}
              </p>
            </div>
          </div>
        );

      // ---------------------------------------------------------------------
      // Stages 3–5 — Import + prepare the campaign structure
      // ---------------------------------------------------------------------
      case "prepared":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-green-900">
                <Sparkles className="h-4 w-4" /> Your campaign has been prepared for you
              </p>
              <p className="mt-1 text-sm text-green-800">
                Title, description, design, structure, rewards and rules come from the Admin template — locked unless
                the Admin has enabled editing.
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                Admin owns and controls this master template — you have permission to use it and
                may only complete the fields Admin opened.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Lock className="h-4 w-4 text-gray-400" /> Locked by the template
              </p>
              {lockedFieldsOnly(template.fields).map((f) => (
                <FieldView key={f.id} field={f} />
              ))}
            </div>
            {editableFields(template.fields).length > 0 && (
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-sm font-bold text-primary-900">Open to you</p>
                <p className="mt-0.5 text-sm text-primary-800">
                  {editableFields(template.fields).length} field
                  {editableFields(template.fields).length > 1 ? "s are" : " is"} enabled by the Admin for your input —
                  {needsAnswers ? " you will answer the missing ones next." : " all already answered from your data."}
                </p>
              </div>
            )}
          </div>
        );

      // ---------------------------------------------------------------------
      // Stages 6–7 — Missing information only (Admin-permitted)
      // ---------------------------------------------------------------------
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
            {editableFields(template.fields).map((f) => (
              <AnswerInput
                key={f.id}
                field={f}
                value={answers[f.id] ?? ""}
                error={errors[f.id]}
                onChange={(v) => setAnswer(f.id, v)}
              />
            ))}
          </div>
        );

      // ---------------------------------------------------------------------
      // Stage 8 — Rewards & MCOM assets (pulled from the template)
      // ---------------------------------------------------------------------
      case "rewards":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Gift className="h-4 w-4 text-primary-600" /> Rewards — pulled from this template
              </p>
              <ul className="space-y-2">
                {template.rewards.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {r.rule}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${r.source === "mcom" ? "bg-fuchsia-100 text-fuchsia-700" : "bg-green-100 text-green-700"}`}>
                        {r.source === "mcom" ? "MCOM" : "FundOrDonate"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5" /> Reward rules are configured by the Admin — view only.
              </p>
            </div>
            {template.mcomAssets.length > 0 && (
              <div className="rounded-xl border bg-white p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <BadgeCheck className="h-4 w-4 text-fuchsia-600" /> Internal Assets
                </p>
                <ul className="space-y-2">
                  {template.mcomAssets.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-lg border p-3">
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

      // ---------------------------------------------------------------------
      // Stage 9 — Self-funding + required business contribution
      // ---------------------------------------------------------------------
      case "funding":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Wallet className="h-4 w-4 text-blue-600" /> A · Required contribution
              </p>
              {requiredContribution.required ? (
                <>
                  <p className="mt-1 text-sm text-gray-600">
                    This template requires a {formatGbp(requiredContribution.amount)} business contribution before the
                    campaign can be submitted (unlock / eligibility).
                  </p>
                  {instanceId && (
                    <Link
                      to={`/dashboard/my-campaigns/${instanceId}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-3.5 w-3.5" /> Read more about this campaign
                    </Link>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-900">
                      {formatGbp(requiredContribution.amount)}
                    </span>
                    {paidRequired ? (
                      <span className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Contribution received via {gatewayName(requiredGateway)}
                      </span>
                    ) : (
                      <button
                        onClick={() => setCheckout("required")}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Pay {formatGbp(requiredContribution.amount)}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-600">No required contribution for this template.</p>
              )}
            </div>

            {template.selfFunding.enabled && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
                  <Wallet className="h-4 w-4" /> B · Fund My Campaign
                </p>
                <p className="mt-1 text-sm text-orange-800">
                  Separate from the required contribution — this money goes into your own campaign
                  {template.selfFunding.mode === "required" ? " and is required by this template" : " and is optional"}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {selfFunded ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> {formatGbp(template.selfFunding.amount)} funded via {gatewayName(selfFundGateway)}
                    </span>
                  ) : (
                    <button
                      onClick={() => setCheckout("selfFund")}
                      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Fund {formatGbp(template.selfFunding.amount)}
                    </button>
                  )}
                  <span className="text-xs text-orange-800">
                    {template.selfFunding.mode === "required" ? "Required by template" : "Optional"}
                  </span>
                </div>
                {fundingRewardSeen && template.selfFunding.rewardName && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-green-700">
                    <Sparkles className="h-4 w-4" /> Reward triggered: {template.selfFunding.rewardName}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm font-bold text-gray-900">Two separate contributions</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Contribution A — unlock / eligibility (to FundOrDonate)</li>
                <li>Contribution B — your own campaign (funds your campaign)</li>
              </ul>
            </div>

            <PaymentCheckoutModal
              open={checkout !== null}
              onClose={() => setCheckout(null)}
              title={checkout === "selfFund" ? "Fund My Campaign" : "Required contribution"}
              amount={
                checkout === "selfFund"
                  ? template.selfFunding.amount
                  : requiredContribution.amount
              }
              campaignId={instanceId ?? undefined}
              onSuccess={(payment) => {
                if (checkout === "selfFund") {
                  setSelfFundGateway(payment.gateway);
                  setSelfFunded(true);
                  setFundingRewardSeen(true);
                } else {
                  setRequiredGateway(payment.gateway);
                  setPaidRequired(true);
                }
              }}
            />
          </div>
        );

      // ---------------------------------------------------------------------
      // Stages 10–11 — Review before confirmation
      // ---------------------------------------------------------------------
      case "review":
        return (
          <div className="space-y-4">
            {(missing.length > 0 || (requiredContribution.required && !paidRequired)) && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
                  <CircleAlert className="h-4 w-4" /> Before you continue
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-orange-800">
                  {missing.length > 0 && (
                    <li>
                      {missing.length} required field{missing.length > 1 ? "s" : ""} still missing
                      <button onClick={() => jumpTo("answers")} className="ml-2 font-semibold underline">
                        answer now
                      </button>
                    </li>
                  )}
                  {requiredContribution.required && !paidRequired && (
                    <li>
                      Required contribution of {formatGbp(requiredContribution.amount)} not yet paid
                      <button onClick={() => jumpTo("funding")} className="ml-2 font-semibold underline">
                        pay now
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Store className="h-4 w-4 text-gray-400" /> Business & campaign
                </p>
                <span className="text-xs text-gray-400">🔒 = managed by FundOrDonate</span>
              </div>
              {template.fields.map((f) => {
                const value = f.locked ? f.value : answers[f.id] ?? f.value;
                return <FieldView key={f.id} field={{ ...f, value }} onEdit={() => jumpTo("answers")} />;
              })}
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Gift className="h-4 w-4 text-primary-600" /> Rewards & funding
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-center justify-between gap-2">
                  <span>Rewards attached</span>
                  <span className="font-semibold">{template.rewards.length}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>Internal assets</span>
                  <span className="font-semibold">{template.mcomAssets.length}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>Required contribution</span>
                  <span className={`font-semibold ${paidRequired ? "text-green-700" : "text-gray-500"}`}>
                    {requiredContribution.required
                      ? paidRequired
                        ? `${formatGbp(requiredContribution.amount)} paid`
                        : `${formatGbp(requiredContribution.amount)} due`
                      : "Not required"}
                  </span>
                </li>
                {template.selfFunding.enabled && (
                  <li className="flex items-center justify-between gap-2">
                    <span>Your own contribution</span>
                    <span className={`font-semibold ${selfFunded ? "text-green-700" : "text-gray-500"}`}>
                      {selfFunded ? `${formatGbp(template.selfFunding.amount)} added` : "Not added"}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                I confirm these campaign details are correct and I am authorised to submit this campaign for
                {template.approval === "admin_review" ? " Admin review" : " publication"}.
              </span>
            </label>
          </div>
        );

      // ---------------------------------------------------------------------
      // Stages 12–14 — Submitted / Admin decision / campaign ready
      // ---------------------------------------------------------------------
      case "submitted":
        return submitted?.status === "approved" ? (
          <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-green-600" />
            <div>
              <h2 className="text-lg font-bold text-green-900">Campaign Ready</h2>
              <p className="mt-1 text-sm text-green-800">
                This template uses automatic approval — your campaign has been created and is ready to run.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/dashboard/campaign-centre" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Back to Campaign Centre
              </Link>
              <Link to="/dashboard/campaigns" className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100">
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
                <span className="font-bold">3.</span> If changes are requested, only the requested fields are reopened
                for you to resubmit.
              </li>
            </ol>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/dashboard/campaign-centre" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
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
            {template.name} · prepared from the approved template — no blank campaign form.
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
                onClick={() => (i < stepIndex || isDone ? setStepIndex(i) : undefined)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary-600 text-white"
                    : done
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
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
              disabled={!readyToConfirm}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {template.approval === "admin_review" ? "Confirm & Submit for Review" : "Confirm Campaign"}
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
