import { DEMO_CAMPAIGNS, type DemoCampaign } from "./demo";
import {
  getAdminCampaigns,
  getAdminCampaignBySlug,
  adminCampaignToHubCampaign,
} from "./adminCampaigns";
import { getCities } from "./ukHubData";
import {
  getDemoCampaignsForHighStreet,
  getHighStreetsForArea,
  getLocalAreasForCity,
} from "./highStreetData";

export interface ExploreScope {
  citySlug?: string;
  areaSlug?: string;
  streetSlug?: string;
}

export interface ScopeOption {
  slug: string;
  name: string;
}

export function getCityOptions(): ScopeOption[] {
  return getCities().map((c) => ({ slug: c.slug, name: c.name }));
}

export function getAreaOptions(citySlug: string): ScopeOption[] {
  return getLocalAreasForCity(citySlug).map((a) => ({ slug: a.slug, name: a.name }));
}

export function getStreetOptions(citySlug: string, areaSlug: string): ScopeOption[] {
  return getHighStreetsForArea(citySlug, areaSlug).map((s) => ({ slug: s.slug, name: s.name }));
}

export function scopeToPath(scope: ExploreScope): string {
  if (scope.citySlug && scope.areaSlug && scope.streetSlug) {
    return `/consumer/explore/city/${scope.citySlug}/area/${scope.areaSlug}/street/${scope.streetSlug}`;
  }
  if (scope.citySlug && scope.areaSlug) {
    return `/consumer/explore/city/${scope.citySlug}/area/${scope.areaSlug}`;
  }
  if (scope.citySlug) {
    return `/consumer/explore/city/${scope.citySlug}`;
  }
  return "/consumer/explore";
}

// Same rule as the public consumer campaigns page (/campaigns/consumer):
// only campaigns explicitly tagged for the consumer audience.
function isConsumerAudience(c: DemoCampaign): boolean {
  return c.targetAudience === "consumer" || c.targetAudience === "both";
}

// Consumer dashboard never shows business campaigns.
function isBusinessCampaign(c: DemoCampaign): boolean {
  if (c.targetAudience === "business") return true;
  if (c.category.slug === "business" || c.category.slug === "business-partners") return true;
  if (c.campaignType && c.campaignType.toLowerCase().includes("business")) return true;
  return false;
}

export function getCampaignsForScope(scope: ExploreScope): DemoCampaign[] {
  const seen = new Set<string>();
  const out: DemoCampaign[] = [];

  const push = (list: DemoCampaign[]) => {
    for (const c of list) {
      if (seen.has(c.slug) || !isConsumerAudience(c) || isBusinessCampaign(c)) continue;
      seen.add(c.slug);
      out.push(c);
    }
  };

  if (scope.citySlug && scope.areaSlug && scope.streetSlug) {
    push(
      getDemoCampaignsForHighStreet(scope.citySlug, scope.areaSlug, scope.streetSlug),
    );
    return out;
  }

  if (scope.citySlug && scope.areaSlug) {
    for (const street of getStreetOptions(scope.citySlug, scope.areaSlug)) {
      push(
        getDemoCampaignsForHighStreet(scope.citySlug, scope.areaSlug, street.slug),
      );
    }
    return out;
  }

  if (scope.citySlug) {
    for (const area of getAreaOptions(scope.citySlug)) {
      for (const street of getStreetOptions(scope.citySlug, area.slug)) {
        push(
          getDemoCampaignsForHighStreet(scope.citySlug, area.slug, street.slug),
        );
      }
    }
    return out;
  }

  push(DEMO_CAMPAIGNS);
  push(getAdminCampaigns().map(adminCampaignToHubCampaign));
  return out;
}

export interface CampaignHierarchy {
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  streetSlug: string;
  streetName: string;
}

export interface ResolvedConsumerCampaign {
  campaign: DemoCampaign;
  hierarchy: CampaignHierarchy | null;
  startDate?: string;
  status?: string;
}

let streetCampaignIndex: Map<
  string,
  { campaign: DemoCampaign; hierarchy: CampaignHierarchy }
> | null = null;

function getStreetCampaignIndex(): Map<
  string,
  { campaign: DemoCampaign; hierarchy: CampaignHierarchy }
> {
  if (streetCampaignIndex) return streetCampaignIndex;
  const index = new Map<string, { campaign: DemoCampaign; hierarchy: CampaignHierarchy }>();
  for (const city of getCityOptions()) {
    for (const area of getAreaOptions(city.slug)) {
      for (const street of getStreetOptions(city.slug, area.slug)) {
        for (const campaign of getDemoCampaignsForHighStreet(city.slug, area.slug, street.slug)) {
          if (index.has(campaign.slug)) continue;
          index.set(campaign.slug, {
            campaign,
            hierarchy: {
              citySlug: city.slug,
              cityName: city.name,
              areaSlug: area.slug,
              areaName: area.name,
              streetSlug: street.slug,
              streetName: street.name,
            },
          });
        }
      }
    }
  }
  streetCampaignIndex = index;
  return index;
}

export function resolveCampaignForDetail(slug: string): ResolvedConsumerCampaign | null {
  const admin = getAdminCampaignBySlug(slug);
  if (admin) {
    return {
      campaign: adminCampaignToHubCampaign(admin),
      hierarchy: {
        citySlug: admin.citySlug,
        cityName: admin.cityName,
        areaSlug: admin.areaSlug,
        areaName: admin.areaName,
        streetSlug: admin.streetSlug,
        streetName: admin.streetName,
      },
      startDate: admin.startDate,
      status: admin.status,
    };
  }

  const demo = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
  if (demo) return { campaign: demo, hierarchy: null };

  const street = getStreetCampaignIndex().get(slug);
  if (street) return { campaign: street.campaign, hierarchy: street.hierarchy };

  return null;
}
