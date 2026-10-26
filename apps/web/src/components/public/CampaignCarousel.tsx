import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Megaphone, RotateCcw } from "lucide-react";
import { CampaignCardSkeleton } from "@/components/ui/Skeleton";
import { usePublicCampaigns } from "./usePublicCampaigns";
import { CampaignCard } from "./CampaignCard";

interface CampaignCarouselProps {
  /** Optional campaign mode filter (e.g. "donation"). */
  mode?: string;
  /** Optional audience filter (business / consumer). */
  audience?: string;
  /** Maximum number of campaigns to load. */
  limit?: number;
  /** Number of card rows in the track. Defaults to two. */
  rows?: 1 | 2;
  /** Accessible label for the carousel region. */
  label?: string;
  /** Copy shown when there are no campaigns. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Slim empty state for compact, in-page sections. */
  compact?: boolean;
}

/* Slides horizontally (one card per row on mobile, two on tablet, four on
   desktop) and fills the configured number of rows. */
const TRACK_LAYOUTS = {
  1: "grid grid-flow-col grid-rows-1 auto-cols-[80%] sm:auto-cols-[calc(50%_-_0.5rem)] lg:auto-cols-[calc(25%_-_0.75rem)] gap-4",
  2: "grid grid-flow-col grid-rows-2 auto-cols-[80%] sm:auto-cols-[calc(50%_-_0.5rem)] lg:auto-cols-[calc(25%_-_0.75rem)] gap-4",
} as const;

/**
 * Horizontal campaign slider with loading, empty and error states.
 * Content fills exactly the configured number of rows; the track slides
 * with the arrows below it (and touch swipe on mobile).
 */
export function CampaignCarousel({
  mode,
  audience,
  limit = 12,
  rows = 2,
  label = "Featured campaigns",
  emptyTitle,
  emptyDescription,
  compact = false,
}: CampaignCarouselProps) {
  const { status, campaigns, load } = usePublicCampaigns({ mode, audience, limit });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const trackLayout = TRACK_LAYOUTS[rows];

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    setAtStart(true);
    setAtEnd(false);
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    const timer = window.setTimeout(updateArrows, 150);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
      window.clearTimeout(timer);
    };
  }, [campaigns, updateArrows]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };

  if (status === "loading") {
    return (
      <div className={trackLayout} aria-busy="true" aria-label="Loading campaigns">
        {Array.from({ length: rows === 1 ? Math.min(limit, 4) : 8 }).map((_, i) => (
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

  const filterActive = Boolean(mode || audience);

  if (campaigns.length === 0) {
    const title =
      emptyTitle ??
      (filterActive ? "No campaigns match this filter" : "No campaigns to show yet");
    const description =
      emptyDescription ??
      (filterActive
        ? "There are none of this type right now — try another filter, or browse everything that is currently live."
        : "No campaigns have been published here yet. Check back soon, or browse everything that is currently live.");

    if (compact) {
      return (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
          <Link
            to="/campaigns"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Browse all campaigns
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
        <Megaphone className="w-8 h-8 text-primary-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2">
          Browse campaigns
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const scrollable = !(atStart && atEnd);

  return (
    <div>
      <div
        ref={scrollerRef}
        className="overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label={`${label} slider`}
      >
        <div className={trackLayout}>
          {campaigns.map((c) => (
            <div key={c.id} className="snap-start">
              <CampaignCard campaign={c} />
            </div>
          ))}
        </div>
      </div>

      {scrollable && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            className="p-2.5 rounded-full border border-gray-200 bg-white/70 backdrop-blur-sm hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-white/70"
            aria-label="Previous campaigns"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            className="p-2.5 rounded-full border border-gray-200 bg-white/70 backdrop-blur-sm hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-white/70"
            aria-label="Next campaigns"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
