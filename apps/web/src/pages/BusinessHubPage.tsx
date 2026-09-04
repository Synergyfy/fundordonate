// =============================================================================
// UK Hub — Business Founding Page
// Dedicated page for Business Founding Member opportunities.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getNationalHubSummary, getCitiesByStatus, getCities,
  formatCurrency,
  resolveLocationFinancials,
} from "@/data/ukHubData";
import {
  HUB_LOCATIONS, HUB_STATUS_META, getDemoCampaignsForLocation,
  type HubLocation as MapHubLocation, type HubStatus,
} from "@/data/hubActivation";
import { ProgressRing } from "@/components/hub/ProgressRing";
import { LocationStatusBadge } from "@/components/hub/HubStatusBadge";
import { UkMap } from "@/components/hub/UkMap";
import { Tooltip } from "@/components/ui/Tooltip";

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

// ───────────────────── Data ─────────────────────

const STATUS_TABS: { value: HubStatus | "all"; label: string; tooltip: string; color: string }[] = [
  { value: "all", label: "All", tooltip: "Show every city.", color: "#6b7280" },
  { value: "active", label: "Active", tooltip: "Cities with active business founding programmes.", color: "#22c55e" },
  { value: "making_progress", label: "Making Progress", tooltip: "Cities where business founding is growing.", color: "#3b82f6" },
  { value: "needs_activation", label: "Needs Activation", tooltip: "Cities where business founding will open soon.", color: "#eab308" },
];

const BUSINESS_BENEFITS = [
  { icon: "🚀", title: "Early Access", desc: "Be first to access new city hub features, campaigns and opportunities before public launch." },
  { icon: "🗳️", title: "Voting Rights", desc: "Vote on local hub decisions, campaign priorities and community initiatives." },
  { icon: "⭐", title: "Priority Participation", desc: "First in line for new campaigns, partnerships and local business opportunities." },
  { icon: "🎁", title: "Product Upgrades", desc: "Access to upgraded packages, premium features and exclusive product trials." },
  { icon: "🏆", title: "Founding Recognition", desc: "Displayed as Founding Business Member on the city hub, with logo and profile link." },
  { icon: "📅", title: "Exclusive Events", desc: "Invitation to business networking events, launch parties and city hub meetups." },
];

const HOW_IT_WORKS_STEPS = [
  { step: "1", title: "Choose a City", desc: "Browse cities on the map below. Each city shows how many business founding spots are available." },
  { step: "2", title: "Review Benefits", desc: "See what founding business membership includes — early access, voting rights, priority participation and more." },
  { step: "3", title: "Join the Programme", desc: "Sign up as a Founding Business Member. Your spot is reserved and you receive founding recognition." },
  { step: "4", title: "Shape Your Hub", desc: "Participate in votes, access early campaigns, attend events and help shape the city hub from the start." },
];

const ACTIVATION_LIFECYCLE = [
  { stage: "Identified", color: "#9ca3af" }, { stage: "Preparing", color: "#eab308" },
  { stage: "Launching", color: "#f97316" }, { stage: "Activating", color: "#3b82f6" },
  { stage: "Active", color: "#22c55e" }, { stage: "Expanding", color: "#8b5cf6" },
];

// ───────────────────── City Panel ─────────────────────

function BusinessCityPanel({ location, onClose }: { location: MapHubLocation; onClose: () => void }) {
  const meta = HUB_STATUS_META[location.status];
  const campaigns = getDemoCampaignsForLocation(location);
  const fin = resolveLocationFinancials(location.slug, location.name, location.type, location.status, location.activationProgress);
  const fundingRaised = fin.fundingRaised;
  const fundingTarget = fin.fundingTarget;
  const fundingPct = safePct(fundingRaised, fundingTarget);
  const bizTotal = fin.foundingBusinessTotal;
  const bizAllocated = fin.foundingBusinessAllocated;
  const bizRemaining = Math.max(0, bizTotal - bizAllocated);
  const lifecycle = fin.internalLifecycle;
  const lifecycleMeta = ACTIVATION_LIFECYCLE.find(s => s.stage.toLowerCase() === lifecycle.toLowerCase());

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{location.status === "active" ? "🟢" : location.status === "making_progress" ? "🔵" : "🟡"}</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{location.name}</h2>
            <div className="flex items-center gap-2">
              <LocationStatusBadge status={location.status === "active" ? "ACTIVE" : location.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION"} />
              <span className="text-xs text-gray-400">{lifecycleMeta?.stage || lifecycle}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
      </div>

      <div className="flex-1 p-5 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">{location.shortDescription}</p>

        {/* Activation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-700">Activation Progress</span>
            <span className="text-sm font-bold" style={{ color: meta.color }}>{location.activationProgress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${location.activationProgress}%`, backgroundColor: meta.color }} />
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Admin trigger: {fin.activationThreshold ?? 80}% funding + founding allocation.</p>
        </div>

        {/* Funding */}
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={fundingPct} size={56} strokeWidth={5} color={meta.color} animate={false} />
            <div>
              <div className="text-sm font-medium text-gray-500">Funding</div>
              <div className="text-lg font-bold text-gray-900">{safeCurrency(fundingRaised)}</div>
              <div className="text-xs text-gray-400">of {safeCurrency(fundingTarget)}</div>
            </div>
          </div>
        </div>

        {/* Business Founding */}
        <div className="rounded-xl border bg-blue-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <h3 className="text-sm font-bold text-blue-900">Business Founding Members</h3>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {bizRemaining > 0 ? `${bizRemaining} spots left` : "FULLY ALLOCATED"}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-blue-100 mb-2">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${safePct(bizAllocated, bizTotal)}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-blue-600">
            <span>{bizAllocated} of {bizTotal} spots filled</span>
            <span>{safePct(bizAllocated, bizTotal)}%</span>
          </div>
          <p className="mt-2 text-[11px] text-blue-700/70">Business Founding Members get early access, voting rights, priority participation and founding recognition.</p>
          <Link to={`/campaigns?opportunity=hub_activation&audience=business&location=${location.slug}`} className="mt-3 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700">
            Join Business Programme →
          </Link>
        </div>

        {/* Activity */}
        {location.activity.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">What is happening</h3>
            <ul className="space-y-1.5">
              {location.activity.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Campaigns */}
        {campaigns.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Local Campaigns ({campaigns.length})</h3>
            <ul className="space-y-1.5">
              {campaigns.slice(0, 3).map((c) => (
                <li key={c.slug}>
                  <Link to={`/campaigns/${c.slug}`} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
                    <span className="line-clamp-1">{c.title}</span>
                    <span className="ml-2 text-xs text-blue-500 flex-shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {location.communities && <p className="text-xs text-gray-400">📍 {location.communities}</p>}
      </div>

      <div className="sticky bottom-0 border-t bg-white p-5">
        <div className="flex gap-2">
          <Link to={`/uk-hub-activation/${location.slug}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            View Full Hub →
          </Link>
          <Link to={`/campaigns?location=${location.slug}`} className="flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Map Legend ─────────────────────

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-4 rounded-lg border bg-white px-3 py-2 text-xs text-gray-600 shadow-sm">
      {[{ color: "#22c55e", label: "Active" }, { color: "#3b82f6", label: "Making Progress" }, { color: "#eab308", label: "Needs Activation" }].map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ───────────────────── Main Page ─────────────────────

export default function BusinessHubPage() {
  const summary = getNationalHubSummary();
  const allCities = getCities();
  const [activeTab, setActiveTab] = useState<HubStatus | "all">("all");
  const [selectedMapSlug, setSelectedMapSlug] = useState<string | null>(null);

  const selectedCity = useMemo(
    () => (selectedMapSlug ? HUB_LOCATIONS.find((l) => l.slug === selectedMapSlug) ?? null : null),
    [selectedMapSlug]
  ) as MapHubLocation | null;

  const bizTotalAll = allCities.reduce((s, c) => s + c.foundingBusinessTotal, 0);
  const bizAllocAll = allCities.reduce((s, c) => s + c.foundingBusinessAllocated, 0);
  const bizPct = safePct(bizAllocAll, bizTotalAll);

  const tabCounts = useMemo(() => ({
    all: allCities.length,
    active: getCitiesByStatus("ACTIVE").length,
    making_progress: getCitiesByStatus("MAKING_PROGRESS").length,
    needs_activation: getCitiesByStatus("NEEDS_ACTIVATION").length,
  }), [allCities]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-blue-300">UK Hub Activation Programme</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Business Founding Member Programme</h1>
            <p className="mt-3 text-blue-200">Join as a Founding Business Member and shape your city hub from the start. Get early access, voting rights, priority participation and founding recognition.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#explore" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Find Your City →</a>
              <Link to="/uk-hub-activation" className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">View Overview</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Business Spots Filled", value: `${bizAllocAll} / ${bizTotalAll}`, tip: "Total business founding spots filled across all cities." },
            { label: "Active Cities", value: summary.active, tip: "Cities with active business founding programmes." },
            { label: "Progress Cities", value: summary.makingProgress, tip: "Cities where business founding is growing." },
          ].map(s => (
            <Tooltip key={s.label} content={s.tip} position="bottom">
              <div className="rounded-xl border bg-white p-3 text-center shadow-sm cursor-default">
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs font-medium text-gray-600">{s.label}</div>
              </div>
            </Tooltip>
          ))}
        </div>
      </section>

      {/* ═══════════════ PROGRESS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <ProgressRing value={bizPct} size={120} strokeWidth={8} color="#2563eb" label="Business" sublabel="allocation" />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-gray-900">Business Founding Allocation</h2>
              <p className="mt-1 text-sm text-gray-600">{bizAllocAll} of {bizTotalAll} business founding spots filled across all cities.</p>
              <p className="mt-1 text-xs text-gray-400">{bizTotalAll - bizAllocAll} spots still available. Find your city below.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-gradient-to-br from-blue-50/50 to-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">How Business Founding Works</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map(s => (
              <div key={s.step} className="rounded-xl bg-white border p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{s.step}</div>
                <h3 className="mt-3 font-bold text-gray-900 text-sm">{s.title}</h3>
                <p className="mt-1 text-xs text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MAP + CITY PANEL ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8" id="explore">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Find a City</h2>
        <p className="text-sm text-gray-500 mb-4">Click any city on the map to see business founding allocation, spots remaining and local campaigns.</p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 mr-1">Filter:</span>
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.value;
            return (
              <Tooltip key={tab.value} content={tab.tooltip} position="bottom">
                <button onClick={() => setActiveTab(tab.value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${isActive ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />
                  {tab.label}
                  <span className={`rounded-full px-1 py-0.5 text-[9px] font-bold ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>{tabCounts[tab.value]}</span>
                </button>
              </Tooltip>
            );
          })}
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
                <BusinessCityPanel location={selectedCity} onClose={() => setSelectedMapSlug(null)} />
              </div>
            ) : (
              <div className="flex h-[60vh] min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
                <div className="text-center px-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">🏢</div>
                  <p className="text-sm font-medium text-gray-700">Select a city on the map</p>
                  <p className="mt-1 text-xs text-gray-400">Click any marker to see business founding spots, allocation progress and local campaigns</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ BUSINESS BENEFITS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Business Founding Benefits</h2>
          <p className="text-sm text-gray-500 mb-6">What you get as a Founding Business Member.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESS_BENEFITS.map(b => (
              <Tooltip key={b.title} content={b.desc} position="bottom">
                <div className="rounded-xl bg-white border p-4 cursor-default">
                  <span className="text-xl">{b.icon}</span>
                  <h3 className="mt-2 font-bold text-gray-900 text-sm">{b.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{b.desc}</p>
                </div>
              </Tooltip>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/campaigns?opportunity=hub_activation&audience=business" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Explore All Business Programmes →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW TO PARTICIPATE ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Join?</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">Find your city on the map above, review the founding business programme, and secure your spot as a Founding Business Member.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="#explore" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Find Your City →</a>
            <Link to="/uk-hub-activation" className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">View Overview</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
