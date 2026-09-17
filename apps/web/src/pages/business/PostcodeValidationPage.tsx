// =============================================================================
// Postcode Validation Page
// Validates business postcode against selected high street.
// Shows match/mismatch screens with clear decisions.
// =============================================================================

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle, AlertTriangle,
  MapPin, Store, Building, ExternalLink,
  ArrowDown,
} from "lucide-react";

// Mock data - in production this would come from API
const MOCK_BUSINESS_POSTCODE: string = "M2 3AA"; // Different from high street
const MOCK_HIGH_STREET_POSTCODE: string = "M1 1AE";

export default function PostcodeValidationPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [showMismatchOptions, setShowMismatchOptions] = useState(false);

  const postcodesMatch = MOCK_BUSINESS_POSTCODE === MOCK_HIGH_STREET_POSTCODE;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const handleContinue = () => {
    if (postcodesMatch) {
      // Match — go to success
      navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/confirm-location`);
    } else {
      // Mismatch — show options
      setShowMismatchOptions(true);
    }
  };

  const handleJoinAnyway = () => {
    navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/confirm-location`);
  };

  const handleChangePostcode = () => {
    alert("You would be redirected to Central Hub Solution to update your business postcode.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/confirm`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* ═══════════════ MATCH SCREEN ═══════════════ */}
        {!showMismatchOptions && postcodesMatch && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Location Matched</h1>
                <p className="text-sm text-gray-500">Your business belongs to this high street</p>
              </div>
            </div>

            {/* Business vs High Street */}
            <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Business Postcode</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{MOCK_BUSINESS_POSTCODE}</div>
                <div className="text-xs text-gray-500">ABC Foods Ltd</div>
              </div>
              <div className="rounded-lg bg-gray-50 border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Selected High Street</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{streetName}</div>
                <div className="text-xs text-gray-500">Postcode: {MOCK_HIGH_STREET_POSTCODE}</div>
              </div>
            </div>

            {/* Success Message */}
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900">Your business location matches this High Street.</h3>
                  <p className="text-sm text-green-700 mt-1">
                    The system has confirmed that your business is located within the postcode range of {streetName}.
                  </p>
                </div>
              </div>
            </div>

            {/* Hierarchy Chain */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <h4 className="text-sm font-bold text-blue-900 mb-3">Your business will be connected to:</h4>
              <div className="flex flex-col items-center gap-1">
                {[
                  { label: "Business", sub: "ABC Foods Ltd", icon: Store, color: "text-blue-600 bg-blue-100" },
                  { label: "High Street", sub: streetName, icon: Building, color: "text-purple-600 bg-purple-100" },
                  { label: "Local Area", sub: localAreaName, icon: MapPin, color: "text-orange-600 bg-orange-100" },
                  { label: "City", sub: cityName, icon: MapPin, color: "text-green-600 bg-green-100" },
                  { label: "National Hub", sub: "United Kingdom", icon: Building, color: "text-gray-600 bg-gray-100" },
                ].map((item, i) => (
                  <div key={item.label} className="w-full max-w-xs">
                    <div className={`flex items-center gap-3 rounded-lg p-3 ${item.color.split(" ")[1]}`}>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color.split(" ").slice(0, 2).join(" ")}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500">{item.label}</div>
                        <div className="text-sm font-bold text-gray-900">{item.sub}</div>
                      </div>
                    </div>
                    {i < 4 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                Confirm & Connect
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        )}

        {/* ═══════════════ MISMATCH — INITIAL ═══════════════ */}
        {!showMismatchOptions && !postcodesMatch && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Postcode Mismatch</h1>
                <p className="text-sm text-gray-500">Your business postcode doesn't match this high street</p>
              </div>
            </div>

            {/* Business vs High Street */}
            <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Business Postcode</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{MOCK_BUSINESS_POSTCODE}</div>
                <div className="text-xs text-gray-500">ABC Foods Ltd</div>
              </div>
              <div className="rounded-lg bg-gray-50 border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Selected High Street</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{streetName}</div>
                <div className="text-xs text-gray-500">Postcode: {MOCK_HIGH_STREET_POSTCODE}</div>
              </div>
            </div>

            {/* Explanation */}
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-900">Your business postcode doesn't match this High Street.</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your business appears to be located in a different area based on the postcode supplied through Central Hub Solution.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Please review your options below. The source of truth for your business information remains Central Hub Solution.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              View Options
            </button>
          </div>
        )}

        {/* ═══════════════ MISMATCH — DECISION OPTIONS ═══════════════ */}
        {showMismatchOptions && (
          <div className="rounded-xl bg-white border p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Choose an Option</h1>
                <p className="text-sm text-gray-500">Your business postcode doesn't match this high street</p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 border p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Business Postcode</div>
                  <div className="font-bold text-gray-900">{MOCK_BUSINESS_POSTCODE}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">High Street</div>
                  <div className="font-bold text-gray-900">{streetName}</div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {/* Option A */}
              <button
                onClick={handleJoinAnyway}
                className="w-full rounded-xl border-2 border-blue-200 bg-white p-5 text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-gray-900">Option A — I want to join this High Street</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Confirm that you intentionally want to participate in {streetName}, even though your business postcode is in a different area.
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 mt-1 flex-shrink-0" />
                </div>
              </button>

              {/* Option B */}
              <button
                onClick={handleChangePostcode}
                className="w-full rounded-xl border-2 border-orange-200 bg-white p-5 text-left hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-gray-900">Option B — Change my business postcode</div>
                    <p className="text-sm text-gray-600 mt-1">
                      If the postcode was entered incorrectly, you can correct it through Central Hub Solution. FundOrDonate cannot overwrite authoritative business information.
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 mt-1 flex-shrink-0" />
                </div>
              </button>
            </div>

            {/* Back */}
            <button
              onClick={() => setShowMismatchOptions(false)}
              className="w-full rounded-xl border bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
