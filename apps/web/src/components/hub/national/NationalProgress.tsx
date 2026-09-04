// =============================================================================
// National Hub — National Progress Snapshot Section
// Overall funding and membership progress with ring charts.
// =============================================================================

import { getNationalHubSummary, formatCurrency, formatNumber } from "@/data/ukHubData";
import { ProgressRing } from "@/components/hub/ProgressRing";

export function NationalProgress() {
  const summary = getNationalHubSummary();
  const overallFundingPct = summary.totalFundingTarget > 0
    ? Math.min(Math.round((summary.totalFundingRaised / summary.totalFundingTarget) * 100), 100)
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
              {formatCurrency(summary.totalFundingRaised)} raised of {formatCurrency(summary.totalFundingTarget)} national target
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                🏢 {formatNumber(summary.totalFoundingBusiness)} business members
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                👤 {formatNumber(summary.totalFoundingConsumer)} consumer members
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                🤝 {formatNumber(summary.totalBackers)} backers
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
