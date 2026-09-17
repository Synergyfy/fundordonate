import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { useAuthStore } from "@/stores/auth.store";
import { DEMO_CAMPAIGNS } from "@/data/demo";
import { HUB_LOCATIONS, getDemoCampaignsForLocation } from "@/data/hubActivation";
import { CampaignImageGallery } from "@/components/campaign/CampaignImageGallery";
import { CampaignTabs } from "@/components/campaign/CampaignTabs";
import { SocialShare } from "@/components/campaign/SocialShare";
import { QrShare } from "@/components/campaign/QrShare";
import { BookmarkButton } from "@/components/campaign/BookmarkButton";
import { CampaignAuthorCard } from "@/components/campaign/CampaignAuthorCard";
import { RelatedCampaigns } from "@/components/campaign/RelatedCampaigns";
import { DonationForm } from "@/components/campaign/DonationForm";
import { PledgeForm } from "@/components/campaign/PledgeForm";
import { ContributionTypeChoice, type ContributionType } from "@/components/campaign/ContributionTypeChoice";
import { TargetReachedBanner } from "@/components/campaign/TargetReachedBanner";
import { WhatHappensNext } from "@/components/campaign/WhatHappensNext";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock, ChevronRight } from "lucide-react";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  status: string;
  mode: string;
  featuredImage?: string;
  videoUrl?: string;
  platformFee?: number;
  settings: string;
  createdAt: string;
  ownerContribution?: number;
  campaignTarget?: number;
  author?: { id: string; firstName?: string; lastName?: string; avatar?: string; username: string };
  category?: { id: string; name: string; slug: string };
  images?: { id: string; url: string; alt?: string; order: number }[];
  rewards?: any[];
  tags?: { tag: { id: string; name: string; slug: string } }[];
  _count?: { donations: number; pledges: number; comments: number; bookmarks: number };
  parentId?: string;
  parentSlug?: string;
  parentTitle?: string;
  hierarchyLevel?: string | null;
  locationId?: string | null;
  location?: string;
  campaignType?: string | { id: string; name: string; slug: string; isOpportunity?: boolean; eligibleTiers?: string; eligibleLevels?: string; parentInitiative?: string } | null;
  participationTypes?: string;
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;
  isSelfFunding?: boolean;
  selfFundingLevel?: string;
  children?: { id: string; slug: string; title: string; shortDescription?: string; goalAmount: number; raisedAmount: number; deadline: string; mode: string; featuredImage?: string; _count?: { donations: number; pledges: number } }[];
}

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

function getCountdownLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "Campaign ended";
  if (daysLeft === 1) return "Ends tomorrow";
  if (daysLeft <= 3) return "Ending soon";
  return `${daysLeft} days left`;
}

export function CampaignDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore((s) => s.user);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState<ContributionType | null>(null);

  // Hooks must be called unconditionally — before any early returns
  const countdown = useCountdown(campaign?.deadline || new Date().toISOString());
  const isCountdownActive = campaign ? (campaign.status !== "completed" && campaign.status !== "expired" && campaign.status !== "cancelled" && getDaysRemaining(campaign.deadline) > 0) : false;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    campaignApi
      .getBySlug(slug)
      .then(setCampaign)
      .catch(() => {
        // Try DEMO_CAMPAIGNS first, then search all hubActivation campaigns
        const demo = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
        if (demo) {
          setCampaign({
            id: demo.id,
            slug: demo.slug,
            title: demo.title,
            shortDescription: demo.shortDescription,
            description: demo.shortDescription,
            goalAmount: demo.goalAmount,
            raisedAmount: demo.raisedAmount,
            deadline: demo.deadline,
            status: "published",
            mode: demo.mode,
            featuredImage: demo.featuredImage,
            settings: "{}",
            createdAt: new Date().toISOString(),
            author: { id: "demo-user", firstName: demo.author.firstName, lastName: demo.author.lastName, username: `${demo.author.firstName.toLowerCase()}-${demo.author.lastName.toLowerCase()}` },
            category: demo.category ? { id: `cat-${demo.category.slug}`, name: demo.category.name, slug: demo.category.slug } : undefined,
            tags: Array.isArray(demo.tags) ? demo.tags.map((t) => ({ tag: { id: `tag-${t}`, name: t, slug: t } })) : undefined,
            _count: { donations: demo._count?.donations || 0, pledges: demo._count?.pledges || 0, comments: 0, bookmarks: 0 },
            parentId: demo.parentId,
            parentSlug: demo.parentSlug,
            parentTitle: demo.parentTitle,
            location: demo.location,
            campaignType: demo.campaignType,
            participationTypes: demo.participationTypes ? JSON.stringify(demo.participationTypes) : undefined,
            backerTiersEnabled: demo.backerTiersEnabled,
            recurringEnabled: demo.recurringEnabled,
            isSelfFunding: demo.isSelfFunding,
            selfFundingLevel: demo.selfFundingLevel,
            ownerContribution: demo.ownerContribution,
            campaignTarget: demo.campaignTarget,
            children: DEMO_CAMPAIGNS.filter(c => c.parentId === demo.id).map(c => ({
              id: c.id,
              slug: c.slug,
              title: c.title,
              shortDescription: c.shortDescription,
              goalAmount: c.goalAmount,
              raisedAmount: c.raisedAmount,
              deadline: c.deadline,
              mode: c.mode,
              featuredImage: c.featuredImage,
              _count: { donations: c._count?.donations || 0, pledges: c._count?.pledges || 0 },
            })),
          } as Campaign);
        } else {
          // Search all hubActivation campaigns
          let found = false;
          for (const location of HUB_LOCATIONS) {
            const locationCampaigns = getDemoCampaignsForLocation(location);
            const match = locationCampaigns.find((c) => c.slug === slug);
            if (match) {
              setCampaign({
                id: match.id,
                slug: match.slug,
                title: match.title,
                shortDescription: match.shortDescription,
                description: match.shortDescription,
                goalAmount: match.goalAmount,
                raisedAmount: match.raisedAmount,
                deadline: match.deadline,
                status: "published",
                mode: match.mode,
                featuredImage: match.featuredImage,
                media: match.media,
                settings: "{}",
                createdAt: new Date().toISOString(),
                author: { id: "demo-user", firstName: match.author.firstName, lastName: match.author.lastName, username: `${match.author.firstName.toLowerCase()}-${match.author.lastName.toLowerCase()}` },
                category: match.category ? { id: `cat-${match.category.slug}`, name: match.category.name, slug: match.category.slug } : undefined,
                tags: Array.isArray(match.tags) ? match.tags.map((t: string) => ({ tag: { id: `tag-${t}`, name: t, slug: t } })) : undefined,
                _count: { donations: match._count?.donations || 0, pledges: match._count?.pledges || 0, comments: 0, bookmarks: 0 },
                parentId: match.parentId,
                parentSlug: match.parentSlug,
                parentTitle: match.parentTitle,
                location: match.location,
                campaignType: match.campaignType,
                participationTypes: match.participationTypes ? JSON.stringify(match.participationTypes) : undefined,
                backerTiersEnabled: match.backerTiersEnabled,
                isSelfFunding: match.isSelfFunding,
                selfFundingLevel: match.selfFundingLevel,
              } as Campaign);
              found = true;
              break;
            }
          }
          if (!found) {
            setError("Campaign not found");
          }
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-page py-8">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-3/4 rounded bg-gray-200" />
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="aspect-video rounded-xl bg-gray-200" />
              </div>
              <div className="space-y-4">
                <div className="h-48 rounded-xl bg-gray-200" />
                <div className="h-32 rounded-xl bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <p className="mt-4 text-lg text-gray-600">{error || "Campaign not found"}</p>
          <Link to="/campaigns" className="btn-primary mt-6 inline-block">
            Browse Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage(campaign.raisedAmount, campaign.goalAmount);
  const daysLeft = getDaysRemaining(campaign.deadline);
  const backers = (campaign._count?.donations || 0) + (campaign._count?.pledges || 0);
  const isEnded = campaign.status === "completed" || campaign.status === "expired" || campaign.status === "cancelled";
  const remaining = Math.max(campaign.goalAmount - campaign.raisedAmount, 0);
  const countdownLabel = getCountdownLabel(daysLeft);

  const ctaLabel = campaign.mode === "fund" ? "Fund This Project" : campaign.mode === "sponsor" ? "Become a Partner" : "Donate Now";
  const ctaColor = campaign.mode === "fund"
    ? "bg-primary-600 hover:bg-primary-700"
    : campaign.mode === "sponsor"
    ? "bg-amber-500 hover:bg-amber-600"
    : "bg-secondary-500 hover:bg-secondary-600";
  const contributorLabel = campaign.mode === "fund" ? "Backers" : campaign.mode === "sponsor" ? "Partners" : "Donors";

  let faqs: { question: string; answer: string }[] = [];
  try {
    const settings = JSON.parse(campaign.settings || "{}");
    if (settings.faqs && Array.isArray(settings.faqs)) {
      faqs = settings.faqs.map((f: any) => ({
        question: f.question || f.q || "",
        answer: f.answer || f.a || "",
      })).filter((f: { question: string; answer: string }) => f.question && f.answer);
    }
  } catch { /* ignore */ }

  const formatCurrency = (pence: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-page py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/campaigns" className="hover:text-gray-700">Campaigns</Link>
            <ChevronRight className="h-3 w-3" />
            {campaign.category && (
              <>
                <Link to={`/campaigns?category=${campaign.category.slug}`} className="hover:text-gray-700">
                  {campaign.category.name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            <span className="text-gray-900 font-medium truncate">{campaign.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-page py-8">
        {/* Gallery + Campaign Timeline (desktop: side by side, mobile: stacked) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Gallery - 2/3 on desktop */}
          <div className="lg:col-span-2">
            <CampaignImageGallery
              featuredImage={campaign.featuredImage || undefined}
              images={campaign.images || []}
              title={campaign.title}
            />
          </div>

          {/* Campaign Timeline - 1/3 on desktop, after gallery on mobile */}
          <div className="space-y-4">
            {/* Parent Programme Info */}
            {campaign.parentSlug && campaign.parentTitle && (
              <div className="rounded-xl bg-primary-50 border border-primary-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Part of Programme</span>
                </div>
                <Link
                  to={`/campaigns/${campaign.parentSlug}`}
                  className="text-sm font-medium text-primary-800 hover:text-primary-900 hover:underline"
                >
                  {campaign.parentTitle}
                </Link>
              </div>
            )}

            {/* Campaign Timeline Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-900">Campaign Timeline</h3>
              </div>

              {/* Goal Progress */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(campaign.raisedAmount)}
                  </span>
                  <span className="text-sm text-gray-500">
                    raised of {formatCurrency(campaign.goalAmount)} goal
                  </span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{progress}% funded</span>
                  {remaining > 0 ? (
                    <span className="text-gray-500">{formatCurrency(remaining)} to go</span>
                  ) : (
                    <span className="font-medium text-secondary-600">Fully funded!</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-xl font-bold text-gray-900">{progress}%</span>
                  <span className="block text-xs text-gray-500">Funded</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{backers}</span>
                  <span className="block text-xs text-gray-500">{contributorLabel}</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{daysLeft}</span>
                  <span className="block text-xs text-gray-500">Days Left</span>
                </div>
              </div>

              {/* Countdown */}
              {isCountdownActive && (
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    {[
                      { label: "DAYS", value: countdown.days },
                      { label: "HOURS", value: countdown.hours },
                      { label: "MIN", value: countdown.minutes },
                      { label: "SEC", value: countdown.seconds },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-xl bg-gray-900 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{String(item.value).padStart(2, "0")}</span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 mt-1 uppercase">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-center text-xs text-gray-500">{countdownLabel}</p>
                </div>
              )}

              {/* Ended State */}
              {isEnded && (
                <div className="mb-4 rounded-lg bg-gray-100 p-3 text-center">
                  <span className="text-sm font-medium text-gray-600">Campaign ended</span>
                </div>
              )}

              {/* Target Reached Banner */}
              {isEnded && campaign.raisedAmount >= campaign.goalAmount && (
                <div className="mb-4">
                  <TargetReachedBanner
                    campaignTitle={campaign.title}
                    goalAmount={campaign.goalAmount}
                    raisedAmount={campaign.raisedAmount}
                    spilloverAction={null}
                    seasonName={null}
                  />
                </div>
              )}

              {/* What Happens Next */}
              {!isEnded && (
                <div className="mb-4">
                  <WhatHappensNext
                    spilloverAction={null}
                    goalAmount={campaign.goalAmount}
                    seasonName={null}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location}
                  />
                </div>
              )}

              {/* CTA Button */}
              {isEnded ? (
                <button disabled className="w-full rounded-xl bg-gray-200 py-3.5 text-sm font-semibold text-gray-500 cursor-not-allowed">
                  Campaign Ended
                </button>
              ) : (
                <a href="#contribute" className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white transition-colors ${ctaColor}`}>
                  {ctaLabel}
                </a>
              )}

              {/* Share & Bookmark */}
              <div className="mt-4 flex items-center justify-between">
                <SocialShare
                  title={campaign.title}
                  slug={campaign.slug}
                  shortDescription={campaign.shortDescription || undefined}
                />
                <div className="flex items-center gap-2">
                  <QrShare title={campaign.title} slug={campaign.slug} />
                  <BookmarkButton
                    campaignId={campaign.id}
                    initialCount={campaign._count?.bookmarks || 0}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.tags.map((t) => (
                    <Link
                      key={t.tag.id}
                      to={`/campaigns?tag=${t.tag.slug}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                    >
                      {t.tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Card */}
            {campaign.author && (
              <CampaignAuthorCard author={campaign.author} />
            )}
          </div>
        </div>

        {/* Title & Meta */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                campaign.mode === "fund"
                  ? "bg-primary-100 text-primary-700"
                  : campaign.mode === "sponsor"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-secondary-100 text-secondary-700"
              }`}
            >
              {campaign.mode === "fund" ? "Fund" : campaign.mode === "sponsor" ? "Sponsor" : "Donate"}
            </span>
            {campaign.category && (
              <span className="text-sm text-gray-500">{campaign.category.name}</span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{campaign.title}</h1>

          {/* Parent Campaign Link */}
          {campaign.parentSlug && campaign.parentTitle && (
            <div className="mt-3">
              <Link
                to={`/campaigns/${campaign.parentSlug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Part of: {campaign.parentTitle}
              </Link>
            </div>
          )}

          {/* Self-Funding Badge */}
          {campaign.isSelfFunding && campaign.selfFundingLevel && (
            <div className="mt-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                campaign.selfFundingLevel === 'platinum' ? 'bg-purple-100 text-purple-700' :
                campaign.selfFundingLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                campaign.selfFundingLevel === 'silver' ? 'bg-gray-100 text-gray-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {campaign.selfFundingLevel.charAt(0).toUpperCase() + campaign.selfFundingLevel.slice(1)} Self-Funding
                {campaign.ownerContribution ? ` — Owner contributed ${formatCurrency(campaign.ownerContribution)}` : ''}
              </span>
            </div>
          )}

          {/* Campaign Type & Participation */}
          {campaign.campaignType && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {typeof campaign.campaignType === 'string' ? campaign.campaignType : campaign.campaignType.name}
              </span>
              {campaign.participationTypes && (() => {
                try {
                  const types = JSON.parse(campaign.participationTypes);
                  if (Array.isArray(types) && types.length > 0) {
                    return types.map((t: string) => (
                      <span key={t} className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t === 'fund' ? 'bg-primary-100 text-primary-700' :
                        t === 'sponsor' ? 'bg-amber-100 text-amber-700' :
                        'bg-secondary-100 text-secondary-700'
                      }`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    ));
                  }
                } catch { return null; }
                return null;
              })()}
              {campaign.backerTiersEnabled && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  Backer Tiers
                </span>
              )}
            </div>
          )}

          {/* Creator */}
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            {campaign.author && (
              <div className="flex items-center gap-2">
                {campaign.author.avatar ? (
                  <img src={campaign.author.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {(campaign.author.firstName || campaign.author.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  by <span className="font-medium text-gray-900">{campaign.author.firstName || campaign.author.username}</span>
                </span>
              </div>
            )}
          </div>

          {campaign.shortDescription && (
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">{campaign.shortDescription}</p>
          )}
        </div>

        {/* Tabs */}
        <CampaignTabs
          description={campaign.description || undefined}
          shortDescription={campaign.shortDescription || undefined}
          rewards={campaign.rewards || []}
          faqs={faqs}
          campaignId={campaign.id}
          isAuthor={user?.id === campaign.author?.id}
          mode={campaign.mode}
          goalAmount={campaign.goalAmount}
          raisedAmount={campaign.raisedAmount}
          deadline={campaign.deadline}
        />

        {/* Child Campaigns */}
        {campaign.children && campaign.children.length > 0 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Campaigns in this Programme
              <span className="ml-2 text-sm font-normal text-gray-500">({campaign.children.length})</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {campaign.children.map((child) => {
                const childProgress = child.goalAmount > 0 ? Math.min(Math.round((child.raisedAmount / child.goalAmount) * 100), 100) : 0;
                const childBackers = (child._count?.donations || 0) + (child._count?.pledges || 0);
                return (
                  <Link
                    key={child.id}
                    to={`/campaigns/${child.slug}`}
                    className="group block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-200 hover:shadow-md"
                  >
                    <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{child.title}</h4>
                    {child.shortDescription && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{child.shortDescription}</p>
                    )}
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                          style={{ width: `${childProgress}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{childProgress}% funded</span>
                        <span>{childBackers} backers</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Related Campaigns */}
      <RelatedCampaigns
        campaignId={campaign.id}
        categoryId={campaign.category?.id}
        currentSlug={campaign.slug}
      />

      {/* Donation/Pledge Form */}
      {!isEnded && (
        <div id="contribute" className="border-t border-gray-200 py-12 scroll-mt-20">
          <div className="container-page max-w-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {campaign.mode === "fund" ? "Fund This Project" : campaign.mode === "sponsor" ? "Become a Partner" : "Donate Now"}
              </h2>
              <p className="mt-1 text-gray-500">
                {campaign.mode === "fund"
                  ? "Support this local initiative and help bring it to life"
                  : campaign.mode === "sponsor"
                  ? "Partner with this campaign and receive Backer Status"
                  : "Your contribution helps strengthen your local community hub"}
              </p>
            </div>

            {campaign.hierarchyLevel && (
              <div className="mb-4 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  <span>{campaign.hierarchyLevel === "national" ? "🇬🇧" : campaign.hierarchyLevel === "city" ? "🏙️" : campaign.hierarchyLevel === "borough" ? "🏘️" : campaign.hierarchyLevel === "high_street" ? "🛒" : "🏢"}</span>
                  <span className="capitalize">{campaign.hierarchyLevel.replace("_", " ")} Campaign</span>
                  {campaign.location && <span className="text-gray-400">· {campaign.location}</span>}
                </span>
              </div>
            )}

            {!contributionType ? (
              <ContributionTypeChoice
                campaignTitle={campaign.title}
                locationName={campaign.location || undefined}
                hasFoundingProgramme={!!campaign.locationId}
                foundingRemaining={undefined}
                onSelect={setContributionType}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContributionType(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ← Change participation type
                  </button>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs font-medium text-gray-600">
                    Contributing as: {contributionType === "founding_member" ? "⭐ Founding Member" : "🤝 Backer"}
                  </span>
                </div>
                {campaign.mode === "donation" ? (
                  <DonationForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType={contributionType}
                  />
                ) : (
                  <PledgeForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    rewards={campaign.rewards || []}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType={contributionType}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
