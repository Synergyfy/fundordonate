export type PaymentMethod = "stripe" | "paypal" | "wallet";
export type PaymentGateway = "stripe" | "paypal" | "wallet";
export type ChargePurpose = "DONATION" | "PLEDGE" | "MEMBERSHIP" | "SELF_FUNDING";

export interface PaymentResult {
  gateway: PaymentGateway;
  transactionId: string;
  amount: number;
  currency: string;
  status: "succeeded";
  sandbox?: boolean;
  clientSecret?: string;
  approvalUrl?: string;
}

export interface CreateMcomChargeInput {
  amountMinor: number; // in pence (e.g. 1000 = £10.00)
  method: PaymentMethod;
  type: ChargePurpose;
  campaignId?: string;
  businessId?: string;
  membershipProgrammeId?: string;
  rewardId?: string;
  notes?: string;
  isAnonymous?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateMcomChargeResult {
  chargeId: string;
  status: "pending" | "paid" | "failed" | "refunded";
  method: PaymentMethod;
  amountMinor: string;
  feeMinor: string;
  netMinor: string;
  reference: string;
  clientSecret?: string;
  publishableKey?: string;
  approvalUrl?: string;
  contributionId?: string;
}

export interface ConfirmMcomChargeInput {
  paymentIntentId?: string;
  orderId?: string;
}
