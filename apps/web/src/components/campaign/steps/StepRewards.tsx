import { useState } from "react";
import type { CampaignFormData, RewardFormData } from "../CampaignBuilder";

interface Props {
  formData: CampaignFormData;
  onUpdate: (updates: Partial<CampaignFormData>) => void;
}

let rewardIdCounter = 0;
function getNextRewardId() {
  return `reward-${++rewardIdCounter}-${Date.now()}`;
}

export function StepRewards({ formData, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (formData.mode !== "crowdfunding") {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rewards</h2>
          <p className="mt-1 text-sm text-gray-500">
            Rewards are only available for crowdfunding campaigns.
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">
            Switch to crowdfunding mode in Step 1 to add reward tiers.
          </p>
        </div>
      </div>
    );
  }

  const addReward = () => {
    const newReward: RewardFormData = {
      id: getNextRewardId(),
      title: "",
      description: "",
      amount: "",
      deliveryDate: "",
      limit: "",
    };
    onUpdate({ rewards: [...formData.rewards, newReward] });
    setEditingId(newReward.id);
  };

  const updateReward = (id: string, updates: Partial<RewardFormData>) => {
    onUpdate({
      rewards: formData.rewards.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    });
  };

  const removeReward = (id: string) => {
    onUpdate({ rewards: formData.rewards.filter((r) => r.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const items = [...formData.rewards];
    const draggedIdx = items.findIndex((r) => r.id === draggedId);
    const targetIdx = items.findIndex((r) => r.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const draggedItem = items[draggedIdx]!;
    items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, draggedItem);

    onUpdate({ rewards: items });
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reward Tiers</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create reward tiers to incentivize backers. Drag to reorder.
        </p>
      </div>

      {/* Rewards List */}
      <div className="space-y-4">
        {formData.rewards.map((reward, index) => (
          <div
            key={reward.id}
            draggable
            onDragStart={() => handleDragStart(reward.id)}
            onDragOver={(e) => handleDragOver(e, reward.id)}
            onDragEnd={handleDragEnd}
            className={`rounded-lg border bg-white transition-shadow ${
              draggedId === reward.id ? "shadow-lg opacity-50" : "shadow-sm"
            } ${editingId === reward.id ? "ring-2 ring-primary-500" : ""}`}
          >
            {/* Reward Header */}
            <div
              className="flex cursor-grab items-center gap-3 px-4 py-3"
              onClick={() => setEditingId(editingId === reward.id ? null : reward.id)}
            >
              <span className="cursor-grab text-gray-400 hover:text-gray-600">⋮⋮</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {index + 1}
              </span>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{reward.title || "Untitled Reward"}</span>
                {reward.amount && (
                  <span className="ml-2 text-sm text-gray-500">
                    ${parseInt(reward.amount).toLocaleString()}+
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeReward(reward.id);
                }}
                className="text-gray-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Reward Form (expanded) */}
            {editingId === reward.id && (
              <div className="border-t border-gray-100 px-4 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reward Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reward.title}
                      onChange={(e) => updateReward(reward.id, { title: e.target.value })}
                      placeholder="e.g. Early Bird Special"
                      className="input-field mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={reward.description}
                      onChange={(e) => updateReward(reward.id, { description: e.target.value })}
                      placeholder="What does the backer get?"
                      rows={3}
                      className="input-field mt-1.5 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Min. Pledge ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={reward.amount}
                        onChange={(e) => updateReward(reward.id, { amount: e.target.value })}
                        placeholder="25"
                        className="input-field mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                      <input
                        type="date"
                        value={reward.deliveryDate}
                        onChange={(e) => updateReward(reward.id, { deliveryDate: e.target.value })}
                        className="input-field mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={reward.limit}
                        onChange={(e) => updateReward(reward.id, { limit: e.target.value })}
                        placeholder="Unlimited"
                        className="input-field mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Reward Button */}
      <button
        type="button"
        onClick={addReward}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Reward Tier
      </button>

      {formData.rewards.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            <strong>{formData.rewards.length}</strong> reward{formData.rewards.length !== 1 ? "s" : ""} created.
            Drag the ⋮⋮ handle to reorder.
          </p>
        </div>
      )}
    </div>
  );
}
