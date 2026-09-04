import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface Reward {
  id: string;
  title: string;
  description?: string;
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
}

export function PledgeForm({ campaignId, campaignTitle, rewards }: Props) {
  const navigate = useNavigate();
  const [selectedRewardId, setSelectedRewardId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [bonusSupport, setBonusSupport] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (pence: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

  const activeRewards = rewards.filter((r) => r.status === "active").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const selectedReward = activeRewards.find((r) => r.id === selectedRewardId);
  const pledgeAmount = (parseInt(amount) || 0) * 100; // Convert to minor units (cents)
  const bonusAmount = (parseInt(bonusSupport) || 0) * 100; // Convert to minor units (cents)
  const totalAmount = pledgeAmount + bonusAmount;

  const handleRewardSelect = (rewardId: string) => {
    setSelectedRewardId(rewardId);
    const reward = activeRewards.find((r) => r.id === rewardId);
    if (reward) {
      setAmount(String(reward.amount));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pledgeAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await campaignApi.createPledge(campaignId, {
        amount: pledgeAmount,
        rewardId: selectedRewardId || undefined,
        bonusSupportAmount: bonusAmount,
        paymentMethod,
        notes: notes || undefined,
      });
      navigate(`/thank-you?uid=${result.uid}&type=pledge`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process pledge");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">Back This Project</h2>
      <p className="mt-1 text-sm text-gray-500">for "{campaignTitle}"</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
              min={selectedReward?.amount || 1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
              value={bonusSupport}
              onChange={(e) => setBonusSupport(e.target.value)}
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Payment Method */}
        <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

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
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pledge Amount</span>
              <span className="font-medium text-gray-900">{formatCurrency(pledgeAmount)}</span>
            </div>
            {bonusAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bonus Support</span>
                <span className="font-medium text-gray-900">{formatCurrency(bonusAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || pledgeAmount <= 0}
          className="btn-primary w-full"
        >
          {loading ? "Processing..." : `Pledge ${formatCurrency(totalAmount) || "£0"}`}
        </button>
      </form>
    </div>
  );
}
