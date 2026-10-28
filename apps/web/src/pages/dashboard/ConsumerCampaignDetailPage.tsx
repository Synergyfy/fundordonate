import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Crown, HandHeart } from "lucide-react";
import { campaignApi } from "@/services/campaign";
import { useAuthStore } from "@/stores/auth.store";
import { getConsumerCommunity } from "@/services/community";
import {
  CampaignDetailBody,
  type DetailCampaign,
} from "@/components/campaign/CampaignDetailBody";
import { RelatedCampaigns } from "@/components/campaign/RelatedCampaigns";

export function ConsumerCampaignDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [campaign, setCampaign] = useState<DetailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    window.localStorage.setItem("lastViewedCampaign", slug);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setCampaign(null);
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Route params may be a slug *or* a raw campaign id (Activity links use
        // ids), so fall back to the id endpoint when the slug lookup misses.
        const data = await campaignApi.getBySlug(slug);
        if (!cancelled) setCampaign(data as unknown as DetailCampaign);
      } catch {
        try {
          const data = await campaignApi.getById(slug);
          if (!cancelled) setCampaign(data as unknown as DetailCampaign);
        } catch (err) {
          console.error("Campaign fetch error:", err);
          if (!cancelled) setError("Campaign not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
  const hierarchy = {
    citySlug: (campaign as any).citySlug || community.citySlug,
    areaSlug: (campaign as any).areaSlug || community.areaSlug,
    streetSlug: (campaign as any).streetSlug || community.streetSlug,
  };
  const isFounding =
    campaign.category?.slug === "founding-membership" ||
    (campaign as any).campaignType === "Founding Membership";
  const status = String((campaign as any).status ?? "").toLowerCase();
  const isEnded =
    status === "completed" ||
    status === "expired" ||
    status === "cancelled" ||
    status === "ended" ||
    (campaign.deadline
      ? new Date(campaign.deadline).getTime() <= Date.now()
      : false);

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
        onSelectReward={(rewardId) =>
          navigate(
            `/contribute/${campaign.slug}?reward=${encodeURIComponent(rewardId)}`,
          )
        }
      />

      <RelatedCampaigns
        campaignId={campaign.id}
        categoryId={campaign.category?.id}
        categoryName={campaign.category?.name}
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
