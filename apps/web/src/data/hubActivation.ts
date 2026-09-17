// =============================================================================
// FundOrDonate — UK Hub Activation Demo Data
//
// This is the data boundary for the /uk-hub-activation page.
// Everything here is PRESENTATION / TEST data for visual QA. It is structured
// so that a future Admin/API-managed geographical dataset can replace it
// without changing the UI components.
//
// Do NOT treat these numbers (76 / 32 / 36 / 11) as immutable business logic.
// They represent the intended national scale and are demo values only.
//
// NOTE: This file defines its own HubLocation type for map visualization.
//       The canonical HubLocation type lives in types/uk-hub.ts and is used
//       by hierarchy/data components. Use toCanonicalLocation() to convert
//       from this map type to the canonical type when needed.
// =============================================================================

import type { DemoCampaign } from "./demo";
import { DEMO_CAMPAIGNS } from "./demo";

export type HubStatus = "active" | "making_progress" | "needs_activation";

export type OpportunityRole = "agent" | "account_manager" | "consultant";

export type HubLocationType =
  | "city"
  | "london_borough"
  | "metropolitan_borough"
  | "county_borough"
  | "district"
  | "local_community"
  | "local_hub";

export interface HubLocation {
  id: string;
  name: string;
  slug: string;
  region: string;
  type: HubLocationType;
  status: HubStatus;
  /** Data-driven activation progress 0-100 (demo values supplied by data). */
  activationProgress: number;
  shortDescription: string;
  // Two images per location per Henry's requirement.
  imageOne: string;
  imageTwo: string;
  /** What is happening here (local activity summary). */
  activity: string[];
  /** What the area needs (opportunities). Only present when configured. */
  opportunities?: OpportunityRole[];
  /** Slugs of demo campaigns associated with this area. */
  campaignSlugs: string[];
  /** Approx map reference (0-100 normalized x/y) for the illustrative SVG. */
  mapX: number;
  mapY: number;
  communities: string;
}

export interface HubSummary {
  activeLocations: number;
  makingProgress: number;
  needsActivation: number;
  opportunities: number;
  activeCampaigns: number;
}

// ───────────────────── Status configuration ─────────────────────
// Status identity lives here (data/config boundary), not inside the map.

export const HUB_STATUS_META: Record<
  HubStatus,
  { label: string; color: string; dotClass: string; textClass: string; bgClass: string }
> = {
  active: {
    label: "Active",
    color: "#16a34a",
    dotClass: "bg-secondary-500",
    textClass: "text-secondary-700",
    bgClass: "bg-secondary-50 border-secondary-200",
  },
  making_progress: {
    label: "Making Progress",
    color: "#3b82f6",
    dotClass: "bg-primary-500",
    textClass: "text-primary-700",
    bgClass: "bg-primary-50 border-primary-200",
  },
  needs_activation: {
     label: "Inactive",
    color: "#f59e0b",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
};

export const OPPORTUNITY_META: Record<
  OpportunityRole,
  { label: string; description: string }
> = {
  agent: { label: "Agent", description: "Help build local participation and grow Local Light activity in the area." },
  account_manager: { label: "Account Manager", description: "Manage and grow local Business Contributor relationships in the area." },
  consultant: { label: "Consultant", description: "Advise on Local Hub development and community activation in the area." },
};

/** Deterministic remote stock image for a location-based hero/secondary visual. */
function stockImage(seed: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

// Two distinct base photo seeds (cityscape / high-street-community) reused per type.
const CITY_ONE_SEEDS = [
  "1505761670515-3e90b26d6a4c", // skyline
  "1519501025264-65ba15a82390", // city aerial
  "1477959858617-67f85cf4f1df", // city lights
  "1449824913935-59a10b8d2000", // city buildings
  "1494522358652-f30e61a60313", // city street
  "1480714378408-67cf0d13bc1b", // skyline dusk
  "1444723121867-7a241cacace9", // buildings
  "1467269204594-9661b134dd2b", // street
  "1514565131-fce0801e5785", // city view
];
const HIGH_STREET_SEEDS = [
  "1441986300917-64674bd600d8", // storefront
  "1555396273-367ea4eb4db5", // high street shops
  "1472851290388-39f4d448d5d3", // market
  "1521295121783-8a321d551ad2", // town street
  "1519505907962-0a6cb0167c73", // shops
  "1460923492452-bf4f5d2b4679", // market stalls
  "1556742049-0cfed4f6a45d", // shop
  "1441984904996-e0b6ba687e04", // boutique
];
function pick(seeds: string[], i: number): string {
  return seeds[i % seeds.length]!;
}

// ───────────────────── Factory ─────────────────────
// Generates a full, realistic HubLocation with sensible defaults. Curated fields
// (status, progress, activity, opportunities, campaigns) are supplied per entry;
// everything else is derived so the dataset stays complete but maintainable.

interface Seed {
  name: string;
  region: string;
  type: HubLocationType;
  status: HubStatus;
  progress: number;
  desc: string;
  activity?: string[];
  opportunities?: OpportunityRole[];
  campaignSlugs?: string[];
  x: number;
  y: number;
  communities?: string;
}

let seedCounter = 0;

function makeLocation(s: Seed, indexLabel: string): HubLocation {
  const i = ++seedCounter;
  const name = s.name;
  return {
    id: `hub-${indexLabel}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    region: s.region,
    type: s.type,
    status: s.status,
    activationProgress: s.progress,
    shortDescription: s.desc,
    imageOne: stockImage(pick(CITY_ONE_SEEDS, i), 800, 500),
    imageTwo: stockImage(pick(HIGH_STREET_SEEDS, i * 2 + 1), 800, 500),
    activity: s.activity ?? ["Local Hub development", "Business participation building"],
    opportunities: s.opportunities,
    campaignSlugs: s.campaignSlugs ?? [],
    mapX: s.x,
    mapY: s.y,
    communities: s.communities ?? "Local Mobile Commerce Community",
  };
}

// ───────────────────── Demo Campaigns by location ─────────────────────

/** Returns demo campaigns whose metadata matches a location name. */
export function getDemoCampaignsForLocation(location: HubLocation): DemoCampaign[] {
  const slugs = location.campaignSlugs;
  if (slugs.length > 0) {
    return DEMO_CAMPAIGNS.filter((c) => slugs.includes(c.slug));
  }
  const name = location.name.toLowerCase();
  const matched = DEMO_CAMPAIGNS.filter(
    (c) => (c.location || "").toLowerCase() === name || (c.category?.name || "").toLowerCase() === name
  );
  if (matched.length > 0) return matched;

  // Generate demo campaigns for active/in-progress cities without explicit data
  if (location.status === "active" || location.status === "making_progress") {
    const seed = location.id.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const campaignCount = location.status === "active" ? 3 : 2;
    const categories = ["Local Hub", "Business", "Community", "High Street"];
    const modes: ("donation" | "fund" | "sponsor")[] = ["donation", "fund", "sponsor"];
    // Category-specific relevant images
    const categoryImages: Record<string, { featured: string; gallery: string[] }> = {
      "Local Hub": {
        featured: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&h=400&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
        ],
      },
      "Business": {
        featured: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
        ],
      },
      "Community": {
        featured: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=400&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&h=400&fit=crop",
        ],
      },
      "High Street": {
        featured: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=400&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop",
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
        ],
      },
    };
    const campaigns: DemoCampaign[] = [];
    for (let i = 0; i < campaignCount; i++) {
      const cSeed = seed + i * 37;
      const catIdx = Math.abs(cSeed) % categories.length;
      const modeIdx = Math.abs(cSeed >> 4) % modes.length;
      const goalAmount = 5000 + (Math.abs(cSeed >> 8) % 20000);
      const catName = categories[catIdx] || "Local Hub";
      const mode = modes[modeIdx] || "donation";
      const fallback = categoryImages["Local Hub"];
      const images = (categoryImages[catName] ?? fallback)!;
      campaigns.push({
        id: `gen-${location.id}-${i}`,
        slug: `${location.slug}-campaign-${i + 1}`,
        title: `${catName} Fund for ${location.name}`,
        shortDescription: `Support the ${catName.toLowerCase()} initiative in ${location.name}. Help build a stronger local community.`,
        mode,
        goalAmount,
        raisedAmount: Math.floor(goalAmount * (0.2 + (Math.abs(cSeed >> 12) % 50) / 100)),
        deadline: new Date(Date.now() + (30 + (Math.abs(cSeed >> 16) % 60)) * 24 * 60 * 60 * 1000).toISOString(),
        featuredImage: images.featured,
        media: [
          { id: `gen-${location.id}-${i}-1`, type: "image" as const, url: images.featured, alt: `${catName} campaign for ${location.name}` },
          { id: `gen-${location.id}-${i}-2`, type: "image" as const, url: images.gallery[0]!, alt: `${location.name} local area` },
          { id: `gen-${location.id}-${i}-3`, type: "image" as const, url: images.gallery[1]!, alt: `Community in ${location.name}` },
          { id: `gen-${location.id}-${i}-4`, type: "image" as const, url: images.gallery[2]!, alt: `Supporting ${location.name}` },
        ],
        category: { name: catName, slug: catName.toLowerCase().replace(/ /g, "-") },
        author: { firstName: "Local", lastName: "Hub" },
        location: location.name,
        tags: ["hub-activation", location.region.toLowerCase()],
      });
    }
    return campaigns;
  }
  return [];
}

// ───────────────────── SEED DATASET — 76 UK Cities + 32 London Boroughs ─────────────────────
// Representative coverage across all statuses and opportunity roles for visual QA.
// Approx mapX/mapY are illustrative 0-100 coords for the stylised UK map.

const SEEDS: Seed[] = [
  // ── ACTIVE ──
  { name: "Camden", region: "London", type: "london_borough", status: "active", progress: 92, desc: "Hyper Local Fund or Donate Hub active on Camden High Street, connecting local businesses and residents.", opportunities: ["account_manager"], campaignSlugs: ["camden-high-street-mcom-hub"], x: 52, y: 86, communities: "Camden High Street + Mobile Commerce Community" },
  { name: "Islington", region: "London", type: "london_borough", status: "active", progress: 88, desc: "Active Local Business Fund & Donate Hub with strong Business Contributor participation.", opportunities: [], campaignSlugs: ["islington-local-business-fund"], x: 51, y: 84 },
  { name: "Southwark", region: "London", type: "london_borough", status: "active", progress: 85, desc: "Active Reward & Loyalty Hub alongside Southwark High Street.", opportunities: ["agent"], campaignSlugs: ["southwark-reward-loyalty-hub"], x: 51, y: 89 },
  { name: "Greenwich", region: "London", type: "london_borough", status: "active", progress: 78, desc: "Active Local High Street Hub with growing resident membership.", opportunities: [], campaignSlugs: ["greenwich-high-street-fund"], x: 50, y: 91 },
  { name: "Manchester", region: "North West", type: "city", status: "active", progress: 81, desc: "Growing city-wide Local Hub connecting Manchester High Streets to the National Hub Community.", opportunities: ["agent", "consultant"], x: 37, y: 38 },
  { name: "Birmingham", region: "West Midlands", type: "city", status: "active", progress: 74, desc: "Established community hub driving Business Contributor participation across the city.", opportunities: ["account_manager"], x: 43, y: 58 },

  // ── MAKING PROGRESS ──
  { name: "Hackney", region: "London", type: "london_borough", status: "making_progress", progress: 64, desc: "Developing co-branded business partner hub with increasing resident support.", opportunities: ["agent"], campaignSlugs: ["hackney-business-partner-hub"], x: 51, y: 85 },
  { name: "Lambeth", region: "London", type: "london_borough", status: "making_progress", progress: 60, desc: "Founding Membership programme building participation across Lambeth.", opportunities: [], campaignSlugs: ["lambeth-founding-membership"], x: 51, y: 90 },
  { name: "Westminster", region: "London", type: "london_borough", status: "making_progress", progress: 66, desc: "Establishing business contributors community with strong partner interest.", opportunities: ["account_manager", "consultant"], campaignSlugs: ["westminster-business-contributors"], x: 52, y: 87 },
  { name: "Tower Hamlets", region: "London", type: "london_borough", status: "making_progress", progress: 58, desc: "Building an MCOM community hub with growing local support.", opportunities: ["agent"], campaignSlugs: ["tower-hamlets-community-hub"], x: 51, y: 88 },
  { name: "Wandsworth", region: "London", type: "london_borough", status: "making_progress", progress: 55, desc: "MCOM Hub launch progressing as part of the 76 UK City Hubs programme.", opportunities: ["consultant"], campaignSlugs: ["wandsworth-mcom-hub-launch"], x: 52, y: 91 },
  { name: "Leeds", region: "Yorkshire", type: "city", status: "making_progress", progress: 62, desc: "Local Hub activation progressing across Leeds High Streets.", opportunities: ["agent"], x: 40, y: 32 },
  { name: "Liverpool", region: "North West", type: "city", status: "making_progress", progress: 57, desc: "Building participation with local businesses and residents.", opportunities: ["account_manager"], x: 35, y: 40 },
  { name: "Glasgow", region: "Scotland", type: "city", status: "making_progress", progress: 53, desc: "Developing Scottish Local Hub presence connecting the National Hub Community.", opportunities: ["agent", "consultant"], x: 24, y: 24 },
  { name: "Bristol", region: "South West", type: "city", status: "making_progress", progress: 59, desc: "Growing Local Hub with active community participation.", opportunities: ["agent"], x: 37, y: 77 },
  { name: "Sheffield", region: "Yorkshire", type: "city", status: "making_progress", progress: 51, desc: "Local Hub building momentum across local High Streets.", opportunities: ["consultant"], x: 41, y: 38 },

  // ── NEEDS ACTIVATION (a representative selection; the full 76 list follows) ──
  { name: "Brent", region: "London", type: "london_borough", status: "needs_activation", progress: 42, desc: "Reward & Loyalty Hub needs more local participation to progress.", opportunities: ["agent", "account_manager"], campaignSlugs: ["brent-high-street-reward-hub"], x: 53, y: 88 },
  { name: "Croydon", region: "London", type: "london_borough", status: "needs_activation", progress: 38, desc: "Community fund needs additional local backing to activate the Hub.", opportunities: ["agent", "consultant"], campaignSlugs: ["croydon-community-fund"], x: 51, y: 93 },
  { name: "Hammersmith & Fulham", region: "London", type: "london_borough", status: "needs_activation", progress: 33, desc: "Business partner launch requires more Business Contributor participation.", opportunities: ["account_manager"], campaignSlugs: ["hammersmith-business-partner-launch"], x: 53, y: 89 },
  { name: "Nottingham", region: "East Midlands", type: "city", status: "needs_activation", progress: 41, desc: "Needs local Agents and participants to activate the city Hub.", opportunities: ["agent", "consultant"], x: 40, y: 46 },
  { name: "Newcastle", region: "North East", type: "city", status: "needs_activation", progress: 36, desc: "Requires participation to develop the north-east Local Hub.", opportunities: ["agent", "account_manager"], x: 37, y: 20 },
  { name: "Cardiff", region: "Wales", type: "city", status: "needs_activation", progress: 44, desc: "Welsh city Hub needs business and resident participation to activate.", opportunities: ["agent", "consultant"], x: 31, y: 72 },
  { name: "Belfast", region: "Northern Ireland", type: "city", status: "needs_activation", progress: 30, desc: "Needs local participation to begin Hub activation.", opportunities: ["agent", "account_manager", "consultant"], x: 18, y: 60 },
  { name: "Edinburgh", region: "Scotland", type: "city", status: "needs_activation", progress: 47, desc: "Developing Scottish capital Hub with growing interest.", opportunities: ["consultant"], x: 28, y: 18 },
];

// ───────────────────── Full UK City list (76) ─────────────────────
// Explicit 76 UK city names for demo scale (12 curated above + 64 generated).
// Statuses/coords below are illustrative demo classifications for visual QA only.

const REMAINING_CITIES: string[] = [
  "Aberdeen", "Armagh", "Bath", "Bradford", "Brighton", "Cambridge", "Canterbury", "Carlisle",
  "Chelmsford", "Chester", "Chichester", "Coventry", "Derby", "Doncaster", "Dundee", "Durham",
  "Ely", "Exeter", "Gloucester", "Hereford", "Inverness", "Kingston upon Hull", "Lancaster", "Leicester",
  "Lichfield", "Lincoln", "Lisburn", "Londonderry", "Newport", "Norwich", "Oxford", "Peterborough",
  "Plymouth", "Portsmouth", "Preston", "Reading", "Ripon", "Rochester", "Salford", "Salisbury",
  "Southampton", "St Albans", "St Asaph", "St Davids", "Stirling", "Stoke-on-Trent", "Sunderland", "Swansea",
  "Truro", "Wakefield", "Wells", "Winchester", "Wolverhampton", "Worcester", "Wrexham", "York",
  "Bangor", "Colchester", "Milton Keynes", "Northampton", "Swindon", "Wigan", "Blackpool", "Bournemouth",
];

// Approx illustrative coords for remaining cities (mapX/mapY 0-100).
function approxCoords(index: number): { x: number; y: number } {
  // Spread deterministically around a GB bounding box to keep markers non-overlapping-ish.
  const cols = 9;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: 18 + col * 6.5,
    y: 14 + row * 12,
  };
}

// Build the full 76-list (curated active/progress seed cities above + remaining).
function citySeed(name: string, idx: number): Seed {
  const { x, y } = approxCoords(idx);
  // Demo: alternate statuses across the remaining national scale.
  const roll = idx % 3;
  const status: HubStatus = roll === 0 ? "making_progress" : roll === 1 ? "needs_activation" : "making_progress";
  const progress = status === "making_progress" ? 50 + (idx % 15) : 30 + (idx % 12);
  const roles: OpportunityRole[] =
    status === "needs_activation" ? (["agent"] as OpportunityRole[]) : ([] as OpportunityRole[]);
  return {
    name,
    region: "UK",
    type: "city",
    status,
    progress,
    desc: `Local Hub for ${name} connecting High Streets, businesses and residents to the National Hub Community.`,
    opportunities: roles,
    x,
    y,
  };
}

const ALL_CITIES: HubLocation[] = [
  ...SEEDS.filter((s) => s.type === "city").map((s) => makeLocation(s, `city-${s.name}`)),
  ...REMAINING_CITIES
    .filter((c) => !SEEDS.some((s) => s.type === "city" && s.name === c))
    .map((c, i) => makeLocation(citySeed(c, i), `city-${c}`)),
];

// ───────────────────── Full London Borough list (32) ─────────────────────
const ALL_LONDON_BOROUGH_NAMES: string[] = [
  "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden", "Croydon", "Ealing",
  "Enfield", "Greenwich", "Hackney", "Hammersmith & Fulham", "Haringey", "Harrow", "Havering", "Hillingdon",
  "Hounslow", "Islington", "Kensington and Chelsea", "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham",
  "Redbridge", "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest", "Wandsworth", "Westminster",
];

function boroughSeed(name: string, idx: number): Seed {
  const { x, y } = approxCoords(idx * 3 + 1);
  const roll = idx % 4;
  const curated = SEEDS.find((s) => s.type === "london_borough" && s.name === name);
  if (curated) return curated;
  const status: HubStatus = roll === 0 ? "making_progress" : roll === 1 ? "needs_activation" : "making_progress";
  const progress = roll === 0 ? 55 + (idx % 15) : 30 + (idx % 12);
  return {
    name,
    region: "London",
    type: "london_borough",
    status,
    progress,
    desc: `Local Borough Hub for ${name}, connecting local High Streets and communities to the National Hub Community.`,
    opportunities: status === "needs_activation" ? (["agent"] as OpportunityRole[]) : ([] as OpportunityRole[]),
    x,
    y,
  };
}

const LONDON_BOROUGHS: HubLocation[] = [...ALL_LONDON_BOROUGH_NAMES].map((n, i) =>
  makeLocation(boroughSeed(n, i), `lb-${n}`)
);

// ───────────────────── Combined dataset + helpers ─────────────────────

export const HUB_LOCATIONS: HubLocation[] = [...ALL_CITIES, ...LONDON_BOROUGHS];

export const HUB_SUMMARY: HubSummary = (() => {
  const counts = HUB_LOCATIONS.reduce(
    (acc, l) => {
      acc[l.status] += 1;
      if (l.opportunities && l.opportunities.length > 0) acc.opps += 1;
      return acc;
    },
    { active: 0, making_progress: 0, needs_activation: 0, opps: 0 }
  );
  const linkedCampaigns = new Set<string>();
  HUB_LOCATIONS.forEach((l) => l.campaignSlugs.forEach((s) => linkedCampaigns.add(s)));
  return {
    activeLocations: counts.active,
    makingProgress: counts.making_progress,
    needsActivation: counts.needs_activation,
    opportunities: counts.opps,
    activeCampaigns: linkedCampaigns.size,
  };
})();

export function getHubLocationBySlug(slug: string): HubLocation | undefined {
  return HUB_LOCATIONS.find((l) => l.slug === slug);
}

export const HUB_NATIONAL_SCALE =
  "Find out how you can Fund or Donate to 76 UK Cities, 32 London Boroughs, 36 Metropolitan Boroughs or 11 County Boroughs and District Councils.";

// ───────────────────── Map coordinate helpers ─────────────────────
// Converts normalised 0-100 mapX/mapY to real lat/lng for Google Maps.
// UK mainland bounding box: lat 50-59, lng -8 to 2 (inverted Y).

export function hubLatLng(location: HubLocation): { lat: number; lng: number } {
  return {
    lat: 59 - (location.mapY / 100) * 9,
    lng: -8 + (location.mapX / 100) * 10,
  };
}

// ───────────────────── Type Bridge ─────────────────────
// Converts from this map-specific HubLocation to the canonical HubLocation
// in types/uk-hub.ts. Useful when map data needs to be passed to hierarchy
// or progress components that expect the canonical type.

import type { HubLocation as CanonicalHubLocation } from "@/types/uk-hub";

export function toCanonicalLocation(loc: HubLocation): Partial<CanonicalHubLocation> {
  return {
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    shortDescription: loc.shortDescription,
    publicStatus: loc.status === "active" ? "ACTIVE" : loc.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION",
    internalLifecycle: loc.status === "active" ? "ACTIVE" : loc.status === "making_progress" ? "ACTIVATING" : "IDENTIFIED",
    isActive: loc.status === "active",
    isPublic: true,
    mapVisible: true,
    isFeaturedNationally: false,
    primaryImage: loc.imageOne,
    secondaryImage: loc.imageTwo,
  };
}
