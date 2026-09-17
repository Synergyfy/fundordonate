// =============================================================================
// Central Hub Solution Sign In Page
// Mock SSO flow for existing businesses.
// =============================================================================

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, CheckCircle,
  Store, Shield, Loader2,
} from "lucide-react";

type Step = "question" | "redirect" | "signin" | "success" | "returning";

export default function CentralHubSignInPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("question");
  const [isLoading, setIsLoading] = useState(false);

  const handleYes = () => {
    setStep("redirect");
  };

  const handleNo = () => {
    navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/signup`);
  };

  const handleContinueToCentralHub = () => {
    setIsLoading(true);
    setStep("signin");
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
    }, 2000);
  };

  const handleContinueToFundOrDonate = () => {
    setStep("returning");
    setTimeout(() => {
      navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/confirm`);
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

        {/* Step: Question */}
        {step === "question" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Existing Business</h1>
                <p className="text-sm text-gray-500">Sign In</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Is your business already on <span className="font-bold">Central Hub Solution</span>?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleYes}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                YES — Sign in with Central Hub Solution
              </button>
              <button
                onClick={handleNo}
                className="w-full rounded-xl border bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                NO — Register as a new business
              </button>
            </div>
          </div>
        )}

        {/* Step: Redirect */}
        {step === "redirect" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Central Hub Solution</h1>
                <p className="text-sm text-gray-500">Secure Sign In</p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <p className="text-sm text-blue-800">
                You are being redirected to <span className="font-bold">Central Hub Solution</span> to sign in. 
                After signing in, you will be returned to FundOrDonate and your business information will be connected automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Shield className="h-4 w-4 text-green-600" />
              <span>This is a secure, encrypted connection</span>
            </div>

            <button
              onClick={handleContinueToCentralHub}
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </span>
              ) : (
                "Continue to Central Hub Solution"
              )}
            </button>
          </div>
        )}

        {/* Step: Sign In (Mock) */}
        {step === "signin" && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Central Hub Solution</h1>
              <p className="text-sm text-gray-500">Mock Sign In Page</p>
            </div>

            <div className="rounded-lg bg-gray-50 border p-4 mb-6">
              <p className="text-sm text-gray-600 text-center">
                This is a mock Central Hub Solution sign in page. In production, this will be the actual SSO authentication flow.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value="business@example.com"
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
              onClick={handleContinueToFundOrDonate}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              Sign In
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
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Signed In Successfully</h1>
              <p className="text-sm text-gray-500 mb-6">
                Your Central Hub Solution account has been authenticated. Returning to FundOrDonate...
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
