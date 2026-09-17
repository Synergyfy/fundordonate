// =============================================================================
// UK Hub — City Hub Page (hierarchy-aware)
// Resolves the deepest location from the URL and shows its children:
//   City → Local Areas (boroughs)
//   Borough/SubArea → High Streets
//   High Street → Campaigns
// =============================================================================

import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  getChildLocations, ALL_LOCATIONS,
  resolveSeedLocation, buildSyntheticLocation,
  getAreaTerminology,
} from "@/data/ukHubData";
import {
  getHubLocationBySlug, getDemoCampaignsForLocation,
} from "@/data/hubActivation";
import { getCityStats, getHighStreetData, getLocalAreasForCity, getHighStreetsForArea } from "@/data/highStreetData";
import type { HubLocation, BreadcrumbItem } from "@/types/uk-hub";
import { HubBreadcrumb } from "@/components/hub/HubBreadcrumb";
import {
  Calendar, Clock, Store, Users, ArrowLeft, MapPin,
  Target, ChevronRight,
} from "lucide-react";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
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

// Build breadcrumb chain from location upwards
function buildAncestors(location: HubLocation): BreadcrumbItem[] {
  const ancestors: BreadcrumbItem[] = [];
  let current: HubLocation | null = location;
  while (current?.parentId) {
    // Check ALL_LOCATIONS first, then build a synthetic parent from HUB_LOCATIONS
    let parent = ALL_LOCATIONS.find(l => l.id === current!.parentId);
    if (!parent) {
      const parentSlug = current!.parentId.replace(/^city-/, "");
      const mapLoc = getHubLocationBySlug(parentSlug);
      if (mapLoc) parent = buildSyntheticLocation(mapLoc);
    }
    if (parent) {
      ancestors.unshift({ label: parent.name, slug: parent.slug, fullPath: parent.fullPath || parent.slug, type: parent.type });
      current = parent;
    } else break;
  }
  return ancestors;
}

// Build a HIGH_STREET HubLocation from HighStreetData
function buildHighStreetLocation(
  hs: { name: string; slug: string; description: string; status: string; fundingTarget: number; fundingRaised: number; totalBusinesses: number; participatingBusinesses: number },
  parentId: string,
  citySlug: string,
  areaSlug: string,
): HubLocation {
  return {
    id: `hs-${citySlug}-${areaSlug}-${hs.slug}`,
    name: hs.name,
    slug: hs.slug,
    type: "HIGH_STREET",
    parentId,
    shortDescription: hs.description,
    description: hs.description,
    heroHeadline: hs.name,
    heroSupportingText: `High Street`,
    internalLifecycle: hs.status === "active" ? "ACTIVE" : "LAUNCHING",
    publicStatus: hs.status === "active" ? "ACTIVE" : hs.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION",
    statusOverride: null,
    isActive: hs.status === "active",
    isPublic: true,
    mapVisible: false,
    latitude: null,
    longitude: null,
    mapZoomLevel: 15,
    primaryImage: null,
    secondaryImage: null,
    fullPath: `${citySlug}/${areaSlug}/${hs.slug}`,
    isFeaturedNationally: false,
    featuredPriority: 0,
    fundingTarget: hs.fundingTarget,
    fundingRaised: hs.fundingRaised,
    activationThreshold: 80,
    foundingBusinessTotal: hs.totalBusinesses,
    foundingBusinessAllocated: hs.participatingBusinesses,
    foundingConsumerTotal: hs.totalBusinesses * 2,
    foundingConsumerAllocated: hs.participatingBusinesses * 2,
    createdAt: "",
    updatedAt: "",
  };
}

// Build a LOCAL_AREA HubLocation from LocalAreaData
function buildLocalAreaLocation(
  area: { name: string; slug: string; description: string; status: string; businesses: number; fundingTarget: number; fundingRaised: number },
  parentId: string,
  citySlug: string,
): HubLocation {
  return {
    id: `area-${citySlug}-${area.slug}`,
    name: area.name,
    slug: area.slug,
    type: "LOCAL_AREA",
    parentId,
    shortDescription: area.description,
    description: area.description,
    heroHeadline: area.name,
    heroSupportingText: `Local Area`,
    internalLifecycle: area.status === "active" ? "ACTIVE" : "LAUNCHING",
    publicStatus: area.status === "active" ? "ACTIVE" : area.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION",
    statusOverride: null,
    isActive: area.status === "active",
    isPublic: true,
    mapVisible: false,
    latitude: null,
    longitude: null,
    mapZoomLevel: 12,
    primaryImage: null,
    secondaryImage: null,
    fullPath: `${citySlug}/${area.slug}`,
    isFeaturedNationally: false,
    featuredPriority: 0,
    fundingTarget: area.fundingTarget,
    fundingRaised: area.fundingRaised,
    activationThreshold: 80,
    foundingBusinessTotal: area.businesses,
    foundingBusinessAllocated: Math.floor(area.businesses * 0.6),
    foundingConsumerTotal: area.businesses * 2,
    foundingConsumerAllocated: Math.floor(area.businesses * 1.2),
    createdAt: "",
    updatedAt: "",
  };
}

// Resolve the deepest location from the full path segments
function resolveDeepestLocation(segments: string[]): { location: HubLocation; depth: number } | null {
  const citySlug = segments[0] || "";

  // Strip UI-only segments (c-campaigns, b-campaigns) that aren't real locations
  const filteredSegments = segments.filter(s => s !== "c-campaigns" && s !== "b-campaigns");

  // First, find the deepest known seed/map location (city, borough)
  let bestResult: { location: HubLocation; depth: number } | null = null;
  for (let i = filteredSegments.length - 1; i >= 0; i--) {
    const trySlug = filteredSegments[i]!;
    const seed = resolveSeedLocation(trySlug, trySlug);
    if (seed) { bestResult = { location: seed, depth: i }; break; }
    const mapLoc = getHubLocationBySlug(trySlug);
    if (mapLoc) { bestResult = { location: buildSyntheticLocation(mapLoc), depth: i }; break; }
  }

  if (!bestResult) return null;

  // Walk forward from the known location through ALL remaining segments
  let current = bestResult.location;
  let currentDepth = bestResult.depth;

  while (currentDepth + 1 < filteredSegments.length) {
    const nextSlug = filteredSegments[currentDepth + 1]!;

    if (current.type === "CITY" || current.type === "BOROUGH" || current.type === "LOCAL_AREA") {
      // Try HIGH_STREET first (BOROUGH/LOCAL_AREA → HIGH_STREET)
      if (current.type !== "CITY") {
        const hs = getHighStreetData(citySlug, current.slug, nextSlug);
        if (hs) {
          current = buildHighStreetLocation(hs, current.id, citySlug, current.slug);
          currentDepth++;
          continue;
        }
      }
      // Try LOCAL_AREA (CITY → LOCAL_AREA, or BOROUGH → generated sub-area)
      const areas = getLocalAreasForCity(current.type === "CITY" ? (citySlug || current.slug) : current.slug);
      const matchingArea = areas.find(a => a.slug === nextSlug);
      if (matchingArea) {
        current = buildLocalAreaLocation(matchingArea, current.id, citySlug || current.slug);
        currentDepth++;
        continue;
      }
      // Try generated high streets via getHighStreetsForArea for any location
      const highStreets = getHighStreetsForArea(citySlug, current.type === "CITY" ? nextSlug : current.slug);
      const matchingHS = highStreets.find(hs => hs.slug === nextSlug);
      if (matchingHS) {
        const areaSlug = current.type === "CITY" ? nextSlug : current.slug;
        current = buildHighStreetLocation(matchingHS, current.id, citySlug, areaSlug);
        currentDepth++;
        continue;
      }
    }

    // Can't resolve this segment — stop
    break;
  }

  return { location: current, depth: currentDepth };
}

// Get children for a location based on its type in the hierarchy
function getLocationChildren(
  location: HubLocation,
  segments: string[],
): { children: HubLocation[]; childLinkPrefix: string; sectionTitle: string } {
  const citySlug = segments[0] || "";

  // CITY → show boroughs/sub-areas from ALL_LOCATIONS, or generated local areas
  if (location.type === "CITY") {
    let locChildren = getChildLocations(location.id);
    // If no children in ALL_LOCATIONS, generate from getLocalAreasForCity
    if (locChildren.length === 0) {
      const generatedAreas = getLocalAreasForCity(citySlug || location.slug);
      locChildren = generatedAreas.map((area) => ({
        id: `area-${citySlug || location.slug}-${area.slug}`,
        name: area.name,
        slug: area.slug,
        type: "LOCAL_AREA" as HubLocation["type"],
        parentId: location.id,
        shortDescription: area.description,
        description: area.description,
        heroHeadline: area.name,
        heroSupportingText: `Local Area — ${location.name}`,
        internalLifecycle: area.status === "active" ? "ACTIVE" : "LAUNCHING",
        publicStatus: area.status === "active" ? "ACTIVE" : area.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION",
        statusOverride: null,
        isActive: area.status === "active",
        isPublic: true,
        mapVisible: false,
        latitude: null,
        longitude: null,
        mapZoomLevel: 12,
        primaryImage: null,
        secondaryImage: null,
        fullPath: `${citySlug || location.slug}/${area.slug}`,
        isFeaturedNationally: false,
        featuredPriority: 0,
        fundingTarget: area.fundingTarget,
        fundingRaised: area.fundingRaised,
        activationThreshold: 80,
        foundingBusinessTotal: area.businesses,
        foundingBusinessAllocated: Math.floor(area.businesses * 0.6),
        foundingConsumerTotal: area.businesses * 2,
        foundingConsumerAllocated: Math.floor(area.businesses * 1.2),
        createdAt: "",
        updatedAt: "",
      }));
    }
    const hasBoroughs = locChildren.some(c => c.type === "BOROUGH");
    const areaTerm = getAreaTerminology(citySlug || location.slug);
    return {
      children: locChildren,
      childLinkPrefix: `/uk-hub-activation/${location.slug}`,
      sectionTitle: hasBoroughs ? `${areaTerm}s in ${location.name}` : `${areaTerm}s in ${location.name}`,
    };
  }

  // BOROUGH or LOCAL_AREA → show high streets using getHighStreetsForArea (consistent with getHighStreetData)
  if (location.type === "BOROUGH" || location.type === "LOCAL_AREA") {
    const highStreets = getHighStreetsForArea(citySlug, location.slug);
    if (highStreets.length > 0) {
      const hsChildren: HubLocation[] = highStreets.map((hs) => ({
        id: `hs-${citySlug}-${location.slug}-${hs.slug}`,
        name: hs.name,
        slug: hs.slug,
        type: "HIGH_STREET" as HubLocation["type"],
        parentId: location.id,
        shortDescription: hs.description,
        description: hs.description,
        heroHeadline: hs.name,
        heroSupportingText: `High Street — ${location.name}`,
        internalLifecycle: hs.status === "active" ? "ACTIVE" : "LAUNCHING",
        publicStatus: hs.status === "active" ? "ACTIVE" : hs.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION",
        statusOverride: null,
        isActive: hs.status === "active",
        isPublic: true,
        mapVisible: false,
        latitude: null,
        longitude: null,
        mapZoomLevel: 15,
        primaryImage: null,
        secondaryImage: null,
        fullPath: `${citySlug}/${location.slug}/${hs.slug}`,
        isFeaturedNationally: false,
        featuredPriority: 0,
        fundingTarget: hs.fundingTarget,
        fundingRaised: hs.fundingRaised,
        activationThreshold: 80,
        foundingBusinessTotal: hs.totalBusinesses,
        foundingBusinessAllocated: hs.participatingBusinesses,
        foundingConsumerTotal: hs.totalBusinesses * 2,
        foundingConsumerAllocated: hs.participatingBusinesses * 2,
        createdAt: "",
        updatedAt: "",
      }));
      return {
        children: hsChildren,
        childLinkPrefix: `/uk-hub-activation/${citySlug}/${location.slug}`,
        sectionTitle: `High Streets in ${location.name}`,
      };
    }
    // Fallback: try ALL_LOCATIONS children (sub-areas of boroughs)
    const locChildren = getChildLocations(location.id);
    if (locChildren.length > 0) {
      return {
        children: locChildren,
        childLinkPrefix: `/uk-hub-activation/${citySlug}/${location.slug}`,
        sectionTitle: `Local Areas in ${location.name}`,
      };
    }
    return { children: [], childLinkPrefix: "", sectionTitle: `Areas in ${location.name}` };
  }

  // HIGH STREET → show Business/Consumer choice (rendered directly in JSX)
  if (location.type === "HIGH_STREET") {
    return { children: [], childLinkPrefix: "", sectionTitle: "" };
  }

  return { children: [], childLinkPrefix: "", sectionTitle: `Areas in ${location.name}` };
}

// ───────────────────── Page ─────────────────────

export default function CityHubPage() {
  const loc = useLocation();
  // Strip the route prefix to get the path segments after /uk-hub-activation/
  const locationPath = loc.pathname.replace(/^\/uk-hub-activation\/?/, "");
  const segments = locationPath.split("/").filter(Boolean);

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  // Resolve deepest location from full path
  const resolved = resolveDeepestLocation(segments);
  const location = resolved?.location ?? null;

  if (!location) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300">Location Not Found</h1>
          <p className="mt-4 text-gray-600">The hub location "{locationPath}" doesn't exist.</p>
          <Link to="/uk-hub-activation" className="btn-primary mt-6 inline-block">
            ← Back to UK Hub
          </Link>
        </div>
      </div>
    );
  }

  const ancestors = buildAncestors(location);
  const { children, childLinkPrefix, sectionTitle } = getLocationChildren(location, segments);

  const isHighStreet = location.type === "HIGH_STREET";
  const citySlug = segments[0] || location.slug;
  const mapLoc = getHubLocationBySlug(citySlug);
  const campaigns = mapLoc ? getDemoCampaignsForLocation(mapLoc) : [];
  const activationPct = location.publicStatus === "ACTIVE" ? 100 : location.publicStatus === "MAKING_PROGRESS" ? 65 : 25;

  const cityStats = getCityStats(citySlug);
  const totalBusinesses = cityStats?.totalBusinesses ?? (location.foundingBusinessAllocated * 10);
  const totalConsumers = cityStats?.totalConsumers ?? (location.foundingConsumerAllocated * 10);
  const totalHighStreets = cityStats?.totalHighStreets ?? 0;
  const totalLocalAreas = cityStats?.totalLocalAreas ?? children.length;
  const parentPath = ancestors.length > 0
    ? `/uk-hub-activation/${ancestors.map(a => a.slug).join("/")}`
    : "/uk-hub-activation";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to={parentPath}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <HubBreadcrumb items={[...ancestors, { label: location.name, slug: location.slug, fullPath: location.fullPath || location.slug, type: location.type }]} />
      </div>

      {/* ═══════════════ LOCATION INFO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {location.primaryImage && (
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${location.primaryImage}')` }} />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Dynamic title based on location type */}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {location.type === "CITY" && `${location.name} City Hub`}
              {location.type === "LOCAL_AREA" && location.name}
              {location.type === "BOROUGH" && `${location.name} Borough`}
              {location.type === "HIGH_STREET" && location.name}
            </h1>

            {/* Dynamic subtitle based on location type */}
            <p className="mt-3 text-lg text-gray-300 max-w-2xl">
              {location.type === "CITY"
                ? `Building a stronger local business and community network across ${location.name}. Explore local areas, high streets, and campaigns below.`
                : location.type === "LOCAL_AREA"
                  ? `Discover high streets, local businesses, and community campaigns in ${location.name}.`
                  : location.type === "BOROUGH"
                    ? `Explore high streets, local areas, and community campaigns across ${location.name}.`
                    : location.description || `Explore campaigns, local businesses, and community initiatives on ${location.name}.`
              }
            </p>

            {/* Season — shown on all levels */}
            {currentSeason && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-blue-200" />
                  <span className="text-sm font-bold">{currentSeason.name}</span>
                  <span className="text-xs text-blue-200">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
                </div>
                {location.publicStatus === "ACTIVE" && isActive && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-200" />
                    <div className="flex gap-1">
                      {[
                        { value: countdown.days, label: "d" },
                        { value: countdown.hours, label: "h" },
                        { value: countdown.minutes, label: "m" },
                      ].map((item) => (
                        <span key={item.label} className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold tabular-nums">
                          {String(item.value).padStart(2, "0")}{item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activation Status */}
            <div className="mt-4 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                location.publicStatus === "ACTIVE" ? "bg-green-500/20 text-green-300" :
                location.publicStatus === "MAKING_PROGRESS" ? "bg-blue-500/20 text-blue-300" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {location.publicStatus === "ACTIVE" ? "Active" :
                  location.publicStatus === "MAKING_PROGRESS" ? "Making Progress" : "Inactive"}
              </span>
              <span className="text-sm text-gray-300">{activationPct}% activated</span>
            </div>

            {/* Stats Grid — dynamic based on location type */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/10 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <Store className="h-3 w-3" /> Businesses
                </div>
                <div className="text-lg font-bold">{fmtNumber(totalBusinesses)}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <Users className="h-3 w-3" /> Consumers
                </div>
                <div className="text-lg font-bold">{fmtNumber(totalConsumers)}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <Target className="h-3 w-3" /> {isHighStreet ? "Campaigns" : location.type === "CITY" ? "Campaigns" : "Campaigns"}
                </div>
                <div className="text-lg font-bold">{campaigns.length}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <MapPin className="h-3 w-3" /> {location.type === "CITY" ? "Local Areas" : location.type === "HIGH_STREET" ? "Funding" : "High Streets"}
                </div>
                <div className="text-lg font-bold">
                  {location.type === "CITY" ? fmtNumber(totalLocalAreas) :
                   location.type === "HIGH_STREET" ? `${Math.min(100, Math.round((location.fundingRaised / Math.max(location.fundingTarget, 1)) * 100))}%` :
                   fmtNumber(totalHighStreets)}
                </div>
              </div>
            </div>

            {/* Funding — shown on all levels */}
            {location.fundingTarget > 0 && (
              <div className="mt-4 rounded-lg bg-white/10 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">Funding</span>
                  <span className="text-xs font-bold">{Math.min(100, Math.round((location.fundingRaised / location.fundingTarget) * 100))}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, Math.round((location.fundingRaised / location.fundingTarget) * 100))}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{fmtCurrency(location.fundingRaised)} raised</span>
                  <span className="text-xs text-gray-400">of {fmtCurrency(location.fundingTarget)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      {location.type === "CITY" && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white border p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              {location.name} City Hub connects local businesses and consumers to build a stronger community.
              Explore your local areas below to find high streets, campaigns, and opportunities near you.
            </p>
          </div>
        </section>
      )}
      {location.type === "LOCAL_AREA" && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white border p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              {location.name} connects local high streets and businesses to build a stronger community.
              Explore high streets below to find campaigns, businesses, and opportunities near you.
            </p>
          </div>
        </section>
      )}
      {location.type === "HIGH_STREET" && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white border p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              {location.name} is a thriving local high street with active community campaigns and local businesses.
              Browse opening campaigns below and support your local community.
            </p>
          </div>
        </section>
      )}

      {/* ═══════════════ CHILDREN LIST / HIGH STREET CHOICE ═══════════════ */}
      {isHighStreet ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">How would you like to participate?</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* For Business */}
            <Link
              to={`/uk-hub-activation/${segments[0]}/${segments[1]}/${segments[2]}/business`}
              className="group rounded-xl bg-white border p-8 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">For Business</h3>
                  <p className="text-sm text-gray-500">Business Owners</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                View campaigns and opportunities available to Business Owners. Connect with other local businesses and support your high street.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                <span>For Business</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* For Consumer */}
            <Link
              to={`/uk-hub-activation/${segments[0]}/${segments[1]}/${segments[2]}/consumer`}
              className="group rounded-xl bg-white border p-8 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-pink-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-pink-100 p-3">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">For Consumer</h3>
                  <p className="text-sm text-gray-500">Consumers</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                View campaigns and opportunities available to Consumers. Support local causes and build a stronger community.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-pink-600">
                <span>For Consumer</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{sectionTitle}</h2>
          {children.length === 0 ? (
            <div className="rounded-xl bg-white border p-8 text-center text-gray-400">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No items found yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => {
                const childActivation = child.publicStatus === "ACTIVE" ? 100 : child.publicStatus === "MAKING_PROGRESS" ? 65 : 25;
                const childLink = `${childLinkPrefix}/${child.slug}`;
                return (
                  <Link
                    key={child.id}
                    to={childLink}
                    className="group rounded-xl bg-white border p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 group-hover:text-primary-600">{child.name}</h3>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        child.publicStatus === "ACTIVE" ? "bg-green-100 text-green-700" :
                        child.publicStatus === "MAKING_PROGRESS" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {child.internalLifecycle === "ACTIVE" && child.statusOverride === "ACTIVE" ? "Opening" :
                          child.publicStatus === "ACTIVE" ? "Active" :
                          child.publicStatus === "MAKING_PROGRESS" ? "Making Progress" : "Inactive"}
                      </span>
                      <span className="text-xs text-gray-500">{childActivation}% activated</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{child.shortDescription}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${childActivation}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
