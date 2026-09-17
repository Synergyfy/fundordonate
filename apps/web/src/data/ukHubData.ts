// =============================================================================
// FundOrDonate — UK Hub Activation Architecture Data
//
// This file provides the complete UK Hub location hierarchy for the new
// National Hub, City Hub, and UK Map pages. It uses the types defined
// in @/types/uk-hub.ts.
//
// This is PRESENTATION / TEST data. It will be replaced by Admin/API data.
// Do NOT treat these numbers as immutable business logic.
// =============================================================================

import type {
  HubLocation,
  LocationPublicStatus,
  LocationInternalLifecycle,
  FoundingProgramme,
  HubActivity,
  HubEvent,
  NationalHubSummary,
  CityHubSummary,
  MapLocation,
} from "@/types/uk-hub";

// ───────────────────── Helpers ─────────────────────

const NOW = new Date().toISOString();
const DAY = 86_400_000;

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * DAY).toISOString();
}

// ───────────────────── National Hub ─────────────────────

export const NATIONAL_HUB: HubLocation = {
  id: "uk-national",
  name: "United Kingdom",
  slug: "united-kingdom",
  type: "NATIONAL",
  parentId: null,
  shortDescription: "The UK Hub Activation Programme — connecting cities, businesses and communities across the United Kingdom.",
  description: "The National Hub is the top-level activation layer for the UK Hub programme. It coordinates and communicates activation activity across all participating cities, showing progress, opportunities and how businesses and local residents can participate.",
  heroHeadline: "UK Hub Activation Programme",
  heroSupportingText: "Connecting cities, businesses and communities across the United Kingdom through localised activation, funding and participation.",
  internalLifecycle: "ACTIVE",
  publicStatus: "ACTIVE",
  statusOverride: null,
  isActive: true,
  isPublic: true,
  mapVisible: false,
  latitude: 55.3781,
  longitude: -3.436,
  mapZoomLevel: 6,
  primaryImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&h=600&q=80",
  secondaryImage: null,
  fullPath: "",
  isFeaturedNationally: false,
  featuredPriority: 0,
  fundingTarget: 5_000_000,
  fundingRaised: 3_250_000,
  activationThreshold: 80,
  foundingBusinessTotal: 0,
  foundingBusinessAllocated: 0,
  foundingConsumerTotal: 0,
  foundingConsumerAllocated: 0,
  createdAt: NOW,
  updatedAt: NOW,
};

// ───────────────────── City Seeds ─────────────────────

interface CitySeed {
  name: string;
  slug: string;
  region: string;
  status: LocationPublicStatus;
  lifecycle: LocationInternalLifecycle;
  activationProgress: number;
  fundingTarget: number;
  fundingRaised: number;
  foundingBusiness: number;
  foundingBizAllocated: number;
  foundingConsumer: number;
  foundingConsAllocated: number;
  description: string;
  featured: boolean;
  featuredPriority: number;
  lat: number;
  lng: number;
  hasBoroughs: boolean;
  boroughs?: string[];
  /** Display terminology for sub-city areas: "Borough", "District", or "Local Area" */
  areaTerminology?: string;
}

const CITY_SEEDS: CitySeed[] = [
  // ── ACTIVE CITIES ──
  {
    name: "London", slug: "london", region: "South East",
    status: "ACTIVE", lifecycle: "ACTIVE", activationProgress: 92,
    fundingTarget: 1_200_000, fundingRaised: 1_104_000,
    foundingBusiness: 500, foundingBizAllocated: 487,
    foundingConsumer: 800, foundingConsAllocated: 756,
    description: "London leads the UK Hub Activation programme across 32 boroughs. The capital's diverse business and community landscape drives activation across high streets, commercial districts and local areas.",
    featured: true, featuredPriority: 1,
    lat: 51.5074, lng: -0.1278, hasBoroughs: true, areaTerminology: "Borough",
    boroughs: [
      "Westminster", "Camden", "Islington", "Hackney", "Tower Hamlets",
      "Southwark", "Lambeth", "Lewisham", "Greenwich", "Bexley",
      "Bromley", "Croydon", "Sutton", "Merton", "Kingston upon Thames",
      "Richmond upon Thames", "Hounslow", "Ealing", "Harrow", "Barnet",
      "Haringey", "Enfield", "Waltham Forest", "Redbridge", "Barking and Dagenham",
      "Havering", "Hillingdon", "Harrow", "Brent", "Hammersmith and Fulham",
      "Kensington and Chelsea", "Newham",
    ],
  },
  {
    name: "Manchester", slug: "manchester", region: "North West",
    status: "ACTIVE", lifecycle: "ACTIVE", activationProgress: 78,
    fundingTarget: 600_000, fundingRaised: 468_000,
    foundingBusiness: 200, foundingBizAllocated: 182,
    foundingConsumer: 400, foundingConsAllocated: 341,
    description: "Manchester is a thriving UK Hub city with strong business participation and community engagement. The city's activation programme supports local high streets and commercial areas.",
    featured: true, featuredPriority: 3,
    lat: 53.4808, lng: -2.2426, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Northern Quarter", "Didsbury", "Chorlton", "Salford",
      "Altrincham", "Stockport", "Rochdale", "Bury", "Oldham",
    ],
  },
  {
    name: "Birmingham", slug: "birmingham", region: "West Midlands",
    status: "MAKING_PROGRESS", lifecycle: "ACTIVE", activationProgress: 62,
    fundingTarget: 500_000, fundingRaised: 310_000,
    foundingBusiness: 150, foundingBizAllocated: 98,
    foundingConsumer: 300, foundingConsAllocated: 187,
    description: "Birmingham is making strong progress in its UK Hub Activation. Founding Membership opportunities are open for both businesses and local residents.",
    featured: true, featuredPriority: 2,
    lat: 52.4862, lng: -1.8904, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Edgbaston", "Moseley", "Kings Heath", "Sparkbrook",
      "Handsworth", "Erdington", "Sutton Coldfield", "Solihull", "Harborne",
      "Bournville", "Acocks Green",
    ],
  },
  // ── MAKING PROGRESS CITIES ──
  {
    name: "Leeds", slug: "leeds", region: "Yorkshire",
    status: "MAKING_PROGRESS", lifecycle: "LAUNCHING", activationProgress: 45,
    fundingTarget: 400_000, fundingRaised: 180_000,
    foundingBusiness: 120, foundingBizAllocated: 52,
    foundingConsumer: 250, foundingConsAllocated: 98,
    description: "Leeds is launching its UK Hub Activation with growing business and community participation.",
    featured: false, featuredPriority: 0,
    lat: 53.8008, lng: -1.5491, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Headingley", "Chapel Allerton", "Roundhay", "Morley",
      "Pudsey", "Wetherby", "Otley", "Armley", "Hunslet",
    ],
  },
  {
    name: "Liverpool", slug: "liverpool", region: "North West",
    status: "MAKING_PROGRESS", lifecycle: "LAUNCHING", activationProgress: 38,
    fundingTarget: 350_000, fundingRaised: 133_000,
    foundingBusiness: 100, foundingBizAllocated: 38,
    foundingConsumer: 200, foundingConsAllocated: 72,
    description: "Liverpool is building its UK Hub Activation with Founding Membership now open.",
    featured: false, featuredPriority: 0,
    lat: 53.4084, lng: -2.9916, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Albert Dock", "Bold Street", "Lark Lane", "Allerton",
      "Woolton", "Childwall", "Crosby", "Waterfront", "Baltic Triangle",
    ],
  },
  {
    name: "Bristol", slug: "bristol", region: "South West",
    status: "MAKING_PROGRESS", lifecycle: "LAUNCHING", activationProgress: 35,
    fundingTarget: 300_000, fundingRaised: 105_000,
    foundingBusiness: 80, foundingBizAllocated: 28,
    foundingConsumer: 180, foundingConsAllocated: 54,
    description: "Bristol is activating its UK Hub with growing local business participation.",
    featured: false, featuredPriority: 0,
    lat: 51.4545, lng: -2.5879, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Clifton", "Harbourside", "Stokes Croft", "Bedminster",
      "Redland", "Bishopston", "Fishponds", "Southville", "Temple Quarter",
    ],
  },
  {
    name: "Glasgow", slug: "glasgow", region: "Scotland",
    status: "MAKING_PROGRESS", lifecycle: "LAUNCHING", activationProgress: 32,
    fundingTarget: 350_000, fundingRaised: 112_000,
    foundingBusiness: 100, foundingBizAllocated: 32,
    foundingConsumer: 200, foundingConsAllocated: 64,
    description: "Glasgow is building momentum in its UK Hub Activation programme.",
    featured: false, featuredPriority: 0,
    lat: 55.8642, lng: -4.2518, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Merchant City", "West End", "Southside", "Partick",
      "Finnieston", "Govan", "Shettleston", "Dennistoun", "Woodlands",
    ],
  },
  {
    name: "Edinburgh", slug: "edinburgh", region: "Scotland",
    status: "MAKING_PROGRESS", lifecycle: "PREPARING", activationProgress: 28,
    fundingTarget: 300_000, fundingRaised: 84_000,
    foundingBusiness: 80, foundingBizAllocated: 22,
    foundingConsumer: 160, foundingConsAllocated: 45,
    description: "Edinburgh is preparing its UK Hub Activation with Founding Membership opening soon.",
    featured: false, featuredPriority: 0,
    lat: 55.9533, lng: -3.1883, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Old Town", "New Town", "Leith", "Bruntsfield",
      "Morningside", "Stockbridge", "Portobello", "Haymarket", "Tollcross",
    ],
  },
  // ── NEEDS ACTIVATION CITIES ──
  {
    name: "Bradford", slug: "bradford", region: "Yorkshire",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 15,
    fundingTarget: 250_000, fundingRaised: 37_500,
    foundingBusiness: 60, foundingBizAllocated: 9,
    foundingConsumer: 120, foundingConsAllocated: 18,
    description: "Bradford is identified for UK Hub Activation. Early participation is building momentum.",
    featured: false, featuredPriority: 0,
    lat: 53.7960, lng: -1.7594, hasBoroughs: false,
  },
  {
    name: "Sheffield", slug: "sheffield", region: "Yorkshire",
    status: "MAKING_PROGRESS", lifecycle: "LAUNCHING", activationProgress: 40,
    fundingTarget: 250_000, fundingRaised: 100_000,
    foundingBusiness: 60, foundingBizAllocated: 24,
    foundingConsumer: 120, foundingConsAllocated: 48,
    description: "Sheffield is building its UK Hub Activation with growing local business participation.",
    featured: false, featuredPriority: 0,
    lat: 53.3811, lng: -1.4701, hasBoroughs: true, areaTerminology: "District",
    boroughs: [
      "City Centre", "Kelham Island", "Ecclesall", "Nether Green", "Walkley",
      "Crookes", "Sharrow", "Heeley", "Woodseats", "Dore",
    ],
  },
  {
    name: "Newcastle", slug: "newcastle", region: "North East",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 10,
    fundingTarget: 250_000, fundingRaised: 25_000,
    foundingBusiness: 60, foundingBizAllocated: 6,
    foundingConsumer: 120, foundingConsAllocated: 12,
    description: "Newcastle is being prepared for UK Hub Activation.",
    featured: false, featuredPriority: 0,
    lat: 54.9783, lng: -1.6178, hasBoroughs: false,
  },
  {
    name: "Nottingham", slug: "nottingham", region: "East Midlands",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 8,
    fundingTarget: 200_000, fundingRaised: 16_000,
    foundingBusiness: 50, foundingBizAllocated: 4,
    foundingConsumer: 100, foundingConsAllocated: 8,
    description: "Nottingham is in early UK Hub Activation planning.",
    featured: false, featuredPriority: 0,
    lat: 52.9548, lng: -1.1581, hasBoroughs: false,
  },
  {
    name: "Leicester", slug: "leicester", region: "East Midlands",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 6,
    fundingTarget: 200_000, fundingRaised: 12_000,
    foundingBusiness: 50, foundingBizAllocated: 3,
    foundingConsumer: 100, foundingConsAllocated: 6,
    description: "Leicester is identified for future UK Hub Activation.",
    featured: false, featuredPriority: 0,
    lat: 52.6369, lng: -1.1398, hasBoroughs: false,
  },
  {
    name: "Coventry", slug: "coventry", region: "West Midlands",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 5,
    fundingTarget: 200_000, fundingRaised: 10_000,
    foundingBusiness: 50, foundingBizAllocated: 2,
    foundingConsumer: 100, foundingConsAllocated: 4,
    description: "Coventry is in early planning for UK Hub Activation.",
    featured: false, featuredPriority: 0,
    lat: 52.4068, lng: -1.5197, hasBoroughs: false,
  },
  {
    name: "Southampton", slug: "southampton", region: "South East",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 4,
    fundingTarget: 200_000, fundingRaised: 8_000,
    foundingBusiness: 50, foundingBizAllocated: 2,
    foundingConsumer: 100, foundingConsAllocated: 4,
    description: "Southampton is being assessed for UK Hub Activation.",
    featured: false, featuredPriority: 0,
    lat: 50.9097, lng: -1.4044, hasBoroughs: false,
  },
  {
    name: "Reading", slug: "reading", region: "South East",
    status: "NEEDS_ACTIVATION", lifecycle: "IDENTIFIED", activationProgress: 3,
    fundingTarget: 200_000, fundingRaised: 6_000,
    foundingBusiness: 50, foundingBizAllocated: 1,
    foundingConsumer: 100, foundingConsAllocated: 2,
    description: "Reading is in early UK Hub Activation assessment.",
    featured: false, featuredPriority: 0,
    lat: 51.4543, lng: -0.9781, hasBoroughs: false,
  },
];

// ───────────────────── Build Full Hierarchy ─────────────────────

function buildCityLocation(seed: CitySeed, index: number): HubLocation {
  return {
    id: `city-${seed.slug}`,
    name: seed.name,
    slug: seed.slug,
    type: "CITY",
    parentId: "uk-national",
    shortDescription: seed.description.split(".")[0] + ".",
    description: seed.description,
    heroHeadline: `${seed.name} City Hub`,
    heroSupportingText: `Part of the UK Hub Activation Programme — ${seed.region}`,
    internalLifecycle: seed.lifecycle,
    publicStatus: seed.status,
    statusOverride: null,
    isActive: seed.status === "ACTIVE",
    isPublic: true,
    mapVisible: true,
    latitude: seed.lat,
    longitude: seed.lng,
    mapZoomLevel: 11,
    primaryImage: `https://images.unsplash.com/photo-${["1513635269975-59663e0ac1ad", "1519501025264-65ba15a82390", "1477959858617-67f85cf4f1df", "1449824913935-59a10b8d2000", "1494522358652-f30e61a60313", "1480714378408-67cf0d13bc1b", "1444723121867-7a241cacace9", "1467269204594-9661b134dd2b"][index % 8]}?auto=format&fit=crop&w=1200&h=600&q=80`,
    secondaryImage: `https://images.unsplash.com/photo-${["1441986300917-64674bd600d8", "1555396273-367ea4eb4db5", "1472851290388-39f4d448d5d3", "1521295121783-8a321d551ad2", "1519505907962-0a6cb0167c73", "1460923492452-bf4f5d2b4679", "1556742049-0cfed4f6a45d", "1441984904996-e0b6ba687e04"][index % 8]}?auto=format&fit=crop&w=800&h=600&q=80`,
    fullPath: seed.slug,
    isFeaturedNationally: seed.featured,
    featuredPriority: seed.featuredPriority,
    fundingTarget: seed.fundingTarget,
    fundingRaised: seed.fundingRaised,
    activationThreshold: 80,
    foundingBusinessTotal: seed.foundingBusiness,
    foundingBusinessAllocated: seed.foundingBizAllocated,
    foundingConsumerTotal: seed.foundingConsumer,
    foundingConsumerAllocated: seed.foundingConsAllocated,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildBoroughLocation(name: string, slug: string, cityId: string, citySlug: string, index: number): HubLocation {
  const statuses: LocationPublicStatus[] = ["MAKING_PROGRESS", "NEEDS_ACTIVATION", "ACTIVE"];
  const status = statuses[index % 3]!;
  const cityName = citySlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  return {
    id: `borough-${slug}`,
    name,
    slug,
    type: "BOROUGH",
    parentId: cityId,
    shortDescription: `${name} is a local area in ${cityName} participating in the UK Hub Activation programme.`,
    description: `${name} is one of the local areas in ${cityName} in the UK Hub Activation programme. Local businesses and residents can participate in campaigns and Founding Membership opportunities.`,
    heroHeadline: `${name}`,
    heroSupportingText: `Local Area — Part of ${cityName} UK Hub Activation`,
    internalLifecycle: status === "ACTIVE" ? "ACTIVE" : status === "MAKING_PROGRESS" ? "LAUNCHING" : "IDENTIFIED",
    publicStatus: status,
    statusOverride: null,
    isActive: status === "ACTIVE",
    isPublic: true,
    mapVisible: false,
    latitude: 51.5 + (Math.random() - 0.5) * 0.2,
    longitude: -0.1 + (Math.random() - 0.5) * 0.2,
    mapZoomLevel: 13,
    primaryImage: `https://images.unsplash.com/photo-${["1513635269975-59663e0ac1ad", "1555396273-367ea4eb4db5", "1441986300917-64674bd600d8"][index % 3]}?auto=format&fit=crop&w=800&h=400&q=80`,
    secondaryImage: null,
    fullPath: `${citySlug}/${slug}`,
    isFeaturedNationally: false,
    featuredPriority: 0,
    fundingTarget: 150_000,
    fundingRaised: status === "ACTIVE"
      ? 95_000 + ((index * 7_333) % 40_000)
      : status === "MAKING_PROGRESS"
        ? 50_000 + ((index * 7_333) % 30_000)
        : 12_000 + ((index * 7_333) % 18_000),
    activationThreshold: 80,
    foundingBusinessTotal: 30,
    foundingBusinessAllocated: status === "ACTIVE"
      ? 21 + (index % 8)
      : status === "MAKING_PROGRESS"
        ? 10 + (index % 8)
        : 2 + (index % 5),
    foundingConsumerTotal: 50,
    foundingConsumerAllocated: status === "ACTIVE"
      ? 36 + (index % 10)
      : status === "MAKING_PROGRESS"
        ? 16 + (index % 12)
        : 4 + (index % 7),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

// Build all locations
const allCities = CITY_SEEDS.map((seed, i) => buildCityLocation(seed, i));
const allBoroughs: HubLocation[] = [];

// Add boroughs for all cities that have them
CITY_SEEDS.forEach((seed) => {
  if (seed.boroughs && seed.boroughs.length > 0) {
    const city = allCities.find(c => c.slug === seed.slug);
    if (city) {
      seed.boroughs.forEach((borough, i) => {
        const slug = borough.toLowerCase().replace(/\s+and\s+/g, "-").replace(/\s+/g, "-");
        allBoroughs.push(buildBoroughLocation(borough, slug, city.id, seed.slug, i));
      });
    }
  }
});

// Build sub-areas for every ACTIVE / MAKING_PROGRESS borough
const allSubAreas: HubLocation[] = [];

function buildSubAreaLocation(name: string, slug: string, boroughId: string, boroughSlug: string, index: number): HubLocation {
  const statuses: LocationPublicStatus[] = ["MAKING_PROGRESS", "ACTIVE", "MAKING_PROGRESS"];
  const status: LocationPublicStatus = statuses[index % 3]!;
  const boroughName = boroughSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  return {
    id: `subarea-${slug}`,
    name,
    slug,
    type: "LOCAL_AREA",
    parentId: boroughId,
    shortDescription: `${name} is a local area in ${boroughName}.`,
    description: `${name} is one of the local areas in ${boroughName} in the UK Hub Activation programme.`,
    heroHeadline: name,
    heroSupportingText: `Local Area — Part of ${boroughName}`,
    internalLifecycle: status === "ACTIVE" ? "ACTIVE" : "LAUNCHING",
    publicStatus: status,
    statusOverride: null,
    isActive: status === "ACTIVE",
    isPublic: true,
    mapVisible: false,
    latitude: 51.5 + (Math.random() - 0.5) * 0.2,
    longitude: -0.1 + (Math.random() - 0.5) * 0.2,
    mapZoomLevel: 14,
    primaryImage: `https://images.unsplash.com/photo-${["1441986300917-64674bd600d8", "1555396273-367ea4eb4db5", "1472851290388-39f4d448d5d3"][index % 3]}?auto=format&fit=crop&w=800&h=400&q=80`,
    secondaryImage: null,
    fullPath: `${boroughSlug}/${slug}`,
    isFeaturedNationally: false,
    featuredPriority: 0,
    fundingTarget: 50_000,
    fundingRaised: status === "ACTIVE" ? 35_000 + ((index * 3_000) % 15_000) : 15_000 + ((index * 2_000) % 10_000),
    activationThreshold: 80,
    foundingBusinessTotal: 15,
    foundingBusinessAllocated: status === "ACTIVE" ? 10 + (index % 5) : 4 + (index % 4),
    foundingConsumerTotal: 30,
    foundingConsumerAllocated: status === "ACTIVE" ? 20 + (index % 8) : 8 + (index % 6),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const SUB_AREA_NAMES = [
  ["Central", "North", "South", "East", "West"],
  ["Town Centre", "High Street", "Market Area", "Station Quarter", "Riverside"],
  ["Old Town", "New District", "Green Area", "Park Side", "Bridge End"],
];

allBoroughs.forEach((borough, bIdx) => {
  if (borough.publicStatus !== "ACTIVE" && borough.publicStatus !== "MAKING_PROGRESS") return;
  const nameSet = SUB_AREA_NAMES[bIdx % SUB_AREA_NAMES.length]!;
  nameSet.forEach((base, i) => {
    const name = `${base} ${borough.name}`;
    const slug = `${base.toLowerCase().replace(/\s+/g, "-")}-${borough.slug}`;
    allSubAreas.push(buildSubAreaLocation(name, slug, borough.id, borough.slug, bIdx * 10 + i));
  });
});

export const ALL_LOCATIONS: HubLocation[] = [
  NATIONAL_HUB,
  ...allCities,
  ...allBoroughs,
  ...allSubAreas,
];

// ───────────────────── Location Lookup Helpers ─────────────────────

export function getLocationBySlug(slug: string): HubLocation | undefined {
  return ALL_LOCATIONS.find(l => l.slug === slug);
}

export function getLocationById(id: string): HubLocation | undefined {
  return ALL_LOCATIONS.find(l => l.id === id);
}

// ───────────────────── Map-Location Financial Resolver ─────────────────────
// The interactive map (hubActivation.ts) renders 108 locations (76 cities +
// 32 boroughs); this file seeds 16 cities + 32 boroughs. Map locations without
// a seeded entry still need sensible, deterministic, non-zero financials — an
// Active or Making Progress location is, by definition, backed by paid
// participation, so funding and founding allocation must never be zero.
// This resolver is the single source used by all hub pages.

function hashString(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface ResolvedLocationFinancials {
  fundingRaised: number;
  fundingTarget: number;
  foundingBusinessTotal: number;
  foundingBusinessAllocated: number;
  foundingConsumerTotal: number;
  foundingConsumerAllocated: number;
  internalLifecycle: LocationInternalLifecycle;
  activationThreshold: number | null;
  resolvedFromSeed: boolean;
}

/** Find a seeded location for a map location, tolerating slug differences
 *  (e.g. map "kensington-and-chelsea" vs seeded "kensington-chelsea"). */
export function resolveSeedLocation(mapSlug: string, mapName: string): HubLocation | undefined {
  const exact = getLocationBySlug(mapSlug);
  if (exact) return exact;
  const normalised = mapSlug.replace(/-and-/g, "-");
  const byNormalised = getLocationBySlug(normalised);
  if (byNormalised) return byNormalised;
  const nameLower = mapName.trim().toLowerCase();
  return ALL_LOCATIONS.find(l => l.name.toLowerCase() === nameLower);
}

export function resolveLocationFinancials(
  mapSlug: string,
  mapName: string,
  mapType: string,
  mapStatus: "active" | "making_progress" | "needs_activation",
  mapProgress: number,
): ResolvedLocationFinancials {
  const seed = resolveSeedLocation(mapSlug, mapName);
  if (seed && seed.fundingTarget > 0) {
    // Enforce map-status floors: the map may curate a higher status than the
    // seed (e.g. Camden is Active on the map). Active / Making Progress must
    // always show meaningful paid participation — never zero or near-zero.
    let fundingRaised = seed.fundingRaised;
    let bizAllocated = seed.foundingBusinessAllocated;
    let conAllocated = seed.foundingConsumerAllocated;
    if (mapStatus === "active") {
      fundingRaised = Math.max(fundingRaised, Math.round(seed.fundingTarget * 0.55));
      bizAllocated = Math.max(bizAllocated, Math.ceil(seed.foundingBusinessTotal * 0.5));
      conAllocated = Math.max(conAllocated, Math.ceil(seed.foundingConsumerTotal * 0.5));
    } else if (mapStatus === "making_progress") {
      fundingRaised = Math.max(fundingRaised, Math.round(seed.fundingTarget * 0.28));
      bizAllocated = Math.max(bizAllocated, Math.ceil(seed.foundingBusinessTotal * 0.2));
      conAllocated = Math.max(conAllocated, Math.ceil(seed.foundingConsumerTotal * 0.2));
    }
    return {
      fundingRaised,
      fundingTarget: seed.fundingTarget,
      foundingBusinessTotal: seed.foundingBusinessTotal,
      foundingBusinessAllocated: Math.min(bizAllocated, seed.foundingBusinessTotal),
      foundingConsumerTotal: seed.foundingConsumerTotal,
      foundingConsumerAllocated: conAllocated,
      internalLifecycle: seed.internalLifecycle,
      activationThreshold: seed.activationThreshold ?? null,
      resolvedFromSeed: true,
    };
  }
  // Deterministic fallback — scaled by status and map progress so Active /
  // Making Progress locations always show meaningful paid participation.
  const h = hashString(`${mapSlug}|${mapName.toLowerCase()}`);
  const isBorough = mapType !== "city";
  const bizTotal = isBorough ? 24 + (h % 17) : 60 + (h % 91);
  const conTotal = bizTotal * 2;
  const progress = Math.max(1, Math.min(95, Math.round(mapProgress)));
  const allocFloor = mapStatus === "active" ? 50 : mapStatus === "making_progress" ? 20 : 5;
  const allocPct = Math.max(allocFloor, Math.min(94, progress + ((h >>> 3) % 11) - 5));
  const bizAllocated = Math.max(2, Math.min(bizTotal - 1, Math.round((bizTotal * allocPct) / 100)));
  const conAllocated = Math.max(3, Math.min(conTotal - 1, Math.round((conTotal * allocPct) / 100)));
  const fundingTarget = isBorough ? 90_000 + (h % 61_000) : 200_000 + (h % 401_000);
  const fundFloor = mapStatus === "active" ? 55 : mapStatus === "making_progress" ? 28 : 8;
  const fundPct = Math.max(fundFloor, Math.min(94, progress + ((h >>> 5) % 9) - 4));
  const fundingRaised = Math.max(2_500, Math.round((fundingTarget * fundPct) / 100));
  return {
    fundingRaised,
    fundingTarget,
    foundingBusinessTotal: bizTotal,
    foundingBusinessAllocated: bizAllocated,
    foundingConsumerTotal: conTotal,
    foundingConsumerAllocated: conAllocated,
    internalLifecycle: mapStatus === "active" ? "ACTIVE" : mapStatus === "making_progress" ? "LAUNCHING" : "IDENTIFIED",
    activationThreshold: 80,
    resolvedFromSeed: false,
  };
}

export function getChildLocations(parentId: string): HubLocation[] {
  return ALL_LOCATIONS.filter(l => l.parentId === parentId);
}

export function getAncestors(locationId: string): HubLocation[] {
  const chain: HubLocation[] = [];
  let current = getLocationById(locationId);
  while (current?.parentId) {
    const parent = getLocationById(current.parentId);
    if (parent) {
      chain.unshift(parent);
      current = parent;
    } else break;
  }
  return chain;
}

export function getCities(): HubLocation[] {
  return ALL_LOCATIONS.filter(l => l.type === "CITY");
}

/** Get the area terminology for a city (e.g. "Borough" for London, "District" for Manchester, "Local Area" default) */
export function getAreaTerminology(citySlug: string): string {
  const seed = CITY_SEEDS.find(s => s.slug === citySlug);
  return seed?.areaTerminology ?? "Local Area";
}

export function getCitiesByStatus(status: LocationPublicStatus): HubLocation[] {
  return getCities().filter(c => c.publicStatus === status);
}

export function getFeaturedCities(): HubLocation[] {
  return getCities().filter(c => c.isFeaturedNationally).sort((a, b) => (a.featuredPriority || 0) - (b.featuredPriority || 0));
}

export function getMapLocations(): MapLocation[] {
  return ALL_LOCATIONS
    .filter(l => l.mapVisible && l.latitude && l.longitude)
    .map(l => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      type: l.type,
      parentId: l.parentId,
      latitude: l.latitude!,
      longitude: l.longitude!,
      effectiveStatus: l.publicStatus,
      progressSummary: {
        activation: l.activationThreshold ? Math.min(Math.round((l.fundingRaised / l.fundingTarget) * 100), 100) : 0,
        funding: l.fundingTarget > 0 ? Math.min(Math.round((l.fundingRaised / l.fundingTarget) * 100), 100) : 0,
      },
      fundingTarget: l.fundingTarget,
      fundingRaised: l.fundingRaised,
      campaignSummary: { total: 3, active: 2 },
      foundingSummary: {
        businessOpen: l.foundingBusinessAllocated < l.foundingBusinessTotal,
        consumerOpen: l.foundingConsumerAllocated < l.foundingConsumerTotal,
        businessRemaining: Math.max(0, l.foundingBusinessTotal - l.foundingBusinessAllocated),
        consumerRemaining: Math.max(0, l.foundingConsumerTotal - l.foundingConsumerAllocated),
      },
      hubUrl: `/uk-hub-activation/${l.slug}`,
      shortDescription: l.shortDescription,
      primaryImage: l.primaryImage,
    }));
}

// ───────────────────── National Summary ─────────────────────

export function getNationalHubSummary(): NationalHubSummary {
  const cities = getCities();
  return {
    totalCities: cities.length,
    needsActivation: cities.filter(c => c.publicStatus === "NEEDS_ACTIVATION").length,
    makingProgress: cities.filter(c => c.publicStatus === "MAKING_PROGRESS").length,
    active: cities.filter(c => c.publicStatus === "ACTIVE").length,
    totalFundingRaised: cities.reduce((sum, c) => sum + c.fundingRaised, 0),
    totalFundingTarget: cities.reduce((sum, c) => sum + c.fundingTarget, 0),
    totalFoundingBusiness: cities.reduce((sum, c) => sum + c.foundingBusinessAllocated, 0),
    totalFoundingConsumer: cities.reduce((sum, c) => sum + c.foundingConsumerAllocated, 0),
    totalBackers: 2847,
    featuredCities: getFeaturedCities(),
    progressCities: getCitiesByStatus("MAKING_PROGRESS"),
    launchingCities: cities.filter(c => c.internalLifecycle === "LAUNCHING" || c.internalLifecycle === "PREPARING"),
    activeCities: getCitiesByStatus("ACTIVE"),
  };
}

// ───────────────────── City Hub Summary ─────────────────────

export function getCityHubSummary(citySlug: string): CityHubSummary | null {
  const city = getLocationBySlug(citySlug);
  if (!city || city.type !== "CITY") return null;

  const fundingProgress = city.fundingTarget > 0 ? Math.min(Math.round((city.fundingRaised / city.fundingTarget) * 100), 100) : 0;
  const activationProgress = city.activationThreshold ? Math.min(Math.round((fundingProgress / city.activationThreshold) * 100), 100) : fundingProgress;

  const bizRemaining = Math.max(0, city.foundingBusinessTotal - city.foundingBusinessAllocated);
  const consRemaining = Math.max(0, city.foundingConsumerTotal - city.foundingConsumerAllocated);

  return {
    city,
    effectiveStatus: city.statusOverride ?? city.publicStatus,
    activationProgress,
    fundingProgress,
    fundingRaised: city.fundingRaised,
    fundingTarget: city.fundingTarget,
    foundingBusiness: {
      total: city.foundingBusinessTotal,
      allocated: city.foundingBusinessAllocated,
      remaining: bizRemaining,
      status: bizRemaining === 0 ? "FULLY_ALLOCATED" : bizRemaining < city.foundingBusinessTotal * 0.1 ? "LIMITED" : "OPEN",
    },
    foundingConsumer: {
      total: city.foundingConsumerTotal,
      allocated: city.foundingConsumerAllocated,
      remaining: consRemaining,
      status: consRemaining === 0 ? "FULLY_ALLOCATED" : consRemaining < city.foundingConsumerTotal * 0.1 ? "LIMITED" : "OPEN",
    },
    campaignCount: 3,
    backerCount: Math.floor(city.foundingBusinessAllocated * 1.5 + city.foundingConsumerAllocated * 0.8),
    childLocationCount: getChildLocations(city.id).length,
    recentActivity: [],
    upcomingEvents: [],
  };
}

// ───────────────────── Founding Programmes (Demo) ─────────────────────

export const DEMO_FOUNDING_PROGRAMMES: FoundingProgramme[] = [
  {
    id: "fp-birmingham-biz",
    locationId: "city-birmingham",
    audience: "BUSINESS",
    status: "OPEN",
    title: "Birmingham Founding Business Member Programme",
    description: "Join as a Founding Business Member of the Birmingham City Hub. Gain early access, priority participation and recognition across the local business ecosystem.",
    totalAllocation: 150,
    allocatedCount: 98,
    opensAt: daysFromNow(-30),
    closesAt: daysFromNow(60),
    campaignId: "dc13",
    contributionConfig: JSON.stringify({
      bronze_standard: 9000, bronze_pro: 18000, bronze_pro_plus: 30000,
      silver_standard: 27000, silver_pro: 54000, silver_pro_plus: 80000,
      gold_standard: 114000, gold_pro: 150000, gold_pro_plus: 195000,
      platinum_standard: 240000, platinum_pro: 270000, platinum_pro_plus: 300000,
    }),
    benefitConfig: JSON.stringify(["early_access", "voting", "events", "priority_participation"]),
    eligibilityConfig: JSON.stringify({ audience: "BUSINESS" }),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "fp-birmingham-con",
    locationId: "city-birmingham",
    audience: "CONSUMER",
    status: "OPEN",
    title: "Birmingham Founding Consumer Member Programme",
    description: "Become a Founding Consumer Member of the Birmingham City Hub. Support your local community and receive recognition, events access and early opportunities.",
    totalAllocation: 300,
    allocatedCount: 187,
    opensAt: daysFromNow(-30),
    closesAt: daysFromNow(60),
    campaignId: null,
    contributionConfig: JSON.stringify({
      bronze_standard: 9000, bronze_pro: 18000, bronze_pro_plus: 30000,
      silver_standard: 27000, silver_pro: 54000, silver_pro_plus: 80000,
      gold_standard: 114000, gold_pro: 150000, gold_pro_plus: 195000,
      platinum_standard: 240000, platinum_pro: 270000, platinum_pro_plus: 300000,
    }),
    benefitConfig: JSON.stringify(["community_recognition", "events", "early_access"]),
    eligibilityConfig: JSON.stringify({ audience: "CONSUMER" }),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "fp-london-biz",
    locationId: "city-london",
    audience: "BUSINESS",
    status: "LIMITED",
    title: "London Founding Business Member Programme",
    description: "London's Founding Business Member programme is nearing full allocation. Secure your place in the capital's UK Hub Activation.",
    totalAllocation: 500,
    allocatedCount: 487,
    opensAt: daysFromNow(-90),
    closesAt: daysFromNow(30),
    campaignId: null,
    contributionConfig: JSON.stringify({
      bronze_standard: 9000, bronze_pro: 18000, bronze_pro_plus: 30000,
      silver_standard: 27000, silver_pro: 54000, silver_pro_plus: 80000,
      gold_standard: 114000, gold_pro: 150000, gold_pro_plus: 195000,
      platinum_standard: 240000, platinum_pro: 270000, platinum_pro_plus: 300000,
    }),
    benefitConfig: JSON.stringify(["early_access", "voting", "events", "priority_participation", "product_upgrades"]),
    eligibilityConfig: JSON.stringify({ audience: "BUSINESS" }),
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ───────────────────── Hub Activity (Demo) ─────────────────────

export const DEMO_HUB_ACTIVITY: HubActivity[] = [
  {
    id: "ha-1", locationId: "uk-national",
    activityType: "ANNOUNCEMENT", title: "UK Hub Activation Programme Reaches 15 Cities",
    content: "The UK Hub Activation programme now spans 15 cities across the United Kingdom, with 3 cities already active and making significant progress.",
    publicationStatus: "PUBLISHED", publishedAt: daysFromNow(-2),
    visibilityScope: "NATIONAL", createdAt: daysFromNow(-2),
  },
  {
    id: "ha-2", locationId: "city-birmingham",
    activityType: "MILESTONE", title: "Birmingham Reaches 62% Activation Progress",
    content: "Birmingham's UK Hub Activation has reached 62% progress, with growing business and consumer participation across the city.",
    publicationStatus: "PUBLISHED", publishedAt: daysFromNow(-1),
    visibilityScope: "LOCATION", createdAt: daysFromNow(-1),
  },
  {
    id: "ha-3", locationId: "city-london",
    activityType: "CAMPAIGN_UPDATE", title: "London Hub Campaign Progress Update",
    content: "London's City Activation campaign continues to grow with strong participation from businesses across 32 boroughs.",
    publicationStatus: "PUBLISHED", publishedAt: daysFromNow(-3),
    visibilityScope: "LOCATION", createdAt: daysFromNow(-3),
  },
  {
    id: "ha-4", locationId: "city-birmingham",
    activityType: "FOUNDING_MILESTONE", title: "Birmingham Founding Membership Passes 280 Members",
    content: "Birmingham's Founding Membership programme has now attracted over 280 business and consumer members.",
    publicationStatus: "PUBLISHED", publishedAt: daysFromNow(-5),
    visibilityScope: "LOCATION", createdAt: daysFromNow(-5),
  },
];

// ───────────────────── Hub Events (Demo) ─────────────────────

export const DEMO_HUB_EVENTS: HubEvent[] = [
  {
    id: "he-1", locationId: "city-birmingham",
    title: "Birmingham City Hub Launch Event",
    description: "Join us for the Birmingham City Hub launch. Meet local businesses, learn about Founding Membership, and discover how you can participate.",
    eventDate: daysFromNow(14),
    status: "PUBLISHED",
    ctaLabel: "Register Interest",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS", "CONSUMER"] }),
    createdAt: NOW,
  },
  {
    id: "he-2", locationId: "city-manchester",
    title: "Manchester Business Networking Evening",
    description: "Connect with other Manchester business owners and learn about the UK Hub Activation programme.",
    eventDate: daysFromNow(21),
    status: "PUBLISHED",
    ctaLabel: "Learn More",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS"] }),
    createdAt: NOW,
  },
];

/** Published events for a location; unseeded locations get a generated meetup. */
export function getEventsForLocation(locationId: string, locationName: string): HubEvent[] {
  const seeded = DEMO_HUB_EVENTS.filter(e => e.locationId === locationId && e.status === "PUBLISHED");
  if (seeded.length > 0) return seeded;
  return [{
    id: `he-${locationId}-meetup`,
    locationId,
    title: `${locationName} Hub Meetup`,
    description: `Meet local businesses and residents, hear hub updates and learn about Founding Membership in ${locationName}.`,
    eventDate: daysFromNow(30),
    status: "PUBLISHED",
    ctaLabel: "Register Interest",
    ctaUrl: "#",
    eligibleAudience: JSON.stringify({ audiences: ["BUSINESS", "CONSUMER"] }),
    createdAt: NOW,
  }];
}

// ───────────────────── Synthetic Location & Programmes ─────────────────────
// For map locations without a seeded entry (e.g. Aberdeen, Wandsworth).
// Financials come from the shared resolver: deterministic, non-zero, scaled
// by map status — identical to what the city panels show.

export interface MapLocationRef {
  slug: string;
  name: string;
  type: string;
  status: "active" | "making_progress" | "needs_activation";
  activationProgress: number;
  shortDescription: string;
  imageOne: string;
  imageTwo: string;
}

export function buildSyntheticLocation(mapLoc: MapLocationRef): HubLocation {
  const fin = resolveLocationFinancials(mapLoc.slug, mapLoc.name, mapLoc.type, mapLoc.status, mapLoc.activationProgress);
  const isCity = mapLoc.type === "city";
  return {
    id: isCity ? `city-${mapLoc.slug}` : `borough-${mapLoc.slug}`,
    name: mapLoc.name,
    slug: mapLoc.slug,
    type: isCity ? "CITY" : "BOROUGH",
    parentId: isCity ? "uk-national" : "city-london",
    shortDescription: mapLoc.shortDescription,
    description: mapLoc.shortDescription,
    heroHeadline: isCity ? `${mapLoc.name} City Hub` : mapLoc.name,
    heroSupportingText: isCity
      ? "Part of the UK Hub Activation Programme"
      : "London Borough — Part of the UK Hub Activation Programme",
    internalLifecycle: fin.internalLifecycle,
    publicStatus: mapLoc.status === "active" ? "ACTIVE" : mapLoc.status === "making_progress" ? "MAKING_PROGRESS" : "NEEDS_ACTIVATION",
    statusOverride: null,
    isActive: mapLoc.status === "active",
    isPublic: true,
    mapVisible: true,
    latitude: null,
    longitude: null,
    mapZoomLevel: isCity ? 11 : 13,
    primaryImage: mapLoc.imageOne,
    secondaryImage: mapLoc.imageTwo,
    fullPath: mapLoc.slug,
    isFeaturedNationally: false,
    featuredPriority: 0,
    fundingTarget: fin.fundingTarget,
    fundingRaised: fin.fundingRaised,
    activationThreshold: null,
    foundingBusinessTotal: fin.foundingBusinessTotal,
    foundingBusinessAllocated: fin.foundingBusinessAllocated,
    foundingConsumerTotal: fin.foundingConsumerTotal,
    foundingConsumerAllocated: fin.foundingConsumerAllocated,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function buildSyntheticProgrammes(loc: HubLocation): FoundingProgramme[] {
  const mk = (audience: "BUSINESS" | "CONSUMER", total: number, allocated: number): FoundingProgramme => ({
    id: `fp-${loc.slug}-${audience.toLowerCase()}`,
    locationId: loc.id,
    audience,
    status: allocated >= total ? "FULLY_ALLOCATED" : allocated / total > 0.9 ? "LIMITED" : "OPEN",
    title: `${loc.name} Founding ${audience === "BUSINESS" ? "Business" : "Consumer"} Member Programme`,
    description: audience === "BUSINESS"
      ? `Join as a Founding Business Member of the ${loc.name} hub. Gain early access, voting rights, priority participation and founding recognition.`
      : `Become a Founding Consumer Member of the ${loc.name} hub. Support your local community and receive recognition, events access and early opportunities.`,
    totalAllocation: total,
    allocatedCount: allocated,
    opensAt: NOW,
    closesAt: daysFromNow(60),
    campaignId: null,
    contributionConfig: JSON.stringify({
      bronze_standard: 9000, bronze_pro: 18000, bronze_pro_plus: 30000,
      silver_standard: 27000, silver_pro: 54000, silver_pro_plus: 80000,
      gold_standard: 114000, gold_pro: 150000, gold_pro_plus: 195000,
      platinum_standard: 240000, platinum_pro: 270000, platinum_pro_plus: 300000,
    }),
    benefitConfig: JSON.stringify(audience === "BUSINESS"
      ? ["early_access", "voting", "events", "priority_participation"]
      : ["community_recognition", "events", "early_access"]),
    eligibilityConfig: JSON.stringify({ audience }),
    createdAt: NOW,
    updatedAt: NOW,
  });
  return [
    mk("BUSINESS", loc.foundingBusinessTotal, loc.foundingBusinessAllocated),
    mk("CONSUMER", loc.foundingConsumerTotal, loc.foundingConsumerAllocated),
  ];
}

// ───────────────────── Founding Tier Configuration ─────────────────────
// Bronze / Silver / Gold / Platinum metals set the tier contribution.
// Each metal offers Standard (90 days), Pro (180 days) and Pro+ (annual)
// levels, which set the access period and benefits.
// NOTE: amounts/benefits are presentation seed data. The amounts shown on a
// programme come from its contributionConfig when present (falling back to
// the defaults below). Admin will manage benefits per level via backend later,
// so benefit keys (not hardcoded text) are used throughout.

// ───────────────────── Founding Tier Configuration (Henry's Structure) ─────
// 12 participation options: every metal (Bronze/Silver/Gold/Platinum) offers
// Standard (90 days), Pro (180 days) and Pro+ (annual) levels. The price is
// per metal × level combination — NOT per metal alone.
// Standard + Pro = Basic Backer Programme. Pro+ = Monthly Backer Programme
// (Monthly Giving route + qualifying campaign-creation access).
// NOTE: figures live here as the admin-configurable seed. A programme's
// contributionConfig ({metal}_{level} keys, minor units) overrides them when
// present. Two figures (Silver Pro+, Gold Pro) conflicted in the source notes
// and are flagged provisional until reconciled with Henry.

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

/** Option keys whose figures conflicted in the source notes — shown as TBC. */
export const PROVISIONAL_OPTION_KEYS = ["silver_pro_plus", "gold_pro"];

export function foundingOptionKey(metal: FoundingMetalKey, level: FoundingLevelKey): string {
  return `${metal}_${level}`;
}

function parsePriceConfig(raw: string | null | undefined): Record<string, number> {
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
    level: "standard", label: "Standard", durationDays: 90, durationLabel: "90 days access",
    programme: "Basic Backer Programme",
    backerStatus: "Backer",
    features: ["basic_backer_programme", "backer_acknowledgement", "campaign_reward", "access_90_days"],
  },
  {
    level: "pro", label: "Pro", durationDays: 180, durationLabel: "180 days access",
    programme: "Basic Backer Programme",
    backerStatus: "Backer",
    features: ["basic_backer_programme", "backer_acknowledgement", "campaign_reward", "access_180_days"],
  },
  {
    level: "pro_plus", label: "Pro+", durationDays: 365, durationLabel: "Annual membership",
    programme: "Monthly Backer Programme",
    backerStatus: "Monthly Backer",
    features: [
      "backer_acknowledgement", "campaign_reward", "access_annual",
      "monthly_giving", "business_backer_route", "consumer_founding_route",
      "cost_neutral_projects", "pro_status", "downline",
      "campaign_creation", "initial_contribution",
    ],
  },
];

/** Standard vs Pro vs Pro+ comparison rows for the feature matrix table. */
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

// ───────────────────── Activation Triggers (configurable, per Henry) ───────
// Activation must NOT be a fixed universal percentage. Admin sets per
// location: the target, the trigger point, what happens at trigger, and what
// unlocks. The trigger reflects the location's requirements and the resources
// required to operate it.

export interface ActivationTrigger {
  /** Admin-set trigger point (% of funding target). Null = default 80. */
  thresholdPct: number;
  fundingRaised: number;
  fundingTarget: number;
  fundingPct: number;
  bizAllocated: number;
  bizTotal: number;
  conAllocated: number;
  conTotal: number;
  /** Plain-language rule for display. */
  ruleText: string;
  /** Whether the location currently meets its trigger. */
  met: boolean;
}

export function getActivationTrigger(location: HubLocation): ActivationTrigger {
  const threshold = location.activationThreshold ?? 80;
  const fundingPct = location.fundingTarget > 0
    ? Math.min(Math.round((location.fundingRaised / location.fundingTarget) * 100), 100)
    : 0;
  const effectiveActive = (location.statusOverride ?? location.publicStatus) === "ACTIVE";
  return {
    thresholdPct: threshold,
    fundingRaised: location.fundingRaised,
    fundingTarget: location.fundingTarget,
    fundingPct,
    bizAllocated: location.foundingBusinessAllocated,
    bizTotal: location.foundingBusinessTotal,
    conAllocated: location.foundingConsumerAllocated,
    conTotal: location.foundingConsumerTotal,
    ruleText: `Activates at ${threshold}% of its ${formatCurrency(location.fundingTarget)} funding target with founding allocation underway — set by Admin for ${location.name}, not a universal percentage.`,
    met: fundingPct >= threshold || effectiveActive,
  };
}

/** What access and features each stage unlocks (admin-configurable wording). */
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

// ───────────────────── Founding Member Model (7 pillars, per Henry) ────────
// Founding Member status must be a real system feature, not a label. A member
// ("I'm a founding member of the Birmingham City Hub") is recognised later
// for voting, trials, access, upgrades, events and communications.

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

// ───────────────────── Founding Window (open-and-closed, per Henry) ───────
// Founding Membership is an open-and-closed campaign: it opens, it closes, it
// retains scarcity, and it may be brought back strategically later.

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

// ───────────────────── Split Contributions ─────────────────────
// Lets one contributor split a single amount across several destinations
// (city / borough / high street), each as Fund or Donate — or give the full
// amount to one cause. Destinations derive from seeded locations so Admin
// data changes flow through automatically.

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
  const cities = ALL_LOCATIONS.filter(l => l.type === "CITY" && l.isPublic);
  const scope = scopeCitySlug ? cities.find(c => c.slug === scopeCitySlug) : undefined;
  const cityList = scope ? [scope] : cities;
  const boroughs = ALL_LOCATIONS.filter(l => l.type === "BOROUGH" && l.isPublic)
    .filter(b => (scope ? b.parentId === scope.id : true));
  const cityOf = (parentId?: string | null) => cities.find(c => c.id === parentId);
  const hs = (name: string, baseSlug: string, parentName: string) => ({
    slug: `${baseSlug}-high-street`, name: `${name} High Street`, parentName,
  });
  return {
    cities: cityList.map(c => ({ slug: c.slug, name: c.name })),
    boroughs: boroughs.map(b => {
      const parent = cityOf(b.parentId);
      return { slug: b.slug, name: b.name, citySlug: parent?.slug ?? "", cityName: parent?.name ?? "" };
    }),
    highStreets: [
      ...cityList.map(c => hs(c.name, c.slug, c.name)),
      ...boroughs.map(b => hs(b.name, b.slug, cityOf(b.parentId)?.name ?? b.name)),
    ],
  };
}

// ───────────────────── Formatting Helpers ─────────────────────

export const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-GB").format(n);
