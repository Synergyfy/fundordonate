// =============================================================================
// City Hub — Progress Section
// Funding, activation, and founding membership summary.
// =============================================================================

import type { HubLocation } from "@/types/uk-hub";
import { getEffectiveStatus, getActivationProgress } from "@/services/locationResolver";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";
import { ProgressRing } from "@/components/hub/ProgressRing";
import { formatCurrency } from "@/data/ukHubData";

interface CityProgressProps {
  location: HubLocation;
  bizProg?: { allocatedCount: number; totalAllocation: number } | null;
  consProg?: { allocatedCount: number; totalAllocation: number } | null;
}

export function CityProgress({ location, bizProg, consProg }: CityProgressProps) {
  const effectiveStatus = getEffectiveStatus(location);
  const statusMeta = LOCATION_PUBLIC_STATUS_META[effectiveStatus];
  const activationProgress = getActivationProgress(location);
  const fundingPct = location.fundingTarget > 0
    ? Math.min(Math.round((location.fundingRaised / location.fundingTarget) * 100), 100)
    : 0;

  const bizCount = bizProg ? bizProg.allocatedCount : location.foundingBusinessAllocated;
  const bizTotal = bizProg ? bizProg.totalAllocation : location.foundingBusinessTotal;
  const consCount = consProg ? consProg.allocatedCount : location.foundingConsumerAllocated;
  const consTotal = consProg ? consProg.totalAllocation : location.foundingConsumerTotal;

  return (
    <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <ProgressRing value={fundingPct} size={80} strokeWidth={6} color={statusMeta.mapColor} label="Funding" />
            <div>
              <div className="text-sm font-medium text-gray-500">Funding</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(location.fundingRaised)}</div>
              <div className="text-xs text-gray-400">of {formatCurrency(location.fundingTarget)} target</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ProgressRing value={activationProgress} size={80} strokeWidth={6} color="#3b82f6" label="Activation" />
            <div>
              <div className="text-sm font-medium text-gray-500">Activation</div>
              <div className="text-lg font-bold text-gray-900">{activationProgress}%</div>
              <div className="text-xs text-gray-400">progress toward active</div>
            </div>
          </div>

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
      </div>
    </section>
  );
}
