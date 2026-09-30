// =============================================================================
// Business Template Card
// Shared between the Business Campaign Centre and the admin template preview
// so admins see exactly what businesses see.
// =============================================================================

import {
  CheckCircle2, Gift as GiftIcon, KeyRound, Lock, PlayCircle, ShieldCheck, Unlock, Wallet,
} from "lucide-react";
import { formatGbp, requirementProgress, type BusinessTemplate } from "@/data/businessCampaignAccess";

function RequirementRow({ label, hint, met }: { label: string; hint: string; met: boolean }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      {met ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
      )}
      <div className="min-w-0">
        <p className={`text-sm font-medium ${met ? "text-gray-900" : "text-gray-700"}`}>{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
    </li>
  );
}

export interface BusinessTemplateCardProps {
  t: BusinessTemplate;
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
            {t.season} · {t.accessType} access · {t.approval === "admin_review" ? "Admin approval required" : "Automatic approval"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
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

      <ul className="mb-4 divide-y divide-gray-100">
        {t.requirements.map((r) => (
          <RequirementRow key={r.id} label={r.label} hint={r.hint} met={r.met} />
        ))}
      </ul>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <GiftIcon className="h-3.5 w-3.5 text-primary-600" />
          {t.rewards.length} rewards {t.mcomAssets.length > 0 && `· ${t.mcomAssets.length} internal assets`}
        </span>
        {t.contributionRequirement.required && (
          <span className="flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-orange-500" />
            Required contribution {formatGbp(t.contributionRequirement.amount)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
          {met}/{total} requirements met
        </span>
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
          disabled={preview || unlocking}
          title={preview ? "Preview only — business action" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <KeyRound className="h-4 w-4" />
          {unlocking ? "Completing…" : "Complete Requirement"}
        </button>
      )}
    </div>
  );
}
