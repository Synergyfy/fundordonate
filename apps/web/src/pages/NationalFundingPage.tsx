import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Building2, HandHeart, Landmark, MapPin, Users } from "lucide-react";
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

export default function NationalFundingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
              <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
              Funding
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              National Funding
            </h1>
            <p className="mt-4 text-lg text-primary-100 leading-relaxed max-w-2xl">
              UK-wide funding opportunities and campaigns — the main destination for finding
              funding for businesses, communities and causes across the country.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/campaigns" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
                Browse all campaigns
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link to="/seasonal-funding" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800/60 border border-white/25 text-white font-semibold rounded-xl hover:bg-primary-800 transition-colors">
                Seasonal Funding
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <Section className="py-14 md:py-20 bg-white">
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Opportunities across the UK
            </h2>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Funding opportunities open to communities, businesses and individuals nationwide.
              Campaigns are published by organisers across the country.
            </p>
          </div>
          <CampaignGrid
            limit={9}
            emptyTitle="No national funding opportunities right now"
            emptyDescription="There are no national funding opportunities published at the moment. Check back soon, or browse all campaigns."
          />
        </div>
      </Section>

      {/* Hub funding — folded into National Funding rather than a separate page */}
      <Section className="py-14 md:py-20 bg-gray-50">
        <div className="container-page grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              Funding through UK City Hubs
            </span>
            <h2 className="mt-5 text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Local hub funding, part of the national programme
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Funding raised through UK City Hubs contributes to the national picture. Hub funding
              opportunities are listed within the national campaigns above and through the
              UK Hub Activation experience — so everything stays in one place, with no separate
              hub-funding page to keep track of.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/uk-hub-activation" className="btn-primary inline-flex items-center gap-2">
                Explore UK Hub Activation
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link to="/donate" className="btn-secondary inline-flex items-center gap-2">
                Donate instead
              </Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Building2, title: "For businesses", desc: "Find funding to start, grow or run community projects." },
              { icon: Users, title: "For communities", desc: "Back local causes and initiatives where you live." },
              { icon: HandHeart, title: "For donors", desc: "Support national and local opportunities directly." },
              { icon: MapPin, title: "Through City Hubs", desc: "Hub opportunities feed into the national programme." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <item.icon className="w-8 h-8 text-primary-500 mb-3" aria-hidden="true" />
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
