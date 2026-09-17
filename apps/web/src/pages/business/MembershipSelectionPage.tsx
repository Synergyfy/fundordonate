// =============================================================================
// Membership Selection Page
// Business owner selects membership tier and option.
// =============================================================================

import React, { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  Calendar, Clock, Award, ArrowRight, ChevronRight, CheckCircle,
  Star, Shield, Crown, Gem, Target,
} from "lucide-react";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type MembershipTier = "bronze" | "silver" | "gold" | "platinum";
type MembershipOption = "standard" | "pro" | "pro_plus";

interface TierConfig {
  tier: MembershipTier;
  name: string;
  price: number;
  monthlyPrice?: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  features: string[];
  backerStatus: boolean;
  foundingMemberStatus: boolean;
}

const TIER_CONFIGS: TierConfig[] = [
  {
    tier: "bronze",
    name: "Bronze",
    price: 50,
    icon: Shield,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    features: [
      "Basic campaign support",
      "Bronze badge",
      "Standard rewards",
      "Community access",
    ],
    backerStatus: true,
    foundingMemberStatus: false,
  },
  {
    tier: "silver",
    name: "Silver",
    price: 100,
    icon: Star,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    features: [
      "Enhanced campaign support",
      "Silver badge",
      "Priority rewards",
      "Community access",
      "Monthly insights",
    ],
    backerStatus: true,
    foundingMemberStatus: false,
  },
  {
    tier: "gold",
    name: "Gold",
    price: 150,
    icon: Crown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    features: [
      "Full campaign support",
      "Gold badge",
      "Premium rewards",
      "Priority community access",
      "Weekly insights",
      "Direct support",
    ],
    backerStatus: false,
    foundingMemberStatus: true,
  },
  {
    tier: "platinum",
    name: "Platinum",
    price: 200,
    icon: Gem,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    features: [
      "Maximum campaign support",
      "Platinum badge",
      "Exclusive rewards",
      "VIP community access",
      "Daily insights",
      "Dedicated support",
      "Featured listing",
    ],
    backerStatus: false,
    foundingMemberStatus: true,
  },
];

const OPTION_CONFIGS: {
  option: MembershipOption;
  name: string;
  description: string;
  duration: string;
  priceMultiplier: number;
}[] = [
  {
    option: "standard",
    name: "Standard",
    description: "Standard access for the season",
    duration: "Season (180 days)",
    priceMultiplier: 1,
  },
  {
    option: "pro",
    name: "Pro",
    description: "Enhanced features and support",
    duration: "Season (180 days)",
    priceMultiplier: 1.5,
  },
  {
    option: "pro_plus",
    name: "Pro+",
    description: "Full access for the year",
    duration: "Annual (365 days)",
    priceMultiplier: 2,
  },
];

export default function MembershipSelectionPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams] = useSearchParams();
  const participationType = searchParams.get("type") || "backer";

  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [selectedOption, setSelectedOption] = useState<MembershipOption>("standard");

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Your City";

  const getEffectivePrice = (tier: TierConfig, option: MembershipOption): number => {
    const optConfig = OPTION_CONFIGS.find(o => o.option === option);
    return Math.round(tier.price * (optConfig?.priceMultiplier || 1));
  };

  const getDuration = (option: MembershipOption): string => {
    return OPTION_CONFIGS.find(o => o.option === option)?.duration || "Season";
  };

  const handleContinue = () => {
    if (!selectedTier) return;
    // In real app, this would proceed to payment
    alert(`Proceeding with ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} ${OPTION_CONFIGS.find(o => o.option === selectedOption)?.name} membership. Payment flow coming soon!`);
  };

  // Filter tiers based on participation type
  const availableTiers = participationType === "backer"
    ? TIER_CONFIGS.filter(t => t.backerStatus)
    : TIER_CONFIGS.filter(t => t.foundingMemberStatus);

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
            <Link to={`/business/${citySlug}/season`} className="hover:text-white transition-colors">
              {currentSeason?.name || "Current Season"}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/business/${citySlug}/participation`} className="hover:text-white transition-colors">
              Participation
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Membership</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Select Membership</h1>
          <p className="mt-2 text-blue-200 max-w-2xl">
            Choose your membership tier and option for the {currentSeason?.name || "current"} programme.
          </p>

          {/* Participation Type Badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
            <Award className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-bold capitalize">{participationType.replace(/_/g, " ")}</span>
          </div>

          {/* Season Info */}
          {currentSeason && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
                <Calendar className="h-4 w-4 text-blue-300" />
                <span className="text-sm font-bold">{currentSeason.name}</span>
                <span className="text-xs text-blue-200">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
              {isActive && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-300" />
                  <div className="flex gap-1">
                    {[
                      { value: countdown.days, label: "d" },
                      { value: countdown.hours, label: "h" },
                      { value: countdown.minutes, label: "m" },
                    ].map((item) => (
                      <span key={item.label} className="rounded bg-white/20 px-2 py-1 text-xs font-bold tabular-nums">
                        {String(item.value).padStart(2, "0")}{item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Duration Options */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Duration</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {OPTION_CONFIGS.map((opt) => (
              <div
                key={opt.option}
                onClick={() => setSelectedOption(opt.option)}
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  selectedOption === opt.option
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{opt.name}</h3>
                    <p className="text-xs text-gray-500">{opt.description}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === opt.option ? "border-blue-500" : "border-gray-300"
                  }`}>
                    {selectedOption === opt.option && <div className="h-3 w-3 rounded-full bg-blue-500" />}
                  </div>
                </div>
                <div className="mt-2 text-sm font-bold text-blue-600">{opt.duration}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tier Selection */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Tier</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {availableTiers.map((tier) => {
              const Icon = tier.icon;
              const price = getEffectivePrice(tier, selectedOption);
              const isSelected = selectedTier === tier.tier;
              return (
                <div
                  key={tier.tier}
                  onClick={() => setSelectedTier(tier.tier)}
                  className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    isSelected
                      ? `${tier.borderColor} ${tier.bgColor} shadow-lg`
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${isSelected ? tier.bgColor : "bg-gray-100"}`}>
                      <Icon className={`h-8 w-8 ${isSelected ? tier.color : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-bold text-gray-900">£{price}</span>
                        <span className="text-sm text-gray-500">/ {getDuration(selectedOption)}</span>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Includes:</h4>
                        <div className="space-y-1">
                          {tier.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        {tier.backerStatus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                            <Target className="h-3 w-3" /> Backer Status
                          </span>
                        )}
                        {tier.foundingMemberStatus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                            <Award className="h-3 w-3" /> Founding Member Status
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? tier.borderColor : "border-gray-300"
                    }`}>
                      {isSelected && <div className={`h-4 w-4 rounded-full bg-current ${tier.color}`} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary */}
        {selectedTier && (
          <section className="mb-8">
            <div className="rounded-xl bg-white p-6 shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Membership Tier</span>
                  <span className="font-bold text-gray-900 capitalize">{selectedTier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Option</span>
                  <span className="font-bold text-gray-900">{OPTION_CONFIGS.find(o => o.option === selectedOption)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-bold text-gray-900">{getDuration(selectedOption)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      £{getEffectivePrice(TIER_CONFIGS.find(t => t.tier === selectedTier)!, selectedOption)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between">
          <Link
            to={`/business/${citySlug}/participation`}
            className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Participation
          </Link>
          <button
            onClick={handleContinue}
            disabled={!selectedTier}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Payment <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
