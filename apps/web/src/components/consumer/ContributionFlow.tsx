// =============================================================================
// Contribution Flow
// Multi-step wizard for consumers/businesses to contribute to a campaign.
// Steps: Participation → Amount → Allocation → Review → Terms → Payment → Confirmation
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  HandHeart,
  Crown,
  RefreshCw,
  Heart,
  CreditCard,
  Building2,
  Globe,
  Shield,
  Share2,
  LayoutDashboard,
  Eye,
  Mail,
  TrendingUp,
  Gift,
} from "lucide-react";

// ── Types ──

interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  status: string;
  mode: string;
  featuredImage?: string;
  allocationEnabled?: boolean;
  allocationDestinations?: { id: string; name: string; description?: string; percentage?: string }[];
  rewards?: { id: string; title: string; description?: string; amount: number; items?: { title: string }[] }[];
  terms?: { campaignTerms?: string; contributionTerms?: string };
  participation?: { backCampaign?: boolean; foundingMember?: boolean; foundingMemberMonthly?: boolean; donateContribute?: boolean };
  contributionRules?: { minContribution?: string; maxContribution?: string; suggestedAmounts?: string[]; allowCustomAmount?: boolean };
  leaderboard?: { enabled?: boolean };
}

interface ContributionFlowProps {
  campaign?: Campaign;
  onClose?: () => void;
  onComplete?: (data: ContributionData) => void;
}

interface AllocationEntry {
  destinationId: string;
  percentage: number;
}

interface ContributionData {
  participationType: string;
  amount: number;
  allocations: AllocationEntry[];
  paymentMethod: string;
  acceptedTerms: boolean;
  acceptedContributionTerms: boolean;
}

type StepId = "participation" | "amount" | "allocation" | "review" | "terms" | "payment" | "confirmation";

const STEPS: { id: StepId; label: string }[] = [
  { id: "participation", label: "Participation" },
  { id: "amount", label: "Amount" },
  { id: "allocation", label: "Allocation" },
  { id: "review", label: "Review" },
  { id: "terms", label: "Terms" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmation" },
];

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

const PARTICIPATION_OPTIONS: {
  key: string;
  label: string;
  icon: typeof HandHeart;
  emoji: string;
  description: string;
  participationFlag: keyof NonNullable<Campaign["participation"]>;
}[] = [
  { key: "back_campaign", label: "Back This Campaign", icon: HandHeart, emoji: "🤝", description: "Support this campaign with a one-time contribution", participationFlag: "backCampaign" },
  { key: "founding_member", label: "Founding Member", icon: Crown, emoji: "👑", description: "Become a founding member with a one-time contribution", participationFlag: "foundingMember" },
  { key: "founding_monthly", label: "Founding Monthly", icon: RefreshCw, emoji: "🔄", description: "Support monthly as a founding member", participationFlag: "foundingMemberMonthly" },
  { key: "donate", label: "Donate", icon: Heart, emoji: "💚", description: "Make a simple donation to this campaign", participationFlag: "donateContribute" },
];

// ── Helper Components ──

function ProgressHeader({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-xs font-medium text-primary-600">
          {steps[currentStep]?.label}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentStep
                ? "bg-primary-600"
                : i === currentStep
                  ? "bg-primary-600 ring-2 ring-primary-200"
                  : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step 1: Participation ──

function ParticipationStep({
  campaign,
  selected,
  onSelect,
}: {
  campaign: Campaign;
  selected: string;
  onSelect: (type: string) => void;
}) {
  const enabledOptions = PARTICIPATION_OPTIONS.filter(
    (opt) => campaign.participation?.[opt.participationFlag]
  );

  if (enabledOptions.length === 0) {
    return (
      <div className="text-center py-12">
        <HandHeart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No participation types available for this campaign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900 mb-1">How would you like to participate?</h2>
      <p className="text-sm text-gray-500 mb-4">Choose a participation type to continue.</p>
      {enabledOptions.map((opt) => {
        const isSelected = selected === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-primary-600 bg-primary-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isSelected ? "bg-primary-100" : "bg-gray-100"
                }`}
              >
                {opt.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary-600" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Step 2: Amount ──

function AmountStep({
  campaign,
  participationType,
  amount,
  onAmountChange,
}: {
  campaign: Campaign;
  participationType: string;
  amount: number;
  onAmountChange: (amount: number) => void;
}) {
  const rules = campaign.contributionRules;
  const minAmount = rules?.minContribution ? parseFloat(rules.minContribution) : 1;
  const maxAmount = rules?.maxContribution ? parseFloat(rules.maxContribution) : 10000;
  const suggestedAmounts = rules?.suggestedAmounts?.map(Number) || PRESET_AMOUNTS;
  const allowCustom = rules?.allowCustomAmount !== false;

  const isFounding = participationType === "founding_member" || participationType === "founding_monthly";

  if (isFounding) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Founding Member Contribution</h2>
        <p className="text-sm text-gray-500 mb-4">
          Founding members contribute a fixed amount to help launch this campaign.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Crown className="h-10 w-10 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-amber-700 font-medium mb-1">Fixed Contribution</p>
          <p className="text-3xl font-bold text-amber-900">£{amount || "25"}</p>
          {participationType === "founding_monthly" && (
            <p className="text-xs text-amber-600 mt-1">per month</p>
          )}
        </div>
        {allowCustom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or enter a custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">£</span>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                min={minAmount}
                max={maxAmount}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter amount"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Choose your amount</h2>
      <p className="text-sm text-gray-500 mb-4">
        Select a suggested amount or enter a custom amount.
        {minAmount > 1 && <span className="text-amber-600"> Minimum: £{minAmount}</span>}
        {maxAmount < 10000 && <span className="text-amber-600"> Maximum: £{maxAmount}</span>}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {suggestedAmounts.map((preset) => (
          <button
            key={preset}
            onClick={() => onAmountChange(preset)}
            className={`py-3 rounded-lg text-sm font-semibold border-2 transition-all ${
              amount === preset
                ? "border-primary-600 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            £{preset}
          </button>
        ))}
      </div>

      {allowCustom && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or enter a custom amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">£</span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              min={minAmount}
              max={maxAmount}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter custom amount"
            />
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">Your contribution</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">£{amount || 0}</p>
      </div>
    </div>
  );
}

// ── Step 3: Allocation ──

function AllocationStep({
  campaign,
  allocations,
  onAllocationsChange,
  allocationEnabled,
  onAllocationEnabledChange,
}: {
  campaign: Campaign;
  allocations: AllocationEntry[];
  onAllocationsChange: (allocations: AllocationEntry[]) => void;
  allocationEnabled: boolean;
  onAllocationEnabledChange: (enabled: boolean) => void;
}) {
  const destinations = campaign.allocationDestinations || [];

  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);

  const handlePercentageChange = (destId: string, value: number) => {
    const updated = allocations.map((a) =>
      a.destinationId === destId ? { ...a, percentage: value } : a
    );
    if (!updated.find((a) => a.destinationId === destId)) {
      updated.push({ destinationId: destId, percentage: value });
    }
    onAllocationsChange(updated.filter((a) => a.percentage > 0));
  };

  if (!campaign.allocationEnabled || destinations.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Allocation is not enabled for this campaign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">How should your contribution be allocated?</h2>
      <p className="text-sm text-gray-500 mb-4">
        Split your contribution across different destinations.
      </p>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Enable allocation split</span>
        <button
          onClick={() => onAllocationEnabledChange(!allocationEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            allocationEnabled ? "bg-primary-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              allocationEnabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {allocationEnabled && (
        <>
          <div className="space-y-3">
            {destinations.map((dest) => {
              const entry = allocations.find((a) => a.destinationId === dest.id);
              const pct = entry?.percentage || 0;

              return (
                <div key={dest.id} className="p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{dest.name}</p>
                      {dest.description && (
                        <p className="text-xs text-gray-500">{dest.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary-600">{pct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={(e) => handlePercentageChange(dest.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              );
            })}
          </div>

          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              totalPercentage === 100
                ? "bg-green-50 text-green-700 border border-green-200"
                : totalPercentage > 100
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            Total allocated: {totalPercentage}%
            {totalPercentage !== 100 && ` (must equal 100%)`}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step 4: Review ──

function ReviewStep({
  campaign,
  participationType,
  amount,
  allocations,
  allocationEnabled,
}: {
  campaign: Campaign;
  participationType: string;
  amount: number;
  allocations: AllocationEntry[];
  allocationEnabled: boolean;
}) {
  const participationLabel = PARTICIPATION_OPTIONS.find((p) => p.key === participationType)?.label || participationType;
  const participationEmoji = PARTICIPATION_OPTIONS.find((p) => p.key === participationType)?.emoji || "";
  const isMonthly = participationType === "founding_monthly";
  const matchingReward = campaign.rewards
    ?.filter((r) => r.amount <= amount)
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Review your contribution</h2>
      <p className="text-sm text-gray-500 mb-4">Please review the details before proceeding.</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Campaign</p>
          <p className="font-semibold text-gray-900 mt-1">{campaign.title}</p>
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Participation Type</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{participationEmoji}</span>
            <span className="font-semibold text-gray-900">{participationLabel}</span>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Amount</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-gray-900">£{amount}</span>
            {isMonthly && <span className="text-sm text-gray-500">/month</span>}
          </div>
        </div>

        {allocationEnabled && allocations.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Allocation</p>
            <div className="mt-2 space-y-1.5">
              {allocations.map((a) => {
                const dest = campaign.allocationDestinations?.find((d) => d.id === a.destinationId);
                return (
                  <div key={a.destinationId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{dest?.name || a.destinationId}</span>
                    <span className="font-medium text-gray-900">{a.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {matchingReward && (
          <div className="p-4 border-b border-gray-100 bg-amber-50">
            <p className="text-xs text-amber-700 uppercase tracking-wide font-medium">Reward Earned</p>
            <div className="flex items-center gap-2 mt-1">
              <Gift className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-900">{matchingReward.title}</span>
            </div>
            {matchingReward.items && matchingReward.items.length > 0 && (
              <ul className="mt-1 ml-6 text-xs text-amber-700 list-disc">
                {matchingReward.items.map((item, i) => (
                  <li key={i}>{item.title}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="p-4 bg-primary-50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-primary-700">Total {isMonthly ? "Monthly" : ""} Contribution</span>
            <span className="text-xl font-bold text-primary-900">£{amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 5: Terms ──

function TermsStep({
  campaign,
  acceptedTerms,
  acceptedContributionTerms,
  onAcceptTerms,
  onAcceptContributionTerms,
}: {
  campaign: Campaign;
  acceptedTerms: boolean;
  acceptedContributionTerms: boolean;
  onAcceptTerms: (v: boolean) => void;
  onAcceptContributionTerms: (v: boolean) => void;
}) {
  const hasCampaignTerms = !!campaign.terms?.campaignTerms;
  const hasContributionTerms = !!campaign.terms?.contributionTerms;
  const bothRequired = hasCampaignTerms && hasContributionTerms;
  const canProceed = bothRequired
    ? acceptedTerms && acceptedContributionTerms
    : hasCampaignTerms
      ? acceptedTerms
      : hasContributionTerms
        ? acceptedContributionTerms
        : true;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Terms & Conditions</h2>
      <p className="text-sm text-gray-500 mb-4">Please read and accept the terms to proceed.</p>

      {!hasCampaignTerms && !hasContributionTerms && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-green-700 font-medium">No terms required for this campaign.</p>
        </div>
      )}

      {hasCampaignTerms && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Campaign Terms</h3>
          <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 leading-relaxed">
            {campaign.terms!.campaignTerms}
          </div>
          <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => onAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">I have read and accept the campaign terms and conditions</span>
          </label>
        </div>
      )}

      {hasContributionTerms && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Contribution Terms</h3>
          <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 leading-relaxed">
            {campaign.terms!.contributionTerms}
          </div>
          <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={acceptedContributionTerms}
              onChange={(e) => onAcceptContributionTerms(e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">I have read and accept the contribution terms and conditions</span>
          </label>
        </div>
      )}

      {!canProceed && (
        <p className="text-xs text-amber-600">You must accept all required terms to continue.</p>
      )}
    </div>
  );
}

// ── Step 6: Payment ──

function PaymentStep({
  amount,
  paymentMethod,
  onPaymentMethodChange,
}: {
  amount: number;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Method</h2>
      <p className="text-sm text-gray-500 mb-4">Choose how you'd like to pay £{amount}.</p>

      <div className="space-y-2">
        {[
          { id: "stripe", label: "Credit / Debit Card", icon: CreditCard, sub: "Powered by Stripe" },
          { id: "paypal", label: "PayPal", icon: Globe, sub: "Redirect to PayPal" },
          { id: "offline", label: "Bank Transfer", icon: Building2, sub: "Offline payment" },
        ].map((method) => {
          const Icon = method.icon;
          const isSelected = paymentMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onPaymentMethodChange(method.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-primary-600 bg-primary-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? "bg-primary-100" : "bg-gray-100"}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.sub}</p>
                </div>
                {isSelected && <Check className="h-5 w-5 text-primary-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {paymentMethod === "stripe" && (
        <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expiry</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CVC</label>
              <input
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "paypal" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <Globe className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-blue-700 font-medium">You will be redirected to PayPal to complete payment.</p>
        </div>
      )}

      {paymentMethod === "offline" && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
          <p className="text-sm font-medium text-gray-700">Bank Transfer Details</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Account Name: GrowFund Ltd</p>
            <p>Sort Code: 12-34-56</p>
            <p>Account Number: 12345678</p>
            <p>Reference: <span className="font-mono text-primary-600">AUTO-GENERATED</span></p>
          </div>
          <p className="text-xs text-amber-600">Please use your unique reference when transferring. Your contribution will be confirmed once payment is received.</p>
        </div>
      )}
    </div>
  );
}

// ── Step 7: Confirmation ──

function ConfirmationStep({
  campaign,
  participationType,
  amount,
  transactionRef,
  onGoToDashboard,
  onShare,
  onViewCampaign,
}: {
  campaign: Campaign;
  participationType: string;
  amount: number;
  transactionRef: string;
  onGoToDashboard: () => void;
  onShare: () => void;
  onViewCampaign: () => void;
}) {
  const participationLabel = PARTICIPATION_OPTIONS.find((p) => p.key === participationType)?.label || participationType;
  const participationEmoji = PARTICIPATION_OPTIONS.find((p) => p.key === participationType)?.emoji || "";
  const matchingReward = campaign.rewards
    ?.filter((r) => r.amount <= amount)
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="space-y-6 text-center">
      <div className="relative">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <Check className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Thank You!</h2>
        <p className="text-sm text-gray-500 mt-1">Your contribution has been successfully processed.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 text-left space-y-3 shadow-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Transaction Reference</p>
          <p className="font-mono font-semibold text-gray-900 mt-0.5">{transactionRef}</p>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Campaign</p>
          <p className="font-semibold text-gray-900 mt-0.5">{campaign.title}</p>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">£{amount}</p>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Participation</p>
          <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full">
            {participationEmoji} {participationLabel}
          </span>
        </div>
        {matchingReward && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Reward Earned</p>
            <div className="flex items-center gap-2 mt-1">
              <Gift className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-gray-900">{matchingReward.title}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-left">
        <p className="text-sm font-semibold text-primary-800 mb-2">What happens next?</p>
        <ul className="space-y-2 text-sm text-primary-700">
          <li className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
            You'll receive a confirmation email
          </li>
          <li className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            Track your campaign progress in your dashboard
          </li>
          <li className="flex items-start gap-2">
            <Gift className="h-4 w-4 mt-0.5 flex-shrink-0" />
            If the campaign reaches its goal, your reward will be delivered
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onGoToDashboard}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </button>
        <button
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share on Social Media
        </button>
        <button
          onClick={onViewCampaign}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Campaign
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──

const DEFAULT_CAMPAIGN: Campaign = {
  id: "",
  slug: "",
  title: "Campaign",
  goalAmount: 0,
  raisedAmount: 0,
  deadline: "",
  status: "active",
  mode: "donate",
};

export function ContributionFlow({ campaign: campaignProp, onClose: onCloseProp, onComplete: _onComplete }: ContributionFlowProps) {
  const campaign = campaignProp ?? DEFAULT_CAMPAIGN;
  const onClose = onCloseProp ?? (() => {});
  const [currentStep, setCurrentStep] = useState(0);
  const [participationType, setParticipationType] = useState("");
  const [amount, setAmount] = useState(0);
  const [allocations, setAllocations] = useState<AllocationEntry[]>([]);
  const [allocationEnabled, setAllocationEnabled] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedContributionTerms, setAcceptedContributionTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [processing, setProcessing] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");

  const steps = useMemo(() => {
    if (!campaign.allocationEnabled) {
      return STEPS.filter((s) => s.id !== "allocation");
    }
    return STEPS;
  }, [campaign.allocationEnabled]);

  const canProceed = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return false;

    switch (step.id) {
      case "participation":
        return !!participationType;
      case "amount":
        return amount > 0;
      case "allocation":
        if (!allocationEnabled) return true;
        const totalPct = allocations.reduce((s, a) => s + a.percentage, 0);
        return totalPct === 100;
      case "review":
        return true;
      case "terms": {
        const hasCampaign = !!campaign.terms?.campaignTerms;
        const hasContribution = !!campaign.terms?.contributionTerms;
        if (hasCampaign && hasContribution) return acceptedTerms && acceptedContributionTerms;
        if (hasCampaign) return acceptedTerms;
        if (hasContribution) return acceptedContributionTerms;
        return true;
      }
      case "payment":
        return !!paymentMethod;
      default:
        return true;
    }
  }, [currentStep, steps, participationType, amount, allocations, allocationEnabled, acceptedTerms, acceptedContributionTerms, paymentMethod, campaign.terms]);

  const handleNext = () => {
    if (!canProceed()) return;

    const step = steps[currentStep];
    if (step?.id === "payment") {
      setProcessing(true);
      setTimeout(() => {
        const ref = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        setTransactionRef(ref);
        setProcessing(false);
        setCurrentStep((prev) => prev + 1);
      }, 2000);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleGoToDashboard = () => {
    onClose();
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `I just contributed £${amount} to ${campaign.title}! Check it out:`;
    if (navigator.share) {
      navigator.share({ title: campaign.title, text, url });
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    }
  };

  const handleViewCampaign = () => {
    window.open(`/campaigns/${campaign.slug}`, "_blank");
  };

  const renderStep = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.id) {
      case "participation":
        return (
          <ParticipationStep
            campaign={campaign}
            selected={participationType}
            onSelect={setParticipationType}
          />
        );
      case "amount":
        return (
          <AmountStep
            campaign={campaign}
            participationType={participationType}
            amount={amount}
            onAmountChange={setAmount}
          />
        );
      case "allocation":
        return (
          <AllocationStep
            campaign={campaign}
            allocations={allocations}
            onAllocationsChange={setAllocations}
            allocationEnabled={allocationEnabled}
            onAllocationEnabledChange={setAllocationEnabled}
          />
        );
      case "review":
        return (
          <ReviewStep
            campaign={campaign}
            participationType={participationType}
            amount={amount}
            allocations={allocations}
            allocationEnabled={allocationEnabled}
          />
        );
      case "terms":
        return (
          <TermsStep
            campaign={campaign}
            acceptedTerms={acceptedTerms}
            acceptedContributionTerms={acceptedContributionTerms}
            onAcceptTerms={setAcceptedTerms}
            onAcceptContributionTerms={setAcceptedContributionTerms}
          />
        );
      case "payment":
        return (
          <PaymentStep
            amount={amount}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />
        );
      case "confirmation":
        return (
          <ConfirmationStep
            campaign={campaign}
            participationType={participationType}
            amount={amount}
            transactionRef={transactionRef}
            onGoToDashboard={handleGoToDashboard}
            onShare={handleShare}
            onViewCampaign={handleViewCampaign}
          />
        );
      default:
        return null;
    }
  };

  const isConfirmation = steps[currentStep]?.id === "confirmation";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex-1">
            {!isConfirmation && (
              <ProgressHeader currentStep={currentStep} steps={steps} />
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">{renderStep()}</div>

        {/* Footer Navigation */}
        {!isConfirmation && (
          <div className="border-t border-gray-200 px-5 py-4 flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed() || processing}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                canProceed() && !processing
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : steps[currentStep]?.id === "payment" ? (
                <>
                  Pay £{amount}
                  <Shield className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
