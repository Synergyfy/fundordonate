interface Reward {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deliveryDate?: string;
  limit?: number;
  claimedCount?: number;
  status: string;
  order?: number;
  items?: string[];
}

export interface PledgeDetails {
  amount: number;
  bonusSupport: number;
  shippingRequired: boolean;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone: string;
  coverFees: boolean;
  notes: string;
}

interface Props {
  details: PledgeDetails;
  onChange: (details: PledgeDetails) => void;
  selectedReward: Reward | null;
}

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan", "Other"];

export function PledgeDetailsStep({ details, onChange, selectedReward }: Props) {
  const minAmount = selectedReward?.amount || 1;
  const processingFee = Math.round(details.amount * 0.029 + 30);

  const update = (field: keyof PledgeDetails, value: unknown) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Pledge Details</h3>
        <p className="mt-1 text-sm text-gray-500">Customize your pledge</p>
      </div>

      {/* Amount */}
      <div className="rounded-lg border border-gray-200 p-3.5 space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Amount</h4>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Pledge amount {selectedReward && <span className="text-gray-400">(min ${minAmount})</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
            <input
              type="number"
              min={minAmount}
              value={details.amount || ""}
              onChange={(e) => update("amount", parseInt(e.target.value) || 0)}
              placeholder={String(minAmount)}
              className="input-field pl-7"
            />
          </div>
          {selectedReward && details.amount > 0 && details.amount < minAmount && (
            <p className="mt-1 text-xs text-red-500">Min for "{selectedReward.title}" is ${minAmount}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Bonus support (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
            <input
              type="number"
              min="0"
              value={details.bonusSupport || ""}
              onChange={(e) => update("bonusSupport", parseInt(e.target.value) || 0)}
              placeholder="0"
              className="input-field pl-7"
            />
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="rounded-lg border border-gray-200 p-3.5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={details.shippingRequired}
            onChange={(e) => update("shippingRequired", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Shipping required</span>
            <p className="text-xs text-gray-500">If your reward needs to be shipped</p>
          </div>
        </label>
        {details.shippingRequired && (
          <div className="mt-3 space-y-3 pl-7">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={details.shippingFirstName} onChange={(e) => update("shippingFirstName", e.target.value)} placeholder="First name" className="input-field" />
              <input type="text" value={details.shippingLastName} onChange={(e) => update("shippingLastName", e.target.value)} placeholder="Last name" className="input-field" />
            </div>
            <input type="text" value={details.shippingAddress1} onChange={(e) => update("shippingAddress1", e.target.value)} placeholder="Address line 1" className="input-field" />
            <input type="text" value={details.shippingAddress2} onChange={(e) => update("shippingAddress2", e.target.value)} placeholder="Address line 2 (optional)" className="input-field" />
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={details.shippingCity} onChange={(e) => update("shippingCity", e.target.value)} placeholder="City" className="input-field" />
              <input type="text" value={details.shippingState} onChange={(e) => update("shippingState", e.target.value)} placeholder="State" className="input-field" />
              <input type="text" value={details.shippingPostalCode} onChange={(e) => update("shippingPostalCode", e.target.value)} placeholder="Postal" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={details.shippingCountry} onChange={(e) => update("shippingCountry", e.target.value)} className="input-field">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="tel" value={details.shippingPhone} onChange={(e) => update("shippingPhone", e.target.value)} placeholder="Phone" className="input-field" />
            </div>
          </div>
        )}
      </div>

      {/* Fees */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3.5">
        <input
          type="checkbox"
          checked={details.coverFees}
          onChange={(e) => update("coverFees", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Cover processing fees</span>
          <p className="text-xs text-gray-500">Add ${(processingFee / 100).toFixed(2)} to help cover costs</p>
        </div>
      </label>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes (optional)</label>
        <textarea
          value={details.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
          placeholder="Message for the project creator..."
          className="input-field resize-none"
        />
      </div>
    </div>
  );
}
