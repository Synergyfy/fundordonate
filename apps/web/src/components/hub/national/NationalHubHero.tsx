// =============================================================================
// National Hub — Hero Section
// =============================================================================

import { Link } from "react-router-dom";
import { NATIONAL_HUB } from "@/data/ukHubData";

export function NationalHubHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&h=800&q=80')] bg-cover bg-center opacity-20" />
      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-400">UK Hub Activation Programme</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {NATIONAL_HUB.heroHeadline || "UK Hub Activation Programme"}
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            {NATIONAL_HUB.heroSupportingText || "Connecting cities, businesses and communities across the United Kingdom."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/uk-hub-activation/map"
              className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              View Interactive Map →
            </Link>
            <Link
              to="/campaigns?opportunity=hub_activation"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20"
            >
              Browse Opportunities
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
