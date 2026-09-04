import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

function getProgressPercentage(raised: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

function getDaysRemaining(deadline: Date | string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  mode: string;
  featuredImage?: string;
  author?: { firstName?: string; lastName?: string; avatar?: string; username: string };
  category?: { name: string; slug: string };
  _count?: { donations: number; pledges: number; comments: number };
}

interface Props {
  campaigns: Campaign[];
}

export function CampaignSlider({ campaigns }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {campaigns.map((campaign) => {
          const progress = getProgressPercentage(campaign.raisedAmount, campaign.goalAmount);
          const daysLeft = getDaysRemaining(campaign.deadline);
          const backers = (campaign._count?.donations || 0) + (campaign._count?.pledges || 0);
          const authorName = campaign.author
            ? `${campaign.author.firstName || ""} ${campaign.author.lastName || ""}`.trim() || campaign.author.username
            : "Anonymous";

          return (
            <Link
              key={campaign.id}
              to={`/campaigns/${campaign.slug}`}
              className="group w-[350px] min-w-[350px] snap-start overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                {campaign.featuredImage ? (
                  <img
                    src={campaign.featuredImage}
                    alt={campaign.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur ${
                      campaign.mode === "fund"
                        ? "bg-primary-500/90 text-white"
                        : campaign.mode === "sponsor"
                        ? "bg-amber-500/90 text-white"
                        : "bg-secondary-500/90 text-white"
                    }`}
                  >
                    {campaign.mode === "fund" ? "Fund" : campaign.mode === "sponsor" ? "Sponsor" : "Donate"}
                  </span>
                </div>
                {daysLeft > 0 && (
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                      {daysLeft}d left
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {campaign.category && (
                  <span className="text-xs font-medium text-primary-600">{campaign.category.name}</span>
                )}
                <h3 className="mt-1 line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-primary-600">
                  {campaign.title}
                </h3>
                {campaign.shortDescription && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{campaign.shortDescription}</p>
                )}

                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-gray-900">${formatNumber(campaign.raisedAmount)}</span>
                    <span className="ml-1 text-gray-500">raised</span>
                  </div>
                  <span className="font-bold text-primary-600">{progress}%</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{backers} backer{backers !== 1 ? "s" : ""}</span>
                  <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                  {campaign.author?.avatar ? (
                    <img src={campaign.author.avatar} alt={authorName} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-gray-600">by {authorName}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
