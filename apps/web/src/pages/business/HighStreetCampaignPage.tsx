// =============================================================================
// Campaign Detail Page
// Full campaign information + participation CTA.
// =============================================================================

import { useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  ArrowLeft, Calendar, Clock, Users,
  ChevronRight, Megaphone, TrendingUp, Star, Trophy, Gift,
  FileText, BarChart3, MessageSquare,
  Shield, Store, Award, Play, ChevronLeft, X, Plus, Minus,
} from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { getDemoCampaignsForLocation, HUB_LOCATIONS } from "@/data/hubActivation";
import type { CampaignMedia } from "@/data/demo";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

function CollapsibleSection({ title, icon: Icon, color, defaultOpen = true, children }: {
  title: string;
  icon: typeof FileText;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return false;
    return defaultOpen;
  });
  return (
    <div className="rounded-xl bg-white border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 p-5 text-left"
      >
        <Icon className={`h-5 w-5 ${color}`} />
        <h2 className="font-bold text-gray-900 text-lg flex-1">{title}</h2>
        <div className="flex-shrink-0 h-7 w-7 rounded-full border-2 border-gray-300 flex items-center justify-center">
          {isOpen ? <Minus className="h-4 w-4 text-gray-500" /> : <Plus className="h-4 w-4 text-gray-500" />}
        </div>
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function CampaignDetailPage() {
  const { citySlug, localAreaSlug, highStreetSlug, campaignSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
    campaignSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect consumer vs business context from URL
  const isConsumerContext = location.pathname.includes("/consumer/") || location.pathname.includes("/c-campaigns/");
  const isBusinessContext = location.pathname.includes("/business/") || location.pathname.includes("/b-campaigns/");

  const mapLoc = useMemo(
    () => HUB_LOCATIONS.find(l => l.slug === citySlug) ?? null,
    [citySlug],
  );

  const campaigns = useMemo(() => {
    if (!mapLoc) return [];
    return getDemoCampaignsForLocation(mapLoc);
  }, [mapLoc]);

  const campaign = useMemo(() => {
    return campaigns.find(c => c.slug === campaignSlug) ?? null;
  }, [campaigns, campaignSlug]);

  const [selectedMedia, setSelectedMedia] = useState<CampaignMedia | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("story");

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: any) => s.status === "ACTIVE") || seasons[0] || null;

  const seasonCountdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isSeasonActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Campaign Not Found</h2>
          <p className="text-sm text-gray-500 mt-1">This campaign doesn't exist or is no longer available.</p>
          <Link
            to={`/uk-hub-activation/${citySlug}/${isConsumerContext ? "consumer" : "business"}/${localAreaSlug}/${highStreetSlug}`}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500"
          >
            ← Back to {streetName}
          </Link>
        </div>
      </div>
    );
  }

  const progress = campaign.goalAmount > 0 ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)) : 0;
  const remaining = Math.max(0, campaign.goalAmount - campaign.raisedAmount);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const contributors = (campaign._count?.donations ?? 0) + (campaign._count?.pledges ?? 0);

  const handleParticipate = () => {
    const context = isConsumerContext ? "consumer" : "business";
    navigate(`/uk-hub-activation/${citySlug}/${context}/${localAreaSlug}/${highStreetSlug}/join/opportunities?campaign=${campaign.slug}`, {
      state: { campaign },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-4xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <Link
            to={`/uk-hub-activation/${citySlug}/${isConsumerContext ? "consumer" : "business"}/${localAreaSlug}/${highStreetSlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-3 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {streetName}
          </Link>

          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-blue-300 sm:gap-2 sm:text-sm">
            <Link to={`/uk-hub-activation/${citySlug}`} className="hover:text-white transition-colors">{cityName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to={`/uk-hub-activation/${citySlug}/${isConsumerContext ? "consumer" : "business"}/${localAreaSlug}`} className="hover:text-white transition-colors">{localAreaName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to={`/uk-hub-activation/${citySlug}/${isConsumerContext ? "consumer" : "business"}/${localAreaSlug}/${highStreetSlug}`} className="hover:text-white transition-colors">{streetName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-white">{campaign.title}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{campaign.title}</h1>
            </div>

            {/* Campaign Gallery */}
            {campaign.media && campaign.media.length > 0 && (
              <div className="rounded-xl bg-white border p-5 sm:p-6">
                {/* Main Display */}
                <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {selectedMedia?.type === "video" || (!selectedMedia && campaign.media?.[0]?.type === "video") ? (
                    <div className="aspect-video">
                      <iframe
                        src={selectedMedia?.url || campaign.media?.[0]?.url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedMedia?.alt || campaign.media?.[0]?.alt}
                      />
                    </div>
                  ) : (
                    <div
                      className="aspect-video cursor-pointer"
                      onClick={() => {
                        const media = selectedMedia || campaign.media?.[0];
                        if (media) {
                          setSelectedMedia(media);
                          setLightboxOpen(true);
                        }
                      }}
                    >
                      <img
                        src={selectedMedia?.url || campaign.media?.[0]?.url}
                        alt={selectedMedia?.alt || campaign.media?.[0]?.alt}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {selectedMedia?.alt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                      {selectedMedia.alt}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {campaign.media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {campaign.media.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMedia(item)}
                        className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedMedia?.id === item.id
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {item.type === "video" ? (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Play className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <img
                            src={item.poster || item.url}
                            alt={item.alt}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {item.type === "video" && (
                          <div className="absolute bottom-0.5 right-0.5">
                            <Play className="h-3 w-3 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Community Join Counts */}
            <div className="flex items-center gap-4 rounded-xl bg-white border px-5 py-3">
              {isBusinessContext && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
                    <Store className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">{Math.floor(contributors * 0.6) || 12}</span>
                    <span className="text-xs text-gray-500 ml-1">Businesses Joined</span>
                  </div>
                </div>
              )}
              {isConsumerContext && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                    <Users className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">{Math.floor(contributors * 0.4) || 8}</span>
                    <span className="text-xs text-gray-500 ml-1">Consumers Joined</span>
                  </div>
                </div>
              )}
              {!isBusinessContext && !isConsumerContext && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">{contributors}</span>
                    <span className="text-xs text-gray-500 ml-1">Contributors</span>
                  </div>
                </div>
              )}
              <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Funding Progress */}
            <CollapsibleSection title="Funding Progress" icon={TrendingUp} color="text-green-600">
              <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{fmt(campaign.goalAmount)}</div>
                  <div className="text-xs text-gray-500">Target</div>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{fmt(campaign.raisedAmount)}</div>
                  <div className="text-xs text-gray-500">Raised</div>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <div className="text-xl font-bold text-orange-600">{fmt(remaining)}</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{contributors}</div>
                  <div className="text-xs text-gray-500">Contributors</div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm font-bold text-gray-900">{progress}% funded</span>
                <span className="text-sm text-gray-500">{daysLeft} days remaining</span>
              </div>
            </CollapsibleSection>

            {/* ═══════════════ TABS ═══════════════ */}
            <div className="rounded-xl bg-white border overflow-hidden">
              {/* Tab bar */}
              <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
                {[
                  { id: "story", label: "Story", icon: FileText },
                  { id: "rewards", label: "Rewards", icon: Gift },
                  { id: "leaderboard", label: "Leaderboard", icon: BarChart3 },
                  { id: "updates", label: "Updates", icon: MessageSquare },
                  { id: "terms", label: "Terms", icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5">
                {/* ── Story tab ── */}
                {activeTab === "story" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Campaign Purpose</h3>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {campaign.shortDescription}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Full Description</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        This campaign aims to raise {fmt(campaign.goalAmount)} to support local initiatives on {streetName}, {localAreaName}, {cityName}. The funding will be used to develop community programmes, support local businesses, and enhance the high street experience for everyone in the area.
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed mt-3">
                        Through this campaign, we aim to create lasting positive change in our community. Every contribution, no matter the size, helps us move closer to our goal and makes a real difference for the people and businesses on {streetName}.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Rewards tab ── */}
                {activeTab === "rewards" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { title: "Backer Badge", desc: "Receive a Backer badge for your contribution", icon: Trophy },
                      { title: "Leaderboard Points", desc: "Earn points towards the community leaderboard", icon: TrendingUp },
                      { title: "Community Recognition", desc: "Public recognition for supporting this campaign", icon: Star },
                      { title: "Campaign Updates", desc: "Regular updates on campaign progress and impact", icon: Megaphone },
                      { title: "Priority Access", desc: "Early access to future campaigns and initiatives", icon: Award },
                      { title: "Exclusive Events", desc: "Invitations to community events and networking", icon: Gift },
                    ].map((reward) => (
                      <div key={reward.title} className="flex items-start gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                        <reward.icon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-gray-900">{reward.title}</div>
                          <div className="text-xs text-gray-600">{reward.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Leaderboard tab ── */}
                {activeTab === "leaderboard" && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Top contributors to this campaign. Earn leaderboard points by backing this campaign.
                    </p>
                    <div className="space-y-2">
                      {[
                        { name: "ABC Foods Ltd", amount: 500, rank: 1 },
                        { name: "Smith & Co", amount: 350, rank: 2 },
                        { name: "Local Bakery", amount: 200, rank: 3 },
                      ].map((entry) => (
                        <div key={entry.name} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            entry.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                            entry.rank === 2 ? "bg-gray-100 text-gray-600" :
                            "bg-orange-100 text-orange-700"
                          }`}>
                            {entry.rank}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-900">{entry.name}</div>
                          </div>
                          <div className="text-sm font-bold text-green-600">{fmt(entry.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Updates tab ── */}
                {activeTab === "updates" && (
                  <div className="space-y-4">
                    {[
                      { date: "10 Sep 2026", title: "Campaign Launched", desc: "We're excited to launch this campaign for the community!" },
                      { date: "5 Sep 2026", title: "Milestone Reached", desc: "We've reached 25% of our funding goal. Thank you for your support!" },
                    ].map((update, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                          {i < 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <div className="text-[10px] text-gray-400">{update.date}</div>
                          <div className="text-sm font-bold text-gray-900">{update.title}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{update.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Terms tab ── */}
                {activeTab === "terms" && (
                  <div className="text-xs text-gray-600 space-y-2">
                    <p>• All contributions are final and non-refundable unless the campaign fails to reach its goal.</p>
                    <p>• Funds will be released to the campaign organizer only after the campaign ends successfully.</p>
                    <p>• Contributors will receive updates on how funds are being used.</p>
                    <p>• The campaign organizer is responsible for delivering any promised rewards.</p>
                    <p>• FundOrDonate charges a platform fee of 5% on successfully funded campaigns.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* ═══════════════ CAMPAIGN DATES & COUNTDOWN ═══════════════ */}
            <div className="rounded-xl bg-white border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-gray-900 text-lg">Campaign Dates</h2>
              </div>
              {currentSeason && (
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <div className="flex items-center gap-2 text-xs text-blue-600 mb-1 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Current Season
                  </div>
                  <div className="font-bold text-gray-900">{currentSeason.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Start Date
                  </div>
                  <div className="font-bold text-gray-900">
                    {currentSeason ? fmtDate(currentSeason.startDate) : fmtDate(new Date(Date.now() - 30 * 86400000).toISOString())}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    End Date
                  </div>
                  <div className="font-bold text-gray-900">{fmtDate(campaign.deadline)}</div>
                </div>
                {isSeasonActive && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <div className="text-xs text-blue-600 mb-2 font-medium">Countdown</div>
                    <div className="flex items-center gap-2">
                      {[
                        { val: seasonCountdown.days, label: "D" },
                        { val: seasonCountdown.hours, label: "H" },
                        { val: seasonCountdown.minutes, label: "M" },
                        { val: seasonCountdown.seconds, label: "S" },
                      ].map(({ val, label }) => (
                        <div key={label} className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-lg font-bold text-white tabular-nums">
                            {String(val).padStart(2, "0")}
                          </div>
                          <span className="text-[10px] text-blue-500 mt-1 font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!isSeasonActive && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                    <div className="font-bold text-gray-900">{daysLeft} days</div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════ PARTICIPATION CTA ═══════════════ */}
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-2">Ready to Participate?</h2>
                <p className="text-blue-100 text-sm">
                  Join others supporting this campaign on {streetName}.
                </p>
              </div>

              <button
                onClick={handleParticipate}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors"
              >
                Continue to Participate
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>

              <p className="text-[10px] text-blue-200 text-center mt-3">
                Choose between Back the Campaign or Become a Founding Member
              </p>
            </div>
           </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            onClick={() => {
              const media = campaign?.media;
              if (!media) return;
              const idx = media.findIndex(m => m.id === selectedMedia.id);
              const prev = idx > 0 ? media[idx - 1] : media[media.length - 1];
              if (prev) setSelectedMedia(prev);
            }}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            onClick={() => {
              const media = campaign?.media;
              if (!media) return;
              const idx = media.findIndex(m => m.id === selectedMedia.id);
              const next = idx < media.length - 1 ? media[idx + 1] : media[0];
              if (next) setSelectedMedia(next);
            }}
            className="absolute right-14 text-white hover:text-gray-300 z-10"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
          <div className="max-w-5xl max-h-[85vh] w-full">
            {selectedMedia.type === "video" ? (
              <iframe
                src={selectedMedia.url}
                className="w-full aspect-video rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedMedia.alt}
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt}
                className="w-full h-full object-contain rounded-lg"
              />
            )}
            {selectedMedia.alt && (
              <p className="text-white text-center mt-3 text-sm">{selectedMedia.alt}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
