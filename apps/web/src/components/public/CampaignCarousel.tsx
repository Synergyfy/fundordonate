import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Megaphone, RotateCcw } from "lucide-react";
import { CampaignCardSkeleton } from "@/components/ui/Skeleton";
import { usePublicCampaigns } from "./usePublicCampaigns";
import { CampaignCard } from "./CampaignCard";

interface CampaignCarouselProps {
  /** Optional campaign mode filter (e.g. "donation"). */
  mode?: string;
  /** Maximum number of campaigns to load. */
  limit?: number;
}

/* Always exactly two rows; slides horizontally (one card per row on mobile,
   two on tablet, four on desktop). */
const TRACK_LAYOUT =
  "grid grid-flow-col grid-rows-2 auto-cols-[80%] sm:auto-cols-[calc(50%_-_0.5rem)] lg:auto-cols-[calc(25%_-_0.75rem)] gap-4";

/**
 * Two-row horizontal campaign slider with loading, empty and error states.
 * Content always fills exactly two rows; the track slides with the arrows
 * below it (and touch swipe on mobile).
 */
export function CampaignCarousel({ mode, limit = 12 }: CampaignCarouselProps) {
  const { status, campaigns, load } = usePublicCampaigns({ mode, limit, demoAll: true });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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
      <div className={TRACK_LAYOUT} aria-busy="true" aria-label="Loading campaigns">
        {Array.from({ length: 8 }).map((_, i) => (
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

  const filterActive = Boolean(mode);

  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
        <Megaphone className="w-8 h-8 text-primary-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900 mb-1">
          {filterActive ? "No campaigns match this filter" : "No campaigns to show yet"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {filterActive
            ? "There are none of this type right now — try another filter, or browse everything that is currently live."
            : "No campaigns have been published here yet. Check back soon, or browse everything that is currently live."}
        </p>
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
        aria-label="Featured campaigns slider"
      >
        <div className={TRACK_LAYOUT}>
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
