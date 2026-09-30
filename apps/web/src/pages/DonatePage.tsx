import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, CheckCircle2, Heart, Search, ShieldCheck, Sparkles } from "lucide-react";
import { CampaignGrid } from "@/components/public/CampaignGrid";

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

const DONATION_STEPS = [
  {
    icon: Search,
    title: "Choose a cause",
    description: "Browse donation opportunities from communities, organisations and fundraisers across the UK.",
  },
  {
    icon: Heart,
    title: "Give your contribution",
    description: "Support the campaign with a donation. Every contribution moves the campaign closer to its goal.",
  },
  {
    icon: ShieldCheck,
    title: "Follow the impact",
    description: "Track how the campaign is progressing and see the difference your support makes.",
  },
];

export default function DonatePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 text-white">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
              <Heart className="w-3.5 h-3.5" aria-hidden="true" />
              Donate
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Discover donation opportunities
            </h1>
            <p className="mt-4 text-lg text-secondary-100 leading-relaxed max-w-2xl">
              Find causes worth supporting and make a donation in minutes. Campaigns are open to
              donors across the UK — give what you can, to what matters to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#donation-campaigns" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary-700 font-semibold rounded-xl hover:bg-secondary-50 transition-colors">
                Find a cause
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <Link to="/funding" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-700/60 border border-white/25 text-white font-semibold rounded-xl hover:bg-secondary-700 transition-colors">
                Explore funding
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Donation campaigns */}
      <Section className="py-14 md:py-20 bg-white" id="donation-campaigns">
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Donation opportunities
            </h2>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Campaigns accepting donations right now. Open a campaign to see its full story and
              take part.
            </p>
          </div>
          <CampaignGrid
            limit={9}
            mode="donation"
            emptyTitle="No donation opportunities right now"
            emptyDescription="There are no donation campaigns open at the moment. New causes are published regularly — browse everything that is currently live."
            skeletonCount={3}
          />
        </div>
      </Section>

      {/* How donating works */}
      <Section className="py-14 md:py-20 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 mb-2">How it works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Donating in three steps</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {DONATION_STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                <div className="w-11 h-11 rounded-xl bg-secondary-50 border border-secondary-100 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-5 h-5 text-secondary-600" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-gray-400">Step {i + 1}</span>
                <h3 className="font-bold text-gray-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2">
              Browse all campaigns
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Reassurance strip */}
      <section className="border-t border-gray-100 bg-white">
        <div className="container-page py-8 grid sm:grid-cols-3 gap-6 text-sm">
          {[
            { icon: CheckCircle2, text: "Clear goals and progress for every campaign" },
            { icon: ShieldCheck, text: "Secure contribution flow with confirmation" },
            { icon: Sparkles, text: "Follow the impact after you give" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-gray-600">
              <item.icon className="w-5 h-5 text-secondary-500 shrink-0" aria-hidden="true" />
              {item.text}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
