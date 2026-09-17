// =============================================================================
// Season Wizard
// Simple season creation form. Other configurations (activation, campaigns,
// rewards, etc.) are done when creating those items in their own pages.
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { seasonApi } from "@/services/season.service";
import { ArrowLeft, Check } from "lucide-react";

export default function SeasonWizardPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "DRAFT" as "DRAFT" | "SCHEDULED",
  });

  const update = (patch: Partial<typeof data>) => setData((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    await seasonApi.create({
      name: data.name,
      programmeName: "UK Activation Programme",
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      overallTarget: 0,
      nationalTarget: 0,
      cityTargetDefault: 0,
      localAreaTargetDefault: 0,
      highStreetTargetDefault: 0,
      businessCampaignTargetDefault: 0,
      activationScope: { nationalEnabled: true, cities: [] },
      participationConfig: { consumerParticipation: true, businessOwnerParticipation: true, backerEnabled: true, foundingMemberEnabled: true, foundingMemberMonthlyEnabled: true },
      engagementConfig: { rewardsEnabled: true, incentivesEnabled: true, leaderboardsEnabled: true, recognitionEnabled: true, leaderboardScopes: ["NATIONAL", "CITY"] },
      spilloverConfig: { onTargetReached: "CONTINUE_CAMPAIGN", surplusHandling: "CARRY_FORWARD_TO_NEXT_SEASON", allowTargetExtension: true, allowCarryForward: true },
      communicationConfig: {},
    });
    setSaving(false);
    navigate("/admin/seasons");
  };

  const canSave = data.name.trim().length > 0 && data.startDate && data.endDate;

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate("/admin/seasons")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Seasons
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Season</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create a new season. Campaigns, activations, rewards, and other configurations
        are set up in their respective pages and linked to this season.
      </p>

      <div className="rounded-xl bg-white border p-6 space-y-5">
        {/* Season Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="e.g. Autumn 2026"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            rows={3}
            placeholder="Brief description of this season..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
          <div className="flex gap-3">
            {(["DRAFT", "SCHEDULED"] as const).map((status) => (
              <label
                key={status}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  data.status === status
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  checked={data.status === status}
                  onChange={() => update({ status })}
                  className="text-primary-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{status}</div>
                  <div className="text-[10px] text-gray-500">
                    {status === "DRAFT" ? "Being configured" : "Scheduled for future"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> After creating the season, you can configure campaigns, activations,
            rewards, leaderboards, and other settings in their respective admin pages. Each item
            will let you select which season it belongs to.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Create Season
        </button>
        <button
          onClick={() => navigate("/admin/seasons")}
          className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
