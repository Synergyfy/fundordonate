// =============================================================================
// High Street Confirmation Page
// Confirm your High Street association before being connected.
// =============================================================================

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle, Store, MapPin,
  Building, Flag, Globe, ArrowDown,
} from "lucide-react";

const MOCK_BUSINESS = {
  name: "ABC Foods Ltd",
  postcode: "M1 1AE",
};

export default function HighStreetConfirmPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const handleConfirm = () => {
    setIsConfirmed(true);
    setTimeout(() => {
      navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/success`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <Link
          to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/validate`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Confirm High Street</h1>
              <p className="text-sm text-gray-500">Review and confirm your association</p>
            </div>
          </div>

          {/* Confirmation Details */}
          <div className="space-y-3 mb-6">
            {[
              { label: "Business", value: MOCK_BUSINESS.name, icon: Store, color: "text-blue-600" },
              { label: "High Street", value: streetName, icon: Building, color: "text-purple-600" },
              { label: "Local Area", value: localAreaName, icon: MapPin, color: "text-green-600" },
              { label: "City", value: cityName, icon: Flag, color: "text-orange-600" },
              { label: "Country", value: "United Kingdom", icon: Globe, color: "text-gray-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg bg-gray-50 border p-3">
                <div className={`h-8 w-8 rounded-lg bg-white border flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-medium text-gray-400 uppercase">{item.label}</div>
                  <div className="text-sm font-bold text-gray-900">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Hierarchy */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <h4 className="text-xs font-bold text-blue-900 uppercase mb-3">Your connection path</h4>
            <div className="flex flex-col items-center gap-0">
              {[
                { label: "Business", sub: MOCK_BUSINESS.name, icon: Store, color: "bg-blue-100 text-blue-600" },
                { label: "High Street", sub: streetName, icon: Building, color: "bg-purple-100 text-purple-600" },
                { label: "Local Area", sub: localAreaName, icon: MapPin, color: "bg-green-100 text-green-600" },
                { label: "City", sub: cityName, icon: Flag, color: "bg-orange-100 text-orange-600" },
                { label: "Country", sub: "United Kingdom", icon: Globe, color: "bg-gray-100 text-gray-600" },
              ].map((item, i) => (
                <div key={item.label} className="w-full">
                  <div className="flex items-center gap-3 rounded-lg bg-white border p-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-400">{item.label}</div>
                      <div className="text-sm font-bold text-gray-900 truncate">{item.sub}</div>
                    </div>
                  </div>
                  {i < 4 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-blue-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <p className="text-sm text-green-800">
              By confirming, your business <span className="font-bold">{MOCK_BUSINESS.name}</span> will be officially connected to{" "}
              <span className="font-bold">{streetName}</span> in FundOrDonate.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleConfirm}
            disabled={isConfirmed}
            className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            {isConfirmed ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirming...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Confirm & Continue
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
