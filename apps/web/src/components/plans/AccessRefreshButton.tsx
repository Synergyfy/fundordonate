import { RefreshCw } from "lucide-react";

/**
 * Small icon-only refresh control used next to the current access summary.
 * Rechecks MCOM Central and the local plan catalogue for changed access.
 */
export function AccessRefreshButton({
  onRefresh,
  refreshing,
  className = "",
}: {
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      title="Recheck MCOM Central for a new membership, plan or access pass"
      aria-label={refreshing ? "Checking access" : "Refresh access"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
    </button>
  );
}
