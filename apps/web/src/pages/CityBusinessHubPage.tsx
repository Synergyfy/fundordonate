// =============================================================================
// UK Hub — City Business Hub Page
// Shows the business-focused view of a city hub after user selects "Join as a Business".
// =============================================================================

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  getChildLocations, DEMO_HUB_ACTIVITY, ALL_LOCATIONS,
  resolveSeedLocation, buildSyntheticLocation,
} from "@/data/ukHubData";
import {
  getHubLocationBySlug, getDemoCampaignsForLocation,
} from "@/data/hubActivation";
import { getCityStats } from "@/data/highStreetData";
import type { HubLocation, HubActivity, BreadcrumbItem } from "@/types/uk-hub";
import { LOCATION_TYPE_META } from "@/types/uk-hub";
import { HubBreadcrumb } from "@/components/hub/HubBreadcrumb";
import { Leaderboard } from "@/components/campaign/Leaderboard";
import { Tooltip, TOOLTIPS } from "@/components/ui/Tooltip";
import {
  Calendar, Store, ArrowRight, ArrowLeft,
  Target, TrendingUp, ChevronDown, ChevronUp,
  Trophy, Gift, Zap, Handshake, Heart,
} from "lucide-react";

const NOW = new Date().toISOString();

function mapActivityToHubActivity(activity: string[], locId: string): HubActivity[] {
  return activity.map((text, i) => ({
    id: `ha-${locId}-map-${i}`,
    locationId: locId,
    activityType: "MILESTONE" as const,
    title: text,
    content: null,
    publicationStatus: "PUBLISHED" as const,
    publishedAt: NOW,
    visibilityScope: "LOCATION" as const,
    createdAt: NOW,
  }));
}

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

const fmtNumber = (n: number) => new Intl.NumberFormat("en-GB").format(n);

// ───────────────────── Page ─────────────────────

export default function CityBusinessHubPage() {
  const params = useParams();
  const slug = params.slug || "";
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const seed = resolveSeedLocation(slug, slug);
  const mapLoc = getHubLocationBySlug(slug) ?? (seed ? getHubLocationBySlug(seed.slug) : undefined);
  const location: HubLocation | null = seed ?? (mapLoc ? buildSyntheticLocation(mapLoc) : null);

  if (!location) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-300 sm:text-4xl">Location Not Found</h1>
          <p className="mt-4 text-gray-600">The hub location "{slug}" doesn't exist.</p>
          <Link to="/uk-hub-activation" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500">
            ← Back to UK Hub
          </Link>
        </div>
      </div>
    );
  }

  const ancestors: BreadcrumbItem[] = [];
  let current: HubLocation | null = location;
  while (current?.parentId) {
    const parent = ALL_LOCATIONS.find(l => l.id === current!.parentId);
    if (parent) {
      ancestors.unshift({ label: parent.name, slug: parent.slug, fullPath: parent.fullPath || parent.slug, type: parent.type });
      current = parent;
    } else break;
  }

  const children = getChildLocations(location.id);
  
  const firstChild = children[0];
  const childType = firstChild?.type ?? "LOCAL_AREA";
  const metaKey = childType as keyof typeof LOCATION_TYPE_META;
  const childMeta = metaKey in LOCATION_TYPE_META ? LOCATION_TYPE_META[metaKey] : LOCATION_TYPE_META.LOCAL_AREA;
  const localAreaLabel = childMeta.plural;
  const localAreaLabelSingular = childMeta.label;

  const seededActivity = DEMO_HUB_ACTIVITY.filter(a => a.locationId === location.id);
  const activity = seededActivity.length > 0
    ? seededActivity
    : mapLoc ? mapActivityToHubActivity(mapLoc.activity, location.id) : [];

  const campaigns = mapLoc ? getDemoCampaignsForLocation(mapLoc) : [];
  const activationPct = location.publicStatus === "ACTIVE" ? 100 : location.publicStatus === "MAKING_PROGRESS" ? 65 : 25;

  // Use unified high street data for stable counters
  const cityStats = getCityStats(slug);
  const totalBusinesses = cityStats?.totalBusinesses ?? (location.foundingBusinessAllocated * 10);
  const totalHighStreets = cityStats?.totalHighStreets ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to={`/uk-hub-activation/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {location.name} City Hub
        </Link>
        <HubBreadcrumb items={[...ancestors, { label: location.name, slug: location.slug, fullPath: location.fullPath || location.slug, type: location.type }]} />
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        {location.primaryImage && (
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${location.primaryImage}')` }} />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{location.name} Business Hub</h1>
          <p className="mt-2 text-sm text-blue-200 max-w-2xl sm:text-lg">
            Your local business community. Connect, participate, and grow together.
          </p>

          {/* Season */}
          {currentSeason && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 w-fit sm:mt-4">
              <Calendar className="h-4 w-4 text-blue-200" />
              <span className="text-xs font-bold sm:text-sm">{currentSeason.name}</span>
              <span className="text-[10px] text-blue-200 sm:text-xs">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-lg bg-white/10 p-2 sm:p-3">
              <div className="text-[10px] text-blue-200 sm:text-xs">Activation</div>
              <div className="text-lg font-bold sm:text-2xl">{activationPct}%</div>
            </div>
            <div className="rounded-lg bg-white/10 p-2 sm:p-3">
              <div className="text-[10px] text-blue-200 sm:text-xs">Businesses</div>
              <div className="text-lg font-bold sm:text-2xl">{fmtNumber(totalBusinesses)}</div>
            </div>
            <div className="rounded-lg bg-white/10 p-2 sm:p-3">
              <div className="text-[10px] text-blue-200 sm:text-xs">High Streets</div>
              <div className="text-lg font-bold sm:text-2xl">{totalHighStreets}</div>
            </div>
            <div className="rounded-lg bg-white/10 p-2 sm:p-3">
              <div className="text-[10px] text-blue-200 sm:text-xs">Campaigns</div>
              <div className="text-lg font-bold sm:text-2xl">{campaigns.length}</div>
            </div>
          </div>

          {/* Funding */}
          <div className="mt-3 rounded-lg bg-white/10 p-2 sm:mt-4 sm:p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-blue-200 sm:text-xs">City Funding</span>
              <span className="text-[10px] font-bold sm:text-xs">{fmtCurrency(location.fundingRaised)} / {fmtCurrency(location.fundingTarget)}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden sm:h-2">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, Math.round((location.fundingRaised / location.fundingTarget) * 100))}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHAT'S HAPPENING ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 sm:text-xl sm:mb-6">What's happening in {location.name}?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Current Campaigns */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Target className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Current Campaigns</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2 sm:text-sm sm:mb-3">Active campaigns seeking business participation.</p>
            <div className="text-xl font-bold text-blue-600 sm:text-2xl">{campaigns.length} campaigns</div>
            <Link to={`/campaigns?city=${slug}`} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 sm:text-sm">
              View campaigns <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* City Funding Objectives */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <TrendingUp className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Funding Objectives</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2 sm:text-sm sm:mb-3">Help reach the funding target for community projects.</p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, Math.round((location.fundingRaised / location.fundingTarget) * 100))}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 sm:text-xs">
              <span>{fmtCurrency(location.fundingRaised)} raised</span>
              <span>{fmtCurrency(location.fundingTarget)} target</span>
            </div>
          </div>

          {/* Local Business Activity */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Store className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Business Activity</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2 sm:text-sm sm:mb-3">See what local businesses are doing.</p>
            <div className="text-xl font-bold text-purple-600 sm:text-2xl">{fmtNumber(totalBusinesses)} businesses</div>
          </div>

          {/* Community Initiatives */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Heart className="h-4 w-4 text-red-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Community Initiatives</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2 sm:text-sm sm:mb-3">Join community projects and make a difference.</p>
            <div className="text-xl font-bold text-red-600 sm:text-2xl">{activity.length} initiatives</div>
          </div>

          {/* Seasonal Programme */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Calendar className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Seasonal Programme</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2 sm:text-sm sm:mb-3">Current season activities and opportunities.</p>
            {currentSeason && (
              <div className="text-xs sm:text-sm">
                <span className="font-bold">{currentSeason.name}</span>
                <span className="text-gray-500 ml-1 sm:ml-2">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Gift className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Rewards</h3>
            </div>
            <p className="text-xs text-gray-600 sm:text-sm">Earn rewards for your business participation and contributions to the community.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════ LEADERBOARDS & RECOGNITION ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {/* Leaderboard (Collapsible) */}
          <div className="rounded-xl bg-white border overflow-hidden">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex w-full items-center justify-between p-4 text-left sm:p-5"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
                <h3 className="text-sm font-bold text-gray-900 sm:text-base">Business Leaderboard</h3>
              </div>
              {showLeaderboard ? <ChevronUp className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />}
            </button>
            {showLeaderboard && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <Leaderboard level="city" scopeId={location.id} size={5} />
              </div>
            )}
          </div>

          {/* Recognition */}
          <div className="rounded-xl bg-white border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Zap className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">Recognition</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3 sm:text-sm sm:mb-4">Businesses are recognized for their contributions.</p>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-2 sm:p-3 sm:gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center sm:h-8 sm:w-8">
                  <Trophy className="h-3 w-3 text-yellow-600 sm:h-4 sm:w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 sm:text-sm">Founding Business</div>
                  <div className="text-[10px] text-gray-500 sm:text-xs">First 150 businesses to join</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2 sm:p-3 sm:gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center sm:h-8 sm:w-8">
                  <Zap className="h-3 w-3 text-blue-600 sm:h-4 sm:w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 sm:text-sm">Active Contributor</div>
                  <div className="text-[10px] text-gray-500 sm:text-xs">Businesses with active campaigns</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 sm:p-3 sm:gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center sm:h-8 sm:w-8">
                  <Handshake className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 sm:text-sm">Community Champion</div>
                  <div className="text-[10px] text-gray-500 sm:text-xs">Top contributors to local initiatives</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ LOCAL OPPORTUNITIES ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 sm:text-xl sm:mb-6">Local Opportunities</h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[
            { title: "Business Networking", desc: "Connect with other businesses in your area", icon: Handshake, color: "blue" },
            { title: "Campaign Creation", desc: "Create campaigns to fund your business initiatives", icon: Target, color: "purple" },
            { title: "Community Partnerships", desc: "Partner with local organizations", icon: Heart, color: "red" },
          ].map((opp) => {
            const Icon = opp.icon;
            return (
              <div key={opp.title} className="rounded-xl bg-white border p-4 hover:shadow-md transition-shadow sm:p-5">
                <div className={`h-8 w-8 rounded-lg bg-${opp.color}-100 flex items-center justify-center mb-2 sm:h-10 sm:w-10 sm:mb-3`}>
                  <Icon className={`h-4 w-4 text-${opp.color}-600 sm:h-5 sm:w-5`} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 sm:text-base">{opp.title}</h3>
                <p className="text-xs text-gray-600 sm:text-sm">{opp.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ FIND YOUR LOCAL AREA ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Find your {localAreaLabelSingular.toLowerCase()}</h2>
          <Tooltip content={childType === "BOROUGH" ? TOOLTIPS.borough : TOOLTIPS.localArea} />
        </div>
        <p className="text-xs text-gray-600 mb-4 sm:text-sm sm:mb-6">
          {location.name} → {localAreaLabel} → High Streets → Businesses
        </p>

        {children.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {children.map(child => {
              const childActivationPct = child.publicStatus === "ACTIVE" ? 100 : child.publicStatus === "MAKING_PROGRESS" ? 65 : 25;
              const childBusinesses = child.foundingBusinessAllocated * 10;
              const childHighStreets = Math.floor(childActivationPct / 20);
              const childCampaigns = Math.floor(childActivationPct / 15);
              const childFundingPct = Math.min(100, Math.round((child.fundingRaised / child.fundingTarget) * 100));
              
              return (
                <div key={child.id} className="rounded-xl bg-white border p-4 hover:shadow-md transition-shadow sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm font-bold text-gray-900 sm:text-base">{child.name}</h3>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:px-2 sm:text-xs ${
                      child.publicStatus === "ACTIVE" ? "bg-green-100 text-green-700" :
                      child.publicStatus === "MAKING_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {child.publicStatus === "ACTIVE" ? "Active" :
                        child.publicStatus === "MAKING_PROGRESS" ? "Making Progress" : "Inactive"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 sm:gap-3 sm:mb-4">
                    <div className="text-center rounded-lg bg-gray-50 p-2">
                      <div className="text-base font-bold text-gray-900 sm:text-lg">{childActivationPct}%</div>
                      <div className="text-[10px] text-gray-500 sm:text-xs">Activation</div>
                    </div>
                    <div className="text-center rounded-lg bg-gray-50 p-2">
                      <div className="text-base font-bold text-gray-900 sm:text-lg">{childBusinesses}</div>
                      <div className="text-[10px] text-gray-500 sm:text-xs">Businesses</div>
                    </div>
                    <div className="text-center rounded-lg bg-gray-50 p-2">
                      <div className="text-base font-bold text-gray-900 sm:text-lg">{childHighStreets}</div>
                      <div className="text-[10px] text-gray-500 sm:text-xs">High Streets</div>
                    </div>
                    <div className="text-center rounded-lg bg-gray-50 p-2">
                      <div className="text-base font-bold text-gray-900 sm:text-lg">{childCampaigns}</div>
                      <div className="text-[10px] text-gray-500 sm:text-xs">Campaigns</div>
                    </div>
                  </div>
                  
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500 sm:text-xs">Funding</span>
                      <span className="text-[10px] font-bold text-gray-700 sm:text-xs">{childFundingPct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden sm:h-2">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${childFundingPct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-500 sm:text-xs">{fmtCurrency(child.fundingRaised)} raised</span>
                      <span className="text-[10px] text-gray-500 sm:text-xs">of {fmtCurrency(child.fundingTarget)}</span>
                    </div>
                  </div>
                  
                  <Link
                    to={`/business/${slug}/local-area/${child.slug}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors sm:gap-2 sm:px-4 sm:text-sm"
                  >
                    Explore {localAreaLabelSingular}
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white text-center sm:p-6">
          <h3 className="text-lg font-bold mb-2 sm:text-xl">Ready to get started?</h3>
          <p className="text-sm text-blue-100 mb-4">Join {location.name} Business Hub and start your journey today.</p>
          <Link
            to={`/business/${slug}/local-area`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors sm:px-6 sm:text-base"
          >
            <Store className="h-4 w-4" />
            Get Started as a Business Owner
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
