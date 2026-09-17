import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { PaymentMethodSelector, type PaymentMethodType } from "./PaymentMethodSelector";
import { ContributionDestination } from "./ContributionDestination";

interface Props {
  campaignId: string;
  campaignTitle: string;
  minAmount?: number;
  hierarchyLevel?: string | null;
  locationName?: string;
  contributionType?: "backer" | "founding_member";
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

export function DonationForm({ campaignId, campaignTitle, minAmount = 1, hierarchyLevel, locationName, contributionType }: Props) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("stripe");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState("");
  const [tributeType, setTributeType] = useState("");
  const [tributeTo, setTributeTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const donationAmount = (parseInt(amount) || 0) * 100; // Convert to minor units (cents)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (donationAmount < minAmount) {
      setError(`Minimum donation is £${minAmount}`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await campaignApi.createDonation(campaignId, {
        amount: donationAmount,
        paymentMethod,
        isAnonymous,
        notes: notes || undefined,
        tributeType: tributeType || undefined,
        tributeTo: tributeTo || undefined,
        contributionType: contributionType || "backer",
        hierarchyLevel: hierarchyLevel || undefined,
      } as any);
      navigate(`/thank-you?uid=${result.uid}&type=donation`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">Make a Donation</h2>
      <p className="mt-1 text-sm text-gray-500">to "{campaignTitle}"</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                }}
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  !customAmount && donationAmount === preset
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
              value={customAmount ? amount : ""}
              onChange={(e) => {
                setAmount(e.target.value);
                setCustomAmount(true);
              }}
              onFocus={() => setCustomAmount(true)}
              placeholder="0"
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Payment Method */}
        <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || donationAmount < minAmount}
          className="btn-primary w-full"
        >
          {loading ? "Processing..." : `Donate ${formatCurrency(donationAmount) || "£0"}`}
        </button>
      </form>
    </div>
  );
}
