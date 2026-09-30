// =============================================================================
// Payment Gateway Selector (Business Dashboard)
// Stripe / PayPal choice shown above every dashboard payment action —
// required contribution, self-funding, and campaign contribution payments.
// =============================================================================

import { CreditCard, Wallet } from "lucide-react";
import type { PaymentGateway } from "@/services/payment.service";

export type { PaymentGateway };

interface Props {
  value: PaymentGateway;
  onChange: (gateway: PaymentGateway) => void;
}

const GATEWAYS: {
  id: PaymentGateway;
  label: string;
  hint: string;
  icon: typeof CreditCard;
  active: string;
}[] = [
  {
    id: "stripe",
    label: "Stripe",
    hint: "Credit / debit card",
    icon: CreditCard,
    active: "border-purple-400 bg-purple-50 text-purple-700",
  },
  {
    id: "paypal",
    label: "PayPal",
    hint: "PayPal account",
    icon: Wallet,
    active: "border-blue-400 bg-blue-50 text-blue-700",
  },
];

export function gatewayName(gateway: PaymentGateway): string {
  return gateway === "stripe" ? "Stripe" : "PayPal";
}

export function PaymentGatewaySelector({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Payment gateway
      </p>
      <div className="grid grid-cols-2 gap-2">
        {GATEWAYS.map((g) => {
          const Icon = g.icon;
          const active = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange(g.id)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                active
                  ? g.active
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">{g.label}</span>
                <span className="block text-[10px] leading-tight opacity-80">
                  {g.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
