// =============================================================================
// Business dashboard — Plan & access
// Current plan, saved access-pass codes, purchase history and new purchases.
// =============================================================================

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { PlansExperience } from "@/pages/plans/PlansPage";
import { AccessRefreshButton } from "@/components/plans/AccessRefreshButton";
import { getEntitlementReasonMessage } from "@/lib/entitlement-reasons";
import { useAuthStore } from "@/stores/auth.store";

type RefreshMessage = { type: "success" | "error"; text: string };

export default function BusinessPlanPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const entitlement = useAuthStore((s) => s.entitlement);
  const refreshEntitlement = useAuthStore((s) => s.refreshEntitlement);
  const loadUser = useAuthStore((s) => s.loadUser);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<RefreshMessage | null>(
    null,
  );

  const reason = searchParams.get("reason");
  const upgradeUrl = searchParams.get("upgradeUrl");
  const message = entitlement?.isActive
    ? null
    : getEntitlementReasonMessage(reason);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMessage(null);

    try {
      let hasAccess = false;
      let planName: string | null | undefined;
      let centralChecked = true;

      try {
        const result = await refreshEntitlement();
        hasAccess = result.hasAccess;
        planName = result.entitlement?.planName;
      } catch {
        // Direct-SSO sessions may not retain a Central token. Still refresh the
        // local plan state so purchases/activations made here appear.
        centralChecked = false;
        const local = useAuthStore.getState().entitlement;
        hasAccess = Boolean(local?.isActive);
        planName = local?.planName;
      }

      await loadUser();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plans-me"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-catalog"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-capabilities"] }),
        queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
      ]);

      if (!centralChecked) {
        setRefreshMessage({
          type: hasAccess ? "success" : "error",
          text: hasAccess
            ? `Local access refreshed${planName ? `: ${planName}` : ""}. Sign in again to recheck MCOM Central.`
            : "Your local access was refreshed, but MCOM Central could not be rechecked. Sign in again to sync your membership or access pass.",
        });
        return;
      }

      if (hasAccess) {
        setRefreshMessage({
          type: "success",
          text: planName
            ? `Access updated: ${planName}.`
            : "Your access is up to date.",
        });
      } else {
        setRefreshMessage({
          type: "error",
          text: "No active membership, plan or access pass was found. Choose an option below to continue.",
        });
      }
    } catch (err) {
      setRefreshMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Could not refresh your access. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-amber-900">
                {message.title}
              </h2>
              <p className="mt-1 text-sm text-amber-800/90">{message.body}</p>
              <p className="mt-2 text-[11px] text-amber-800/80">
                Refresh to recheck MCOM Central for an updated membership, plan
                or access pass.
              </p>
              {refreshMessage && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-1 text-xs font-medium ${
                    refreshMessage.type === "success"
                      ? "text-emerald-800"
                      : "text-amber-900"
                  }`}
                >
                  {refreshMessage.text}
                </p>
              )}
              {upgradeUrl && (
                <a
                  href={upgradeUrl}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                >
                  Manage your MCOM membership
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
            <AccessRefreshButton
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          </div>
        </div>
      )}

      <PlansExperience
        embedded
        accessRefresh={{
          onRefresh: handleRefresh,
          refreshing,
          message: refreshMessage,
        }}
      />
    </div>
  );
}
