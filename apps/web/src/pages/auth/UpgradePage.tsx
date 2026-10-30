import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, ArrowUpRight } from "lucide-react";
import { getEntitlementReasonMessage } from "@/lib/entitlement-reasons";
import { useAuthStore } from "@/stores/auth.store";
import { isBusinessDashboardUser } from "@/lib/roles";

export default function UpgradePage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "NO_ACTIVE_ENTITLEMENT";
  const upgradeUrl = searchParams.get("upgradeUrl") || "";
  const message = getEntitlementReasonMessage(reason);
  const user = useAuthStore((s) => s.user);
  const canBuyInDashboard = Boolean(user && isBusinessDashboardUser(user));

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

          {canBuyInDashboard ? (
            <Link
              to={`/dashboard/plan?reason=${encodeURIComponent(reason)}`}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              Choose a plan or access pass
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            upgradeUrl && (
              <a
                href={upgradeUrl}
                className="btn-primary mt-6 inline-flex items-center gap-2"
              >
                Go to MCOM Central to upgrade
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )
          )}

          {canBuyInDashboard && upgradeUrl && (
            <a
              href={upgradeUrl}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Manage your MCOM membership
              <ArrowUpRight className="h-3 w-3" />
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
