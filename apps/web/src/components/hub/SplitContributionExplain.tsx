// =============================================================================
// UK Hub — Split Your Contribution explainer
// Explains WHAT you can do (split one amount across causes), HOW it works
// (city / borough / high street levels), and WHY you'd do it (control where
// your money goes). Reused across landing + hub pages.
// =============================================================================

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getSplitDestinations } from "@/data/ukHubData";

const LEVELS = [
  {
    icon: "🏙️",
    name: "City funding",
    scope: "Broad",
    desc: "Fund or donate to a whole city hub. Your contribution supports the full network of boroughs, high streets and campaigns across that city.",
    tag: "Broadest reach",
  },
  {
    icon: "🏘️",
    name: "Borough funding",
    scope: "More niche",
    desc: "A little more specific. Choose a borough (e.g. Camden or Croydon) and put your money towards the local communities and campaigns inside it.",
    tag: "More targeted",
  },
  {
    icon: "🛒",
    name: "High street funding",
    scope: "Most niche",
    desc: "The most specific level. Back a particular high street and its traders — supporting the exact businesses and residents on your doorstep.",
    tag: "Most specific",
  },
];

const WORKED_EXAMPLE = [
  { label: "Cause 1 — City hub", amount: "£12.50" },
  { label: "Cause 2 — Borough", amount: "£12.50" },
  { label: "Cause 3 — High street", amount: "£12.50" },
  { label: "Cause 4 — High street", amount: "£12.50" },
];

interface SplitContributionExplainProps {
  tone?: "light" | "dark";
  headline?: string;
  scopeCitySlug?: string | null;
}

export function SplitContributionExplain({
  tone = "light",
  headline = "One contribution, split your way",
  scopeCitySlug,
}: SplitContributionExplainProps) {
  const counts = useMemo(() => {
    const d = getSplitDestinations(scopeCitySlug);
    return { cities: d.cities.length, boroughs: d.boroughs.length, highStreets: d.highStreets.length };
  }, [scopeCitySlug]);

  const dark = tone === "dark";
  const baseText = dark ? "text-gray-300" : "text-gray-600";
  const baseTitle = dark ? "text-white" : "text-gray-900";
  const baseSub = dark ? "text-gray-400" : "text-gray-500";
  const cardBg = dark ? "bg-white/5 border-white/10" : "bg-white border-gray-100";
  const exampleBg = dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100";
  const linkCls = dark ? "text-primary-300 hover:text-primary-200" : "text-primary-600 hover:text-primary-700";
  const ctaPrimary = dark
    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50 transition-colors"
    : "inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors";
  const ctaGhost = dark
    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white border border-white/20 hover:bg-white/20 transition-colors"
    : "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors";

  const scopeNote = scopeCitySlug
    ? "You can split within this city or across the wider UK network — it's your money, your call."
    : "You can split across the whole UK network — cities, boroughs and high streets — or give it all to one cause.";

  return (
    <div className={`w-full rounded-3xl p-6 sm:p-8 ${dark ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900 text-white" : "bg-white border border-gray-100"}`}>
      {/* What */}
      <div className="max-w-2xl">
        <p className={`text-sm font-medium uppercase tracking-wider ${dark ? "text-primary-300" : "text-primary-600"}`}>What you can do</p>
        <h2 className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${baseTitle}`}>{headline}</h2>
        <p className={`mt-3 leading-relaxed ${baseText}`}>
          Fund or donate to a whole cause, or split one amount across several — deciding for yourself which
          part of the community your money supports. Every part is either <strong className={baseTitle}>Fund</strong>{" "}
          (backs a project towards a goal) or <strong className={baseTitle}>Donate</strong> (supports a cause outright).
        </p>
        <p className={`mt-2 text-sm ${baseSub}`}>{scopeNote}</p>
      </div>

      {/* How — the three funding levels */}
      <div className="mt-8">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${baseTitle}`}>How it breaks down — the levels of funding</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {LEVELS.map((level) => (
            <div
              key={level.name}
              className={`rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${cardBg} ${dark ? "hover:border-white/20" : "hover:border-primary-200 hover:shadow-sm"}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <div className={`font-bold text-sm ${baseTitle}`}>{level.name}</div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${level.scope === "Broad" ? (dark ? "text-primary-300" : "text-primary-600") : level.scope === "More niche" ? (dark ? "text-amber-300" : "text-amber-600") : (dark ? "text-rose-300" : "text-rose-600")}`}>
                    {level.scope}
                  </div>
                </div>
              </div>
              <p className={`mt-3 text-xs leading-relaxed ${baseText}`}>{level.desc}</p>
              <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${dark ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-600"}`}>
                {level.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Why — worked example */}
      <div className={`mt-6 grid gap-4 lg:grid-cols-2 items-center`}>
        <div>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${baseTitle}`}>Why split?</h3>
          <p className={`mt-2 text-sm leading-relaxed ${baseText}`}>
            You stay in control. Say you want to contribute <strong className={baseTitle}>£50</strong> — you can
            split it four ways, giving <strong className={baseTitle}>£12.50</strong> to each cause you care about.
          </p>
          <ul className={`mt-4 space-y-2 text-sm ${baseText}`}>
            <li className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dark ? "bg-primary-300" : "bg-primary-500"}`} />
              Spread support across several campaigns with one contribution
            </li>
            <li className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dark ? "bg-primary-300" : "bg-primary-500"}`} />
              Mix levels — a city, a borough and a high street in the same split
            </li>
            <li className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dark ? "bg-primary-300" : "bg-primary-500"}`} />
              Or fund the full £50 to one cause — it's entirely your choice
            </li>
          </ul>
        </div>
        <div className={`rounded-2xl border p-5 ${exampleBg}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-bold ${baseTitle}`}>Example — £50, four ways</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dark ? "bg-primary-100/10 text-primary-300" : "bg-primary-50 text-primary-700"}`}>Your control</span>
          </div>
          <div className="space-y-2">
            {WORKED_EXAMPLE.map(row => (
              <div key={row.label} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${cardBg}`}>
                <span className={baseText}>{row.label}</span>
                <span className={`font-bold ${baseTitle}`}>{row.amount}</span>
              </div>
            ))}
            <div className={`mt-2 flex items-center justify-between rounded-lg border-2 px-3 py-2 text-sm ${dark ? "border-primary-400/40 bg-primary-400/10" : "border-primary-200 bg-primary-50"}`}>
              <span className={`font-bold ${baseTitle}`}>Total contribution</span>
              <span className={`font-extrabold ${dark ? "text-primary-300" : "text-primary-700"}`}>£50.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          to={scopeCitySlug ? `/split?city=${scopeCitySlug}` : "/split"}
          className={ctaPrimary}
        >
          Plan your split contribution
          <span aria-hidden>→</span>
        </Link>
        <Link
          to="/campaigns"
          className={ctaGhost}
        >
          Browse all campaigns
        </Link>
      </div>
      <p className={`mt-3 text-xs ${baseSub}`}>
        {counts.cities} city hubs, {counts.boroughs} boroughs and {counts.highStreets} high streets to choose from — or give it all to one.
        <span className={dark ? " text-gray-500" : " text-gray-400"}> See how it works on the{" "}
          <Link to="/split" className={linkCls}>split page</Link>.
        </span>
      </p>
    </div>
  );
}
