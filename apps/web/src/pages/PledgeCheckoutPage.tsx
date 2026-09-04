import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PledgeRewardStep } from "@/components/checkout/PledgeRewardStep";
import { PledgeDetailsStep, type PledgeDetails } from "@/components/checkout/PledgeDetailsStep";
import { DonationPersonalInfoStep, type DonorInfo } from "@/components/checkout/DonationPersonalInfoStep";
import { DonationPaymentStep, type PaymentGateway } from "@/components/checkout/DonationPaymentStep";
import { PledgeOrderSummary } from "@/components/checkout/PledgeOrderSummary";
import { campaignApi } from "@/services/campaign.service";

const STEPS = ["Reward", "Details", "Info", "Payment"];

interface Reward {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deliveryDate?: string;
  limit?: number;
  claimedCount?: number;
  status: string;
  order?: number;
  items?: string[];
}

interface Campaign {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  mode: string;
}

export function PledgeCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignSlug = searchParams.get("campaign");

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [details, setDetails] = useState<PledgeDetails>({
    amount: 0,
    bonusSupport: 0,
    shippingRequired: false,
    shippingFirstName: "",
    shippingLastName: "",
    shippingAddress1: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "United States",
    shippingPhone: "",
    coverFees: false,
    notes: "",
  });

  const [donorInfo, setDonorInfo] = useState<DonorInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [gateway, setGateway] = useState<PaymentGateway>("stripe");

  const selectedReward = rewards.find((r) => r.id === selectedRewardId) || null;

  useEffect(() => {
    if (!campaignSlug) {
      setLoading(false);
      return;
    }
    campaignApi
      .getBySlug(campaignSlug)
      .then((data: unknown) => {
        const c = data as Campaign;
        setCampaign(c);
        return campaignApi.getCampaignRewards(c.id);
      })
      .then((res: any) => setRewards(res?.data || []))
      .catch(() => setError("Campaign not found"))
      .finally(() => setLoading(false));
  }, [campaignSlug]);

  useEffect(() => {
    if (selectedReward && details.amount < selectedReward.amount) {
      setDetails((d) => ({ ...d, amount: selectedReward.amount }));
    }
  }, [selectedRewardId]);

  const canNext = () => {
    switch (currentStep) {
      case 0: return true;
      case 1:
        if (selectedReward && details.amount < selectedReward.amount) return false;
        if (details.amount <= 0) return false;
        if (details.shippingRequired) {
          return !!(details.shippingFirstName && details.shippingLastName && details.shippingAddress1 && details.shippingCity && details.shippingState && details.shippingPostalCode);
        }
        return true;
      case 2: return !!(donorInfo.firstName && donorInfo.lastName && donorInfo.email);
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!campaign) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await campaignApi.createPledge(campaign.id, {
        amount: details.amount,
        rewardId: selectedRewardId || undefined,
        bonusSupportAmount: details.bonusSupport,
        shippingCost: 0,
        notes: details.notes || undefined,
        paymentMethod: gateway,
      });
      if (gateway === "paypal") {
        window.location.href = `/payment/paypal?pledge=${result.uid}`;
      } else if (gateway === "native") {
        navigate(`/thank-you?uid=${result.uid}&type=pledge&method=offline`);
      } else {
        navigate(`/thank-you?uid=${result.uid}&type=pledge`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process pledge");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Back This Project</h1>
          {campaign && (
            <p className="mt-1 text-sm text-gray-500">
              for <span className="font-medium text-gray-700">{campaign.title}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        i < currentStep
                          ? "bg-primary-600 text-white"
                          : i === currentStep
                          ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i < currentStep ? "✓" : i + 1}
                    </div>
                    <span
                      className={`ml-1.5 text-xs font-medium hidden sm:block ${
                        i <= currentStep ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 w-6 sm:w-12 ${
                          i < currentStep ? "bg-primary-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              {currentStep === 0 && (
                <PledgeRewardStep rewards={rewards} selectedRewardId={selectedRewardId} onChange={setSelectedRewardId} />
              )}
              {currentStep === 1 && (
                <PledgeDetailsStep details={details} onChange={setDetails} selectedReward={selectedReward} />
              )}
              {currentStep === 2 && (
                <DonationPersonalInfoStep info={donorInfo} onChange={setDonorInfo} />
              )}
              {currentStep === 3 && (
                <DonationPaymentStep selected={gateway} onChange={setGateway} />
              )}

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Back
                </button>
                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                    disabled={!canNext()}
                    className="btn-primary"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !canNext()}
                    className="btn-primary"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      `Pledge £${(details.amount / 100).toFixed(2)}`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {campaign && (
                <PledgeOrderSummary
                  campaignTitle={campaign.title}
                  selectedReward={selectedReward}
                  details={details}
                  gateway={gateway}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
