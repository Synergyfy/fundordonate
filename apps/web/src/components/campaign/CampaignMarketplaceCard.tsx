import { Link } from "react-router-dom";

function getProgressPercentage(raised: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

interface Props {
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
    location?: string;
    author?: { firstName?: string; lastName?: string; avatar?: string; username?: string };
    category?: { name: string; slug: string };
    _count?: { donations: number; pledges: number; comments: number };
    membership?: boolean;
    // Campaign Hierarchy
    parentId?: string;
    parentSlug?: string;
    parentTitle?: string;
    // Campaign Context
    campaignType?: string;
    // Self-Funding
    isSelfFunding?: boolean;
    selfFundingLevel?: string;
  };
  index?: number;
}

export function CampaignMarketplaceCard({ campaign }: Props) {
  const progress = getProgressPercentage(campaign.raisedAmount, campaign.goalAmount);
  const daysLeft = getDaysRemaining(campaign.deadline);
  const backers = (campaign._count?.donations || 0) + (campaign._count?.pledges || 0);
  const remaining = Math.max(campaign.goalAmount - campaign.raisedAmount, 0);
  const authorName = campaign.author
    ? `${campaign.author.firstName || ""} ${campaign.author.lastName || ""}`.trim() || campaign.author.username || "Anonymous"
    : "Anonymous";

  const modeLabel = campaign.mode === "fund" ? "FUND" : campaign.mode === "sponsor" ? "SPONSOR" : "DONATE";
  const ctaLabel = campaign.mode === "fund" ? "Fund This Project" : campaign.mode === "sponsor" ? "Become a Partner" : "Donate Now";
  const contributorLabel = campaign.mode === "fund" ? "Backers" : campaign.mode === "sponsor" ? "Partners" : "Donors";
  const modeColor = campaign.mode === "fund"
    ? "bg-primary-500/90 text-white"
    : campaign.mode === "sponsor"
    ? "bg-amber-500/90 text-white"
    : "bg-secondary-500/90 text-white";
  const modeBg = campaign.mode === "fund"
    ? "bg-primary-50 text-primary-700"
    : campaign.mode === "sponsor"
    ? "bg-amber-50 text-amber-700"
    : "bg-secondary-50 text-secondary-700";

  return (
    <Link
      to={`/campaigns/${campaign.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
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
        <div className="absolute left-3 top-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur ${modeColor}`}>
            {modeLabel}
          </span>
        </div>

        {/* Location */}
        {campaign.location && (
          <div className="absolute left-3 top-12">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {campaign.location}
            </span>
          </div>
        )}

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
        {/* Category & Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {campaign.category && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${modeBg}`}>
              {campaign.category.name}
            </span>
          )}
          {campaign.parentTitle && (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
              Part of: {campaign.parentTitle}
            </span>
          )}
          {campaign.isSelfFunding && campaign.selfFundingLevel && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              campaign.selfFundingLevel === 'platinum' ? 'bg-purple-100 text-purple-700' :
              campaign.selfFundingLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' :
              campaign.selfFundingLevel === 'silver' ? 'bg-gray-100 text-gray-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {campaign.selfFundingLevel.charAt(0).toUpperCase() + campaign.selfFundingLevel.slice(1)} Self-Fund
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {campaign.title}
        </h3>

        {/* Description */}
        {campaign.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{campaign.shortDescription}</p>
        )}

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Funding Stats */}
        <div className="mt-2.5 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(campaign.raisedAmount)}</span>
            <span className="ml-1 text-xs text-gray-500">raised</span>
          </div>
          <span className="text-sm font-semibold text-secondary-600">{progress}%</span>
        </div>

        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>{backers} {contributorLabel.toLowerCase()}</span>
          {remaining > 0 ? (
            <span>{formatCurrency(remaining)} left</span>
          ) : (
            <span className="font-medium text-secondary-600">Fully funded</span>
          )}
        </div>

        {/* Author & CTA */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            {campaign.author?.avatar ? (
              <img src={campaign.author.avatar} alt={authorName} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-600">{authorName}</span>
          </div>
          <span className={`text-xs font-semibold ${
            campaign.mode === "fund" ? "text-primary-600" : campaign.mode === "sponsor" ? "text-amber-600" : "text-secondary-600"
          }`}>
            {ctaLabel} →
          </span>
        </div>
      </div>
    </Link>
  );
}
