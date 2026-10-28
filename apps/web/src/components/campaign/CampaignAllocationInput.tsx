import { useMemo } from "react";
import { PieChart } from "lucide-react";

export interface CampaignAllocationEntry {
  destinationId: string;
  percentage: number;
}

export interface CampaignAllocationDestinationOption {
  id: string;
  name: string;
  description?: string;
  percentage?: string;
  fixedAmount?: string;
}

interface Props {
  destinations: CampaignAllocationDestinationOption[];
  required?: boolean;
  allowSplit?: boolean;
  maxDestinations?: string;
  value: CampaignAllocationEntry[];
  amountPence: number;
  onChange: (value: CampaignAllocationEntry[]) => void;
}

export function CampaignAllocationInput({
  destinations,
  required = false,
  allowSplit = true,
  maxDestinations,
  value,
  amountPence,
  onChange,
}: Props) {
  const maxSelected = Math.max(1, Number(maxDestinations) || destinations.length);
  const totalPercentage = useMemo(
    () => value.reduce((sum, entry) => sum + entry.percentage, 0),
    [value],
  );

  const update = (destinationId: string, percentage: number) => {
    const safe = Math.max(0, Math.min(100, Math.round(percentage)));
    const existing = value.find((entry) => entry.destinationId === destinationId);

    if (!allowSplit) {
      onChange(safe > 0 ? [{ destinationId, percentage: safe }] : []);
      return;
    }

    let next = existing
      ? value.map((entry) =>
          entry.destinationId === destinationId ? { ...entry, percentage: safe } : entry,
        )
      : [...value, { destinationId, percentage: safe }];
    next = next.filter((entry) => entry.percentage > 0);

    if (next.length > maxSelected) {
      next = next.slice(0, maxSelected);
    }
    onChange(next);
  };

  if (destinations.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <PieChart className="mt-0.5 h-5 w-5 text-primary-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Funding Allocation</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {required
              ? "Choose where your contribution should go."
              : "Optionally split your contribution across destinations."}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {destinations.map((destination) => {
          const entry = value.find((item) => item.destinationId === destination.id);
          return (
            <div
              key={destination.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{destination.name}</p>
                  {destination.description && (
                    <p className="text-xs text-gray-500">{destination.description}</p>
                  )}
                </div>
                <div className="relative w-24 flex-shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={entry?.percentage ?? 0}
                    onChange={(e) =>
                      update(destination.id, Number(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-7 text-right text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={totalPercentage > 100 ? "text-red-600" : "text-gray-500"}>
          {totalPercentage}% allocated
        </span>
        <span className="text-gray-500">
          £{((amountPence * totalPercentage) / 100 / 100).toFixed(2)} allocated
        </span>
      </div>

      {totalPercentage > 100 && (
        <p className="mt-1 text-xs text-red-600">
          Allocation cannot exceed 100% of your contribution.
        </p>
      )}
      {totalPercentage > 0 && totalPercentage < 100 && (
        <p className="mt-1 text-xs text-amber-600">
          Allocation must total 100% before continuing.
        </p>
      )}
    </div>
  );
}
