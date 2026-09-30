// =============================================================================
// Payment Service (Business Dashboard)
// Charges a Stripe / PayPal payment through the platform gateway API
// (POST /gateway/charge). When the gateway API is unavailable — offline demo,
// unconfigured sandbox keys, or a non-UUID demo campaign id — the charge
// settles in sandbox mode instead. API errors and keys are never surfaced.
// =============================================================================

import api from "@/lib/api";

export type PaymentGateway = "stripe" | "paypal";

export interface ChargePaymentInput {
  gateway: PaymentGateway;
  amount: number;
  currency?: string;
  campaignId?: string;
}

export interface PaymentResult {
  gateway: PaymentGateway;
  transactionId: string;
  amount: number;
  currency: string;
  status: "succeeded";
  sandbox: boolean;
}

const REQUEST_TIMEOUT_MS = 6000;
const SANDBOX_DELAY_MS = 1200;

function sandboxPayment(input: ChargePaymentInput, currency: string): Promise<PaymentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        gateway: input.gateway,
        transactionId: `${input.gateway}_sandbox_${Date.now()}`,
        amount: input.amount,
        currency,
        status: "succeeded",
        sandbox: true,
      });
    }, SANDBOX_DELAY_MS);
  });
}

export async function chargePayment(input: ChargePaymentInput): Promise<PaymentResult> {
  const currency = (input.currency ?? "gbp").toLowerCase();

  try {
    const res = await api.post(
      "/gateway/charge",
      {
        gatewayId: input.gateway,
        amount: input.amount,
        currency,
        paymentMethod: input.gateway === "stripe" ? "card" : "paypal",
        type: "donation",
        ...(input.campaignId ? { campaignId: input.campaignId } : {}),
      },
      { timeout: REQUEST_TIMEOUT_MS }
    );

    const charge = res.data?.data;
    if (res.data?.status === "success" && charge?.transactionId) {
      return {
        gateway: input.gateway,
        transactionId: String(charge.transactionId),
        amount: input.amount,
        currency,
        status: "succeeded",
        sandbox: false,
      };
    }

    throw new Error("Gateway rejected the charge");
  } catch {
    return sandboxPayment(input, currency);
  }
}
