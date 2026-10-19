// =============================================================================
// Business Season Page
// Shows the current operating season with all contextual information.
// =============================================================================

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season";
import { campaignApi } from "@/services/campaign";
import {
  ArrowRight, Calendar, Target, Trophy, Gift,
  Store, Users, Megaphone, TrendingUp, Sparkles,
  CheckCircle, Clock,
} from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function BusinessSeasonPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const [isProceeding, setIsProceeding] = useState(false);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const { data: campaignResponse } = useQuery({
    queryKey: ["season-page-campaigns", citySlug, localAreaSlug, highStreetSlug],
    queryFn: () =>
      (campaignApi.list as any)({
        location: highStreetSlug || localAreaSlug || citySlug,
        limit: 10,
      }),
    enabled: Boolean(citySlug),
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;
  const campaigns: any[] = campaignResponse?.items ?? [];

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const seasonRaised = Number(currentSeason?.totalRaised) || 0;
  const seasonTarget = Number(currentSeason?.overallTarget) || 0;
  const seasonFundingPct =
    seasonTarget > 0 ? Math.min(100, Math.round((seasonRaised / seasonTarget) * 100)) : 0;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "your city";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "your area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "your high street";

  const handleContinue = () => {
    setIsProceeding(true);
    setTimeout(() => {
      navigate(`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}/join/opportunities`);
    }, 800);
  };

  if (!currentSeason) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">No Active Season</h2>
          <p className="text-sm text-gray-500 mt-1">There is no active season at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 mb-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700">ACTIVE SEASON</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-1">{currentSeason.name}</h1>
            <div className="flex flex-col items-center">
              <p className="text-gray-500 text-xs sm:text-sm break-words">
                {fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}
              </p>
              {isActive && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-700 tabular-nums">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.days}d</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.hours}h</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.minutes}m</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.seconds}s</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Season Info Card */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">This Season</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-blue-600">Season Name</div>
                <div className="font-bold text-blue-900">{currentSeason.name}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600">Dates</div>
                <div className="font-bold text-blue-900 whitespace-nowrap overflow-hidden text-ellipsis">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-blue-600">Purpose</div>
                <div className="font-medium text-blue-800">
                  Enable businesses and consumers to participate in local campaigns, funding objectives, and community initiatives across {cityName}.
                </div>
              </div>
            </div>
          </div>

          {/* City Objectives */}
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-orange-600" />
              <h3 className="font-bold text-orange-900">Current {cityName} Objectives</h3>
            </div>
            <ul className="space-y-2 text-sm text-orange-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Activate {streetName} with business participation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Connect local businesses to the hub network</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Build community engagement across {localAreaName}</span>
              </li>
            </ul>
          </div>

          {/* High Street Activity */}
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Store className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-purple-900">Current {streetName} Activity</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{currentSeason.activeCampaigns ?? 0}</div>
                <div className="text-[10px] text-purple-500">Active Campaigns</div>
              </div>
              <div className="rounded-lg bg-white border p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{currentSeason.totalBusinessOwners ?? 0}</div>
                <div className="text-[10px] text-purple-500">Businesses Participating</div>
              </div>
              <div className="rounded-lg bg-white border p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{currentSeason.totalBackers ?? 0}</div>
                <div className="text-[10px] text-purple-500">Backers</div>
              </div>
              <div className="rounded-lg bg-white border p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{fmt(seasonRaised)}</div>
                <div className="text-[10px] text-purple-500">Raised This Season</div>
              </div>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="h-5 w-5 text-green-600" />
              <h3 className="font-bold text-green-900">Active Campaigns</h3>
            </div>
            <div className="space-y-2">
              {campaigns.length === 0 ? (
                <div className="rounded-lg bg-white border p-3 text-center text-xs text-gray-500">
                  No active campaigns in this area yet.
                </div>
              ) : (
                campaigns.slice(0, 5).map((c: any) => (
                  <div key={c.id ?? c.slug} className="flex items-center gap-3 rounded-lg bg-white border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 flex-shrink-0">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{c.title}</div>
                      <div className="text-[10px] text-gray-500">{c.mode ?? "donation"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-green-600">{fmt(Number(c.raisedAmount) || 0)}</div>
                      <div className="text-[10px] text-gray-400">of {fmt(Number(c.goalAmount) || 0)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Funding Objectives */}
          <div className="rounded-lg bg-gray-50 border p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">Funding Objectives</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{fmt(seasonRaised)} raised of {fmt(seasonTarget)} target</span>
              <span className="text-sm font-bold text-gray-900">{seasonFundingPct}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${seasonFundingPct}%` }} />
            </div>
          </div>

          {/* Participation, Rewards, Leaderboards */}
          <div className="grid gap-3 mb-6 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-blue-900">Participation</div>
              <div className="text-[10px] text-blue-700">Join campaigns & contribute</div>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-center">
              <Gift className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-yellow-900">Rewards</div>
              <div className="text-[10px] text-yellow-700">Earn badges & incentives</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center">
              <Trophy className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-purple-900">Leaderboards</div>
              <div className="text-[10px] text-purple-700">Rank against peers</div>
            </div>
          </div>

          {/* Incentives */}
          {currentSeason.engagementConfig?.incentivesEnabled && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                <h3 className="font-bold text-yellow-900">Incentives</h3>
              </div>
              <p className="text-xs text-yellow-700">
                Incentives for this season are published by your local hub. Participate in campaigns to qualify.
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={isProceeding}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isProceeding ? (
              <span className="flex items-center justify-center gap-2">Loading...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                See What Your Business Can Do
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
