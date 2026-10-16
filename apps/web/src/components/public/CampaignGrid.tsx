import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Megaphone, RotateCcw } from "lucide-react";
import { CampaignCardSkeleton } from "@/components/ui/Skeleton";
import { usePublicCampaigns } from "./usePublicCampaigns";
import { CampaignCard } from "./CampaignCard";

interface CampaignGridProps {
  /** Maximum number of campaigns to display. */
  limit?: number;
  /** Optional campaign mode filter (e.g. "donation"). */
  mode?: string;
  /** Copy shown when no campaigns are available. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Number of skeleton cards while loading. */
  skeletonCount?: number;
}

/**
 * Campaign grid with loading, empty and error states.
 * Tries the API first; falls back to demo campaigns if the backend is
 * unavailable so a section is never left blank.
 */
export function CampaignGrid({
  limit = 6,
  mode,
  emptyTitle = "No campaigns to show yet",
  emptyDescription = "No campaigns have been published here yet. Check back soon, or browse everything that is currently live.",
  skeletonCount = 6,
}: CampaignGridProps) {
  const { status, campaigns, load } = usePublicCampaigns({ mode, limit });

  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Loading campaigns">
        {Array.from({ length: Math.min(skeletonCount, limit) }).map((_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900 mb-1">Campaigns could not be loaded</h3>
        <p className="text-sm text-gray-600 mb-4">Something went wrong while loading campaigns. Please try again.</p>
        <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
        <Megaphone className="w-8 h-8 text-primary-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900 mb-1">{emptyTitle}</h3>
        <p className="text-sm text-gray-600 mb-4">{emptyDescription}</p>
        <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2">
          Browse campaigns
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {campaigns.map((c) => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </div>
  );
}
