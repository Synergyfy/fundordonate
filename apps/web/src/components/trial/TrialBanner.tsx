// =============================================================================
// TrialBanner
// Surfaces MCOM "Programme Trial" access: shows that the account is on a trial,
// how many days remain, and the programme tasks that must be completed.
// Renders nothing for paid memberships or when there is no trial entitlement.
// =============================================================================

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  ListChecks,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface ProgrammeTask {
  taskId?: string;
  title?: string;
  description?: string;
  deadlineDays?: number;
  rewardPoints?: number;
  status?: string;
}

/** Whole days remaining until an ISO date; null when unknown. */
function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

function pluraliseDays(days: number): string {
  return days === 1 ? "1 day left" : `${days} days left`;
}

export function TrialBanner() {
  const entitlement = useAuthStore((s) => s.entitlement);
  const refreshEntitlement = useAuthStore((s) => s.refreshEntitlement);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const tasks = useMemo<ProgrammeTask[]>(() => {
    const raw = entitlement?.tasksToComplete;
    return Array.isArray(raw) ? (raw as ProgrammeTask[]) : [];
  }, [entitlement?.tasksToComplete]);

  if (!entitlement || !entitlement.isTrial || dismissed) return null;

  const days = daysRemaining(entitlement.expiresAt);
  const expired = days !== null && days <= 0;

  const handleRecheck = async () => {
    setRefreshing(true);
    try {
      const result = await refreshEntitlement();
      if (!result.hasAccess) {
        navigate("/dashboard/plan?reason=TRIAL_EXPIRED", { replace: false });
      }
    } catch {
      // Keep the banner as-is if the re-check fails.
    } finally {
      setRefreshing(false);
    }
  };

  // ── Expired trial ─────────────────────────────────────────────────────────
  if (expired) {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">Your trial has ended</p>
            <p className="mt-0.5 text-sm text-red-700/90">
              Your FundorDonate programme trial is over. Upgrade your MCOM membership
              to keep full access.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/dashboard/plan?reason=TRIAL_EXPIRED")}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Upgrade access
              </button>
              <button
                onClick={handleRecheck}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Checking…" : "Re-check access"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active trial ──────────────────────────────────────────────────────────
  const urgent = days !== null && days <= 3;

  const palette = urgent
    ? {
        border: "border-amber-200",
        bg: "bg-amber-50",
        iconBg: "bg-amber-100",
        icon: "text-amber-600",
        title: "text-amber-800",
        body: "text-amber-700/90",
      }
    : {
        border: "border-sky-200",
        bg: "bg-sky-50",
        iconBg: "bg-sky-100",
        icon: "text-sky-600",
        title: "text-sky-800",
        body: "text-sky-700/90",
      };

  return (
    <div className={`mb-4 rounded-xl border ${palette.border} ${palette.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${palette.iconBg}`}
        >
          <Clock className={`h-5 w-5 ${palette.icon}`} />
        </span>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${palette.title}`}>
            Programme trial{entitlement.planName ? ` · ${entitlement.planName}` : ""}
            {days !== null ? ` — ${pluraliseDays(days)}` : ""}
          </p>
          <p className={`mt-0.5 text-sm ${palette.body}`}>
            {days !== null
              ? `You have full access to FundorDonate until ${new Date(
                  entitlement.expiresAt as string,
                ).toLocaleDateString()}.`
              : "You currently have trial access to FundorDonate."}
          </p>

          {tasks.length > 0 && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${palette.title} hover:underline`}
              >
                <ListChecks className="h-4 w-4" />
                {tasks.length} programme {tasks.length === 1 ? "task" : "tasks"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>

              {expanded && (
                <ul className="mt-3 space-y-2">
                  {tasks.map((task, index) => (
                    <li
                      key={task.taskId ?? index}
                      className="rounded-lg border border-white/60 bg-white/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {task.title ?? `Task ${index + 1}`}
                        </p>
                        {task.status && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            {task.status}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs text-gray-600">{task.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {typeof task.deadlineDays === "number" && (
                          <span>Due within {task.deadlineDays} days</span>
                        )}
                        {typeof task.rewardPoints === "number" && task.rewardPoints > 0 && (
                          <span>{task.rewardPoints} reward points</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss trial notice"
          className={`shrink-0 rounded-lg p-1.5 ${palette.icon} transition-colors hover:bg-white/60`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
