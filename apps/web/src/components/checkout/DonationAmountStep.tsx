import { useState } from "react";
import { Link } from "react-router-dom";

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500, 1000];

interface Props {
  amount: number;
  onChange: (amount: number) => void;
}

export function DonationAmountStep({ amount, onChange }: Props) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState(
    amount > 0 && !PRESET_AMOUNTS.includes(amount) ? String(amount / 100) : ""
  );

  const selectPreset = (value: number) => {
    setCustomMode(false);
    setCustomValue("");
    onChange(value);
  };

  const handleCustomChange = (val: string) => {
    setCustomValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onChange(Math.round(num * 100));
    } else {
      onChange(0);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select Amount</h3>
        <p className="mt-1 text-sm text-gray-500">Choose a preset or enter a custom amount</p>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
        {PRESET_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectPreset(value)}
            className={`rounded-lg border-2 px-3 py-2.5 text-center text-sm font-medium transition-all ${
              amount === value && !customMode
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            ${value >= 1000 ? `${value / 1000}k` : value}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Custom amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={customValue}
            onChange={(e) => {
              setCustomMode(true);
              handleCustomChange(e.target.value);
            }}
            onFocus={() => setCustomMode(true)}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {amount > 0 && (
        <div className="rounded-lg bg-primary-50 px-4 py-3">
          <p className="text-sm text-primary-700">
            Your donation of <span className="font-semibold">${(amount / 100).toFixed(2)}</span> will make a difference.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Splitting across multiple causes?{" "}
        <Link to="/split" className="font-semibold text-primary-600 hover:text-primary-700">
          Plan a split contribution →
        </Link>
      </p>
    </div>
  );
}
