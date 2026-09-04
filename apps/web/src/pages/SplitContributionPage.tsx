// =============================================================================
// Split Contribution Page — Route: /split (?city=slug)
// One amount split across city / borough / high street causes, each as Fund
// or Donate — or the full amount to a single cause.
// =============================================================================

import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getLocationBySlug, getLocationById } from "@/data/ukHubData";
import { SplitContribution } from "@/components/hub/SplitContribution";

const HOW_STEPS = [
  { step: "1", title: "Set your amount", desc: "Decide the total you want to contribute — e.g. £100." },
  { step: "2", title: "Choose full or split", desc: "Give the full amount to one cause, or split it up to 4 ways." },
  { step: "3", title: "Pick each destination", desc: "For every part, choose a city, borough or high street — and whether to Fund or Donate it." },
  { step: "4", title: "Review and continue", desc: "Check the breakdown, then continue to campaigns to back each cause." },
];

export default function SplitContributionPage() {
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get("city");

  const scopedCity = useMemo(() => {
    if (!cityParam) return undefined;
    const loc = getLocationBySlug(cityParam);
    if (!loc) return undefined;
    if (loc.type === "CITY") return loc;
    if (loc.parentId) {
      const parent = getLocationById(loc.parentId);
      if (parent && parent.type === "CITY") return parent;
    }
    return undefined;
  }, [cityParam]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary-400">
              {scopedCity ? `${scopedCity.name} City Hub` : "UK Hub Activation Programme"}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Split one contribution across many causes</h1>
            <p className="mt-3 text-gray-300">
              Decide your amount, then fund it in full to one cause — or split it up to 4 ways across cities,
              boroughs and high streets, each as Fund or Donate.
            </p>
            <div className="mt-5">
              <Link
                to={scopedCity ? `/uk-hub-activation/${scopedCity.slug}` : "/uk-hub-activation"}
                className="text-xs font-semibold text-gray-300 hover:text-white"
              >
                ← Back to {scopedCity ? `${scopedCity.name} hub` : "UK hub"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map(s => (
            <div key={s.step} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{s.step}</div>
              <h3 className="mt-2 text-sm font-bold text-gray-900">{s.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Widget */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SplitContribution scopeCitySlug={scopedCity?.slug} scopeCityName={scopedCity?.name} />
      </section>

      {/* Levels explainer */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: "🏙️", title: "City", desc: "Support a whole city hub — e.g. Manchester or Birmingham." },
            { icon: "🏘️", title: "Borough", desc: "Target a borough within a city — e.g. Camden or Croydon." },
            { icon: "🛒", title: "High street", desc: "Back a specific local high street and its traders." },
          ].map(c => (
            <div key={c.title} className="rounded-xl border bg-white p-4 text-center shadow-sm">
              <span className="text-2xl">{c.icon}</span>
              <h3 className="mt-2 font-bold text-gray-900">{c.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
