// =============================================================================
// Business Owner Onboarding Page
// 7-step wizard: Welcome → Business Info → Location → Categories →
// Campaign Preferences → Membership → Review & Confirm
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, ChevronRight, ChevronLeft, Store, MapPin, Tag, Target, Crown, FileCheck, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessOnboarding } from "@/services/business/hook";
import { useLocationTreeQuery } from "@/services/location/hook";
import { MEMBERSHIP_TIERS as CANONICAL_MEMBERSHIP_TIERS } from "@/constants/membershipTiers";

const STEPS = [
  { id: 1, label: "Welcome", icon: Store },
  { id: 2, label: "Business Info", icon: Store },
  { id: 3, label: "Location", icon: MapPin },
  { id: 4, label: "Categories", icon: Tag },
  { id: 5, label: "Campaigns", icon: Target },
  { id: 6, label: "Membership", icon: Crown },
  { id: 7, label: "Review", icon: FileCheck },
];

const BUSINESS_TYPES = [
  "Restaurant & Cafe", "Retail & Shop", "Service Provider", "Professional Services",
  "Health & Wellness", "Arts & Entertainment", "Technology", "Other",
];

const CATEGORIES = [
  "Food & Drink", "Retail", "Technology", "Health & Wellness", "Arts & Culture",
  "Education", "Environment", "Community", "Sports & Fitness", "Professional Services",
];



const TIER_FEATURES: Record<string, string[]> = {
  bronze: ["Basic listing", "1 campaign/season", "Standard support"],
  silver: ["Enhanced listing", "3 campaigns/season", "Priority support", "Analytics dashboard"],
  gold: ["Featured listing", "Unlimited campaigns", "Dedicated support", "Advanced analytics", "Leaderboard priority"],
  platinum: ["Premium listing", "Unlimited campaigns", "Dedicated support", "Advanced analytics", "VIP recognition"],
};

/** Membership tiers with standard entry price, sourced from the canonical catalogue. */
const MEMBERSHIP_TIERS = CANONICAL_MEMBERSHIP_TIERS.map((t) => ({
  id: t.id,
  name: t.name,
  price: `£${t.variants.find((v) => v.accessLevel === "standard")?.price ?? 0} one-time`,
  features: TIER_FEATURES[t.id] ?? [],
}));

interface OnboardingData {
  businessName: string;
  businessType: string;
  registrationNumber: string;
  description: string;
  cityId: string;
  boroughId: string;
  highStreetId: string;
  categories: string[];
  campaignGoal: string;
  preferredAudience: "consumer" | "business" | "both";
  membershipTier: string;
}

export default function BusinessOnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    businessType: "",
    registrationNumber: "",
    description: "",
    cityId: "",
    boroughId: "",
    highStreetId: "",
    categories: [],
    campaignGoal: "",
    preferredAudience: "both",
    membershipTier: "bronze",
  });
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const onboardMutation = useBusinessOnboarding();
  const { data: treeResponse, isLoading: isLoadingLocations } = useLocationTreeQuery();

  const locationTree = (Array.isArray(treeResponse)
    ? treeResponse
    : (treeResponse as any)?.tree || (treeResponse as any)?.roots || []) as any[];

  const update = (partial: Partial<OnboardingData>) => setData((d) => ({ ...d, ...partial }));

  const selectedCity = locationTree.find((c: any) => c.id === data.cityId || c.slug === data.cityId);
  const boroughs = (selectedCity?.children || []) as any[];
  const selectedBorough = boroughs.find((b: any) => b.id === data.boroughId || b.slug === data.boroughId);
  const highStreets = (selectedBorough?.children || []) as any[];

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return data.businessName && data.businessType;
      case 3: return data.cityId && data.boroughId;
      case 4: return data.categories.length > 0;
      case 5: return data.campaignGoal;
      case 6: return data.membershipTier;
      case 7: return true;
      default: return false;
    }
  };

  const handleComplete = async () => {
    try {
      const city = selectedCity?.name || "Manchester";
      const borough = selectedBorough?.name || "City Centre";
      const street = data.highStreetId || selectedBorough?.highStreets?.[0] || "High Street";

      await onboardMutation.mutateAsync({
        businessName: data.businessName.trim(),
        businessType: data.businessType,
        registrationNumber: data.registrationNumber || undefined,
        description: data.description || undefined,
        email: user?.email || "business@fundordonate.com",
        city,
        localArea: borough,
        highStreet: street,
        postcode: "M1 1AA",
        category: data.categories[0] || "Community",
        subcategories: data.categories.slice(1),
        preferredAudience: data.preferredAudience,
        campaignGoal: data.campaignGoal || undefined,
        membershipTier: (data.membershipTier.toUpperCase() as any) || "BRONZE",
      });

      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to complete onboarding. Please try again.";
      alert(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const toggleCategory = (cat: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Business Owner Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your business profile to start participating</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    isCompleted ? "bg-green-500 text-white" :
                    isCurrent ? "bg-primary-600 text-white" :
                    "bg-gray-200 text-gray-500"
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span className={`ml-1.5 text-xs font-medium hidden sm:block ${
                    isCurrent ? "text-primary-700" : "text-gray-500"
                  }`}>{s.label}</span>
                  {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />}
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border shadow-sm p-6 min-h-[400px]">
          {step === 1 && (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-primary-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Welcome to FundorDonate</h2>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                Join thousands of businesses making a difference in their communities.
                Let's set up your business profile in just a few steps.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto text-sm">
                <div className="rounded-lg bg-primary-50 p-3">
                  <div className="font-bold text-primary-700">Create</div>
                  <div className="text-xs text-gray-500">Campaigns</div>
                </div>
                <div className="rounded-lg bg-primary-50 p-3">
                  <div className="font-bold text-primary-700">Track</div>
                  <div className="text-xs text-gray-500">Contributions</div>
                </div>
                <div className="rounded-lg bg-primary-50 p-3">
                  <div className="font-bold text-primary-700">Earn</div>
                  <div className="text-xs text-gray-500">Rewards</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Business Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) => update({ businessName: e.target.value })}
                  className="input-field mt-1.5 w-full"
                  placeholder="e.g. Sarah's Bakery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Type *</label>
                <select
                  value={data.businessType}
                  onChange={(e) => update({ businessType: e.target.value })}
                  className="input-field mt-1.5 w-full"
                >
                  <option value="">Select type...</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Number (optional)</label>
                <input
                  type="text"
                  value={data.registrationNumber}
                  onChange={(e) => update({ registrationNumber: e.target.value })}
                  className="input-field mt-1.5 w-full"
                  placeholder="e.g. 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={data.description}
                  onChange={(e) => update({ description: e.target.value })}
                  className="input-field mt-1.5 w-full"
                  rows={3}
                  placeholder="Tell us about your business..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Business Location</h2>
              <p className="text-sm text-gray-500">Select where your business is located.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
                <select
                  value={data.cityId}
                  onChange={(e) => update({ cityId: e.target.value, boroughId: "", highStreetId: "" })}
                  className="input-field mt-1.5 w-full"
                >
                  <option value="">{isLoadingLocations ? "Loading cities..." : "Select city..."}</option>
                  {locationTree.map((city: any) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              {selectedCity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Borough / Area *</label>
                  <select
                    value={data.boroughId}
                    onChange={(e) => update({ boroughId: e.target.value, highStreetId: "" })}
                    className="input-field mt-1.5 w-full"
                  >
                    <option value="">Select borough...</option>
                    {boroughs.map((borough: any) => (
                      <option key={borough.id} value={borough.id}>{borough.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {selectedBorough && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">High Street (optional)</label>
                  <select
                    value={data.highStreetId}
                    onChange={(e) => update({ highStreetId: e.target.value })}
                    className="input-field mt-1.5 w-full"
                  >
                    <option value="">Select high street...</option>
                    {highStreets.map((hs: any) => (
                      <option key={hs.id} value={hs.name}>{hs.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Business Categories</h2>
              <p className="text-sm text-gray-500">Select all categories that apply to your business.</p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium text-left transition-colors ${
                      data.categories.includes(cat)
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">Selected: {data.categories.length}</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Campaign Preferences</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">What's your campaign goal?</label>
                <select
                  value={data.campaignGoal}
                  onChange={(e) => update({ campaignGoal: e.target.value })}
                  className="input-field mt-1.5 w-full"
                >
                  <option value="">Select goal...</option>
                  <option value="community">Community Impact</option>
                  <option value="seasonal">Seasonal Campaigns</option>
                  <option value="charity">Charity Partnerships</option>
                  <option value="local">Local Causes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred audience</label>
                <div className="mt-1.5 grid grid-cols-3 gap-3">
                  {(["consumer", "business", "both"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => update({ preferredAudience: a })}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                        data.preferredAudience === a
                          ? "border-primary-600 bg-primary-50 text-primary-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {a === "consumer" ? "Consumers" : a === "business" ? "Businesses" : "Both"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Membership Tier</h2>
              <p className="text-sm text-gray-500">Choose a membership tier to unlock additional features.</p>
              <div className="space-y-3">
                {MEMBERSHIP_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => update({ membershipTier: tier.id })}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      data.membershipTier === tier.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Crown className={`h-5 w-5 ${tier.id === "gold" ? "text-yellow-500" : tier.id === "silver" ? "text-gray-400" : "text-amber-600"}`} />
                        <div>
                          <div className="font-bold text-gray-900">{tier.name}</div>
                          <div className="text-sm text-gray-500">{tier.price}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        data.membershipTier === tier.id ? "border-primary-600 bg-primary-600" : "border-gray-300"
                      }`}>
                        {data.membershipTier === tier.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tier.features.map((f) => (
                        <span key={f} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{f}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Review & Confirm</h2>
              <div className="rounded-lg bg-gray-50 p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Business</span><span className="font-medium text-gray-900">{data.businessName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-gray-900">{data.businessType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-900">
                  {selectedBorough?.name || selectedCity?.name || "Not selected"}
                </span></div>
                <div className="flex justify-between"><span className="text-gray-500">Categories</span><span className="text-gray-900">{data.categories.join(", ")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Audience</span><span className="text-gray-900 capitalize">{data.preferredAudience}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Membership</span><span className="text-gray-900 capitalize">{data.membershipTier}</span></div>
              </div>
              <p className="text-xs text-gray-500">
                By completing onboarding, you agree to our Terms of Service and Business Owner Agreement.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 7 ? (
            <button
              onClick={() => setStep((s) => Math.min(7, s + 1))}
              disabled={!canProceed()}
              className="flex items-center gap-1 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={onboardMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {onboardMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
