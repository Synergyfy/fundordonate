// =============================================================================
// Admin — Target Calculation Management
// View and manage location metrics and target calculations.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  targetCalculationApi,
  type TargetCalculation,
  type TargetCalculationConfig,
  type BulkImportResult,
} from "@/services/targetCalculation.service";
import { ArrowLeft, Calculator, Upload, Check, Settings, RefreshCw, Edit, Save } from "lucide-react";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CALCULATED: "bg-blue-100 text-blue-700",
  OVERRIDDEN: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Sheffield", "Bristol",
  "Newcastle", "Nottingham", "Southampton", "Leicester", "Coventry", "Bradford",
  "Cardiff", "Belfast", "Edinburgh", "Glasgow", "Swansea", "Oxford", "Cambridge",
  "Brighton", "Bath", "Exeter", "Norwich", "York", "Chester", "Durham", "Winchester",
];

export default function AdminTargetCalculationPage() {
  const [calculations, setCalculations] = useState<TargetCalculation[]>([]);
  const [config, setConfig] = useState<TargetCalculationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"calculations" | "config" | "import">("calculations");
  const [importData, setImportData] = useState("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState<Partial<TargetCalculationConfig>>({});
  const [recalculating, setRecalculating] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{ calc: TargetCalculation } | null>(null);
  const [overrideTarget, setOverrideTarget] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    Promise.all([
      targetCalculationApi.getAllCalculations(),
      targetCalculationApi.getConfig(),
    ]).then(([calcs, cfg]) => {
      setCalculations(calcs);
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    await targetCalculationApi.recalculateAll();
    const updated = await targetCalculationApi.getAllCalculations();
    setCalculations(updated);
    setRecalculating(false);
    alert("All targets recalculated!");
  };

  const handleOverride = async () => {
    if (!overrideModal || !overrideTarget) return;
    const updated = await targetCalculationApi.overrideTarget(
      overrideModal.calc.locationId,
      Math.round(Number(overrideTarget) * 100),
      overrideReason
    );
    if (updated) {
      setCalculations(calculations.map((c) => c.locationId === updated.locationId ? updated : c));
    }
    setOverrideModal(null);
    setOverrideTarget("");
    setOverrideReason("");
  };

  const handleApprove = async (locationId: string) => {
    const updated = await targetCalculationApi.approveTarget(locationId);
    if (updated) {
      setCalculations(calculations.map((c) => c.locationId === updated.locationId ? updated : c));
    }
  };

  const handleSaveConfig = async () => {
    const updated = await targetCalculationApi.updateConfig(configDraft);
    if (updated) {
      setConfig(updated);
      setEditingConfig(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importData.trim()) return;
    setImporting(true);

    // Parse CSV data
    const lines = importData.trim().split("\n");
    if (lines.length < 2) {
      setImporting(false);
      return;
    }
    const firstLine = lines[0];
    if (!firstLine) {
      setImporting(false);
      return;
    }
    const headers = firstLine.split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",");
      const row: any = {};
      headers.forEach((header, i) => {
        const value = values[i]?.trim();
        if (header === "location" || header === "city" || header === "name") {
          row.location = value;
        } else if (header === "population") {
          row.population = Number(value) || undefined;
        } else if (header === "density") {
          row.density = Number(value) || undefined;
        } else if (header === "area" || header === "areasize" || header === "area_size") {
          row.areaSize = Number(value) || undefined;
        } else if (header === "economic" || header === "economicindex" || header === "economic_index") {
          row.economicIndex = Number(value) || undefined;
        }
      });
      return row;
    }).filter((r) => r.location);

    const result = await targetCalculationApi.bulkImport(rows);
    setImportResult(result);
    setImporting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading target calculations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Target Calculation</h1>
              <p className="mt-1 text-gray-600">Calculate funding targets based on real location data.</p>
            </div>
            <button
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate All"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { id: "calculations", label: "Calculations", icon: Calculator },
            { id: "config", label: "Configuration", icon: Settings },
            { id: "import", label: "Bulk Import", icon: Upload },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calculations Tab */}
        {activeTab === "calculations" && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Population</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Density</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Calculated</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Final Target</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No calculations found. Click "Recalculate All" to generate targets.
                      </td>
                    </tr>
                  ) : (
                    calculations.map((calc) => (
                      <tr key={calc.locationId} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{calc.locationName || calc.locationId}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{calc.inputs.population?.toLocaleString() || "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{calc.inputs.density?.toLocaleString() || "—"}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(calc.calculatedTarget)}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary-700">{formatCurrency(calc.finalTarget)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[calc.status] || "bg-gray-100 text-gray-700"}`}>
                            {calc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setOverrideModal({ calc })}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Override target"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {calc.status !== "APPROVED" && (
                              <button
                                onClick={() => handleApprove(calc.locationId)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                title="Approve target"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === "config" && config && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Calculation Configuration</h2>
              <button
                onClick={() => setEditingConfig(!editingConfig)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                {editingConfig ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Weights */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Calculation Weights</h3>
                <div className="space-y-3">
                  {Object.entries(config.defaultWeights).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </label>
                      {editingConfig ? (
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          value={(configDraft.defaultWeights?.[key as keyof typeof config.defaultWeights] ?? value) as number}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              defaultWeights: {
                                ...(configDraft.defaultWeights || config.defaultWeights),
                                [key]: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{(value * 100).toFixed(0)}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Multipliers */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Multipliers & Limits</h3>
                <div className="space-y-3">
                  {[
                    { key: "populationMultiplier", label: "Population Multiplier (£/person)" },
                    { key: "densityMultiplier", label: "Density Multiplier" },
                    { key: "economicMultiplier", label: "Economic Multiplier" },
                    { key: "minTarget", label: "Minimum Target" },
                    { key: "maxTarget", label: "Maximum Target" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      {editingConfig ? (
                        <input
                          type="number"
                          value={(configDraft as any)?.[key] ?? (config as any)[key]}
                          onChange={(e) => setConfigDraft({ ...configDraft, [key]: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{formatCurrency((config as any)[key])}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {editingConfig && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setEditingConfig(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
                >
                  <Save className="h-4 w-4" />
                  Save Configuration
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bulk Import Tab */}
        {activeTab === "import" && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Bulk Import Location Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Import population, density, area, and economic data for UK cities. Paste CSV data with columns: location, population, density, areaSize, economicIndex
            </p>

            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
              placeholder="location,population,density,areaSize,economicIndex
London,8982000,5598,1572,78
Birmingham,1145000,4221,267,62
Manchester,553000,4719,117,65
Leeds,793000,1420,559,60
Liverpool,498000,4192,119,55"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm focus:border-primary-500 focus:outline-none"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  const csv = UK_CITIES.map((city) => `${city},,,,\n`).join("");
                  setImportData(`location,population,density,areaSize,economicIndex\n${csv}`);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Load UK Cities Template
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!importData.trim() || importing}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {importing ? "Importing..." : "Import Data"}
              </button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="mt-6 rounded-xl border p-4">
                <h3 className="font-bold text-gray-900 mb-2">Import Results</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-2xl font-bold text-gray-900">{importResult.totalRows}</div>
                    <div className="text-xs text-gray-500">Total Rows</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="text-2xl font-bold text-green-700">{importResult.successCount}</div>
                    <div className="text-xs text-gray-500">Success</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <div className="text-2xl font-bold text-red-700">{importResult.errorCount}</div>
                    <div className="text-xs text-gray-500">Errors</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <div className="text-2xl font-bold text-amber-700">{importResult.skippedCount}</div>
                    <div className="text-xs text-gray-500">Skipped</div>
                  </div>
                </div>

                {importResult.results.some((r) => r.error) && (
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Errors:</h4>
                    {importResult.results
                      .filter((r) => r.error)
                      .map((r, i) => (
                        <div key={i} className="text-xs text-red-600 mb-1">
                          {r.location}: {r.error}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Override Modal */}
        {overrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Override Target</h2>
              <p className="text-sm text-gray-600 mb-4">
                Override the calculated target for {overrideModal.calc.locationName || overrideModal.calc.locationId}.
              </p>

              <div className="rounded-xl bg-gray-50 p-3 mb-4">
                <div className="text-sm text-gray-600">Calculated Target</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(overrideModal.calc.calculatedTarget)}</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Target (£)</label>
                  <input
                    type="number"
                    value={overrideTarget}
                    onChange={(e) => setOverrideTarget(e.target.value)}
                    placeholder={(overrideModal.calc.calculatedTarget / 100).toString()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Override</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setOverrideModal(null)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverride}
                  disabled={!overrideTarget || !overrideReason}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Save Override
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
