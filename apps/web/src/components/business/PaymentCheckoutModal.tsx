// =============================================================================
// Payment Checkout Modal (Business Dashboard)
// Post-click checkout popup: the Pay / Fund button opens this window — the
// Stripe / PayPal choice only appears here (never before the click), then the
// chosen gateway's card / account form, then the charge runs through the
// payment service (gateway API with sandbox fallback).
// =============================================================================

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, X } from "lucide-react";
import {
  PaymentGatewaySelector,
  gatewayName,
} from "@/components/business/PaymentGatewaySelector";
import {
  chargePayment,
  type PaymentGateway,
  type PaymentResult,
} from "@/services/payment.service";
import { StripeSandboxForm } from "@/components/campaign/StripeSandboxForm";
import { PayPalSandboxForm } from "@/components/campaign/PayPalSandboxForm";
import { formatGbp } from "@/data/businessCampaignAccess";

interface PaymentCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  amount: number;
  campaignId?: string;
  onSuccess: (result: PaymentResult) => void;
}

type Step = "choose" | "details" | "processing" | "success";

export function PaymentCheckoutModal({
  open,
  onClose,
  title,
  amount,
  campaignId,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [gateway, setGateway] = useState<PaymentGateway>("stripe");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    if (open) {
      setStep("choose");
      setError(null);
      setResult(null);
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

  const handlePay = async () => {
    setError(null);
    setStep("processing");
    try {
      const payment = await chargePayment({ gateway, amount, campaignId });
      setResult(payment);
      setStep("success");
      onSuccess(payment);
    } catch {
      setError("Payment could not be completed. Please try again.");
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
                onChange={(g) => {
                  setGateway(g);
                  setStep("details");
                }}
              />
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Secured checkout · sandbox mode — no real charges
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
                }}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change payment gateway
              </button>
              <p className="text-sm font-bold text-gray-900">Paying with {gatewayName(gateway)}</p>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}
              {gateway === "stripe" ? (
                <StripeSandboxForm amount={amount} onSubmit={handlePay} />
              ) : (
                <PayPalSandboxForm amount={amount} onSubmit={handlePay} />
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
              <p className="text-sm font-bold text-gray-900">
                Charging {formatGbp(amount)} via {gatewayName(gateway)}…
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
                  {formatGbp(result?.amount ?? amount)} paid via{" "}
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
