// =============================================================================
// Target Calculation Display
// Shows how a target was calculated on city/hub pages.
// =============================================================================

import { useState, useEffect } from "react";
import { targetCalculationApi, type TargetCalculation } from "@/services/targetCalculation.service";
import { Calculator, Info, ChevronDown, ChevronUp } from "lucide-react";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

interface TargetCalculationDisplayProps {
  locationId: string;
  variant?: "compact" | "full";
}

export function TargetCalculationDisplay({ locationId, variant = "full" }: TargetCalculationDisplayProps) {
  const [calculation, setCalculation] = useState<TargetCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    targetCalculationApi.getTargetCalculation(locationId).then((data) => {
      setCalculation(data);
      setLoading(false);
    });
  }, [locationId]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-200 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!calculation) return null;

  const isOverridden = calculation.status === "OVERRIDDEN";
  const isApproved = calculation.status === "APPROVED";

  if (variant === "compact") {
    return (
      <div className="rounded-xl bg-primary-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-bold text-primary-700">
            Target: {formatCurrency(calculation.finalTarget)}
          </span>
        </div>
        <div className="text-xs text-primary-600">
          {isOverridden ? "Admin override" : "Based on location data"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-bold text-gray-900">Target Calculation</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {expanded ? "Hide" : "Show"} details
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Target Summary */}
      <div className="rounded-xl bg-primary-50 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-primary-600">Funding Target</div>
            <div className="text-2xl font-bold text-primary-700">{formatCurrency(calculation.finalTarget)}</div>
          </div>
          <div className="text-right">
            <div className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
              isApproved ? "bg-green-100 text-green-700" : isOverridden ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            }`}>
              {isApproved ? "Approved" : isOverridden ? "Override" : "Calculated"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-4">
          {/* Inputs Used */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Location Data Used</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Population", value: calculation.inputs.population?.toLocaleString(), key: "population" },
                { label: "Density", value: calculation.inputs.density ? `${calculation.inputs.density.toLocaleString()} /km²` : null, key: "density" },
                { label: "Area Size", value: calculation.inputs.areaSize ? `${calculation.inputs.areaSize} km²` : null, key: "areaSize" },
                { label: "Economic Index", value: calculation.inputs.economicIndex, key: "economicIndex" },
                { label: "Activity Level", value: calculation.inputs.activityLevel, key: "activityLevel" },
              ].map(({ label, value, key }) => (
                <div key={key} className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm font-bold text-gray-900">{value || "—"}</div>
                  <div className="text-[10px] text-gray-400">
                    Weight: {(calculation.weights[key as keyof typeof calculation.weights] * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weights Visualization */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Calculation Weights</h4>
            <div className="space-y-2">
              {Object.entries(calculation.weights).map(([key, weight]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${weight * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-xs font-medium text-gray-700 text-right">
                    {(weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Override Info */}
          {isOverridden && calculation.overrideReason && (
            <div className="rounded-xl bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-amber-700">Admin Override</div>
                  <div className="text-sm text-amber-600">{calculation.overrideReason}</div>
                  {calculation.approvedBy && (
                    <div className="text-xs text-amber-500 mt-1">
                      Approved by {calculation.approvedBy}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Calculation Method */}
          <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
            Method: {calculation.calculationMethod} · Last updated: {new Date(calculation.updatedAt).toLocaleDateString("en-GB")}
          </div>
        </div>
      )}
    </div>
  );
}
