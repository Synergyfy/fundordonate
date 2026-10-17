// =============================================================================
// Founding Programme Utilities & Calculation Helpers
// =============================================================================

import type { HubLocation, LocationPublicStatus } from "@/types/uk-hub";
import { formatCurrency } from "@/utils/formatters";

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
export const FOUNDING_PRICES_PENCE: Record<FoundingMetalKey, Record<FoundingLevelKey, number>> = {
  bronze:   { standard: 5_000,  pro: 7_500,  pro_plus: 12_000 },
  silver:   { standard: 10_000, pro: 15_000, pro_plus: 24_000 },
  gold:     { standard: 15_000, pro: 22_500, pro_plus: 36_000 },
  platinum: { standard: 20_000, pro: 30_000, pro_plus: 48_000 },
};

export function getOptionPrice(configRaw: string | null | undefined, metal: FoundingMetalKey, level: FoundingLevelKey): number {
  if (configRaw) {
    try {
      const parsed = JSON.parse(configRaw);
      const val = parsed?.[metal]?.[level] ?? parsed?.[`${metal}_${level}`];
      if (typeof val === "number" && Number.isFinite(val)) return val;
    } catch {
      /* fall back */
    }
  }
  return FOUNDING_PRICES_PENCE[metal][level];
}

export function getMetalStartingPrices(configRaw: string | null | undefined): { metal: FoundingMetalKey; label: string; from: number }[] {
  return FOUNDING_METALS.map((m) => ({
    metal: m.metal,
    label: m.label,
    from: Math.min(
      getOptionPrice(configRaw, m.metal, "standard"),
      getOptionPrice(configRaw, m.metal, "pro"),
      getOptionPrice(configRaw, m.metal, "pro_plus")
    ),
  }));
}

export interface FoundingTierLevel {
  level: FoundingLevelKey;
  label: string;
  durationDays: number;
  durationLabel: string;
  programme: string;
  backerStatus: string;
  features: string[];
}

export const FOUNDING_TIER_LEVELS: FoundingTierLevel[] = [
  {
    level: "standard",
    label: "Standard",
    durationDays: 90,
    durationLabel: "90 days access",
    programme: "Basic Backer Programme",
    backerStatus: "Backer",
    features: ["basic_backer_programme", "backer_acknowledgement", "campaign_reward", "access_90_days"],
  },
  {
    level: "pro",
    label: "Pro",
    durationDays: 180,
    durationLabel: "180 days access",
    programme: "Basic Backer Programme",
    backerStatus: "Backer",
    features: ["basic_backer_programme", "backer_acknowledgement", "campaign_reward", "access_180_days"],
  },
  {
    level: "pro_plus",
    label: "Pro+",
    durationDays: 365,
    durationLabel: "Annual membership",
    programme: "Monthly Backer Programme",
    backerStatus: "Monthly Backer",
    features: [
      "backer_acknowledgement",
      "campaign_reward",
      "access_annual",
      "monthly_giving",
      "business_backer_route",
      "consumer_founding_route",
      "cost_neutral_projects",
      "pro_status",
      "downline",
      "campaign_creation",
      "initial_contribution",
    ],
  },
];

export interface LevelComparisonRow {
  feature: string;
  standard: string;
  pro: string;
  proPlus: string;
}

export const FOUNDING_LEVEL_COMPARISON: LevelComparisonRow[] = [
  { feature: "Basic Backer Programme", standard: "yes", pro: "yes", proPlus: "no" },
  { feature: "Backer acknowledgement", standard: "yes", pro: "yes", proPlus: "yes" },
  { feature: "Campaign-specific reward / product / service", standard: "yes", pro: "yes", proPlus: "campaign" },
  { feature: "Access period", standard: "90 days", pro: "180 days", proPlus: "Annual" },
  { feature: "MCOM Monthly Giving Programme", standard: "no", pro: "no", proPlus: "yes" },
  { feature: "Corporate Business Backer route", standard: "no", pro: "no", proPlus: "yes" },
  { feature: "Consumer Founding Member route", standard: "no", pro: "no", proPlus: "yes" },
  { feature: "Supports long-term Cost-Neutral Projects", standard: "indirect", pro: "indirect", proPlus: "monthly" },
  { feature: "Elevated status", standard: "level", pro: "higher", proPlus: "proplus" },
  { feature: "Build downline where applicable", standard: "campaign", pro: "campaign", proPlus: "yes" },
  { feature: "Qualifying access to create own campaign", standard: "no", pro: "no", proPlus: "yes" },
  { feature: "Initial contribution towards own campaign", standard: "no", pro: "no", proPlus: "required" },
];

export interface ActivationTrigger {
  thresholdPct: number;
  fundingRaised: number;
  fundingTarget: number;
  fundingPct: number;
  bizAllocated: number;
  bizTotal: number;
  conAllocated: number;
  conTotal: number;
  ruleText: string;
  met: boolean;
}

export function getActivationTrigger(location: HubLocation): ActivationTrigger {
  const threshold = location.activationThreshold ?? 80;
  const target = location.fundingTarget ?? 0;
  const raised = location.fundingRaised ?? 0;
  const fundingPct = target > 0
    ? Math.min(Math.round((raised / target) * 100), 100)
    : 0;
  const effectiveActive = (location.statusOverride ?? location.publicStatus) === "ACTIVE";
  return {
    thresholdPct: threshold,
    fundingRaised: raised,
    fundingTarget: target,
    fundingPct,
    bizAllocated: location.foundingBusinessAllocated ?? 0,
    bizTotal: location.foundingBusinessTotal ?? 50,
    conAllocated: location.foundingConsumerAllocated ?? 0,
    conTotal: location.foundingConsumerTotal ?? 200,
    ruleText: `Activates at ${threshold}% of its ${formatCurrency(target)} funding target with founding allocation underway.`,
    met: fundingPct >= threshold || effectiveActive,
  };
}

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

export interface FoundingPillar {
  key: string;
  icon: string;
  title: string;
  desc: string;
}

export const FOUNDING_MEMBER_PILLARS: FoundingPillar[] = [
  { key: "status", icon: "🎖️", title: "Founding Member status", desc: "A real status on your record — recognised across voting, trials, access and upgrades, in this hub and beyond." },
  { key: "recognition", icon: "🏆", title: "Recognition", desc: "Named founding recognition on your hub, profile badge and public member counts." },
  { key: "benefits", icon: "🎁", title: "Benefits", desc: "Early access, voting rights, priority participation and product upgrades — tiered by Standard, Pro and Pro+." },
  { key: "communications", icon: "📣", title: "Special communications", desc: "Founding-member-only updates, seasonal briefings and announcements." },
  { key: "events", icon: "📅", title: "Events", desc: "Priority access to launches, networking evenings and hub meetups." },
  { key: "access", icon: "🔑", title: "Access", desc: "Early campaign access, product trials and extended participation periods." },
  { key: "campaign_logic", icon: "🚀", title: "Campaign logic", desc: "Pro+ routes into monthly giving with qualifying access to create your own campaign." },
];

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

export function getProgrammeWindow(programme: { opensAt?: string | null; closesAt?: string | null; status: string }): ProgrammeWindow {
  const now = Date.now();
  const open = programme.opensAt ? Date.parse(programme.opensAt) : NaN;
  const close = programme.closesAt ? Date.parse(programme.closesAt) : NaN;
  if (Number.isFinite(open) && open > now) {
    return {
      opensLabel: fmtDate(open),
      closesLabel: Number.isFinite(close) ? fmtDate(close) : null,
      daysLeft: Math.ceil((open - now) / DAY_MS),
      state: "upcoming",
    };
  }
  if (Number.isFinite(close)) {
    if (close < now || programme.status === "CLOSED" || programme.status === "ARCHIVED") {
      return {
        opensLabel: Number.isFinite(open) ? fmtDate(open) : null,
        closesLabel: fmtDate(close),
        daysLeft: 0,
        state: "closed",
      };
    }
    const daysLeft = Math.ceil((close - now) / DAY_MS);
    return {
      opensLabel: Number.isFinite(open) ? fmtDate(open) : null,
      closesLabel: fmtDate(close),
      daysLeft,
      state: daysLeft <= 14 ? "closing_soon" : "open",
    };
  }
  if (programme.status === "OPEN" || programme.status === "LIMITED") {
    return {
      opensLabel: Number.isFinite(open) ? fmtDate(open) : null,
      closesLabel: null,
      daysLeft: null,
      state: "open_ended",
    };
  }
  return { opensLabel: null, closesLabel: null, daysLeft: null, state: "closed" };
}

export const PROVISIONAL_OPTION_KEYS = ["silver_pro_plus", "gold_pro"];

export function foundingOptionKey(metal: FoundingMetalKey, level: FoundingLevelKey): string {
  return `${metal}_${level}`;
}

