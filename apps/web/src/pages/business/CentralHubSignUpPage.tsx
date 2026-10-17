// =============================================================================
// Central Hub Solution Sign Up Page
// Redirects new businesses to Central Hub Solution (MCOM) registration.
// =============================================================================

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Building, Loader2, AlertCircle } from "lucide-react";
import { centralHubService } from "@/services/central-hub";

export default function CentralHubSignUpPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnPath = `/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/confirm`;

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await centralHubService.beginLogin(returnPath);
    } catch {
      setError(
        "We couldn't reach Central Hub Solution right now. Please try again in a moment.",
      );
      setIsLoading(false);
    }
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
            We don't build another business-registration system inside FundOrDonate — Central Hub
            Solution is the source of business information.
          </p>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-2">What happens next:</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2"><span className="font-bold">1.</span> You'll be redirected to Central Hub Solution</li>
              <li className="flex items-start gap-2"><span className="font-bold">2.</span> Register your business there</li>
              <li className="flex items-start gap-2"><span className="font-bold">3.</span> Complete business onboarding</li>
              <li className="flex items-start gap-2"><span className="font-bold">4.</span> Return to FundOrDonate with your business connected</li>
            </ol>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSignUp}
            disabled={isLoading}
            className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to Central Hub Solution…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign Up with Central Hub Solution
                <ExternalLink className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
