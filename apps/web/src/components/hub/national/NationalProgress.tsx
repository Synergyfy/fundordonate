// =============================================================================
// National Hub — National Progress Snapshot Section
// Overall funding and membership progress from the live hub API.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { hubProgressApi, type NationalProgressData } from "@/services/hub-progress";
import { ProgressRing } from "@/components/hub/ProgressRing";
import { formatCurrency, formatNumber } from "@/utils/formatters";

export function NationalProgress() {
  const [data, setData] = useState<NationalProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    hubProgressApi
      .getNationalSummary()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" aria-hidden="true" />
          <h3 className="mb-1 font-semibold text-gray-900">Progress could not be loaded</h3>
          <p className="mb-4 text-sm text-gray-600">We couldn't reach the national progress service.</p>
          <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (loading || !data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8 animate-pulse">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <div className="h-[140px] w-[140px] rounded-full bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-64 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-100" />
              <div className="flex gap-3">
                <div className="h-6 w-32 rounded-full bg-gray-100" />
                <div className="h-6 w-32 rounded-full bg-gray-100" />
                <div className="h-6 w-32 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const overallFundingPct = data.totalFundingTarget > 0
    ? Math.min(Math.round((data.totalFundingRaised / data.totalFundingTarget) * 100), 100)
    : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <ProgressRing
            value={overallFundingPct}
            size={140}
            strokeWidth={10}
            color="#3b82f6"
            label="Overall"
            sublabel="national progress"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">National Programme Progress</h2>
            <p className="mt-1 text-gray-600">
              {formatCurrency(data.totalFundingRaised)} raised of {formatCurrency(data.totalFundingTarget)} national target
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                🏢 {formatNumber(data.totalFoundingBusiness)} business members
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                👤 {formatNumber(data.totalFoundingConsumer)} consumer members
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                🤝 {formatNumber(data.totalBackers)} backers
              </span>
            </div>

            {/* Campaign Roll-Up Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <div className="text-lg font-bold text-gray-900">{data.activeCities}</div>
                <div className="text-[10px] text-gray-500">Active Cities</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <div className="text-lg font-bold text-gray-900">{data.campaignCount}</div>
                <div className="text-[10px] text-gray-500">Campaigns</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totalCampaignDonations)}</div>
                <div className="text-[10px] text-gray-500">Donations</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totalCampaignPledges)}</div>
                <div className="text-[10px] text-gray-500">Pledges</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <div className="text-lg font-bold text-gray-900">{data.totalCities}</div>
                <div className="text-[10px] text-gray-500">Total Cities</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
