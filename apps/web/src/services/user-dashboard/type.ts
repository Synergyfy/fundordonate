export interface UserDashboardStats {
  totalDonated?: number;
  totalPledged?: number;
  campaignsSupported?: number;
  activeBookmarks?: number;
  [key: string]: any;
}

export interface UserDashboardProfile {
  id?: string;
  email?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  jobTitle?: string | null;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  country?: string | null;
  role?: string;
  userType?: string;
  profileType?: string | null;
  isAffiliate?: boolean;
  emailVerified?: boolean;
  membershipLevel?: string | null;
  membershipStatus?: string | null;
  profile?: Record<string, unknown> | null;
  centralHubLinked?: boolean;
  lastSsoSyncAt?: string | null;
  bio?: string;
  [key: string]: any;
}

// =============================================================================
// Outgoing contributions ("campaigns I backed")
// =============================================================================

export interface MyContributionCampaign {
  id: string;
  title: string;
  status: string;
  mode: string | null;
  category: string | null;
  imageUrl: string | null;
  targetAmount: number;
  raisedAmount: number;
  endDate: string | null;
}

export interface MyContributionBusiness {
  id: string;
  name: string;
  city: string | null;
  localArea: string | null;
  highStreet: string | null;
}

/** Reward issuance produced by this contribution, when one exists. */
export interface MyContributionReward {
  id: string;
  externalIssuanceId: string;
  title: string;
  status: string;
  code: string | null;
  value: number | null;
  expiresAt: string | null;
  issuedAt: string;
}

export interface MyContributionItem {
  id: string;
  campaignId: string;
  campaign: MyContributionCampaign;
  business: MyContributionBusiness | null;
  type: "IN_STORE" | "ONLINE" | "FUNDING_SPLIT" | "SELF_FUNDING";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amount: number;
  reference: string;
  gateway: string | null;
  createdAt: string;
  reward: MyContributionReward | null;
}

export interface MyContributionsSummary {
  totalAmount: number;
  transactionCount: number;
  campaignCount: number;
}

export interface MyContributionsPage {
  items: MyContributionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: MyContributionsSummary;
}
