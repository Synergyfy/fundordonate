// =============================================================================
// Business Claim Page
// Business owner claims an existing business.
// =============================================================================

import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import {
  Store, MapPin, ChevronRight, Clock, CheckCircle, AlertCircle,
  ArrowRight, ArrowLeft, Loader2,
} from "lucide-react";

type ClaimStatus = "form" | "pending" | "verified";

const RELATIONSHIP_OPTIONS = [
  { value: "owner", label: "Owner", description: "I own this business" },
  { value: "director", label: "Director", description: "I am a director of this business" },
  { value: "manager", label: "Manager", description: "I manage this business" },
  { value: "authorised", label: "Authorised Representative", description: "I am authorised to represent this business" },
];

export default function BusinessClaimPage() {
  const { citySlug, localAreaSlug, highStreetSlug, businessId } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
    businessId: string;
  }>();
  const navigate = useNavigate();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("form");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    relationship: "",
    verificationNotes: "",
  });

  const { data: business, isLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      try {
        const res = await adminApi.getBusiness(businessId);
        if (!res) return null;
        return {
          id: res.id,
          name: res.name,
          category: res.category || "Business",
          location: res.address || res.highStreet || `${res.city || "UK"}`,
          status: (res.status || "").toLowerCase() === "active" ? "participating" : "available",
        };
      } catch {
        return null;
      }
    },
    enabled: Boolean(businessId),
  });

  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimStatus("pending");
  };

  const handleConfirm = () => {
    navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/claimed/${businessId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Loading business information...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-2 text-lg font-bold text-gray-900">Business not found</h2>
          <Link to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`} className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-500">
            <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link to={`/business/${citySlug}`} className="hover:text-white transition-colors">
              {citySlug?.charAt(0).toUpperCase() + (citySlug?.slice(1) || "")} Business Hub
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
            <span className="text-white">Claim Business</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Claim this business</h1>
          <p className="mt-2 text-blue-200 max-w-2xl">
            Confirm that you own or represent this business.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Business Info Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Store className="h-4 w-4" /> {business.category}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {business.location}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Manchester → {localAreaName} → {streetName}
              </div>
            </div>
          </div>
        </div>

        {/* Claim Status */}
        {claimStatus === "form" && (
          <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm border">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="07700 900000"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Relationship to Business *</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        formData.relationship === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="relationship"
                        value={opt.value}
                        checked={formData.relationship === opt.value}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        className="mt-0.5"
                        required
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Verification Notes</label>
                <textarea
                  value={formData.verificationNotes}
                  onChange={(e) => setFormData({ ...formData, verificationNotes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Any additional information to help verify your claim..."
                />
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
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {claimStatus === "pending" && (
          <div className="rounded-xl bg-white p-6 shadow-sm border text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Pending Verification</h3>
            <p className="mt-2 text-gray-500">
              Your claim request has been submitted. Our team will verify your relationship with this business.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-left">
              <h4 className="font-bold text-gray-900 text-sm mb-2">What happens next?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Your claim request has been submitted</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>Our team will review your request within 2-3 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>You may be contacted for additional verification</span>
                </li>
              </ul>
            </div>
            <div className="mt-6">
              <button
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                Continue to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
