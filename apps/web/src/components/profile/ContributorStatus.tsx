// =============================================================================
// Profile — Contributor Status Section
// Shows a user's complete contribution profile: backer tier, founding memberships,
// badges earned, and contribution summary across all levels.
// =============================================================================

import { Link } from "react-router-dom";
import { BackerBadge, type BackerBadgeTier } from "@/components/hub/BackerBadge";
import { FoundingMemberBadge, getFoundingBadgeType } from "@/components/hub/FoundingMemberBadge";

interface ContributionSummary {
  totalCampaignsBacked: number;
  totalContributed: number;
  citiesBacked: string[];
  backerTier: BackerBadgeTier | null;
  foundingMemberships: {
    id: string;
    programmeId: string;
    locationId: string;
    locationName?: string;
    audience: "BUSINESS" | "CONSUMER";
    status: string;
    contributionAmount: number;
    isOriginal: boolean;
    isMonthly: boolean;
    grantedAt: string;
    benefits: string[];
  }[];
  badges: {
    id: string;
    type: string;
    tier?: string;
    locationName?: string;
    isOriginal?: boolean;
    awardedAt: string;
  }[];
}

interface ContributorStatusProps {
  data: ContributionSummary;
  /** Show as compact inline or full card */
  variant?: "card" | "inline";
}

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

export function ContributorStatus({ data, variant = "card" }: ContributorStatusProps) {
  const hasBackerStatus = !!data.backerTier;
  const hasFoundingMemberships = data.foundingMemberships.length > 0;
  const hasBadges = data.badges.length > 0;

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {data.backerTier && <BackerBadge tier={data.backerTier} size="sm" />}
        {data.foundingMemberships.map((fm) => (
          <FoundingMemberBadge
            key={fm.id}
            type={getFoundingBadgeType(fm.audience, fm.isOriginal, fm.isMonthly)}
            size="sm"
            showLabel={false}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Your Contributor Status</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.totalCampaignsBacked}</div>
          <div className="text-xs text-gray-500">Campaigns Backed</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalContributed)}</div>
          <div className="text-xs text-gray-500">Total Contributed</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.citiesBacked.length}</div>
          <div className="text-xs text-gray-500">Cities Backed</div>
        </div>
      </div>

      {/* Backer Status */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Backer Status</h3>
        {hasBackerStatus ? (
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
            <BackerBadge tier={data.backerTier!} />
            <div className="text-xs text-gray-600">
              {data.backerTier === "NATIONAL"
                ? "You have backed campaigns across multiple cities."
                : data.backerTier === "CITY"
                ? "You have significant backing in a specific city."
                : "Thank you for backing campaigns!"}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Back campaigns to earn backer status.{" "}
            <Link to="/campaigns" className="text-primary-600 hover:text-primary-700 font-medium">
              Browse campaigns →
            </Link>
          </p>
        )}
      </div>

      {/* Founding Memberships */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Founding Memberships</h3>
        {hasFoundingMemberships ? (
          <div className="space-y-2">
            {data.foundingMemberships.map((fm) => (
              <div key={fm.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-3">
                  <FoundingMemberBadge
                    type={getFoundingBadgeType(fm.audience, fm.isOriginal, fm.isMonthly)}
                    size="sm"
                    showLabel={false}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{fm.locationName}</div>
                    <div className="text-xs text-gray-500">
                      {fm.audience === "BUSINESS" ? "Business" : "Consumer"} Member
                      {fm.isOriginal && " · Original"}
                      {fm.isMonthly && " · Monthly"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(fm.contributionAmount)}</div>
                  <div className="text-xs text-gray-400">Since {new Date(fm.grantedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Join a founding programme to shape your local hub.{" "}
            <Link to="/uk-hub-activation" className="text-primary-600 hover:text-primary-700 font-medium">
              Explore programmes →
            </Link>
          </p>
        )}
      </div>

      {/* Badges Earned */}
      {hasBadges && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Badges Earned ({data.badges.length})</h3>
          <div className="flex flex-wrap gap-3">
            {data.badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
                <span className="text-sm">
                  {badge.type === "BACKER" ? "🤝" : badge.type === "FOUNDING_MEMBER" ? "⭐" : badge.type === "ORIGINAL_FOUNDING" ? "👑" : badge.type === "MONTHLY_FOUNDING" ? "🔄" : "💎"}
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {badge.type === "BACKER" ? `${badge.tier || "Backer"} Badge` :
                   badge.type === "ORIGINAL_FOUNDING" ? "Original Founding Member" :
                   badge.type === "MONTHLY_FOUNDING" ? "Monthly Founding Member" :
                   badge.type === "FOUNDING_MEMBER" ? "Founding Member" :
                   badge.type === "MEMBERSHIP" ? "Premium Member" : badge.type}
                </span>
                {badge.locationName && (
                  <span className="text-[10px] text-gray-400">· {badge.locationName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cities Backed */}
      {data.citiesBacked.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Cities You've Backed</h3>
          <div className="flex flex-wrap gap-2">
            {data.citiesBacked.map((city) => (
              <span key={city} className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                🏙️ {city}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
