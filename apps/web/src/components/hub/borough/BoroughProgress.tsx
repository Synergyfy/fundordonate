// =============================================================================
// Borough Hub — Progress Section
// Funding, activation, founding membership, and high street roll-up display.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hubProgressApi, type BoroughStatsData } from "@/services/hubProgress.service";
import { ProgressRing } from "@/components/hub/ProgressRing";
import { formatCurrency, formatNumber } from "@/data/ukHubData";

interface BoroughProgressProps {
  locationId: string;
  locationName: string;
  citySlug?: string;
  cityName?: string;
  fallbackData?: {
    fundingRaised: number;
    fundingTarget: number;
    foundingBusinessTotal: number;
    foundingBusinessAllocated: number;
    foundingConsumerTotal: number;
    foundingConsumerAllocated: number;
  };
}

export function BoroughProgress({
  locationId,
  locationName,
  citySlug,
  cityName,
  fallbackData,
}: BoroughProgressProps) {
  const [stats, setStats] = useState<BoroughStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    hubProgressApi.getBoroughStats(locationId).then((data) => {
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [locationId]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm animate-pulse">
          <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="h-20 rounded bg-gray-100" />
            <div className="h-20 rounded bg-gray-100" />
            <div className="h-20 rounded bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  // Use API stats or fall back to props
  const fundingRaised = stats?.fundingRaised ?? fallbackData?.fundingRaised ?? 0;
  const fundingTarget = stats?.fundingTarget ?? fallbackData?.fundingTarget ?? 0;
  const fundingPct = fundingTarget > 0
    ? Math.min(Math.round((fundingRaised / fundingTarget) * 100), 100)
    : 0;

  const bizTotal = stats?.foundingBusiness.total ?? fallbackData?.foundingBusinessTotal ?? 0;
  const bizAllocated = stats?.foundingBusiness.allocated ?? fallbackData?.foundingBusinessAllocated ?? 0;
  const consTotal = stats?.foundingConsumer.total ?? fallbackData?.foundingConsumerTotal ?? 0;
  const consAllocated = stats?.foundingConsumer.allocated ?? fallbackData?.foundingConsumerAllocated ?? 0;

  const campaignCount = stats?.campaignCount ?? 0;
  const totalBackers = stats?.totalBackers ?? 0;
  const highStreetContributions = stats?.highStreetContributions ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xl">🏘️</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{locationName} Progress</h2>
            {cityName && citySlug && (
              <Link to={`/uk-hub-activation/${citySlug}`} className="text-xs text-gray-400 hover:text-primary-600">
                Part of {cityName} →
              </Link>
            )}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Funding Progress */}
          <div className="flex items-center gap-4">
            <ProgressRing value={fundingPct} size={80} strokeWidth={6} color="#6366f1" label="Funding" />
            <div>
              <div className="text-sm font-medium text-gray-500">Funding</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(fundingRaised)}</div>
              <div className="text-xs text-gray-400">of {formatCurrency(fundingTarget)} target</div>
            </div>
          </div>

          {/* Campaign Summary */}
          <div className="flex items-center gap-4">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600">
              {campaignCount}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Campaigns</div>
              <div className="text-lg font-bold text-gray-900">{campaignCount} active</div>
              <div className="text-xs text-gray-400">{formatNumber(totalBackers)} backers</div>
            </div>
          </div>

          {/* Founding Membership */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Founding Membership</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🏢 Business</span>
                <span className="font-medium">{bizAllocated} / {bizTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">👤 Consumer</span>
                <span className="font-medium">{consAllocated} / {consTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* High Street Contributions Roll-Up */}
        {highStreetContributions.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              High Street Contributions ({highStreetContributions.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {highStreetContributions.map((hs) => {
                const hsPct = fundingTarget > 0 ? Math.min(Math.round((hs.raised / fundingTarget) * 100), 100) : 0;
                return (
                  <div key={hs.childId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🛒</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{hs.childName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatCurrency(hs.raised)} raised</span>
                      <span>{hs.campaigns} campaigns</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${hsPct}%` }}
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
