import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Heart, ArrowRight, Search, Target, Gift, Users, Building2,
  CheckCircle2, Share2, CreditCard, Smartphone, Globe,
} from "lucide-react";

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id={id} ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30 py-16 md:py-24">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              How{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">FundOrDonate</span>{" "}
              Works
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Discover, Fund or Donate to Local Hubs on your High Street in a few simple steps.
              Join the MCOM community and start sharing, exchanging and redeeming rewards.
            </p>
          </div>
        </div>
      </section>

      {/* Main Steps */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary-200 via-secondary-200 to-primary-200" />
              {[
                {
                  step: "01",
                  icon: Search,
                  title: "Find Your Local Hub",
                  desc: "Browse Local Hubs on UK High Streets. Search by borough, category, or mode. Find a Hub that matters to you in your local community.",
                  color: "from-primary-500 to-blue-600",
                },
                {
                  step: "02",
                  icon: Target,
                  title: "Choose Fund or Donate",
                  desc: "Decide whether to Fund a project or Donate to a Local Hub. Fund supports a specific initiative. Donate provides direct community support.",
                  color: "from-secondary-500 to-emerald-600",
                },
                {
                  step: "03",
                  icon: Gift,
                  title: "Receive Rewards",
                  desc: "Consumer Founding Members earn MCOM reward points. Business Contributors receive Backer Status. Share, Exchange and Redeem Nationally.",
                  color: "from-primary-500 to-secondary-500",
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center mx-auto mb-5 relative z-10 bg-white">
                    <item.icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-bold text-primary-300">{item.step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* For Local Residents */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-100 text-secondary-700 text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                For Local Residents
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                How Local Residents<br />
                <span className="text-secondary-600">Fund or Donate</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Local Residents can discover their Local Hub and choose to Fund or Donate.
                Every contribution connects you to the MCOM community and earns reward points.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Search, title: "Discover Your Local Hub", desc: "Browse campaigns on your local High Street. Filter by borough, category, or mode." },
                  { icon: CreditCard, title: "Fund or Donate", desc: "Choose a campaign and make your contribution. Fund a specific project or Donate to support the Hub." },
                  { icon: Gift, title: "Earn MCOM Rewards", desc: "Receive a Consumer Founding Membership. Earn reward points that you can Share, Exchange and Redeem Nationally." },
                  { icon: Smartphone, title: "Share with VCard", desc: "Use Mobile VCard to share campaigns with friends and family. Scan, share, and support your community." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Your Journey</h3>
                  <div className="space-y-4">
                    {[
                      "Find your Local Hub on the High Street",
                      "Browse Fund or Donate campaigns",
                      "Make your contribution",
                      "Receive Founding Membership",
                      "Earn MCOM reward points",
                      "Share, Exchange and Redeem Nationally",
                    ].map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
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

      {/* For Business Owners */}
      <Section className="py-16 md:py-24">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative hidden lg:block">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Your Journey</h3>
                  <div className="space-y-4">
                    {[
                      "Join your Local Hub as a Business Owner",
                      "Become a Business Contributor",
                      "Receive Backer Status",
                      "Participate in Fund or Donate campaigns",
                      "Offer Gift Cards, Vouchers, Coupons, Deals",
                      "Share, Exchange and Redeem Nationally",
                    ].map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                For Business Owners
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                How Business Owners<br />
                <span className="text-primary-600">Participate</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Business Owners can join their Local Hub as a Business Contributor. Receive Backer Status
                and connect with Local Residents through the MCOM community ecosystem.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Building2, title: "Join Your Local Hub", desc: "Register as a Business Owner and connect with your local High Street Hub." },
                  { icon: Users, title: "Become a Business Contributor", desc: "Contribute to your Local Hub and receive Backer Status with national reward exchange benefits." },
                  { icon: Share2, title: "Share Exchange Redeem", desc: "Offer Gift Cards, Vouchers, Coupons, and Deals. Connect with Local Residents through MCOM." },
                  { icon: Globe, title: "Go National", desc: "Your Backer Status works across all 76 UK City Hubs. Share, Exchange and Redeem Nationally." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Fund vs Donate Quick Reference */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Fund or Donate?</h2>
            <p className="text-gray-500">Two ways to support your Local Hub</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-8 bg-white rounded-2xl border border-primary-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fund</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Support a specific project, local initiative, or Local Hub funding objective.
                Fund a campaign to help it reach its goal.
              </p>
              <ul className="space-y-2">
                {["Project-based contributions", "Goal-oriented funding", "Progress tracking", "Campaign milestones"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-secondary-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-emerald-600 flex items-center justify-center mb-5 shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Donate</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Make a direct contribution to support a Local Hub, community initiative,
                or approved giving objective.
              </p>
              <ul className="space-y-2">
                {["Direct community support", "Hub maintenance and growth", "Ongoing contributions", "Community impact"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/fund-vs-donate" className="btn-secondary inline-flex items-center gap-2">
              Learn more about Fund vs Donate
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Find your Local Hub and start supporting your community through Fund or Donate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/campaigns" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
              Find Your Local Hub
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/fund-vs-donate" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-800 transition-colors">
              Understand Fund vs Donate
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
