// =============================================================================
// City Hub — CTA Section
// =============================================================================

import { Link } from "react-router-dom";

interface CityHubCTAProps {
  locationName: string;
}

export function CityHubCTA({ locationName }: CityHubCTAProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to Participate in {locationName}?</h2>
        <p className="mt-2 text-primary-100">Join as a Founding Member or explore local campaigns and opportunities.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/campaigns?opportunity=hub_activation" className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-gray-100">
            Browse Opportunities
          </Link>
          <Link to="/uk-hub-activation" className="inline-flex items-center rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10">
            ← Back to UK Hub
          </Link>
        </div>
      </div>
    </section>
  );
}
