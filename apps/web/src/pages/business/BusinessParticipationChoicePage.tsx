// =============================================================================
// Business Participation Choice Page
// Back the Campaign vs Become a Founding Member.
// =============================================================================

import { useParams, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle, Calendar, X, Heart, Star,
  Shield, Vote, Gift, Trophy, Users, Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import { useCountdown } from "@/hooks/useCountdown";
import type { DemoCampaign } from "@/data/demo";
import { getDemoCampaignsForLocation, HUB_LOCATIONS } from "@/data/hubActivation";

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type ModalType = "backer" | "founding" | null;

export default function BusinessParticipationChoicePage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsumerContext = location.pathname.includes("/consumer/");
  const ctx = isConsumerContext ? "consumer" : "business";
  const [searchParams] = useSearchParams();
  const campaignSlugFromUrl = searchParams.get("campaign");
  const campaignFromState = (location.state as { campaign?: DemoCampaign })?.campaign ?? null;
  const [selectedChoice, setSelectedChoice] = useState<"backer" | "founding" | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const mapLoc = useMemo(
    () => HUB_LOCATIONS.find(l => l.slug === citySlug) ?? null,
    [citySlug],
  );

  const campaigns = useMemo(() => {
    if (!mapLoc) return [];
    return getDemoCampaignsForLocation(mapLoc);
  }, [mapLoc]);

  const campaign = useMemo(() => {
    if (campaignFromState) return campaignFromState;
    if (campaignSlugFromUrl) return campaigns.find(c => c.slug === campaignSlugFromUrl) ?? null;
    return null;
  }, [campaignFromState, campaignSlugFromUrl, campaigns]);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const handleContinue = () => {
    const state = campaign ? { campaign } : {};
    const slug = campaign?.slug || campaignSlugFromUrl || "";
    if (selectedChoice === "backer") {
      navigate(`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/backer?campaign=${slug}`, { state });
    } else if (selectedChoice === "founding") {
      navigate(`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/founding-member-choice?campaign=${slug}`, { state });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <Link
          to={`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/opportunities`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 mb-3">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">PARTICIPATION</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">
              How would you like to participate?
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Choose how {currentSeason?.name || "this season"} you want to contribute to {streetName}, {cityName}.
            </p>
          </div>

          {/* Season Context */}
          {currentSeason && (
            <div className="rounded-lg bg-gray-50 border p-3 mb-6 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Current Season: <span className="font-bold text-gray-700">{currentSeason.name}</span></div>
                <div className="text-xs text-gray-600 break-words">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</div>
                {isActive && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-700 tabular-nums">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.days}d</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.hours}h</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.minutes}m</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.seconds}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instruction */}
          <p className="text-sm text-gray-600 mb-4 text-center">
            Select one of the options below to continue:
          </p>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Back the Campaign */}
            <button
              onClick={() => setSelectedChoice("backer")}
              className={`rounded-xl border-2 p-5 text-left transition-all cursor-pointer h-full ${
                selectedChoice === "backer"
                  ? "border-red-400 bg-red-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedChoice === "backer"
                    ? "border-red-500 bg-red-500"
                    : "border-gray-300"
                }`}>
                  {selectedChoice === "backer" && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">Back the Campaign</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Support a campaign through a contribution and receive applicable Backer recognition/rewards.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalType("backer");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Learn more about Backer
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </button>

            {/* Become a Founding Member */}
            <button
              onClick={() => setSelectedChoice("founding")}
              className={`rounded-xl border-2 p-5 text-left transition-all cursor-pointer h-full ${
                selectedChoice === "founding"
                  ? "border-yellow-400 bg-yellow-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedChoice === "founding"
                    ? "border-yellow-500 bg-yellow-500"
                    : "border-gray-300"
                }`}>
                  {selectedChoice === "founding" && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">Become a Founding Member</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Become recognised as a Founding Member and receive the applicable Founding Member benefits.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalType("founding");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Learn more about Founding Member
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedChoice}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              {selectedChoice === "backer" && "Become a Backer"}
              {selectedChoice === "founding" && "Become a Founding Member"}
              {!selectedChoice && "Select an option above"}
              {selectedChoice && <ArrowRight className="h-4 w-4" />}
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════ BACKER MODAL ═══════════════ */}
      {modalType === "backer" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalType(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">About Backer</h2>
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* What is a Backer */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h3 className="font-bold text-gray-900">What is a Backer?</h3>
                </div>
                <p className="text-sm text-gray-600">
                  A Backer is someone who supports a campaign through a contribution. When you back a campaign, you help fund initiatives on your high street, in your local area, or across your city. Backing is a contribution — it is not a membership.
                </p>
              </div>

              {/* What Happens When You Back */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">What happens when you back a campaign?</h3>
                <div className="space-y-2">
                  {[
                    "You select a campaign to support",
                    "You choose a contribution amount",
                    "Your contribution goes directly to funding the campaign",
                    "You receive Backer recognition and applicable rewards",
                    "You can track campaign progress and see your impact",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What You Get */}
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <h3 className="font-bold text-red-900 mb-2">What you get as a Backer</h3>
                <ul className="space-y-1.5 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Backer status badge on your contribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Public recognition for supporting the campaign</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Applicable rewards based on your contribution level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Leaderboard points for your business</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Updates on campaign impact and progress</span>
                  </li>
                </ul>
              </div>

              {/* Backer vs Founding Member */}
              <div className="rounded-lg bg-gray-50 border p-4">
                <h3 className="font-bold text-gray-900 mb-2">Backer vs Founding Member</h3>
                <p className="text-sm text-gray-600 mb-3">
                  A Backer is a contribution/support status. A Founding Member is a separate membership/status that provides ongoing benefits, voting rights, and priority access. You can be both — but they are different things.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white border p-3">
                    <div className="font-bold text-gray-900 mb-1">Backer</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Campaign-specific</li>
                      <li>• Contribution-based</li>
                      <li>• Rewards & recognition</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-white border p-3">
                    <div className="font-bold text-gray-900 mb-1">Founding Member</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Ongoing membership</li>
                      <li>• Priority & voting rights</li>
                      <li>• Exclusive benefits</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-500 transition-colors"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ FOUNDING MEMBER MODAL ═══════════════ */}
      {modalType === "founding" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalType(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">About Founding Member</h2>
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* What is a Founding Member */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-bold text-gray-900">What is a Founding Member?</h3>
                </div>
                <p className="text-sm text-gray-600">
                  A Founding Member is one of the first businesses to join a high street, local area, or city hub in FundOrDonate. As a Founding Member, you help shape the community, influence campaign decisions, and receive exclusive recognition and benefits for your early contribution.
                </p>
              </div>

              {/* What You Get */}
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <h3 className="font-bold text-yellow-900 mb-2">What you get as a Founding Member</h3>
                <ul className="space-y-1.5 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Founding Member badge on your business profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Vote className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Voting rights on high street campaign decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Priority participation in seasonal campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Gift className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Exclusive community events and networking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Recognition on the Founding Members wall</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Enhanced leaderboard positioning</span>
                  </li>
                </ul>
              </div>

              {/* Routes */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Founding Member routes</h3>
                <p className="text-sm text-gray-600 mb-3">
                  When you choose to become a Founding Member, you can select from two routes:
                </p>
                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <div className="font-bold text-gray-900 mb-1">Founding Member</div>
                    <p className="text-xs text-gray-600">
                      A one-time contribution to become a Founding Member. Choose a tier (Bronze, Silver, Gold, or Platinum) that suits your business, and receive the associated benefits and recognition.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-gray-900">Founding Member Monthly</div>
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700">
                        WHERE CONFIGURED
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      An ongoing monthly programme with continuous benefits, monthly rewards, and community recognition. Available where the high street has configured monthly participation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Membership Tiers */}
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                <h3 className="font-bold text-purple-900 mb-2">Membership tiers</h3>
                <p className="text-xs text-purple-700 mb-3">
                  Founding Member status includes membership tiers that determine your benefits level:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Bronze", amount: "£50", color: "text-orange-600" },
                    { name: "Silver", amount: "£100", color: "text-gray-600" },
                    { name: "Gold", amount: "£150", color: "text-yellow-600" },
                    { name: "Platinum", amount: "£200", color: "text-purple-600" },
                  ].map((tier) => (
                    <div key={tier.name} className="rounded-lg bg-white border p-2 text-center">
                      <div className={`text-xs font-bold ${tier.color}`}>{tier.name}</div>
                      <div className="text-[10px] text-gray-500">{tier.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="w-full rounded-xl bg-yellow-600 px-6 py-3 text-sm font-bold text-white hover:bg-yellow-500 transition-colors"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
