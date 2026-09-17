// =============================================================================
// Business Opportunities Page
// Shows what the business can do in FundOrDonate based on their profile.
// =============================================================================

import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import {
  ArrowRight, Heart, Users, Star, Trophy, Gift, Sparkles,
  Store, MapPin, Megaphone, CheckCircle, Calendar, ChevronDown, ChevronUp,
  Clock,
} from "lucide-react";
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

interface Opportunity {
  id: string;
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  borderColor: string;
  available: boolean;
  reason?: string;
}

export default function BusinessOpportunitiesPage() {
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const opportunities: Opportunity[] = [
    {
      id: "support-campaigns",
      title: "Support Campaigns",
      description: "Contribute to local campaigns on your high street. Help fund community projects, local initiatives, and business programmes.",
      icon: Megaphone,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      available: true,
    },
    {
      id: "become-backer",
      title: "Become a Backer",
      description: "Back local campaigns with financial contributions. Gain Backer status and access to backer-only rewards and recognition.",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      available: true,
    },
    {
      id: "founding-member",
      title: "Become a Founding Member",
      description: "Join as a Founding Business Member. Get early access, voting rights, priority participation, and founding recognition on your high street.",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      available: true,
    },
    {
      id: "founding-monthly",
      title: "Join Founding Member Monthly",
      description: "Subscribe to the monthly Founding Member programme. Ongoing benefits including monthly rewards, priority access, and community recognition.",
      icon: Gift,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      available: true,
    },
    {
      id: "community-activity",
      title: "Participate in Community Activity",
      description: "Join community projects, local events, and neighbourhood initiatives. Build connections with other businesses and residents.",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      available: true,
    },
    {
      id: "rewards",
      title: "Access Applicable Rewards",
      description: "Earn rewards for your participation. Badges, discounts, recognition, and exclusive offers based on your activity level.",
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      available: true,
    },
    {
      id: "leaderboards",
      title: "Participate in Leaderboards",
      description: "Compete with other businesses on your high street and across {cityName}. Rank based on contributions, participation, and community impact.",
      icon: Sparkles,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      available: true,
    },
  ];

  const availableCount = opportunities.filter(o => o.available).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">YOUR OPPORTUNITIES</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">
              Your Business Can
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Based on your business type, membership, location, and the current season, here's what's available to you.
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

          {/* Location Context */}
          <div className="rounded-lg bg-gray-50 border p-3 mb-6 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Your Location</div>
              <div className="text-sm font-bold text-gray-900">{streetName}, {localAreaName}, {cityName}</div>
            </div>
          </div>

          {/* Opportunities Count */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-6 text-center">
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <div className="text-xs text-green-700">opportunities available to your business</div>
          </div>

          {/* Opportunity Cards */}
          <div className="space-y-3 mb-6">
            {opportunities.map((opp) => {
              const isExpanded = expandedId === opp.id;
              const Icon = opp.icon;
              return (
                <div key={opp.id} className={`rounded-xl border overflow-hidden ${opp.available ? opp.borderColor : "border-gray-200 opacity-60"}`}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${opp.bgColor}`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${opp.bgColor} ${opp.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{opp.title}</h3>
                        {opp.available && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                            AVAILABLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{opp.description}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t bg-white p-4">
                      <p className="text-sm text-gray-600 mb-3">{opp.description}</p>
                      <div className="rounded-lg bg-gray-50 p-3 mb-3">
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">How it works</div>
                        <ul className="space-y-1.5 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Based on your business type and location</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Calculated from the current season configuration</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Eligibility determined by membership and permissions</span>
                          </li>
                        </ul>
                      </div>
                      {opp.available && (
                        <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors">
                          Get Started
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* System Calculation Note */}
          <div className="rounded-lg bg-gray-50 border p-4 mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">How opportunities are determined</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Store className="h-3 w-3 text-gray-400" />
                <span>Business Type</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-gray-400" />
                <span>Membership</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span>Season</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Megaphone className="h-3 w-3 text-gray-400" />
                <span>Campaign Config</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-gray-400" />
                <span>User Permissions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span>Location</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              const state = campaign ? { campaign } : {};
              const slug = campaign?.slug || campaignSlugFromUrl || "";
              navigate(`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/participation?campaign=${slug}`, { state });
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
          >
            Choose How to Participate
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
