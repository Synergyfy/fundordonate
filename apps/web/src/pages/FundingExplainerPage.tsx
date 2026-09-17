// =============================================================================
// Funding Explainer Page
// Explains the difference between Campaign, Funding Target, and Contribution
// with visual examples.
// =============================================================================

import { Link } from "react-router-dom";
import {
  Target, TrendingUp, Heart, ArrowRight, CheckCircle2, Building2, Users,
  PoundSterling, BarChart3, Wallet,
} from "lucide-react";

const DIFFERENCES = [
  {
    icon: Target,
    title: "Campaign",
    color: "from-primary-500 to-blue-600",
    description: "The programme or activity you are participating in. A campaign has a purpose, a location, an audience, and a funding target.",
    example: {
      title: "Manchester Autumn Community Campaign",
      details: [
        "Purpose: Support local hub improvements",
        "Location: Manchester, City Centre",
        "Audience: Consumers & Business Owners",
        "Duration: Sep 1 – Nov 30, 2026",
      ],
    },
  },
  {
    icon: TrendingUp,
    title: "Funding Target",
    color: "from-secondary-500 to-emerald-600",
    description: "The financial goal the campaign is trying to reach. This is the total amount needed to achieve the campaign's objective.",
    example: {
      title: "£200,000 Target",
      details: [
        "This is the total funding goal",
        "Progress is tracked as contributions come in",
        "Can be city-level, borough-level, or campaign-level",
        "Once reached, spillover rules apply",
      ],
    },
  },
  {
    icon: Heart,
    title: "Contribution",
    color: "from-pink-500 to-rose-500",
    description: "The actual amount you (or others) contribute towards the campaign. This is what moves the needle on the funding target.",
    example: {
      title: "£50 Contribution",
      details: [
        "You choose the amount",
        "Can be one-time or monthly",
        "May come with rewards",
        "Feeds into the funding target progress",
      ],
    },
  },
];

const EXAMPLES = [
  {
    title: "Business Owner Contribution",
    icon: Building2,
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    items: [
      { label: "Campaign", value: "Manchester Community Fund" },
      { label: "Target", value: "£200,000" },
      { label: "Sarah contributes", value: "£5,000" },
      { label: "Progress after", value: "£125,000 / £200,000 (62.5%)" },
      { label: "Sarah's status", value: "Founding Business Member" },
    ],
  },
  {
    title: "Consumer Contribution",
    icon: Users,
    iconColor: "text-primary-500",
    bg: "bg-primary-50",
    items: [
      { label: "Campaign", value: "Manchester Community Fund" },
      { label: "Target", value: "£200,000" },
      { label: "James contributes", value: "£50" },
      { label: "Progress after", value: "£125,050 / £200,000 (62.525%)" },
      { label: "James's status", value: "Backer" },
    ],
  },
];

const FLOW_STEPS = [
  { step: "1", title: "Campaign Created", desc: "Admin creates a campaign with a funding target, audience, and locations.", icon: Target },
  { step: "2", title: "Contributions Come In", desc: "Business owners and consumers contribute amounts towards the campaign.", icon: Heart },
  { step: "3", title: "Funding Progress", desc: "The campaign's funding bar fills up as contributions are received.", icon: TrendingUp },
  { step: "4", title: "Target Reached", desc: "Once the target is met, spillover rules apply (continue, extend, or allocate).", icon: CheckCircle2 },
];

export default function FundingExplainerPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary-200">Understanding FundOrDonate</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Campaign, Funding & Contribution</h1>
            <p className="mt-3 text-primary-100">
              Understand the difference between a campaign, a funding target, and a contribution — and how they work together to build stronger communities.
            </p>
          </div>
        </div>
      </section>

      {/* The Three Concepts */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">The Three Core Concepts</h2>
          <p className="text-gray-500">Every interaction on FundOrDonate involves these three elements.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {DIFFERENCES.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.description}</p>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Example: {item.example.title}</div>
                <ul className="space-y-1">
                  {item.example.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Flow */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How They Work Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FLOW_STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <s.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-xs font-bold text-primary-600 mb-1">Step {s.step}</div>
                <div className="text-sm font-bold text-gray-900 mb-1">{s.title}</div>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Examples */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">See It In Action</h2>
          <p className="text-gray-500">Real examples of how contributions feed into campaign funding targets.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className={`rounded-2xl border ${ex.bg} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <ex.icon className={`h-6 w-6 ${ex.iconColor}`} />
                <h3 className="text-lg font-bold text-gray-900">{ex.title}</h3>
              </div>
              <div className="space-y-3">
                {ex.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/80 px-4 py-2.5">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Points */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6">Key Points to Remember</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Target, title: "Campaigns are containers", desc: "They hold the purpose, audience, locations, and rules for participation." },
              { icon: TrendingUp, title: "Targets are goals", desc: "The funding target is what the campaign is trying to achieve financially." },
              { icon: Heart, title: "Contributions are actions", desc: "Each contribution moves the campaign closer to its funding target." },
              { icon: BarChart3, title: "Progress is tracked", desc: "You can see real-time progress, audience breakdown, and leaderboard positions." },
              { icon: Wallet, title: "Rewards may apply", desc: "Depending on campaign config, contributors may earn rewards for their participation." },
              { icon: PoundSterling, title: "Spillover when target is met", desc: "When a target is reached, surplus can be carried forward, extended, or allocated." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-4">
                <item.icon className="h-5 w-5 text-primary-300 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold">{item.title}</div>
                  <p className="text-xs text-gray-300 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Contribute?</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            Browse campaigns, understand the funding objective, and make your contribution.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/campaigns" className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
              Browse Campaigns <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
            <Link to="/uk-hub-activation" className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              View UK Hub Activation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
