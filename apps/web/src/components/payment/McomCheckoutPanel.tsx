// =============================================================================
// McomCheckoutPanel
//
// Shared, reusable payment surface for every campaign/donation/pledge entry
// point. It routes through the ONE payment implementation we already have:
// `POST /payments/charges` (MCOM Pay) with the three supported gateways —
//   - Stripe  (official Stripe Elements using the returned clientSecret)
//   - PayPal  (redirect to the returned approvalUrl)
//   - MCOM Wallet (Central Hub prepaid balance, settles immediately)
//
// Parents only supply the "what" (amount, purpose, campaignId, rewardId,
// metadata) and react to `onSuccess`. They never talk to a payment gateway
// directly, so there is a single code path for creating the Contribution and
// triggering reward issuance on the backend.
// =============================================================================

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Coins, ExternalLink, Loader2, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { paymentService } from "@/services/payment";
import type { ChargePurpose, PaymentMethod } from "@/services/payment";
import { StripeElementsCheckout } from "./StripeElementsCheckout";
import { PayPalRedirectCheckout } from "./PayPalRedirectCheckout";
import {
  useWalletBalance,
  getWalletBalanceError,
} from "@/hooks/useWalletBalance";
import { useAuthStore } from "@/stores/auth.store";

export interface McomCheckoutResult {
  chargeId: string;
  reference: string;
  method: PaymentMethod;
  amountPence: number;
  contributionId?: string | null;
}

interface McomCheckoutPanelProps {
  /** Amount in pence. */
  amountPence: number;
  purpose: ChargePurpose;
  campaignId?: string;
  businessId?: string;
  membershipProgrammeId?: string;
  /** Optional selected reward tier (stored on the contribution metadata). */
  rewardId?: string;
  isAnonymous?: boolean;
  notes?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (result: McomCheckoutResult) => void;
  /** Hide the MCOM Wallet option (e.g. anonymous/guest payers). */
  allowWallet?: boolean;
  formatGbp: (pence: number) => string;
}

type Step = "choose" | "stripe" | "paypal" | "processing";

export function McomCheckoutPanel({
  amountPence,
  purpose,
  campaignId,
  businessId,
  membershipProgrammeId,
  rewardId,
  isAnonymous,
  notes,
  description,
  metadata,
  onSuccess,
  allowWallet = true,
  formatGbp,
}: McomCheckoutPanelProps) {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeData, setStripeData] = useState<{
    clientSecret: string;
    chargeId: string;
    reference: string;
    publishableKey?: string;
  } | null>(null);
  const [paypalData, setPaypalData] = useState<{
    approvalUrl: string;
    chargeId: string;
    reference: string;
  } | null>(null);

  const { data: wallet, isLoading: walletLoading, isError: walletError, error: walletErrorObj, refetch: refetchWallet } = useWalletBalance();
  const authStatus = useAuthStore((s) => s.authStatus);
  const isAuthenticated = authStatus === "authenticated";
  const queryClient = useQueryClient();
  const walletBalance = wallet?.availableBalance ?? 0;
  const walletSufficient = Boolean(wallet) && walletBalance >= amountPence / 100;
  const canUseWallet = allowWallet && isAuthenticated && Boolean(wallet) && !walletError;

  const createCharge = async (paymentMethod: PaymentMethod) => {
    setError(null);
    setBusy(true);
    setMethod(paymentMethod);

    try {
      const res = await paymentService.createCharge({
        amountMinor: amountPence,
        method: paymentMethod,
        type: purpose,
        campaignId,
        businessId,
        membershipProgrammeId,
        rewardId,
        isAnonymous,
        notes,
        description,
        metadata,
      });

      if (paymentMethod === "stripe") {
        if (!res.clientSecret) {
          setError("Central Hub did not return a Stripe clientSecret. Please retry.");
          return;
        }
        setStripeData({
          clientSecret: res.clientSecret,
          chargeId: res.chargeId,
          reference: res.reference,
          publishableKey: res.publishableKey,
        });
        setStep("stripe");
      } else if (paymentMethod === "paypal") {
        if (!res.approvalUrl) {
          setError("Central Hub did not return a PayPal approvalUrl. Please retry.");
          return;
        }
        setPaypalData({
          approvalUrl: res.approvalUrl,
          chargeId: res.chargeId,
          reference: res.reference,
        });
        setStep("paypal");
      } else {
        // MCOM Wallet settles synchronously; the backend already activated the
        // contribution (and queued reward issuance) when status === "paid".
        if (res.status === "paid") {
          setStep("processing");
          // Refresh the cached balance now that the wallet has been debited.
          await queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
          onSuccess({
            chargeId: res.chargeId,
            reference: res.reference,
            method: "wallet",
            amountPence,
            contributionId: res.contributionId ?? null,
          });
        } else {
          setError(
            "MCOM Wallet payment did not settle. Check your Central Hub balance and try again.",
          );
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ??
        (err as Error)?.message ??
        "Could not initialize payment with MCOM Central Hub.";
      setError(Array.isArray(message) ? message.join(", ") : String(message));
    } finally {
      setBusy(false);
    }
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    if (!stripeData) return;
    setStep("processing");
    try {
      await paymentService.confirmCharge(stripeData.chargeId, { paymentIntentId });
      onSuccess({
        chargeId: stripeData.chargeId,
        reference: stripeData.reference,
        method: "stripe",
        amountPence,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Could not confirm the card payment with Central Hub.";
      setError(String(message));
      setStep("stripe");
    }
  };

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm font-bold text-gray-900">
          Confirming {formatGbp(amountPence)} with MCOM Pay…
        </p>
        <p className="text-xs text-gray-500">Please keep this window open.</p>
      </div>
    );
  }

  if (step === "stripe" && stripeData) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setStep("choose");
            setStripeData(null);
            setError(null);
          }}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          ← Change payment method
        </button>
        <StripeElementsCheckout
          clientSecret={stripeData.clientSecret}
          amount={amountPence / 100}
          publishableKey={stripeData.publishableKey}
          onSuccess={handleStripeSuccess}
          onError={(msg) => setError(msg)}
        />
      </div>
    );
  }

  if (step === "paypal" && paypalData) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setStep("choose");
            setPaypalData(null);
          }}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          ← Change payment method
        </button>
        <PayPalRedirectCheckout
          approvalUrl={paypalData.approvalUrl}
          amount={amountPence / 100}
          chargeId={paypalData.chargeId}
        />
      </div>
    );
  }

  const methods: {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: typeof CreditCard;
    disabled?: boolean;
    hint?: string;
  }[] = [
    {
      id: "stripe",
      name: "Credit / Debit Card",
      description: "Secured by Stripe",
      icon: CreditCard,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Redirect to PayPal to authorize",
      icon: ExternalLink,
    },
    ...(allowWallet
      ? [
          {
            id: "wallet" as PaymentMethod,
            name: "MCOM Wallet",
            description: walletLoading
              ? "Checking balance…"
              : walletError
                ? "Balance unavailable"
                : !isAuthenticated
                  ? "Sign in with MCOM to spend credits"
                  : walletSufficient
                    ? `Balance ${walletBalance.toFixed(2)} MCOM`
                    : `Insufficient balance (${walletBalance.toFixed(2)} MCOM)`,
            icon: Coins,
            disabled: !canUseWallet || !walletSufficient,
            hint: walletLoading
              ? undefined
              : walletError
                ? "We couldn't check your MCOM wallet. Retry the balance check above."
                : !isAuthenticated
                  ? "Sign in with MCOM Central Hub to pay from your wallet."
                  : walletSufficient
                    ? undefined
                    : "Top up your Central Hub wallet to pay with MCOM credits.",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
        Authenticated MCOM Pay gateway · you are only charged when you confirm.
      </p>

      {allowWallet && isAuthenticated && walletError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold">Couldn't load your MCOM wallet balance</p>
            <p className="mt-0.5">{getWalletBalanceError(walletErrorObj)}</p>
            <button
              type="button"
              onClick={() => refetchWallet()}
              className="mt-2 inline-flex items-center gap-1 font-bold text-amber-900 underline hover:text-amber-950"
            >
              <RefreshCw className="h-3 w-3" /> Retry balance check
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {methods.map((m) => {
          const Icon = m.icon;
          const selected = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={busy || m.disabled}
              onClick={() => createCharge(m.id)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                selected && step !== "choose"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-primary-100" : "bg-gray-100"}`}>
                {busy && method === m.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                ) : (
                  <Icon className={`h-5 w-5 ${selected ? "text-primary-600" : "text-gray-500"}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.description}</p>
                {m.hint && <p className="mt-0.5 text-[11px] text-amber-600">{m.hint}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default McomCheckoutPanel;
