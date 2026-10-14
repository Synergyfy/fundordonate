import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { paymentService } from "@/services/payment";

export function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const chargeId =
    searchParams.get("chargeId") ||
    sessionStorage.getItem("mcom_pending_paypal_charge");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setError("Missing PayPal payment authorization token.");
        setLoading(false);
        return;
      }

      if (!chargeId) {
        // If chargeId is missing from session, webhook settles it as a backstop
        setLoading(false);
        return;
      }

      try {
        await paymentService.confirmCharge(chargeId, { orderId: token });
        sessionStorage.removeItem("mcom_pending_paypal_charge");
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to confirm PayPal payment with Central Hub."
        );
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [token, chargeId]);

  if (loading) {
    return (
      <div className="mx-auto my-16 max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">Finalizing Payment</h2>
        <p className="mt-1 text-sm text-gray-500">
          Confirming your PayPal authorization with MCOM Central Hub…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto my-16 max-w-md rounded-2xl border border-red-200 bg-red-50/70 p-8 text-center shadow-lg">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-600" />
        <h2 className="text-lg font-bold text-red-900">Payment Confirmation Error</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <div className="mt-6">
          <Link
            to="/dashboard/campaign-centre"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
          >
            Back to Campaign Centre
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto my-16 max-w-md rounded-2xl border border-green-200 bg-white p-8 text-center shadow-xl">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
      <h2 className="text-xl font-bold text-gray-900">Payment Succeeded</h2>
      <p className="mt-2 text-sm text-gray-600">
        Your payment has been authorized via PayPal and verified by MCOM Central Hub.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          to="/dashboard/campaign-centre"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-primary-700"
        >
          Return to Campaign Centre <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/dashboard/campaigns"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          View My Campaigns
        </Link>
      </div>
    </div>
  );
}
export default PaymentReturnPage;
