// =============================================================================
// High Street — Progress Section
// Funding, campaigns, business members, and backer summary for leaf-level hubs.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hubProgressApi, type HighStreetStatsData } from "@/services/hubProgress.service";
import { ProgressRing } from "@/components/hub/ProgressRing";
import { formatCurrency, formatNumber } from "@/data/ukHubData";

interface HighStreetProgressProps {
  locationId: string;
  locationName: string;
  parentBoroughName?: string;
  parentBoroughSlug?: string;
  fallbackData?: {
    fundingRaised: number;
    fundingTarget: number;
    foundingBusinessTotal: number;
    foundingBusinessAllocated: number;
  };
}

export function HighStreetProgress({
  locationId,
  locationName,
  parentBoroughName,
  parentBoroughSlug,
  fallbackData,
}: HighStreetProgressProps) {
  const [stats, setStats] = useState<HighStreetStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    hubProgressApi.getHighStreetStats(locationId).then((data) => {
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

  const fundingRaised = stats?.fundingRaised ?? fallbackData?.fundingRaised ?? 0;
  const fundingTarget = stats?.fundingTarget ?? fallbackData?.fundingTarget ?? 0;
  const fundingPct = fundingTarget > 0
    ? Math.min(Math.round((fundingRaised / fundingTarget) * 100), 100)
    : 0;

  const bizTotal = stats?.foundingBusiness.total ?? fallbackData?.foundingBusinessTotal ?? 0;
  const bizAllocated = stats?.foundingBusiness.allocated ?? fallbackData?.foundingBusinessAllocated ?? 0;

  const campaignCount = stats?.campaignCount ?? 0;
  const totalBackers = stats?.totalBackers ?? 0;
  const hsName = stats?.parentBoroughName ?? parentBoroughName;
  const hsSlug = stats?.parentBoroughSlug ?? parentBoroughSlug;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">🛒</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{locationName} Progress</h2>
            {hsName && hsSlug && (
              <Link to={`/uk-hub-activation/${hsSlug}`} className="text-xs text-gray-400 hover:text-primary-600">
                Part of {hsName} →
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Funding Progress */}
          <div className="flex items-center gap-4">
            <ProgressRing value={fundingPct} size={80} strokeWidth={6} color="#10b981" label="Funding" />
            <div>
              <div className="text-sm font-medium text-gray-500">Funding</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(fundingRaised)}</div>
              <div className="text-xs text-gray-400">of {formatCurrency(fundingTarget)} target</div>
            </div>
          </div>

          {/* Campaigns & Backers */}
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

          {/* Business Members */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Business Members</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🏢 Founding</span>
                <span className="font-medium">{bizAllocated} / {bizTotal}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: bizTotal > 0 ? `${Math.min((bizAllocated / bizTotal) * 100, 100)}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
