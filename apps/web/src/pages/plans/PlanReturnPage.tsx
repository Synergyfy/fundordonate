// =============================================================================
// Plan payment return
// Handles the PayPal redirect back from MCOM Pay and confirms the plan order.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { planService } from "@/services/plans";
import { useAuthStore } from "@/stores/auth.store";

export default function PlanReturnPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const providerOrderId = params.get("token") ?? params.get("orderId") ?? undefined;
  const [status, setStatus] = useState<"checking" | "paid" | "failed">("checking");
  const [message, setMessage] = useState<string>("Confirming your payment…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      if (!orderId) {
        setStatus("failed");
        setMessage("No plan order was supplied in the return link.");
        return;
      }
      try {
        await planService.confirmOrder(orderId, { orderId: providerOrderId });
        await useAuthStore.getState().loadUser();
        setStatus("paid");
        setMessage("Your payment is confirmed and your access is active.");
      } catch {
        // The webhook may already have settled it; check the order list.
        try {
          const mine = await planService.getMine();
          const order = mine.orders.find((o) => o.id === orderId);
          if (order?.status === "PAID") {
            await useAuthStore.getState().loadUser();
            setStatus("paid");
            setMessage("Your payment is confirmed and your access is active.");
            return;
          }
          setStatus("failed");
          setMessage(
            "We could not confirm the payment yet. If you were charged, it will appear in My access shortly.",
          );
        } catch (err: any) {
          setStatus("failed");
          setMessage(err?.message ?? "We could not confirm your payment.");
        }
      }
    };

    run();
  }, [orderId, providerOrderId]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        {status === "checking" && (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />
        )}
        {status === "paid" && (
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        )}
        {status === "failed" && (
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        )}
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {status === "checking"
            ? "Confirming payment"
            : status === "paid"
              ? "Payment complete"
              : "Payment not confirmed"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/plans"
            className="rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700"
          >
            Go to plans
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
