import { Link, useLocation } from "react-router-dom";
import { Store, Users, ArrowRight, Target, Clock, Heart } from "lucide-react";

const WHAT_YOU_GET = [
  {
    icon: Target,
    title: "Fund or Donate",
    text: "Every campaign is clearly labelled as Fund or Donate, so you always know how to take part.",
  },
  {
    icon: Clock,
    title: "Live progress & deadlines",
    text: "See how much has been raised, how much is left to go and exactly how many days remain.",
  },
  {
    icon: Heart,
    title: "Campaigns close to home",
    text: "Browse campaigns by city, borough and high street to support the places you care about.",
  },
];

const PATHS = [
  {
    to: "/campaigns/business",
    icon: Store,
    title: "Business Campaigns",
    text: "Back independent shops, services and business projects on UK high streets as they grow.",
    bullets: [
      "Campaigns run by verified business owners",
      "Funding goals, progress and days remaining",
      "Fund or Donate to a business you believe in",
    ],
    accent: "from-blue-600 to-blue-700",
    dot: "bg-blue-500",
  },
  {
    to: "/campaigns/consumer",
    icon: Users,
    title: "Consumer Campaigns",
    text: "Support community causes, events and local projects led by residents across the UK.",
    bullets: [
      "Campaigns led by communities and residents",
      "Live progress, locations and supporter counts",
      "Fund or Donate to the causes that matter to you",
    ],
    accent: "from-pink-600 to-pink-700",
    dot: "bg-pink-500",
  },
];

export default function CampaignsIndexPage() {
  const location = useLocation();
  const query = location.search;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 px-4 py-12 text-center text-white sm:py-16">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Explore Campaigns</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Two ways to take part — choose who you're browsing for, then explore live
          Fund and Donate campaigns across UK high streets.
        </p>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Find campaigns worth backing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500">
            Every campaign on FundOrDonate is either a Fund campaign — help a project hit its
            goal — or a Donate campaign — give directly to a local cause. Pick a path below and
            you'll see live progress, deadlines, locations and rewards on every campaign.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {WHAT_YOU_GET.map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Choose your path */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PATHS.map((path) => (
            <Link
              key={path.to}
              to={`${path.to}${query}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${path.accent} text-white`}>
                <path.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-primary-600">
                {path.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{path.text}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {path.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${path.dot}`} aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600">
                Browse {path.title.toLowerCase()}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
