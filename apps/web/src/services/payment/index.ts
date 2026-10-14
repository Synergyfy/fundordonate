import api from "../api";
import type {
  ChargePurpose,
  ConfirmMcomChargeInput,
  CreateMcomChargeInput,
  CreateMcomChargeResult,
  PaymentGateway,
  PaymentResult,
} from "./type";

export const paymentService = {
  /**
   * Create a charge on MCOM Pay (Stripe, PayPal, or MCOM Wallet).
   */
  async createCharge(input: CreateMcomChargeInput): Promise<CreateMcomChargeResult> {
    const res: any = await api.post("/payments/charges", input);
    return res?.data ?? res;
  },

  /**
   * Confirm an MCOM Pay charge after front-end Stripe/PayPal processing.
   */
  async confirmCharge(
    chargeId: string,
    handle?: ConfirmMcomChargeInput,
  ): Promise<{ charge: any }> {
    const res: any = await api.post(`/payments/charges/${encodeURIComponent(chargeId)}/confirm`, handle ?? {});
    return res?.data ?? res;
  },
};

export const paymentApi = paymentService;

// Legacy fallback support for existing callers of chargePayment
export async function chargePayment(input: {
  gateway: PaymentGateway;
  amount: number;
  currency?: string;
  campaignId?: string;
  type?: ChargePurpose;
}): Promise<PaymentResult> {
  const chargeType: ChargePurpose = input.type || (input.campaignId ? "SELF_FUNDING" : "DONATION");
  const result = await paymentService.createCharge({
    amountMinor: Math.round(input.amount * 100),
    method: input.gateway,
    type: chargeType,
    campaignId: input.campaignId,
  });

  return {
    gateway: input.gateway,
    transactionId: result.chargeId,
    amount: input.amount,
    currency: "gbp",
    status: "succeeded",
    sandbox: false,
    clientSecret: result.clientSecret,
    approvalUrl: result.approvalUrl,
  };
}

export default paymentService;
export type * from "./type";
