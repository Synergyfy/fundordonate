// =============================================================================
// Founding Membership & Split Allocation Business Configuration
// =============================================================================

import type { LocationPublicStatus } from "@/types/uk-hub";

export type FoundingMetalKey = "bronze" | "silver" | "gold" | "platinum";
export type FoundingLevelKey = "standard" | "pro" | "pro_plus";

export interface FoundingMetal {
  metal: FoundingMetalKey;
  label: string;
  icon: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  barClass: string;
}

export const FOUNDING_METALS: FoundingMetal[] = [
  { metal: "bronze",   label: "Bronze",   icon: "🥉", textClass: "text-amber-700", bgClass: "bg-amber-50",  borderClass: "border-amber-200",  barClass: "bg-amber-600" },
  { metal: "silver",   label: "Silver",   icon: "🥈", textClass: "text-gray-500",  bgClass: "bg-gray-50",   borderClass: "border-gray-200",   barClass: "bg-gray-400" },
  { metal: "gold",     label: "Gold",     icon: "🥇", textClass: "text-yellow-600", bgClass: "bg-yellow-50", borderClass: "border-yellow-200", barClass: "bg-yellow-500" },
  { metal: "platinum", label: "Platinum", icon: "💎", textClass: "text-cyan-700",  bgClass: "bg-cyan-50",   borderClass: "border-cyan-200",   barClass: "bg-cyan-500" },
];

/** Canonical price matrix in minor units (pence). */
export const FOUNDING_PRICES: Record<FoundingMetalKey, Record<FoundingLevelKey, number>> = {
  bronze:   { standard: 9000,   pro: 18000,  pro_plus: 30000 },
  silver:   { standard: 27000,  pro: 54000,  pro_plus: 80000 },
  gold:     { standard: 114000, pro: 150000, pro_plus: 195000 },
  platinum: { standard: 240000, pro: 270000, pro_plus: 300000 },
};

export const PROVISIONAL_OPTION_KEYS = ["silver_pro_plus", "gold_pro"];

export function foundingOptionKey(metal: FoundingMetalKey, level: FoundingLevelKey): string {
  return `${metal}_${level}`;
}

export function parsePriceConfig(raw: string | null | undefined): Record<string, number> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const out: Record<string, number> = {};
      for (const [k, val] of Object.entries(v)) {
        if (typeof val === "number" && Number.isFinite(val)) out[k] = val;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

/** Exact price (minor units) for one metal × level option. Programme config wins. */
export function getOptionPrice(configRaw: string | null | undefined, metal: FoundingMetalKey, level: FoundingLevelKey): number {
  const cfg = parsePriceConfig(configRaw);
  const key = foundingOptionKey(metal, level);
  return cfg[key] ?? FOUNDING_PRICES[metal][level];
}

/** Starting ("from") price per metal for summary displays. */
export function getMetalStartingPrices(configRaw: string | null | undefined): { metal: FoundingMetalKey; label: string; from: number }[] {
  return FOUNDING_METALS.map(m => ({
    metal: m.metal,
    label: m.label,
    from: Math.min(
      getOptionPrice(configRaw, m.metal, "standard"),
      getOptionPrice(configRaw, m.metal, "pro"),
      getOptionPrice(configRaw, m.metal, "pro_plus"),
    ),
  }));
}

export interface ProgrammeWindow {
  opensLabel: string | null;
  closesLabel: string | null;
  daysLeft: number | null;
  state: "upcoming" | "open" | "closing_soon" | "closed" | "open_ended";
}

const DAY_MS = 86_400_000;

function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function getProgrammeWindow(programme: { opensAt?: string | null; closesAt?: string | null; status?: string }): ProgrammeWindow {
  const now = Date.now();
  const open = programme.opensAt ? Date.parse(programme.opensAt) : NaN;
  const close = programme.closesAt ? Date.parse(programme.closesAt) : NaN;
  if (Number.isFinite(open) && open > now) {
    return {
      opensLabel: fmtDate(open), closesLabel: Number.isFinite(close) ? fmtDate(close) : null,
      daysLeft: Math.ceil((open - now) / DAY_MS), state: "upcoming",
    };
  }
  if (Number.isFinite(close)) {
    if (close < now || programme.status === "CLOSED" || programme.status === "ARCHIVED") {
      return { opensLabel: Number.isFinite(open) ? fmtDate(open) : null, closesLabel: fmtDate(close), daysLeft: 0, state: "closed" };
    }
    const daysLeft = Math.ceil((close - now) / DAY_MS);
    return {
      opensLabel: Number.isFinite(open) ? fmtDate(open) : null, closesLabel: fmtDate(close),
      daysLeft, state: daysLeft <= 14 ? "closing_soon" : "open",
    };
  }
  return {
    opensLabel: Number.isFinite(open) ? fmtDate(open) : null, closesLabel: null,
    daysLeft: null, state: "open_ended",
  };
}

export interface FoundingPillar {
  key: string;
  icon: string;
  title: string;
  desc: string;
}

export const FOUNDING_MEMBER_PILLARS: FoundingPillar[] = [
  { key: "status", icon: "🎖️", title: "Founding Member status", desc: "A real status on your record — recognised across voting, trials, access and upgrades, in this hub and beyond." },
  { key: "recognition", icon: "🏆", title: "Recognition", desc: "Named founding recognition on your hub, profile badge and public member counts. A label that means something." },
  { key: "benefits", icon: "🎁", title: "Benefits", desc: "Early access, voting rights, priority participation and product upgrades — tiered by Standard, Pro and Pro+." },
  { key: "communications", icon: "📣", title: "Special communications", desc: "Founding-member-only updates, seasonal briefings and announcements before anyone else." },
  { key: "events", icon: "📅", title: "Events", desc: "Priority access to launches, networking evenings and hub meetups." },
  { key: "access", icon: "🔑", title: "Access", desc: "Early campaign access, product trials and extended participation periods." },
  { key: "campaign_logic", icon: "🚀", title: "Campaign logic", desc: "Pro+ routes into monthly giving with qualifying access to create your own campaign." },
];

export const STATUS_UNLOCKS: Record<LocationPublicStatus, string[]> = {
  NEEDS_ACTIVATION: [
    "Register founding interest",
    "Early campaign previews",
    "Backer code eligibility via the National Hub funnel",
  ],
  MAKING_PROGRESS: [
    "Founding programmes open",
    "Local campaigns launch",
    "Backer status and badge available",
  ],
  ACTIVE: [
    "Voting rights",
    "Product trials",
    "Member events",
    "Priority participation",
    "Campaign-creation routes (Pro+)",
  ],
};

export interface SplitPlace {
  slug: string;
  name: string;
}

export interface SplitDestinations {
  cities: SplitPlace[];
  boroughs: (SplitPlace & { citySlug: string; cityName: string })[];
  highStreets: (SplitPlace & { parentName: string })[];
}

export function getSplitDestinations(scopeCitySlug?: string | null): SplitDestinations {
  const cities: SplitPlace[] = [
    { slug: "birmingham", name: "Birmingham" },
    { slug: "manchester", name: "Manchester" },
    { slug: "london", name: "London" },
    { slug: "leeds", name: "Leeds" },
    { slug: "glasgow", name: "Glasgow" },
    { slug: "bristol", name: "Bristol" },
    { slug: "liverpool", name: "Liverpool" },
    { slug: "sheffield", name: "Sheffield" },
    { slug: "edinburgh", name: "Edinburgh" },
  ];
  const cityList = scopeCitySlug ? cities.filter(c => c.slug === scopeCitySlug) : cities;
  const boroughs: (SplitPlace & { citySlug: string; cityName: string })[] = [
    { slug: "central", name: "City Centre", citySlug: "birmingham", cityName: "Birmingham" },
    { slug: "digbeth", name: "Digbeth & Eastside", citySlug: "birmingham", cityName: "Birmingham" },
    { slug: "jewellery-quarter", name: "Jewellery Quarter", citySlug: "birmingham", cityName: "Birmingham" },
    { slug: "northern-quarter", name: "Northern Quarter", citySlug: "manchester", cityName: "Manchester" },
    { slug: "ancoats", name: "Ancoats", citySlug: "manchester", cityName: "Manchester" },
    { slug: "deansgate", name: "Deansgate", citySlug: "manchester", cityName: "Manchester" },
    { slug: "westminster", name: "Westminster", citySlug: "london", cityName: "London" },
    { slug: "camden", name: "Camden", citySlug: "london", cityName: "London" },
    { slug: "shoreditch", name: "Shoreditch & Hackney", citySlug: "london", cityName: "London" },
  ].filter(b => (!scopeCitySlug || b.citySlug === scopeCitySlug));

  return {
    cities: cityList,
    boroughs,
    highStreets: [
      ...cityList.map(c => ({ slug: `${c.slug}-high-street`, name: `${c.name} High Street`, parentName: c.name })),
      ...boroughs.map(b => ({ slug: `${b.slug}-high-street`, name: `${b.name} High Street`, parentName: b.name })),
    ],
  };
}
