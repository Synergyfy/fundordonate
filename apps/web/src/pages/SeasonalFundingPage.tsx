import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarDays, Leaf, RotateCcw, Snowflake, Sun } from "lucide-react";
import { seasonApi, type Season } from "@/services/season.service";

type LoadStatus = "loading" | "success" | "error";

const SEASON_STYLES: Record<string, { icon: typeof Leaf; color: string; bg: string }> = {
  ACTIVE: { icon: Leaf, color: "text-secondary-600", bg: "bg-secondary-50 border-secondary-100" },
  SCHEDULED: { icon: Snowflake, color: "text-primary-600", bg: "bg-primary-50 border-primary-100" },
  COMPLETED: { icon: Sun, color: "text-gray-500", bg: "bg-gray-50 border-gray-100" },
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Open now",
  SCHEDULED: "Upcoming",
  COMPLETED: "Completed",
  DRAFT: "Draft",
  PAUSED: "Paused",
};

function formatDateRange(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null;
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

function SeasonCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse" aria-hidden="true">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  );
}

export default function SeasonalFundingPage() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [seasons, setSeasons] = useState<Season[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await seasonApi.list();
      const list = res?.seasons || [];
      setSeasons(list);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-700 text-white">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
              <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
              Funding
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Seasonal Funding
            </h1>
            <p className="mt-4 text-lg text-secondary-100 leading-relaxed max-w-2xl">
              Funding opportunities associated with the seasons — follow the UK Activation
              Programme as each season opens, runs and completes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/campaigns" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary-700 font-semibold rounded-xl hover:bg-secondary-50 transition-colors">
                Browse campaigns
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link to="/funding" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-700/60 border border-white/25 text-white font-semibold rounded-xl hover:bg-secondary-700 transition-colors">
                National Funding
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seasons */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Seasons</h2>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Each season is a funding window with its own dates and targets. Open seasons are
              accepting participation; upcoming seasons are announced in advance.
            </p>
          </div>

          {status === "loading" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Loading seasons">
              <SeasonCardSkeleton />
              <SeasonCardSkeleton />
              <SeasonCardSkeleton />
            </div>
          )}

          {status === "error" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-gray-900 mb-1">Seasons could not be loaded</h3>
              <p className="text-sm text-gray-600 mb-4">Something went wrong while loading the seasons. Please try again.</p>
              <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          )}

          {status === "success" && seasons.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
              <CalendarDays className="w-8 h-8 text-primary-400 mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-gray-900 mb-1">No seasons have been announced</h3>
              <p className="text-sm text-gray-600 mb-4">
                There are no funding seasons right now. Browse the campaigns that are still open.
              </p>
              <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2">
                Browse campaigns
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          {status === "success" && seasons.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {seasons.map((s) => {
                const style = SEASON_STYLES[s.status] || { icon: Leaf, color: "text-gray-500", bg: "bg-gray-50 border-gray-100" };
                const Icon = style.icon;
                const range = formatDateRange(s.startDate, s.endDate);
                const intro = s.communicationConfig?.publicIntroduction || s.description;
                return (
                  <article key={s.id} className={`rounded-2xl border ${style.bg} p-6 shadow-sm flex flex-col`}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Icon className={`w-5 h-5 ${style.color}`} aria-hidden="true" />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        s.status === "ACTIVE" ? "bg-secondary-600 text-white"
                        : s.status === "SCHEDULED" ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{s.name}</h3>
                    {range && <p className="text-xs text-gray-500 mb-3">{range}</p>}
                    {intro && <p className="text-sm text-gray-600 leading-relaxed flex-1">{intro}</p>}
                    <Link
                      to="/campaigns"
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      View campaigns
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
