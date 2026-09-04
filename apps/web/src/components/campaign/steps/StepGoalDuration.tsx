import type { CampaignFormData } from "../CampaignBuilder";

interface Props {
  formData: CampaignFormData;
  onUpdate: (updates: Partial<CampaignFormData>) => void;
}

const CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

export function StepGoalDuration({ formData, onUpdate }: Props) {
  const goalAmount = parseInt(formData.goalAmount) || 0;
  const platformFee = parseInt(formData.platformFee) || 0;
  const feeAmount = Math.round((goalAmount * platformFee) / 100);
  const netAmount = goalAmount - feeAmount;

  // Minimum deadline is 1 day from now
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Goal & Duration</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set your funding goal and how long your campaign will run.
        </p>
      </div>

      {/* Funding Goal */}
      <div>
        <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700">
          Funding Goal <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1.5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {CURRENCIES.find((c) => c.code === formData.currency)?.symbol || "£"}
          </span>
          <input
            id="goalAmount"
            type="number"
            min="1"
            value={formData.goalAmount}
            onChange={(e) => onUpdate({ goalAmount: e.target.value })}
            placeholder="0"
            className="input-field pl-8"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Set a realistic goal. You must reach your goal to receive funds.
        </p>
      </div>

      {/* Currency */}
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
          Currency
        </label>
        <select
          id="currency"
          value={formData.currency}
          onChange={(e) => onUpdate({ currency: e.target.value })}
          className="input-field mt-1.5"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Campaign Deadline */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
          Campaign Deadline <span className="text-red-500">*</span>
        </label>
        <input
          id="deadline"
          type="date"
          min={minDateStr}
          value={formData.deadline}
          onChange={(e) => onUpdate({ deadline: e.target.value })}
          className="input-field mt-1.5"
        />
        <p className="mt-1 text-xs text-gray-500">
          Campaigns with longer durations may not create urgency. We recommend 30-60 days.
        </p>
      </div>

      {/* Platform Fee */}
      <div>
        <label htmlFor="platformFee" className="block text-sm font-medium text-gray-700">
          Platform Fee (%)
        </label>
        <div className="relative mt-1.5">
          <input
            id="platformFee"
            type="number"
            min="0"
            max="20"
            value={formData.platformFee}
            onChange={(e) => onUpdate({ platformFee: e.target.value })}
            placeholder="0"
            className="input-field pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional fee deducted from donations. 0% means no platform fee.
        </p>
      </div>

      {/* Fee Summary */}
      {goalAmount > 0 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700">Goal Summary</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Funding Goal</span>
              <span className="font-medium">
                {formData.currency} {goalAmount.toLocaleString()}
              </span>
            </div>
            {platformFee > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee ({platformFee}%)</span>
                  <span className="font-medium text-red-600">
                    -{formData.currency} {feeAmount.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">You'll Receive</span>
                    <span className="font-bold text-green-600">
                      {formData.currency} {netAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Duration Helper */}
      {formData.deadline && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Campaign Duration</p>
              <p className="mt-1 text-sm text-blue-700">
                Your campaign will run for{" "}
                <strong>
                  {Math.ceil(
                    (new Date(formData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
