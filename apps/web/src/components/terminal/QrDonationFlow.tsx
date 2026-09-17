// =============================================================================
// QR → Terminal Donation Flow
// When user scans a QR code, this component handles the flow to terminal.
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { Heart, Smartphone, MapPin, ArrowRight, Check } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  shortDescription?: string;
  featuredImage?: string;
  goalAmount: number;
  raisedAmount: number;
  mode: string;
  locationName?: string;
  locationId?: string;
}

export function QrDonationFlow() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"loading" | "campaign" | "terminal" | "redirecting">("loading");

  useEffect(() => {
    if (!campaignId) {
      navigate("/campaigns");
      return;
    }

    campaignApi.getById(campaignId).then((data: any) => {
      if (data) {
        setCampaign(data as Campaign);
        setStep("campaign");
      }
      setLoading(false);
    });
  }, [campaignId, navigate]);

  const handleGoToTerminal = () => {
    setStep("redirecting");
    // Redirect to terminal-optimized page
    setTimeout(() => {
      navigate(`/terminal/${campaignId}?channel=qr`);
    }, 1500);
  };

  if (loading || step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Heart className="h-16 w-16 text-gray-300 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Campaign Not Found</h2>
          <p className="mt-2 text-gray-600">This QR code may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  // Redirecting screen
  if (step === "redirecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Smartphone className="h-16 w-16 text-white mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Opening Terminal...</h2>
          <p className="text-white/80">Please complete your donation on the terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="mx-auto max-w-md">
        {/* Campaign Info Card */}
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden mb-6">
          {campaign.featuredImage && (
            <img
              src={campaign.featuredImage}
              alt={campaign.title}
              className="h-48 w-full object-cover"
            />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
            {campaign.shortDescription && (
              <p className="text-gray-600 mb-4">{campaign.shortDescription}</p>
            )}
            {campaign.locationName && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <MapPin className="h-4 w-4" />
                {campaign.locationName}
              </div>
            )}
            <div className="mb-4">
              <div className="h-3 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="font-bold text-gray-900">£{(campaign.raisedAmount / 100).toLocaleString()} raised</span>
                <span className="text-gray-500">of £{(campaign.goalAmount / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="rounded-2xl bg-white shadow-lg p-6">
          <div className="text-center mb-6">
            <Smartphone className="h-12 w-12 text-primary-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Donate via Terminal</h2>
            <p className="text-gray-600 mt-1">
              Complete your donation on the in-store terminal for a quick, secure payment.
            </p>
          </div>

          <button
            onClick={handleGoToTerminal}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-primary-700 transition-colors"
          >
            Continue to Terminal
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              Secure, contactless payment
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              Instant receipt via email
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              Gift Aid available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
