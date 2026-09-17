// =============================================================================
// Business City Hub Page
// Shows city overview before registration - what's available to business owners.
// =============================================================================

import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  Store, MapPin, Target, TrendingUp, Calendar, Clock,
  ArrowRight, ChevronRight, Award, BarChart3, Gift, Megaphone,
  Heart, Briefcase,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

const CITY_DATA: Record<string, {
  name: string;
  description: string;
  activationPct: number;
  businesses: number;
  highStreets: number;
  activeCampaigns: number;
  fundingRaised: number;
  fundingTarget: number;
  localAreas: { id: string; name: string; activationPct: number; businesses: number; highStreets: number; campaigns: number; fundingRaised: number; fundingTarget: number }[];
}> = {
  manchester: {
    name: "Manchester",
    description: "Building a stronger local business and community network across Manchester.",
    activationPct: 72,
    businesses: 1248,
    highStreets: 43,
    activeCampaigns: 12,
    fundingRaised: 145000,
    fundingTarget: 200000,
    localAreas: [
      { id: "northern-quarter", name: "Northern Quarter", activationPct: 85, businesses: 156, highStreets: 8, campaigns: 5, fundingRaised: 45000, fundingTarget: 50000 },
      { id: "ancoats", name: "Ancoats", activationPct: 78, businesses: 134, highStreets: 6, campaigns: 4, fundingRaised: 38000, fundingTarget: 45000 },
      { id: "castlefield", name: "Castlefield", activationPct: 65, businesses: 98, highStreets: 5, campaigns: 3, fundingRaised: 32000, fundingTarget: 40000 },
      { id: "salford", name: "Salford", activationPct: 62, businesses: 112, highStreets: 7, campaigns: 3, fundingRaised: 30000, fundingTarget: 35000 },
      { id: "stockport", name: "Stockport", activationPct: 55, businesses: 89, highStreets: 6, campaigns: 2, fundingRaised: 22000, fundingTarget: 30000 },
      { id: "bolton", name: "Bolton", activationPct: 48, businesses: 76, highStreets: 5, campaigns: 2, fundingRaised: 18000, fundingTarget: 25000 },
    ],
  },
  london: {
    name: "London",
    description: "Building a stronger local business and community network across London.",
    activationPct: 68,
    businesses: 2150,
    highStreets: 78,
    activeCampaigns: 24,
    fundingRaised: 380000,
    fundingTarget: 500000,
    localAreas: [
      { id: "camden", name: "Camden", activationPct: 82, businesses: 245, highStreets: 12, campaigns: 6, fundingRaised: 85000, fundingTarget: 100000 },
      { id: "westminster", name: "Westminster", activationPct: 75, businesses: 198, highStreets: 10, campaigns: 5, fundingRaised: 72000, fundingTarget: 90000 },
      { id: "islington", name: "Islington", activationPct: 70, businesses: 167, highStreets: 8, campaigns: 4, fundingRaised: 58000, fundingTarget: 75000 },
      { id: "hackney", name: "Hackney", activationPct: 65, businesses: 145, highStreets: 7, campaigns: 4, fundingRaised: 48000, fundingTarget: 65000 },
    ],
  },
  birmingham: {
    name: "Birmingham",
    description: "Building a stronger local business and community network across Birmingham.",
    activationPct: 65,
    businesses: 980,
    highStreets: 35,
    activeCampaigns: 9,
    fundingRaised: 112000,
    fundingTarget: 175000,
    localAreas: [
      { id: "city-centre", name: "City Centre", activationPct: 78, businesses: 189, highStreets: 8, campaigns: 4, fundingRaised: 42000, fundingTarget: 55000 },
      { id: "edgbaston", name: "Edgbaston", activationPct: 68, businesses: 124, highStreets: 6, campaigns: 3, fundingRaised: 35000, fundingTarget: 45000 },
      { id: "solihull", name: "Solihull", activationPct: 58, businesses: 98, highStreets: 5, campaigns: 2, fundingRaised: 35000, fundingTarget: 40000 },
    ],
  },
};

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

const WHATS_HAPPENING = [
  { icon: Megaphone, title: "Current Campaigns", desc: "View active campaigns in the city", color: "text-blue-600 bg-blue-50" },
  { icon: Target, title: "City Funding Objectives", desc: "See city-wide funding goals", color: "text-green-600 bg-green-50" },
  { icon: Store, title: "Local Business Activity", desc: "What businesses are doing", color: "text-purple-600 bg-purple-50" },
  { icon: Heart, title: "Community Initiatives", desc: "Community-driven projects", color: "text-pink-600 bg-pink-50" },
  { icon: Calendar, title: "Seasonal Programme", desc: "Current season activities", color: "text-orange-600 bg-orange-50" },
  { icon: Gift, title: "Rewards", desc: "Earn rewards for participating", color: "text-yellow-600 bg-yellow-50" },
  { icon: BarChart3, title: "Leaderboards", desc: "See how you rank", color: "text-indigo-600 bg-indigo-50" },
  { icon: Award, title: "Recognition", desc: "Get recognized for contributions", color: "text-amber-600 bg-amber-50" },
  { icon: Briefcase, title: "Local Opportunities", desc: "Business opportunities available", color: "text-teal-600 bg-teal-50" },
];

export default function BusinessCityHubPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const city = CITY_DATA[citySlug || "manchester"] ?? CITY_DATA.manchester!;

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-15" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-300">Business Hub</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{city.name} Business Hub</h1>
          <p className="mt-2 text-blue-200 max-w-2xl">{city.description}</p>

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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{city.activationPct}%</div>
            <div className="text-xs text-gray-500">Activated</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <Store className="mx-auto h-5 w-5 text-blue-500 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{city.businesses.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Businesses</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <MapPin className="mx-auto h-5 w-5 text-purple-500 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{city.highStreets}</div>
            <div className="text-xs text-gray-500">High Streets</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <Target className="mx-auto h-5 w-5 text-orange-500 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{city.activeCampaigns}</div>
            <div className="text-xs text-gray-500">Active Campaigns</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center col-span-2 sm:col-span-1">
            <div className="text-lg font-bold text-gray-900">{fmt(city.fundingRaised)}</div>
            <div className="text-xs text-gray-500">of {fmt(city.fundingTarget)}</div>
            <div className="mt-1 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, Math.round((city.fundingRaised / city.fundingTarget) * 100))}%` }} />
            </div>
          </div>
        </div>

        {/* What's Happening */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's happening in {city.name}?</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {WHATS_HAPPENING.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl bg-white p-3 shadow-sm border text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-gray-900">{item.title}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Local Areas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Find your local area</h2>
              <p className="text-sm text-gray-500">Explore boroughs and local areas within {city.name}.</p>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            {/* City Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-bold text-gray-900">{city.name}</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
                <span className="text-gray-500">Local Areas</span>
              </div>
            </div>

            {/* Local Area Cards */}
            <div className="divide-y">
              {city.localAreas.map((area) => (
                <Link
                  key={area.id}
                  to={`/business/${citySlug}/local-area/${area.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{area.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {area.activationPct}% activated
                      </span>
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" /> {area.businesses} businesses
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {area.highStreets} high streets
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" /> {area.campaigns} campaigns
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden max-w-[200px]">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${area.activationPct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{fmt(area.fundingRaised)} / {fmt(area.fundingTarget)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 ml-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
