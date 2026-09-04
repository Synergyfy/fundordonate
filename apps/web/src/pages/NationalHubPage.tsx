// =============================================================================
// UK Hub — National Hub Overview Page
// Shared overview with map, stats, backer system. Business/Consumer in nav.
// =============================================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  NATIONAL_HUB, getNationalHubSummary, getCitiesByStatus, getCities,
  formatCurrency, formatNumber,
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
import { BackerBadge, type BackerBadgeTier } from "@/components/hub/BackerBadge";
import { SplitContributionExplain } from "@/components/hub/SplitContributionExplain";

// ───────────────────── Backer funnel + code widget ─────────────────────
// Demonstrates Henry's funnel: codes issued through the National Hub funnel,
// redeemed here to acknowledge Backer Status with a badge.

function BackerFunnelWidget() {
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState(false);

  const issue = () => {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const c = "UKH-" + Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    setCode(c);
    setInput("");
    setRedeemed(false);
    setError(false);
  };

  const redeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && input.trim().toUpperCase() === code) {
      setRedeemed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (redeemed && code) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <div className="flex justify-center"><BackerBadge tier="BACKER" /></div>
        <h3 className="mt-3 font-bold text-gray-900">Backer status acknowledged</h3>
        <p className="mt-1 text-xs text-gray-600">Code <strong>{code}</strong> redeemed through the UK Hub funnel and linked to your backer record.</p>
        <button onClick={() => { setCode(null); setRedeemed(false); }} className="mt-3 text-xs font-semibold text-green-700 hover:text-green-800">Start over</button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900">Step 1 — Get your funnel code</h3>
        <p className="mt-1 text-xs text-gray-500">Codes are issued through the National Hub funnel (campaigns, events, referrals).</p>
        {code ? (
          <p className="mt-3 rounded-lg bg-gray-900 px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-white">{code}</p>
        ) : (
          <button onClick={issue} className="mt-3 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
            Get a backer code
          </button>
        )}
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900">Step 2 — Redeem for your badge</h3>
        <p className="mt-1 text-xs text-gray-500">Enter the code to acknowledge your Backer Status.</p>
        <form onSubmit={redeem} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="UKH-XXXXXX"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm uppercase placeholder:text-gray-300 focus:border-purple-400 focus:outline-none"
          />
          <button type="submit" disabled={!code} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30">
            Redeem
          </button>
        </form>
        {error && <p className="mt-1 text-xs font-medium text-red-600">That code doesn't match — check Step 1.</p>}
      </div>
    </div>
  );
}

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
  { value: "active", label: "Active", tooltip: "Cities at full activation.", color: "#22c55e" },
  { value: "making_progress", label: "Making Progress", tooltip: "Cities moving towards activation.", color: "#3b82f6" },
  { value: "needs_activation", label: "Needs Activation", tooltip: "Cities identified but not yet activated.", color: "#eab308" },
];

const BACKER_TIERS: { name: string; desc: string; badge: BackerBadgeTier }[] = [
  { name: "Backer", desc: "Donate or pledge to any campaign. Receive backer recognition on your profile and the campaign page.", badge: "BACKER" },
  { name: "City Hub Backer", desc: "Back enough campaigns in a specific city to earn city-level recognition and local community status.", badge: "CITY" },
  { name: "National Backer", desc: "Back campaigns across multiple cities. Earn national-level recognition across the UK Hub programme.", badge: "NATIONAL" },
];

const HOW_IT_WORKS_STEPS = [
  { step: "1", title: "National Hub Launches", desc: "The UK Hub Activation Programme is established at national level with overall targets and founding opportunities." },
  { step: "2", title: "Cities Are Identified", desc: "Cities across the UK are identified and enter the activation lifecycle — from IDENTIFIED through to ACTIVE." },
  { step: "3", title: "Founding Programmes Open", desc: "Each city opens Founding Business and Consumer Member programmes with configured benefits and allocation limits." },
  { step: "4", title: "Campaigns Launch", desc: "City-specific and national campaigns launch, allowing donations, pledges and backer participation." },
  { step: "5", title: "Community Grows", desc: "Businesses, consumers and backers participate. The city progresses through its activation lifecycle." },
  { step: "6", title: "City Becomes Active", desc: "The city reaches full activation with active participation, local campaigns and a thriving community." },
];

const ACTIVATION_LIFECYCLE = [
  { stage: "Identified", color: "#9ca3af" }, { stage: "Preparing", color: "#eab308" },
  { stage: "Launching", color: "#f97316" }, { stage: "Activating", color: "#3b82f6" },
  { stage: "Active", color: "#22c55e" }, { stage: "Expanding", color: "#8b5cf6" },
];

// ───────────────────── Modal ─────────────────────

function HowNationalToLocalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        <h2 className="text-xl font-bold text-gray-900 pr-8">How National → Local Works</h2>
        <p className="mt-1 text-sm text-gray-500">The UK Hub Activation Programme is a reusable model. The National Hub gives birth to city hubs, each following the same activation lifecycle.</p>
        <div className="mt-6 space-y-4">
          {HOW_IT_WORKS_STEPS.map(s => (
            <div key={s.step} className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{s.step}</div>
              <div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-2">City Activation Lifecycle</h3>
          <div className="flex flex-wrap gap-2">
            {ACTIVATION_LIFECYCLE.map(s => (
              <div key={s.stage} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: s.color + "40", backgroundColor: s.color + "10", color: s.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.stage}
              </div>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">Got it</button>
      </div>
    </div>
  );
}

// ───────────────────── City Panel ─────────────────────

function CityInfoPanel({ location, onClose }: { location: MapHubLocation; onClose: () => void }) {
  const meta = HUB_STATUS_META[location.status];
  const campaigns = getDemoCampaignsForLocation(location);
  const fin = resolveLocationFinancials(location.slug, location.name, location.type, location.status, location.activationProgress);
  const fundingRaised = fin.fundingRaised;
  const fundingTarget = fin.fundingTarget;
  const fundingPct = safePct(fundingRaised, fundingTarget);
  const bizTotal = fin.foundingBusinessTotal;
  const bizAllocated = fin.foundingBusinessAllocated;
  const conTotal = fin.foundingConsumerTotal;
  const conAllocated = fin.foundingConsumerAllocated;
  const bizRemaining = Math.max(0, bizTotal - bizAllocated);
  const conRemaining = Math.max(0, conTotal - conAllocated);
  const lifecycle = fin.internalLifecycle;
  const lifecycleMeta = ACTIVATION_LIFECYCLE.find(s => s.stage.toLowerCase() === lifecycle.toLowerCase());
  const backers = Math.floor(bizAllocated * 1.5 + conAllocated * 0.8);

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
              <h3 className="text-sm font-bold text-blue-900">Business Founding</h3>
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
          <Link to={`/uk-hub-activation/business`} className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700">View Business Programme →</Link>
        </div>

        {/* Consumer Founding */}
        <div className="rounded-xl border bg-green-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <h3 className="text-sm font-bold text-green-900">Consumer Founding</h3>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              {conRemaining > 0 ? `${conRemaining} spots left` : "FULLY ALLOCATED"}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-green-100 mb-2">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${safePct(conAllocated, conTotal)}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-green-600">
            <span>{conAllocated} of {conTotal} spots filled</span>
            <span>{safePct(conAllocated, conTotal)}%</span>
          </div>
          <Link to={`/uk-hub-activation/consumer`} className="mt-2 inline-flex text-xs font-semibold text-green-600 hover:text-green-700">View Consumer Programme →</Link>
        </div>

        {/* Backers */}
        <div className="rounded-xl border bg-purple-50/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🤝</span>
            <span className="text-xs font-bold text-purple-800">Backers</span>
          </div>
          <div className="text-xl font-bold text-purple-700">{formatNumber(backers)}</div>
          <p className="text-[10px] text-purple-600/70 mt-0.5">Distinct from Founding Members.</p>
        </div>

        {/* Activity */}
        {location.activity.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">What is happening</h3>
            <ul className="space-y-1.5">
              {location.activity.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
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
                  <Link to={`/campaigns/${c.slug}`} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 hover:border-primary-200 hover:bg-primary-50/40 transition-colors">
                    <span className="line-clamp-1">{c.title}</span>
                    <span className="ml-2 text-xs text-primary-500 flex-shrink-0">→</span>
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
          <Link to={`/uk-hub-activation/${location.slug}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">View Full Hub →</Link>
          <Link to={`/campaigns?location=${location.slug}`} className="flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Campaigns</Link>
        </div>
      </div>
    </div>
  );
}

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

export default function NationalHubPage() {
  const summary = getNationalHubSummary();
  const allCities = getCities();
  const [activeTab, setActiveTab] = useState<HubStatus | "all">("all");
  const [selectedMapSlug, setSelectedMapSlug] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const selectedCity = useMemo(
    () => (selectedMapSlug ? HUB_LOCATIONS.find((l) => l.slug === selectedMapSlug) ?? null : null),
    [selectedMapSlug]
  ) as MapHubLocation | null;

  const overallFundingPct = safePct(summary.totalFundingRaised, summary.totalFundingTarget);
  const bizTotalAll = allCities.reduce((s, c) => s + c.foundingBusinessTotal, 0);
  const bizAllocAll = allCities.reduce((s, c) => s + c.foundingBusinessAllocated, 0);
  const conTotalAll = allCities.reduce((s, c) => s + c.foundingConsumerTotal, 0);
  const conAllocAll = allCities.reduce((s, c) => s + c.foundingConsumerAllocated, 0);

  const tabCounts = useMemo(() => ({
    all: allCities.length,
    active: getCitiesByStatus("ACTIVE").length,
    making_progress: getCitiesByStatus("MAKING_PROGRESS").length,
    needs_activation: getCitiesByStatus("NEEDS_ACTIVATION").length,
  }), [allCities]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HowNationalToLocalModal open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary-400">UK Hub Activation Programme</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{NATIONAL_HUB.heroHeadline || "UK Hub Activation Programme"}</h1>
            <p className="mt-3 text-gray-300">{NATIONAL_HUB.heroSupportingText}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/uk-hub-activation/business" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">🏢 Business Founding →</Link>
              <Link to="/uk-hub-activation/consumer" className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">👤 Consumer Founding →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Cities", value: summary.totalCities, tip: "Total cities in the programme." },
            { label: "Active", value: summary.active, tip: "Cities at full activation." },
            { label: "Making Progress", value: summary.makingProgress, tip: "Cities moving towards activation." },
            { label: "Needs Activation", value: summary.needsActivation, tip: "Cities identified but not yet activated." },
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
            <ProgressRing value={overallFundingPct} size={120} strokeWidth={8} color="#3b82f6" label="Overall" sublabel="progress" />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-gray-900">National Programme Progress</h2>
              <p className="mt-1 text-sm text-gray-600">{safeCurrency(summary.totalFundingRaised)} raised of {safeCurrency(summary.totalFundingTarget)}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link to="/uk-hub-activation/business" className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors">🏢 {bizAllocAll}/{bizTotalAll} business spots</Link>
                <Link to="/uk-hub-activation/consumer" className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700 hover:bg-green-100 transition-colors">👤 {conAllocAll}/{conTotalAll} consumer spots</Link>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">🤝 {formatNumber(summary.totalBackers)} backers</span>
              </div>
              <button onClick={() => setShowHowItWorks(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
                Learn how the programme works →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHAT IS THIS? ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-gradient-to-br from-primary-50/50 to-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">What is the UK Hub Activation Programme?</h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm text-gray-600">
            <div className="rounded-xl bg-white border p-4">
              <h3 className="font-bold text-gray-900 mb-1">🏙️ City Hubs</h3>
              <p className="text-xs">Each city gets its own hub with local campaigns, founding opportunities and community participation.</p>
            </div>
            <Link to="/uk-hub-activation/business" className="rounded-xl bg-white border p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
              <h3 className="font-bold text-gray-900 mb-1">🏢 Business Members</h3>
              <p className="text-xs">Businesses join as Founding Members to get early access, voting rights and priority participation.</p>
              <span className="mt-2 inline-flex text-xs font-semibold text-blue-600">View Business Programme →</span>
            </Link>
            <Link to="/uk-hub-activation/consumer" className="rounded-xl bg-white border p-4 hover:border-green-200 hover:bg-green-50/40 transition-colors">
              <h3 className="font-bold text-gray-900 mb-1">👤 Consumer Members</h3>
              <p className="text-xs">Consumers join as Founding Members to support their community and receive recognition.</p>
              <span className="mt-2 inline-flex text-xs font-semibold text-green-600">View Consumer Programme →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAP + CITY PANEL ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8" id="explore">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Explore Cities</h2>
        <p className="text-sm text-gray-500 mb-4">Click any city on the map to see full details — both business and consumer founding opportunities.</p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 mr-1">Filter:</span>
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
                <CityInfoPanel location={selectedCity} onClose={() => setSelectedMapSlug(null)} />
              </div>
            ) : (
              <div className="flex h-[60vh] min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
                <div className="text-center px-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">🏙️</div>
                  <p className="text-sm font-medium text-gray-700">Select a city on the map</p>
                  <p className="mt-1 text-xs text-gray-400">Click any marker to see both business and consumer founding data, campaigns and more</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ BACKER SYSTEM ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl flex-shrink-0">🤝</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">How Backers Participate</h2>
              <p className="text-sm text-gray-500 mt-1">Backer Status recognises anyone who donates or pledges to a campaign. It is distinct from Founding Membership — backers support campaigns, while Founding Members shape the hub itself.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mt-6">
            {BACKER_TIERS.map(t => (
              <Tooltip key={t.name} content={t.desc} position="bottom">
                <div className="rounded-xl bg-white border p-4 cursor-default">
                  <BackerBadge tier={t.badge} size="sm" showLabel={false} />
                  <h3 className="mt-2 font-bold text-gray-900 text-sm">{t.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{t.desc}</p>
                </div>
              </Tooltip>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Claim your badge with a funnel code</h3>
            <p className="text-xs text-gray-500 mb-3">Backer codes are issued through the National Hub funnel. Redeem yours here to acknowledge your Backer Status.</p>
            <BackerFunnelWidget />
          </div>
          <div className="mt-6 rounded-xl bg-purple-100/50 border border-purple-200 p-4">
            <h3 className="text-sm font-bold text-purple-900 mb-1">Founding Member vs Backer — What is the difference?</h3>
            <p className="text-xs text-purple-700">A Backer supports campaigns by donating or pledging. A Founding Member helps shape and launch the hub itself — with early access, voting rights and priority participation. You can be both.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/campaigns" className="inline-flex items-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">Browse Campaigns to Back →</Link>
            <Link to="/split" className="inline-flex items-center rounded-lg border border-purple-200 bg-white px-5 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50">Split one contribution across causes →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ SPLIT YOUR CONTRIBUTION ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <SplitContributionExplain tone="light" headline="Back one campaign, or split your contribution across many" />
      </section>

      {/* ═══════════════ HOW TO PARTICIPATE ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-gray-900">How to Participate</h2>
        <p className="mx-auto mt-1 max-w-xl text-center text-sm text-gray-500">Three ways to get involved. Choose what suits you.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { icon: "🏢", title: "Business Founding Member", desc: "Gain early access, voting rights and priority participation.", cta: "Explore Business Programme", href: "/uk-hub-activation/business", color: "blue" },
            { icon: "👤", title: "Consumer Founding Member", desc: "Support your local community and receive recognition.", cta: "Explore Consumer Programme", href: "/uk-hub-activation/consumer", color: "green" },
            { icon: "🤝", title: "Back a Campaign", desc: "Donate or pledge to campaigns. Earn backer status.", cta: "Browse Campaigns", href: "/campaigns", color: "purple" },
          ].map(card => (
            <div key={card.title} className="rounded-xl border bg-white p-6 text-center shadow-sm">
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${card.color === "blue" ? "bg-blue-100" : card.color === "green" ? "bg-green-100" : "bg-purple-100"}`}>{card.icon}</div>
              <h3 className="mt-4 font-bold text-gray-900">{card.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              <Link to={card.href} className={`mt-4 inline-flex text-sm font-semibold ${card.color === "blue" ? "text-blue-600 hover:text-blue-700" : card.color === "green" ? "text-green-600 hover:text-green-700" : "text-purple-600 hover:text-purple-700"}`}>{card.cta} →</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
