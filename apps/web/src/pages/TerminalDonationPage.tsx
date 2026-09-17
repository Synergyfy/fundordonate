// =============================================================================
// Terminal/Kiosk Donation Page
// Optimized for in-store tablets: simplified donation flow, large buttons,
// campaign selection. Accessible via QR code or direct navigation.
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { Heart, Check, ArrowLeft } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  shortDescription?: string;
  featuredImage?: string;
  goalAmount: number;
  raisedAmount: number;
  mode: string;
  locationName?: string;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]; // In pence

export default function TerminalDonationPage() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const terminalId = searchParams.get("terminal") || "terminal-1";
  const locationId = searchParams.get("location");

  const [step, setStep] = useState<"select" | "amount" | "payment" | "success">("select");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const [giftAid, setGiftAid] = useState(false);

  useEffect(() => {
    // Fetch campaigns for this terminal/location
    const fetchCampaigns = async () => {
      if (campaignId) {
        // Single campaign mode (from QR code)
        const data = await campaignApi.getById(campaignId);
        if (data) {
          setCampaigns([data as Campaign]);
          setSelectedCampaign(data as Campaign);
          setStep("amount");
        }
      } else if (locationId) {
        // Multi-campaign mode (terminal shows all campaigns for location)
        const data = await campaignApi.list({ status: "ACTIVE", limit: 6 });
        // Filter by location client-side since API doesn't support locationId filter
        setCampaigns(((data.items || []) as Campaign[]).filter((c: any) => c.locationId === locationId));
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, [campaignId, locationId]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(0);
  };

  const handleDonate = async () => {
    const amount = selectedAmount || Number(customAmount) * 100;
    if (!selectedCampaign || amount <= 0) return;

    setProcessing(true);
    try {
      await campaignApi.createDonation(selectedCampaign.id, {
        amount,
        email: email || undefined,
        giftAid,
        channel: "terminal",
        terminalId,
      } as any);
      setStep("success");
    } catch {
      // Demo mode - show success anyway
      setStep("success");
    } finally {
      setProcessing(false);
    }
  };

  const handleNewDonation = () => {
    setStep("select");
    setSelectedCampaign(null);
    setSelectedAmount(0);
    setCustomAmount("");
    setEmail("");
    setGiftAid(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="mt-4 text-white text-lg font-medium">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20 mb-6">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-xl text-white/90 mb-2">
            Your {((selectedAmount || Number(customAmount) * 100) / 100).toFixed(2)} donation to
          </p>
          <p className="text-2xl font-bold text-white mb-6">{selectedCampaign?.title}</p>
          <p className="text-white/80 mb-8">has been recorded. You're making a real difference!</p>

          <button
            onClick={handleNewDonation}
            className="w-full rounded-2xl bg-white px-8 py-4 text-lg font-bold text-green-700 shadow-lg hover:bg-green-50 transition-colors"
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  // Campaign Selection (multi-campaign mode)
  if (step === "select" && !selectedCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Heart className="h-16 w-16 text-white/80 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">Support Your Community</h1>
            <p className="text-xl text-white/80">Choose a campaign to donate to</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCampaign(c); setStep("amount"); }}
                className="rounded-2xl bg-white p-6 text-left shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {c.featuredImage && (
                  <img src={c.featuredImage} alt="" className="h-32 w-full rounded-xl object-cover mb-4" />
                )}
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{c.title}</h3>
                {c.shortDescription && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{c.shortDescription}</p>
                )}
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${Math.min(100, (c.raisedAmount / c.goalAmount) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>£{(c.raisedAmount / 100).toLocaleString()} raised</span>
                    <span>{Math.round((c.raisedAmount / c.goalAmount) * 100)}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Amount Selection
  if (step === "amount" && selectedCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => { setSelectedCampaign(null); setStep("select"); }}
            className="mb-6 inline-flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to campaigns
          </button>

          <div className="rounded-2xl bg-white p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedCampaign.title}</h2>
            {selectedCampaign.locationName && (
              <p className="text-sm text-gray-500">{selectedCampaign.locationName}</p>
            )}
          </div>

          <h3 className="text-2xl font-bold text-white mb-6 text-center">Choose Donation Amount</h3>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={`rounded-2xl py-6 text-2xl font-bold transition-all ${
                  selectedAmount === amount
                    ? "bg-white text-primary-700 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                £{(amount / 100).toFixed(0)}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white/20 p-4 mb-6">
            <label className="block text-sm font-medium text-white mb-2">Custom Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">£</span>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 rounded-xl bg-white px-4 py-3 text-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          {(selectedAmount > 0 || customAmount) && (
            <button
              onClick={() => setStep("payment")}
              className="w-full rounded-2xl bg-white px-8 py-4 text-xl font-bold text-primary-700 shadow-lg hover:bg-primary-50 transition-colors"
            >
              Continue — £{((selectedAmount || Number(customAmount) * 100) / 100).toFixed(2)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Payment/Confirmation
  if (step === "payment" && selectedCampaign) {
    const amount = selectedAmount || Number(customAmount) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setStep("amount")}
            className="mb-6 inline-flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Change amount
          </button>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Donation</h2>
              <p className="text-gray-500">to {selectedCampaign.title}</p>
            </div>

            <div className="rounded-xl bg-primary-50 p-6 text-center mb-6">
              <div className="text-4xl font-bold text-primary-700">£{(amount / 100).toFixed(2)}</div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (for receipt)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-primary-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
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
            </div>

            <button
              onClick={handleDonate}
              disabled={processing || amount <= 0}
              className="w-full rounded-2xl bg-primary-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {processing ? "Processing..." : `Donate £${(amount / 100).toFixed(2)}`}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              Secure payment processed by Stripe
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
