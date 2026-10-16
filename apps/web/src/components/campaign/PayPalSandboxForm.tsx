import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { PayPalRedirectCheckout } from "@/components/payment/PayPalRedirectCheckout";
import { paymentService } from "@/services/payment";
import type { ChargePurpose } from "@/services/payment";

interface PayPalSandboxFormProps {
  amount: number;
  campaignId?: string;
  /** Payment purpose — backers/donors use DONATION/PLEDGE, owners use SELF_FUNDING. */
  type?: ChargePurpose;
  rewardId?: string;
  onSubmit?: () => void;
}

export function PayPalSandboxForm({ amount, campaignId, type = "DONATION", rewardId }: PayPalSandboxFormProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paypalData, setPaypalData] = useState<{ approvalUrl: string; chargeId: string } | null>(null);

  const initSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.createCharge({
        amountMinor: Math.round(amount * 100),
        method: "paypal",
        type,
        campaignId,
        rewardId,
      });

      if (res.approvalUrl) {
        setPaypalData({ approvalUrl: res.approvalUrl, chargeId: res.chargeId });
      } else {
        setError("Failed to obtain PayPal approvalUrl from Central Hub.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not initialize PayPal checkout session."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, [amount, campaignId, type, rewardId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span>Preparing authentic PayPal Sandbox checkout…</span>
      </div>
    );
  }

  if (error || !paypalData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-start gap-2 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error || "Unable to initialize PayPal."}</span>
        </div>
        <button
          type="button"
          onClick={initSession}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <PayPalRedirectCheckout
      approvalUrl={paypalData.approvalUrl}
      amount={amount}
    />
  );
}
