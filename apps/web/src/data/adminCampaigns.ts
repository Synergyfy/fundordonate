// =============================================================================
// Admin Campaigns Store — Frontend (no backend)
// Single source of truth for admin-created campaigns. Used by:
//   - /admin/campaigns list + detail (Public View link)
//   - /campaigns browse list
//   - /uk-hub-activation/.../campaign/:campaignSlug (rich hub detail page)
// =============================================================================

import type { DemoCampaign } from "@/data/demo";
import { getCities } from "@/data/ukHubData";
import { getLocalAreasForCity, getHighStreetsForArea } from "@/data/highStreetData";

export type AdminCampaignStatus =
  | "draft"
  | "changes_required"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "closed"
  | "archived";

export type AdminCampaignAudience = "business" | "consumer" | "both";

/**
 * Permitted lifecycle operations. Admin manages campaigns through:
 * create → review → approve → publish → (pause/resume/close) → archive.
 */
export type CampaignLifecycleAction =
  | "submit"
  | "approve"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "pause"
  | "resume"
  | "close"
  | "reopen"
  | "archive"
  | "restore";

/** Which actions are permitted from each lifecycle state. */
export const CAMPAIGN_LIFECYCLE: Record<AdminCampaignStatus, CampaignLifecycleAction[]> = {
  draft: ["submit"],
  changes_required: ["submit"],
  pending_review: ["approve", "request_changes"],
  approved: ["publish", "unpublish"],
  scheduled: ["publish", "unpublish"],
  active: ["pause", "close"],
  paused: ["resume", "close"],
  completed: ["archive"],
  closed: ["reopen", "archive"],
  archived: ["restore"],
};

/**
 * Apply a lifecycle action to a campaign. Returns the next status, or null
 * when the action is not permitted from the campaign's current state.
 */
export function applyCampaignLifecycleAction(
  campaign: AdminCampaign,
  action: CampaignLifecycleAction
): AdminCampaignStatus | null {
  const allowed = CAMPAIGN_LIFECYCLE[campaign.status] ?? [];
  if (!allowed.includes(action)) return null;
  const today = new Date().toISOString().split("T")[0] ?? "";
  switch (action) {
    case "submit":
      return "pending_review";
    case "approve":
      return "approved";
    case "request_changes":
      return "changes_required";
    case "publish":
      // Publishing an already-scheduled campaign goes live now; an approved
      // campaign is scheduled when its start date is in the future.
      if (campaign.status === "scheduled") return "active";
      return campaign.startDate && campaign.startDate > today ? "scheduled" : "active";
    case "unpublish":
      return "draft";
    case "pause":
      return "paused";
    case "resume":
      return "active";
    case "close":
      return "closed";
    case "reopen":
      return "active";
    case "archive":
      return "archived";
    case "restore":
      return "draft";
    default:
      return null;
  }
}

/**
 * Which locations a campaign covers — a SET (national / cities / local areas /
 * high streets / postcodes). Campaigns and locations are related but not
 * inseparable: coverage can be expanded on an existing campaign without
 * creating a new one.
 */
export interface CampaignCoverage {
  national: boolean;
  cities: string[];
  localAreas: { citySlug: string; areaSlug: string }[];
  highStreets: { citySlug: string; areaSlug: string; streetSlug: string }[];
  postcodes: string[];
}

export interface AdminCampaignSeed {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  scope: "city" | "independent";
  citySlug: string;
  areaSlug?: string;
  streetSlug?: string;
  /** Demo seed extras merged into the resolved coverage set. */
  coverageSeed?: {
    national?: boolean;
    extraAreaSlugs?: string[];
    extraStreetSlugs?: string[];
    postcodes?: string[];
  };
  audience: AdminCampaignAudience;
  status: AdminCampaignStatus;
  mode: "donation" | "fund" | "sponsor";
  raisedAmount: number;
  targetAmount: number;
  backers: number;
  startDate: string;
  endDate: string;
  season: string;
  createdAt: string;
  category: { name: string; slug: string };
  author: { firstName: string; lastName: string };
  /** Set when this campaign was claimed by a business from a master template. */
  businessCampaignId?: string;
}

export interface AdminCampaign extends AdminCampaignSeed {
  cityName: string;
  areaSlug: string;
  areaName: string;
  streetSlug: string;
  streetName: string;
  /** Resolved location-coverage set (always present). */
  coverage: CampaignCoverage;
}

const AUTHORIZED_BY = { firstName: "FundOrDonate", lastName: "Admin" };

const SEEDS: AdminCampaignSeed[] = [
  {
    id: "c1",
    slug: "manchester-tech-hub-launch",
    title: "Manchester Tech Hub Launch",
    description:
      "A city-wide campaign to launch the Manchester Tech Hub, equipping local businesses and residents with shared workspace, training and digital services on the high street.",
    shortDescription: "Launch the Manchester Tech Hub with shared workspace, training and digital services for local businesses.",
    scope: "city",
    citySlug: "manchester",
    areaSlug: "northern-quarter",
    streetSlug: "oldham-street",
    coverageSeed: {
      extraAreaSlugs: ["ancoats", "castlefield"],
      extraStreetSlugs: ["tib-street", "deansgate"],
      postcodes: ["M1", "M2", "M4"],
    },
    audience: "business",
    status: "active",
    mode: "fund",
    raisedAmount: 420000,
    targetAmount: 500000,
    backers: 180,
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    season: "Autumn 2026",
    createdAt: "2026-09-01",
    category: { name: "Business", slug: "business" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c2",
    slug: "birmingham-green-initiative",
    title: "Birmingham Green Initiative",
    description:
      "Greening Birmingham's high streets with planters, cycle parking and community gardens, funded jointly by local businesses and residents.",
    shortDescription: "Green Birmingham's high streets with planters, cycle parking and community gardens.",
    scope: "city",
    citySlug: "birmingham",
    coverageSeed: {
      extraAreaSlugs: ["jewellery-quarter", "moseley"],
      extraStreetSlugs: ["alcester-road"],
      postcodes: ["B1", "B5"],
    },
    audience: "both",
    status: "active",
    mode: "fund",
    raisedAmount: 280000,
    targetAmount: 350000,
    backers: 120,
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    season: "Autumn 2026",
    createdAt: "2026-09-01",
    category: { name: "Community", slug: "community" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c3",
    slug: "london-community-garden",
    title: "London Community Garden",
    description:
      "A resident-led campaign to convert unused high street space into community gardens across London boroughs.",
    shortDescription: "Convert unused high street space into community gardens across London boroughs.",
    scope: "city",
    citySlug: "london",
    coverageSeed: {
      extraAreaSlugs: ["westminster", "islington"],
      extraStreetSlugs: ["oxford-street", "camden-passage"],
      postcodes: ["EC1A", "WC2N"],
    },
    audience: "consumer",
    status: "active",
    mode: "donation",
    raisedAmount: 85000,
    targetAmount: 100000,
    backers: 420,
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    season: "Autumn 2026",
    createdAt: "2026-09-01",
    category: { name: "Local Hub", slug: "local-hub" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c4",
    slug: "leeds-digital-skills-programme",
    title: "Leeds Digital Skills Programme",
    description:
      "Free digital skills courses for Leeds residents, delivered through local businesses and community hubs.",
    shortDescription: "Free digital skills courses for Leeds residents, delivered through local businesses.",
    scope: "city",
    citySlug: "leeds",
    audience: "both",
    status: "draft",
    mode: "fund",
    raisedAmount: 0,
    targetAmount: 200000,
    backers: 0,
    startDate: "",
    endDate: "",
    season: "Autumn 2026",
    createdAt: "2026-09-10",
    category: { name: "Business", slug: "business" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c5",
    slug: "liverpool-youth-fund",
    title: "Liverpool Youth Fund",
    description:
      "Funding youth clubs, sports kit and mentoring across Liverpool's local areas.",
    shortDescription: "Funding youth clubs, sports kit and mentoring across Liverpool's local areas.",
    scope: "city",
    citySlug: "liverpool",
    audience: "consumer",
    status: "pending_review",
    mode: "donation",
    raisedAmount: 0,
    targetAmount: 80000,
    backers: 0,
    startDate: "",
    endDate: "",
    season: "Autumn 2026",
    createdAt: "2026-09-12",
    category: { name: "Community", slug: "community" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c6",
    slug: "bristol-arts-centre",
    title: "Bristol Arts Centre",
    description:
      "Refurbishing the Bristol Arts Centre so local groups can run workshops, exhibitions and performances year-round.",
    shortDescription: "Refurbish the Bristol Arts Centre for year-round workshops, exhibitions and performances.",
    scope: "city",
    citySlug: "bristol",
    audience: "consumer",
    status: "completed",
    mode: "fund",
    raisedAmount: 60000,
    targetAmount: 60000,
    backers: 150,
    startDate: "2026-07-01",
    endDate: "2026-09-15",
    season: "Summer 2026",
    createdAt: "2026-06-15",
    category: { name: "Local Hub", slug: "local-hub" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c7",
    slug: "birmingham-food-bank-network",
    title: "Birmingham Food Bank Network",
    description:
      "Connecting food banks across Birmingham so no community hub runs short of stock during winter.",
    shortDescription: "Connect food banks across Birmingham so no community hub runs short this winter.",
    scope: "city",
    citySlug: "birmingham",
    audience: "both",
    status: "scheduled",
    mode: "donation",
    raisedAmount: 0,
    targetAmount: 50000,
    backers: 0,
    startDate: "2026-10-15",
    endDate: "2026-12-15",
    season: "Autumn 2026",
    createdAt: "2026-09-08",
    category: { name: "Community", slug: "community" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c8",
    slug: "london-tech-startup-fund",
    title: "London Tech Startup Fund",
    description:
      "Backing London-founded tech startups that create local jobs, with contributions from businesses and residents.",
    shortDescription: "Back London-founded tech startups that create local jobs.",
    scope: "city",
    citySlug: "london",
    coverageSeed: {
      extraAreaSlugs: ["camden"],
      extraStreetSlugs: ["chalk-farm-road"],
      postcodes: ["EC2A", "E1"],
    },
    audience: "business",
    status: "active",
    mode: "sponsor",
    raisedAmount: 650000,
    targetAmount: 800000,
    backers: 290,
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    season: "Autumn 2026",
    createdAt: "2026-08-20",
    category: { name: "Business", slug: "business" },
    author: AUTHORIZED_BY,
  },
  {
    id: "c9",
    slug: "independent-bristol-makers",
    title: "Independent Bristol Makers",
    description:
      "An independent campaign supporting Bristol's independent makers with shared market stalls and equipment.",
    shortDescription: "Support Bristol's independent makers with shared market stalls and equipment.",
    scope: "independent",
    citySlug: "bristol",
    audience: "consumer",
    status: "archived",
    mode: "fund",
    raisedAmount: 15000,
    targetAmount: 20000,
    backers: 80,
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    season: "Spring 2026",
    createdAt: "2026-03-15",
    category: { name: "High Street", slug: "high-street" },
    author: AUTHORIZED_BY,
  },
];

const titleCase = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

function resolveLocation(seed: AdminCampaignSeed) {
  const city = getCities().find((c) => c.slug === seed.citySlug);
  const areas = getLocalAreasForCity(seed.citySlug);
  const area = areas.find((a) => a.slug === seed.areaSlug) ?? areas[0];
  const streets = area ? getHighStreetsForArea(seed.citySlug, area.slug) : [];
  const street = streets.find((s) => s.slug === seed.streetSlug) ?? streets[0];

  return {
    cityName: city?.name ?? titleCase(seed.citySlug),
    areaSlug: area?.slug ?? "central",
    areaName: area?.name ?? "Central",
    streetSlug: street?.slug ?? "high-street",
    streetName: street?.name ?? "High Street",
  };
}

/** Derive the campaign's location-coverage set from its primary location + seed extras. */
function buildCoverage(
  seed: AdminCampaignSeed,
  loc: { areaSlug: string; streetSlug: string }
): CampaignCoverage {
  const extras = seed.coverageSeed;
  const localAreas: CampaignCoverage["localAreas"] = [
    { citySlug: seed.citySlug, areaSlug: loc.areaSlug },
  ];
  for (const areaSlug of extras?.extraAreaSlugs ?? []) {
    if (!localAreas.some((a) => a.citySlug === seed.citySlug && a.areaSlug === areaSlug)) {
      localAreas.push({ citySlug: seed.citySlug, areaSlug });
    }
  }

  const highStreets: CampaignCoverage["highStreets"] = [
    { citySlug: seed.citySlug, areaSlug: loc.areaSlug, streetSlug: loc.streetSlug },
  ];
  for (const streetSlug of extras?.extraStreetSlugs ?? []) {
    if (!highStreets.some((s) => s.streetSlug === streetSlug)) {
      highStreets.push({ citySlug: seed.citySlug, areaSlug: loc.areaSlug, streetSlug });
    }
  }

  return {
    national: extras?.national ?? false,
    cities: [seed.citySlug],
    localAreas,
    highStreets,
    postcodes: extras?.postcodes ?? [],
  };
}

let cache: AdminCampaign[] | null = null;

export function getAdminCampaigns(): AdminCampaign[] {
  if (!cache) {
    cache = SEEDS.map((seed) => {
      const loc = resolveLocation(seed);
      return { ...seed, ...loc, coverage: buildCoverage(seed, loc) };
    });
  }
  return cache;
}

/** Persist an expanded/edited coverage set on an existing campaign (frontend store). */
export function updateAdminCampaignCoverage(
  id: string,
  coverage: CampaignCoverage
): AdminCampaign | undefined {
  const campaign = getAdminCampaignById(id);
  if (!campaign) return undefined;
  campaign.coverage = {
    national: coverage.national,
    cities: [...coverage.cities],
    localAreas: coverage.localAreas.map((a) => ({ ...a })),
    highStreets: coverage.highStreets.map((s) => ({ ...s })),
    postcodes: [...coverage.postcodes],
  };
  return campaign;
}

/** Persist a lifecycle status change on an existing campaign (frontend store). */
export function updateAdminCampaignStatus(
  id: string,
  status: AdminCampaignStatus
): AdminCampaign | undefined {
  const campaign = getAdminCampaignById(id);
  if (!campaign) return undefined;
  campaign.status = status;
  return campaign;
}

/** Add a new campaign to the admin store (frontend only). */
export function addAdminCampaign(seed: AdminCampaignSeed): AdminCampaign {
  const loc = resolveLocation(seed);
  const campaign: AdminCampaign = {
    ...seed,
    ...loc,
    coverage: buildCoverage(seed, loc),
  };
  getAdminCampaigns().push(campaign);
  return campaign;
}

/**
 * Does a campaign cover the given location?
 * Cascade: nationwide > city > local area > high street (a broader match
 * covers everything beneath it).
 */
export function campaignCoversLocation(
  campaign: AdminCampaign,
  citySlug: string,
  areaSlug?: string,
  streetSlug?: string
): boolean {
  const cov = campaign.coverage;
  if (cov.national) return true;
  const inCity =
    cov.cities.includes(citySlug) ||
    cov.localAreas.some((a) => a.citySlug === citySlug) ||
    cov.highStreets.some((s) => s.citySlug === citySlug) ||
    campaign.citySlug === citySlug;
  if (!inCity) return false;
  if (streetSlug) {
    return (
      cov.highStreets.some(
        (s) =>
          s.citySlug === citySlug &&
          s.streetSlug === streetSlug &&
          (!areaSlug || s.areaSlug === areaSlug)
      ) ||
      (areaSlug ? cov.localAreas.some((a) => a.citySlug === citySlug && a.areaSlug === areaSlug) : false) ||
      cov.cities.includes(citySlug) ||
      campaign.citySlug === citySlug
    );
  }
  if (areaSlug) {
    return (
      cov.localAreas.some((a) => a.citySlug === citySlug && a.areaSlug === areaSlug) ||
      cov.cities.includes(citySlug) ||
      campaign.citySlug === citySlug
    );
  }
  return true;
}

/** All campaigns covering a location (city / optional local area / optional high street). */
export function getAdminCampaignsForLocation(
  citySlug: string,
  areaSlug?: string,
  streetSlug?: string
): AdminCampaign[] {
  return getAdminCampaigns().filter((c) =>
    campaignCoversLocation(c, citySlug, areaSlug, streetSlug)
  );
}

/** Human-readable coverage summary for list columns and detail headers. */
export function summarizeCoverage(campaign: AdminCampaign): string {
  const cov = campaign.coverage;
  if (cov.national) return "Nationwide";
  const parts: string[] = [];
  if (cov.cities.length) {
    const names = cov.cities.map(
      (slug) => getCities().find((c) => c.slug === slug)?.name ?? titleCase(slug)
    );
    parts.push(
      names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2} more`
    );
  }
  if (cov.localAreas.length) parts.push(`${cov.localAreas.length} local area${cov.localAreas.length > 1 ? "s" : ""}`);
  if (cov.highStreets.length) parts.push(`${cov.highStreets.length} high street${cov.highStreets.length > 1 ? "s" : ""}`);
  if (cov.postcodes.length) parts.push(`${cov.postcodes.length} postcode${cov.postcodes.length > 1 ? "s" : ""}`);
  return parts.join(" · ") || "—";
}

export function getAdminCampaignById(id: string): AdminCampaign | undefined {
  return getAdminCampaigns().find((c) => c.id === id || c.slug === id);
}

export function getAdminCampaignBySlug(slug: string): AdminCampaign | undefined {
  return getAdminCampaigns().find((c) => c.slug === slug);
}

export function getAdminCampaignAudiencePath(audience: AdminCampaignAudience): string {
  return audience === "business" ? "business" : "consumer";
}

/** Public hub URL — the rich campaign page businesses/consumers see. */
export function getAdminCampaignPublicPath(campaign: AdminCampaign): string {
  return `/uk-hub-activation/${campaign.citySlug}/${campaign.areaSlug}/${campaign.streetSlug}/${getAdminCampaignAudiencePath(
    campaign.audience,
  )}/campaign/${campaign.slug}`;
}

/** Map an admin campaign into the DemoCampaign shape used by hub/public pages. */
export function adminCampaignToHubCampaign(campaign: AdminCampaign): DemoCampaign {
  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    shortDescription: campaign.shortDescription,
    mode: campaign.mode,
    goalAmount: campaign.targetAmount,
    raisedAmount: campaign.raisedAmount,
    deadline: campaign.endDate || "2026-12-31",
    category: campaign.category,
    author: campaign.author,
    location: `${campaign.streetName}, ${campaign.areaName}, ${campaign.cityName}`,
    targetAudience: campaign.audience,
    campaignType: campaign.scope,
    participationTypes: [campaign.audience],
    _count: { donations: campaign.backers, pledges: 0 },
    tags: [campaign.season, campaign.category.name],
    evergreen: false,
    membership: false,
  };
}
