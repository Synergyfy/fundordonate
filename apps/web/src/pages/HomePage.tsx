import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  Heart, Landmark, SlidersHorizontal,
} from "lucide-react";
import { CampaignCarousel } from "@/components/public/CampaignCarousel";
import { HUB_LOCATIONS, HUB_STATUS_META, type HubLocation } from "@/data/hubActivation";

/* ───────────────────── helpers ───────────────────── */

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

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
        {description && <p className="mt-2 text-gray-500 leading-relaxed">{description}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 shrink-0"
        >
          {action.label}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/* ───────────────────── hero carousel ───────────────────── */

/**
 * Placeholder YouTube video shown in the hero slider (both slides).
 * Swap in your own video ID when ready: https://www.youtube.com/watch?v=VIDEO_ID
 * Until then this plays YouTube's standard developer demo clip.
 */
const YOUTUBE_VIDEO_ID = "M7lc1UVf-VE";

interface HeroSlide {
  id: string;
  eyebrow: string;
  heading: string;
  copy: string;
  cta: { label: string; to: string };
  mediaSide: "left" | "right";
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "funding",
    eyebrow: "Funding across the UK",
    heading: "Discover funding opportunities across the UK.",
    copy: "FundOrDonate brings funding, campaigns and donation opportunities together in one place — for businesses, communities and causes.",
    cta: { label: "Explore Campaign", to: "/campaigns" },
    mediaSide: "right",
  },
  {
    id: "campaigns",
    eyebrow: "Campaigns that connect",
    heading: "Explore campaigns that connect communities.",
    copy: "Discover funding opportunities and campaigns relevant to businesses, consumers and communities across the UK.",
    cta: { label: "View Campaigns", to: "/campaigns" },
    mediaSide: "left",
  },
];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(() => !prefersReducedMotion());
  const [interacting, setInteracting] = useState(false);

  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0]!;

  /* Auto-advance — disabled for reduced motion, while paused, and while the
     visitor is interacting with the carousel. */
  useEffect(() => {
    if (!autoPlaying || interacting) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), 7000);
    return () => clearTimeout(timer);
  }, [autoPlaying, interacting, index]);

  /* Manual interaction pauses automatic movement (can be resumed). */
  const goTo = useCallback(
    (i: number) => {
      setIndex((i + HERO_SLIDES.length) % HERO_SLIDES.length);
      setAutoPlaying(false);
    },
    []
  );

  const prevSlide = useCallback(() => {
    setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    setAutoPlaying(false);
  }, []);
  const nextSlide = useCallback(() => {
    setIndex((i) => (i + 1) % HERO_SLIDES.length);
    setAutoPlaying(false);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "ArrowRight") nextSlide();
  };

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30"
      aria-roledescription="carousel"
      aria-label="FundOrDonate highlights"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      onKeyDown={handleKey}
    >
      <div className="container-page py-10 sm:py-14 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Content */}
          <div key={`${slide.id}-copy`} className={`${slide.mediaSide === "left" ? "lg:order-2" : ""} animate-fade-in`}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
              {slide.heading}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">{slide.copy}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={slide.cta.to} className="btn-primary !py-3 !px-7 text-sm sm:text-base inline-flex items-center justify-center gap-2">
                {slide.cta.label}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Media — YouTube embed placeholder */}
          <div key={`${slide.id}-media`} className={`${slide.mediaSide === "left" ? "lg:order-1" : ""} animate-fade-in`}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg ring-1 ring-gray-100 bg-gray-100">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&playsinline=1&rel=0`}
                title={slide.heading}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        {/* Controls: prev · indicators · counter · next · play/pause */}
        <div className="mt-8 lg:mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={prevSlide}
            className="p-2 rounded-full border border-gray-200 bg-white/70 backdrop-blur-sm hover:bg-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center gap-2" role="tablist" aria-label="Slide selector">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}: ${s.eyebrow}`}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-8 bg-primary-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-400 tabular-nums" aria-hidden="true">
              {index + 1} / {HERO_SLIDES.length}
            </span>
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className="p-2 rounded-full border border-gray-200 bg-white/70 backdrop-blur-sm hover:bg-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── funding discovery tabs ───────────────────── */

const FUNDING_TABS = [
  {
    icon: Landmark,
    label: "Fund",
    description:
      "Back a campaign and help it reach its goal. Every fund opportunity is a live campaign — follow it from the first pledge to the finish.",
    bullets: [
      "Browse campaigns open for funding across the UK",
      "Back the campaigns that matter to your community",
      "Follow each campaign's progress as it grows",
    ],
    cta: { label: "Explore Fund Campaigns", to: "/campaigns?mode=fund" },
  },
  {
    icon: Heart,
    label: "Donate",
    description:
      "Support causes across the UK directly. Every donation is tied to a real campaign, so you can see exactly what your contribution helps achieve.",
    bullets: [
      "Discover donation campaigns from across the UK",
      "Give in a few simple, secure steps",
      "Follow the progress of the campaigns you support",
    ],
    cta: { label: "Start Donating", to: "/donate" },
  },
];

const CAMPAIGN_FILTERS: { label: string; value?: string }[] = [
  { label: "All campaigns" },
  { label: "Fund", value: "fund" },
  { label: "Donate", value: "donation" },
];

/* ───────────────────── hub city visual ───────────────────── */

function hubStatusChip(loc: HubLocation) {
  const meta = HUB_STATUS_META[loc.status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.bgClass} ${meta.textClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function HubCitiesVisual() {
  const cities = HUB_LOCATIONS.filter((l) => l.type === "city").slice(0, 6);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">UK City Hubs</h3>
        <Link to="/uk-hub-activation" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
          View all →
        </Link>
      </div>
      <ul className="space-y-3">
        {cities.map((city) => (
          <li key={city.id}>
            <Link
              to={`/uk-hub-activation/${city.slug}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3.5 py-2.5 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">{city.name}</p>
                <p className="text-xs text-gray-400 truncate">{city.region}</p>
              </div>
              {hubStatusChip(city)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────── page ───────────────────── */

export default function HomePage() {
  const [campaignFilter, setCampaignFilter] = useState<string | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fundingTab, setFundingTab] = useState(0);

  const activeFunding = FUNDING_TABS[fundingTab] ?? FUNDING_TABS[0]!;
  const ActiveFundingIcon = activeFunding.icon;

  const handleFundingTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    setFundingTab((i) =>
      e.key === "ArrowRight"
        ? (i + 1) % FUNDING_TABS.length
        : (i - 1 + FUNDING_TABS.length) % FUNDING_TABS.length
    );
  };

  return (
    <>
      {/* ═══ 1 · HERO CAROUSEL ═══ */}
      <HeroCarousel />

      {/* ═══ 2 · FUNDING DISCOVERY ═══ */}
      <Section className="py-14 md:py-20 bg-white">
        <div className="container-page">
          <SectionHeader
            title="Explore Campaign"
            description="Two ways to take part — switch a tab to see what each one offers."
          />

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Ways to take part"
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:max-w-xl"
          >
            {FUNDING_TABS.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                id={`funding-tab-${i}`}
                aria-selected={fundingTab === i}
                aria-controls={`funding-panel-${i}`}
                tabIndex={fundingTab === i ? 0 : -1}
                onClick={() => setFundingTab(i)}
                onKeyDown={handleFundingTabKey}
                className={`shrink-0 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  fundingTab === i
                    ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-600"
                }`}
              >
                <tab.icon
                  className={`w-4 h-4 shrink-0 ${fundingTab === i ? "text-white" : "text-primary-600"}`}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div
            key={fundingTab}
            role="tabpanel"
            id={`funding-panel-${fundingTab}`}
            aria-labelledby={`funding-tab-${fundingTab}`}
            className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:p-8 animate-fade-in"
          >
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-1.5 mb-4">
                  <ActiveFundingIcon className="w-4 h-4 text-primary-600" aria-hidden="true" />
                  <span className="text-sm font-semibold text-primary-700">{activeFunding.label}</span>
                </div>
                <p className="text-gray-600 leading-relaxed">{activeFunding.description}</p>
                <ul className="mt-4 space-y-2">
                  {activeFunding.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-secondary-500" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500 mb-4">Ready to get started?</p>
                <Link to={activeFunding.cta.to} className="btn-primary inline-flex items-center gap-2">
                  {activeFunding.cta.label}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <p className="mt-3 text-xs text-gray-400">Opens the {activeFunding.label} section</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 3 · FEATURED CAMPAIGNS ═══ */}
      <Section className="py-14 md:py-20 bg-gray-50">
        <div className="container-page">
          <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Featured Campaigns</h2>
              <p className="mt-2 text-gray-500 leading-relaxed">
                Selected campaigns from across the UK — browse them, understand what they need and take part.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View all campaigns
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  className={`btn-secondary inline-flex items-center gap-2 ${
                    campaignFilter ? "!border-primary-200 !text-primary-600" : ""
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={filterOpen}
                >
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                  {campaignFilter ? (CAMPAIGN_FILTERS.find((f) => f.value === campaignFilter)?.label ?? "Filter") : "Filter"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {filterOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close filter menu"
                      onClick={() => setFilterOpen(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                    <div role="menu" className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                      {CAMPAIGN_FILTERS.map((f) => (
                        <button
                          key={f.label}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setCampaignFilter(f.value);
                            setFilterOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            campaignFilter === f.value ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {f.label}
                          {campaignFilter === f.value && <Check className="w-4 h-4 text-primary-600" aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <CampaignCarousel mode={campaignFilter} />
        </div>
      </Section>

      {/* ═══ 4 · UK HUB ACTIVATION ═══ */}
      <Section className="py-14 md:py-20 bg-white">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <SectionHeader title="Explore UK Hub Activation" />
              <p className="text-gray-500 leading-relaxed -mt-4 max-w-xl">
                UK City Hubs bring businesses, residents and campaigns together on local high streets —
                each one connected to a national community of cities working in the same way. Explore
                the hubs and join the activation journey in your area.
              </p>
              <div className="mt-7">
                <Link to="/uk-hub-activation" className="btn-primary inline-flex items-center gap-2 !py-3 !px-6">
                  Explore UK Hubs
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <HubCitiesVisual />
          </div>
        </div>
      </Section>
    </>
  );
}
