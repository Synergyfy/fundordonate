import { useState } from "react";
import { Shield, LogIn } from "lucide-react";

interface PayPalSandboxFormProps {
  amount: number;
  onSubmit: () => void;
}

export function PayPalSandboxForm({ amount, onSubmit }: PayPalSandboxFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"login" | "confirm">("login");
  const [processing, setProcessing] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || !password) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(false);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    onSubmit();
  };

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-900">PayPal Sandbox — Confirm Payment</span>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Payment to</span>
            <span className="text-sm font-bold text-gray-900">FundOrDonate</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="text-lg font-bold text-gray-900">£{amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Payment method</span>
            <span className="text-sm font-bold text-blue-600">PayPal · {email}</span>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 mb-4">
            <p className="text-xs text-gray-500">By confirming, you agree to FundOrDonate's terms and authorize this payment from your PayPal account.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("login")}
            className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 rounded-lg bg-[#0070ba] px-4 py-3 text-sm font-bold text-white hover:bg-[#005ea6] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              `Confirm Payment £${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <LogIn className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-900">PayPal Sandbox — Log In</span>
        </div>
        <p className="text-xs text-blue-700">
          Use any email and password in sandbox mode.
        </p>
      </div>

      <div className="rounded-lg border-2 border-[#0070ba] p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#003087">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
          </svg>
          <span className="text-lg font-bold text-[#003087]">PayPal</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email or mobile number</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0070ba] focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
          />
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0070ba] focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
          />
        </div>

        <button
          type="submit"
          disabled={!isValidEmail || !password || processing}
          className="mt-4 w-full rounded-full bg-[#0070ba] px-6 py-3 text-sm font-bold text-white hover:bg-[#005ea6] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Logging in...
            </>
          ) : (
            "Log In"
          )}
        </button>

        <div className="mt-3 text-center">
          <a href="#" className="text-xs text-[#0070ba] hover:underline">Having trouble logging in?</a>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Sandbox mode — no real charges. Use any email/password.
      </p>
    </form>
  );
}
