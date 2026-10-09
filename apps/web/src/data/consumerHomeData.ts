import { DEMO_CAMPAIGNS, type DemoCampaign } from "./demo";
import { getAdminCampaigns, getAdminCampaignBySlug, adminCampaignToHubCampaign } from "./adminCampaigns";
import {
  getCityHighStreetData,
  getDemoCampaignsForHighStreet,
} from "./highStreetData";
import { resolveCampaignForDetail } from "./consumerExploreData";

export interface ConsumerCommunity {
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  streetSlug: string;
  streetName: string;
}

const DEFAULT_COMMUNITY: ConsumerCommunity = {
  citySlug: "london",
  cityName: "London",
  areaSlug: "camden",
  areaName: "Camden",
  streetSlug: "camden-high-street",
  streetName: "Camden High Street",
};

const COMMUNITY_KEY = "fod:community";

function isValidCommunity(value: unknown): value is ConsumerCommunity {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const keys = [
    "citySlug",
    "cityName",
    "areaSlug",
    "areaName",
    "streetSlug",
    "streetName",
  ] as const;
  return keys.every((k) => typeof v[k] === "string" && (v[k] as string).length > 0);
}

export function getConsumerCommunity(): ConsumerCommunity {
  try {
    const raw = window.localStorage.getItem(COMMUNITY_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidCommunity(parsed)) return parsed;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_COMMUNITY;
}

export function setConsumerCommunity(community: ConsumerCommunity): void {
  window.localStorage.setItem(COMMUNITY_KEY, JSON.stringify(community));
}

function isConsumerAudience(c: DemoCampaign): boolean {
  return (
    !c.targetAudience ||
    c.targetAudience === "consumer" ||
    c.targetAudience === "both"
  );
}

export function getRecommendedCampaigns(
  community: ConsumerCommunity = getConsumerCommunity(),
  limit = 3,
): DemoCampaign[] {
  const seen = new Set<string>();
  const out: DemoCampaign[] = [];

  const push = (list: DemoCampaign[]) => {
    for (const c of list) {
      if (out.length >= limit) return;
      if (seen.has(c.slug) || !isConsumerAudience(c)) continue;
      seen.add(c.slug);
      out.push(c);
    }
  };

  const city = getCityHighStreetData(community.citySlug);
  const area = city?.localAreas.find((a) => a.slug === community.areaSlug);

  push(
    getDemoCampaignsForHighStreet(
      community.citySlug,
      community.areaSlug,
      community.streetSlug,
    ),
  );
  if (out.length >= limit) return out;

  if (area) {
    for (const street of area.highStreetsList) {
      if (street.slug === community.streetSlug) continue;
      push(
        getDemoCampaignsForHighStreet(
          community.citySlug,
          community.areaSlug,
          street.slug,
        ),
      );
      if (out.length >= limit) return out;
    }
  }

  if (city) {
    for (const cityArea of city.localAreas) {
      for (const street of cityArea.highStreetsList) {
        if (
          cityArea.slug === community.areaSlug &&
          street.slug === community.streetSlug
        ) {
          continue;
        }
        push(
          getDemoCampaignsForHighStreet(
            community.citySlug,
            cityArea.slug,
            street.slug,
          ),
        );
        if (out.length >= limit) return out;
      }
    }
  }

  push(DEMO_CAMPAIGNS);
  if (out.length >= limit) return out;

  push(getAdminCampaigns().map(adminCampaignToHubCampaign));
  return out;
}

export interface ConsumerCampaignRef {
  slug: string;
  title: string;
  location: string;
}

export function findConsumerCampaign(
  slug: string,
  community: ConsumerCommunity = getConsumerCommunity(),
): ConsumerCampaignRef | null {
  const demo = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
  if (demo && isConsumerAudience(demo)) {
    return { slug: demo.slug, title: demo.title, location: demo.location ?? "" };
  }

  const admin = getAdminCampaignBySlug(slug);
  if (admin) {
    const hub = adminCampaignToHubCampaign(admin);
    return { slug: hub.slug, title: hub.title, location: hub.location ?? "" };
  }

  const city = getCityHighStreetData(community.citySlug);
  if (city) {
    for (const area of city.localAreas) {
      for (const street of area.highStreetsList) {
        const generated = getDemoCampaignsForHighStreet(
          community.citySlug,
          area.slug,
          street.slug,
        );
        const match = generated.find((c) => c.slug === slug && isConsumerAudience(c));
        if (match) {
          return { slug: match.slug, title: match.title, location: match.location ?? "" };
        }
      }
    }
  }

  const resolved = resolveCampaignForDetail(slug);
  if (resolved && isConsumerAudience(resolved.campaign)) {
    return {
      slug: resolved.campaign.slug,
      title: resolved.campaign.title,
      location: resolved.campaign.location ?? "",
    };
  }

  return null;
}
