// =============================================================================
// Business Add Page
// Business owner adds a new business to the platform.
// =============================================================================

import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

type FormData = {
  businessName: string;
  category: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
};

const BUSINESS_CATEGORIES = [
  "Retail",
  "Food & Groceries",
  "Restaurant",
  "Café & Food",
  "Bar & Drinks",
  "Health & Fitness",
  "Health & Pharmacy",
  "Health & Dental",
  "Hair & Beauty",
  "Fashion & Clothing",
  "Electronics",
  "Books & Stationery",
  "Art & Culture",
  "Co-working",
  "Office & Business",
  "Hospitality",
  "Sports & Leisure",
  "Antiques & Collectables",
  "Music & Entertainment",
  "Convenience Store",
  "Automotive",
  "Home & Garden",
  "Professional Services",
  "Education & Training",
  "Other",
];

export default function BusinessAddPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<"info" | "confirm">("info");
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    category: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    logoUrl: "",
  });

  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("confirm");
  };

  const handleConfirm = () => {
    navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/claimed/new`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link to={`/business/${citySlug}`} className="hover:text-white transition-colors">
              {cityName} Business Hub
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/business/${citySlug}/local-area/${localAreaSlug}`} className="hover:text-white transition-colors">
              {localAreaName}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`} className="hover:text-white transition-colors">
              {streetName}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Add Business</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Add your business</h1>
          <p className="mt-2 text-blue-200 max-w-2xl">
            Add your business to the platform and start participating in your local community.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Location Info */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <MapPin className="h-4 w-4" />
            <span className="font-bold">Location:</span>
            <span>{cityName}</span>
            <ChevronRight className="h-4 w-4 text-blue-400" />
            <span>{localAreaName}</span>
            <ChevronRight className="h-4 w-4 text-blue-400" />
            <span>{streetName}</span>
          </div>
          <p className="mt-1 text-xs text-blue-600">
            This location will be pre-filled based on your selection. You can change it if needed.
          </p>
        </div>

        {step === "info" && (
          <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm border">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Business Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Smith's Bakery"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Business Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Describe your business..."
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-bold text-gray-900 mb-3">Contact Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="john@business.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="07700 900000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-bold text-gray-900 mb-3">Business Image/Logo</h4>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a URL to your business logo or image.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link
                to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`}
                className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                Review & Confirm <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Business Details</h3>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-bold text-gray-900 text-sm mb-2">Business Information</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-500">Name:</dt>
                  <dd className="font-medium text-gray-900">{formData.businessName}</dd>
                  <dt className="text-gray-500">Category:</dt>
                  <dd className="font-medium text-gray-900">{formData.category}</dd>
                  <dt className="text-gray-500">Description:</dt>
                  <dd className="font-medium text-gray-900 col-span-2">{formData.description}</dd>
                </dl>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-bold text-gray-900 text-sm mb-2">Contact Information</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-500">Name:</dt>
                  <dd className="font-medium text-gray-900">{formData.contactName}</dd>
                  <dt className="text-gray-500">Email:</dt>
                  <dd className="font-medium text-gray-900">{formData.contactEmail}</dd>
                  {formData.contactPhone && (
                    <>
                      <dt className="text-gray-500">Phone:</dt>
                      <dd className="font-medium text-gray-900">{formData.contactPhone}</dd>
                    </>
                  )}
                  {formData.website && (
                    <>
                      <dt className="text-gray-500">Website:</dt>
                      <dd className="font-medium text-gray-900">{formData.website}</dd>
                    </>
                  )}
                </dl>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-bold text-gray-900 text-sm mb-2">Location</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{cityName} → {localAreaName} → {streetName}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep("info")}
                className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" /> Edit Details
              </button>
              <button
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                <CheckCircle className="h-4 w-4" /> Confirm & Create Business
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
