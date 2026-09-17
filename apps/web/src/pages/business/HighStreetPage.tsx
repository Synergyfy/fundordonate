// =============================================================================
// High Street Page
// Shows full high street overview with campaigns as the primary action.
// =============================================================================

import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  ArrowRight, ChevronRight, ArrowLeft, Calendar, TrendingUp, Heart, Gift,
  Store, Target, MapPin, Clock, Sparkles, ExternalLink, Users, Megaphone,
} from "lucide-react";
import { Tooltip, TOOLTIPS } from "@/components/ui/Tooltip";
import { getHighStreetsForArea, getBusinessesForHighStreet, type DemoBusiness } from "@/data/highStreetData";
import { getDemoCampaignsForLocation, HUB_LOCATIONS } from "@/data/hubActivation";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

function BusinessesOnStreet({ businesses, streetName, citySlug, localAreaSlug, highStreetSlug }: { businesses: DemoBusiness[]; streetName: string; citySlug: string; localAreaSlug: string; highStreetSlug: string }) {
  const participating = businesses.filter(b => b.participating);
  const displayed = participating.slice(0, 3);

  if (participating.length === 0) return null;

  return (
    <div className="rounded-xl bg-white border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-gray-900">Businesses on {streetName}</h3>
        </div>
        <span className="text-xs text-gray-500">{participating.length} participating</span>
      </div>
      <div className="space-y-2">
        {displayed.map((biz) => (
          <div key={biz.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg">
              {biz.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{biz.name}</div>
              <div className="text-xs text-gray-500">{biz.type} · {biz.category}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-green-600">{fmt(biz.fundingContribution)}</div>
              <div className="text-[10px] text-gray-400">contributed</div>
            </div>
          </div>
        ))}
      </div>
      {participating.length > 3 && (
        <Link
          to={`/uk-hub-activation/${citySlug}/business/${localAreaSlug}/${highStreetSlug}/businesses`}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
        >
          View all {participating.length} businesses
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function HighStreetPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();

  const streetData = useMemo(() => {
    const streets = getHighStreetsForArea(citySlug || "", localAreaSlug || "");
    return streets.find(s => s.slug === highStreetSlug) ?? null;
  }, [citySlug, localAreaSlug, highStreetSlug]);

  const allBusinesses = useMemo(() => {
    if (!citySlug || !localAreaSlug || !highStreetSlug) return [];
    return getBusinessesForHighStreet(citySlug, localAreaSlug, highStreetSlug);
  }, [citySlug, localAreaSlug, highStreetSlug]);

  const mapLoc = useMemo(
    () => HUB_LOCATIONS.find(l => l.slug === citySlug) ?? null,
    [citySlug],
  );

  const [activeChoice, setActiveChoice] = useState<"business" | "consumer" | null>(null);

  const campaigns = useMemo(() => {
    if (!mapLoc) return [];
    return getDemoCampaignsForLocation(mapLoc).slice(0, 4);
  }, [mapLoc]);

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";
  const streetName = streetData?.name || highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  if (!streetData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-300">High Street Not Found</h1>
          <p className="mt-4 text-gray-600">The high street "{highStreetSlug}" doesn't exist.</p>
          <Link to={`/uk-hub-activation/${citySlug}/business/${localAreaSlug}`} className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500">
            ← Back to Local Areas
          </Link>
        </div>
      </div>
    );
  }

  const fundingPct = Math.min(100, Math.round((streetData.fundingRaised / streetData.fundingTarget) * 100));
  const participating = allBusinesses.filter(b => b.participating);
  const joinUrl = `/uk-hub-activation/${citySlug}/business/${localAreaSlug}/${highStreetSlug}/join/signin`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <Link
            to={`/uk-hub-activation/${citySlug}/business/${localAreaSlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-4 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {localAreaName}
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-blue-300 mb-4 sm:gap-2 sm:text-sm">
            <Link to={`/uk-hub-activation/${citySlug}`} className="hover:text-white transition-colors">{cityName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to={`/uk-hub-activation/${citySlug}/business/${localAreaSlug}`} className="hover:text-white transition-colors">{localAreaName}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-white">{streetName}</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{streetName}</h1>
            <Tooltip content={TOOLTIPS.highStreet} />
          </div>
          <p className="mt-2 text-sm text-blue-200 max-w-2xl">{streetData.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
            {currentSeason && (
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Calendar className="h-3.5 w-3.5 text-blue-300 sm:h-4 sm:w-4" />
                <span className="text-xs font-bold sm:text-sm">{currentSeason.name}</span>
                <span className="text-[10px] text-blue-200 sm:text-xs">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
              <MapPin className="h-3.5 w-3.5 text-blue-300 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{streetData.status === "active" ? "Active" : "Making Progress"}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl bg-white border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 sm:text-3xl">{streetData.activationPct}%</div>
            <div className="text-xs text-gray-500 sm:text-sm">Activation Status</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${streetData.activationPct}%` }} />
            </div>
          </div>
          <div className="rounded-xl bg-white border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 sm:text-3xl">{participating.length}</div>
            <div className="text-xs text-gray-500 sm:text-sm">Businesses Participating</div>
            <div className="text-[10px] text-gray-400">of {streetData.totalBusinesses} total</div>
          </div>
          <div className="rounded-xl bg-white border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 sm:text-3xl">{campaigns.length}</div>
            <div className="text-xs text-gray-500 sm:text-sm">Active Campaigns</div>
          </div>
          <div className="rounded-xl bg-white border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 sm:text-3xl">{streetData.communityActivities}</div>
            <div className="text-xs text-gray-500 sm:text-sm">Community Activities</div>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="rounded-xl bg-white border p-4 mb-6 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-gray-900">Funding Progress</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{fmt(streetData.fundingRaised)} raised</span>
            <span className="text-sm font-bold text-gray-900">{fundingPct}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${fundingPct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Target: {fmt(streetData.fundingTarget)}</span>
            <span className="text-xs text-gray-500">{fmt(streetData.fundingTarget - streetData.fundingRaised)} remaining</span>
          </div>
        </div>

        {/* Businesses on this High Street */}
        <BusinessesOnStreet businesses={allBusinesses} streetName={streetName} citySlug={citySlug || ""} localAreaSlug={localAreaSlug || ""} highStreetSlug={highStreetSlug || ""} />

        {/* ═══════════════ CHOOSE YOUR PATH ═══════════════ */}
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border p-5 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">How would you like to participate?</h3>
          <p className="text-sm text-gray-600 mb-4">Choose your role to see relevant campaigns on {streetName}.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => setActiveChoice("business")}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                activeChoice === "business"
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                activeChoice === "business" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">For Business</div>
                <div className="text-xs text-gray-500">Create campaigns, connect with businesses, earn rewards</div>
              </div>
            </button>
            <button
              onClick={() => setActiveChoice("consumer")}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                activeChoice === "consumer"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-green-300 hover:shadow-sm"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                activeChoice === "consumer" ? "bg-green-600 text-white" : "bg-green-100 text-green-600"
              }`}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">For Consumer</div>
                <div className="text-xs text-gray-500">Support local causes, donate to campaigns, track impact</div>
              </div>
            </button>
          </div>
        </div>

        {/* ═══════════════ CAMPAIGNS ═══════════════ */}
        {activeChoice && campaigns.length > 0 && (
          <div className="rounded-xl bg-white border p-4 mt-6 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">
                {activeChoice === "business" ? "Business" : "Consumer"} Campaigns on {streetName}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose a campaign to support or participate in.</p>
            <div className="space-y-4">
              {campaigns.map((c) => {
                const progress = c.goalAmount > 0 ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)) : 0;
                const daysLeft = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                const campaignUrl = activeChoice === "business"
                  ? `/uk-hub-activation/${citySlug}/business/${localAreaSlug}/${highStreetSlug}/b-campaigns/${c.slug}`
                  : `/uk-hub-activation/${citySlug}/consumer/${localAreaSlug}/${highStreetSlug}/c-campaigns/${c.slug}`;
                return (
                  <div key={c.id} className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {c.featuredImage ? (
                          <img
                            src={c.featuredImage}
                            alt={c.title}
                            className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
                            <Target className="h-6 w-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900">{c.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.shortDescription}</p>
                        </div>
                      </div>

                      {/* Campaign Meta */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          <Megaphone className="h-2.5 w-2.5" />
                          {c.mode === "donation" ? "Donation" : c.mode === "fund" ? "Fund" : "Sponsor"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {c.category.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          <Users className="h-2.5 w-2.5" />
                          {(c._count?.donations ?? 0) + (c._count?.pledges ?? 0)} contributors
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">{fmt(c.raisedAmount)} raised</span>
                          <span className="text-xs font-bold text-gray-900">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-500">Target: {fmt(c.goalAmount)}</span>
                          <span className="text-[10px] text-gray-500">{daysLeft} days left</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        to={campaignUrl}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                      >
                        View Campaign
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!activeChoice && campaigns.length > 0 && (
          <div className="rounded-xl bg-white border p-6 mt-6 text-center">
            <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Campaigns on {streetName}</h3>
            <p className="text-sm text-gray-500">Choose "For Business" or "For Consumer" above to view available campaigns.</p>
          </div>
        )}

        {/* Community Activity & Rewards */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-gray-900">Community Activity</h3>
            </div>
            <p className="text-sm text-gray-600">Join community projects and make a difference on {streetName}.</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-xl font-bold text-red-600">{streetData.communityActivities} active</div>
              <div className="text-xs text-gray-400">initiatives this season</div>
            </div>
          </div>
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-yellow-600" />
              <h3 className="font-bold text-gray-900">Rewards & Incentives</h3>
            </div>
            <p className="text-sm text-gray-600">Earn rewards for your business participation and contributions.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(streetData.rewards || ["Local Shopper Badge", "Community Champion", "Hub Contributor"]).slice(0, 3).map((reward, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                  <Sparkles className="h-3 w-3" />
                  {reward}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Other High Street Info */}
        <div className="rounded-xl bg-white border p-4 mt-6 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Other High Street Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <div className="text-gray-500">Location</div>
              <div className="font-medium text-gray-900">{localAreaName}, {cityName}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Businesses</div>
              <div className="font-medium text-gray-900">{streetData.totalBusinesses}</div>
            </div>
            <div>
              <div className="text-gray-500">Participation Rate</div>
              <div className="font-medium text-gray-900">{Math.round((participating.length / Math.max(streetData.totalBusinesses, 1)) * 100)}%</div>
            </div>
            <div>
              <div className="text-gray-500">Activation Level</div>
              <div className="font-medium text-gray-900">{streetData.activationPct}%</div>
            </div>
            <div>
              <div className="text-gray-500">Community Activities</div>
              <div className="font-medium text-gray-900">{streetData.communityActivities}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium text-gray-900 capitalize">{streetData.status?.replace("_", " ")}</div>
            </div>
          </div>
        </div>

        {/* CTA — Join High Street */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 mt-6 text-white text-center sm:p-8">
          <h3 className="text-xl font-bold mb-2">Ready to join {streetName}?</h3>
          <p className="text-blue-100 mb-4 max-w-md mx-auto">Connect your business to this high street and start participating in the hub community.</p>
          <Link
            to={joinUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Join High Street
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
