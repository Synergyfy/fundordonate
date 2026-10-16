export interface NationalProgressData {
  totalCities: number;
  activeCities: number;
  activeCitiesCount?: number;
  makingProgressCities: number;
  progressCitiesCount?: number;
  needsActivationCities: number;
  totalFundingRaised: number;
  totalFundingTarget: number;
  totalCampaignDonations: number;
  totalCampaignPledges: number;
  totalBackers: number;
  totalFoundingBusiness: number;
  totalFoundingConsumer: number;
  campaignCount: number;
  citiesCount?: number;
  contributionVelocity: { period: string; amount: number }[];
}

export interface ChildContribution {
  childId: string;
  childName: string;
  childType: string;
  raised: number;
  campaigns: number;
  backers: number;
}

export interface LocationStatsData {
  locationId: string;
  locationName: string;
  locationType: string;
  hierarchyLevel: string;
  fundingRaised: number;
  fundingTarget: number;
  activationProgress: number;
  campaignCount: number;
  totalDonations: number;
  totalPledges: number;
  totalBackers: number;
  foundingBusiness: { total: number; allocated: number; remaining: number; status: string };
  foundingConsumer: { total: number; allocated: number; remaining: number; status: string };
  childContributions: ChildContribution[];
  contributionBreakdown: { fund: number; donate: number; founding: number };
}

export interface BoroughStatsData extends LocationStatsData {
  highStreetContributions: ChildContribution[];
}

export interface HighStreetStatsData extends LocationStatsData {
  parentBoroughName?: string;
  parentBoroughSlug?: string;
}

export interface RollUpConfig {
  enabled: boolean;
  aggregationLevel: "realtime" | "hourly" | "daily";
  autoPromoteStatus: boolean;
  activationThreshold: number;
  rollUpRules: {
    campaignTypes: string[];
    includeDonations: boolean;
    includePledges: boolean;
    includeFounding: boolean;
  };
}

export interface RollUpPreview {
  locations: {
    id: string;
    name: string;
    currentRaised: number;
    projectedRaised: number;
    statusChange: string | null;
  }[];
  totalProjected: number;
}
