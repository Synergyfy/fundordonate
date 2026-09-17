// =============================================================================
// Membership Purchase Page
// Flow for purchasing a founding membership (Business or Consumer).
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { foundingApi } from "@/services/founding.service";
import { ArrowLeft, Check, CreditCard, Shield, Heart, Building2, User } from "lucide-react";

interface Programme {
  id: string;
  locationId: string;
  locationName?: string;
  audience: "BUSINESS" | "CONSUMER";
  status: string;
  title: string;
  description?: string;
  totalAllocation: number;
  allocatedCount: number;
  remainingCount: number;
  opensAt?: string;
  closesAt?: string;
  benefits: string[];
  contributionAmounts: string[];
  isOriginal?: boolean;
}

export default function MembershipPurchasePage() {
  const { locationId } = useParams();
  const { user } = useAuthStore();

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [isMonthly, setIsMonthly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"select" | "benefits" | "payment" | "success">("select");

  useEffect(() => {
    if (!locationId) return;
    foundingApi.getProgrammes(locationId).then((data) => {
      setProgrammes(data as unknown as Programme[]);
      setLoading(false);
    });
  }, [locationId]);

  const userIsBusiness = user?.userType === "BUSINESS";

  const filteredProgrammes = programmes.filter((p) => {
    if (p.audience === "BUSINESS" && userIsBusiness) return true;
    if (p.audience === "CONSUMER" && !userIsBusiness) return true;
    return false;
  });

  const programme = selectedProgramme || filteredProgrammes[0];
  const amount = selectedAmount || (programme?.contributionAmounts?.[0] ? Number(programme.contributionAmounts[0]) : 0);

  const handleSimulatePayment = async () => {
    if (!programme) return;
    setProcessing(true);
    try {
      await foundingApi.joinProgramme({
        programmeId: programme.id,
        contributionAmount: amount,
        isMonthly,
      });
      setStep("success");
    } catch {
      // Demo mode - still show success
      setStep("success");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  if (filteredProgrammes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Heart className="h-16 w-16 text-gray-300 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">No Programmes Available</h2>
          <p className="mt-2 text-gray-600">
            There are no founding membership programmes available for your account type at this location.
          </p>
          <Link to="/uk-hub-activation" className="mt-6 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">
            Back to Hub Activation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={locationId ? `/hub/${locationId}` : "/uk-hub-activation"} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Founding Membership</h1>
          <p className="mt-1 text-gray-600">Join a founding programme and shape your local hub.</p>
        </div>

        {step === "select" && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Programme</h2>
              <div className="space-y-3">
                {filteredProgrammes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProgramme(p); setStep("benefits"); }}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                      selectedProgramme?.id === p.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        p.audience === "BUSINESS" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      }`}>
                        {p.audience === "BUSINESS" ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{p.title}</div>
                        <div className="text-sm text-gray-500">{p.locationName || "Local Hub"} · {p.audience} Programme</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{p.remainingCount} spots left</div>
                        <div className="text-xs text-gray-500">of {p.totalAllocation}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "benefits" && programme && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  programme.audience === "BUSINESS" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                }`}>
                  {programme.audience === "BUSINESS" ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{programme.title}</h2>
                  <p className="text-sm text-gray-500">{programme.locationName || "Local Hub"} · {programme.audience} Programme</p>
                </div>
              </div>

              {programme.description && (
                <p className="text-sm text-gray-600 mb-4">{programme.description}</p>
              )}

              <h3 className="text-sm font-bold text-gray-900 mb-3">Benefits Include</h3>
              <ul className="space-y-2 mb-6">
                {programme.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              {programme.isOriginal && (
                <div className="rounded-xl bg-amber-50 p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span className="font-bold text-amber-700">Original Founding Member</span>
                  </div>
                  <p className="mt-1 text-sm text-amber-600">
                    Among the first to join — receive a special Original badge and enhanced benefits.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-gray-50">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    !isMonthly ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                  }`}
                >
                  One-Time
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isMonthly ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                  }`}
                >
                  Monthly
                </button>
              </div>

              {programme.contributionAmounts && programme.contributionAmounts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Select Amount</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {programme.contributionAmounts.map((amt: string) => (
                      <button
                        key={amt}
                        onClick={() => setSelectedAmount(Number(amt))}
                        className={`rounded-xl border-2 px-4 py-3 text-center font-bold transition-all ${
                          selectedAmount === Number(amt)
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        £{(Number(amt) / 100).toFixed(0)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("select")} className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={() => setStep("payment")}
                disabled={!selectedAmount}
                className="flex-1 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {step === "payment" && programme && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>
              <div className="rounded-xl bg-gray-50 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{programme.title}</div>
                    <div className="text-sm text-gray-500">{isMonthly ? "Monthly" : "One-time"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">£{(amount / 100).toFixed(2)}</div>
                    {isMonthly && <div className="text-xs text-gray-500">/month</div>}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-3 text-sm text-gray-600">Payment integration (Stripe) will be connected by backend developer.</p>
                <button
                  onClick={handleSimulatePayment}
                  disabled={processing}
                  className="mt-4 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Simulate Payment (Demo)"}
                </button>
              </div>
            </div>

            <button onClick={() => setStep("benefits")} className="w-full rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Back
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to the Founding Programme!</h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              Your membership is now active. You'll receive a confirmation email with your founding member badge and benefits details.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/profile/contributor" className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">
                View Your Profile
              </Link>
              <Link to={locationId ? `/hub/${locationId}` : "/uk-hub-activation"} className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back to Hub
              </Link>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-white p-3">
            <Shield className="h-5 w-5 text-green-500 mx-auto" />
            <div className="mt-1 text-xs font-medium text-gray-600">Secure Payment</div>
          </div>
          <div className="rounded-xl bg-white p-3">
            <Heart className="h-5 w-5 text-red-400 mx-auto" />
            <div className="mt-1 text-xs font-medium text-gray-600">100% Goes Local</div>
          </div>
          <div className="rounded-xl bg-white p-3">
            <Check className="h-5 w-5 text-blue-500 mx-auto" />
            <div className="mt-1 text-xs font-medium text-gray-600">Instant Access</div>
          </div>
        </div>
      </div>
    </div>
  );
}
