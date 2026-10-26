import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContributionDestination } from "./ContributionDestination";
import { McomCheckoutPanel } from "@/components/payment/McomCheckoutPanel";

interface Reward {
  id: string;
  title: string;
  description?: string;
  /** Minimum qualifying contribution, in pence. */
  amount: number;
  deliveryDate?: string;
  limit?: number;
  status: string;
  order?: number;
}

interface Props {
  campaignId: string;
  campaignTitle: string;
  rewards: Reward[];
  hierarchyLevel?: string | null;
  locationName?: string;
  contributionType?: "backer" | "founding_member";
  preselectedRewardId?: string;
}

export function PledgeForm({ campaignId, campaignTitle, rewards, hierarchyLevel, locationName, contributionType, preselectedRewardId }: Props) {
  const navigate = useNavigate();
  const [selectedRewardId, setSelectedRewardId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [bonusSupport, setBonusSupport] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (pence: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

  const activeRewards = rewards
    .filter((r) => r.status === "active")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const selectedReward = activeRewards.find((r) => r.id === selectedRewardId);

  // Everything is kept in pence; the inputs are pounds.
  const pledgeAmount = Math.round((parseFloat(amount) || 0) * 100);
  const bonusAmount = Math.round((parseFloat(bonusSupport) || 0) * 100);
  const totalAmount = pledgeAmount + bonusAmount;
  const minPledgePence = selectedReward?.amount ?? 0;

  const handleRewardSelect = (rewardId: string) => {
    setSelectedRewardId(rewardId);
    setShowPayment(false);
    const reward = activeRewards.find((r) => r.id === rewardId);
    if (reward) {
      // `reward.amount` is pence; the input field is pounds.
      setAmount(String(reward.amount / 100));
    }
  };

  useEffect(() => {
    if (!preselectedRewardId) return;
    const reward = rewards.find(
      (r) => r.id === preselectedRewardId && r.status === "active",
    );
    if (!reward) return;
    setSelectedRewardId(reward.id);
    setAmount(String(reward.amount / 100));
    setShowPayment(false);
  }, [preselectedRewardId, rewards]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (pledgeAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (minPledgePence > 0 && pledgeAmount < minPledgePence) {
      setError(`Minimum for "${selectedReward?.title}" is ${formatCurrency(minPledgePence)}`);
      return;
    }
    setError("");
    setShowPayment(true);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">Back This Project</h2>
      <p className="mt-1 text-sm text-gray-500">for "{campaignTitle}"</p>

      <form onSubmit={handleContinue} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Reward Selection */}
        {activeRewards.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Select a Reward Tier</label>
            <div className="mt-2 space-y-3">
              {/* No reward option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRewardId("");
                  setAmount("");
                  setShowPayment(false);
                }}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  !selectedRewardId
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">No Reward</span>
                  <span className="text-sm text-gray-500">Pledge any amount</span>
                </div>
              </button>

              {activeRewards.map((reward) => (
                <button
                  key={reward.id}
                  type="button"
                  onClick={() => handleRewardSelect(reward.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedRewardId === reward.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{reward.title}</span>
                      <p className="mt-1 text-sm text-primary-600">
                        {formatCurrency(reward.amount)} or more
                      </p>
                    </div>
                    {reward.limit && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        {reward.limit} left
                      </span>
                    )}
                  </div>
                  {reward.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{reward.description}</p>
                  )}
                  {reward.deliveryDate && (
                    <p className="mt-2 text-xs text-gray-500">
                      Est. delivery:{" "}
                      {new Date(reward.deliveryDate).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pledge Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {selectedReward ? `Minimum: ${formatCurrency(selectedReward.amount)}` : "Your Pledge Amount"}
          </label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
            <input
              type="number"
              min={selectedReward ? selectedReward.amount / 100 : 1}
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setShowPayment(false);
              }}
              placeholder="0"
              className="input-field pl-8"
              required
            />
          </div>
        </div>

        {/* Bonus Support */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bonus Support (optional)
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Add extra to help cover platform fees
          </p>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bonusSupport}
              onChange={(e) => {
                setBonusSupport(e.target.value);
                setShowPayment(false);
              }}
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Message (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Leave a message for the creator..."
            rows={2}
            className="input-field mt-1.5 resize-none"
          />
        </div>

        {/* Summary */}
        {pledgeAmount > 0 && (
          <div className="space-y-3">
            <ContributionDestination
              campaignTitle={campaignTitle}
              hierarchyLevel={hierarchyLevel}
              locationName={locationName}
              amount={totalAmount}
              showBeforePayment={true}
            />
          </div>
        )}

        {/* Continue — the payment panel is rendered OUTSIDE this <form> (below)
            so its own Stripe <form> is never nested inside another <form>.
            A submit event on a nested form does not bubble, so React's
            onSubmit/preventDefault never runs and the browser performs a
            native submit — reloading the page and jumping back to the top. */}
        {!showPayment && (
          <button
            type="submit"
            disabled={pledgeAmount <= 0}
            className="btn-primary w-full"
          >
            Continue to Payment {formatCurrency(totalAmount) || "£0"}
          </button>
        )}
      </form>

      {/* Payment — single MCOM Pay path (Stripe / PayPal / MCOM Wallet) */}
      {showPayment && (
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Pledge {formatCurrency(totalAmount)}
              {selectedReward && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  · {selectedReward.title}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setShowPayment(false)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              ← Edit pledge
            </button>
          </div>
          <McomCheckoutPanel
            amountPence={totalAmount}
            purpose="PLEDGE"
            campaignId={campaignId}
            rewardId={selectedRewardId || undefined}
            notes={notes || undefined}
            formatGbp={formatCurrency}
            metadata={{
              campaignTitle,
              rewardTitle: selectedReward?.title,
              bonusSupportPence: bonusAmount,
              contributionType: contributionType || "backer",
              hierarchyLevel: hierarchyLevel || undefined,
            }}
            onSuccess={(result) => {
              navigate(
                `/thank-you?reference=${encodeURIComponent(result.reference)}&type=pledge&amount=${result.amountPence}&campaign=${encodeURIComponent(campaignTitle)}&status=completed`,
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
