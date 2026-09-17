// =============================================================================
// Business Owner Onboarding Page
// 8-step stepper for business setup after account creation/claiming.
// Steps: Owner Profile → Business Details → Location → Category → Profile → Preferences → Review → Complete
// =============================================================================

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  User, Building, MapPin, Tag, Image, Settings, CheckCircle, ArrowRight,
  ArrowLeft, ChevronRight, Calendar, Award, FileText, Target,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface OnboardingData {
  // Step1: Owner Profile
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerRole: string;
  // Step2: Business Details
  businessName: string;
  businessDescription: string;
  businessWebsite: string;
  businessPhone: string;
  businessEmail: string;
  // Step3: Business Location
  city: string;
  localArea: string;
  highStreet: string;
  postcode: string;
  address: string;
  // Step4: Business Category
  category: string;
  subcategory: string;
  // Step5: Business Profile
  logoUrl: string;
  coverImageUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  // Step6: Participation Preferences
  participationType: "backer" | "founding_member" | "founding_member_monthly";
  // Step7: Review (no data)
  // Step8: Complete (no data)
}

const STEPS = [
  { num: 1, label: "Owner Profile", icon: User },
  { num: 2, label: "Business Details", icon: Building },
  { num: 3, label: "Business Location", icon: MapPin },
  { num: 4, label: "Business Category", icon: Tag },
  { num: 5, label: "Business Profile", icon: Image },
  { num: 6, label: "Participation", icon: Settings },
  { num: 7, label: "Review", icon: FileText },
  { num: 8, label: "Complete", icon: CheckCircle },
];

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

const OWNER_ROLES = [
  "Owner",
  "Director",
  "Manager",
  "Authorised Representative",
];

export default function BusinessOwnerOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const citySlug = searchParams.get("city") || "manchester";
  const localAreaSlug = searchParams.get("localArea") || "";
  const highStreetSlug = searchParams.get("highStreet") || "";
  const businessId = searchParams.get("businessId") || "";

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerRole: "",
    businessName: "",
    businessDescription: "",
    businessWebsite: "",
    businessPhone: "",
    businessEmail: "",
    city: citySlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    localArea: localAreaSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    highStreet: highStreetSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    postcode: "",
    address: "",
    category: "",
    subcategory: "",
    logoUrl: "",
    coverImageUrl: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    participationType: "backer",
  });

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const updateData = (partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.ownerFirstName && !!data.ownerLastName && !!data.ownerEmail && !!data.ownerRole;
      case 2: return !!data.businessName && !!data.businessDescription;
      case 3: return !!data.postcode || !!data.address;
      case 4: return !!data.category;
      case 5: return true; // Optional fields
      case 6: return !!data.participationType;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 8 && canProceed()) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = () => {
    // In real app, this would submit to backend
    navigate(`/business/${citySlug}/local-area/${localAreaSlug || "local-area"}/high-street/${highStreetSlug || "high-street"}/claimed/${businessId || "new"}`);
  };

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Business Setup</h1>
              <p className="mt-1 text-blue-200">Complete your business profile to start participating.</p>
            </div>
            {currentSeason && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
                <Calendar className="h-4 w-4 text-blue-300" />
                <span className="text-sm font-bold">{currentSeason.name}</span>
                <span className="text-xs text-blue-200">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isCompleted ? "border-green-500 bg-green-500 text-white" :
                      isActive ? "border-blue-500 bg-blue-500 text-white" :
                      "border-gray-300 bg-white text-gray-400"
                    }`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`mt-1 text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-2 h-0.5 w-8 sm:w-12 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          {/* Step1: Owner Profile */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Owner Profile</h2>
              <p className="text-sm text-gray-500 mb-6">Tell us about yourself as the business owner/representative.</p>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={data.ownerFirstName}
                      onChange={(e) => updateData({ ownerFirstName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={data.ownerLastName}
                      onChange={(e) => updateData({ ownerLastName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={data.ownerEmail}
                    onChange={(e) => updateData({ ownerEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={data.ownerPhone}
                    onChange={(e) => updateData({ ownerPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="07700 900000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Role / Relationship *</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {OWNER_ROLES.map((role) => (
                      <label
                        key={role}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          data.ownerRole === role
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ownerRole"
                          value={role}
                          checked={data.ownerRole === role}
                          onChange={(e) => updateData({ ownerRole: e.target.value })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step2: Business Details */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Business Details</h2>
              <p className="text-sm text-gray-500 mb-6">Provide information about your business.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={data.businessName}
                    onChange={(e) => updateData({ businessName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Smith's Bakery"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Business Description *</label>
                  <textarea
                    required
                    value={data.businessDescription}
                    onChange={(e) => updateData({ businessDescription: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Describe your business..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={data.businessWebsite}
                      onChange={(e) => updateData({ businessWebsite: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Business Phone</label>
                    <input
                      type="tel"
                      value={data.businessPhone}
                      onChange={(e) => updateData({ businessPhone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="0161 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Business Email</label>
                  <input
                    type="email"
                    value={data.businessEmail}
                    onChange={(e) => updateData({ businessEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="info@business.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step3: Business Location */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Business Location</h2>
              <p className="text-sm text-gray-500 mb-6">Confirm your business location based on your earlier selection.</p>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <MapPin className="h-4 w-4" />
                  <span className="font-bold">Selected Location:</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-blue-700">
                  <span>{data.city}</span>
                  {data.localArea && <><ChevronRight className="h-4 w-4" /><span>{data.localArea}</span></>}
                  {data.highStreet && <><ChevronRight className="h-4 w-4" /><span>{data.highStreet}</span></>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Postcode *</label>
                  <input
                    type="text"
                    value={data.postcode}
                    onChange={(e) => updateData({ postcode: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="M1 1AA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => updateData({ address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step4: Business Category */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Business Category</h2>
              <p className="text-sm text-gray-500 mb-6">Select the category that best describes your business.</p>

              <div className="grid gap-3 sm:grid-cols-3">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      data.category === cat
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={data.category === cat}
                      onChange={(e) => updateData({ category: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step5: Business Profile */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Business Profile</h2>
              <p className="text-sm text-gray-500 mb-6">Add images and social links to complete your profile.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={data.logoUrl}
                    onChange={(e) => updateData({ logoUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={data.coverImageUrl}
                    onChange={(e) => updateData({ coverImageUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-900 mb-3">Social Links</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Facebook</label>
                      <input
                        type="url"
                        value={data.socialFacebook}
                        onChange={(e) => updateData({ socialFacebook: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="https://facebook.com/yourbusiness"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Instagram</label>
                      <input
                        type="url"
                        value={data.socialInstagram}
                        onChange={(e) => updateData({ socialInstagram: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="https://instagram.com/yourbusiness"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Twitter / X</label>
                      <input
                        type="url"
                        value={data.socialTwitter}
                        onChange={(e) => updateData({ socialTwitter: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="https://twitter.com/yourbusiness"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step6: Participation Preferences */}
          {step === 6 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Participation Preferences</h2>
              <p className="text-sm text-gray-500 mb-6">Choose how you want to participate in the programme.</p>

              <div className="space-y-4">
                <div
                  onClick={() => updateData({ participationType: "backer" })}
                  className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    data.participationType === "backer"
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 ${data.participationType === "backer" ? "bg-blue-100" : "bg-gray-100"}`}>
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Backer</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Support campaigns and funding objectives through contributions. Earn recognition for your support.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Contribute to campaigns</span>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Earn rewards</span>
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">Track impact</span>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      data.participationType === "backer" ? "border-blue-500" : "border-gray-300"
                    }`}>
                      {data.participationType === "backer" && <div className="h-3 w-3 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => updateData({ participationType: "founding_member" })}
                  className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    data.participationType === "founding_member"
                      ? "border-amber-500 bg-amber-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 ${data.participationType === "founding_member" ? "bg-amber-100" : "bg-gray-100"}`}>
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Founding Member</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        A stronger recognition and status relationship with the programme. One-time membership fee.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Priority recognition</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Founding badge</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Enhanced rewards</span>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      data.participationType === "founding_member" ? "border-amber-500" : "border-gray-300"
                    }`}>
                      {data.participationType === "founding_member" && <div className="h-3 w-3 rounded-full bg-amber-500" />}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => updateData({ participationType: "founding_member_monthly" })}
                  className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    data.participationType === "founding_member_monthly"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 ${data.participationType === "founding_member_monthly" ? "bg-purple-100" : "bg-gray-100"}`}>
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Founding Member Monthly</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Monthly subscription for Founding Member status. Cancel anytime.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">Monthly billing</span>
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">Cancel anytime</span>
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">Same benefits</span>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      data.participationType === "founding_member_monthly" ? "border-purple-500" : "border-gray-300"
                    }`}>
                      {data.participationType === "founding_member_monthly" && <div className="h-3 w-3 rounded-full bg-purple-500" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step7: Review */}
          {step === 7 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Details</h2>
              <p className="text-sm text-gray-500 mb-6">Please review your information before completing setup.</p>

              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" /> Owner Profile
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-500">Name:</dt>
                    <dd className="font-medium text-gray-900">{data.ownerFirstName} {data.ownerLastName}</dd>
                    <dt className="text-gray-500">Email:</dt>
                    <dd className="font-medium text-gray-900">{data.ownerEmail}</dd>
                    <dt className="text-gray-500">Role:</dt>
                    <dd className="font-medium text-gray-900">{data.ownerRole}</dd>
                  </dl>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" /> Business Details
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-500">Name:</dt>
                    <dd className="font-medium text-gray-900">{data.businessName}</dd>
                    <dt className="text-gray-500">Description:</dt>
                    <dd className="font-medium text-gray-900 col-span-2">{data.businessDescription}</dd>
                  </dl>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>{data.city}</span>
                    {data.localArea && <><ChevronRight className="h-4 w-4 text-gray-400" /><span>{data.localArea}</span></>}
                    {data.highStreet && <><ChevronRight className="h-4 w-4 text-gray-400" /><span>{data.highStreet}</span></>}
                  </div>
                  {data.postcode && <div className="mt-1 text-sm text-gray-600">Postcode: {data.postcode}</div>}
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Category
                  </h4>
                  <div className="text-sm font-medium text-gray-900">{data.category}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Participation
                  </h4>
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {data.participationType.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step8: Complete */}
          {step === 8 && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Setup Complete!</h2>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                Your business profile has been created. You can now start participating in your local community.
              </p>

              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 max-w-md mx-auto">
                <h4 className="font-bold text-blue-900 text-sm mb-1">What's next?</h4>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Your business is now live
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> You can create campaigns
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Connect with your local community
                  </li>
                </ul>
              </div>

              <button
                onClick={handleComplete}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step < 8 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 7 ? "Complete Setup" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
