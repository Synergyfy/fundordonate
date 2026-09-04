import { Link } from "react-router-dom";
import {
  MapPin, ArrowRight, Users, Building2, Megaphone, Heart, CheckCircle2,
  UserRound, BriefcaseBusiness, Lightbulb, X,
} from "lucide-react";
import { HubStatusBadge } from "./HubStatusBadge";
import {
  HUB_STATUS_META,
  OPPORTUNITY_META,
  getDemoCampaignsForLocation,
  type HubLocation,
  type OpportunityRole,
} from "@/data/hubActivation";

const OPPORTUNITY_ICONS: Record<OpportunityRole, typeof UserRound> = {
  agent: UserRound,
  account_manager: BriefcaseBusiness,
  consultant: Lightbulb,
};

function ActionForStatus({ location }: { location: HubLocation }) {
  if (location.status === "active") {
    return (
      <Link
        to={`/campaigns?location=${location.slug}`}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        Explore Local Campaigns
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }
  if (location.status === "making_progress") {
    return (
      <Link
        to={location.campaignSlugs.length ? `/campaigns/${location.campaignSlugs[0]}` : `/campaigns?location=${location.slug}`}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        Help Fund or Donate
        <Heart className="w-4 h-4" />
      </Link>
    );
  }
  return (
    <Link
      to={location.campaignSlugs.length ? `/campaigns/${location.campaignSlugs[0]}` : `/campaigns/create`}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary-600 text-white text-sm font-semibold rounded-xl hover:bg-secondary-700 transition-colors"
    >
      Help Activate This Hub
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export function LocationPanel({
  location,
  onClose,
}: {
  location: HubLocation;
  onClose?: () => void;
}) {
  const meta = HUB_STATUS_META[location.status];
  const campaigns = getDemoCampaignsForLocation(location);
  const hasOpportunities = !!location.opportunities && location.opportunities.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Images */}
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        <img
          src={location.imageOne}
          alt={`${location.name} city visual`}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
        <img
          src={location.imageTwo}
          alt={`${location.name} local community`}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">{location.name}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label={`Close ${location.name} details`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <HubStatusBadge status={location.status} />
          <span className="text-xs text-gray-400">{location.type.replace(/_/g, " ")}</span>
        </div>

        <p className="mt-3 text-sm text-gray-500 leading-relaxed">{location.shortDescription}</p>

        {/* Activation progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-700">Activation Progress</span>
            <span className={`text-sm font-bold ${meta.textClass}`}>{location.activationProgress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${meta.dotClass}`}
              style={{ width: `${location.activationProgress}%` }}
            />
          </div>
        </div>

        {/* What is happening here */}
        <div className="mt-5">
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-primary-500" />
            What is happening here
          </h4>
          <ul className="space-y-1.5">
            {location.activity.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                {a}
              </li>
            ))}
            {campaigns.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                {campaigns.length} active campaign{campaigns.length !== 1 ? "s" : ""} in this area
              </li>
            )}
          </ul>
        </div>

        {/* Campaigns connected */}
        {campaigns.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-primary-500" />
              Campaigns you can support
            </h4>
            <ul className="space-y-2">
              {campaigns.slice(0, 3).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/campaigns/${c.slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                  >
                    <span className="line-clamp-1">{c.title}</span>
                    <ArrowRight className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What the area needs */}
        {hasOpportunities && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {location.name} needs local people
            </h4>
            <ul className="space-y-1.5">
              {location.opportunities!.map((role) => {
                const m = OPPORTUNITY_META[role];
                const Icon = OPPORTUNITY_ICONS[role];
                return (
                  <li key={role} className="flex items-start gap-2 text-sm text-amber-900">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">{m.label}</span> — {m.description}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link
              to="#opportunities"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              View opportunity
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          <ActionForStatus location={location} />
          {hasOpportunities && (
            <Link
              to="#opportunities"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-amber-300 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-colors"
            >
              Explore Opportunities
            </Link>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {location.communities}
        </p>
      </div>
    </div>
  );
}
