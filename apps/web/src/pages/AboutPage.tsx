import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  ArrowRight, CalendarDays, Heart, HelpCircle, Landmark,
  MapPin, Megaphone, Search, ShieldCheck, Target, Users,
} from "lucide-react";

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Discover",
    description: "Explore national and seasonal funding, campaigns and donation opportunities — or find a UK City Hub near you.",
  },
  {
    icon: Heart,
    title: "Contribute",
    description: "Fund or donate to the opportunities that matter to you, in a few clear steps.",
  },
  {
    icon: Target,
    title: "Follow the impact",
    description: "Track progress on every campaign and see the difference your support makes.",
  },
];

const WHAT_YOU_CAN_DO = [
  {
    to: "/funding",
    icon: Landmark,
    title: "Explore funding",
    description: "UK-wide funding opportunities for businesses, communities and causes — with seasonal funding alongside.",
  },
  {
    to: "/campaigns",
    icon: Megaphone,
    title: "Back a campaign",
    description: "Browse campaigns, understand what they need and fund or donate to the ones you believe in.",
  },
  {
    to: "/uk-hub-activation",
    icon: MapPin,
    title: "Activate UK hubs",
    description: "Explore the UK Hub Activation programme and get involved in your local City Hub.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is FundOrDonate?",
    a: "FundOrDonate is a UK platform that brings funding opportunities, campaigns and donations together in one place — so individuals, businesses and communities can find support and give support.",
  },
  {
    q: "What is the difference between funding and donating?",
    a: "Funding usually means contributing towards a campaign with a specific goal and outcome. Donating means giving to support a cause. Campaigns on FundOrDonate can accept either, depending on how they are set up.",
  },
  {
    q: "How do I find funding opportunities?",
    a: "Start with the National Funding page for UK-wide opportunities, or the Seasonal Funding page for opportunities tied to the current season.",
  },
  {
    q: "How do I support a campaign?",
    a: "Browse the campaigns, open the one you want to support and follow its participation options — funding or donating takes just a few steps.",
  },
  {
    q: "What is UK Hub Activation?",
    a: "UK Hub Activation is the programme that establishes City Hubs across the UK, connecting local businesses, residents and campaigns. Each hub is part of a wider national community.",
  },
  {
    q: "How do I contact you?",
    a: "Use the Contact page to send the team a message, or email hello@fundordonate.com directly.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30 py-14 md:py-20">
        <div className="container-page max-w-3xl text-center mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700 shadow-sm">
            About
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Funding that connects{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
              communities
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            FundOrDonate is a simple, focused platform for discovering funding, backing campaigns
            and giving donations — for businesses, communities and causes across the UK.
          </p>
        </div>
      </section>

      {/* What is FundOrDonate */}
      <Section className="py-16 md:py-20">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What is FundOrDonate?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                FundOrDonate exists to make funding easy to find and easy to give. Organisers
                publish opportunities — funding campaigns, donation drives and seasonal
                programmes — and supporters discover them in one place.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Alongside national campaigns, the platform powers UK Hub Activation: a programme
                that brings businesses and residents together through City Hubs on local high
                streets.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Everything is designed to be clear and transparent, so you always know what you
                are supporting and what it will achieve.
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  {[
                    { icon: Landmark, label: "National & Seasonal Funding", desc: "UK-wide funding opportunities" },
                    { icon: Megaphone, label: "Campaigns & Donations", desc: "Browse, fund or donate" },
                    { icon: MapPin, label: "UK Hub Activation", desc: "City Hubs across the country" },
                    { icon: ShieldCheck, label: "Transparent by design", desc: "Clear goals and progress" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                        <div className="text-xs text-gray-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="py-16 md:py-20 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500">Three simple steps, from discovery to impact.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-gray-400">Step {i + 1}</span>
                <h3 className="font-bold text-gray-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* What you can do */}
      <Section className="py-16 md:py-20">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What you can do here</h2>
            <p className="text-gray-500">Three ways to take part on FundOrDonate.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {WHAT_YOU_CAN_DO.map(({ to, icon: Icon, title, description }) => (
              <Link
                key={to}
                to={to}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary-50 border border-secondary-100 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-secondary-600" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-primary-700 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                  Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="py-16 md:py-20 bg-gray-50" id="faq">
        <div className="container-page max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700 mb-4">
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="group rounded-xl border border-gray-200 bg-white px-5 py-4 open:shadow-sm">
                <summary className="cursor-pointer list-none font-semibold text-gray-900 text-sm sm:text-base flex items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ArrowRight
                    className="w-4 h-4 mt-1 shrink-0 text-primary-500 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Still have a question?{" "}
            <Link to="/contact" className="font-semibold text-primary-600 hover:text-primary-700">
              Contact us
            </Link>
            .
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-16 md:py-20 bg-primary-600 text-white">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Explore funding opportunities, back a campaign or support a cause today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/funding" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
              Explore Funding
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link to="/campaigns" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-800 transition-colors">
              <CalendarDays className="w-5 h-5" aria-hidden="true" />
              Browse Campaigns
            </Link>
          </div>
        </div>
      </Section>

      {/* Audience note */}
      <section className="border-t border-gray-100 bg-white">
        <div className="container-page py-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-500" aria-hidden="true" />
            For businesses, communities and donors
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4 text-secondary-500" aria-hidden="true" />
            Across the UK
          </span>
          <Link to="/contact" className="font-semibold text-primary-600 hover:text-primary-700">
            Talk to us
          </Link>
        </div>
      </section>
    </>
  );
}
