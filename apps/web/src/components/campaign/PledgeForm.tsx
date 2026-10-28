import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContributionDestination } from "./ContributionDestination";
import { McomCheckoutPanel } from "@/components/payment/McomCheckoutPanel";
import {
  CampaignAllocationInput,
  type CampaignAllocationEntry,
} from "./CampaignAllocationInput";
import type { CampaignCheckoutRules } from "./CampaignDetailBody";

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
  /** Admin-configured checkout rules from the campaign settings. */
  rules?: CampaignCheckoutRules;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

const formatPence = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(pence / 100);

function poundsToPence(value?: string | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export function PledgeForm({
  campaignId,
  campaignTitle,
  rewards,
  hierarchyLevel,
  locationName,
  contributionType,
  preselectedRewardId,
  rules,
}: Props) {
  const navigate = useNavigate();
  const [selectedRewardId, setSelectedRewardId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [bonusSupport, setBonusSupport] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const [allocations, setAllocations] = useState<CampaignAllocationEntry[]>([]);
  const [acceptedCampaignTerms, setAcceptedCampaignTerms] = useState(false);
  const [acceptedContributionTerms, setAcceptedContributionTerms] = useState(false);

  const activeRewards = rewards
    .filter((r) => r.status === "active")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const selectedReward = activeRewards.find((r) => r.id === selectedRewardId);

  const contributionRules = rules?.contributionRules;
  const minPence = useMemo(() => {
    const configured = poundsToPence(contributionRules?.minContribution);
    const backerMin =
      contributionType === "founding_member"
        ? null
        : poundsToPence(rules?.backerRules?.minBackerAmount);
    const foundingMin =
      contributionType === "founding_member"
        ? poundsToPence(rules?.foundingMemberRules?.contributionRequired)
        : null;
    return Math.max(configured ?? 0, backerMin ?? 0, foundingMin ?? 0);
  }, [
    contributionRules?.minContribution,
    contributionType,
    rules?.backerRules?.minBackerAmount,
    rules?.foundingMemberRules?.contributionRequired,
  ]);

  const maxPence = poundsToPence(contributionRules?.maxContribution);
  const allowCustomAmount = contributionRules?.allowCustomAmount !== false;
  const presets = useMemo(() => {
    const configured = (contributionRules?.suggestedAmounts ?? [])
      .map((value) => poundsToPence(value))
      .filter((value): value is number => value !== null && value > 0);
    return configured.length > 0
      ? configured
      : PRESET_AMOUNTS.map((value) => value * 100);
  }, [contributionRules?.suggestedAmounts]);

  const allocationDestinations = rules?.allocationDestinations ?? [];
  const allocationEnabled =
    Boolean(rules?.allocationEnabled) && allocationDestinations.length > 0;
  const totalAllocationPercentage = allocations.reduce(
    (sum, entry) => sum + entry.percentage,
    0,
  );
  const campaignTerms = rules?.terms?.campaignTerms?.trim();
  const contributionTerms = rules?.terms?.contributionTerms?.trim();
  const termsAccepted =
    (!campaignTerms || acceptedCampaignTerms) &&
    (!contributionTerms || acceptedContributionTerms);

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

  const validate = (): string | null => {
    if (pledgeAmount <= 0) return "Please enter a valid amount";
    if (minPledgePence > 0 && pledgeAmount < minPledgePence) {
      return `Minimum for "${selectedReward?.title}" is ${formatPence(minPledgePence)}`;
    }
    if (minPence > 0 && totalAmount < minPence) {
      return `Minimum contribution is ${formatPence(minPence)}`;
    }
    if (maxPence !== null && totalAmount > maxPence) {
      return `Maximum contribution is ${formatPence(maxPence)}`;
    }
    if (
      !allowCustomAmount &&
      presets.length > 0 &&
      !selectedReward &&
      !presets.includes(pledgeAmount)
    ) {
      return "Please choose one of the suggested amounts";
    }
    if (allocationEnabled && totalAllocationPercentage > 100) {
      return "Allocation cannot exceed 100% of your contribution";
    }
    if (
      allocationEnabled &&
      allocations.length > 0 &&
      totalAllocationPercentage !== 100
    ) {
      return "Allocation percentages must total 100%";
    }
    if (rules?.allocationRequired && allocations.length === 0) {
      return "Please choose how your contribution should be allocated";
    }
    if (!termsAccepted) {
      return "Please accept the campaign terms before continuing";
    }
    return null;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
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

        {contributionType === "founding_member" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <span className="font-semibold">Founding Member contribution</span>
            {poundsToPence(rules?.foundingMemberRules?.contributionRequired) ? (
              <span>
                {" "}
                — minimum{" "}
                {formatPence(
                  poundsToPence(rules?.foundingMemberRules?.contributionRequired) ?? 0,
                )}
              </span>
            ) : null}
          </div>
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
                        {formatPence(reward.amount)} or more
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

        {/* Suggested Amounts */}
        {presets.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Suggested Amounts</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedRewardId("");
                    setAmount(String(preset / 100));
                    setShowPayment(false);
                  }}
                  className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    !selectedRewardId && pledgeAmount === preset
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {formatPence(preset)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pledge Amount */}
        {allowCustomAmount && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {selectedReward
                ? `Minimum: ${formatPence(selectedReward.amount)}`
                : "Your Pledge Amount"}
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                min={selectedReward ? selectedReward.amount / 100 : minPence / 100}
                max={maxPence !== null ? maxPence / 100 : undefined}
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
            <p className="mt-1 text-xs text-gray-500">
              Minimum {formatPence(minPence)}
              {maxPence !== null ? ` · Maximum ${formatPence(maxPence)}` : ""}
            </p>
          </div>
        )}

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

        {allocationEnabled && (
          <CampaignAllocationInput
            destinations={allocationDestinations}
            required={rules?.allocationRequired}
            allowSplit={rules?.allocationAllowSplit}
            maxDestinations={rules?.allocationMaxDestinations}
            value={allocations}
            amountPence={totalAmount}
            onChange={setAllocations}
          />
        )}

        {(campaignTerms || contributionTerms) && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Terms & Conditions</h3>
            {campaignTerms && (
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={acceptedCampaignTerms}
                  onChange={(e) => setAcceptedCampaignTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>I accept the campaign terms and conditions.</span>
              </label>
            )}
            {contributionTerms && (
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={acceptedContributionTerms}
                  onChange={(e) => setAcceptedContributionTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>I accept the contribution terms.</span>
              </label>
            )}
          </div>
        )}

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
            disabled={pledgeAmount <= 0 || !termsAccepted}
            className="btn-primary w-full"
          >
            Continue to Payment {formatPence(totalAmount) || "£0"}
          </button>
        )}
      </form>

      {/* Payment — single MCOM Pay path (Stripe / PayPal / MCOM Wallet) */}
      {showPayment && (
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Pledge {formatPence(totalAmount)}
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
            acceptedTerms={termsAccepted}
            formatGbp={formatPence}
            metadata={{
              campaignTitle,
              rewardTitle: selectedReward?.title,
              bonusSupportPence: bonusAmount,
              contributionType: contributionType || "backer",
              participationType:
                contributionType === "founding_member"
                  ? "founding_member"
                  : "back_campaign",
              allocations: allocations.length > 0 ? allocations : undefined,
              acceptedTerms: termsAccepted,
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
