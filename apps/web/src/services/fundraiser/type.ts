export interface FundraiserStats {
  totalRaised?: number;
  activeCampaigns?: number;
  totalDonors?: number;
  availableBalance?: number;
  [key: string]: any;
}

export interface FundraiserCampaign {
  id: string;
  title: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  deadline?: string;
  [key: string]: any;
}

export interface FundraiserEarnings {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  currency: string;
  [key: string]: any;
}

export interface WithdrawalRecord {
  id: string;
  amount: number;
  method: string;
  status: "pending" | "approved" | "completed" | "rejected";
  requestedAt: string;
  processedAt?: string;
  accountDetails?: string;
}

export interface RequestWithdrawalInput {
  amount: number;
  method: string;
  accountDetails: string;
}
