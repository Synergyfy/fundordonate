// =============================================================================
// Central Hub Solution Sign Up Page
// Mock registration flow for new businesses.
// =============================================================================

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, CheckCircle,
  Store, Loader2, Building,
} from "lucide-react";

type Step = "intro" | "redirect" | "register" | "onboarding" | "success" | "returning";

export default function CentralHubSignUpPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinueToCentralHub = () => {
    setIsLoading(true);
    setStep("redirect");
    setTimeout(() => {
      setIsLoading(false);
      setStep("register");
    }, 2000);
  };

  const handleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("onboarding");
    }, 1500);
  };

  const handleCompleteOnboarding = () => {
    setStep("success");
    setTimeout(() => {
      setStep("returning");
      setTimeout(() => {
        navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/confirm`);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Step: Intro */}
        {step === "intro" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">New Business</h1>
                <p className="text-sm text-gray-500">Sign Up Through Central Hub Solution</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Register your business through <span className="font-bold">Central Hub Solution</span>. 
              We don't build another business-registration system inside FundOrDonate — Central Hub Solution is the source of business information.
            </p>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-2">What happens next:</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  You'll be redirected to Central Hub Solution
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  Register your business there
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  Complete business onboarding
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  Return to FundOrDonate with your business connected
                </li>
              </ol>
            </div>

            <button
              onClick={handleContinueToCentralHub}
              disabled={isLoading}
              className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </span>
              ) : (
                "Sign Up with Central Hub Solution"
              )}
            </button>
          </div>
        )}

        {/* Step: Redirect */}
        {step === "redirect" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Redirecting to Central Hub Solution</h1>
              <p className="text-sm text-gray-500 mb-6">
                You are being redirected to register your business.
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Register (Mock) */}
        {step === "register" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Central Hub Solution</h1>
              <p className="text-sm text-gray-500">Mock Registration Page</p>
            </div>

            <div className="rounded-lg bg-gray-50 border p-4 mb-6">
              <p className="text-sm text-gray-600 text-center">
                This is a mock Central Hub Solution registration page. In production, this will be the actual registration flow.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value="ABC Foods Ltd"
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value="contact@abcfoods.co.uk"
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value="••••••••"
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors"
            >
              Register Business
            </button>
          </div>
        )}

        {/* Step: Onboarding (Mock) */}
        {step === "onboarding" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Business Onboarding</h1>
              <p className="text-sm text-gray-500">Complete your business profile</p>
            </div>

            <div className="rounded-lg bg-gray-50 border p-4 mb-6">
              <p className="text-sm text-gray-600 text-center">
                This is a mock onboarding page. In production, you'll complete your business profile here.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
                <input
                  type="text"
                  value="Food & Beverage"
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input
                  type="text"
                  value="M1 1AE"
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleCompleteOnboarding}
              className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors"
            >
              Complete Registration
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Registration Complete</h1>
              <p className="text-sm text-gray-500 mb-6">
                Your business has been registered on Central Hub Solution. Returning to FundOrDonate...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Returning */}
        {step === "returning" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Returning to FundOrDonate</h1>
              <p className="text-sm text-gray-500">
                Connecting your business information...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
