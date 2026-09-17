import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  ArrowRight, Building2, Users, Globe, Shield,
  Gift, Smartphone, Award, CheckCircle2, Target,
} from "lucide-react";

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id={id} ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30 py-4 sm:py-6">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              Fund or Donate to Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">Local Hub</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              FundOrDonate supports Hyper Local National Reward and Loyalty Fund or Donate Hubs on UK High Streets.
              Business Owners and Local Residents can Fund or Donate to their Local Hub when shopping on their Local High Street.
            </p>
          </div>
        </div>
      </section>

      {/* What is FundOrDonate */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What is FundOrDonate?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                FundOrDonate is a platform built to empower Local High Streets across the UK. We provide the tools
                for communities to establish Hyper Local National Reward and Loyalty Fund or Donate Hubs — connecting
                Business Owners and Local Residents through cost-neutral community funding.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Each Local Hub operates as a community anchor on a High Street, where local businesses participate as
                Business Contributors and receive Backer Status, and Local Residents can Fund or Donate while earning
                MCOM reward points.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our aim is to establish 76 National UK City Hubs, with co-branded Business Partner Hubs in every major
                city. The platform currently demonstrates this vision through London borough campaigns.
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  {[
                    { icon: Building2, label: "Business Owners", desc: "Participate in Local Hubs" },
                    { icon: Users, label: "Local Residents", desc: "Fund or Donate to Hubs" },
                    { icon: Globe, label: "76 UK City Hubs", desc: "National coverage" },
                    { icon: Gift, label: "Rewards", desc: "Share, Exchange, Redeem" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary-600" />
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

      {/* Local Hubs */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What Are Local Hubs?</h2>
            <p className="text-gray-500">
              Local Hubs are the foundation of the FundOrDonate ecosystem
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10">
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                We set up individual Hyper Local National Reward and Loyalty Fund or Donate Hubs on Local High Streets
                so Business Owners and Local Residents can Fund or Donate to their Local Hub when shopping on their Local High Street.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-5 bg-primary-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    For Local Business Owners
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Share, Exchange and Redeem Nationally — Gift Card, Vouchers, Coupons, Deals.
                    Participate as Business Contributors and receive Backer Status with national reward exchange benefits.
                  </p>
                </div>
                <div className="p-5 bg-secondary-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary-600" />
                    For Local Residents
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Share, Exchange and Redeem Nationally — Gift Card, Vouchers, Coupons, Deals.
                    Fund or Donate to your Local Hub and receive MCOM reward points and Founding Membership benefits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* MCOM Ecosystem */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Part of the MCOM Ecosystem</h2>
            <p className="text-gray-500">
              FundOrDonate is one component of the broader MCOM community platform
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: "1", title: "MCOM Community", desc: "The overarching community network connecting Local Hubs across the UK" },
                { step: "2", title: "Local Hubs", desc: "Hyper Local National Reward and Loyalty Hubs on High Streets" },
                { step: "3", title: "Business Owners + Local Residents", desc: "Participants who Fund or Donate to their Local Hub" },
                { step: "4", title: "Share, Exchange, Redeem", desc: "Gift Cards, Vouchers, Coupons, and Deals across the MCOM network" },
              ].map((item) => (
                <div key={item.step} className="text-center p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Why FundOrDonate */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why FundOrDonate</h2>
            <p className="text-gray-500">Built for transparency, simplicity, and real community impact</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Transparent & Secure", desc: "Every Fund or Donate transaction is tracked. Full visibility for Business Contributors, Local Residents, and Hub Coordinators." },
              { icon: Target, title: "Cost-Neutral Funding", desc: "Join MCOM community's cost-neutral funding model. Local Business Owners and Local Residents fund their local communities." },
              { icon: Globe, title: "76 UK City Hubs", desc: "Our aim is to establish 76 National UK City Hubs. Co-Branded Business Partner Hubs across the UK." },
              { icon: Smartphone, title: "Share Exchange Redeem", desc: "Founding Members share, exchange and redeem nationally — Gift Cards, Vouchers, Coupons, and Deals." },
              { icon: Gift, title: "Founding Membership", desc: "Consumer Receive A Founding Membership. Fund or Donate and receive a free Gift or MCOM Reward point." },
              { icon: Award, title: "Backer Status", desc: "Business Contributors receive Backer Status with national reward exchange benefits across the MCOM network." },
            ].map((item) => (
              <div key={item.title} className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <item.icon className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* For Business Owners */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                For Business Owners
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Business Contributors<br />
                <span className="text-primary-600">Receive Backer Status</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Business owners can join the MCOM community. Fund or Donate to your Local Hub and receive
                Backer Status with national reward exchange benefits across Gift Cards, Vouchers, Coupons, and Deals.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Co-Branded Business Partner Hubs across 76 UK City Hubs",
                  "Backer Status with national reward exchange",
                  "Share, Exchange and Redeem Nationally",
                  "Cost-neutral community funding model",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/campaigns?mode=fund" className="btn-primary inline-flex items-center gap-2">
                Join as Business Contributor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Business Owner Journey</h3>
                  <div className="space-y-3">
                    {[
                      "Join your Local Hub as a Business Contributor",
                      "Receive Backer Status",
                      "Share, Exchange and Redeem Nationally",
                      "Offer Gift Cards, Vouchers, Coupons, and Deals",
                      "Connect with Local Residents through MCOM",
                    ].map((step, i) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-600">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* For Local Residents */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative hidden lg:block">
              <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Local Resident Journey</h3>
                  <div className="space-y-3">
                    {[
                      "Discover your Local Hub on your High Street",
                      "Fund or Donate to a Local Hub campaign",
                      "Receive a Consumer Founding Membership",
                      "Earn MCOM reward points",
                      "Share, Exchange and Redeem Nationally",
                    ].map((step, i) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-600">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-100 text-secondary-700 text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                For Local Residents
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Consumer Founding<br />
                <span className="text-secondary-600">Membership</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Local Residents can Fund or Donate to their Local Hub and receive a Consumer Founding Membership.
                Earn MCOM reward points and share, exchange and redeem nationally across the MCOM community network.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Fund or Donate to your Local Hub",
                  "Receive a Consumer Founding Membership",
                  "Earn MCOM reward points with every contribution",
                  "Share, Exchange and Redeem Nationally",
                  "Access Gift Cards, Vouchers, Coupons, and Deals",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/campaigns?mode=donation" className="btn-primary !bg-secondary-600 hover:!bg-secondary-700 inline-flex items-center gap-2">
                Find Your Local Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Fund or Donate?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Join the MCOM community. Explore Local Hubs, support your High Street, and be part of something bigger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/campaigns" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
              Find Your Local Hub
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-800 transition-colors">
              Learn How It Works
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
