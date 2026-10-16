import { useState } from "react";
import { ExternalLink, ShieldCheck, Lock } from "lucide-react";

interface PayPalRedirectCheckoutProps {
  approvalUrl: string;
  amount: number;
  chargeId?: string;
}

export function PayPalRedirectCheckout({
  approvalUrl,
  amount,
  chargeId,
}: PayPalRedirectCheckoutProps) {
  const [redirecting, setRedirecting] = useState(false);

  const handleRedirect = () => {
    setRedirecting(true);
    if (chargeId) {
      sessionStorage.setItem("mcom_pending_paypal_charge", chargeId);
    }
    window.location.href = approvalUrl;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#003087">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
          </svg>
          <span className="text-sm font-bold text-blue-900">Official PayPal Gateway</span>
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          You will be redirected directly to PayPal to authorize{" "}
          <strong>£{amount.toFixed(2)}</strong>. In Sandbox mode, log in with your
          PayPal Sandbox buyer test account on the real PayPal portal.
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-xs text-gray-600 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
        <span>Authentic PayPal portal redirect — no credentials are ever handled on FundOrDonate.</span>
      </div>

      <button
        type="button"
        onClick={handleRedirect}
        disabled={redirecting}
        className="w-full rounded-xl bg-[#0070ba] py-3.5 text-sm font-bold text-white shadow hover:bg-[#005ea6] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {redirecting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Redirecting to PayPal Sandbox...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Continue to PayPal Sandbox
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
