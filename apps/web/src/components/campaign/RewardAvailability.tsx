// =============================================================================
// Reward Availability — Quantity limits, time windows, claim deadlines.
// =============================================================================

import { Clock, Users } from "lucide-react";

interface Props {
  quantityType: "unlimited" | "limited";
  quantityLimit: string;
  availableFrom: string;
  availableUntil: string;
  claimDeadlineDays: string;
  onChange: (updates: {
    quantityType?: "unlimited" | "limited";
    quantityLimit?: string;
    availableFrom?: string;
    availableUntil?: string;
    claimDeadlineDays?: string;
  }) => void;
}

export function RewardAvailability({
  quantityType,
  quantityLimit,
  availableFrom,
  availableUntil,
  claimDeadlineDays,
  onChange,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary-600" />
        Availability
      </h4>

      {/* Quantity */}
      <div className="mb-3">
        <label className="block text-[10px] font-medium text-gray-500 mb-1">
          <Users className="inline h-3 w-3 mr-1" />
          Quantity
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ quantityType: "unlimited" })}
            className={`flex-1 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
              quantityType === "unlimited"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            Unlimited
          </button>
          <button
            type="button"
            onClick={() => onChange({ quantityType: "limited" })}
            className={`flex-1 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
              quantityType === "limited"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            Limited
          </button>
        </div>
        {quantityType === "limited" && (
          <input
            type="number"
            min="1"
            value={quantityLimit}
            onChange={e => onChange({ quantityLimit: e.target.value })}
            placeholder="Max quantity available"
            className="w-full mt-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none"
          />
        )}
      </div>

      {/* Time Window */}
      <div className="mb-3">
        <label className="block text-[10px] font-medium text-gray-500 mb-1">
          Availability Period (optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">From</label>
            <input
              type="datetime-local"
              value={availableFrom}
              onChange={e => onChange({ availableFrom: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Until</label>
            <input
              type="datetime-local"
              value={availableUntil}
              onChange={e => onChange({ availableUntil: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Claim Deadline */}
      <div>
        <label className="block text-[10px] font-medium text-gray-500 mb-1">
          Claim Deadline (days after earning)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="365"
            value={claimDeadlineDays}
            onChange={e => onChange({ claimDeadlineDays: e.target.value })}
            className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none"
          />
          <span className="text-xs text-gray-500">days</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          After earning, the participant has this many days to claim the reward.
        </p>
      </div>
    </div>
  );
}
