import { Link } from "react-router-dom";
import { getCampaignCardAriaLabel } from "@/utils/accessibility";

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

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

interface CampaignCardProps {
  campaign: {
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
    hierarchyLevel?: string | null;
    location?: string;
    isSelfFunding?: boolean;
    selfFundingLevel?: string;
    creatorType?: string;
    _count?: { donations: number; pledges: number; comments: number };
  };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = getProgressPercentage(campaign.raisedAmount, campaign.goalAmount);
  const daysLeft = getDaysRemaining(campaign.deadline);
  const backers = (campaign._count?.donations || 0) + (campaign._count?.pledges || 0);
  const authorName = campaign.author
    ? `${campaign.author.firstName || ""} ${campaign.author.lastName || ""}`.trim() || campaign.author.username
    : "Anonymous";

  const modeLabel = campaign.mode === "fund" ? "Fund" : campaign.mode === "sponsor" ? "Sponsor" : "Donate";
  const modeColor = campaign.mode === "fund"
    ? "bg-primary-500/90 text-white"
    : campaign.mode === "sponsor"
    ? "bg-amber-500/90 text-white"
    : "bg-secondary-500/90 text-white";

  const ariaLabel = getCampaignCardAriaLabel(campaign);

  return (
    <Link
      to={`/campaigns/${campaign.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
      aria-label={ariaLabel}
      role="article"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50">
        {campaign.featuredImage ? (
          <img
            src={campaign.featuredImage}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-12 w-12 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Mode Badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur ${modeColor}`}>
            {modeLabel}
          </span>
          {campaign.hierarchyLevel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700 backdrop-blur">
              <span>{campaign.hierarchyLevel === "national" ? "🇬🇧" : campaign.hierarchyLevel === "city" ? "🏙️" : campaign.hierarchyLevel === "borough" ? "🏘️" : campaign.hierarchyLevel === "high_street" ? "🛒" : "🏢"}</span>
              <span className="capitalize">{campaign.hierarchyLevel.replace("_", " ")}</span>
            </span>
          )}
          {campaign.creatorType === "business" && (
            <span className="inline-flex items-center rounded-full bg-blue-100/90 px-2 py-0.5 text-[10px] font-bold text-blue-700 backdrop-blur">
              Business
            </span>
          )}
        </div>

        {/* Days Left */}
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
        {/* Category & Borough */}
        <div className="flex items-center gap-2">
          {campaign.category && (
            <span className="text-xs font-medium text-primary-600">{campaign.category.name}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {campaign.title}
        </h3>

        {/* Description */}
        {campaign.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{campaign.shortDescription}</p>
        )}

        {/* Progress Bar */}
        <div className="mt-3">
          <div
            className="h-2 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% of £${(campaign.goalAmount / 100).toLocaleString()} goal reached`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-2.5 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(campaign.raisedAmount)}</span>
            <span className="ml-1 text-xs text-gray-500">raised</span>
          </div>
          <span className="text-sm font-semibold text-secondary-600">{progress}%</span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
          <span>{backers} backer{backers !== 1 ? "s" : ""}</span>
          <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>
        </div>

        {/* Founding Programme Indicator */}
        {(campaign as any).participationTypes?.includes("founding") && (
          <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-center">
            <span className="text-[10px] font-medium text-amber-700">⭐ Founding Programme Available</span>
          </div>
        )}

        {/* Author */}
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          {campaign.author?.avatar ? (
            <img
              src={campaign.author.avatar}
              alt={authorName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-600">{authorName}</span>
        </div>
      </div>
    </Link>
  );
}
