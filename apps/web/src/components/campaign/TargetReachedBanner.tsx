// =============================================================================
// Campaign — Target Reached Banner
// Celebration banner shown when a campaign reaches its funding goal.
// Explains what happens next with surplus funds.
// =============================================================================

import { Link } from "react-router-dom";
import { formatCurrency } from "@/data/ukHubData";

interface TargetReachedBannerProps {
  campaignTitle: string;
  goalAmount: number;
  raisedAmount: number;
  spilloverAction?: string | null;
  spilloverDescription?: string | null;
  seasonName?: string | null;
  nextCampaignTitle?: string | null;
  nextCampaignSlug?: string | null;
}

const SPILOVER_LABELS: Record<string, { icon: string; label: string; description: string }> = {
  redistribute_next: {
    icon: "➡️",
    label: "Redistributed",
    description: "Surplus funds are being redirected to the next campaign in this hierarchy.",
  },
  hold_for_next_season: {
    icon: "⏸️",
    label: "Held for Next Season",
    description: "Surplus funds are held in reserve for the next funding season.",
  },
  refund_to_donors: {
    icon: "💸",
    label: "Refunded",
    description: "Surplus funds are being proportionally refunded to backers.",
  },
  donate_to_pool: {
    icon: "🤝",
    label: "Donated to Pool",
    description: "Surplus funds are donated to the community pool.",
  },
  release_to_owner: {
    icon: "✅",
    label: "Released to Owner",
    description: "Surplus funds are released to the campaign owner.",
  },
};

export function TargetReachedBanner({
  campaignTitle,
  goalAmount,
  raisedAmount,
  spilloverAction,
  spilloverDescription,
  seasonName,
  nextCampaignTitle,
  nextCampaignSlug,
}: TargetReachedBannerProps) {
  const surplus = raisedAmount - goalAmount;
  const hasSurplus = surplus > 0;
  const spilloverMeta = spilloverAction ? SPILOVER_LABELS[spilloverAction] : null;

  return (
    <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
      {/* Celebration Header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          🎉
        </div>
        <h2 className="mt-4 text-2xl font-bold text-green-900">Target Reached!</h2>
        <p className="mt-2 text-green-700">
          <span className="font-semibold">{campaignTitle}</span> has reached its funding goal.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <div className="text-sm text-gray-500">Goal</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(goalAmount)}</div>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <div className="text-sm text-gray-500">Raised</div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(raisedAmount)}</div>
        </div>
        {hasSurplus && (
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <div className="text-sm text-gray-500">Surplus</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(surplus)}</div>
          </div>
        )}
      </div>

      {/* Spillover Info */}
      {hasSurplus && spilloverMeta && (
        <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{spilloverMeta.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900">What happens to the surplus?</h3>
              <p className="mt-1 text-sm font-medium text-gray-700">{spilloverMeta.label}</p>
              <p className="mt-1 text-sm text-gray-500">
                {spilloverDescription || spilloverMeta.description}
              </p>
              {nextCampaignTitle && nextCampaignSlug && (
                <Link
                  to={`/campaigns/${nextCampaignSlug}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  View next campaign: {nextCampaignTitle} →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Season Info */}
      {seasonName && (
        <div className="mt-4 rounded-xl bg-white/60 p-3 text-center text-sm text-gray-600">
          🗓️ Part of <span className="font-semibold">{seasonName}</span> season
        </div>
      )}

      {/* No Surplus */}
      {!hasSurplus && (
        <div className="mt-6 rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            The campaign has exactly met its goal. All funds will be allocated to the campaign purpose.
          </p>
        </div>
      )}

      {/* Back to Campaign */}
      <div className="mt-6 text-center">
        <Link
          to="/campaigns"
          className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          Browse More Campaigns →
        </Link>
      </div>
    </div>
  );
}
