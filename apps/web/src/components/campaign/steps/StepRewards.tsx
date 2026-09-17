import { useState } from "react";
import type { CampaignFormData } from "../CampaignBuilder";
import { RewardManager } from "../RewardManager";

interface Props {
  formData: CampaignFormData;
  onUpdate: (updates: Partial<CampaignFormData>) => void;
}

export function StepRewards({ formData, onUpdate }: Props) {
  const [qualificationMode, setQualificationMode] = useState<"highest" | "cumulative">("highest");

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reward Tiers</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define trigger-based rewards. IF a participant qualifies → THEN they earn the reward.
        </p>
      </div>

      <RewardManager
        rewards={formData.rewards}
        onChangeRewards={rewards => onUpdate({ rewards })}
        qualificationMode={qualificationMode}
        onChangeQualificationMode={setQualificationMode}
      />
    </div>
  );
}
