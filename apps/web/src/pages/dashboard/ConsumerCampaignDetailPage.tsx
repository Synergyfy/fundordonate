import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Crown, HandHeart } from "lucide-react";
import { campaignApi } from "@/services/campaign.service";
import { useAuthStore } from "@/stores/auth.store";
import { DEMO_CAMPAIGNS, type DemoCampaign } from "@/data/demo";
import { HUB_LOCATIONS, getDemoCampaignsForLocation } from "@/data/hubActivation";
import { getAdminCampaignBySlug, adminCampaignToHubCampaign } from "@/data/adminCampaigns";
import { resolveCampaignForDetail } from "@/data/consumerExploreData";
import { getConsumerCommunity } from "@/data/consumerHomeData";
import {
  CampaignDetailBody,
  type DetailCampaign,
} from "@/components/campaign/CampaignDetailBody";
import { RelatedCampaigns } from "@/components/campaign/RelatedCampaigns";

function demoToDetail(c: DemoCampaign, statusOverride?: string): DetailCampaign {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    shortDescription: c.shortDescription,
    description: c.shortDescription,
    goalAmount: c.goalAmount,
    raisedAmount: c.raisedAmount,
    deadline: c.deadline,
    status: statusOverride ?? "published",
    mode: c.mode,
    featuredImage: c.featuredImage,
    settings: "{}",
    createdAt: new Date().toISOString(),
    author: {
      id: "demo-user",
      firstName: c.author.firstName,
      lastName: c.author.lastName,
      username: `${c.author.firstName.toLowerCase()}-${c.author.lastName.toLowerCase()}`,
    },
    category: c.category
      ? { id: `cat-${c.category.slug}`, name: c.category.name, slug: c.category.slug }
      : undefined,
    tags: Array.isArray(c.tags)
      ? c.tags.map((t) => ({ tag: { id: `tag-${t}`, name: t, slug: t } }))
      : undefined,
    _count: {
      donations: c._count?.donations || 0,
      pledges: c._count?.pledges || 0,
      comments: 0,
      bookmarks: 0,
    },
    parentId: c.parentId,
    parentSlug: c.parentSlug,
    parentTitle: c.parentTitle,
    location: c.location,
    campaignType: c.campaignType,
    participationTypes: c.participationTypes
      ? JSON.stringify(c.participationTypes)
      : undefined,
    backerTiersEnabled: c.backerTiersEnabled,
    recurringEnabled: c.recurringEnabled,
    isSelfFunding: c.isSelfFunding,
    selfFundingLevel: c.selfFundingLevel,
    ownerContribution: c.ownerContribution,
    campaignTarget: c.campaignTarget,
    children: DEMO_CAMPAIGNS.filter((x) => x.parentId === c.id).map((child) => ({
      id: child.id,
      slug: child.slug,
      title: child.title,
      shortDescription: child.shortDescription,
      goalAmount: child.goalAmount,
      raisedAmount: child.raisedAmount,
      deadline: child.deadline,
      mode: child.mode,
      featuredImage: child.featuredImage,
      _count: { donations: child._count?.donations || 0, pledges: child._count?.pledges || 0 },
    })),
  };
}

export function ConsumerCampaignDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [campaign, setCampaign] = useState<DetailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolved = useMemo(() => (slug ? resolveCampaignForDetail(slug) : null), [slug]);

  useEffect(() => {
    if (!slug) return;
    window.localStorage.setItem("lastViewedCampaign", slug);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const adminCampaign = getAdminCampaignBySlug(slug);
    if (adminCampaign) {
      setCampaign(demoToDetail(adminCampaignToHubCampaign(adminCampaign), adminCampaign.status));
      setLoading(false);
      return;
    }

    setCampaign(null);
    setLoading(true);
    setError(null);

    campaignApi
      .getBySlug(slug)
      .then(setCampaign)
      .catch(() => {
        const demo = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
        if (demo) {
          setCampaign(demoToDetail(demo));
          return;
        }
        for (const location of HUB_LOCATIONS) {
          const locationCampaigns = getDemoCampaignsForLocation(location);
          const match = locationCampaigns.find((c) => c.slug === slug);
          if (match) {
            setCampaign(demoToDetail(match));
            return;
          }
        }
        const streetMatch = resolveCampaignForDetail(slug);
        if (streetMatch) {
          setCampaign(demoToDetail(streetMatch.campaign));
          return;
        }
        setError("Campaign not found");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/consumer/explore");
  };

  if (loading) {
    return (
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
    );
  }

  if (error || !campaign) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-600">{error || "Campaign not found"}</p>
        <Link
          to="/consumer/explore"
          className="mt-6 inline-flex rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const community = getConsumerCommunity();
  const hierarchy = resolved?.hierarchy;
  const isFounding =
    campaign.category?.slug === "founding-membership" ||
    campaign.campaignType === "Founding Membership";
  const isEnded =
    campaign.status === "completed" ||
    campaign.status === "expired" ||
    campaign.status === "cancelled" ||
    new Date(campaign.deadline).getTime() <= Date.now();

  const handleParticipate = () => {
    if (isEnded) return;
    if (isFounding) {
      navigate(
        `/uk-hub-activation/${hierarchy?.citySlug ?? community.citySlug}/consumer/${
          hierarchy?.areaSlug ?? community.areaSlug
        }/${hierarchy?.streetSlug ?? community.streetSlug}/join/founding-member-choice?campaign=${
          campaign.slug
        }`,
      );
    } else {
      navigate(`/contribute/${campaign.slug}`);
    }
  };

  return (
    <div className="pb-4">
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <CampaignDetailBody
        campaign={campaign}
        user={user}
        ctaLabel={isFounding ? "Become a Founding Member" : "Back This Campaign"}
        onCtaClick={handleParticipate}
      />

      <RelatedCampaigns
        campaignId={campaign.id}
        categoryId={campaign.category?.id}
        currentSlug={campaign.slug}
      />

      <div className="sticky bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-30 -mx-4 mt-6 flex items-center justify-between gap-3 rounded-t-xl border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:bottom-0 lg:-mx-6 lg:rounded-t-none lg:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{campaign.title}</p>
          <p className="text-xs text-gray-500">
            {campaign.mode === "fund" ? "Fund" : "Donate"} ·{" "}
            {isEnded ? "Ended" : "Active"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleParticipate}
          disabled={isEnded}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
            isEnded
              ? "cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-primary-600 hover:bg-primary-700"
          }`}
        >
          {isFounding ? <Crown className="h-4 w-4" /> : <HandHeart className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {isEnded
              ? "Campaign Ended"
              : isFounding
                ? "Become a Founding Member"
                : "Back This Campaign"}
          </span>
          <span className="sm:hidden">
            {isEnded ? "Ended" : isFounding ? "Founding Member" : "Back Campaign"}
          </span>
        </button>
      </div>
    </div>
  );
}
