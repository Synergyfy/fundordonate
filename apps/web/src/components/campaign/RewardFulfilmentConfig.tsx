// =============================================================================
// Reward Fulfilment Config — How each reward item is delivered to the user.
// Supports: manual, instruction, external_link, webhook, internal, mcom_vcard.
// =============================================================================

import { Truck } from "lucide-react";
import type { RewardFulfilmentFormData } from "./RewardManager";

interface Props {
  fulfilmentType: string;
  fulfilmentConfig: RewardFulfilmentFormData;
  onChange: (updates: { fulfilmentType?: string; fulfilmentConfig?: RewardFulfilmentFormData }) => void;
}

const FULFILMENT_OPTIONS = [
  { value: "manual", label: "Manual", desc: "Campaign team handles delivery" },
  { value: "instruction", label: "Instruction", desc: "Show instructions to the user" },
  { value: "external_link", label: "External Link", desc: "Redirect to external URL" },
  { value: "internal", label: "Internal", desc: "System delivers automatically" },
  { value: "mcom_vcard", label: "MCOM VCard", desc: "Generate via MCOM VCard" },
  { value: "webhook", label: "Webhook", desc: "Notify external system via API" },
];

export function RewardFulfilmentConfig({
  fulfilmentType,
  fulfilmentConfig,
  onChange,
}: Props) {
  const updateConfig = (updates: Partial<RewardFulfilmentFormData>) => {
    onChange({ fulfilmentConfig: { ...fulfilmentConfig, ...updates } });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Truck className="h-4 w-4 text-primary-600" />
        Fulfilment
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        How will this reward be delivered to the participant?
      </p>

      {/* Fulfilment Type Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {FULFILMENT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ fulfilmentType: opt.value })}
            className={`rounded-lg border-2 px-3 py-2 text-left transition-colors ${
              fulfilmentType === opt.value
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`text-xs font-bold ${
              fulfilmentType === opt.value ? "text-primary-700" : "text-gray-900"
            }`}>
              {opt.label}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Config Fields based on type */}
      {fulfilmentType === "external_link" && (
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1">
            External URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={fulfilmentConfig.url}
            onChange={e => updateConfig({ url: e.target.value })}
            placeholder="https://example.com/claim"
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none"
          />
        </div>
      )}

      {fulfilmentType === "webhook" && (
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1">
            Webhook URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={fulfilmentConfig.webhookUrl}
            onChange={e => updateConfig({ webhookUrl: e.target.value })}
            placeholder="https://api.example.com/webhook"
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none"
          />
        </div>
      )}

      {fulfilmentType === "instruction" && (
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1">
            Instructions to show <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fulfilmentConfig.instructions}
            onChange={e => updateConfig({ instructions: e.target.value })}
            placeholder="e.g. Visit our store at 123 High Street with your reward code..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none resize-none"
          />
        </div>
      )}

      {fulfilmentType === "manual" && (
        <div className="rounded-lg bg-gray-100 p-2.5 text-xs text-gray-600">
          The campaign team will handle fulfilment manually. The participant will see:
          <em className="block mt-1">"Your reward will be delivered by the campaign team."</em>
        </div>
      )}

      {fulfilmentType === "internal" && (
        <div className="rounded-lg bg-gray-100 p-2.5 text-xs text-gray-600">
          The system will deliver this reward automatically when claimed. Ensure the item has a valid digital asset configured.
        </div>
      )}

      {fulfilmentType === "mcom_vcard" && (
        <div className="rounded-lg bg-gray-100 p-2.5 text-xs text-gray-600">
          Reward will be fulfilled via MCOM VCard integration. Configure the VCard template in the integrations panel.
        </div>
      )}
    </div>
  );
}
