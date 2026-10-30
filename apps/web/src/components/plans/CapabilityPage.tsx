import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { usePlanCapabilities } from "@/hooks/usePlanCapabilities";

/**
 * Page-level capability guard. Uses the locally cached snapshot first, so a
 * business with the feature sees the page instantly; the server still enforces
 * every mutation.
 */
export function CapabilityPage({
  feature,
  anyOf,
  title,
  children,
}: {
  feature?: string;
  anyOf?: string[];
  title?: string;
  children: ReactNode;
}) {
  const { can, isLoading } = usePlanCapabilities();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const allowed = feature ? can(feature) : (anyOf?.some((key) => can(key)) ?? true);

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {title ?? "This feature is not in your plan"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your current plan does not include this page. Upgrade your plan or buy an access pass to
          unlock it.
        </p>
        <Link
          to="/dashboard/plan"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700"
        >
          <Sparkles className="h-4 w-4" />
          View plans
        </Link>
      </div>
    </div>
  );
}
