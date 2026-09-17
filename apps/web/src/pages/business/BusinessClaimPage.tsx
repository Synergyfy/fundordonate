// =============================================================================
// Business Claim Page
// Business owner claims an existing business.
// =============================================================================

import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Store, MapPin, ChevronRight, Clock, CheckCircle, AlertCircle,
  ArrowRight, ArrowLeft,
} from "lucide-react";

type ClaimStatus = "form" | "pending" | "verified";

const DEMO_BUSINESSES: Record<string, { id: string; name: string; category: string; location: string; status: string }> = {
  b1: { id: "b1", name: "Vinyl Records Ltd", category: "Music & Entertainment", location: "142 Oldham Street", status: "participating" },
  b2: { id: "b2", name: "Retro Revival", category: "Vintage Clothing", location: "78 Oldham Street", status: "participating" },
  b3: { id: "b3", name: "The Coffee House", category: "Café & Food", location: "55 Oldham Street", status: "participating" },
  b4: { id: "b4", name: "Craft Beer Co", category: "Bar & Drinks", location: "23 Oldham Street", status: "available" },
  b5: { id: "b5", name: "Northern Quarter Books", category: "Books & Stationery", location: "91 Oldham Street", status: "available" },
  b6: { id: "b6", name: "Tib Street Deli", category: "Food & Groceries", location: "12 Tib Street", status: "participating" },
  b7: { id: "b7", name: "Urban Cuts", category: "Hair & Beauty", location: "45 Tib Street", status: "available" },
  b8: { id: "b8", name: "Tech Repair Hub", category: "Electronics", location: "78 Tib Street", status: "participating" },
  b9: { id: "b9", name: "Square Gallery", category: "Art & Culture", location: "4 Stevenson Square", status: "participating" },
  b10: { id: "b10", name: "Creative Space", category: "Co-working", location: "12 Stevenson Square", status: "available" },
  b11: { id: "b11", name: "Ancoats Bakehouse", category: "Bakery & Food", location: "8 Ancoats Row", status: "participating" },
  b12: { id: "b12", name: "Pizza Express", category: "Restaurant", location: "22 Ancoats Row", status: "participating" },
  b13: { id: "b13", name: "The Vine", category: "Bar & Drinks", location: "35 Ancoats Row", status: "available" },
  b14: { id: "b14", name: "Cutting Room Café", category: "Café & Food", location: "2 Cutting Room Square", status: "participating" },
  b15: { id: "b15", name: "Artisan Coffee", category: "Coffee Shop", location: "15 Cutting Room Square", status: "participating" },
  b16: { id: "b16", name: "Waterside Restaurant", category: "Restaurant", location: "42 Deansgate", status: "participating" },
  b17: { id: "b17", name: "Castlefield Bar", category: "Bar & Drinks", location: "78 Deansgate", status: "participating" },
  b18: { id: "b18", name: "Hotel & Spa", category: "Hospitality", location: "100 Deansgate", status: "available" },
  b19: { id: "b19", name: "Whitworth Gym", category: "Health & Fitness", location: "15 Whitworth Street", status: "participating" },
  b20: { id: "b20", name: "Office Supplies Co", category: "Office & Business", location: "45 Whitworth Street", status: "available" },
  b21: { id: "b21", name: "Chapel Street Pharmacy", category: "Health & Pharmacy", location: "12 Chapel Street", status: "participating" },
  b22: { id: "b22", name: "Salford Electronics", category: "Electronics", location: "56 Chapel Street", status: "available" },
  b23: { id: "b23", name: "Pendleton Corner Shop", category: "Convenience Store", location: "8 Pendleton Road", status: "participating" },
  b24: { id: "b24", name: "Pendleton Dental", category: "Health & Dental", location: "22 Pendleton Road", status: "available" },
  b25: { id: "b25", name: "Stockport Antiques", category: "Antiques & Collectables", location: "5 Great Underbank", status: "participating" },
  b26: { id: "b26", name: "The Cheese Shop", category: "Food & Groceries", location: "18 Great Underbank", status: "available" },
  b27: { id: "b27", name: "Merseyway Fashion", category: "Fashion & Clothing", location: "3 Merseyway", status: "participating" },
  b28: { id: "b28", name: "Sport & Outdoor", category: "Sports & Leisure", location: "25 Merseyway", status: "available" },
  b29: { id: "b29", name: "Bolton Library Café", category: "Café & Food", location: "2 Le Mans Crescent", status: "participating" },
  b30: { id: "b30", name: "Civic Office Supplies", category: "Office & Business", location: "15 Le Mans Crescent", status: "available" },
  b31: { id: "b31", name: "Bradshawgate Retail", category: "Retail", location: "8 Bradshawgate", status: "participating" },
  b32: { id: "b32", name: "Bolton Electronics", category: "Electronics", location: "32 Bradshawgate", status: "available" },
};

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

  const business = DEMO_BUSINESSES[businessId || "b4"];

  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimStatus("pending");
  };

  const handleConfirm = () => {
    navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/claimed/${businessId}`);
  };

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
