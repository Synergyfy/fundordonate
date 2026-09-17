// =============================================================================
// Campaign Reward Manager — Trigger-Based System
// Admin creates rewards with trigger rules, items, availability, fulfilment.
// TRIGGER → REWARD → ITEMS → FULFILMENT
// =============================================================================

import { useState } from "react";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Zap, Gift, Settings,
} from "lucide-react";
import { RewardTriggerConfig } from "./RewardTriggerConfig";
import { RewardItemsManager } from "./RewardItemsManager";
import { RewardAvailability } from "./RewardAvailability";
import { RewardFulfilmentConfig } from "./RewardFulfilmentConfig";

/* ───────── Types ───────── */

export interface RewardTriggerFormData {
  mode: "min" | "range" | "exact";
  min: string;
  max: string;
  exact: string;
}

export interface RewardItemFormData {
  id: string;
  title: string;
  description: string;
  physicalType: "physical" | "digital";
  assetType: "file" | "url" | "";
  assetUrl: string;
  assetFileName: string;
  quantity: string;
  order: number;
}

export interface RewardFulfilmentFormData {
  type: string;
  url: string;
  webhookUrl: string;
  instructions: string;
}

export interface RewardFormData {
  id: string;
  title: string;
  description: string;
  order: number;

  // ── Trigger ──
  triggerType: string;
  triggerConfig: RewardTriggerFormData;

  // ── Audience ──
  audience: "business" | "consumer" | "both";

  // ── Availability ──
  quantityType: "unlimited" | "limited";
  quantityLimit: string;
  availableFrom: string;
  availableUntil: string;
  claimDeadlineDays: string;

  // ── Fulfilment ──
  fulfilmentType: string;
  fulfilmentConfig: RewardFulfilmentFormData;

  // ── Display ──
  image: string;
  rewardType: string;

  // ── Items ──
  items: RewardItemFormData[];
}

/* ───────── Helpers ───────── */

let rewardCounter = 0;
function nextRewardId() {
  return `reward-${++rewardCounter}-${Date.now()}`;
}

let itemCounter = 0;
function nextItemId() {
  return `item-${++itemCounter}-${Date.now()}`;
}

function createEmptyReward(): RewardFormData {
  return {
    id: nextRewardId(),
    title: "",
    description: "",
    order: 0,
    triggerType: "contribution",
    triggerConfig: { mode: "min", min: "", max: "", exact: "" },
    audience: "both",
    quantityType: "unlimited",
    quantityLimit: "",
    availableFrom: "",
    availableUntil: "",
    claimDeadlineDays: "30",
    fulfilmentType: "manual",
    fulfilmentConfig: { type: "manual", url: "", webhookUrl: "", instructions: "" },
    image: "",
    rewardType: "standard",
    items: [],
  };
}

function createEmptyItem(): RewardItemFormData {
  return {
    id: nextItemId(),
    title: "",
    description: "",
    physicalType: "digital",
    assetType: "",
    assetUrl: "",
    assetFileName: "",
    quantity: "1",
    order: 0,
  };
}

/* ───────── Trigger Summary ───────── */

function TriggerSummary({ config }: { config: RewardTriggerFormData }) {
  const fmtAmount = (v: string) => {
    const n = Number(v);
    return isNaN(n) ? "£0" : `£${n.toLocaleString("en-GB")}`;
  };

  switch (config.mode) {
    case "min":
      return <span>{fmtAmount(config.min)}+ contribution</span>;
    case "range":
      return <span>{fmtAmount(config.min)} – {fmtAmount(config.max)}</span>;
    case "exact":
      return <span>Exactly {fmtAmount(config.exact)}</span>;
    default:
      return <span>Not configured</span>;
  }
}

/* ───────── Main Component ───────── */

interface RewardManagerProps {
  rewards: RewardFormData[];
  onChangeRewards: (rewards: RewardFormData[]) => void;
  qualificationMode: "highest" | "cumulative";
  onChangeQualificationMode: (mode: "highest" | "cumulative") => void;
}

export function RewardManager({
  rewards,
  onChangeRewards,
  qualificationMode,
  onChangeQualificationMode,
}: RewardManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hasRewards, setHasRewards] = useState(rewards.length > 0);

  const addReward = () => {
    const newReward = createEmptyReward();
    onChangeRewards([...rewards, newReward]);
    setExpandedId(newReward.id);
    setHasRewards(true);
  };

  const updateReward = (id: string, updates: Partial<RewardFormData>) => {
    onChangeRewards(rewards.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeReward = (id: string) => {
    const next = rewards.filter(r => r.id !== id);
    onChangeRewards(next);
    if (expandedId === id) setExpandedId(null);
    if (next.length === 0) setHasRewards(false);
  };

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const items = [...rewards];
    const draggedIdx = items.findIndex(r => r.id === draggedId);
    const targetIdx = items.findIndex(r => r.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const dragged = items[draggedIdx]!;
    items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, dragged);
    onChangeRewards(items);
  };

  const handleDragEnd = () => setDraggedId(null);

  return (
    <div className="space-y-6">
      {/* ── Campaign Qualification Mode ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-primary-600" />
          Reward Qualification Mode
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          How are rewards granted when a participant qualifies for multiple?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChangeQualificationMode("highest")}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              qualificationMode === "highest"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-bold">Highest Only</div>
            <div className="text-[10px] mt-0.5 opacity-70">
              £200 contribution → gets the £50 reward (not £10 + £25 + £50)
            </div>
          </button>
          <button
            type="button"
            onClick={() => onChangeQualificationMode("cumulative")}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              qualificationMode === "cumulative"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-bold">Cumulative</div>
            <div className="text-[10px] mt-0.5 opacity-70">
              £200 contribution → gets £10 + £25 + £50 (all qualifying rewards)
            </div>
          </button>
        </div>
      </div>

      {/* ── Has Rewards Toggle ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Gift className="h-4 w-4 text-primary-600" />
          Does this campaign have rewards?
        </h3>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setHasRewards(false); onChangeRewards([]); }}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              !hasRewards
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => setHasRewards(true)}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              hasRewards
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      {/* ── Rewards List ── */}
      {hasRewards && (
        <div className="space-y-4">
          {rewards.map((reward, index) => {
            const isExpanded = expandedId === reward.id;

            return (
              <div
                key={reward.id}
                draggable
                onDragStart={() => handleDragStart(reward.id)}
                onDragOver={e => handleDragOver(e, reward.id)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border bg-white transition-shadow ${
                  draggedId === reward.id ? "shadow-lg opacity-50" : "shadow-sm"
                }`}
              >
                {/* ── Reward Header ── */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedId(isExpanded ? null : reward.id)}
                >
                  <span className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 truncate">
                        {reward.title || "Untitled Reward"}
                      </span>
                      {reward.audience !== "both" && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          reward.audience === "business"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-pink-100 text-pink-700"
                        }`}>
                          {reward.audience === "business" ? "Business" : "Consumer"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <TriggerSummary config={reward.triggerConfig} />
                      </span>
                      {reward.items.length > 0 && (
                        <span>{reward.items.length} item{reward.items.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeReward(reward.id); }}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-gray-400" />
                    : <ChevronDown className="h-4 w-4 text-gray-400" />
                  }
                </div>

                {/* ── Expanded Form ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-5">
                    {/* Name & Description */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reward Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={reward.title}
                          onChange={e => updateReward(reward.id, { title: e.target.value })}
                          placeholder="e.g. £10 Digital E-Card"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={reward.description}
                          onChange={e => updateReward(reward.id, { description: e.target.value })}
                          placeholder="What does the participant receive?"
                          rows={2}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* Audience */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Audience
                      </label>
                      <div className="flex gap-2">
                        {([
                          { value: "both", label: "Both" },
                          { value: "business", label: "Business Owner" },
                          { value: "consumer", label: "Consumer" },
                        ] as const).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateReward(reward.id, { audience: opt.value })}
                            className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                              reward.audience === opt.value
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reward Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Reward Type
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: "standard", label: "Standard" },
                          { value: "ecard", label: "E-Card" },
                          { value: "cashback", label: "Cashback" },
                          { value: "points", label: "Points" },
                          { value: "discount", label: "Discount" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateReward(reward.id, { rewardType: opt.value })}
                            className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                              reward.rewardType === opt.value
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Trigger ── */}
                    <RewardTriggerConfig
                      triggerConfig={reward.triggerConfig}
                      onChange={config => updateReward(reward.id, { triggerConfig: config })}
                    />

                    {/* ── Availability ── */}
                    <RewardAvailability
                      quantityType={reward.quantityType}
                      quantityLimit={reward.quantityLimit}
                      availableFrom={reward.availableFrom}
                      availableUntil={reward.availableUntil}
                      claimDeadlineDays={reward.claimDeadlineDays}
                      onChange={updates => updateReward(reward.id, updates)}
                    />

                    {/* ── Fulfilment ── */}
                    <RewardFulfilmentConfig
                      fulfilmentType={reward.fulfilmentType}
                      fulfilmentConfig={reward.fulfilmentConfig}
                      onChange={updates => updateReward(reward.id, updates)}
                    />

                    {/* ── Items ── */}
                    <RewardItemsManager
                      items={reward.items}
                      onChange={items => updateReward(reward.id, { items })}
                      onAddItem={() => {
                        const newItem = createEmptyItem();
                        newItem.order = reward.items.length;
                        updateReward(reward.id, { items: [...reward.items, newItem] });
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Reward Button */}
          <button
            type="button"
            onClick={addReward}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Reward
          </button>

          {rewards.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>{rewards.length}</strong> reward{rewards.length !== 1 ? "s" : ""} created.
                Drag the grip handle to reorder. Mode: {qualificationMode === "highest" ? "Highest qualifying only" : "All qualifying rewards"}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
