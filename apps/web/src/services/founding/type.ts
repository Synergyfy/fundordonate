export interface FoundingProgramme {
  id: string;
  locationId: string;
  locationName?: string;
  audience: "BUSINESS" | "CONSUMER";
  status: string;
  title: string;
  description?: string;
  totalAllocation: number;
  allocatedCount: number;
  remainingCount: number;
  opensAt?: string;
  closesAt?: string;
  contributionAmounts: string[];
  contributionConfig?: string;
  benefits: string[];
  isOriginal?: boolean;
}

export interface FoundingMembership {
  id: string;
  userId: string;
  programmeId: string;
  locationId: string;
  locationName?: string;
  audience: "BUSINESS" | "CONSUMER";
  status: string;
  contributionAmount: number;
  isOriginal: boolean;
  isMonthly: boolean;
  grantedAt: string;
  expiresAt?: string;
  benefits: string[];
}

export interface JoinProgrammeInput {
  programmeId: string;
  contributionAmount: number;
  isMonthly?: boolean;
  paymentMethod?: string;
}

export interface ContributorProfile {
  backerTier: string | null;
  totalCampaignsBacked: number;
  totalContributed: number;
  citiesBacked: string[];
  foundingMemberships: FoundingMembership[];
  badges: { id: string; type: string; tier?: string; locationName?: string; isOriginal?: boolean; awardedAt: string }[];
  isOriginalFoundingMember: boolean;
}
