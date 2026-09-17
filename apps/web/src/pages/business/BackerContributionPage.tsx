// =============================================================================
// Backer Contribution Page
// Flow: Amount → Payment Method → Review → Complete
// =============================================================================

import { useParams, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import {
  ArrowLeft, ArrowRight, CheckCircle, Target,
  Clock, CreditCard, Calendar, CreditCard as PaypalIcon,
  Building2, MonitorSmartphone, Shield,
} from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import type { DemoCampaign } from "@/data/demo";
import { getDemoCampaignsForLocation, HUB_LOCATIONS } from "@/data/hubActivation";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type Step = "amount" | "payment" | "review" | "processing" | "complete";
type PaymentMethod = "stripe" | "paypal" | "offline" | "terminal" | null;

const CONTRIBUTION_AMOUNTS = [25, 50, 100, 250, 500];

const PAYMENT_METHODS = [
  {
    id: "stripe" as const,
    name: "Pay by Card (Stripe)",
    description: "Secure card payment powered by Stripe",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
  },
  {
    id: "paypal" as const,
    name: "PayPal",
    description: "Pay securely with your PayPal account",
    icon: PaypalIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
  },
  {
    id: "offline" as const,
    name: "Offline Payment",
    description: "Pay by cheque or bank transfer",
    icon: Building2,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverBorder: "hover:border-orange-400",
  },
  {
    id: "terminal" as const,
    name: "Pay at Terminal",
    description: "Pay at a participating business near you",
    icon: MonitorSmartphone,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-400",
  },
];

export default function BackerContributionPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsumerContext = location.pathname.includes("/consumer/");
  const ctx = isConsumerContext ? "consumer" : "business";
  const [searchParams] = useSearchParams();
  const campaignSlugFromUrl = searchParams.get("campaign");
  const campaignFromState = (location.state as { campaign?: DemoCampaign })?.campaign ?? null;

  const mapLoc = useMemo(
    () => HUB_LOCATIONS.find(l => l.slug === citySlug) ?? null,
    [citySlug],
  );

  const campaigns = useMemo(() => {
    if (!mapLoc) return [];
    return getDemoCampaignsForLocation(mapLoc);
  }, [mapLoc]);

  const campaign = useMemo(() => {
    if (campaignFromState) return campaignFromState;
    if (campaignSlugFromUrl) return campaigns.find(c => c.slug === campaignSlugFromUrl) ?? null;
    return null;
  }, [campaignFromState, campaignSlugFromUrl, campaigns]);

  const [step, setStep] = useState<Step>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
  const platformFee = Math.round(finalAmount * 0.05 * 100) / 100;
  const totalAmount = finalAmount + platformFee;

  const handleBack = () => {
    if (step === "payment") setStep("amount");
    else if (step === "review") setStep("payment");
    else if (step === "amount") {
      navigate(`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/participation?campaign=${campaign?.slug || ""}`, {
        state: campaign ? { campaign } : undefined,
      });
    }
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep("review");
  };

  const handlePay = () => {
    setStep("processing");
    // Simulate payment processing
    setTimeout(() => {
      setStep("complete");
    }, 2500);
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No campaign selected.</p>
          <Link
            to={`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}`}
            className="text-blue-600 hover:underline"
          >
            Back to High Street
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        {step !== "processing" && step !== "complete" && (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === "payment" ? "Back to Amount" : step === "review" ? "Back to Payment" : "Back to Participation"}
          </button>
        )}

        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {(["amount", "payment", "review", "complete"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s || step === "processing" ? "bg-blue-600 text-white" :
                  (["amount", "payment", "review", "complete"].indexOf(step) > i) ? "bg-green-500 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {(["amount", "payment", "review", "complete"].indexOf(step) > i) ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && <div className="w-6 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          {/* ═══════════════ CAMPAIGN INFO ═══════════════ */}
          <div className="rounded-lg bg-gray-50 border p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{campaign.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{campaign.category?.name} · {campaign.mode}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {fmt(campaign.raisedAmount)} of {fmt(campaign.goalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ STEP 1: AMOUNT ═══════════════ */}
          {step === "amount" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Contribution Options</h1>
                <p className="text-sm text-gray-500">Choose how much you'd like to contribute</p>
              </div>

              {/* Season Banner */}
              {currentSeason && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">Current Season: {currentSeason.name}</span>
                  </div>
                  <div className="text-xs text-blue-700 mb-2">
                    {fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}
                  </div>
                  {isActive && countdown && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-blue-700">
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 mb-6">
                {CONTRIBUTION_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                    className={`rounded-xl border-2 px-3 py-4 text-center transition-all ${
                      selectedAmount === amt && !customAmount
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className={`text-lg font-bold ${selectedAmount === amt && !customAmount ? "text-blue-600" : "text-gray-900"}`}>
                      £{amt}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Or enter a custom amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">£</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-8 pr-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Minimum contribution is £1</p>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-gray-50 border p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Contribution</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(finalAmount)}</span>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep("payment")}
                disabled={!finalAmount || finalAmount < 1}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* ═══════════════ STEP 2: PAYMENT METHOD ═══════════════ */}
          {step === "payment" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Payment Method</h1>
                <p className="text-sm text-gray-500">Choose how you'd like to pay</p>
              </div>

              {/* Amount Reminder */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6 text-center">
                <p className="text-xs text-blue-600 mb-1">Your contribution</p>
                <p className="text-2xl font-bold text-blue-900">{fmt(finalAmount)}</p>
              </div>

              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentSelect(method.id)}
                      className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${method.borderColor} ${method.hoverBorder} hover:shadow-md`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${method.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ═══════════════ STEP 3: REVIEW ═══════════════ */}
          {step === "review" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Review & Pay</h1>
                <p className="text-sm text-gray-500">Review your contribution and complete payment</p>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl border-2 border-gray-200 p-5 mb-6">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Payment Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Campaign</span>
                    <span className="text-sm font-bold text-gray-900 text-right max-w-[60%] truncate">{campaign.title}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Contribution</span>
                    <span className="text-sm font-bold text-gray-900">{fmt(finalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Platform Fee (5%)</span>
                    <span className="text-sm font-bold text-gray-900">{fmt(platformFee)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">{fmt(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Display */}
              <div className="rounded-xl border-2 border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-3">
                  {PAYMENT_METHODS.find(m => m.id === paymentMethod) && (() => {
                    const method = PAYMENT_METHODS.find(m => m.id === paymentMethod)!;
                    const Icon = method.icon;
                    return (
                      <>
                        <div className={`w-10 h-10 rounded-lg ${method.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${method.color}`} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{method.name}</div>
                          <div className="text-xs text-gray-500">Selected payment method</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Offline Payment Instructions */}
              {paymentMethod === "offline" && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-5 mb-6">
                  <h3 className="font-bold text-orange-900 text-sm mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Offline Payment Instructions
                  </h3>
                  <div className="space-y-3 text-sm text-orange-800">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <span>Offline donation is only payable by <strong>cheque</strong> or <strong>bank transfer</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <span>Make cheques payable to: <strong>247 Global Business Solutions Ltd</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">3.</span>
                      <div>
                        <span>Bank: <strong>Barclays Bank</strong></span>
                        <br />
                        <span>Sort Code: <strong>20-45-67</strong></span>
                        <br />
                        <span>Account No: <strong>73849251</strong></span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">4.</span>
                      <span>Reference: Use your name and campaign name as reference.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">5.</span>
                      <span>Post cheques to: <strong>247 Global Business Solutions Ltd, Unit 4, Imperial Business Centre, 151 Semaphore Road, London, SE15 3TR</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">6.</span>
                      <span>Payment must be received within <strong>14 days</strong> of your pledge. Your Backer status will be confirmed once payment is received and verified.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal Payment Instructions */}
              {paymentMethod === "terminal" && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-5 mb-6">
                  <h3 className="font-bold text-green-900 text-sm mb-3 flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4" />
                    Terminal Payment Instructions
                  </h3>
                  <div className="space-y-3 text-sm text-green-800">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-green-600">1.</span>
                      <span>Terminal payments are made at <strong>participating businesses</strong> on your local high street.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-green-600">2.</span>
                      <span>Look for businesses displaying the <strong>FundOrDonate Terminal</strong> sticker in their window.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-green-600">3.</span>
                      <span>Visit the business and tell them you'd like to make a <strong>Backer contribution</strong> for the campaign: <strong>{campaign.title}</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-green-600">4.</span>
                      <span>The business will process your payment on their terminal. You can pay by <strong>card</strong> or <strong>contactless</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-green-600">5.</span>
                      <span>You'll receive a <strong>digital receipt</strong> via email confirming your contribution.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-green-600">6.</span>
                      <span>Your Backer status and rewards will be activated within <strong>24 hours</strong> of the terminal transaction being processed.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Demo Notice */}
              {paymentMethod === "paypal" && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">Demo PayPal Integration</p>
                      <p>In production, you'll be redirected to PayPal to complete payment securely. This is a demo simulation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stripe Demo Notice */}
              {paymentMethod === "stripe" && (
                <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="text-sm text-purple-800">
                      <p className="font-bold mb-1">Demo Stripe Integration</p>
                      <p>In production, you'll see a secure card form powered by Stripe. This is a demo simulation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure payment · Encrypted transaction</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("payment")}
                  className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Change Method
                </button>
                <button
                  onClick={handlePay}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Pay {fmt(totalAmount)}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* ═══════════════ PROCESSING ═══════════════ */}
          {step === "processing" && (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Processing Payment...</h2>
              <p className="text-sm text-gray-500">Please wait while we process your {fmt(totalAmount)} contribution.</p>
              <p className="text-xs text-gray-400 mt-2">Do not close this page.</p>
            </div>
          )}

          {/* ═══════════════ STEP 4: COMPLETE ═══════════════ */}
          {step === "complete" && (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Contribution Complete!</h1>
              <p className="text-sm text-gray-500 mb-6">
                Thank you for backing <span className="font-bold text-gray-900">{campaign.title}</span>
              </p>

              {/* Receipt */}
              <div className="rounded-xl border-2 border-gray-200 p-5 mb-6 text-left">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Payment Receipt</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Campaign</span>
                    <span className="font-bold text-gray-900 text-right max-w-[55%] truncate">{campaign.title}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-bold text-gray-900">{fmt(finalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-bold text-gray-900">{fmt(platformFee)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="font-bold text-blue-600">{fmt(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-bold text-gray-900 capitalize">{paymentMethod === "offline" ? "Offline (Cheque/Bank Transfer)" : paymentMethod === "terminal" ? "Terminal" : paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-600">Status</span>
                    <span className="font-bold text-green-600">{paymentMethod === "offline" ? "Pending (Awaiting Payment)" : "Confirmed"}</span>
                  </div>
                </div>
              </div>

              {/* Backer Benefits */}
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 text-left">
                <h3 className="font-bold text-green-900 text-sm mb-3">Your Backer Benefits</h3>
                <ul className="space-y-2">
                  {[
                    "Backer status confirmed on this campaign",
                    "Recognition on the campaign page",
                    "Access to backer-only updates",
                    "Leaderboard points awarded",
                    "Community recognition badge",
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-green-700">
                      <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Offline Notice */}
              {paymentMethod === "offline" && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 mb-6 text-left">
                  <p className="text-xs text-orange-800">
                    <strong>Important:</strong> Your Backer status is pending until we receive and verify your offline payment. Please make your payment within 14 days using the instructions provided.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  to={`/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}/campaign/${campaign.slug}`}
                  className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  View Campaign
                </Link>
                <Link
                  to={`/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}`}
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors text-center"
                >
                  Back to High Street
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
