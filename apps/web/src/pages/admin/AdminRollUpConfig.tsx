// =============================================================================
// Admin — Roll-Up Configuration Page
// Configure which campaigns roll up into parent campaigns/locations,
// aggregation rules, activation thresholds, and auto-promote settings.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { hubProgressApi, type RollUpConfig, type RollUpPreview } from "@/services/hubProgress.service";
import { ALL_LOCATIONS } from "@/data/ukHubData";
import { formatCurrency } from "@/data/ukHubData";

const AGGREGATION_OPTIONS = [
  { value: "realtime", label: "Real-time", desc: "Aggregate on every contribution" },
  { value: "hourly", label: "Hourly", desc: "Batch aggregate every hour" },
  { value: "daily", label: "Daily", desc: "Aggregate once per day" },
];

const CAMPAIGN_TYPE_OPTIONS = [
  { value: "donation", label: "Donation Campaigns" },
  { value: "fund", label: "Fund Campaigns" },
  { value: "founding", label: "Founding Membership" },
  { value: "sponsor", label: "Sponsorship" },
];

export function AdminRollUpConfig() {
  const [config, setConfig] = useState<RollUpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<RollUpPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rollUpRunning, setRollUpRunning] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    hubProgressApi.getRollUpConfig().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    setSaveMessage("");
    try {
      await hubProgressApi.updateRollUpConfig(config);
      setSaveMessage("Configuration saved successfully.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }, [config]);

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const result = await hubProgressApi.previewRollUp();
      setPreview(result);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handleRunRollUp = useCallback(async () => {
    setRollUpRunning(true);
    try {
      await hubProgressApi.triggerRollUp();
      setSaveMessage("Roll-up computation triggered.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setRollUpRunning(false);
    }
  }, []);

  const updateConfig = (updates: Partial<RollUpConfig>) => {
    setConfig((prev) => prev ? { ...prev, ...updates } : null);
  };

  const toggleCampaignType = (type: string) => {
    setConfig((prev) => {
      if (!prev) return null;
      const types = prev.rollUpRules.campaignTypes;
      const newTypes = types.includes(type)
        ? types.filter((t) => t !== type)
        : [...types, type];
      return {
        ...prev,
        rollUpRules: { ...prev.rollUpRules, campaignTypes: newTypes },
      };
    });
  };

  if (loading || !config) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roll-Up Configuration</h1>
          <p className="text-sm text-gray-500">Configure how contributions aggregate across the hierarchy</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">General Settings</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium text-gray-900">Enable Roll-Up</div>
              <div className="text-sm text-gray-500">When enabled, contributions aggregate up the hierarchy</div>
            </div>
            <button
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* Auto-Promote Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium text-gray-900">Auto-Promote Status</div>
              <div className="text-sm text-gray-500">Automatically promote location status when threshold is met</div>
            </div>
            <button
              onClick={() => updateConfig({ autoPromoteStatus: !config.autoPromoteStatus })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.autoPromoteStatus ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.autoPromoteStatus ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Aggregation Settings */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Aggregation Settings</h2>

        {/* Aggregation Level */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation Frequency</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {AGGREGATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateConfig({ aggregationLevel: opt.value as RollUpConfig["aggregationLevel"] })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  config.aggregationLevel === opt.value
                    ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Activation Threshold */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activation Threshold: {config.activationThreshold}%
          </label>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={config.activationThreshold}
            onChange={(e) => updateConfig({ activationThreshold: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10%</span>
            <span>Location is promoted to ACTIVE when funding reaches this %</span>
            <span>100%</span>
          </div>
        </div>

        {/* Roll-Up Rules */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Include in Roll-Up</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {CAMPAIGN_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  config.rollUpRules.campaignTypes.includes(opt.value)
                    ? "border-primary-300 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.rollUpRules.campaignTypes.includes(opt.value)}
                  onChange={() => toggleCampaignType(opt.value)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Preview & Actions */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Preview & Actions</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {previewLoading ? "Computing..." : "Preview Roll-Up"}
          </button>
          <button
            onClick={handleRunRollUp}
            disabled={rollUpRunning}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {rollUpRunning ? "Running..." : "Run Roll-Up Now"}
          </button>
        </div>

        {/* Preview Results */}
        {preview && preview.locations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-500">Location</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Current Raised</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Projected Raised</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Status Change</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{loc.name}</td>
                    <td className="px-3 py-2 text-gray-600">{formatCurrency(loc.currentRaised)}</td>
                    <td className="px-3 py-2 text-gray-600">{formatCurrency(loc.projectedRaised)}</td>
                    <td className="px-3 py-2">
                      {loc.statusChange ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          → {loc.statusChange}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No change</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-sm text-gray-500">
              Total projected: {formatCurrency(preview.totalProjected)}
            </div>
          </div>
        )}
        {preview && preview.locations.length === 0 && (
          <p className="text-sm text-gray-500">No locations would be affected by the current roll-up.</p>
        )}
      </div>

      {/* Location Hierarchy Overview */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Location Hierarchy</h2>
        <p className="text-sm text-gray-500 mb-4">
          Contributions flow upward: High Street → Borough → City → National
        </p>
        <div className="max-h-96 overflow-y-auto">
          {ALL_LOCATIONS.filter((l) => l.type === "CITY").slice(0, 10).map((city) => {
            const children = ALL_LOCATIONS.filter((l) => l.parentId === city.id);
            return (
              <div key={city.id} className="mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span>🏙️</span>
                  <span>{city.name}</span>
                  <span className="text-xs text-gray-400">({formatCurrency(city.fundingRaised)} raised)</span>
                </div>
                {children.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {children.slice(0, 3).map((borough) => (
                      <div key={borough.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <span>🏘️</span>
                        <span>{borough.name}</span>
                        <span className="text-gray-400">({formatCurrency(borough.fundingRaised)})</span>
                      </div>
                    ))}
                    {children.length > 3 && (
                      <div className="text-xs text-gray-400">+{children.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
