import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContributionDestination } from "./ContributionDestination";
import { McomCheckoutPanel } from "@/components/payment/McomCheckoutPanel";
import {
  CampaignAllocationInput,
  type CampaignAllocationEntry,
} from "./CampaignAllocationInput";
import type { CampaignCheckoutRules } from "./CampaignDetailBody";

interface Props {
  campaignId: string;
  campaignTitle: string;
  minAmount?: number;
  hierarchyLevel?: string | null;
  locationName?: string;
  contributionType?: "donate" | "backer" | "founding_member";
  /** Reward threshold in pence, used to preselect the donation amount. */
  preselectedAmountPence?: number;
  /** Admin-configured checkout rules from the campaign settings. */
  rules?: CampaignCheckoutRules;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(pence / 100);

function poundsToPence(value?: string | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export function DonationForm({
  campaignId,
  campaignTitle,
  minAmount = 1,
  hierarchyLevel,
  locationName,
  contributionType,
  preselectedAmountPence,
  rules,
}: Props) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState("");
  const [tributeType, setTributeType] = useState("");
  const [tributeTo, setTributeTo] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const [allocations, setAllocations] = useState<CampaignAllocationEntry[]>([]);
  const [acceptedCampaignTerms, setAcceptedCampaignTerms] = useState(false);
  const [acceptedContributionTerms, setAcceptedContributionTerms] = useState(false);

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
    return Math.max(
      Math.round(minAmount * 100),
      configured ?? 0,
      backerMin ?? 0,
      foundingMin ?? 0,
    );
  }, [
    minAmount,
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

  // `amount` is a pounds string from the input; convert once to pence.
  const donationAmount = Math.round((parseFloat(amount) || 0) * 100);

  useEffect(() => {
    if (preselectedAmountPence == null || preselectedAmountPence <= 0) return;
    setAmount(String(preselectedAmountPence / 100));
    setCustomAmount(true);
    setShowPayment(false);
  }, [preselectedAmountPence]);

  const validate = (): string | null => {
    if (donationAmount <= 0) return "Please enter a donation amount";
    if (donationAmount < minPence) {
      return `Minimum donation is ${formatCurrency(minPence)}`;
    }
    if (maxPence !== null && donationAmount > maxPence) {
      return `Maximum donation is ${formatCurrency(maxPence)}`;
    }
    if (
      !allowCustomAmount &&
      presets.length > 0 &&
      !presets.includes(donationAmount)
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
      <h2 className="text-xl font-bold text-gray-900">Make a Donation</h2>
      <p className="mt-1 text-sm text-gray-500">to "{campaignTitle}"</p>

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
                {formatCurrency(
                  poundsToPence(rules?.foundingMemberRules?.contributionRequired) ?? 0,
                )}
              </span>
            ) : null}
          </div>
        )}

        {/* Preset Amounts */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Amount</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(String(preset / 100));
                  setCustomAmount(false);
                  setShowPayment(false);
                }}
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  !customAmount && donationAmount === preset
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        {allowCustomAmount && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Or enter custom amount
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                min={minPence / 100}
                max={maxPence !== null ? maxPence / 100 : undefined}
                step="0.01"
                value={customAmount ? amount : ""}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setCustomAmount(true);
                  setShowPayment(false);
                }}
                onFocus={() => setCustomAmount(true)}
                placeholder="0"
                className="input-field pl-8"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minimum {formatCurrency(minPence)}
              {maxPence !== null ? ` · Maximum ${formatCurrency(maxPence)}` : ""}
            </p>
          </div>
        )}

        {allocationEnabled && (
          <CampaignAllocationInput
            destinations={allocationDestinations}
            required={rules?.allocationRequired}
            allowSplit={rules?.allocationAllowSplit}
            maxDestinations={rules?.allocationMaxDestinations}
            value={allocations}
            amountPence={donationAmount}
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

        {/* Anonymous */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Make my donation anonymous</span>
        </label>

        {/* Tribute (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Make this donation in honor of someone? (optional)</label>
          <select
            value={tributeType}
            onChange={(e) => setTributeType(e.target.value)}
            className="input-field mt-1.5"
          >
            <option value="">No tribute</option>
            <option value="in_honor">In Honor Of</option>
            <option value="in_memory">In Memory Of</option>
          </select>
          {tributeType && (
            <input
              type="text"
              value={tributeTo}
              onChange={(e) => setTributeTo(e.target.value)}
              placeholder="Enter name"
              className="input-field mt-2"
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Add a comment (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Leave a message..."
            rows={2}
            className="input-field mt-1.5 resize-none"
          />
        </div>

        {/* Summary */}
        {donationAmount > 0 && (
          <div className="space-y-3">
            <ContributionDestination
              campaignTitle={campaignTitle}
              hierarchyLevel={hierarchyLevel}
              locationName={locationName}
              amount={donationAmount}
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
            disabled={!termsAccepted}
            className="btn-primary w-full"
          >
            Continue to Payment {formatCurrency(donationAmount) || "£0"}
          </button>
        )}
      </form>

      {/* Payment — single MCOM Pay path (Stripe / PayPal / MCOM Wallet) */}
      {showPayment && (
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Pay {formatCurrency(donationAmount)}
            </p>
            <button
              type="button"
              onClick={() => setShowPayment(false)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              ← Edit amount
            </button>
          </div>
          <McomCheckoutPanel
            amountPence={donationAmount}
            purpose="DONATION"
            campaignId={campaignId}
            isAnonymous={isAnonymous}
            notes={notes || undefined}
            acceptedTerms={termsAccepted}
            formatGbp={formatCurrency}
            metadata={{
              campaignTitle,
              tributeType: tributeType || undefined,
              tributeTo: tributeTo || undefined,
              contributionType: contributionType || "donate",
              participationType:
                contributionType === "founding_member"
                  ? "founding_member"
                  : contributionType === "donate"
                    ? "donate"
                    : "back_campaign",
              allocations: allocations.length > 0 ? allocations : undefined,
              acceptedTerms: termsAccepted,
              hierarchyLevel: hierarchyLevel || undefined,
            }}
            onSuccess={(result) => {
              navigate(
                `/thank-you?reference=${encodeURIComponent(result.reference)}&type=donation&amount=${result.amountPence}&campaign=${encodeURIComponent(campaignTitle)}&status=completed`,
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
