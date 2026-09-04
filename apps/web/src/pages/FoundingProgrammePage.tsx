// =============================================================================
// UK Hub — Founding Programme Detail Page
// Route: /founding/:programmeId
// Resolves seeded programmes by id, or synthetic ids (fp-{slug}-{audience}).
// Shows allocation, tiers, benefits, hub info and a join flow.
// =============================================================================

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DEMO_FOUNDING_PROGRAMMES, getLocationById,
  buildSyntheticLocation, buildSyntheticProgrammes,
  FOUNDING_METALS, FOUNDING_TIER_LEVELS, FOUNDING_LEVEL_COMPARISON,
  PROVISIONAL_OPTION_KEYS, foundingOptionKey, getOptionPrice, getProgrammeWindow,
  type FoundingMetalKey, type FoundingLevelKey,
} from "@/data/ukHubData";
import { getHubLocationBySlug } from "@/data/hubActivation";
import type { HubLocation, FoundingProgramme } from "@/types/uk-hub";
import { FOUNDING_STATUS_META } from "@/types/uk-hub";
import { FOUNDING_BENEFIT_LABELS } from "@/components/hub/FoundingProgrammeCard";
import { ProgressRing } from "@/components/hub/ProgressRing";

export interface TierSelection {
  metalLabel: string;
  metalIcon: string;
  levelLabel: string;
  durationLabel: string;
  price: number;
}

// ───────────────────── Join form ─────────────────────

function JoinForm({ programme, isBusiness, selection }: { programme: FoundingProgramme; isBusiness: boolean; selection: TierSelection }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const remaining = Math.max(0, programme.totalAllocation - programme.allocatedCount);
  const waitlist = remaining === 0;

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h3 className="mt-3 font-bold text-gray-900">{waitlist ? "You're on the waitlist" : "Spot reserved"}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {waitlist
            ? `Thanks ${name.split(" ")[0] || "there"} — we'll email ${email || "you"} as soon as a ${selection.metalLabel} spot opens.`
            : `Thanks ${name.split(" ")[0] || "there"} — your ${selection.metalLabel} · ${selection.levelLabel} interest is reserved. We'll email ${email || "you"} with next steps.`}
        </p>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (isBusiness && businessName.trim().length < 2) return setError("Please enter your business name.");
    setError(null);
    setDone(true);
  };

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-600">
        <span className="mr-1">{selection.metalIcon}</span>
        <strong className="text-gray-900">{selection.metalLabel} · {selection.levelLabel}</strong>
        <span> ({selection.durationLabel}) · £{(selection.price / 100).toLocaleString("en-GB")}</span>
        <a href="#tiers" className={`ml-2 font-semibold ${isBusiness ? "text-blue-600" : "text-green-600"}`}>Change</a>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Morgan" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Email address</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.co.uk" type="email" className={inputCls} />
      </div>
      {isBusiness && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Business name</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Morgan & Co Ltd" className={inputCls} />
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <button type="submit" className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${isBusiness ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}>
        {waitlist ? "Join Waitlist" : "Secure My Spot →"}
      </button>
      <p className="text-[11px] text-gray-400 text-center">No payment today. We'll confirm availability by email.</p>
    </form>
  );
}

// ───────────────────── Page ─────────────────────

export default function FoundingProgrammePage() {
  const { programmeId } = useParams();

  const resolved = useMemo((): { programme: FoundingProgramme; location: HubLocation } | null => {
    const id = programmeId ?? "";
    const seeded = DEMO_FOUNDING_PROGRAMMES.find(p => p.id === id);
    if (seeded) {
      const loc = getLocationById(seeded.locationId);
      return loc ? { programme: seeded, location: loc } : null;
    }
    const m = id.match(/^fp-(.+)-(business|consumer)$/);
    if (!m) return null;
    const mapLoc = getHubLocationBySlug(m[1]!);
    if (!mapLoc) return null;
    const loc = buildSyntheticLocation(mapLoc);
    const prog = buildSyntheticProgrammes(loc).find(p => p.audience === (m[2] === "business" ? "BUSINESS" : "CONSUMER"));
    return prog ? { programme: prog, location: loc } : null;
  }, [programmeId]);

  if (!resolved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-300">Programme Not Found</h1>
          <p className="mt-4 text-gray-600">This founding programme doesn't exist or is no longer available.</p>
          <Link to="/uk-hub-activation" className="btn-primary mt-6 inline-block">← Back to UK Hub</Link>
        </div>
      </div>
    );
  }

  const { programme, location } = resolved;
  const isBusiness = programme.audience === "BUSINESS";
  const meta = FOUNDING_STATUS_META[programme.status];
  const remaining = Math.max(0, programme.totalAllocation - programme.allocatedCount);
  const fillPct = programme.totalAllocation > 0
    ? Math.min(Math.round((programme.allocatedCount / programme.totalAllocation) * 100), 100)
    : 0;
  const isOpen = programme.status === "OPEN" || programme.status === "LIMITED";

  // Tier + level selection. Price is per metal × level combination (Henry's
  // 12-option matrix), from the programme contributionConfig with fallback.
  const priceFor = (metal: FoundingMetalKey, level: FoundingLevelKey) =>
    getOptionPrice(programme.contributionConfig, metal, level);
  const [selMetal, setSelMetal] = useState(0);
  const [selLevel, setSelLevel] = useState<FoundingLevelKey>("standard");
  const selMetalDef = FOUNDING_METALS[selMetal]!;
  const selLevelDef = FOUNDING_TIER_LEVELS.find(l => l.level === selLevel) ?? FOUNDING_TIER_LEVELS[0]!;
  const selection: TierSelection = {
    metalLabel: selMetalDef.label,
    metalIcon: selMetalDef.icon,
    levelLabel: selLevelDef.label,
    durationLabel: selLevelDef.durationLabel,
    price: priceFor(selMetalDef.metal, selLevelDef.level),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back link */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <Link to={`/uk-hub-activation/${location.slug}`} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
          ← Back to {location.name} hub
        </Link>
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className={`relative overflow-hidden text-white ${isBusiness ? "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900" : "bg-gradient-to-br from-green-900 via-green-800 to-green-900"}`}>
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{isBusiness ? "🏢" : "👤"}</span>
              <p className="text-sm font-medium uppercase tracking-wider opacity-70">
                {location.name} · Founding {isBusiness ? "Business" : "Consumer"} Member Programme
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{programme.title}</h1>
            {programme.description && <p className="mt-3 opacity-80">{programme.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${meta.bgColor} ${meta.color}`}>{meta.label}</span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                {programme.allocatedCount} of {programme.totalAllocation} spots filled ({fillPct}%)
              </span>
              {remaining > 0 && remaining <= 20 && (
                <span className="inline-flex items-center rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-200">
                  ⚡ Only {remaining} spots remaining
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="opacity-70">Founding status unlocks:</span>
              {["Voting rights", "Product trials", "Member events", "Upgrades", "Special communications"].map(u => (
                <span key={u} className="rounded-full bg-white/10 px-2 py-0.5 font-medium">{u}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: details */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Allocation */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <ProgressRing value={fillPct} size={110} strokeWidth={8} color={isBusiness ? "#2563eb" : "#16a34a"} label="Filled" sublabel={`${remaining} left`} />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-lg font-bold text-gray-900">Allocation</h2>
                  <p className="mt-1 text-sm text-gray-600">{programme.allocatedCount} of {programme.totalAllocation} founding spots taken.</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${isBusiness ? "bg-blue-500" : "bg-green-500"}`} style={{ width: `${fillPct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {remaining === 0 ? "This programme is fully allocated — join the waitlist." : `${remaining} spots still available. Spots are reserved in order of sign-up.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing: Standard / Pro / Pro+ tabs x Bronze / Silver / Gold / Platinum columns */}
            <div id="tiers" className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6 scroll-mt-20">
              <h2 className="text-lg font-bold text-gray-900">Choose your tier and level</h2>
              <p className="mt-1 text-sm text-gray-500">
                Pick a level tab, then choose one of the four metals.
                Every option shows its amount, access period, backer status and features.
              </p>

              {/* Level tabs */}
              <div className="mt-4 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                {FOUNDING_TIER_LEVELS.map(lvl => {
                  const isActive = selLevel === lvl.level;
                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={() => setSelLevel(lvl.level)}
                      className={`rounded-lg px-4 py-2 text-left transition-all sm:px-6 ${isActive ? (isBusiness ? "bg-blue-600 text-white shadow-sm" : "bg-green-600 text-white shadow-sm") : "text-gray-500 hover:text-gray-800"}`}
                    >
                      <span className="block text-sm font-bold">{lvl.label}</span>
                      <span className={`block text-[10px] ${isActive ? "opacity-80" : "text-gray-400"}`}>{lvl.durationLabel}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <strong className="text-gray-700">{selLevelDef.label}</strong> · {selLevelDef.programme} · {selLevelDef.durationLabel}
              </p>

              {/* 4-column metal table */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {FOUNDING_METALS.map((metal, mi) => {
                  const isSel = selMetal === mi;
                  const price = priceFor(metal.metal, selLevelDef.level);
                  const tbc = PROVISIONAL_OPTION_KEYS.includes(foundingOptionKey(metal.metal, selLevelDef.level));
                  return (
                    <div key={metal.metal} className={`flex flex-col rounded-xl border-2 bg-white p-4 transition-all ${isSel ? `${metal.borderClass} shadow-md` : "border-gray-100"}`}>
                      <div className={`-mx-4 -mt-4 h-1.5 rounded-t-xl ${metal.barClass}`} />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{metal.icon}</span>
                        <h3 className="font-bold text-gray-900">{metal.label}</h3>
                        {isSel && <span className={`ml-auto text-lg ${metal.textClass}`}>✓</span>}
                      </div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">
                        £{(price / 100).toLocaleString("en-GB")}
                        {tbc && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-px align-middle text-[9px] font-bold text-amber-700">TBC</span>}
                      </div>
                      <p className="text-[11px] text-gray-500">{selLevelDef.durationLabel} · {selLevelDef.programme}</p>
                      <p className="mt-1 text-[11px] font-medium text-gray-600">🤝 {location.name} {selLevelDef.backerStatus}</p>
                      <ul className="mt-3 flex-1 space-y-1">
                        {selLevelDef.features.map(b => (
                          <li key={b} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                            <span className="font-bold text-green-500">✓</span>
                            <span>{FOUNDING_BENEFIT_LABELS[b] || b}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setSelMetal(mi)}
                        className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${isSel ? (isBusiness ? "bg-blue-600 text-white" : "bg-green-600 text-white") : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                      >
                        {isSel ? "Selected ✓" : `Select ${metal.label}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-gray-400">† Marked prices are provisional pending reconciliation with Henry's source notes.</p>
              {/* Dynamic selection note */}
              <div className={`mt-3 rounded-xl border p-3 text-xs ${selLevelDef.level === "pro_plus" ? "border-purple-200 bg-purple-50/60 text-purple-800" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                {selLevelDef.level === "pro_plus" ? (
                  <><strong>{selMetalDef.label} Pro+ — £{(selection.price / 100).toLocaleString("en-GB")} · Annual.</strong> You join the Monthly Giving Programme with elevated status and qualifying access to set up your own campaign.</>
                ) : (
                  <><strong>{selMetalDef.label} {selLevelDef.label} — £{(selection.price / 100).toLocaleString("en-GB")} · {selLevelDef.durationLabel}.</strong> You join as a {location.name} {selLevelDef.backerStatus} in the {selLevelDef.programme}.</>
                )}
              </div>
            </div>

            {/* Compare levels */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6 overflow-x-auto">
              <h2 className="text-lg font-bold text-gray-900">Standard vs Pro vs Pro+</h2>
              <p className="mt-1 text-sm text-gray-500">The full feature matrix — identical across every metal tier.</p>
              <table className="mt-4 w-full min-w-[520px] text-xs">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-semibold text-gray-500">Feature</th>
                    <th className="py-2 pr-3 font-bold text-gray-900">Standard · 90 days</th>
                    <th className="py-2 pr-3 font-bold text-gray-900">Pro · 180 days</th>
                    <th className="py-2 font-bold text-gray-900">Pro+ · Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {FOUNDING_LEVEL_COMPARISON.map(row => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-700">{row.feature}</td>
                      {[row.standard, row.pro, row.proPlus].map((cell, ci) => (
                        <td key={ci} className="py-2 pr-3 text-gray-600">
                          {cell === "yes" ? <span className="font-bold text-green-600">✓</span>
                            : cell === "no" ? <span className="text-gray-300">—</span>
                            : cell === "campaign" ? "Campaign-configured"
                            : cell === "indirect" ? "Via selected campaign"
                            : cell === "monthly" ? "✓ Monthly route"
                            : cell === "level" ? "Level-dependent"
                            : cell === "higher" ? "Longer period"
                            : cell === "proplus" ? "✓ Pro+ status"
                            : cell === "required" ? "✓ Required"
                            : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* About the hub */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">About the {location.name} hub</h2>
              <p className="mt-1 text-sm text-gray-600">{location.shortDescription || location.description}</p>
              <Link to={`/uk-hub-activation/${location.slug}`} className={`mt-3 inline-flex text-sm font-semibold ${isBusiness ? "text-blue-600 hover:text-blue-700" : "text-green-600 hover:text-green-700"}`}>
                View full {location.name} hub →
              </Link>
            </div>

            {/* Founding vs Backer */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <h3 className="text-sm font-bold text-purple-900">Founding Member vs Backer</h3>
              <p className="mt-1 text-xs text-purple-700">A Founding Member helps shape and launch the hub itself. A Backer supports individual campaigns by donating or pledging. You can be both.</p>
            </div>
          </div>

          {/* Right: join card */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-20 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">
                {!isOpen ? "Programme not open" : remaining === 0 ? "Join the waitlist" : "Join this programme"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {!isOpen
                  ? "This programme isn't currently accepting members."
                  : remaining === 0
                    ? "All spots are taken — leave your details and we'll contact you first when one opens."
                    : `${remaining} of ${programme.totalAllocation} spots remaining.`}
              </p>
              <div className="mt-4">
                {isOpen ? (
                  <JoinForm programme={programme} isBusiness={isBusiness} selection={selection} />
                ) : (
                  <Link to={`/uk-hub-activation/${location.slug}`} className="block w-full rounded-xl bg-gray-100 px-4 py-2.5 text-center text-sm font-semibold text-gray-600 hover:bg-gray-200">
                    Back to {location.name} hub
                  </Link>
                )}
              </div>

              {/* Open-and-closed window */}
              {(() => {
                const w = getProgrammeWindow(programme);
                return (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                    <h3 className="font-bold text-gray-800">Founding window</h3>
                    <p className="mt-1">
                      {w.state === "upcoming" && <>Opens {w.opensLabel}{w.closesLabel ? ` · closes ${w.closesLabel}` : ""}.</>}
                      {w.state === "open" && <>Open now · closes {w.closesLabel} ({w.daysLeft} days left).</>}
                      {w.state === "closing_soon" && <span className="font-semibold text-amber-700">Closing soon · {w.closesLabel} ({w.daysLeft} days left).</span>}
                      {w.state === "closed" && <>This window closed{w.closesLabel ? ` ${w.closesLabel}` : ""}.</>}
                      {w.state === "open_ended" && <>Open · closing date to be confirmed.</>}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">Founding windows open and close — each campaign retains scarcity and may not reopen.</p>
                  </div>
                );
              })()}

              {/* What happens next */}
              <div className="mt-5 border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">What happens next</h3>
                <ol className="mt-2 space-y-2 text-xs text-gray-600">
                  <li className="flex gap-2"><span className="font-bold">1.</span> Leave your details — no payment today.</li>
                  <li className="flex gap-2"><span className="font-bold">2.</span> We confirm your spot by email.</li>
                  <li className="flex gap-2"><span className="font-bold">3.</span> You get founding recognition and early access.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
