// =============================================================================
// National Hub — Activation Overview Section
// Summary stats cards for the national hub with live API wiring.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { hubProgressApi } from "@/services/hub-progress";

interface ActivationSummary {
  totalCities: number;
  active: number;
  makingProgress: number;
  needsActivation: number;
}

export function ActivationOverview() {
  const [summary, setSummary] = useState<ActivationSummary | null>(null);

  const load = useCallback(() => {
    hubProgressApi
      .getNationalSummary()
      .then((res) => {
        setSummary({
          totalCities: res.totalCities ?? 0,
          active: res.activeCities ?? 0,
          makingProgress: res.makingProgressCities ?? 0,
          needsActivation: res.needsActivationCities ?? 0,
        });
      })
      .catch((err) => {
        console.warn("Could not fetch national summary:", err);
        setSummary(null);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = summary
    ? [
        { label: "Cities", value: summary.totalCities, sublabel: "in programme" },
        { label: "Active", value: summary.active, sublabel: "cities active" },
        { label: "Making Progress", value: summary.makingProgress, sublabel: "cities progressing" },
        { label: "Inactive", value: summary.needsActivation, sublabel: "cities identified" },
      ]
    : [];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="mx-auto h-6 w-10 rounded bg-gray-200" />
                <div className="mx-auto mt-2 h-3 w-20 rounded bg-gray-100" />
              </div>
            ))
          : stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.sublabel}</div>
              </div>
            ))}
      </div>
    </section>
  );
}
