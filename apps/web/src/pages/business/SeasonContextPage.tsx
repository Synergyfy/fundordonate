// =============================================================================
// Season Context Page
// Shows the current season/programme details to business owners.
// =============================================================================

import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  Calendar, Clock, Target, Store, Users, Award,
  Gift, ArrowRight, ChevronRight, Megaphone, Heart,
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

const SEASON_OBJECTIVES = [
  { icon: Megaphone, title: "Current Campaigns", desc: "Active campaigns in your city seeking support", count: 12 },
  { icon: Target, title: "Funding Objectives", desc: "City-wide funding goals for community projects", count: 8 },
  { icon: Store, title: "Business Opportunities", desc: "Partnerships and collaborations for businesses", count: 5 },
  { icon: Heart, title: "Community Activity", desc: "Consumer and community initiatives", count: 15 },
  { icon: Gift, title: "Available Rewards", desc: "Earn rewards for your participation", count: 20 },
  { icon: Award, title: "Membership Benefits", desc: "Exclusive perks for founding members", count: 10 },
];

const BUSINESS_OPPORTUNITIES = [
  {
    title: "Local Business Campaign",
    description: "Create a campaign to fund a community project in your area.",
    icon: Store,
    color: "text-blue-600 bg-blue-50",
    cta: "Create Campaign",
  },
  {
    title: "Seasonal Promotion",
    description: "Participate in seasonal promotions to attract customers.",
    icon: Megaphone,
    color: "text-green-600 bg-green-50",
    cta: "View Promotions",
  },
  {
    title: "Business Collaboration",
    description: "Partner with other businesses for joint campaigns.",
    icon: Users,
    color: "text-purple-600 bg-purple-50",
    cta: "Find Partners",
  },
  {
    title: "Community Support",
    description: "Support local causes and build community goodwill.",
    icon: Heart,
    color: "text-pink-600 bg-pink-50",
    cta: "View Causes",
  },
];

export default function SeasonContextPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Your City";

  const { data: currentSeason, isLoading } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-500">Loading season information...</p>
        </div>
      </div>
    );
  }

  if (!currentSeason) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-2 text-lg font-bold text-gray-900">No Active Season</h2>
          <p className="mt-1 text-gray-500">There is no active season/programme at the moment.</p>
          <Link to={`/business/${citySlug}`} className="mt-4 inline-flex items-center gap-1 text-blue-600 hover:text-blue-500">
            Back to Business Hub
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
              {cityName} Business Hub
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Current Season</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🎯</span>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-blue-300">Current Programme</p>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{currentSeason.name}</h1>
                </div>
              </div>
              <p className="mt-3 text-lg text-blue-200">
                This is the current operating context. You're participating in the {currentSeason.name} programme.
              </p>

              {/* Season Info */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
                  <Calendar className="h-4 w-4 text-blue-300" />
                  <span className="text-sm font-bold">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  currentSeason.status === "ACTIVE" ? "bg-green-500/20 text-green-300" :
                  currentSeason.status === "SCHEDULED" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-gray-500/20 text-gray-300"
                }`}>
                  {currentSeason.status}
                </span>
              </div>
            </div>

            {/* Countdown */}
            {isActive && (
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 text-center">
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Clock className="h-5 w-5 text-blue-300" />
                  <span className="text-sm font-bold text-blue-200">Season Ends In</span>
                </div>
                <div className="flex gap-3">
                  {[
                    { value: countdown.days, label: "Days" },
                    { value: countdown.hours, label: "Hours" },
                    { value: countdown.minutes, label: "Minutes" },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="rounded-lg bg-white/20 px-4 py-3 text-2xl font-bold tabular-nums text-white">
                        {String(item.value).padStart(2, "0")}
                      </div>
                      <div className="mt-1 text-xs text-blue-300">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* What This Season Is About */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What is {currentSeason.name}?</h2>
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <p className="text-gray-600">
              The {currentSeason.name} is the current operating context for {cityName}. During this season, 
              businesses and consumers come together to support local campaigns, funding objectives, and community initiatives.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-500">Active Campaigns</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-xs text-gray-500">Funding Objectives</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-xs text-gray-500">Business Opportunities</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-pink-50">
                <div className="text-2xl font-bold text-pink-600">15</div>
                <div className="text-xs text-gray-500">Community Initiatives</div>
              </div>
            </div>
          </div>
        </section>

        {/* Season Objectives */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Season Objectives</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEASON_OBJECTIVES.map((obj) => {
              const Icon = obj.icon;
              return (
                <div key={obj.title} className="rounded-xl bg-white p-4 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{obj.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{obj.desc}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                      {obj.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Business Opportunities */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Business Opportunities</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {BUSINESS_OPPORTUNITIES.map((opp) => {
              const Icon = opp.icon;
              return (
                <div key={opp.title} className="rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 ${opp.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{opp.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{opp.description}</p>
                      <button className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-500">
                        {opp.cta} <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Membership Options */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Membership Options</h2>
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <p className="text-gray-600 mb-4">
              Choose a membership tier to unlock additional benefits and recognition during this season.
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { tier: "Bronze", price: "£50", color: "text-orange-600 bg-orange-50" },
                { tier: "Silver", price: "£100", color: "text-gray-600 bg-gray-50" },
                { tier: "Gold", price: "£150", color: "text-yellow-600 bg-yellow-50" },
                { tier: "Platinum", price: "£200", color: "text-purple-600 bg-purple-50" },
              ].map((m) => (
                <div key={m.tier} className={`rounded-lg p-4 text-center ${m.color}`}>
                  <div className="text-lg font-bold">{m.tier}</div>
                  <div className="text-2xl font-bold mt-1">{m.price}</div>
                  <div className="text-xs mt-1">one-time</div>
                </div>
              ))}
            </div>
            <Link
              to={`/business/${citySlug}/membership`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500"
            >
              View Membership Options <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/business/${citySlug}/participation`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
          >
            Choose How to Participate <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/business/${citySlug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Business Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
