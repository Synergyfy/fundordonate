export interface McomWalletBalance {
  success: boolean;
  balance: number;
  availableBalance: number;
  status: "ACTIVE" | "FROZEN" | "SUSPENDED" | "CLOSED";
  currency: "MCOM";
}

export interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalFees: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
  byCampaign: any[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  description?: string;
  [key: string]: any;
}
