import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { usePlanCapabilities } from "@/hooks/usePlanCapabilities";

/**
 * Hide/disable a feature based on the user's effective plan capabilities.
 * The API enforces the same gate, so this is purely a UX layer.
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
  label,
}: {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  label?: string;
}) {
  const { can } = usePlanCapabilities();
  if (can(feature)) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
      <Lock className="mx-auto mb-2 h-5 w-5 text-amber-600" />
      <p className="text-sm font-semibold text-amber-900">
        {label ?? "This feature"} is not included in your current plan
      </p>
      {showUpgrade && (
        <Link
          to="/dashboard/plan"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Compare plans
        </Link>
      )}
    </div>
  );
}
