import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContributionDestination } from "./ContributionDestination";
import { McomCheckoutPanel } from "@/components/payment/McomCheckoutPanel";

interface Props {
  campaignId: string;
  campaignTitle: string;
  minAmount?: number;
  hierarchyLevel?: string | null;
  locationName?: string;
  contributionType?: "backer" | "founding_member";
  /** Reward threshold in pence, used to preselect the donation amount. */
  preselectedAmountPence?: number;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

export function DonationForm({ campaignId, campaignTitle, minAmount = 1, hierarchyLevel, locationName, contributionType, preselectedAmountPence }: Props) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState("");
  const [tributeType, setTributeType] = useState("");
  const [tributeTo, setTributeTo] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");

  // `amount` is a pounds string from the input; convert once to pence.
  const donationAmount = Math.round((parseFloat(amount) || 0) * 100);

  useEffect(() => {
    if (preselectedAmountPence == null || preselectedAmountPence <= 0) return;
    setAmount(String(preselectedAmountPence / 100));
    setCustomAmount(true);
    setShowPayment(false);
  }, [preselectedAmountPence]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (donationAmount < minAmount * 100) {
      setError(`Minimum donation is £${minAmount}`);
      return;
    }
    setError("");
    setShowPayment(true);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">Make a Donation</h2>
      <p className="mt-1 text-sm text-gray-500">to "{campaignTitle}"</p>

      <form onSubmit={handleContinue} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Preset Amounts */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Amount</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(String(preset));
                  setCustomAmount(false);
                  setShowPayment(false);
                }}
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  !customAmount && amount === String(preset)
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                £{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Or enter custom amount</label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
            <input
              type="number"
              min={minAmount}
              step="0.01"
              value={customAmount ? amount : ""}
              onChange={(e) => {
                setAmount(e.target.value);
                setCustomAmount(true);
                setShowPayment(false);
              }}
              onFocus={() => setCustomAmount(true)}
              placeholder="0"
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Anonymous */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Make my donation anonymous</span>
        </label>

        {/* Tribute (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Make this donation in honor of someone? (optional)</label>
          <select
            value={tributeType}
            onChange={(e) => setTributeType(e.target.value)}
            className="input-field mt-1.5"
          >
            <option value="">No tribute</option>
            <option value="in_honor">In Honor Of</option>
            <option value="in_memory">In Memory Of</option>
          </select>
          {tributeType && (
            <input
              type="text"
              value={tributeTo}
              onChange={(e) => setTributeTo(e.target.value)}
              placeholder="Enter name"
              className="input-field mt-2"
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Add a comment (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Leave a message..."
            rows={2}
            className="input-field mt-1.5 resize-none"
          />
        </div>

        {/* Summary */}
        {donationAmount > 0 && (
          <div className="space-y-3">
            <ContributionDestination
              campaignTitle={campaignTitle}
              hierarchyLevel={hierarchyLevel}
              locationName={locationName}
              amount={donationAmount}
              showBeforePayment={true}
            />
          </div>
        )}

        {/* Continue — the payment panel is rendered OUTSIDE this <form> (below)
            so its own Stripe <form> is never nested inside another <form>.
            A submit event on a nested form does not bubble, so React's
            onSubmit/preventDefault never runs and the browser performs a
            native submit — reloading the page and jumping back to the top. */}
        {!showPayment && (
          <button
            type="submit"
            disabled={donationAmount < minAmount * 100}
            className="btn-primary w-full"
          >
            Continue to Payment {formatCurrency(donationAmount) || "£0"}
          </button>
        )}
      </form>

      {/* Payment — single MCOM Pay path (Stripe / PayPal / MCOM Wallet) */}
      {showPayment && (
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Pay {formatCurrency(donationAmount)}
            </p>
            <button
              type="button"
              onClick={() => setShowPayment(false)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              ← Edit amount
            </button>
          </div>
          <McomCheckoutPanel
            amountPence={donationAmount}
            purpose="DONATION"
            campaignId={campaignId}
            isAnonymous={isAnonymous}
            notes={notes || undefined}
            formatGbp={formatCurrency}
            metadata={{
              campaignTitle,
              tributeType: tributeType || undefined,
              tributeTo: tributeTo || undefined,
              contributionType: contributionType || "backer",
              hierarchyLevel: hierarchyLevel || undefined,
            }}
            onSuccess={(result) => {
              navigate(
                `/thank-you?reference=${encodeURIComponent(result.reference)}&type=donation&amount=${result.amountPence}&campaign=${encodeURIComponent(campaignTitle)}&status=completed`,
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
