import { useState } from "react";
import { Coins, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useAuthStore } from "@/stores/auth.store";
import { walletApi } from "@/services/wallet";

export type PaymentGateway = "wallet" | "stripe" | "paypal" | "native";

interface Props {
  selected: PaymentGateway;
  onChange: (gateway: PaymentGateway) => void;
  amountPence?: number; // Donation/pledge amount in pence for wallet balance verification
}

export function DonationPaymentStep({ selected, onChange, amountPence = 0 }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { data: wallet, isLoading: walletLoading } = useWalletBalance();
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

  const amountPounds = amountPence > 0 ? amountPence / 100 : 0;
  // 1 MCOM credit equals £1.00
  const hasSufficientWalletBalance =
    wallet && wallet.status === "ACTIVE" && wallet.availableBalance >= amountPounds;

  const topUpUrl = walletApi.getCentralTopUpUrl();

  const GATEWAYS: Array<{
    id: PaymentGateway;
    name: string;
    description: string;
    badge?: string;
    icon: string;
    disabled?: boolean;
  }> = [
    {
      id: "wallet",
      name: "MCOM Wallet",
      description: wallet
        ? `Prepaid balance: ${wallet.availableBalance.toFixed(2)} MCOM available`
        : isAuthenticated
          ? "Pay instantly with MCOM credits"
          : "Sign in with MCOM to spend credits",
      badge: "Instant / Zero Fees",
      icon: "🪙",
    },
    {
      id: "stripe",
      name: "Credit / Debit Card",
      description: "Visa, Mastercard, Amex via MCOM Pay",
      icon: "💳",
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Pay with PayPal account via MCOM Pay",
      icon: "🅿️",
    },
    {
      id: "native",
      name: "Bank Transfer",
      description: "Direct transfer (manual verification)",
      icon: "🏦",
    },
  ];

  return (
    <div className="space-y-5 text-left">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
        <p className="mt-1 text-sm text-gray-500">
          All payments are processed securely through MCOM Central Solutions
        </p>
      </div>

      <div className="space-y-2.5">
        {GATEWAYS.map((gateway) => (
          <label
            key={gateway.id}
            className={`flex cursor-pointer items-center gap-3.5 rounded-xl border-2 p-3.5 transition-all ${
              selected === gateway.id
                ? "border-primary-500 bg-primary-50/60 shadow-xs"
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
            <span className="text-xl flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              {gateway.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{gateway.name}</span>
                {gateway.badge && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {gateway.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{gateway.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* MCOM Wallet Details / Shortfall Box */}
      {selected === "wallet" && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-bold text-gray-900">MCOM Central Balance</span>
            </div>
            {walletLoading ? (
              <span className="text-xs text-gray-400">Checking balance...</span>
            ) : wallet ? (
              <span className="text-sm font-extrabold text-amber-900">
                {wallet.availableBalance.toFixed(2)} MCOM
              </span>
            ) : (
              <span className="text-xs text-red-500">Not linked</span>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="rounded-lg bg-white/80 p-3 text-xs text-gray-600 flex items-start gap-2 border border-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Please sign in with your MCOM account to use your central wallet balance.
              </span>
            </div>
          ) : wallet && !hasSufficientWalletBalance && amountPounds > 0 ? (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 flex flex-col gap-2 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Insufficient wallet balance.</span> You have{" "}
                  {wallet.availableBalance.toFixed(2)} MCOM, but this payment requires £
                  {amountPounds.toFixed(2)} ({amountPounds.toFixed(2)} MCOM).
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={topUpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-primary-700 hover:text-primary-800 underline"
                >
                  Top up wallet in MCOM Central <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-gray-400">or choose Card/PayPal above</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Funds will be settled instantly from your central wallet balance upon clicking Complete.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stripe Card Form */}
      {selected === "stripe" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-2xs">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Expiry
              </label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                CVC
              </label>
              <input
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").substring(0, 4))}
                placeholder="123"
                maxLength={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {selected === "paypal" && (
        <div className="rounded-xl bg-blue-50/70 border border-blue-200 px-4 py-3 text-xs text-blue-800">
          You'll be directed to PayPal to approve your charge via MCOM Pay, then returned back here immediately.
        </div>
      )}

      {selected === "native" && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 border border-amber-200">
          After submitting, you'll receive bank transfer reference details. Your contribution will be verified within 1-3 business days.
        </div>
      )}

      <p className="text-xs text-gray-400">
        Transactions are secured and recorded in the MCOM double-entry ledger.
      </p>
    </div>
  );
}
