// =============================================================================
// Business Template Card
// Shared between the Business Campaign Centre and the admin template preview
// so admins see exactly what businesses see.
// =============================================================================

import {
  CheckCircle2,
  Gift as GiftIcon,
  KeyRound,
  Lock,
  PlayCircle,
  ShieldCheck,
  Unlock,
  Wallet,
} from "lucide-react";
import type { BusinessTemplateView } from "@/services/campaign/type";
import { normalizeBusinessRewardsMode } from "@/services/templates";

const formatGbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n / 100);

const requirementProgress = (template: { requirements?: { met: boolean }[] }) => {
  const reqs = template.requirements || [];
  const met = reqs.filter((r) => r.met).length;
  return {
    met,
    total: reqs.length,
    complete: reqs.length === 0 || met === reqs.length,
  };
};

const ACCESS_TYPE_LABELS: Record<string, string> = {
  automatic: "Open",
  audit: "After audit",
  contribution: "Funds raised",
  membership: "Membership",
  admin_assigned: "Admin assigned",
  combination: "Combination",
};

function RequirementRow({
  label,
  hint,
  met,
}: {
  label: string;
  hint: string;
  met: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      {met ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
      )}
      <div className="min-w-0">
        <p className={`text-sm font-medium ${met ? "text-gray-900" : "text-gray-700"}`}>
          {label}
        </p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
    </li>
  );
}

export interface BusinessTemplateCardProps {
  t: BusinessTemplateView | any;
  /** Admin preview: identical card, actions disabled. */
  preview?: boolean;
  claiming?: boolean;
  unlocking?: boolean;
  onClaim?: () => void;
  onCompleteRequirement?: () => void;
}

export function BusinessTemplateCard({
  t,
  preview = false,
  claiming = false,
  unlocking = false,
  onClaim,
  onCompleteRequirement,
}: BusinessTemplateCardProps) {
  const { met, total, complete } = requirementProgress(t);
  const isClaiming = claiming;

  const unmet: any[] = (t.requirements || []).filter((r: any) => !r.met);
  const needsAudit = unmet.some(
    (r: any) => r.action === "audit" || r.id === "pre_audit",
  );

  // Only the audit requirement has a self-serve action today; everything else
  // is an Admin/funds/membership gate the business cannot click through.
  const hasActionableRequirement = needsAudit;
  const blockedReason = unmet.some((r: any) => r.id === "admin_assigned")
    ? "Invite only — ask an Admin"
    : unmet.some((r: any) => r.id === "min_contribution")
      ? "Funds-raised threshold not met"
      : unmet.some(
            (r: any) => r.action === "membership" || r.id === "campaign_eligibility",
          )
        ? "Membership tier required"
        : "Locked by an eligibility rule";

  const accessLabel =
    ACCESS_TYPE_LABELS[t.accessType as string] ?? t.accessType ?? "Open";
  const contributionThreshold =
    (t.requirements || []).find((r: any) => r.id === "min_contribution") ?? null;
  const rewardsMode = normalizeBusinessRewardsMode(t.businessRewardsMode);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-gray-900">{t.name}</h3>
            {complete ? (
              <Unlock className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-amber-500" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {t.season} · {accessLabel} access ·{" "}
            {t.approval === "admin_review"
              ? "Admin approval required"
              : "Automatic approval"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            complete
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {complete ? "AVAILABLE" : "LOCKED"}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-600">{t.tagline}</p>

      <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[11px] font-semibold text-purple-700">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Permission to use · Admin owns this master template
      </p>

      {t.requiredCampaign && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t.requiredCampaign.minPence > 0
              ? `A donation of ${formatGbp(t.requiredCampaign.minPence)} or more`
              : "A donation"}{" "}
            to “{t.requiredCampaign.title}” is collected during setup, before you
            submit. It does not affect your ability to claim.
          </span>
        </p>
      )}

      {t.selfFunding?.enabled && t.selfFunding.mode === "required" && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] font-semibold text-orange-800">
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t.selfFunding.amount > 0
              ? `Seed funding of ${formatGbp(t.selfFunding.amount)}`
              : "A seed contribution"}{" "}
            into your own campaign is required at setup — you cannot submit until it is
            paid.
          </span>
        </p>
      )}

      {rewardsMode !== "disabled" && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1.5 text-[11px] font-semibold text-primary-700">
          <GiftIcon className="h-3.5 w-3.5 shrink-0" />
          {rewardsMode === "replace"
            ? "Use your own MCOM Rewards — they replace the template rewards"
            : "Add your own MCOM Rewards alongside the template rewards"}
        </p>
      )}

      {t.requirements && t.requirements.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100">
          {t.requirements.map((r: any) => (
            <RequirementRow key={r.id} label={r.label} hint={r.hint} met={r.met} />
          ))}
        </ul>
      )}

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-600">
        {t.rewards && (
          <span className="flex items-center gap-1">
            <GiftIcon className="h-3.5 w-3.5 text-primary-600" />
            {t.rewards.length} rewards{" "}
            {t.mcomAssets && t.mcomAssets.length > 0 &&
              `· ${t.mcomAssets.length} internal assets`}
          </span>
        )}
        {t.contributionRequirement?.required && (
          <span className="flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-orange-500" />
            {formatGbp(t.contributionRequirement.amount)} raised through FundOrDonate{" "}
            {contributionThreshold?.met ? "· met" : "required"}
          </span>
        )}
        {t.requirements && t.requirements.length > 0 && (
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            {met}/{total} requirements met
          </span>
        )}
      </div>

      {complete ? (
        <button
          onClick={onClaim}
          disabled={preview || isClaiming}
          title={preview ? "Preview only — business action" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <PlayCircle className="h-4 w-4" />
          {isClaiming ? "Preparing…" : "Claim Campaign"}
        </button>
      ) : (
        <button
          onClick={onCompleteRequirement}
          disabled={preview || unlocking || !hasActionableRequirement}
          title={
            preview
              ? "Preview only — business action"
              : !hasActionableRequirement
                ? blockedReason
                : undefined
          }
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
        >
          <KeyRound className="h-4 w-4" />
          {unlocking
            ? "Completing…"
            : needsAudit
              ? "Go to 247GBS Audit"
              : blockedReason}
        </button>
      )}
    </div>
  );
}
