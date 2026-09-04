import { useState } from "react";

export type PaymentGateway = "stripe" | "paypal" | "native";

interface Props {
  selected: PaymentGateway;
  onChange: (gateway: PaymentGateway) => void;
}

const GATEWAYS: Array<{
  id: PaymentGateway;
  name: string;
  description: string;
  icon: string;
}> = [
  {
    id: "stripe",
    name: "Credit / Debit Card",
    description: "Visa, Mastercard, Amex",
    icon: "💳",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Pay with PayPal account or card",
    icon: "🅿️",
  },
  {
    id: "native",
    name: "Bank Transfer",
    description: "Direct transfer (manual verification)",
    icon: "🏦",
  },
];

export function DonationPaymentStep({ selected, onChange }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").substring(0, 16);
    return v.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "").substring(0, 4);
    if (v.length >= 2) return v.substring(0, 2) + "/" + v.substring(2);
    return v;
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
        <p className="mt-1 text-sm text-gray-500">Choose how you'd like to pay</p>
      </div>

      <div className="space-y-2.5">
        {GATEWAYS.map((gateway) => (
          <label
            key={gateway.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3.5 transition-all ${
              selected === gateway.id
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="paymentGateway"
              value={gateway.id}
              checked={selected === gateway.id}
              onChange={() => onChange(gateway.id)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-lg">{gateway.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">{gateway.name}</span>
              <p className="text-xs text-gray-500 truncate">{gateway.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Stripe Card Form */}
      {selected === "stripe" && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="input-field font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Expiry</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CVC</label>
              <input
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").substring(0, 4))}
                placeholder="123"
                maxLength={4}
                className="input-field font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {selected === "paypal" && (
        <div className="rounded-lg bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-700">
            You'll be redirected to PayPal to complete your donation securely.
          </p>
        </div>
      )}

      {selected === "native" && (
        <div className="rounded-lg bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-700">
            After submitting, you'll receive bank transfer details. Your donation will be verified within 1-3 business days.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Your payment is secure and encrypted. We never store your card details.
      </p>
    </div>
  );
}
