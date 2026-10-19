// =============================================================================
// Business Audit Card — 247GBS Audit status for the Campaign Centre.
//
// Pre-audit/audit data is owned by 247GBS Audit; this surfaces FundOrDonate's
// local snapshot and, for the not-shared states, a deep link into 247GBS Audit.
// =============================================================================

import {
  AlertCircle,
  BadgeCheck,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  useBusinessAuditStatus,
  useRefreshBusinessAudit,
} from "@/services/audit/hook";
import type { AuditStatus } from "@/services/audit/type";

const shortId = (id: string | null | undefined) =>
  id ? id.slice(0, 8).toUpperCase() : null;

const AUDIT_TYPE_LABEL: Record<string, string> = {
  SHORT_FORM: "Short Business Audit",
  LONG_FORM: "Full Business Audit",
};

function StatusPill({ status }: { status: AuditStatus }) {
  const map: Record<AuditStatus["linkStatus"], string> = {
    AVAILABLE: "bg-green-100 text-green-700",
    NO_PRE_AUDIT: "bg-amber-100 text-amber-800",
    CONSENT_REQUIRED: "bg-amber-100 text-amber-800",
    NOT_LINKED: "bg-gray-100 text-gray-600",
    ERROR: "bg-red-100 text-red-700",
  };
  const label: Record<AuditStatus["linkStatus"], string> = {
    AVAILABLE: "SHARED",
    NO_PRE_AUDIT: "NOT STARTED",
    CONSENT_REQUIRED: "NOT SHARED",
    NOT_LINKED: "NOT LINKED",
    ERROR: "UNAVAILABLE",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${map[status.linkStatus]}`}
    >
      {label[status.linkStatus]}
    </span>
  );
}

export function BusinessAuditCard() {
  const { data: status, isLoading, isError } = useBusinessAuditStatus();
  const refresh = useRefreshBusinessAudit();

  if (isLoading) {
    return (
      <div className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    );
  }

  if (isError || !status) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        Could not load your 247GBS Audit status.
      </div>
    );
  }

  const { diagnostic } = status;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary-600" />
          <div>
            <p className="text-sm font-bold text-gray-900">
              247GBS Audit · Public Pre-Audit
            </p>
            <p className="text-xs text-gray-500">
              Your pre-audit and audit data live in 247GBS Audit and are shared
              with FundOrDonate using your MCOM account.
            </p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {status.linkStatus === "AVAILABLE" && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Reference
              </p>
              <p className="text-sm font-bold text-gray-900">
                {shortId(status.preAuditId) ?? "—"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Recommended
              </p>
              <p className="text-sm font-bold text-gray-900">
                {AUDIT_TYPE_LABEL[status.recommendedAuditType ?? ""] ??
                  status.recommendedAuditType ??
                  "—"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Funding gap
              </p>
              <p className="text-sm font-bold text-gray-900">
                {diagnostic?.funding.fundingGapFormatted ?? "—"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Audits
              </p>
              <p className="text-sm font-bold text-gray-900">
                {status.auditCount}
              </p>
            </div>
          </div>

          {diagnostic?.readiness?.label && (
            <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700">
              <Sparkles className="h-3.5 w-3.5" />
              {diagnostic.readiness.label}
              {status.destinationType
                ? ` · routing: ${status.destinationType}`
                : ""}
            </p>
          )}
        </>
      )}

      {status.linkStatus !== "AVAILABLE" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {status.linkStatus === "NO_PRE_AUDIT" &&
            "You haven't completed a free 247GBS Audit pre-audit yet. It takes a few minutes and unlocks audited template campaigns."}
          {status.linkStatus === "CONSENT_REQUIRED" &&
            "You have a pre-audit, but you haven't shared it with FundOrDonate. Re-open it in 247GBS Audit to grant sharing."}
          {status.linkStatus === "NOT_LINKED" &&
            "Sign in to 247GBS Audit with your MCOM account so FundOrDonate can read your pre-audit."}
          {status.linkStatus === "ERROR" &&
            "We couldn't reach 247GBS Audit just now. Try refreshing in a moment."}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {status.linkStatus === "AVAILABLE" ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
            <BadgeCheck className="h-4 w-4" /> Pre-audit shared with FundOrDonate
          </span>
        ) : (
          status.deepLinks && (
            <a
              href={
                status.linkStatus === "NOT_LINKED"
                  ? status.deepLinks.signIn
                  : status.deepLinks.preAudit
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              {status.linkStatus === "NOT_LINKED"
                ? "Sign in to 247GBS Audit"
                : "Complete your free pre-audit"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )
        )}

        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
          />
          Refresh
        </button>

        {status.syncedAt && (
          <span className="text-[11px] text-gray-400">
            Synced {new Date(status.syncedAt).toLocaleString("en-GB")}
          </span>
        )}
      </div>
    </div>
  );
}

export default BusinessAuditCard;
