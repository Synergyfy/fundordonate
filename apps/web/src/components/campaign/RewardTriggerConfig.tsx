// =============================================================================
// Reward Trigger Config — Configures WHEN a reward becomes available.
// Phase 1: Contribution-based triggers (min, range, exact).
// =============================================================================

import { Zap } from "lucide-react";
import type { RewardTriggerFormData } from "./RewardManager";

interface Props {
  triggerConfig: RewardTriggerFormData;
  onChange: (config: RewardTriggerFormData) => void;
}

function fmtAmount(v: string) {
  const n = Number(v);
  return isNaN(n) || n === 0 ? "" : n.toLocaleString("en-GB");
}

export function RewardTriggerConfig({ triggerConfig, onChange }: Props) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-amber-600" />
        Reward Trigger
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        What does the participant need to do to qualify for this reward?
      </p>

      {/* Trigger Type */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Trigger Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...triggerConfig, mode: "min" })}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${
              triggerConfig.mode === "min"
                ? "border-amber-500 bg-amber-100 text-amber-800"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-bold">Minimum Contribution</div>
            <div className="text-[10px] mt-0.5 opacity-70">£X+ contribution</div>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...triggerConfig, mode: "range" })}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${
              triggerConfig.mode === "range"
                ? "border-amber-500 bg-amber-100 text-amber-800"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-bold">Contribution Range</div>
            <div className="text-[10px] mt-0.5 opacity-70">£X – £Y range</div>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...triggerConfig, mode: "exact" })}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${
              triggerConfig.mode === "exact"
                ? "border-amber-500 bg-amber-100 text-amber-800"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-bold">Exact Contribution</div>
            <div className="text-[10px] mt-0.5 opacity-70">Exactly £X</div>
          </button>
        </div>
      </div>

      {/* Amount Inputs */}
      <div className="grid gap-3" style={{ gridTemplateColumns: triggerConfig.mode === "range" ? "1fr 1fr" : triggerConfig.mode === "exact" ? "1fr" : "1fr" }}>
        {(triggerConfig.mode === "min" || triggerConfig.mode === "range") && (
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1">
              Minimum Amount (£) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">£</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={triggerConfig.min}
                onChange={e => onChange({ ...triggerConfig, min: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            {triggerConfig.mode === "min" && (
              <p className="text-[10px] text-gray-400 mt-1">
                IF contribution &ge; £{fmtAmount(triggerConfig.min) || "0"} → reward earned
              </p>
            )}
          </div>
        )}

        {triggerConfig.mode === "range" && (
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1">
              Maximum Amount (£) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">£</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={triggerConfig.max}
                onChange={e => onChange({ ...triggerConfig, max: e.target.value })}
                placeholder="99.99"
                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              IF £{fmtAmount(triggerConfig.min) || "0"} &le; contribution &le; £{fmtAmount(triggerConfig.max) || "0"} → reward earned
            </p>
          </div>
        )}

        {triggerConfig.mode === "exact" && (
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1">
              Exact Amount (£) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">£</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={triggerConfig.exact}
                onChange={e => onChange({ ...triggerConfig, exact: e.target.value })}
                placeholder="50.00"
                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              IF contribution = £{fmtAmount(triggerConfig.exact) || "0"} → reward earned
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
