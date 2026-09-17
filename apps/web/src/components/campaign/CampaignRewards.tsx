// =============================================================================
// Campaign Rewards — Public display of trigger-based reward tiers.
// Shows: trigger rule, reward name, items, fulfilment, availability.
// =============================================================================

import { Zap, Package, Download, Clock, Users, Check } from "lucide-react";

interface RewardItem {
  id?: string;
  title: string;
  description?: string;
  physicalType?: string;
  quantity?: number;
}

interface RewardTriggerConfig {
  mode: string;
  min?: number;
  max?: number;
  exact?: number;
}

interface Reward {
  id: string;
  title: string;
  description?: string;
  triggerType?: string;
  triggerConfig?: RewardTriggerConfig;
  audience?: string;
  rewardType?: string;
  items?: RewardItem[];
  quantityType?: string;
  quantityLimit?: number;
  quantityClaimed?: number;
  availableFrom?: string;
  availableUntil?: string;
  claimDeadlineDays?: number;
  fulfilmentType?: string;
}

interface Props {
  rewards?: Reward[];
  onSelectReward?: (reward: Reward) => void;
  qualificationMode?: string;
}

function fmtAmount(pence?: number) {
  if (!pence && pence !== 0) return "£0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function TriggerLabel({ config }: { config?: RewardTriggerConfig }) {
  if (!config) return <span>Any contribution</span>;

  switch (config.mode) {
    case "min":
      return <span>{fmtAmount(config.min)}+ contribution</span>;
    case "range":
      return <span>{fmtAmount(config.min)} – {fmtAmount(config.max)}</span>;
    case "exact":
      return <span>Exactly {fmtAmount(config.exact)}</span>;
    default:
      return <span>Any contribution</span>;
  }
}

function FulfilmentLabel({ type }: { type?: string }) {
  switch (type) {
    case "manual": return "Campaign team will fulfil";
    case "instruction": return "Instructions provided";
    case "external_link": return "External claim link";
    case "internal": return "Automatic delivery";
    case "mcom_vcard": return "MCOM VCard";
    case "webhook": return "External system";
    default: return "Manual";
  }
}

export function CampaignRewards({ rewards, onSelectReward, qualificationMode }: Props) {
  if (!rewards || rewards.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">No rewards defined for this campaign yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Qualification Mode Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Zap className="h-3 w-3 text-amber-500" />
        <span>
          {qualificationMode === "cumulative"
            ? "Cumulative — all qualifying rewards are granted"
            : "Highest qualifying reward only"
          }
        </span>
      </div>

      {/* Rewards List */}
      {rewards.map((reward, index) => {
        const items = reward.items || [];
        const isLimited = reward.quantityType === "limited" && reward.quantityLimit;
        const soldOut = isLimited && reward.quantityLimit && reward.quantityClaimed
          && reward.quantityClaimed >= reward.quantityLimit;

        return (
          <div
            key={reward.id}
            className={`rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
              soldOut ? "opacity-60" : ""
            }`}
          >
            {/* Header with trigger */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {reward.title || "Untitled Reward"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Zap className="h-3 w-3" />
                      <TriggerLabel config={reward.triggerConfig} />
                    </span>
                    {reward.audience && reward.audience !== "both" && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        reward.audience === "business"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}>
                        {reward.audience === "business" ? "Business" : "Consumer"}
                      </span>
                    )}
                    {soldOut && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {reward.description && (
              <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
            )}

            {/* Items */}
            {items.length > 0 && (
              <div className="mb-3 rounded-lg bg-gray-50 p-3">
                <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <Package className="h-3 w-3" /> You receive
                </h4>
                <div className="space-y-1.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] ${
                        item.physicalType === "physical"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {item.physicalType === "physical"
                          ? <Package className="h-3 w-3" />
                          : <Download className="h-3 w-3" />
                        }
                      </span>
                      <span className="text-gray-900">{item.title}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-xs text-gray-400">x{item.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
              {isLimited && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {reward.quantityLimit} available
                </span>
              )}
              {reward.claimDeadlineDays && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Claim within {reward.claimDeadlineDays} days
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3" />
                <FulfilmentLabel type={reward.fulfilmentType} />
              </span>
            </div>

            {/* Action Button */}
            {onSelectReward && !soldOut && (
              <button
                type="button"
                onClick={() => onSelectReward(reward)}
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
              >
                Back this campaign
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
