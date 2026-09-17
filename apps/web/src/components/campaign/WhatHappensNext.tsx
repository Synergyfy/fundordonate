// =============================================================================
// Campaign — What Happens Next
// Explainer component shown on campaign pages explaining spillover/surplus rules.
// =============================================================================

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface WhatHappensNextProps {
  /** Current spillover action configured for this campaign */
  spilloverAction?: string | null;
  /** Campaign goal in pence */
  goalAmount: number;
  /** Whether the campaign has a season */
  seasonName?: string | null;
  /** Hierarchy level for context */
  hierarchyLevel?: string | null;
  /** Location name for context */
  locationName?: string | null;
}

const SPILOVER_EXPLANATIONS: Record<string, { title: string; icon: string; detail: string }> = {
  redistribute_next: {
    title: "Surplus Redistributed",
    icon: "➡️",
    detail:
      "If this campaign exceeds its target, the extra funds will be automatically redirected to the next campaign in this hierarchy. This ensures money flows where it's needed most within your community.",
  },
  hold_for_next_season: {
    title: "Held for Next Season",
    icon: "⏸️",
    detail:
      "Any surplus funds will be held in reserve and made available for the next funding season. This creates a continuous funding cycle that benefits future initiatives.",
  },
  refund_to_donors: {
    title: "Refunded to Backers",
    icon: "💸",
    detail:
      "If the campaign exceeds its target, surplus funds are proportionally refunded to backers. You only pay for what's needed.",
  },
  donate_to_pool: {
    title: "Donated to Community Pool",
    icon: "🤝",
    detail:
      "Surplus funds are donated to the community pool, supporting other local initiatives and campaigns across the hub network.",
  },
  release_to_owner: {
    title: "Released to Campaign Owner",
    icon: "✅",
    detail:
      "Surplus funds are released to the campaign owner, allowing them to extend the project scope or use the additional funds as needed.",
  },
};

const DEFAULT_EXPLANATION = {
  title: "Target Reached",
  icon: "🎯",
  detail:
    "When this campaign reaches its target, the funds are allocated to the campaign purpose. Any surplus is handled according to the configured spillover rules.",
};

export function WhatHappensNext({
  spilloverAction,
  goalAmount,
  seasonName,
  hierarchyLevel,
  locationName,
}: WhatHappensNextProps) {
  const [expanded, setExpanded] = useState(false);
  const explanation = spilloverAction ? SPILOVER_EXPLANATIONS[spilloverAction] || DEFAULT_EXPLANATION : DEFAULT_EXPLANATION;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{explanation.icon}</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">What happens when the target is reached?</h3>
            <p className="text-xs text-gray-500">
              {spilloverAction
                ? `Surplus: ${explanation.title}`
                : "Learn about surplus handling and seasonal cycles"}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="space-y-3 text-sm text-gray-600">
            <p>{explanation.detail}</p>

            {/* How it works */}
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="font-medium text-gray-900 mb-2">How it works</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                <li>Campaign receives donations and pledges toward its goal of {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(goalAmount / 100)}</li>
                <li>When the target is reached, the campaign is marked as "Target Reached"</li>
                <li>Additional contributions are treated as surplus</li>
                <li>Surplus is handled according to the configured spillover rule</li>
                {seasonName && (
                  <li>Season transitions may apply additional rules at season end</li>
                )}
              </ol>
            </div>

            {/* Hierarchy Context */}
            {hierarchyLevel && locationName && (
              <div className="rounded-lg bg-blue-50 p-3">
                <h4 className="font-medium text-blue-900 mb-1">Hierarchy Context</h4>
                <p className="text-xs text-blue-700">
                  This is a <span className="font-semibold capitalize">{hierarchyLevel.replace("_", " ")}</span> campaign
                  {locationName && ` in ${locationName}`}. Surplus may flow to campaigns at different levels of the hierarchy.
                </p>
              </div>
            )}

            {/* Season Context */}
            {seasonName && (
              <div className="rounded-lg bg-purple-50 p-3">
                <h4 className="font-medium text-purple-900 mb-1">Seasonal Cycle</h4>
                <p className="text-xs text-purple-700">
                  This campaign is part of the <span className="font-semibold">{seasonName}</span> season.
                  When the season ends, additional transition rules may apply to any remaining surplus.
                </p>
              </div>
            )}

            {/* FAQ-style questions */}
            <div className="mt-3 space-y-2">
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-primary-600">
                  Can I change the spillover rule?
                </summary>
                <p className="mt-1 text-xs text-gray-500">
                  Spillover rules are configured by administrators and can be set per-campaign or per-season.
                  Contact your hub admin to modify rules.
                </p>
              </details>
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-primary-600">
                  When does surplus get processed?
                </summary>
                <p className="mt-1 text-xs text-gray-500">
                  Surplus is processed in real-time or on a schedule (hourly/daily) depending on the
                  hub configuration. Check the roll-up configuration for details.
                </p>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
