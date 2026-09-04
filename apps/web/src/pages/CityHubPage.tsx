// =============================================================================
// UK Hub — City Hub Page
// Dynamic page that resolves a location slug and renders the full hub.
// Resolution: seeded location (slug-tolerant) → synthetic location built from
// map data → Not Found. Every map location therefore renders a full hub page
// with hero, progress, founding programmes, campaigns, activity and CTA.
// =============================================================================

import { useParams, Link } from "react-router-dom";
import {
  getChildLocations, DEMO_FOUNDING_PROGRAMMES, DEMO_HUB_ACTIVITY, ALL_LOCATIONS,
  resolveSeedLocation, formatNumber, formatCurrency, buildSyntheticLocation, buildSyntheticProgrammes,
  getActivationTrigger, STATUS_UNLOCKS, FOUNDING_MEMBER_PILLARS, getEventsForLocation,
} from "@/data/ukHubData";
import {
  getHubLocationBySlug, getDemoCampaignsForLocation,
} from "@/data/hubActivation";
import type { HubLocation, HubActivity, BreadcrumbItem } from "@/types/uk-hub";
import { HubBreadcrumb } from "@/components/hub/HubBreadcrumb";
import { LocationCard } from "@/components/hub/LocationCard";
import { FoundingProgrammeCard } from "@/components/hub/FoundingProgrammeCard";
import { CityHubHero } from "@/components/hub/city/CityHubHero";
import { CityProgress } from "@/components/hub/city/CityProgress";
import { LocalActivity } from "@/components/hub/city/LocalActivity";
import { CityHubCTA } from "@/components/hub/city/CityHubCTA";

const NOW = new Date().toISOString();

function mapActivityToHubActivity(activity: string[], locId: string): HubActivity[] {
  return activity.map((text, i) => ({
    id: `ha-${locId}-map-${i}`,
    locationId: locId,
    activityType: "MILESTONE" as const,
    title: text,
    content: null,
    publicationStatus: "PUBLISHED" as const,
    publishedAt: NOW,
    visibilityScope: "LOCATION" as const,
    createdAt: NOW,
  }));
}

// ───────────────────── Page ─────────────────────

export default function CityHubPage() {
  const params = useParams();
  const locationPath = params["*"] || "";
  const slug = locationPath.split("/")[0] || "";

  // 1. Seeded location (tolerates slug variants like kensington-and-chelsea).
  // 2. Synthetic location built from map data (Aberdeen, Wandsworth, …).
  const seed = resolveSeedLocation(slug, slug);
  const mapLoc = getHubLocationBySlug(slug) ?? (seed ? getHubLocationBySlug(seed.slug) : undefined);
  const location: HubLocation | null = seed ?? (mapLoc ? buildSyntheticLocation(mapLoc) : null);

  if (!location) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300">Location Not Found</h1>
          <p className="mt-4 text-gray-600">The hub location "{slug}" doesn't exist.</p>
          <Link to="/uk-hub-activation" className="btn-primary mt-6 inline-block">
            ← Back to UK Hub
          </Link>
        </div>
      </div>
    );
  }

  // Build breadcrumb ancestors
  const ancestors: BreadcrumbItem[] = [];
  let current: HubLocation | null = location;
  while (current?.parentId) {
    const parent = ALL_LOCATIONS.find(l => l.id === current!.parentId);
    if (parent) {
      ancestors.unshift({ label: parent.name, slug: parent.slug, fullPath: parent.fullPath || parent.slug, type: parent.type });
      current = parent;
    } else break;
  }

  const children = getChildLocations(location.id);

  const seededProgrammes = DEMO_FOUNDING_PROGRAMMES.filter(p => p.locationId === location.id);
  const programmes = seededProgrammes.length > 0 ? seededProgrammes : buildSyntheticProgrammes(location);
  const bizProg = programmes.find(p => p.audience === "BUSINESS");
  const consProg = programmes.find(p => p.audience === "CONSUMER");

  const seededActivity = DEMO_HUB_ACTIVITY.filter(a => a.locationId === location.id);
  const activity = seededActivity.length > 0
    ? seededActivity
    : mapLoc ? mapActivityToHubActivity(mapLoc.activity, location.id) : [];

  const campaigns = mapLoc ? getDemoCampaignsForLocation(mapLoc) : [];
  const backers = Math.floor(location.foundingBusinessAllocated * 1.5 + location.foundingConsumerAllocated * 0.8);

  const trigger = getActivationTrigger(location);
  const effectiveStatus = location.statusOverride ?? location.publicStatus;
  const unlocks = STATUS_UNLOCKS[effectiveStatus];
  const events = getEventsForLocation(location.id, location.name);
  const foundingTotal = location.foundingBusinessAllocated + location.foundingConsumerAllocated;
  const pct = (a: number, b: number) => (b > 0 ? Math.min(Math.round((a / b) * 100), 100) : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <HubBreadcrumb items={[...ancestors, { label: location.name, slug: location.slug, fullPath: location.fullPath || location.slug, type: location.type }]} />
      </div>

      <CityHubHero location={location} />
      <CityProgress location={location} bizProg={bizProg} consProg={consProg} />

      {/* Activation trigger (admin-configurable, not a universal percentage) */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900">Activation trigger</h2>
            {trigger.met ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">✓ Trigger reached</span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {Math.max(0, trigger.thresholdPct - trigger.fundingPct)}pts to trigger
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{trigger.ruleText}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Funding", value: `${formatCurrency(trigger.fundingRaised)} of ${formatCurrency(trigger.fundingTarget)}`, p: trigger.fundingPct },
              { label: "Business founding", value: `${trigger.bizAllocated} of ${trigger.bizTotal} spots`, p: pct(trigger.bizAllocated, trigger.bizTotal) },
              { label: "Consumer founding", value: `${trigger.conAllocated} of ${trigger.conTotal} spots`, p: pct(trigger.conAllocated, trigger.conTotal) },
            ].map(t => (
              <div key={t.label} className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">{t.label}</span>
                  <span className="font-bold text-gray-900">{t.p}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${t.p}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">{t.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Unlocked at this stage</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {unlocks.map(u => (
                <li key={u} className="rounded-full bg-white border px-2.5 py-1 text-[11px] font-medium text-gray-700">✓ {u}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Founding Programmes */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900">Founding Membership</h2>
        <p className="mt-1 text-gray-600">
          Join as a Founding Member and help shape this hub from the start. 🤝 {formatNumber(backers)} backers already participating.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {programmes.map(p => (
            <FoundingProgrammeCard key={p.id} programme={p} />
          ))}
        </div>
      </section>

      {/* Founding Membership means more than a label */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-gradient-to-br from-primary-50/60 to-white p-5 sm:p-6">
          <div className="rounded-xl bg-white border p-4 text-center">
            <p className="text-sm text-gray-500">Founding recognition</p>
            <p className="mt-1 text-xl font-bold text-gray-900">“I'm a founding member of the {location.name} Hub.”</p>
            <p className="mt-1 text-xs text-gray-500">{formatNumber(foundingTotal)} founding members already recognised here — a status the system honours later.</p>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Membership means something</h2>
          <p className="mt-1 text-sm text-gray-600">Founding status is a real system feature across seven pillars — recognised for voting, trials, access, upgrades, events and communications.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDING_MEMBER_PILLARS.map(pillar => (
              <div key={pillar.key} className="rounded-xl bg-white border p-4">
                <span className="text-xl">{pillar.icon}</span>
                <h3 className="mt-2 text-sm font-bold text-gray-900">{pillar.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Campaigns */}
      {campaigns.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Local Campaigns ({campaigns.length})</h2>
              <p className="mt-1 text-gray-600">Donate or pledge to campaigns in {location.name} and earn backer status.</p>
            </div>
            <Link to={`/split?city=${location.type === "CITY" ? location.slug : location.fullPath?.split("/")[0] ?? location.slug}`} className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Split one contribution across causes →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map(c => (
              <Link key={c.slug} to={`/campaigns/${c.slug}`} className="rounded-xl border bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md">
                <h3 className="font-bold text-gray-900 line-clamp-2">{c.title}</h3>
                <span className="mt-3 inline-flex text-sm font-semibold text-primary-600">View Campaign →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Child Locations */}
      {children.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Sub-Locations</h2>
          <p className="mt-1 text-gray-600">Explore boroughs and local areas within {location.name}.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map(child => (
              <LocationCard key={child.id} location={child} />
            ))}
          </div>
        </section>
      )}

      {/* Founding member events */}
      {events.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Founding member events</h2>
          <p className="mt-1 text-gray-600">Priority access for founding members in {location.name}.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {events.map(e => (
              <div key={e.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>📅</span>
                  <span>{e.eventDate ? new Date(e.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date TBC"}</span>
                </div>
                <h3 className="mt-1 font-bold text-gray-900">{e.title}</h3>
                {e.description && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{e.description}</p>}
                {e.ctaLabel && (
                  <span className="mt-3 inline-flex text-sm font-semibold text-primary-600">{e.ctaLabel} →</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <LocalActivity activity={activity} />
      <CityHubCTA locationName={location.name} />
    </div>
  );
}
