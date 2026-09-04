interface Reward {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deliveryDate?: string;
  limit?: number;
  claimedCount?: number;
  status: string;
  order?: number;
  items?: string[];
}

interface Props {
  rewards: Reward[];
  selectedRewardId: string;
  onChange: (rewardId: string) => void;
}

export function PledgeRewardStep({ rewards, selectedRewardId, onChange }: Props) {
  const activeRewards = rewards
    .filter((r) => r.status === "active")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select Reward</h3>
        <p className="mt-1 text-sm text-gray-500">Choose a reward tier or pledge without one</p>
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3.5 transition-all ${
          selectedRewardId === ""
            ? "border-primary-500 bg-primary-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="radio"
          name="reward"
          checked={selectedRewardId === ""}
          onChange={() => onChange("")}
          className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Pledge without a reward</span>
          <p className="text-xs text-gray-500">Support without selecting a tier</p>
        </div>
      </label>

      {activeRewards.map((reward) => {
        const isSoldOut = reward.limit !== undefined && reward.claimedCount !== undefined
          ? reward.claimedCount >= reward.limit
          : false;

        return (
          <label
            key={reward.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3.5 transition-all ${
              isSoldOut
                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                : selectedRewardId === reward.id
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="reward"
              checked={selectedRewardId === reward.id}
              onChange={() => !isSoldOut && onChange(reward.id)}
              disabled={isSoldOut}
              className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">{reward.title}</span>
                <span className="text-sm font-bold text-primary-600 whitespace-nowrap">
                  ${reward.amount.toLocaleString()}
                </span>
              </div>
              {reward.description && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{reward.description}</p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                {reward.deliveryDate && (
                  <span>Est. {new Date(reward.deliveryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                )}
                {reward.limit !== undefined && (
                  <span>{isSoldOut ? "Sold out" : `${reward.claimedCount || 0}/${reward.limit} claimed`}</span>
                )}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
