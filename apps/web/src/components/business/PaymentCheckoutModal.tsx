// =============================================================================
// Payment Checkout Modal (Business Dashboard & Campaign Funding)
// Official MCOM Pay Integration:
//   - Stripe: Official Stripe Elements SDK (<PaymentElement />) using clientSecret
//   - PayPal: Official PayPal Sandbox redirect using approvalUrl
//   - MCOM Wallet: Central Hub prepaid balance check & instant settlement
// =============================================================================

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  X,
  Coins,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  PaymentGatewaySelector,
  gatewayName,
} from "@/components/business/PaymentGatewaySelector";
import { walletApi } from "@/services/wallet";
import {
  paymentService,
  type PaymentGateway,
  type PaymentResult,
  type ChargePurpose,
} from "@/services/payment";
import { StripeElementsCheckout } from "@/components/payment/StripeElementsCheckout";
import { PayPalRedirectCheckout } from "@/components/payment/PayPalRedirectCheckout";
import {
  useWalletBalance,
  getWalletBalanceError,
} from "@/hooks/useWalletBalance";
import { useAuthStore } from "@/stores/auth.store";

const formatGbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

interface PaymentCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  amount: number;
  campaignId?: string;
  /** Charge purpose; defaults to SELF_FUNDING when a campaignId is present, else DONATION. */
  purpose?: ChargePurpose;
  onSuccess: (result: PaymentResult) => void;
}

type Step = "choose" | "details" | "processing" | "success";

function WalletPaymentForm({
  amount,
  onSubmit,
}: {
  amount: number;
  onSubmit: () => void;
}) {
  const authStatus = useAuthStore((s) => s.authStatus);
  const { data: wallet, isLoading, isError, error, refetch } = useWalletBalance();
  const balance = wallet?.availableBalance ?? 0;
  const isSufficient = Boolean(wallet) && balance >= amount;

  if (authStatus !== "authenticated") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Sign in with your MCOM account to pay from your Central Hub wallet.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-600" />
        Checking Central Hub MCOM Wallet balance…
      </div>
    );
  }

  // A failed lookup is NOT an empty wallet — never present it as "insufficient".
  if (isError || !wallet) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold">Couldn't load your MCOM wallet</p>
              <p className="mt-0.5 text-red-600">
                {isError
                  ? getWalletBalanceError(error)
                  : "No wallet balance was returned. Please try again."}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Retry balance check
        </button>
        <p className="text-center text-xs text-gray-500">
          You can still pay with a card or PayPal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-bold text-gray-900">MCOM Prepaid Balance</span>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            {balance.toFixed(2)} MCOM
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          1 MCOM Credit = £1.00 GBP. This contribution will be settled immediately from your central prepaid wallet.
        </p>
      </div>

      {!isSufficient ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold">Insufficient MCOM balance</p>
              <p className="mt-0.5 text-red-600">
                You currently have {balance.toFixed(2)} MCOM credits, but this payment requires {amount.toFixed(2)} MCOM.
              </p>
              <a
                href={walletApi.getCentralTopUpUrl()}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-bold text-red-800 underline hover:text-red-900"
              >
                Top up on Central Hub <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-bold text-white shadow hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
        >
          <Coins className="h-4 w-4" /> Pay {formatGbp(amount)} with MCOM Wallet
        </button>
      )}
    </div>
  );
}

export function PaymentCheckoutModal({
  open,
  onClose,
  title,
  amount,
  campaignId,
  purpose,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [gateway, setGateway] = useState<PaymentGateway>("stripe");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const queryClient = useQueryClient();

  const chargePurpose: ChargePurpose = purpose ?? (campaignId ? "SELF_FUNDING" : "DONATION");

  // Gateway init states from MCOM Central Hub
  const [initializingGateway, setInitializingGateway] = useState(false);
  const [stripeData, setStripeData] = useState<{
    clientSecret: string;
    chargeId: string;
    publishableKey?: string;
  } | null>(null);
  const [paypalData, setPaypalData] = useState<{
    approvalUrl: string;
    chargeId: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setStep("choose");
      setError(null);
      setResult(null);
      setStripeData(null);
      setPaypalData(null);
      setInitializingGateway(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || step === "processing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, onClose]);

  if (!open) return null;

  const handleSelectGateway = async (chosenGateway: PaymentGateway) => {
    setGateway(chosenGateway);
    setError(null);
    setStep("details");

    if (chosenGateway === "stripe") {
      setInitializingGateway(true);
      try {
        const res = await paymentService.createCharge({
          amountMinor: Math.round(amount * 100),
          method: "stripe",
          type: chargePurpose,
          campaignId,
        });

        if (res.clientSecret) {
          setStripeData({
            clientSecret: res.clientSecret,
            chargeId: res.chargeId,
            publishableKey: res.publishableKey,
          });
        } else {
          setError("Central Hub did not return a Stripe clientSecret.");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to initialize Stripe session from Central Hub."
        );
      } finally {
        setInitializingGateway(false);
      }
    } else if (chosenGateway === "paypal") {
      setInitializingGateway(true);
      try {
        const res = await paymentService.createCharge({
          amountMinor: Math.round(amount * 100),
          method: "paypal",
          type: chargePurpose,
          campaignId,
        });

        if (res.approvalUrl) {
          setPaypalData({
            approvalUrl: res.approvalUrl,
            chargeId: res.chargeId,
          });
        } else {
          setError("Central Hub did not return a PayPal approvalUrl.");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to initialize PayPal session from Central Hub."
        );
      } finally {
        setInitializingGateway(false);
      }
    }
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    if (!stripeData) return;
    setStep("processing");
    try {
      await paymentService.confirmCharge(stripeData.chargeId, {
        paymentIntentId,
      });

      const payment: PaymentResult = {
        gateway: "stripe",
        transactionId: stripeData.chargeId,
        amount,
        currency: "GBP",
        status: "succeeded",
      };
      setResult(payment);
      setStep("success");
      onSuccess(payment);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to confirm Stripe payment."
      );
      setStep("details");
    }
  };

  const handleWalletPay = async () => {
    setError(null);
    setStep("processing");
    try {
      const res = await paymentService.createCharge({
        amountMinor: Math.round(amount * 100),
        method: "wallet",
        type: chargePurpose,
        campaignId,
      });

      const payment: PaymentResult = {
        gateway: "wallet",
        transactionId: res.chargeId,
        amount,
        currency: "MCOM",
        status: "succeeded",
      };
      // The debit already happened — refresh the cached balance for the next
      // checkout instead of showing the pre-payment amount.
      await queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      setResult(payment);
      setStep("success");
      onSuccess(payment);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Wallet payment failed. Please check your balance.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setStep("details");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={() => {
        if (step !== "processing") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-lg font-extrabold text-gray-900">{formatGbp(amount)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={step === "processing"}
            aria-label="Close checkout"
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Choose how you want to pay — you will not be charged until you confirm.
              </p>
              <PaymentGatewaySelector
                value={gateway}
                onChange={handleSelectGateway}
              />
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Authenticated MCOM Pay Gateway
              </p>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setError(null);
                  setStripeData(null);
                  setPaypalData(null);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change payment gateway
              </button>
              <p className="text-sm font-bold text-gray-900">
                Paying with {gatewayName(gateway)}
              </p>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              {initializingGateway ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <span>Connecting to Central Hub {gatewayName(gateway)} service…</span>
                </div>
              ) : gateway === "stripe" ? (
                stripeData ? (
                  <StripeElementsCheckout
                    clientSecret={stripeData.clientSecret}
                    amount={amount}
                    publishableKey={stripeData.publishableKey}
                    onSuccess={handleStripeSuccess}
                    onError={(err) => setError(err)}
                  />
                ) : (
                  <div className="text-xs text-gray-500">
                    Failed to load Stripe configuration. Please retry.
                  </div>
                )
              ) : gateway === "paypal" ? (
                paypalData ? (
                  <PayPalRedirectCheckout
                    approvalUrl={paypalData.approvalUrl}
                    amount={amount}
                    chargeId={paypalData.chargeId}
                  />
                ) : (
                  <div className="text-xs text-gray-500">
                    Failed to initialize PayPal redirect. Please retry.
                  </div>
                )
              ) : (
                <WalletPaymentForm
                  amount={amount}
                  onSubmit={handleWalletPay}
                />
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <p className="text-sm font-bold text-gray-900">
                Confirming {formatGbp(amount)} with MCOM Pay…
              </p>
              <p className="text-xs text-gray-500">Please keep this window open.</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">Payment complete</p>
                <p className="text-xs text-gray-500">
                  {formatGbp(result?.amount ?? amount)} contributed via{" "}
                  {gatewayName(result?.gateway ?? gateway)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
