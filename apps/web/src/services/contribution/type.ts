export interface ContributionBacker {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
}

export interface ContributionItem {
  id: string;
  campaignId: string;
  campaign: string;
  campaignStatus: string;
  campaignMode: string | null;
  campaignImage: string | null;
  campaignTargetAmount: number;
  campaignRaisedAmount: number;
  campaignEndDate: string | null;
  type: "IN_STORE" | "ONLINE" | "FUNDING_SPLIT" | "SELF_FUNDING";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  reference: string;
  gateway: string | null;
  backer: ContributionBacker | null;
  date: string;
  createdAt: string;
}

export interface ContributionSummary {
  totalAmount: number;
  transactionCount: number;
}

export interface PaginatedContributions {
  summary: ContributionSummary;
  items: ContributionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ContributionQueryDto {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SelfFundDto {
  amount: number;
  gateway: string;
  paymentToken: string;
}

export interface SelfFundResult {
  reference: string;
  contributed: number;
  rewardTriggered: string | null;
}
