// =============================================================================
// UK Hub — Founding Programme Card Component
// Displays a founding programme with allocation progress and CTA.
// =============================================================================

import { Link } from "react-router-dom";
import type { FoundingProgramme } from "@/types/uk-hub";
import { FOUNDING_STATUS_META } from "@/types/uk-hub";
import { getMetalStartingPrices, getProgrammeWindow } from "@/data/ukHubData";

export const FOUNDING_BENEFIT_LABELS: Record<string, string> = {
  early_access: "Early Access",
  early_opportunities: "Early Opportunities",
  voting: "Voting Rights",
  community_voice: "Community Voice",
  events: "Events Access",
  priority_participation: "Priority Participation",
  product_upgrades: "Product Upgrades",
  community_recognition: "Community Recognition",
  founding_recognition: "Founding Recognition",
  member_badge: "Member Badge",
  basic_backer_programme: "Basic Backer Programme",
  backer_acknowledgement: "Backer acknowledgement",
  campaign_reward: "Campaign reward / product / service",
  access_90_days: "90 days access",
  access_180_days: "180 days access",
  access_annual: "Annual access",
  monthly_giving: "MCOM Monthly Giving Programme",
  business_backer_route: "Corporate Business Backer route",
  consumer_founding_route: "Consumer Founding Member route",
  cost_neutral_projects: "Supports Cost-Neutral Projects",
  pro_status: "Pro+ elevated status",
  downline: "Build downline (where applicable)",
  campaign_creation: "Qualifying campaign-creation access",
  initial_contribution: "Initial contribution to own campaign",
};

interface FoundingProgrammeCardProps {
  programme: FoundingProgramme;
  className?: string;
}

export function FoundingProgrammeCard({ programme, className }: FoundingProgrammeCardProps) {
  const meta = FOUNDING_STATUS_META[programme.status];
  const remaining = Math.max(0, programme.totalAllocation - programme.allocatedCount);
  const fillPct = programme.totalAllocation > 0
    ? Math.min(Math.round((programme.allocatedCount / programme.totalAllocation) * 100), 100)
    : 0;
  const isOpen = programme.status === "OPEN" || programme.status === "LIMITED";

  return (
    <div className={`rounded-xl border bg-white p-5 transition-all hover:shadow-md${className ? ` ${className}` : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {programme.audience === "BUSINESS" ? "🏢" : "👤"}
            </span>
            <span className="text-sm font-semibold text-gray-700">{programme.audience} Programme</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-gray-900">{programme.title}</h3>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bgColor} ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {programme.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{programme.description}</p>
      )}

      {/* Open-and-closed window */}
      {(() => {
        const w = getProgrammeWindow(programme);
        return (
          <p className={`mt-2 text-xs font-medium ${w.state === "closing_soon" ? "text-amber-600" : w.state === "closed" ? "text-gray-400" : "text-gray-500"}`}>
            {w.state === "upcoming" && `🕓 Opens ${w.opensLabel}${w.closesLabel ? ` · closes ${w.closesLabel}` : ""}`}
            {w.state === "open" && `🟢 Open · closes ${w.closesLabel} (${w.daysLeft} days left)`}
            {w.state === "closing_soon" && `⚡ Closing soon · ${w.closesLabel} (${w.daysLeft} days left)`}
            {w.state === "closed" && `🔒 Closed ${w.closesLabel ?? ""} · may reopen strategically`}
            {w.state === "open_ended" && `🟢 Open · closing date TBC`}
          </p>
        );
      })()}

      {/* Allocation Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            <span className="font-semibold text-gray-900">{programme.allocatedCount}</span> / {programme.totalAllocation} allocated
          </span>
          <span className="text-gray-500">{fillPct}% filled</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {remaining > 0 && remaining <= 20 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            ⚡ Only {remaining} spots remaining
          </p>
        )}
      </div>

      {/* Contribution tiers (Henry's 12-option matrix: starting price per metal) */}
      {(() => {
        const metals = getMetalStartingPrices(programme.contributionConfig);
        return (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Contribution tiers · Standard / Pro / Pro+</p>
            <div className="flex flex-wrap gap-1.5">
              {metals.map(m => (
                <span key={m.metal} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {m.label} from £{(m.from / 100).toLocaleString("en-GB")}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Benefits */}
      {programme.benefitConfig && (() => {
        try {
          const benefits = JSON.parse(programme.benefitConfig);
          if (Array.isArray(benefits) && benefits.length > 0) {
            return (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Benefits include</p>
                <div className="flex flex-wrap gap-1">
                  {benefits.slice(0, 3).map((b: string) => (
                    <span key={b} className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                      {FOUNDING_BENEFIT_LABELS[b] || b}
                    </span>
                  ))}
                  {benefits.length > 3 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      +{benefits.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        } catch {
          return null;
        }
      })()}

      {/* CTA */}
      <div className="mt-4">
        {isOpen ? (
          <Link to={`/founding/${programme.id}`} className="block w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700">
            {remaining > 0 ? "Join Founding Programme" : "Join Waitlist"}
          </Link>
        ) : programme.status === "FULLY_ALLOCATED" ? (
          <button className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500" disabled>
            Fully Allocated
          </button>
        ) : (
          <button className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500" disabled>
            Not Currently Open
          </button>
        )}
      </div>
    </div>
  );
}
