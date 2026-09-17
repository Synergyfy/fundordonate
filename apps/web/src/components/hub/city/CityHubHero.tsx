// =============================================================================
// City Hub — Hero Section
// Shows city info, season, activation status, and business/consumer routing.
// =============================================================================

import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { HubLocation } from "@/types/uk-hub";
import { LOCATION_TYPE_META } from "@/types/uk-hub";
import { getEffectiveStatus } from "@/services/locationResolver";
import { seasonApi, type Season } from "@/services/season.service";
import { LocationStatusBadge } from "@/components/hub/HubStatusBadge";
import { Store, Users, Calendar, Clock, TrendingUp, Target, MapPin } from "lucide-react";

interface CityHubHeroProps {
  location: HubLocation;
  fundingRaised?: number;
  fundingTarget?: number;
  businessesCount?: number;
  consumersCount?: number;
  localAreasCount?: number;
  highStreetsCount?: number;
  activeCampaigns?: number;
}

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

function SeasonInfo({ season }: { season: Season | null }) {
  const countdown = useCountdown(season?.endDate || new Date().toISOString());
  const now = new Date();
  const end = season ? new Date(season.endDate) : new Date();
  const isActive = season?.status === "ACTIVE" && end > now;

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!season) return null;

  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-300" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{season.name}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{season.status}</span>
            </div>
            <div className="text-sm text-blue-200">
              {fmtDate(season.startDate)} — {fmtDate(season.endDate)}
            </div>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-300" />
            <div className="flex gap-1.5">
              {[
                { value: countdown.days, label: "d" },
                { value: countdown.hours, label: "h" },
                { value: countdown.minutes, label: "m" },
                { value: countdown.seconds, label: "s" },
              ].map((item) => (
                <span key={item.label} className="rounded-lg bg-white/20 px-2 py-1 text-xs font-bold tabular-nums text-white">
                  {String(item.value).padStart(2, "0")}{item.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CityHubHero({
  location,
  fundingRaised = 0,
  fundingTarget = 1000000,
  businessesCount = 0,
  consumersCount = 0,
  localAreasCount = 0,
  highStreetsCount = 0,
  activeCampaigns = 0,
}: CityHubHeroProps) {
  const effectiveStatus = getEffectiveStatus(location);
  const meta = LOCATION_TYPE_META[location.type];

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const fundingPct = fundingTarget > 0 ? Math.min(100, Math.round((fundingRaised / fundingTarget) * 100)) : 0;
  const fmtCur = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {location.primaryImage && (
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${location.primaryImage}')` }} />
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* City Title */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{meta?.icon || "📍"}</span>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary-400">{location.type} Hub</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{location.name} City Hub</h1>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 text-lg text-gray-300 max-w-2xl">
            Building a stronger local business and community network across {location.name}.
          </p>

          {/* Status & Season */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LocationStatusBadge status={effectiveStatus} size="md" />
            {currentSeason && <SeasonInfo season={currentSeason} />}
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-300">Funding</span>
              </div>
              <div className="text-lg font-bold text-white">{fmtCur(fundingRaised)}</div>
              <div className="text-[10px] text-gray-400">of {fmtCur(fundingTarget)} ({fundingPct}%)</div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-green-400" style={{ width: `${fundingPct}%` }} />
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-gray-300">Businesses</span>
              </div>
              <div className="text-lg font-bold text-white">{businessesCount}</div>
              <div className="text-[10px] text-gray-400">participating</div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-gray-300">Consumers</span>
              </div>
              <div className="text-lg font-bold text-white">{consumersCount}</div>
              <div className="text-[10px] text-gray-400">involved</div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-gray-300">Campaigns</span>
              </div>
              <div className="text-lg font-bold text-white">{activeCampaigns}</div>
              <div className="text-[10px] text-gray-400">active</div>
            </div>
          </div>

          {/* Location Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {localAreasCount} Local Areas
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {highStreetsCount} High Streets
            </span>
          </div>

          {/* Primary Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/dashboard?city=${location.slug}&type=business`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              <Store className="h-5 w-5" />
              I'm a Business Owner
            </Link>
            <Link
              to={`/consumer?city=${location.slug}&type=consumer`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              <Users className="h-5 w-5" />
              I'm a Consumer
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
