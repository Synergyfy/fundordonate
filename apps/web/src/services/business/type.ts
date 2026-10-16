export interface DashboardStats {
  businessName: string;
  membershipTier: string;
  totalContributed: number;
  activeCampaigns: number;
  totalBackers: number;
  leaderboardRank: number;
  rewardsEarned: number;
  currentSeasonContribution: number;
}

export interface DashboardRecentCampaign {
  id: string;
  name: string;
  raised: number;
  target: number;
  status: string;
  percentage: number;
}

export interface DashboardOverviewData {
  stats: DashboardStats;
  availableTemplateTeaser: {
    id: string;
    name: string;
    tagline: string;
  } | null;
  recentCampaigns: DashboardRecentCampaign[];
}

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  category: string;
  subcategories: string[];
  description: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  membershipTier: string;
  membershipExpiry: string | null;
  preferredAudience: "consumer" | "business" | "both";
  campaignGoal: string | null;
  city: string;
  localArea: string;
  highStreet: string;
  address: string | null;
  postcode: string;
  location?: {
    id: string;
    name: string;
    slug: string;
    type: string;
  } | null;
  _count?: {
    campaigns: number;
    contributions: number;
    earnedRewards: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessProfileDto {
  name?: string;
  businessType?: string;
  registrationNumber?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  category?: string;
  subcategories?: string[];
  preferredAudience?: "consumer" | "business" | "both";
  campaignGoal?: string;
}

export interface BusinessSettings {
  id: string;
  businessId: string;
  emailAlerts: boolean;
  campaignUpdates: boolean;
  leaderboardChanges: boolean;
  rewardsEarned: boolean;
  newBackers: boolean;
  weeklyDigest: boolean;
}

export interface UpdateBusinessSettingsDto {
  emailAlerts?: boolean;
  campaignUpdates?: boolean;
  leaderboardChanges?: boolean;
  rewardsEarned?: boolean;
  newBackers?: boolean;
  weeklyDigest?: boolean;
}

export interface BusinessOnboardingDto {
  businessName: string;
  businessType: string;
  registrationNumber?: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  city: string;
  localArea: string;
  highStreet: string;
  address?: string;
  postcode: string;
  category: string;
  subcategories?: string[];
  preferredAudience?: "consumer" | "business" | "both";
  campaignGoal?: string;
  membershipTier?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  auditReference?: string;
}
