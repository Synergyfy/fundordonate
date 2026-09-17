// =============================================================================
// Business Join Success Page
// Welcome message — Business is now established in FundOrDonate.
// =============================================================================

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  CheckCircle, Store, ArrowRight, ArrowDown, Building, MapPin,
  Flag, Globe, User, Trophy, Gift, Sparkles,
} from "lucide-react";

export default function BusinessJoinSuccessPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [isProceeding, setIsProceeding] = useState(false);

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const handleContinueToSeason = () => {
    setIsProceeding(true);
    setTimeout(() => {
      navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/season`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">
              Welcome to the {cityName} Business Community.
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              Your business is now officially established in FundOrDonate and connected to the hub network.
            </p>
          </div>

          {/* Full Hierarchy */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <h4 className="text-xs font-bold text-blue-900 uppercase mb-3">Your connection hierarchy</h4>
            <div className="flex flex-col items-center gap-0">
              {[
                { label: "Business Owner", sub: "John Smith", icon: User, color: "bg-indigo-100 text-indigo-600" },
                { label: "Business", sub: "ABC Foods Ltd", icon: Store, color: "bg-blue-100 text-blue-600" },
                { label: "High Street", sub: streetName, icon: Building, color: "bg-purple-100 text-purple-600" },
                { label: "Local Area", sub: localAreaName, icon: MapPin, color: "bg-green-100 text-green-600" },
                { label: "City Hub", sub: cityName, icon: Flag, color: "bg-orange-100 text-orange-600" },
                { label: "National Hub", sub: "United Kingdom", icon: Globe, color: "bg-gray-100 text-gray-600" },
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
                    {i === 0 && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        YOU
                      </span>
                    )}
                  </div>
                  {i < 5 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-blue-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What's Next */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <h3 className="font-bold text-green-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>We now move to the current operating season</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You'll see seasonal campaigns, objectives, and opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Your participation will contribute to your city hub's goals</span>
              </li>
            </ul>
          </div>

          {/* Rewards Preview */}
          <div className="grid gap-3 mb-6 sm:grid-cols-3">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-center">
              <Trophy className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-yellow-900">Rewards</div>
              <div className="text-[10px] text-yellow-700">Available this season</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center">
              <Gift className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-purple-900">Founding Member</div>
              <div className="text-[10px] text-purple-700">Early access benefits</div>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
              <Sparkles className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-blue-900">Leaderboards</div>
              <div className="text-[10px] text-blue-700">Rank your business</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleContinueToSeason}
            disabled={isProceeding}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isProceeding ? (
              <span className="flex items-center justify-center gap-2">
                Loading season...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue to Current Season
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
