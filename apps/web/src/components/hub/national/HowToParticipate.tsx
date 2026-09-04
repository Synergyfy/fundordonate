// =============================================================================
// National Hub — How to Participate Section
// Three-card CTA for businesses, consumers, and map.
// =============================================================================

import { Link } from "react-router-dom";

export function HowToParticipate() {
  const cards = [
    {
      icon: "🏢",
      title: "Business Founding Member",
      description: "Join as a Founding Business Member of your local City Hub. Gain early access, priority participation and recognition.",
      cta: "Explore Business Programme",
      href: "/campaigns?opportunity=hub_activation",
    },
    {
      icon: "👤",
      title: "Consumer Founding Member",
      description: "Become a Founding Consumer Member. Support your local community and receive recognition and events access.",
      cta: "Explore Consumer Programme",
      href: "/campaigns?opportunity=hub_activation",
    },
    {
      icon: "🗺️",
      title: "View the Map",
      description: "Explore the UK Hub Activation map. Find your nearest city, see activation status and discover local opportunities.",
      cta: "Open Interactive Map",
      href: "/uk-hub-activation/map",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-center text-2xl font-bold text-gray-900">How to Participate</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {cards.map(card => (
          <div key={card.title} className="rounded-xl border bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-2xl">{card.icon}</div>
            <h3 className="mt-4 font-bold text-gray-900">{card.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            <Link to={card.href} className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700">
              {card.cta} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
