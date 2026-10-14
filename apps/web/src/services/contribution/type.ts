export interface ContributionItem {
  id: string;
  campaign: string;
  type: "IN_STORE" | "ONLINE" | "FUNDING_SPLIT" | "SELF_FUNDING";
  amount: number;
  reference: string;
  gateway: string | null;
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
