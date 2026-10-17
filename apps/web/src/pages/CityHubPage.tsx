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
import { seasonApi } from "@/services/season";
import { locationService } from "@/services/location";
import { campaignApi } from "@/services/campaign";
import { getAreaTerminology, type HubLocation, type BreadcrumbItem } from "@/types/uk-hub";
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

// ───────────────────── Page ─────────────────────

export default function CityHubPage() {
  const loc = useLocation();
  // Strip the route prefix to get the path segments after /uk-hub-activation/
  const locationPath = loc.pathname.replace(/^\/uk-hub-activation\/?/, "");
  const segments = locationPath.split("/").filter(s => Boolean(s) && s !== "c-campaigns" && s !== "b-campaigns");
  const citySlug = segments[0] || "";
  const areaSlug = segments[1] || "";
  const streetSlug = segments[2] || "";

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const { data: hierarchy, isLoading: hierarchyLoading } = useQuery({
    queryKey: ["city-hierarchy", citySlug],
    queryFn: () => locationService.getCityWithHierarchy(citySlug),
    enabled: !!citySlug,
  });

  const { data: campaignResponse } = useQuery({
    queryKey: ["city-campaigns", citySlug, areaSlug, streetSlug],
    queryFn: () =>
      (campaignApi.list as any)({
        location: streetSlug || areaSlug || citySlug,
        limit: 50,
      }),
    enabled: Boolean(citySlug),
  });

  const campaigns: any[] = campaignResponse?.items ?? [];

  const { location, ancestors, children, childLinkPrefix, sectionTitle, isHighStreet } = React.useMemo(() => {
    if (!hierarchy) {
      return { location: null, ancestors: [], children: [], childLinkPrefix: "", sectionTitle: "", isHighStreet: false };
    }
    const city = (hierarchy as any).city || hierarchy;
    const areaTerm = getAreaTerminology(citySlug);

    if (!areaSlug) {
      return {
        location: city,
        ancestors: [],
        children: (hierarchy.localAreas || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          type: "LOCAL_AREA" as const,
          publicStatus: a.publicStatus || (a.status === "active" ? "ACTIVE" : a.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"),
          shortDescription: a.description || `Local Area in ${city.name}`,
        })),
        childLinkPrefix: `/uk-hub-activation/${citySlug}`,
        sectionTitle: `${areaTerm}s in ${city.name}`,
        isHighStreet: false,
      };
    }

    const matchedArea = (hierarchy.localAreas || []).find((a: any) => a.slug === areaSlug);
    const areaLocation = matchedArea || {
      id: `area-${citySlug}-${areaSlug}`,
      name: areaSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      slug: areaSlug,
      type: "LOCAL_AREA" as const,
      publicStatus: "MAKING_PROGRESS",
      shortDescription: "",
      fundingTarget: 0,
      fundingRaised: 0,
      foundingBusinessAllocated: 0,
      foundingConsumerAllocated: 0,
    };

    if (!streetSlug) {
      const highStreets = matchedArea?.highStreetsList || [];
      return {
        location: areaLocation,
        ancestors: [{ label: city.name, slug: city.slug, fullPath: city.slug, type: "CITY" as const }],
        children: highStreets.map((hs: any) => ({
          id: hs.id,
          name: hs.name,
          slug: hs.slug,
          type: "HIGH_STREET" as const,
          publicStatus: hs.publicStatus || (hs.status === "active" ? "ACTIVE" : hs.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"),
          shortDescription: hs.description || `High Street in ${areaLocation.name}`,
        })),
        childLinkPrefix: `/uk-hub-activation/${citySlug}/${areaSlug}`,
        sectionTitle: `High Streets in ${areaLocation.name}`,
        isHighStreet: false,
      };
    }

    const matchedStreet = matchedArea?.highStreetsList?.find((hs: any) => hs.slug === streetSlug);
    const streetLocation = matchedStreet || {
      id: `hs-${citySlug}-${areaSlug}-${streetSlug}`,
      name: streetSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      slug: streetSlug,
      type: "HIGH_STREET" as const,
      publicStatus: "ACTIVE",
      description: "",
      fundingTarget: 0,
      fundingRaised: 0,
      foundingBusinessAllocated: 0,
      foundingConsumerAllocated: 0,
    };

    return {
      location: streetLocation,
      ancestors: [
        { label: city.name, slug: city.slug, fullPath: city.slug, type: "CITY" as const },
        { label: areaLocation.name, slug: areaLocation.slug, fullPath: `${city.slug}/${areaLocation.slug}`, type: "LOCAL_AREA" as const },
      ],
      children: [],
      childLinkPrefix: "",
      sectionTitle: "",
      isHighStreet: true,
    };
  }, [hierarchy, citySlug, areaSlug, streetSlug]);

  if (hierarchyLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading hub location...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300">Location Not Found</h1>
          <p className="mt-4 text-gray-600">The hub location "${locationPath}" doesn't exist.</p>
          <Link to="/uk-hub-activation" className="btn-primary mt-6 inline-block">
            ← Back to UK Hub
          </Link>
        </div>
      </div>
    );
  }

  const activationProgress = Number((location as any).activationProgress);
  const activationPct =
    Number.isFinite(activationProgress) && activationProgress > 0
      ? Math.min(100, Math.round(activationProgress))
      : location.publicStatus === "ACTIVE"
        ? 100
        : 0;
  const rawBusinesses = (location as any).businessesCount ?? (location as any).businesses;
  const totalBusinesses = Number(Array.isArray(rawBusinesses) ? rawBusinesses.length : rawBusinesses) || 0;
  const totalConsumers = Number((location as any).consumersCount ?? (location as any).consumers) || 0;
  const totalHighStreets = (hierarchy?.localAreas || []).reduce((acc: number, a: any) => acc + (a.highStreetsList?.length || 0), 0);
  const totalLocalAreas = hierarchy?.localAreas?.length || children.length;
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
              {children.map((child: any) => {
                const childProgress = Number(child.activationProgress);
                const childActivation =
                  Number.isFinite(childProgress) && childProgress > 0
                    ? Math.min(100, Math.round(childProgress))
                    : child.publicStatus === "ACTIVE"
                      ? 100
                      : 0;
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
