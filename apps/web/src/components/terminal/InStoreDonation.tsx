// =============================================================================
// In-Store Donation Prompt Component
// POS-facing component showing campaign choices for customer donation.
// Designed for checkout screens and receipt printers.
// =============================================================================

import { useState } from "react";
import { Heart, Check, Gift, ArrowRight } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  shortDescription?: string;
  featuredImage?: string;
  goalAmount: number;
  raisedAmount: number;
  mode: string;
}

interface InStoreDonationProps {
  /** Business ID */
  businessId: string;
  /** Business name */
  businessName: string;
  /** Location ID */
  locationId: string;
  /** Available campaigns */
  campaigns: Campaign[];
  /** Preset donation amounts (in pence) */
  presetAmounts?: number[];
  /** Whether to allow custom amount */
  allowCustomAmount?: boolean;
  /** Thank you message */
  thankYouMessage?: string;
  /** Whether to show gift aid option */
  showGiftAid?: boolean;
  /** Callback when donation is made */
  onDonation?: (campaignId: string, amount: number, giftAid: boolean) => void;
}

export function InStoreDonation({
  businessName,
  campaigns,
  presetAmounts = [100, 250, 500, 1000],
  allowCustomAmount = true,
  thankYouMessage = "Thank you for supporting your community!",
  showGiftAid = true,
  onDonation,
}: InStoreDonationProps) {
  const [step, setStep] = useState<"select" | "amount" | "confirm" | "success">("select");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [giftAid, setGiftAid] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setStep("amount");
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleDonate = async () => {
    const amount = selectedAmount || Number(customAmount) * 100;
    if (!selectedCampaign || amount <= 0) return;

    setProcessing(true);
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessing(false);
    setStep("success");

    if (onDonation) {
      onDonation(selectedCampaign.id, amount, giftAid);
    }
  };

  const handleNewDonation = () => {
    setStep("select");
    setSelectedCampaign(null);
    setSelectedAmount(0);
    setCustomAmount("");
    setGiftAid(false);
  };

  // Success Screen
  if (step === "success") {
    return (
      <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">{thankYouMessage}</h2>
        <p className="text-green-700 mb-6">
          Your £{((selectedAmount || Number(customAmount) * 100) / 100).toFixed(2)} donation to{" "}
          <strong>{selectedCampaign?.title}</strong> has been recorded.
        </p>
        <button
          onClick={handleNewDonation}
          className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"
        >
          Make Another Donation
        </button>
      </div>
    );
  }

  // Campaign Selection
  if (step === "select") {
    return (
      <div className="rounded-2xl bg-white border shadow-lg p-6">
        <div className="text-center mb-6">
          <Heart className="h-12 w-12 text-primary-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Would you like to donate?</h2>
          <p className="text-gray-600 mt-1">Support a local campaign at {businessName}</p>
        </div>

        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => handleCampaignSelect(campaign)}
              className="w-full flex items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              {campaign.featuredImage ? (
                <img src={campaign.featuredImage} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100">
                  <Heart className="h-8 w-8 text-primary-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 line-clamp-1">{campaign.title}</h3>
                {campaign.shortDescription && (
                  <p className="text-sm text-gray-500 line-clamp-1">{campaign.shortDescription}</p>
                )}
                <div className="mt-1">
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    £{(campaign.raisedAmount / 100).toLocaleString()} raised
                  </span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Amount Selection
  if (step === "amount" && selectedCampaign) {
    return (
      <div className="rounded-2xl bg-white border shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Select Amount</h2>
          <p className="text-gray-600 mt-1">Donating to {selectedCampaign.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleAmountSelect(amount)}
              className={`rounded-xl py-4 text-xl font-bold transition-all ${
                selectedAmount === amount
                  ? "bg-primary-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              £{(amount / 100).toFixed(0)}
            </button>
          ))}
        </div>

        {allowCustomAmount && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">£</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                placeholder="Enter amount"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-xl font-bold text-gray-900 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {showGiftAid && (
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 mb-6 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={giftAid}
              onChange={(e) => setGiftAid(e.target.checked)}
              className="h-5 w-5 rounded text-primary-600"
            />
            <div>
              <div className="font-medium text-gray-900">Gift Aid</div>
              <div className="text-sm text-gray-500">Add 25% at no extra cost</div>
            </div>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("select")}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setStep("confirm")}
            disabled={!selectedAmount && !customAmount}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === "confirm" && selectedCampaign) {
    const amount = selectedAmount || Number(customAmount) * 100;
    return (
      <div className="rounded-2xl bg-white border shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Confirm Donation</h2>
        </div>

        <div className="rounded-xl bg-primary-50 p-6 text-center mb-6">
          <div className="text-3xl font-bold text-primary-700">£{(amount / 100).toFixed(2)}</div>
          <div className="text-gray-600 mt-1">to {selectedCampaign.title}</div>
        </div>

        {giftAid && (
          <div className="rounded-xl bg-green-50 p-3 text-center mb-6">
            <div className="text-sm text-green-700">
              <Gift className="h-4 w-4 inline mr-1" />
              Gift Aid adds £{((amount * 0.25) / 100).toFixed(2)} at no extra cost
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("amount")}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Change Amount
          </button>
          <button
            onClick={handleDonate}
            disabled={processing}
            className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? "Processing..." : "Confirm Donation"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
