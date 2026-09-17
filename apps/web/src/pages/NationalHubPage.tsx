// =============================================================================
// UK Hub — National Hub Overview Page
// Shows UK national map with city statuses, season info, and exploration.
// =============================================================================

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import {
  NATIONAL_HUB, getNationalHubSummary, getCitiesByStatus, getCities,
  formatCurrency, formatNumber,
} from "@/data/ukHubData";
import {
  HUB_LOCATIONS, HUB_STATUS_META,
  type HubLocation as MapHubLocation, type HubStatus,
} from "@/data/hubActivation";
import { getCityStats } from "@/data/highStreetData";
import { LocationStatusBadge } from "@/components/hub/HubStatusBadge";
import { UkMap } from "@/components/hub/UkMap";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Calendar, Clock, Store, Users, MapPin, Megaphone,
  ArrowRight, Info, ChevronDown, ChevronUp, Search,
} from "lucide-react";

// ───────────────────── Helpers ─────────────────────

function safeCurrency(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? formatCurrency(n) : "£0";
}
function safePct(v: unknown, t: unknown): number {
  const n = Number(v);
  const d = Number(t);
  if (!d || d <= 0 || !Number.isFinite(n)) return 0;
  return Math.min(Math.round((n / d) * 100), 100);
}

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

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

// ───────────────────── Data ─────────────────────

const STATUS_TABS: { value: HubStatus | "all"; label: string; tooltip: string; color: string }[] = [
  { value: "all", label: "All", tooltip: "Show every city.", color: "#6b7280" },
  { value: "active", label: "Active", tooltip: "Cities at full activation.", color: "#22c55e" },
  { value: "making_progress", label: "Making Progress", tooltip: "Cities moving towards activation.", color: "#3b82f6" },
   { value: "needs_activation", label: "Inactive", tooltip: "Cities identified but not yet activated.", color: "#eab308" },
];

const ABOUT_UK_HUB = {
  title: "About UK Hub Activation",
  short: "The UK Hub Activation Programme connects cities across the United Kingdom through a network of local hubs, enabling businesses and consumers to participate in local campaigns and community initiatives.",
  full: {
    intro: "The UK Hub Activation Programme is a nationwide initiative that creates a network of connected city hubs across the United Kingdom. Each city hub operates within the current season programme, enabling businesses and consumers to participate in local campaigns, funding objectives, and community initiatives.",
    sections: [
      {
        title: "How It Works",
        content: "Cities across the UK are identified and enter an activation lifecycle. Each city gets its own hub with local campaigns, founding opportunities, and community participation. The programme operates in seasonal cycles, with each season bringing new opportunities for participation."
      },
      {
        title: "City Hubs",
        content: "Each city hub is a self-contained ecosystem where businesses and consumers can connect, participate in campaigns, and support their local community. Hubs progress through activation stages from identified to fully active."
      },
      {
        title: "Business Participation",
        content: "Businesses join as Founding Members to get early access, voting rights, and priority participation. They create campaigns, connect with other businesses, and help shape their local hub from the start."
      },
      {
        title: "Consumer Participation",
        content: "Consumers support local campaigns, donate to causes they care about, and earn recognition for their contributions. They help shape the hub from the start and build a stronger local community."
      },
      {
        title: "Seasonal Programme",
        content: "The programme operates in seasonal cycles. Each season has specific dates, funding objectives, and participation opportunities. Cities and participants work together to achieve season goals."
      }
    ]
  }
};

// ───────────────────── About Modal ─────────────────────

function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl sm:rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">{ABOUT_UK_HUB.title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-gray-600">{ABOUT_UK_HUB.full.intro}</p>
          {ABOUT_UK_HUB.full.sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.content}</p>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 border-t bg-white px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Season Banner ─────────────────────

function SeasonBanner({ currentSeason, nextSeason }: { currentSeason: Season | null; nextSeason: Season | null }) {
  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  if (!currentSeason) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-bold text-blue-900">{currentSeason.name}</span>
        <span className="text-xs text-blue-600">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          currentSeason.status === "ACTIVE" ? "bg-green-100 text-green-700" :
          currentSeason.status === "SCHEDULED" ? "bg-amber-100 text-amber-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {currentSeason.status}
        </span>
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <div className="flex gap-1">
            {[
              { value: countdown.days, label: "d" },
              { value: countdown.hours, label: "h" },
              { value: countdown.minutes, label: "m" },
              { value: countdown.seconds, label: "s" },
            ].map((item) => (
              <span key={item.label} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-blue-800">
                {String(item.value).padStart(2, "0")}{item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {nextSeason && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs text-blue-600">Up Next:</span>
          <span className="text-sm font-bold text-blue-900">{nextSeason.name}</span>
          <span className="text-xs text-blue-600">{fmtDate(nextSeason.startDate)}</span>
        </div>
      )}
    </div>
  );
}

// ───────────────────── City Status Legend ─────────────────────

// ───────────────────── City Panel (Enhanced) ─────────────────────

function CityInfoPanel({ location, onClose, currentSeason }: { location: MapHubLocation; onClose: () => void; currentSeason: Season | null }) {
  const meta = HUB_STATUS_META[location.status];

  // Use unified high street data instead of Math.random()
  const cityStats = getCityStats(location.slug);
  const fin = cityStats ? {
    fundingRaised: Math.floor(location.activationProgress * 2000),
    fundingTarget: 200000,
    localAreas: cityStats.totalLocalAreas,
    highStreets: cityStats.totalHighStreets,
    businesses: cityStats.totalBusinesses,
    consumers: cityStats.totalConsumers,
    campaigns: cityStats.totalCampaigns,
  } : {
    fundingRaised: Math.floor(location.activationProgress * 2000),
    fundingTarget: 200000,
    localAreas: 0,
    highStreets: 0,
    businesses: 0,
    consumers: 0,
    campaigns: 0,
  };
  const fundingPct = safePct(fin.fundingRaised, fin.fundingTarget);

  // Calculate countdown to season start for inactive cities
  const seasonStartDate = currentSeason?.startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const countdownToStart = useCountdown(seasonStartDate);
  const isUpcoming = currentSeason?.status === "SCHEDULED";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{location.status === "active" ? "🟢" : location.status === "making_progress" ? "🔵" : "🟡"}</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{location.name}</h2>
            <LocationStatusBadge status={location.status === "active" ? "ACTIVE" : location.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"} />
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
      </div>

      <div className="flex-1 p-5 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">{location.shortDescription}</p>

        {/* Season Info */}
        {currentSeason && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">{currentSeason.name}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                currentSeason.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                currentSeason.status === "SCHEDULED" ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-700"}`}>
                {currentSeason.status}
              </span>
            </div>
            <div className="text-xs text-blue-700">
              {fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}
            </div>

            {/* Countdown for active cities */}
            {location.status === "active" && currentSeason.status === "ACTIVE" && (
              <div className="mt-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Season Ends In:</span>
                <div className="flex gap-1">
                  {[
                    { value: countdownToStart.days, label: "d" },
                    { value: countdownToStart.hours, label: "h" },
                    { value: countdownToStart.minutes, label: "m" },
                  ].map((item) => (
                    <span key={item.label} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-blue-700">
                      {String(item.value).padStart(2, "0")}{item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Countdown to activation for upcoming cities */}
            {location.status !== "active" && isUpcoming && (
              <div className="mt-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">Activates In:</span>
                <div className="flex gap-1">
                  {[
                    { value: countdownToStart.days, label: "d" },
                    { value: countdownToStart.hours, label: "h" },
                    { value: countdownToStart.minutes, label: "m" },
                  ].map((item) => (
                    <span key={item.label} className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-yellow-700">
                      {String(item.value).padStart(2, "0")}{item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-700">Activation %</span>
            <span className="text-sm font-bold" style={{ color: meta.color }}>{location.activationProgress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${location.activationProgress}%`, backgroundColor: meta.color }} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" /> Local Areas
            </div>
            <div className="text-lg font-bold text-gray-900">{fin.localAreas}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Store className="h-3 w-3" /> High Streets
            </div>
            <div className="text-lg font-bold text-gray-900">{fin.highStreets}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Store className="h-3 w-3" /> Businesses
            </div>
            <div className="text-lg font-bold text-gray-900">{fin.businesses}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" /> Consumers
            </div>
            <div className="text-lg font-bold text-gray-900">{fin.consumers}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Megaphone className="h-3 w-3" /> Campaigns
            </div>
            <div className="text-lg font-bold text-gray-900">{fin.campaigns}</div>
          </div>
        </div>

        {/* Funding */}
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Funding Target</span>
            <span className="text-sm font-bold text-gray-900">{safeCurrency(fin.fundingTarget)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${fundingPct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{safeCurrency(fin.fundingRaised)} raised</span>
                <span className="text-xs font-bold text-gray-700">{fundingPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        {location.activity.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">What is happening</h3>
            <ul className="space-y-1.5">
              {location.activity.slice(0, 3).map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t bg-white p-5">
        <Link to={`/uk-hub-activation/${location.slug}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          View {location.name} City Hub <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-4 rounded-lg border bg-white px-3 py-2 text-xs text-gray-600 shadow-sm">
       {[{ color: "#22c55e", label: "Active" }, { color: "#3b82f6", label: "Making Progress" }, { color: "#eab308", label: "Inactive" }].map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ───────────────────── Main Page ─────────────────────

export default function NationalHubPage() {
  const summary = getNationalHubSummary();
  const allCities = getCities();
  const [activeTab, setActiveTab] = useState<HubStatus | "all">("all");
  const [selectedMapSlug, setSelectedMapSlug] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showExploreCities, setShowExploreCities] = useState(true);
  const [locationSearch, setLocationSearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;
  const nextSeason = seasons.find((s: Season) => s.status === "SCHEDULED") || null;

  const selectedCity = useMemo(
    () => (selectedMapSlug ? HUB_LOCATIONS.find((l) => l.slug === selectedMapSlug) ?? null : null),
    [selectedMapSlug]
  ) as MapHubLocation | null;

  const overallFundingPct = safePct(summary.totalFundingRaised, summary.totalFundingTarget);

  const tabCounts = useMemo(() => ({
    all: allCities.length,
    active: getCitiesByStatus("ACTIVE").length,
    making_progress: getCitiesByStatus("MAKING_PROGRESS").length,
    needs_activation: getCitiesByStatus("NEEDS_ACTIVATION").length,
  }), [allCities]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AboutModal open={showAboutModal} onClose={() => setShowAboutModal(false)} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{NATIONAL_HUB.heroHeadline || "UK Hub Activation Programme"}</h1>
            <p className="mt-1 text-sm text-gray-300 leading-relaxed">{NATIONAL_HUB.heroSupportingText}</p>
          </div>
        </div>
      </section>

      {/* ═══════════════ SEASON BANNER ═══════════════ */}
      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <SeasonBanner currentSeason={currentSeason} nextSeason={nextSeason} />
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {[
            { label: "Cities", value: summary.totalCities, tip: "Total cities in the programme." },
            { label: "Active", value: summary.active, tip: "Cities at full activation." },
            { label: "Progress", value: summary.makingProgress, tip: "Cities moving towards activation." },
            { label: "Pending", value: summary.needsActivation, tip: "Cities identified but not yet activated." },
          ].map(s => (
            <Tooltip key={s.label} content={s.tip} position="bottom">
              <div className="rounded-xl border bg-white p-2 sm:p-3 text-center shadow-sm cursor-default">
                <div className="text-lg sm:text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-600">{s.label}</div>
              </div>
            </Tooltip>
          ))}
        </div>
      </section>

      {/* ═══════════════ PROGRESS (Linear) ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900">National Programme Progress</h2>
            <span className="text-sm font-bold text-blue-600">{overallFundingPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallFundingPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{safeCurrency(summary.totalFundingRaised)} raised of {safeCurrency(summary.totalFundingTarget)}</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Store className="h-3 w-3" /> {formatNumber(summary.totalFoundingBusiness)} businesses
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" /> {formatNumber(summary.totalFoundingConsumer)} consumers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT (Short) ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 flex-shrink-0">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900">About UK Hub Activation</h2>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 sm:line-clamp-1">
                {ABOUT_UK_HUB.short}
              </p>
              <button
                onClick={() => setShowAboutModal(true)}
                className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-500"
              >
                Learn more →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SEARCH + CITY LIST ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Location/Postcode Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                // Auto-select first matching city
                if (e.target.value.length >= 2) {
                  const q = e.target.value.toLowerCase();
                  const match = HUB_LOCATIONS.find(l =>
                    l.name.toLowerCase().includes(q) ||
                    l.region.toLowerCase().includes(q)
                  );
                  if (match) setSelectedMapSlug(match.slug);
                }
              }}
              placeholder="Search your location, area or postcode..."
              className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {locationSearch && (
              <button
                onClick={() => setLocationSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* City List Dropdown */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              All Cities
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCityDropdown ? "rotate-180" : ""}`} />
            </button>

            {showCityDropdown && (
              <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border bg-white shadow-xl">
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      placeholder="Search cities..."
                      className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto border-t">
                  {HUB_LOCATIONS
                    .filter(l => l.type === "city" || l.type === "london_borough")
                    .filter(l =>
                      citySearchQuery === "" ||
                      l.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
                      l.region.toLowerCase().includes(citySearchQuery.toLowerCase())
                    )
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(location => {
                      const meta = HUB_STATUS_META[location.status];
                      const isSelected = selectedMapSlug === location.slug;
                      return (
                        <button
                          key={location.id}
                          onClick={() => {
                            setSelectedMapSlug(location.slug);
                            setShowCityDropdown(false);
                            setCitySearchQuery("");
                            setShowExploreCities(true);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? "bg-primary-50" : ""}`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{location.name}</div>
                            <div className="text-xs text-gray-500">{location.region}</div>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400">{meta.label}</span>
                        </button>
                      );
                    })}
                  {HUB_LOCATIONS.filter(l => l.type === "city" || l.type === "london_borough").filter(l =>
                    citySearchQuery === "" ||
                    l.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
                    l.region.toLowerCase().includes(citySearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No cities found matching "{citySearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ MAP + CITY PANEL ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        {/* Explore Cities Dropdown */}
        <button
          onClick={() => setShowExploreCities(!showExploreCities)}
          className="w-full flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm mb-4 hover:bg-gray-50 transition-colors"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 text-left">Explore Cities</h2>
            <p className="text-xs text-gray-500 text-left">Click any city on the map to see full details and join opportunities.</p>
          </div>
          {showExploreCities ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showExploreCities && (
          <>
            <div className="flex items-center gap-2 mb-4">
              {/* Mobile: dropdown */}
              <div className="sm:hidden relative w-full">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as HubStatus | "all")}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {STATUS_TABS.map(tab => (
                    <option key={tab.value} value={tab.value}>
                      {tab.label} ({tabCounts[tab.value]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Desktop: pills */}
              <div className="hidden sm:flex flex-wrap items-center gap-2">
                {STATUS_TABS.map(tab => {
                  const isActive = activeTab === tab.value;
                  return (
                    <Tooltip key={tab.value} content={tab.tooltip} position="bottom">
                      <button onClick={() => setActiveTab(tab.value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${isActive ? "border-primary-300 bg-primary-50 text-primary-700 shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />
                        {tab.label}
                        <span className={`rounded-full px-1 py-0.5 text-[9px] font-bold ${isActive ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-400"}`}>{tabCounts[tab.value]}</span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1 min-w-0">
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm" style={{ height: "60vh", minHeight: 400 }}>
                  <UkMap locations={HUB_LOCATIONS} selectedSlug={selectedMapSlug} onSelect={(slug) => setSelectedMapSlug(slug === selectedMapSlug ? null : slug)} statusFilter={activeTab === "all" ? "all" : activeTab} />
                </div>
                <MapLegend />
              </div>
              <div className="w-full lg:w-[380px] flex-shrink-0">
                {selectedCity ? (
                  <div className="overflow-hidden rounded-xl border bg-white shadow-sm" style={{ height: "60vh", minHeight: 400 }}>
                    <CityInfoPanel location={selectedCity} onClose={() => setSelectedMapSlug(null)} currentSeason={currentSeason} />
                  </div>
                ) : (
                  <div className="flex h-[60vh] min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
                    <div className="text-center px-6">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">🏙️</div>
                      <p className="text-sm font-medium text-gray-700">Select a city on the map</p>
                      <p className="mt-1 text-xs text-gray-400">Click any marker to see city details and join opportunities</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!showExploreCities && (
          <div className="rounded-xl border bg-gray-50 p-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Click the Explore Cities section above to view the UK map and city details.</p>
          </div>
        )}
      </section>
    </div>
  );
}
