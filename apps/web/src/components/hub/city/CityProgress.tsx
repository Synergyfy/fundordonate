// =============================================================================
// City Hub — Progress Section
// Funding, activation, founding membership, and child borough roll-up display.
// Uses live API with fallback to props-based rendering.
// =============================================================================

import { useState, useEffect } from "react";
import type { HubLocation } from "@/types/uk-hub";
import { getEffectiveStatus, getActivationProgress } from "@/services/locationResolver";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";
import { hubProgressApi, type BoroughStatsData } from "@/services/hubProgress.service";
import { ProgressRing } from "@/components/hub/ProgressRing";
import { formatCurrency, formatNumber } from "@/data/ukHubData";

interface CityProgressProps {
  location: HubLocation;
  bizProg?: { allocatedCount: number; totalAllocation: number } | null;
  consProg?: { allocatedCount: number; totalAllocation: number } | null;
  liveMode?: boolean;
}

export function CityProgress({ location, bizProg, consProg, liveMode = true }: CityProgressProps) {
  const [liveStats, setLiveStats] = useState<BoroughStatsData | null>(null);
  const [loading, setLoading] = useState(liveMode);

  useEffect(() => {
    if (!liveMode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    hubProgressApi.getCityStats(location.id).then((data) => {
      if (!cancelled) {
        setLiveStats(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [location.id, liveMode]);

  const effectiveStatus = getEffectiveStatus(location);
  const statusMeta = LOCATION_PUBLIC_STATUS_META[effectiveStatus];
  const activationProgress = getActivationProgress(location);

  // Use live stats when available, fallback to props
  const fundingRaised = liveStats?.fundingRaised ?? location.fundingRaised;
  const fundingTarget = liveStats?.fundingTarget ?? location.fundingTarget;
  const fundingPct = fundingTarget > 0
    ? Math.min(Math.round((fundingRaised / fundingTarget) * 100), 100)
    : 0;

  const bizCount = liveStats?.foundingBusiness.allocated ?? (bizProg ? bizProg.allocatedCount : location.foundingBusinessAllocated);
  const bizTotal = liveStats?.foundingBusiness.total ?? (bizProg ? bizProg.totalAllocation : location.foundingBusinessTotal);
  const consCount = liveStats?.foundingConsumer.allocated ?? (consProg ? consProg.allocatedCount : location.foundingConsumerAllocated);
  const consTotal = liveStats?.foundingConsumer.total ?? (consProg ? consProg.totalAllocation : location.foundingConsumerTotal);

  const campaignCount = liveStats?.campaignCount ?? 0;
  const totalBackers = liveStats?.totalBackers ?? 0;
  const childContributions = liveStats?.childContributions ?? [];
  const contributionBreakdown = liveStats?.contributionBreakdown;

  if (loading) {
    return (
      <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm animate-pulse">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="h-20 rounded bg-gray-100" />
            <div className="h-20 rounded bg-gray-100" />
            <div className="h-20 rounded bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Funding Progress */}
          <div className="flex items-center gap-4">
            <ProgressRing value={fundingPct} size={80} strokeWidth={6} color={statusMeta.mapColor} label="Funding" />
            <div>
              <div className="text-sm font-medium text-gray-500">Funding</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(fundingRaised)}</div>
              <div className="text-xs text-gray-400">of {formatCurrency(fundingTarget)} target</div>
            </div>
          </div>

          {/* Activation Progress */}
          <div className="flex items-center gap-4">
            <ProgressRing value={activationProgress} size={80} strokeWidth={6} color="#3b82f6" label="Activation" />
            <div>
              <div className="text-sm font-medium text-gray-500">Activation</div>
              <div className="text-lg font-bold text-gray-900">{activationProgress}%</div>
              <div className="text-xs text-gray-400">progress toward active</div>
            </div>
          </div>

          {/* Founding Membership */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Founding Membership</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🏢 Business</span>
                <span className="font-medium">{bizCount} / {bizTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">👤 Consumer</span>
                <span className="font-medium">{consCount} / {consTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stats Row */}
        {liveStats && (
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <div className="text-lg font-bold text-blue-700">{campaignCount}</div>
              <div className="text-xs text-blue-600">Active Campaigns</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <div className="text-lg font-bold text-purple-700">{formatNumber(totalBackers)}</div>
              <div className="text-xs text-purple-600">Total Backers</div>
            </div>
            {contributionBreakdown && (
              <>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <div className="text-lg font-bold text-green-700">{formatCurrency(contributionBreakdown.fund)}</div>
                  <div className="text-xs text-green-600">Fund Campaigns</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <div className="text-lg font-bold text-amber-700">{formatCurrency(contributionBreakdown.donate)}</div>
                  <div className="text-xs text-amber-600">Donations</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Child Borough Contributions */}
        {childContributions.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Borough Contributions ({childContributions.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {childContributions.map((borough) => {
                const boroughPct = fundingTarget > 0
                  ? Math.min(Math.round((borough.raised / fundingTarget) * 100), 100)
                  : 0;
                return (
                  <div key={borough.childId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🏘️</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{borough.childName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatCurrency(borough.raised)} raised</span>
                      <span>{borough.campaigns} campaigns</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${boroughPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
