// =============================================================================
// UK Hub — Campaign Detail Page
// Uses the original campaign detail design with gallery, funding sidebar, and tabs.
// Enhanced modal: Back (offline/terminal/split), Founding Member (tiers), Monthly.
// =============================================================================

import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import { getDemoCampaignsForHighStreet } from "@/data/highStreetData";
import { getDemoRewardsForCampaign, simulateRewardEvaluation } from "@/data/demoRewards";
import { PostPaymentRewardCard } from "@/components/campaign/PostPaymentRewardCard";
import { HubBreadcrumb } from "@/components/hub/HubBreadcrumb";
import type { BreadcrumbItem } from "@/types/uk-hub";
import { CampaignImageGallery } from "@/components/campaign/CampaignImageGallery";
import { CampaignTabs } from "@/components/campaign/CampaignTabs";
import { SocialShare } from "@/components/campaign/SocialShare";
import { CampaignAuthorCard } from "@/components/campaign/CampaignAuthorCard";
import { RelatedCampaigns } from "@/components/campaign/RelatedCampaigns";
import { ContributionTypeChoice, type ContributionType } from "@/components/campaign/ContributionTypeChoice";
import { PaymentMethodSelector, type PaymentMethodType } from "@/components/campaign/PaymentMethodSelector";
import { OfflinePaymentInstructions } from "@/components/campaign/OfflinePaymentInstructions";
import { TerminalPaymentInstructions } from "@/components/campaign/TerminalPaymentInstructions";
import { StripeSandboxForm } from "@/components/campaign/StripeSandboxForm";
import { PayPalSandboxForm } from "@/components/campaign/PayPalSandboxForm";
import { ContributionDestination } from "@/components/campaign/ContributionDestination";
import { MEMBERSHIP_TIERS, type MembershipVariant, type TierLevel, type AccessLevel, ACCESS_LABELS } from "@/data/membershipTiers";
import { useCountdown } from "@/hooks/useCountdown";
import {
  Calendar, ArrowLeft, X, CheckCircle,
  ChevronRight, Heart, Share2, MapPin,
  Star, Shield,
  ArrowRight, Sparkles,
} from "lucide-react";

const fmtCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];
const MONTHLY_AMOUNTS = [10, 25, 50, 100];

type BackerStep = "amount" | "payment" | "complete";
type FoundingOption = "one-time" | "monthly" | null;
type FoundingStep = "choice" | "tier-select" | "payment" | "complete";

export default function HubCampaignDetailPage() {
  const { citySlug, localAreaSlug, highStreetSlug, audienceType, campaignSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
    audienceType: string;
    campaignSlug: string;
  }>();

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const cityName = (citySlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const areaName = (localAreaSlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const streetName = (highStreetSlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const isBusiness = audienceType === "business";

  const allCampaigns = useMemo(
    () => getDemoCampaignsForHighStreet(citySlug || "", localAreaSlug || "", highStreetSlug || ""),
    [citySlug, localAreaSlug, highStreetSlug],
  );

  const campaign = useMemo(
    () => allCampaigns.find(c => {
      if (c.slug !== campaignSlug) return false;
      if (audienceType === "business") return c.targetAudience === "business";
      if (audienceType === "consumer") return c.targetAudience === "consumer";
      return true;
    }) ?? null,
    [allCampaigns, campaignSlug, audienceType],
  );

  // Campaign rewards (demo data)
  const campaignRewards = useMemo(
    () => campaign ? getDemoRewardsForCampaign(campaign.slug) : [],
    [campaign],
  );

  const campaignListPath = `/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}/${audienceType}`;

  // ── Modal State ──
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [contributionType, setContributionType] = useState<ContributionType | null>(null);

  // Backer flow
  const [backerStep, setBackerStep] = useState<BackerStep>("amount");
  const [backerAmount, setBackerAmount] = useState<number>(0);
  const [backerCustomAmount, setBackerCustomAmount] = useState(false);
  const [backerPayment, setBackerPayment] = useState<PaymentMethodType | null>(null);
  const [backerAnonymous, setBackerAnonymous] = useState(false);
  const [backerNotes, setBackerNotes] = useState("");

  // Founding member flow
  const [foundingOption, setFoundingOption] = useState<FoundingOption>(null);
  const [foundingStep, setFoundingStep] = useState<FoundingStep>("choice");
  const [selectedVariant, setSelectedVariant] = useState<MembershipVariant | null>(null);
  const [foundingAccessLevel, setFoundingAccessLevel] = useState<AccessLevel>("standard");
  const [foundingPayment, setFoundingPayment] = useState<PaymentMethodType | null>(null);

  // Founding member monthly flow
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [monthlyCustomAmount, setMonthlyCustomAmount] = useState(false);
  const [monthlyPayment, setMonthlyPayment] = useState<PaymentMethodType | null>(null);

  // Earned rewards after payment
  const [earnedRewards, setEarnedRewards] = useState<{
    entitlementId: string;
    rewardTitle: string;
    rewardDescription: string;
    expiresAt: string;
    items: { title: string; physicalType: string }[];
  }[]>([]);

  const hasFoundingProgramme = true;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: cityName, slug: citySlug || "", fullPath: citySlug || "", type: "CITY" },
    { label: areaName, slug: localAreaSlug || "", fullPath: `${citySlug}/${localAreaSlug}`, type: "BOROUGH" },
    { label: streetName, slug: highStreetSlug || "", fullPath: `${citySlug}/${localAreaSlug}/${highStreetSlug}`, type: "HIGH_STREET" },
  ];

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={campaignListPath}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {isBusiness ? "Business" : "Consumer"} Campaigns
          </Link>
          <HubBreadcrumb items={breadcrumbs} />
        </div>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-300">Campaign Not Found</h1>
            <p className="mt-4 text-gray-600">The campaign "{campaignSlug}" doesn't exist.</p>
            <Link
              to={campaignListPath}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = campaign.goalAmount > 0
    ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
    : 0;
  const remaining = Math.max(0, campaign.goalAmount - campaign.raisedAmount);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const countdown = useCountdown(campaign.deadline);
  const isCountdownActive = daysLeft > 0;

  const modeLabel = campaign.mode === "fund" ? "Fund" : campaign.mode === "donation" ? "Donate" : "Sponsor";

  // Evaluate rewards when payment completes
  useEffect(() => {
    if (backerStep === "complete" && campaign && backerAmount > 0) {
      const matches = simulateRewardEvaluation(campaign.slug, backerAmount * 100);
      setEarnedRewards(matches.map(m => ({
        entitlementId: `ent-${Date.now()}-${m.reward.id}`,
        rewardTitle: m.reward.title,
        rewardDescription: m.reward.description,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: m.reward.items,
      })));
    }
  }, [backerStep, campaign, backerAmount]);

  const resetModal = () => {
    setShowJoinModal(false);
    setContributionType(null);
    setBackerStep("amount");
    setBackerAmount(0);
    setBackerCustomAmount(false);
    setBackerPayment(null);
    setBackerAnonymous(false);
    setBackerNotes("");
    setFoundingOption(null);
    setFoundingStep("choice");
    setSelectedVariant(null);
    setFoundingPayment(null);
    setMonthlyAmount(0);
    setMonthlyCustomAmount(false);
    setMonthlyPayment(null);
    setEarnedRewards([]);
  };

  const foundingTierColors: Record<TierLevel, { bg: string; border: string; text: string; badge: string }> = {
    bronze: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
    silver: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
    gold: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
    platinum: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/uk-hub-activation" className="hover:text-gray-700">UK Hub</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/uk-hub-activation/${citySlug}`} className="hover:text-gray-700">{cityName}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/uk-hub-activation/${citySlug}/${localAreaSlug}`} className="hover:text-gray-700">{areaName}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}`} className="hover:text-gray-700">{streetName}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={campaignListPath} className="hover:text-gray-700">{isBusiness ? "Business" : "Consumer"}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate">{campaign.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Campaign Title */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              isBusiness ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
            }`}>
              {isBusiness ? "For Business" : "For Consumer"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              campaign.mode === "fund" ? "bg-primary-100 text-primary-700" :
              campaign.mode === "donation" ? "bg-secondary-100 text-secondary-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {modeLabel}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {campaign.title}
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-3xl">
            {campaign.shortDescription}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{cityName} / {areaName} / {streetName}</span>
            </div>
            {currentSeason && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{currentSeason.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gallery + Funding Sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <CampaignImageGallery
              featuredImage={campaign.featuredImage || undefined}
              images={campaign.media?.map((m, i) => ({ id: m.id, url: m.url, alt: m.alt || "", order: i })) || []}
              title={campaign.title}
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">{fmtCurrency(campaign.raisedAmount)}</span>
                  <span className="text-sm text-gray-500">of {fmtCurrency(campaign.goalAmount)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-primary-600">{progress}% funded</span>
                  <span className="text-gray-500">{fmtCurrency(remaining)} to go</span>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm font-bold text-gray-900">{currentSeason?.name || "Current Season"}</div>
                  <div className="text-xs text-gray-500">Season</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-lg font-bold text-gray-900">{daysLeft}</div>
                  <div className="text-xs text-gray-500">Days Left</div>
                </div>
              </div>
              {isCountdownActive && (
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    {[
                      { value: countdown.days, label: "D" },
                      { value: countdown.hours, label: "H" },
                      { value: countdown.minutes, label: "M" },
                      { value: countdown.seconds, label: "S" },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{String(item.value).padStart(2, "0")}</span>
                        </div>
                        <span className="mt-1 text-[10px] font-medium text-gray-500">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn-primary w-full"
                >
                  <Heart className="h-4 w-4" />
                  Join this Campaign
                </button>
                <div className="flex items-center gap-3">
                  <button className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>
              {currentSeason && (
                <div className="mt-4 rounded-lg bg-primary-50 border border-primary-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-bold text-primary-800 uppercase">Season</span>
                  </div>
                  <span className="text-sm font-medium text-primary-800">{currentSeason.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-8">
          <CampaignTabs
            description={campaign.shortDescription || ""}
            shortDescription={campaign.shortDescription || ""}
            campaignId={campaign.id}
            rewards={campaignRewards}
            faqs={[]}
          />
        </div>

        {/* Author + Social Share */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CampaignAuthorCard
              author={{
                id: "fundordonate",
                firstName: "FundOrDonate",
                lastName: "Team",
                username: "fundordonate",
              }}
              campaignCount={allCampaigns.length}
            />
          </div>
          <div>
            <SocialShare
              title={campaign.title}
              slug={campaign.slug}
              shortDescription={campaign.shortDescription}
            />
          </div>
        </div>

        {/* Related Campaigns */}
        <div className="mt-8">
          <RelatedCampaigns
            campaignId={campaign.id}
            currentSlug={campaign.slug}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          JOIN CAMPAIGN MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={resetModal}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={resetModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              {/* ─── CHOICE SCREEN ─── */}
              {!contributionType && (
                <ContributionTypeChoice
                  campaignTitle={campaign.title}
                  locationName={`${streetName}, ${areaName}`}
                  hasFoundingProgramme={hasFoundingProgramme}
                  foundingProgrammeName="UK Hub Activation Programme"
                  foundingRemaining={25}
                  onSelect={(type) => {
                    setContributionType(type);
                    if (type === "backer") setBackerStep("amount");
                    if (type === "founding_member") {
                      setFoundingStep("choice");
                      setFoundingOption(null);
                    }
                  }}
                  onBack={resetModal}
                />
              )}

              {/* ─── BACK THIS CAMPAIGN ─── */}
              {contributionType === "backer" && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <button onClick={() => setContributionType(null)} className="text-gray-500 hover:text-gray-700">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">Back this Campaign</h2>
                  </div>

                  {/* STEP: Amount Selection */}
                  {backerStep === "amount" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Amount</label>
                        <div className="grid grid-cols-3 gap-2">
                          {PRESET_AMOUNTS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => { setBackerAmount(preset); setBackerCustomAmount(false); }}
                              className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                !backerCustomAmount && backerAmount === preset
                                  ? "border-primary-500 bg-primary-50 text-primary-700"
                                  : "border-gray-200 text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {fmtCurrency(preset * 100)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Or enter custom amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                          <input
                            type="number"
                            min={1}
                            value={backerCustomAmount ? backerAmount : ""}
                            onChange={(e) => { setBackerAmount(Number(e.target.value)); setBackerCustomAmount(true); }}
                            onFocus={() => setBackerCustomAmount(true)}
                            placeholder="0"
                            className="input-field pl-8"
                          />
                        </div>
                      </div>

                      {/* Split Payment Link */}
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Split across multiple causes?</p>
                            <p className="text-xs text-gray-500">Plan a split contribution across City, Borough, or High Street</p>
                          </div>
                          <Link
                            to={`/split?city=${citySlug}`}
                            target="_blank"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 whitespace-nowrap"
                          >
                            Split Contribution
                          </Link>
                        </div>
                      </div>

                      {/* Anonymous */}
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={backerAnonymous}
                          onChange={(e) => setBackerAnonymous(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Make my donation anonymous</span>
                      </label>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Add a comment (optional)</label>
                        <textarea
                          value={backerNotes}
                          onChange={(e) => setBackerNotes(e.target.value)}
                          placeholder="Leave a message..."
                          rows={2}
                          className="input-field resize-none"
                        />
                      </div>

                      {/* Contribution Destination */}
                      {backerAmount > 0 && (
                        <ContributionDestination
                          campaignTitle={campaign.title}
                          hierarchyLevel={audienceType}
                          locationName={`${streetName}, ${areaName}`}
                          amount={backerAmount * 100}
                          showBeforePayment={true}
                        />
                      )}

                      <button
                        onClick={() => setBackerStep("payment")}
                        disabled={backerAmount <= 0}
                        className="btn-primary w-full disabled:opacity-40"
                      >
                        Continue to Payment <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* STEP: Payment Method */}
                  {backerStep === "payment" && (
                    <div className="space-y-5">
                      <div className="rounded-lg bg-gray-50 border p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Your contribution</p>
                          <p className="text-lg font-bold text-gray-900">{fmtCurrency(backerAmount * 100)}</p>
                        </div>
                        <button onClick={() => setBackerStep("amount")} className="text-xs font-medium text-primary-600 hover:underline">
                          Change amount
                        </button>
                      </div>

                      <PaymentMethodSelector value={backerPayment} onChange={setBackerPayment} />

                      {/* Payment method instructions */}
                      {backerPayment === "offline" && (
                        <OfflinePaymentInstructions />
                      )}
                      {backerPayment === "terminal" && (
                        <TerminalPaymentInstructions />
                      )}
                      {backerPayment === "stripe" && (
                        <StripeSandboxForm
                          amount={backerAmount}
                          onSubmit={() => setBackerStep("complete")}
                        />
                      )}
                      {backerPayment === "paypal" && (
                        <PayPalSandboxForm
                          amount={backerAmount}
                          onSubmit={() => setBackerStep("complete")}
                        />
                      )}

                      {/* Show pay button only for offline/terminal */}
                      {(backerPayment === "offline" || backerPayment === "terminal") && (
                        <>
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Secure payment · Encrypted transaction</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setBackerStep("amount")}
                              className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                            >
                              Back
                            </button>
                            <button
                              onClick={() => setBackerStep("complete")}
                              disabled={!backerPayment}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-40"
                            >
                              Confirm {fmtCurrency(backerAmount * 100)}
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* STEP: Complete */}
                  {backerStep === "complete" && (
                    <div className="py-6 space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Contribution Complete!</h2>
                        <p className="text-sm text-gray-500">
                          Thank you for backing <span className="font-bold text-gray-900">{campaign.title}</span>
                        </p>
                      </div>

                      {/* Earned Rewards */}
                      {earnedRewards.length > 0 && (
                        <PostPaymentRewardCard
                          rewards={earnedRewards}
                          onClaim={() => { /* TODO: claim flow */ }}
                          onClose={resetModal}
                        />
                      )}

                      {/* Payment Receipt */}
                      <div className="rounded-xl border-2 border-gray-200 p-5 text-left">
                        <h3 className="font-bold text-gray-900 text-sm mb-4">Payment Receipt</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-gray-600">Campaign</span>
                            <span className="font-bold text-gray-900 text-right max-w-[55%] truncate">{campaign.title}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-gray-600">Amount</span>
                            <span className="font-bold text-gray-900">{fmtCurrency(backerAmount * 100)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-gray-600">Payment Method</span>
                            <span className="font-bold text-gray-900 capitalize">{backerPayment === "offline" ? "Offline (Cheque/Bank Transfer)" : backerPayment === "terminal" ? "Terminal" : backerPayment}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-gray-600">Status</span>
                            <span className={`font-bold ${backerPayment === "offline" ? "text-amber-600" : "text-green-600"}`}>
                              {backerPayment === "offline" ? "Pending (Awaiting Payment)" : "Confirmed"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button onClick={resetModal} className="btn-primary w-full">
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ─── BECOME A FOUNDING MEMBER ─── */}
              {contributionType === "founding_member" && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <button onClick={() => { setContributionType(null); setFoundingOption(null); setFoundingStep("choice"); }} className="text-gray-500 hover:text-gray-700">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">Become a Founding Member</h2>
                  </div>

                  {/* STEP: Choice (One-time vs Monthly) */}
                  {foundingStep === "choice" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Choose how you'd like to become a Founding Member of {streetName}, {areaName}.
                      </p>

                      {/* One-time Option */}
                      <button
                        type="button"
                        onClick={() => { setFoundingOption("one-time"); setFoundingStep("tier-select"); }}
                        className="w-full rounded-xl border-2 border-primary-200 bg-primary-50 p-5 text-left transition-all hover:border-primary-400 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-lg">★</span>
                          <div>
                            <h3 className="font-bold text-gray-900">Founding Member</h3>
                            <p className="text-xs text-gray-500">One-time contribution · Bronze/Silver/Gold/Platinum tiers</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Select a membership tier and make a one-time contribution. You'll receive permanent Founding Member status and benefits.
                        </p>
                        <div className="rounded-lg bg-white p-4 border border-primary-100">
                          <p className="text-xs font-medium text-primary-700 mb-2">Available Tiers:</p>
                          <div className="flex flex-wrap gap-2">
                            {MEMBERSHIP_TIERS.map(tier => {
                              const colors = foundingTierColors[tier.id];
                              return (
                                <span key={tier.id} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${colors.badge}`}>
                                  {tier.name} from {fmtCurrency(Math.min(...tier.variants.map(v => v.price)) * 100)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </button>

                      {/* Monthly Option */}
                      <button
                        type="button"
                        onClick={() => { setFoundingOption("monthly"); setFoundingStep("payment"); }}
                        className="w-full rounded-xl border-2 border-secondary-200 bg-secondary-50 p-5 text-left transition-all hover:border-secondary-400 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-lg">↻</span>
                          <div>
                            <h3 className="font-bold text-gray-900">Founding Member Monthly</h3>
                            <p className="text-xs text-gray-500">Recurring monthly contribution</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Subscribe to a monthly contribution to maintain your Founding Member status with ongoing benefits.
                        </p>
                        <div className="rounded-lg bg-white p-4 border border-secondary-100">
                          <p className="text-xs font-medium text-secondary-700 mb-2">Benefits include:</p>
                          <ul className="space-y-1 text-xs text-gray-600">
                            <li>• All Founding Member benefits</li>
                            <li>• Monthly supporter recognition</li>
                            <li>• Exclusive monthly updates</li>
                            <li>• Priority support channel access</li>
                          </ul>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* STEP: Tier Selection (One-time) */}
                  {foundingStep === "tier-select" && foundingOption === "one-time" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Access Level</label>
                        <div className="flex gap-2">
                          {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map(level => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setFoundingAccessLevel(level)}
                              className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-bold transition-colors ${
                                foundingAccessLevel === level
                                  ? "border-primary-500 bg-primary-50 text-primary-700"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {ACCESS_LABELS[level]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {MEMBERSHIP_TIERS.map(tier => {
                          const variant = tier.variants.find(v => v.accessLevel === foundingAccessLevel);
                          if (!variant) return null;
                          const colors = foundingTierColors[tier.id];
                          const isSelected = selectedVariant?.id === variant.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setSelectedVariant(variant)}
                              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                                isSelected
                                  ? `${colors.border} ${colors.bg} shadow-sm`
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.badge}`}>
                                    {tier.name}
                                  </span>
                                  <div>
                                    <span className="text-sm font-bold text-gray-900">{variant.label}</span>
                                    <span className="ml-2 text-xs text-gray-500">{variant.duration}</span>
                                  </div>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{fmtCurrency(variant.price * 100)}</span>
                              </div>
                              {isSelected && (
                                <div className="mt-3 space-y-2">
                                  <div className="rounded-lg bg-white p-3 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-700 mb-1">Access includes:</p>
                                    <ul className="space-y-0.5">
                                      {variant.access.map((a, i) => (
                                        <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                          {a}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="rounded-lg bg-white p-3 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-700 mb-1">Rewards:</p>
                                    <ul className="space-y-0.5">
                                      {variant.rewards.map((r, i) => (
                                        <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                                          <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                          {r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setFoundingStep("choice"); setSelectedVariant(null); }}
                          className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => { if (selectedVariant) setFoundingStep("payment"); }}
                          disabled={!selectedVariant}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-40"
                        >
                          Continue <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP: Payment (One-time after tier selection, or Monthly) */}
                  {foundingStep === "payment" && (
                    <div className="space-y-5">
                      {/* Summary */}
                      <div className="rounded-lg bg-gray-50 border p-4">
                        {foundingOption === "one-time" && selectedVariant && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Selected tier</p>
                              <p className="text-sm font-bold text-gray-900">{selectedVariant.label}</p>
                              <p className="text-xs text-gray-500">{selectedVariant.duration} access</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{fmtCurrency(selectedVariant.price * 100)}</p>
                              <button onClick={() => setFoundingStep("tier-select")} className="text-xs font-medium text-primary-600 hover:underline">
                                Change
                              </button>
                            </div>
                          </div>
                        )}
                        {foundingOption === "monthly" && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Monthly contribution</p>
                              <p className="text-sm font-bold text-gray-900">Founding Member Monthly</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{fmtCurrency(monthlyAmount * 100)}<span className="text-xs text-gray-500">/mo</span></p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Monthly Amount Selection (only for monthly) */}
                      {foundingOption === "monthly" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Amount</label>
                          <div className="grid grid-cols-4 gap-2">
                            {MONTHLY_AMOUNTS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => { setMonthlyAmount(preset); setMonthlyCustomAmount(false); }}
                                className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                                  !monthlyCustomAmount && monthlyAmount === preset
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                {fmtCurrency(preset * 100)}
                              </button>
                            ))}
                          </div>
                          <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                            <input
                              type="number"
                              min={1}
                              value={monthlyCustomAmount ? monthlyAmount : ""}
                              onChange={(e) => { setMonthlyAmount(Number(e.target.value)); setMonthlyCustomAmount(true); }}
                              onFocus={() => setMonthlyCustomAmount(true)}
                              placeholder="Custom amount"
                              className="input-field pl-8"
                            />
                          </div>
                        </div>
                      )}

                      <PaymentMethodSelector
                        value={foundingOption === "monthly" ? monthlyPayment : foundingPayment}
                        onChange={(v) => foundingOption === "monthly" ? setMonthlyPayment(v) : setFoundingPayment(v)}
                      />

                      {/* Payment instructions */}
                      {(foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "offline" && (
                        <OfflinePaymentInstructions />
                      )}
                      {(foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "terminal" && (
                        <TerminalPaymentInstructions />
                      )}
                      {(foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "stripe" && (
                        <StripeSandboxForm
                          amount={foundingOption === "monthly" ? monthlyAmount : selectedVariant?.price || 0}
                          onSubmit={() => setFoundingStep("complete")}
                        />
                      )}
                      {(foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "paypal" && (
                        <PayPalSandboxForm
                          amount={foundingOption === "monthly" ? monthlyAmount : selectedVariant?.price || 0}
                          onSubmit={() => setFoundingStep("complete")}
                        />
                      )}

                      {/* Show pay button only for offline/terminal */}
                      {(foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "offline" || (foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "terminal" ? (
                        <>
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Secure payment · Encrypted transaction</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setFoundingStep(foundingOption === "one-time" ? "tier-select" : "choice")}
                              className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                            >
                              Back
                            </button>
                            <button
                              onClick={() => setFoundingStep("complete")}
                              disabled={foundingOption === "monthly" ? !monthlyPayment || monthlyAmount <= 0 : !foundingPayment}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-40"
                            >
                              {foundingOption === "monthly"
                                ? `Confirm ${fmtCurrency(monthlyAmount * 100)}/mo`
                                : `Confirm ${selectedVariant ? fmtCurrency(selectedVariant.price * 100) : "£0"}`
                              }
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}

                  {/* STEP: Complete */}
                  {foundingStep === "complete" && (
                    <div className="text-center py-6">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, Founding Member!</h2>
                      <p className="text-sm text-gray-500 mb-6">
                        Thank you for becoming a Founding Member of {streetName}, {areaName}.
                      </p>
                      <div className="rounded-xl border-2 border-gray-200 p-5 mb-6 text-left">
                        <h3 className="font-bold text-gray-900 text-sm mb-4">Your Membership</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-gray-600">Type</span>
                            <span className="font-bold text-gray-900">
                              {foundingOption === "monthly" ? "Founding Member Monthly" : selectedVariant?.label || "Founding Member"}
                            </span>
                          </div>
                          {foundingOption === "one-time" && selectedVariant && (
                            <div className="flex justify-between py-1.5 border-b">
                              <span className="text-gray-600">Duration</span>
                              <span className="font-bold text-gray-900">{selectedVariant.duration}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-gray-600">Amount</span>
                            <span className="font-bold text-gray-900">
                              {foundingOption === "monthly"
                                ? `${fmtCurrency(monthlyAmount * 100)}/month`
                                : selectedVariant ? fmtCurrency(selectedVariant.price * 100) : "£0"
                              }
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b">
                            <span className="text-gray-600">Payment</span>
                            <span className="font-bold text-gray-900 capitalize">
                              {(foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "offline"
                                ? "Offline (Cheque/Bank Transfer)"
                                : (foundingOption === "monthly" ? monthlyPayment : foundingPayment) === "terminal"
                                ? "Terminal"
                                : (foundingOption === "monthly" ? monthlyPayment : foundingPayment)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-gray-600">Status</span>
                            <span className="font-bold text-green-600">Active</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 mb-6 text-left">
                        <h3 className="font-bold text-yellow-900 text-sm mb-3">Your Founding Member Benefits</h3>
                        <ul className="space-y-2">
                          {[
                            "Founding Member badge on your profile",
                            "Priority access to future campaigns",
                            "Recognition on the high street page",
                            "Exclusive community access",
                            ...(foundingOption === "monthly" ? [
                              "Monthly supporter recognition",
                              "Exclusive monthly updates",
                              "Priority support channel access",
                            ] : selectedVariant?.benefits || []),
                          ].map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-yellow-800">
                              <CheckCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button onClick={resetModal} className="btn-primary w-full">
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
