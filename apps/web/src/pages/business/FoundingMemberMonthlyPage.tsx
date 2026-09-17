// =============================================================================
// Founding Member Monthly Page
// Monthly contribution selection → Summary → Account (redirect) → Payment → Complete
// =============================================================================

import { useParams, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle, Calendar, Clock,
  Repeat, ExternalLink, CreditCard, Building2,
  Shield, Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import { useCountdown } from "@/hooks/useCountdown";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type Step = "select" | "summary" | "account" | "payment" | "complete";
type PaymentMethod = "stripe" | "paypal" | "cheque" | "terminal" | null;

// Admin-configured monthly contribution amounts
const MONTHLY_AMOUNTS = [10, 25, 50, 100];
const MINIMUM_AMOUNT = 1; // Default minimum, admin-configurable

// Admin-configured payment method availability
// In production, these would come from admin settings
const PAYMENT_CONFIG = {
  stripe: true,       // Enabled by default (automated)
  paypal: true,       // Enabled by default (automated)
  cheque: false,      // Disabled by default (manual, admin must enable)
  terminal: false,    // Disabled by default (manual, admin must enable)
};

// Demo business info pulled from CentralHubSolution
const DEMO_BUSINESS_INFO = {
  firstName: "James",
  lastName: "Mitchell",
  email: "james.mitchell@abcfods.co.uk",
  businessName: "ABC Foods Ltd",
  businessType: "Restaurant & Takeaway",
  address: "42 High Street, Manchester",
  postcode: "M1 1AE",
};

export default function FoundingMemberMonthlyPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const location = useLocation();
  const isConsumerContext = location.pathname.includes("/consumer/");
  const ctx = isConsumerContext ? "consumer" : "business";

  const [step, setStep] = useState<Step>("select");
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const monthlyAmount = customAmount ? Math.max(Number(customAmount), MINIMUM_AMOUNT) : selectedAmount;
  const isCustomAmountBelowMinimum = customAmount !== "" && Number(customAmount) < MINIMUM_AMOUNT;

  const handleContinueToSummary = () => {
    setStep("summary");
  };

  const handleContinueToAccount = () => {
    setStep("account");
    setIsRedirecting(true);
    // Simulate redirect to CentralHubSolution
    setTimeout(() => {
      setIsRedirecting(false);
    }, 2500);
  };

  const handleConfirmBusinessInfo = () => {
    setStep("payment");
  };

  const handlePayment = () => {
    // Simulate payment processing
    setStep("complete");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <Link
          to={`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/founding-member-choice`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {(["select", "summary", "account", "payment", "complete"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s ? "bg-purple-600 text-white" :
                  (["select", "summary", "account", "payment", "complete"].indexOf(step) > i) ? "bg-green-500 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {(["select", "summary", "account", "payment", "complete"].indexOf(step) > i) ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 4 && <div className="w-4 sm:w-6 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          {/* ═══════════════ STEP 1: SELECT AMOUNT ═══════════════ */}
          {step === "select" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 mb-3">
                  <Repeat className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">FOUNDING MEMBER MONTHLY</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Choose Your Monthly Contribution</h1>
                <p className="text-sm text-gray-500">Select how much you'd like to contribute each month</p>
              </div>

              {/* Season Context */}
              {currentSeason && (
                <div className="rounded-lg bg-gray-50 border p-3 mb-6 flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Current Season: <span className="font-bold text-gray-700">{currentSeason.name}</span></div>
                    <div className="text-xs text-gray-600 break-words">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</div>
                    {isActive && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-700 tabular-nums">
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.days}d</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.hours}h</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.minutes}m</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.seconds}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Monthly Amount Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {MONTHLY_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      selectedAmount === amount && !customAmount
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl font-bold text-gray-900">£{amount}</div>
                    <div className="text-[10px] text-gray-500">per month</div>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className={`rounded-xl border-2 p-4 mb-6 ${
                isCustomAmountBelowMinimum ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Or enter a custom amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-400">£</span>
                  <input
                    type="number"
                    min={MINIMUM_AMOUNT}
                    placeholder={`Minimum £${MINIMUM_AMOUNT}`}
                    value={customAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0) {
                        setCustomAmount(val);
                      }
                    }}
                    className="flex-1 text-lg font-bold text-gray-900 bg-transparent outline-none"
                  />
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                {isCustomAmountBelowMinimum && (
                  <p className="text-xs text-red-600 mt-2">Minimum contribution is {fmt(MINIMUM_AMOUNT)}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">Minimum contribution: {fmt(MINIMUM_AMOUNT)}</p>
              </div>

              {/* Monthly Summary Preview */}
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">Your monthly contribution</span>
                  <span className="text-xl font-bold text-purple-600">{fmt(monthlyAmount)}/mo</span>
                </div>
                <div className="text-xs text-purple-600 mt-1">Billed monthly · Cancel anytime</div>
              </div>

              <button
                onClick={handleContinueToSummary}
                disabled={monthlyAmount < MINIMUM_AMOUNT || isCustomAmountBelowMinimum}
                className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  Continue to Summary
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </>
          )}

          {/* ═══════════════ STEP 2: SUMMARY ═══════════════ */}
          {step === "summary" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Your Monthly Participation</h1>
                <p className="text-sm text-gray-500">Review your Founding Member Monthly details</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-700 uppercase">Monthly Contribution</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{fmt(monthlyAmount)}</div>
                  <div className="text-xs text-purple-600">per month · Billed monthly</div>
                </div>

                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-sm font-bold text-gray-900">Founding Member Monthly</div>
                </div>

                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Frequency</div>
                  <div className="text-sm font-bold text-gray-900">Monthly</div>
                </div>

                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Campaign</div>
                  <div className="text-sm font-bold text-gray-900">{currentSeason?.name || "Current Season"} Programme</div>
                </div>

                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">High Street</div>
                  <div className="text-sm font-bold text-gray-900">{streetName}</div>
                </div>

                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Local Area</div>
                  <div className="text-sm font-bold text-gray-900">{localAreaName}</div>
                </div>

                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">City</div>
                  <div className="text-sm font-bold text-gray-900">{cityName}</div>
                </div>
              </div>

              <button
                onClick={handleContinueToAccount}
                className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  Start Monthly Contribution
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </>
          )}

          {/* ═══════════════ STEP 3: ACCOUNT (Redirect) ═══════════════ */}
          {step === "account" && (
            <>
              {isRedirecting ? (
                /* Redirecting to CentralHubSolution */
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 mb-4">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">CentralHubSolution</span>
                  </div>
                  <Loader2 className="h-10 w-10 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Connecting to CentralHubSolution</h2>
                  <p className="text-sm text-gray-500">Redirecting to sign in / create account...</p>
                  <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 max-w-sm mx-auto">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-xs text-left text-blue-700">
                        Your credentials are handled securely by CentralHubSolution. FundOrDonate never sees your password.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Business Info Pulled from CentralHubSolution */
                <>
                  <div className="text-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Account Connected</h1>
                    <p className="text-sm text-gray-500">Your business information has been pulled from CentralHubSolution</p>
                  </div>

                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-bold text-green-700 uppercase">Business Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-green-600 uppercase">Name</div>
                        <div className="text-sm font-bold text-green-900">{DEMO_BUSINESS_INFO.firstName} {DEMO_BUSINESS_INFO.lastName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-green-600 uppercase">Email</div>
                        <div className="text-sm font-bold text-green-900">{DEMO_BUSINESS_INFO.email}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-green-600 uppercase">Business</div>
                        <div className="text-sm font-bold text-green-900">{DEMO_BUSINESS_INFO.businessName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-green-600 uppercase">Type</div>
                        <div className="text-sm font-bold text-green-900">{DEMO_BUSINESS_INFO.businessType}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[10px] text-green-600 uppercase">Address</div>
                        <div className="text-sm font-bold text-green-900">{DEMO_BUSINESS_INFO.address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6">
                    <p className="text-xs text-blue-700">
                      Please confirm this is your business information before continuing to payment.
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmBusinessInfo}
                    className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-colors"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Confirm & Continue to Payment
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </>
              )}
            </>
          )}

          {/* ═══════════════ STEP 4: PAYMENT ═══════════════ */}
          {step === "payment" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Payment Summary</h1>
                <p className="text-sm text-gray-500">Review your contribution and choose a payment method</p>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 p-5 mb-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5 text-purple-200" />
                  <span className="text-xs font-bold text-purple-200">PAYMENT SUMMARY</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-sm text-purple-200">Monthly contribution</div>
                    <div className="text-3xl font-bold">{fmt(monthlyAmount)}<span className="text-lg text-purple-200">/mo</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-200">First payment today</div>
                    <div className="text-lg font-bold">{fmt(monthlyAmount)}</div>
                  </div>
                </div>
                <div className="border-t border-white/20 pt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-purple-200">Business</div>
                    <div className="font-bold">{DEMO_BUSINESS_INFO.businessName}</div>
                  </div>
                  <div>
                    <div className="text-purple-200">Account</div>
                    <div className="font-bold">{DEMO_BUSINESS_INFO.email}</div>
                  </div>
                  <div>
                    <div className="text-purple-200">Campaign</div>
                    <div className="font-bold">{currentSeason?.name} Programme</div>
                  </div>
                  <div>
                    <div className="text-purple-200">Location</div>
                    <div className="font-bold">{streetName}, {cityName}</div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Choose payment method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Stripe / Card */}
                  {PAYMENT_CONFIG.stripe && (
                    <button
                      onClick={() => setPaymentMethod("stripe")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMethod === "stripe"
                          ? "border-blue-400 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">Card Payment</div>
                          <div className="text-[10px] text-gray-500">Stripe · Visa, Mastercard, AMEX</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* PayPal */}
                  {PAYMENT_CONFIG.paypal && (
                    <button
                      onClick={() => setPaymentMethod("paypal")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMethod === "paypal"
                          ? "border-blue-400 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-yellow-700">PP</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">PayPal</div>
                          <div className="text-[10px] text-gray-500">Pay with PayPal account</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Offline / Cheque */}
                  {PAYMENT_CONFIG.cheque && (
                    <button
                      onClick={() => setPaymentMethod("cheque")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMethod === "cheque"
                          ? "border-green-400 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-700">CH</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">Offline Payment</div>
                          <div className="text-[10px] text-gray-500">Cheque or bank transfer</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Terminal (In-Person) */}
                  {PAYMENT_CONFIG.terminal && (
                    <button
                      onClick={() => setPaymentMethod("terminal")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMethod === "terminal"
                          ? "border-purple-400 bg-purple-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-purple-700">POS</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">Terminal (In-Person)</div>
                          <div className="text-[10px] text-gray-500">Pay at a FundOrDonate terminal</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {paymentMethod === "cheque" && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-6">
                  <p className="text-xs text-green-700">
                    An invoice will be sent to {DEMO_BUSINESS_INFO.email}. Please make payment within 14 days via cheque or bank transfer.
                  </p>
                </div>
              )}

              {paymentMethod === "terminal" && (
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6">
                  <p className="text-xs text-purple-700">
                    A QR code will be generated. Scan it at any FundOrDonate terminal to complete your payment in person.
                  </p>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={!paymentMethod}
                className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {paymentMethod === "stripe" && `Pay ${fmt(monthlyAmount)} by Card`}
                  {paymentMethod === "paypal" && `Pay ${fmt(monthlyAmount)} with PayPal`}
                  {paymentMethod === "cheque" && "Submit & Send Invoice"}
                  {paymentMethod === "terminal" && "Generate Terminal QR Code"}
                  {!paymentMethod && "Select a payment method"}
                  {paymentMethod && <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
            </>
          )}

          {/* ═══════════════ STEP 5: COMPLETE ═══════════════ */}
          {step === "complete" && (
            <>
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">
                  {paymentMethod === "cheque" ? "Invoice Sent!" :
                   paymentMethod === "terminal" ? "QR Code Generated!" :
                   "Payment Successful!"}
                </h1>
                <p className="text-sm text-gray-500">
                  Your Founding Member Monthly contribution of {fmt(monthlyAmount)}/month has been set up.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-4">
                <h4 className="text-xs font-bold text-purple-900 uppercase mb-2">Your Monthly Participation</h4>
                <div className="space-y-1.5 text-sm text-purple-800">
                  <div className="flex justify-between">
                    <span>Monthly contribution:</span>
                    <span className="font-bold">{fmt(monthlyAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-bold">Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment method:</span>
                    <span className="font-bold capitalize">
                      {paymentMethod === "stripe" ? "Card" :
                       paymentMethod === "paypal" ? "PayPal" :
                       paymentMethod === "cheque" ? "Offline (Cheque)" :
                       "Terminal (In-Person)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold">Founding Member Monthly</span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                <h4 className="text-xs font-bold text-green-900 uppercase mb-2">Business Account</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div>{DEMO_BUSINESS_INFO.firstName} {DEMO_BUSINESS_INFO.lastName}</div>
                  <div>{DEMO_BUSINESS_INFO.businessName}</div>
                  <div>{DEMO_BUSINESS_INFO.email}</div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase mb-2">Connected to</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>Campaign: {currentSeason?.name} Programme</div>
                  <div>High Street: {streetName}</div>
                  <div>Local Area: {localAreaName}</div>
                  <div>City: {cityName}</div>
                </div>
              </div>

              {/* What's Next */}
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6">
                <h4 className="text-xs font-bold text-yellow-900 uppercase mb-2">What happens next?</h4>
                <ul className="space-y-1.5 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Your first payment of {fmt(monthlyAmount)} will be processed today</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>You'll be billed {fmt(monthlyAmount)} each month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime from your dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Access all Founding Member Monthly benefits immediately</span>
                  </li>
                </ul>
              </div>

              <Link
                to={`/dashboard`}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-colors"
              >
                Go to Business Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
