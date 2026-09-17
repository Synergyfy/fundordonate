import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Heart, ArrowRight, Target, Users, Building2, CheckCircle2,
  Megaphone, Gift, Globe, Shield, HandHeart,
} from "lucide-react";

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id={id} ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </section>
  );
}

export default function FundVsDonatePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30 py-4 sm:py-6">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              Fund vs{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">Donate</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              FundOrDonate offers two ways to support your Local Hub. Both contribute to your community —
              but in different ways. Here's how to choose.
            </p>
          </div>
        </div>
      </section>

      {/* Side by Side Comparison */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Fund */}
            <div className="p-8 bg-white rounded-2xl border-2 border-primary-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Fund</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Support a specific project, local initiative, or Local Hub funding objective.
                Fund a campaign to help it reach its goal and see tangible progress.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Project-based contributions",
                  "Goal-oriented funding with milestones",
                  "Progress tracking and updates",
                  "Campaign-specific rewards",
                  "Transparent funding journey",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-primary-50 rounded-xl mb-6">
                <h3 className="font-bold text-primary-900 text-sm mb-1">Best for</h3>
                <p className="text-xs text-primary-700 leading-relaxed">
                  Supporting specific High Street projects, Local Hub launches, business partner
                  initiatives, and community campaigns with clear objectives.
                </p>
              </div>
              <Link to="/campaigns?mode=fund" className="btn-primary w-full justify-center inline-flex items-center gap-2">
                Fund a Campaign
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Donate */}
            <div className="p-8 bg-white rounded-2xl border-2 border-secondary-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-emerald-600 flex items-center justify-center mb-5 shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Donate</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Make a direct contribution to support a Local Hub, community initiative,
                or approved giving objective. Provide ongoing support to your community.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Direct community support",
                  "Hub maintenance and growth",
                  "Ongoing contributions welcome",
                  "Community-wide impact",
                  "Support without specific milestones",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-secondary-50 rounded-xl mb-6">
                <h3 className="font-bold text-secondary-900 text-sm mb-1">Best for</h3>
                <p className="text-xs text-secondary-700 leading-relaxed">
                  Supporting Local Hub operations, community programmes, ongoing initiatives,
                  and general giving to the MCOM community network.
                </p>
              </div>
              <Link to="/campaigns?mode=donation" className="btn-primary !bg-secondary-600 hover:!bg-secondary-700 w-full justify-center inline-flex items-center gap-2">
                Donate Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Key Differences */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Key Differences at a Glance</h2>
            <p className="text-gray-500">A quick comparison to help you decide</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
                <div className="p-4 text-sm font-semibold text-gray-500">Feature</div>
                <div className="p-4 text-sm font-semibold text-primary-600 text-center">Fund</div>
                <div className="p-4 text-sm font-semibold text-secondary-600 text-center">Donate</div>
              </div>
              {[
                { feature: "Contribution Type", fund: "Project-specific", donate: "Direct support" },
                { feature: "Goal Setting", fund: "Campaign has a funding goal", donate: "No specific goal required" },
                { feature: "Progress Tracking", fund: "Visible progress bar", donate: "Total contributions tracked" },
                { feature: "Updates", fund: "Campaign updates provided", donate: "Community updates" },
                { feature: "Rewards", fund: "Campaign-specific rewards", donate: "MCOM reward points" },
                { feature: "Membership", fund: "Founding Membership eligible", donate: "Founding Membership eligible" },
                { feature: "Backer Status", fund: "Business Contributors eligible", donate: "Business Contributors eligible" },
              ].map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-3 ${i < 6 ? "border-b border-gray-50" : ""}`}>
                  <div className="p-4 text-sm font-medium text-gray-700">{row.feature}</div>
                  <div className="p-4 text-sm text-gray-600 text-center">{row.fund}</div>
                  <div className="p-4 text-sm text-gray-600 text-center">{row.donate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Who Each is For */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Who Uses Each?</h2>
            <p className="text-gray-500">Both Business Owners and Local Residents can Fund or Donate</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-6 bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900">Business Owners</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Business Owners can Fund or Donate to their Local Hub. As Business Contributors,
                they receive Backer Status with national reward exchange benefits.
              </p>
              <ul className="space-y-2">
                {["Fund specific Local Hub projects", "Donate to support Hub operations", "Receive Backer Status"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary-600" />
                </div>
                <h3 className="font-bold text-gray-900">Local Residents</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Local Residents can Fund or Donate to their Local Hub. Every contribution
                earns MCOM reward points and connects you to the community.
              </p>
              <ul className="space-y-2">
                {["Fund a Local Hub campaign", "Donate to community initiatives", "Earn Founding Membership"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* What Stays the Same */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What Stays the Same</h2>
            <p className="text-gray-500">Whether you Fund or Donate, you're part of the MCOM community</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Gift, title: "MCOM Rewards", desc: "Earn reward points with every contribution" },
              { icon: Globe, title: "National Exchange", desc: "Share, Exchange and Redeem across 76 UK City Hubs" },
              { icon: Shield, title: "Transparency", desc: "Full visibility on how your contribution is used" },
              { icon: HandHeart, title: "Community Impact", desc: "Support your Local High Street and community" },
            ].map((item) => (
              <div key={item.title} className="p-5 bg-white rounded-2xl border border-gray-100 text-center">
                <item.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Still Not Sure */}
      <Section className="py-16 md:py-24">
        <div className="container-page text-center">
          <div className="max-w-2xl mx-auto">
            <Megaphone className="w-12 h-12 text-primary-500 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Still Not Sure?</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Browse our campaigns and see what resonates with you. Every contribution — Fund or Donate —
              makes a difference to your Local Hub and the MCOM community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/campaigns" className="btn-primary inline-flex items-center justify-center gap-2">
                Explore All Campaigns
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/about" className="btn-secondary inline-flex items-center justify-center gap-2">
                More About FundOrDonate
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fund or Donate to Your Local Hub</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Join the MCOM community. Support your High Street. Choose Fund or Donate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/campaigns?mode=fund" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
              Fund a Campaign
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/campaigns?mode=donation" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-800 transition-colors">
              Donate Now
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
