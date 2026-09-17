// =============================================================================
// Post-Payment Reward Card — Shows earned rewards after a successful contribution.
// Displays reward name, items, claim instructions, and expiry.
// =============================================================================

import { Gift, Clock, CheckCircle } from "lucide-react";

interface EarnedReward {
  entitlementId: string;
  rewardTitle: string;
  rewardDescription: string;
  expiresAt: string;
  items: { title: string; physicalType: string }[];
}

interface Props {
  rewards: EarnedReward[];
  onClaim?: (entitlementId: string) => void;
  onClose?: () => void;
}

export function PostPaymentRewardCard({ rewards, onClaim, onClose }: Props) {
  if (rewards.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <Gift className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-green-900">
            Congratulations — you&apos;ve earned a reward!
          </h3>
          <p className="text-xs text-green-700">
            Your contribution qualified you for {rewards.length} reward{rewards.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      {rewards.map((reward) => (
        <div
          key={reward.entitlementId}
          className="rounded-lg border border-green-200 bg-white p-4 space-y-3"
        >
          {/* Reward Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">{reward.rewardTitle}</h4>
              {reward.rewardDescription && (
                <p className="text-xs text-gray-600 mt-0.5">{reward.rewardDescription}</p>
              )}
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              Ready to Claim
            </span>
          </div>

          {/* Items */}
          {reward.items.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Includes</span>
              {reward.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span>{item.title}</span>
                  <span className="text-[10px] text-gray-400 uppercase">({item.physicalType})</span>
                </div>
              ))}
            </div>
          )}

          {/* Expiry */}
          {reward.expiresAt && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Clock className="h-3 w-3" />
              Claim before {new Date(reward.expiresAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {/* Claim Button */}
          {onClaim && (
            <button
              type="button"
              onClick={() => onClaim(reward.entitlementId)}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Gift className="h-3 w-3" />
              Claim Reward
            </button>
          )}
        </div>
      ))}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs text-green-700 hover:text-green-900 font-medium"
        >
          Continue to dashboard
        </button>
      )}
    </div>
  );
}
