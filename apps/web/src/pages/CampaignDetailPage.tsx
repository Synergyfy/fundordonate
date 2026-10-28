import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { campaignApi } from "@/services/campaign";
import { useAuthStore } from "@/stores/auth.store";
import { CampaignDetailBody, type DetailCampaign } from "@/components/campaign/CampaignDetailBody";
import { RelatedCampaigns } from "@/components/campaign/RelatedCampaigns";
import { DonationForm } from "@/components/campaign/DonationForm";
import { PledgeForm } from "@/components/campaign/PledgeForm";
import { ContributionTypeChoice, type ContributionType } from "@/components/campaign/ContributionTypeChoice";
import { ChevronRight } from "lucide-react";

type Campaign = DetailCampaign;

export function CampaignDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore((s) => s.user);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState<ContributionType | null>(null);
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);

  const handleSelectReward = (rewardId: string) => {
    setPendingRewardId(rewardId);
    setContributionType("backer");
    window.setTimeout(() => {
      document.getElementById("contribute")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    // The `/campaigns/:slug` route is reached with either a human slug
    // (`title-slug-<id8>`) or a raw campaign id. `GET /campaigns/:id` and
    // `GET /campaigns/slug/:slug` both resolve, so pick the right one — and
    // fall back to an id lookup if a slug lookup 404s.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slug,
      );

    const request = isUuid
      ? campaignApi.getById(slug)
      : campaignApi.getBySlug(slug).catch(() => campaignApi.getById(slug));

    request
      .then((data: any) => {
        setCampaign(data?.campaign || data);
      })
      .catch((err) => {
        setError(err?.message || "Campaign not found");
      })
      .finally(() => {
        setLoading(false);
      });
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

  const isEnded =
    ["completed", "expired", "cancelled"].includes(
      String(campaign.status).toLowerCase(),
    ) ||
    (campaign.endDate ? new Date(campaign.endDate).getTime() < Date.now() : false);
  const notStarted = Boolean(
    campaign.startDate && new Date(campaign.startDate).getTime() > Date.now(),
  );

  const participation = campaign.participation ?? {
    backCampaign: campaign.mode === "fund",
    foundingMember: false,
    foundingMemberMonthly: false,
    donateContribute: campaign.mode === "donation",
  };
  const canDonate = participation.donateContribute !== false;
  const canBack = participation.backCampaign !== false;
  const canFound =
    participation.foundingMember === true &&
    campaign.foundingMemberRules?.enabled !== false;
  const optionCount = [canDonate, canBack, canFound].filter(Boolean).length;
  const requiresChoice = optionCount > 1;
  const defaultContributionType =
    canDonate ? "donate" : canBack ? "backer" : canFound ? "founding_member" : null;
  const effectiveContributionType =
    contributionType === "backer" && !canBack
      ? defaultContributionType
      : contributionType === "donate" && !canDonate
        ? defaultContributionType
        : contributionType === "founding_member" && !canFound
          ? defaultContributionType
          : contributionType ?? defaultContributionType;

  const selectedReward = (campaign.rewards || []).find(
    (reward: any) => reward.id === pendingRewardId,
  );

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
        <CampaignDetailBody
          campaign={campaign}
          user={user}
          onSelectReward={handleSelectReward}
        />
      </div>

      {/* Related Campaigns */}
      <RelatedCampaigns
        campaignId={campaign.id}
        categoryId={campaign.category?.id}
        currentSlug={campaign.slug}
      />

      {/* Donation/Pledge Form */}
      {!isEnded && !notStarted && (
        <div id="contribute" className="border-t border-gray-200 py-12 scroll-mt-20">
          <div className="container-page max-w-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {campaign.mode === "fund"
                  ? "Fund This Project"
                  : optionCount > 1
                    ? "Support This Campaign"
                    : "Donate Now"}
              </h2>
              <p className="mt-1 text-gray-500">
                {campaign.mode === "fund"
                  ? "Support this local initiative and help bring it to life"
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
                {campaign.citySlug && (
                  <div className="mt-2">
                    <Link
                      to={`/uk-hub-activation/${campaign.citySlug}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      View the {campaign.cityName || campaign.citySlug} City Hub →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {optionCount === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                This campaign is not currently accepting contributions.
              </div>
            ) : requiresChoice && !contributionType ? (
              <ContributionTypeChoice
                campaignTitle={campaign.title}
                locationName={campaign.location || undefined}
                hasFoundingProgramme={canFound}
                showDonate={canDonate}
                showBacker={canBack}
                foundingRemaining={undefined}
                onSelect={setContributionType}
              />
            ) : (
              <div className="space-y-4">
                {requiresChoice && (
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
                      Contributing as:{" "}
                      {effectiveContributionType === "founding_member"
                        ? "⭐ Founding Member"
                        : effectiveContributionType === "donate"
                          ? "💚 Donor"
                          : "🤝 Backer"}
                    </span>
                  </div>
                )}
                {effectiveContributionType === "backer" ? (
                  <PledgeForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    rewards={campaign.rewards || []}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType="backer"
                    preselectedRewardId={pendingRewardId ?? undefined}
                    rules={campaign}
                  />
                ) : effectiveContributionType === "founding_member" && campaign.mode === "fund" ? (
                  <PledgeForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    rewards={campaign.rewards || []}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType="founding_member"
                    preselectedRewardId={pendingRewardId ?? undefined}
                    rules={campaign}
                  />
                ) : (
                  <DonationForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType={
                      effectiveContributionType === "founding_member"
                        ? "founding_member"
                        : "donate"
                    }
                    preselectedAmountPence={selectedReward?.amount}
                    rules={campaign}
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
