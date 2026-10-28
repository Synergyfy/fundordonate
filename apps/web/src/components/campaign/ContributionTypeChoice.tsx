// =============================================================================
// FundOrDonate — Contribution Type Choice Component
// Shown before the donation/pledge form to ask how the visitor wants to
// participate. Options are driven by the campaign's participation settings.
// =============================================================================

import { useState } from "react";

export type ContributionType = "donate" | "backer" | "founding_member";

interface ContributionTypeChoiceProps {
  campaignTitle: string;
  locationName?: string;
  hasFoundingProgramme: boolean;
  showDonate?: boolean;
  showBacker?: boolean;
  foundingProgrammeName?: string;
  foundingRemaining?: number;
  onSelect: (type: ContributionType) => void;
  onBack?: () => void;
}

const OPTION_STYLES: Record<ContributionType, { selected: string; icon: string }> = {
  donate: {
    selected: "border-emerald-400 bg-emerald-50 shadow-sm",
    icon: "border-emerald-300 bg-emerald-50",
  },
  backer: {
    selected: "border-amber-400 bg-amber-50 shadow-sm",
    icon: "border-amber-300 bg-amber-50",
  },
  founding_member: {
    selected: "border-primary-400 bg-primary-50 shadow-sm",
    icon: "border-primary-300 bg-primary-50",
  },
};

export function ContributionTypeChoice({
  campaignTitle,
  locationName,
  hasFoundingProgramme,
  showDonate = false,
  showBacker = true,
  foundingProgrammeName,
  foundingRemaining,
  onSelect,
  onBack,
}: ContributionTypeChoiceProps) {
  const [selected, setSelected] = useState<ContributionType | null>(null);

  const options: ContributionType[] = [
    ...(showDonate ? (["donate"] as const) : []),
    ...(showBacker ? (["backer"] as const) : []),
    ...(hasFoundingProgramme ? (["founding_member"] as const) : []),
  ];
  const columns =
    options.length >= 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : options.length === 2
        ? "sm:grid-cols-2"
        : "";

  const renderOption = (
    type: ContributionType,
    title: string,
    subtitle: string,
    description: string,
    highlight: string,
    icon: string,
  ) => (
    <button
      type="button"
      onClick={() => setSelected(type)}
      className={`rounded-xl border-2 p-5 text-left transition-all ${
        selected === type
          ? OPTION_STYLES[type].selected
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-2xl ${OPTION_STYLES[type].icon}`}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600">{description}</p>
      <div className="mt-3 rounded-lg bg-gray-100 px-3 py-2">
        <p className="text-xs font-medium text-gray-700">{highlight}</p>
      </div>
    </button>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">How would you like to participate?</h2>
        <p className="mt-1 text-sm text-gray-500">
          for "{campaignTitle}"
          {locationName && <span className="text-gray-400"> in {locationName}</span>}
        </p>
      </div>

      <div className={`mt-6 grid gap-4 ${columns}`}>
        {showDonate &&
          renderOption(
            "donate",
            "Donate",
            "Make a simple donation",
            "Support this campaign with a one-time donation.",
            "✦ Your donation counts toward the campaign total",
            "💚",
          )}
        {showBacker &&
          renderOption(
            "backer",
            "Back this Campaign",
            "Support as a Backer",
            "Pledge your support and claim any reward tiers the campaign offers.",
            "✦ Backer recognition and reward eligibility",
            "🤝",
          )}
        {hasFoundingProgramme &&
          renderOption(
            "founding_member",
            "Become a Founding Member",
            "Help establish this location",
            "Make a founding contribution and receive Founding Member status and benefits.",
            `✦ Founding Member status · Recognition · Benefits · Priority access${
              foundingRemaining !== undefined && foundingRemaining > 0
                ? ` · Only ${foundingRemaining} spots remaining`
                : ""
            }`,
            "⭐",
          )}
        {!hasFoundingProgramme && options.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-5 text-center">
            <span className="text-3xl opacity-50">⭐</span>
            <h3 className="mt-2 text-base font-medium text-gray-400">
              Participation unavailable
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              This campaign is not currently accepting contributions.
            </p>
          </div>
        )}
      </div>

      {foundingProgrammeName && hasFoundingProgramme && (
        <p className="mt-3 text-xs text-gray-500">
          Founding programme: {foundingProgrammeName}
        </p>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
        >
          {selected === "donate"
            ? "Continue as Donor →"
            : selected === "founding_member"
              ? "Continue as Founding Member →"
              : selected === "backer"
                ? "Continue as Backer →"
                : "Select an option to continue"}
        </button>
      </div>
    </div>
  );
}
