import { useState, useMemo } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { CONFIG } from "@/lib/config";

interface StripeElementsCheckoutProps {
  clientSecret: string;
  amount: number;
  publishableKey?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (errorMessage: string) => void;
}

function StripeForm({
  amount,
  onSuccess,
  onError,
}: {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (errorMessage: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        const msg = error.message || "Payment authorization failed.";
        setErrorMessage(msg);
        onError?.(msg);
        setSubmitting(false);
      } else if (
        paymentIntent &&
        (paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing")
      ) {
        onSuccess(paymentIntent.id);
      } else {
        setErrorMessage("Payment pending authorization.");
        setSubmitting(false);
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred.";
      setErrorMessage(msg);
      onError?.(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
        <PaymentElement />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Official PCI-DSS compliant Stripe checkout · Test cards accepted</span>
      </div>

      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-bold text-white shadow hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Authorizing Payment...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay £{amount.toFixed(2)} with Card
          </>
        )}
      </button>
    </form>
  );
}

export function StripeElementsCheckout({
  clientSecret,
  amount,
  publishableKey,
  onSuccess,
  onError,
}: StripeElementsCheckoutProps) {
  const stripe = useMemo(() => {
    const key = publishableKey || CONFIG.STRIPE_PUBLISHABLE_KEY;
    return loadStripe(key);
  }, [publishableKey]);

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#4f46e5",
            borderRadius: "8px",
          },
        },
      }}
    >
      <StripeForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
