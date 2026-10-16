import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

const REASON_MESSAGES: Record<string, { title: string; body: string }> = {
  PLATFORM_NOT_IN_MEMBERSHIP: {
    title: "FundorDonate isn't included in your membership",
    body: "Your MCOM membership is active, but it doesn't currently bundle access to FundorDonate. Upgrade your membership to unlock it.",
  },
  TRIAL_NO_TASKS: {
    title: "Trial available — no programme tasks yet",
    body: "You're in a trial window, but no active programme tasks are configured for FundorDonate yet. Check back soon or upgrade for full access.",
  },
  TRIAL_EXPIRED: {
    title: "Your trial has ended",
    body: "Your FundorDonate trial access has expired. Upgrade your membership to continue.",
  },
  UNVERIFIED: {
    title: "Verification required",
    body: "Your MCOM business verification fee hasn't been paid yet. Complete verification to unlock trial access.",
  },
  MEMBERSHIP_EXPIRED: {
    title: "Your membership has expired",
    body: "Renew your MCOM membership to restore access to FundorDonate.",
  },
  NO_ACTIVE_ENTITLEMENT: {
    title: "No active plan for FundorDonate",
    body: "There's no active plan or entitlement for your account on this platform yet.",
  },
};

export default function UpgradePage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "NO_ACTIVE_ENTITLEMENT";
  const upgradeUrl = searchParams.get("upgradeUrl") || "";
  const message = REASON_MESSAGES[reason] ?? {
    title: "Access required",
    body: "Your account doesn't currently have access to FundorDonate.",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-lg space-y-6 text-center">
        <Link to="/" className="text-2xl font-bold text-primary-600">
          FundorDonate
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{message.title}</h1>
          <p className="mt-3 text-sm text-gray-600">{message.body}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-gray-400">
            Reason: {reason}
          </p>

          {upgradeUrl && (
            <a
              href={upgradeUrl}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              Go to MCOM Central to upgrade
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <Link to="/" className="block text-sm text-gray-500 hover:text-gray-700">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
