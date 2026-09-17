// =============================================================================
// FundOrDonate — Contribution Type Choice Component
// Shown before the donation/pledge form to ask: Backer or Founding Member?
// Only displayed when the campaign's location has an active founding programme.
// =============================================================================

import { useState } from "react";

export type ContributionType = "backer" | "founding_member";

interface ContributionTypeChoiceProps {
  campaignTitle: string;
  locationName?: string;
  hasFoundingProgramme: boolean;
  foundingProgrammeName?: string;
  foundingRemaining?: number;
  onSelect: (type: ContributionType) => void;
  onBack?: () => void;
}

export function ContributionTypeChoice({
  campaignTitle,
  locationName,
  hasFoundingProgramme,
  foundingProgrammeName,
  foundingRemaining,
  onSelect,
  onBack,
}: ContributionTypeChoiceProps) {
  const [selected, setSelected] = useState<ContributionType | null>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">How would you like to participate?</h2>
        <p className="mt-1 text-sm text-gray-500">
          for "{campaignTitle}"
          {locationName && <span className="text-gray-400"> in {locationName}</span>}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Backer Option */}
        <button
          type="button"
          onClick={() => setSelected("backer")}
          className={`rounded-xl border-2 p-5 text-left transition-all ${
            selected === "backer"
              ? "border-amber-400 bg-amber-50 shadow-sm"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50 text-2xl">
              🤝
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Back this Campaign</h3>
              <p className="text-xs text-gray-500">Support as a Backer</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            You're supporting this campaign with a contribution. Your support helps the campaign reach its goal.
          </p>
          <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2">
            <p className="text-xs font-medium text-amber-700">
              ✦ You'll receive Backer recognition and your contribution counts toward the campaign total
            </p>
          </div>
        </button>

        {/* Founding Member Option */}
        {hasFoundingProgramme && (
          <button
            type="button"
            onClick={() => setSelected("founding_member")}
            className={`rounded-xl border-2 p-5 text-left transition-all ${
              selected === "founding_member"
                ? "border-primary-400 bg-primary-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-300 bg-primary-50 text-2xl">
                ⭐
              </span>
              <div>
                <h3 className="text-base font-bold text-gray-900">Become a Founding Member</h3>
                <p className="text-xs text-gray-500">Help establish this location</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              You're making a contribution connected to helping establish and found the programme in this location. You receive Founding Member status and benefits.
            </p>
            <div className="mt-3 rounded-lg bg-primary-100 px-3 py-2">
              <p className="text-xs font-medium text-primary-700">
                ✦ Founding Member status · Recognition · Benefits · Priority access
              </p>
              {foundingRemaining !== undefined && foundingRemaining > 0 && (
                <p className="mt-1 text-xs font-semibold text-primary-800">
                  Only {foundingRemaining} founding spots remaining
                </p>
              )}
            </div>
            {foundingProgrammeName && (
              <p className="mt-2 text-xs text-gray-500">Programme: {foundingProgrammeName}</p>
            )}
          </button>
        )}

        {/* No Founding Programme Available */}
        {!hasFoundingProgramme && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-5 text-center">
            <span className="text-3xl opacity-50">⭐</span>
            <h3 className="mt-2 text-base font-medium text-gray-400">No Founding Programme</h3>
            <p className="mt-1 text-xs text-gray-400">
              Founding Member contributions are not available for this campaign's location yet.
            </p>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="mt-5 rounded-lg bg-gray-50 p-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">What's the difference?</h4>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-800">🤝 Backer</p>
            <p>You are supporting the campaign. Your contribution helps it reach its goal. You receive Backer recognition.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">⭐ Founding Member</p>
            <p>You are helping establish the programme in this location. You receive Founding Member status, benefits, and recognition connected to your profile.</p>
          </div>
        </div>
      </div>

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
          {selected === "founding_member" ? "Continue as Founding Member →" : selected === "backer" ? "Continue as Backer →" : "Select an option to continue"}
        </button>
      </div>
    </div>
  );
}
