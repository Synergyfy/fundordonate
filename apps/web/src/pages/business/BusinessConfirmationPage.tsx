// =============================================================================
// Business Confirmation Page
// Shows retrieved business information from Central Hub Solution.
// =============================================================================

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle, Store, MapPin,
  Phone, Mail, Tag, FileText,
} from "lucide-react";

// Mock business data from Central Hub Solution
const MOCK_BUSINESS = {
  name: "ABC Foods Ltd",
  category: "Food & Beverage",
  description: "Artisan food producer specializing in locally sourced ingredients and sustainable packaging.",
  contactName: "John Smith",
  contactEmail: "john@abcfoods.co.uk",
  contactPhone: "+44 1234 567890",
  postcode: "M1 1AE",
  address: "42 High Street, Manchester, M1 1AE",
  logo: null,
  registrationDate: "2024-01-15",
};

export default function BusinessConfirmationPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleContinue = () => {
    setIsConfirmed(true);
    setTimeout(() => {
      navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/validate`);
    }, 1000);
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Your Business</h1>
              <p className="text-sm text-gray-500">Retrieved from Central Hub Solution</p>
            </div>
          </div>

          {/* Business Info */}
          <div className="rounded-lg bg-gray-50 border p-4 mb-6">
            <div className="flex items-start gap-4">
              {/* Logo placeholder */}
              <div className="h-16 w-16 rounded-xl bg-white border flex items-center justify-center flex-shrink-0">
                <Store className="h-8 w-8 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{MOCK_BUSINESS.name}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-600">{MOCK_BUSINESS.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Description</div>
                <div className="text-sm text-gray-900">{MOCK_BUSINESS.description}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Location</div>
                <div className="text-sm text-gray-900">{MOCK_BUSINESS.address}</div>
                <div className="text-sm text-gray-600">Postcode: {MOCK_BUSINESS.postcode}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Contact Email</div>
                <div className="text-sm text-gray-900">{MOCK_BUSINESS.contactEmail}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Contact Phone</div>
                <div className="text-sm text-gray-900">{MOCK_BUSINESS.contactPhone}</div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <p className="text-sm text-green-800">
              We've found your business information from <span className="font-bold">Central Hub Solution</span>.
              This information is authoritative and will be used to connect your business to FundOrDonate.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={isConfirmed}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isConfirmed ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirmed
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
