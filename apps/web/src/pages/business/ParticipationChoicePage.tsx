// =============================================================================
// Participation Choice Page
// Business owner chooses how to participate: Backer or Founding Member.
// =============================================================================

import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  Calendar, Target, Award, ArrowRight, ChevronRight, CheckCircle,
  Clock, Heart,
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

type ParticipationType = "backer" | "founding_member" | "founding_member_monthly";

const PARTICIPATION_OPTIONS: {
  type: ParticipationType;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
  benefits: string[];
  badge?: string;
}[] = [
  {
    type: "backer",
    title: "Backer",
    subtitle: "Support the programme",
    description: "Support campaigns and funding objectives through contributions. Earn recognition for your support.",
    icon: Target,
    color: "text-blue-600",
    borderColor: "border-blue-500",
    bgColor: "bg-blue-50",
    benefits: [
      "Contribute to campaigns",
      "Earn rewards for support",
      "Track your impact",
      "Backer badge on profile",
      "Access to backer leaderboard",
    ],
  },
  {
    type: "founding_member",
    title: "Founding Member",
    subtitle: "Stronger recognition",
    description: "A stronger recognition and status relationship with the programme. One-time membership fee for the season.",
    icon: Award,
    color: "text-amber-600",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-50",
    benefits: [
      "Priority recognition",
      "Founding Member badge",
      "Enhanced rewards",
      "Exclusive season perks",
      "Founding Member leaderboard",
      "Priority support",
    ],
    badge: "POPULAR",
  },
  {
    type: "founding_member_monthly",
    title: "Founding Member Monthly",
    subtitle: "Flexible subscription",
    description: "Monthly subscription for Founding Member status. Cancel anytime. Same benefits as annual Founding Member.",
    icon: Award,
    color: "text-purple-600",
    borderColor: "border-purple-500",
    bgColor: "bg-purple-50",
    benefits: [
      "Monthly billing",
      "Cancel anytime",
      "Same as Founding Member",
      "Founding Member badge",
      "Enhanced rewards",
      "Flexible commitment",
    ],
    badge: "FLEXIBLE",
  },
];

export default function ParticipationChoicePage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ParticipationType | null>(null);

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Your City";

  const handleContinue = () => {
    if (!selected) return;
    navigate(`/business/${citySlug}/membership?type=${selected}`);
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
            <Link to={`/business/${citySlug}/season`} className="hover:text-white transition-colors">
              {currentSeason?.name || "Current Season"}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Participation</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose How to Participate</h1>
          <p className="mt-2 text-blue-200 max-w-2xl">
            Select how you want to participate in the {currentSeason?.name || "current"} programme.
          </p>

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

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Important Note */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Heart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Different Ways to Participate</h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Backer</strong> and <strong>Founding Member</strong> represent different things. 
                Backers support campaigns through contributions, while Founding Members have a stronger recognition 
                and status relationship with the programme.
              </p>
            </div>
          </div>
        </div>

        {/* Participation Options */}
        <div className="space-y-4">
          {PARTICIPATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.type;
            return (
              <div
                key={option.type}
                onClick={() => setSelected(option.type)}
                className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} shadow-lg`
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-3 ${isSelected ? option.bgColor : "bg-gray-100"}`}>
                    <Icon className={`h-8 w-8 ${isSelected ? option.color : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{option.title}</h3>
                      {option.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          option.type === "founding_member" ? "bg-amber-100 text-amber-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{option.subtitle}</p>
                    <p className="text-gray-600 mt-2">{option.description}</p>

                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Benefits:</h4>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {option.benefits.map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? option.borderColor : "border-gray-300"
                  }`}>
                    {isSelected && <div className={`h-4 w-4 rounded-full ${
                      option.type === "backer" ? "bg-blue-500" :
                      option.type === "founding_member" ? "bg-amber-500" :
                      "bg-purple-500"
                    }`} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            to={`/business/${citySlug}/season`}
            className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Season
          </Link>
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Membership <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
