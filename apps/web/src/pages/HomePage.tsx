import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { campaignApi } from "@/services/campaign.service";
import {
  Heart, ArrowRight, Play, ChevronLeft, ChevronRight, CheckCircle2,
  Users, TrendingUp, Sparkles, Shield, Globe, Smartphone, Gift,
  Building2, Megaphone, Target, Zap, Star,
  ChevronDown, Award, HandHeart,
  Lightbulb, BadgeCheck, Repeat, Wallet, Camera,
  BookOpen, MessageCircle, Pause, Store, MapPin,
} from "lucide-react";
import {
  DEMO_BANNERS,
  DEMO_VIDEOS,
  DEMO_TESTIMONIALS,
  DEMO_FAQ,
  DEMO_CATEGORIES,
} from "@/data/demo";
import type { DemoVideo } from "@/data/demo";
import { HUB_LOCATIONS, getDemoCampaignsForLocation } from "@/data/hubActivation";
import HeroVisual from "@/components/home/HeroVisual";
import { SplitContributionExplain } from "@/components/hub/SplitContributionExplain";

/* ───────────────────── helpers ───────────────────── */

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const formatNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

/* ───────────────────── hubActivation campaign source ───────────────────── */

function getAllHubCampaigns() {
  const all: any[] = [];
  const seen = new Set<string>();
  for (const loc of HUB_LOCATIONS) {
    for (const c of getDemoCampaignsForLocation(loc)) {
      if (!seen.has(c.slug)) {
        seen.add(c.slug);
        all.push(c);
      }
    }
  }
  return all;
}

/* ───────────────────── animated section wrapper ───────────────────── */

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

/* ───────────────────── ribbon / heart floating effect ───────────────────── */

function RibbonEffect() {
  const hearts = [
    { left: "8%", delay: "0s", size: 14, dur: "9s" },
    { left: "22%", delay: "2s", size: 10, dur: "11s" },
    { left: "38%", delay: "4s", size: 12, dur: "8s" },
    { left: "55%", delay: "1s", size: 11, dur: "10s" },
    { left: "72%", delay: "3s", size: 13, dur: "9s" },
    { left: "88%", delay: "5s", size: 10, dur: "12s" },
    { left: "15%", delay: "6s", size: 9, dur: "11s" },
    { left: "65%", delay: "7s", size: 11, dur: "10s" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {hearts.map((h, i) => (
        <div
          key={i}
          className="absolute bottom-0 animate-ribbon"
          style={{
            left: h.left,
            animationDelay: h.delay,
            animationDuration: h.dur,
          }}
        >
          <Heart
            className="text-primary-300/40"
            style={{ width: h.size, height: h.size }}
            fill="currentColor"
          />
        </div>
      ))}
    </div>
  );
}

/* ───────────────────── campaign card ───────────────────── */

function CampaignCard({ campaign, index = 0 }: { campaign: any; index?: number }) {
  const progress = campaign.goalAmount > 0 ? Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100) : 0;
  const deadline = campaign.deadline ? new Date(campaign.deadline) : null;
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000)) : null;

  return (
    <Link
      to={`/campaigns/${campaign.slug || campaign.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        {campaign.featuredImage ? (
          <img
            src={campaign.featuredImage}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 animate-img-reveal">
            <Megaphone className="w-10 h-10 text-primary-300" />
          </div>
        )}
        {campaign.mode && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
            {campaign.mode === "donation" ? "Donate" : campaign.mode === "fund" ? "Fund" : "Sponsor"}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-2">
          {campaign.title}
        </h3>
        {campaign.shortDescription && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{campaign.shortDescription}</p>
        )}
        <div className="mb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary-500 to-secondary-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-secondary-600">{formatCurrency(campaign.raisedAmount)}</span>
          <span className="text-gray-400">of {formatCurrency(campaign.goalAmount)}</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{progress}% funded</span>
          {daysLeft !== null && <span>{daysLeft > 0 ? `${daysLeft} days left` : "Ended"}</span>}
        </div>
        {campaign.author && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">
              {(campaign.author.firstName || "U")[0]}
            </div>
            <span className="text-xs text-gray-500">
              {campaign.author.firstName} {campaign.author.lastName}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ───────────────────── campaign section with sliding rows ───────────────────── */

function CampaignRow({ campaigns, reverse = false }: { campaigns: any[]; reverse?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  return (
    <div className="relative group/row">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-gray-50"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-gray-50"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {campaigns.map((c: any, i: number) => (
          <div key={c.id} className="snap-start w-[280px] min-w-[280px] sm:w-[320px] sm:min-w-[320px]">
            <CampaignCard campaign={c} index={reverse ? campaigns.length - 1 - i : i} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignSection({ campaigns, categories }: { campaigns: any[]; categories: any[] }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeMode, setActiveMode] = useState("all");
  const [activeSort, setActiveSort] = useState("trending");

  const filtered = campaigns.filter((c: any) => {
    if (activeCategory !== "all" && c.category?.slug !== activeCategory) return false;
    if (activeMode !== "all" && c.mode !== activeMode) return false;
    return true;
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (activeSort === "trending") return (b.raisedAmount || 0) - (a.raisedAmount || 0);
    if (activeSort === "ending") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (activeSort === "newest") return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    return 0;
  });

  const mid = Math.ceil(sorted.length / 2);
  const row1 = sorted.slice(0, mid);
  const row2 = sorted.slice(mid);

  const categoryOptions = [
    { slug: "all", name: "All Categories" },
    ...categories.slice(0, 8),
  ];

  const modeOptions = [
    { value: "all", label: "All Modes" },
    { value: "fund", label: "Fund" },
    { value: "donation", label: "Donate" },
    { value: "sponsor", label: "Sponsor" },
  ];

  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "ending", label: "Ending Soon" },
    { value: "newest", label: "Newest" },
  ];

  return (
    <Section className="py-12 md:py-16">
      <div className="container-page">
        {/* Header with title + Explore button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Explore Campaigns</h2>
            <p className="text-gray-500 text-sm">Find campaigns to Fund or Donate to in your local community</p>
          </div>
          <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2 text-sm shrink-0">
            Explore Campaigns
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-2 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
          >
            {categoryOptions.map((cat: any) => (
              <option key={cat.slug || cat.id} value={cat.slug || cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={activeMode}
            onChange={(e) => setActiveMode(e.target.value)}
            className="px-3 py-2 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
          >
            {modeOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="px-3 py-2 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Campaign rows - 2 rows sliding */}
        {sorted.length > 0 ? (
          <div className="space-y-5">
            <CampaignRow campaigns={row1} />
            {row2.length > 0 && <CampaignRow campaigns={row2} reverse />}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No campaigns match your filters</p>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ───────────────────── video placeholder ───────────────────── */

function VideoPlaceholder({ video, className = "" }: { video: DemoVideo; className?: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${video.posterGradient} aspect-video group ${className}`}>
      {/* Poster content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
        <h3 className="text-lg md:text-xl font-bold mb-2">{video.title}</h3>
        <p className="text-sm text-white/80 max-w-sm">{video.description}</p>
        <span className="mt-3 text-xs text-white/60">{video.duration}</span>
      </div>

      {/* Play button with ring animation */}
      <button
        onClick={() => setPlaying(!playing)}
        className="absolute inset-0 flex items-center justify-center"
        aria-label={`Play ${video.title}`}
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-white/20 animate-play-ring" />
          {/* Button */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center hover:bg-white/25 transition-all hover:scale-110 group-hover:scale-110">
            {playing ? (
              <Pause className="w-6 h-6 md:w-8 md:h-8 text-white ml-0" fill="white" />
            ) : (
              <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
            )}
          </div>
        </div>
      </button>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

/* ───────────────────── FAQ accordion ───────────────────── */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOMEPAGE
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [apiFeatured, setApiFeatured] = useState<any[]>([]);
  const [apiRecent, setApiRecent] = useState<any[]>([]);
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({ campaigns: 0, raised: 0, backers: 0 });

  /* Hero slider state */
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Fetch API data (use demo fallback if empty) */
  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, listRes, catRes] = await Promise.allSettled([
          campaignApi.getFeatured(6),
          campaignApi.list({ limit: 12, sortBy: "createdAt", sortOrder: "desc" }),
          campaignApi.getCategories(),
        ]);

        if (featRes.status === "fulfilled") {
          const items = (featRes.value as any)?.items || featRes.value || [];
          if (Array.isArray(items) && items.length > 0) setApiFeatured(items);
        }
        if (listRes.status === "fulfilled") {
          const items = (listRes.value as any)?.items || listRes.value || [];
          const all = Array.isArray(items) ? items : [];
          if (all.length > 0) {
            setApiRecent(all.slice(0, 12));
            setStats({
              campaigns: all.length,
              raised: all.reduce((s: number, c: any) => s + (c.raisedAmount || 0), 0),
              backers: all.reduce((s: number, c: any) => s + (c._count?.donations || 0) + (c._count?.pledges || 0), 0),
            });
          }
        }
        if (catRes.status === "fulfilled") {
          const items = (catRes.value as any)?.items || catRes.value || [];
          if (Array.isArray(items) && items.length > 0) setApiCategories(items.slice(0, 8));
        }
      } catch { /* silent */ }
    };
    load();
  }, []);

  /* Resolve data: prefer API, fall back to demo */
  const categories = apiCategories.length > 0 ? apiCategories : DEMO_CATEGORIES;

  const displayStats = stats.campaigns > 0 ? stats : { campaigns: 29, raised: 1729100, backers: 1435 };

  /* Hero slider auto-progression */
  useEffect(() => {
    if (isPaused) return;
    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DEMO_BANNERS.length);
    }, 7000);
    return () => { if (slideTimerRef.current) clearInterval(slideTimerRef.current); };
  }, [isPaused]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
  }, []);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + DEMO_BANNERS.length) % DEMO_BANNERS.length);
  }, [currentSlide, goToSlide]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % DEMO_BANNERS.length);
  }, [currentSlide, goToSlide]);

  /* Keyboard handler for slider */
  const handleSliderKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prevSlide();
    else if (e.key === "ArrowRight") nextSlide();
  }, [prevSlide, nextSlide]);

  const slide = DEMO_BANNERS[currentSlide] as (typeof DEMO_BANNERS)[number];

  return (
    <>
      {/* ══════ RIBBON / HEART FLOATING EFFECT ══════ */}
      <RibbonEffect />

      {/* ══════ HERO — THREE-SLIDE BANNER ══════ */}
      <section
        className={`relative overflow-hidden bg-gradient-to-br ${slide.bg} transition-all duration-700`}
        aria-roledescription="carousel"
        aria-label="FundOrDonate highlights"
      >
        <div className="container-page py-4 sm:py-6 relative z-10">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10 items-center">
            {/* Copy — keyed to trigger re-animation on slide change */}
            <div className="max-w-xl mx-auto lg:mx-0 px-4 lg:px-6" key={slide.id}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-4 sm:mb-6 animate-slide-up">
                {slide.headline}{" "}
                {slide.headlineAccent && (
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.accent}`}>
                    {slide.headlineAccent}
                  </span>
                )}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8 animate-slide-up-delay max-w-lg">
                {slide.copy}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 animate-slide-up-delay-2">
                <Link to={slide.primaryCta.to} className="btn-primary !py-3 !px-6 sm:!px-8 text-sm sm:text-base inline-flex items-center justify-center gap-2">
                  {slide.primaryCta.label}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                {slide.secondaryCta && (
                  <Link to={slide.secondaryCta.to} className="btn-secondary !py-3 !px-6 sm:!px-8 text-sm sm:text-base inline-flex items-center justify-center gap-2">
                    {slide.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>

            {/* Hero visual — changes per slide */}
            <div className="relative hidden lg:block">
              <HeroVisual slideIndex={currentSlide} />
            </div>
          </div>

          {/* Slider controls */}
          <div className="flex items-center justify-center gap-4 mt-8 lg:mt-12">
            {/* Prev */}
            <button
              onClick={prevSlide}
              className="p-2 rounded-full border border-gray-200 hover:bg-white/80 transition-colors bg-white/50 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Indicators */}
            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label="Slide selector"
              onKeyDown={handleSliderKey}
            >
              {DEMO_BANNERS.map((b, i) => (
                <button
                  key={b.id}
                  role="tab"
                  aria-selected={i === currentSlide}
                  aria-label={`Slide ${i + 1}: ${b.eyebrow}`}
                  onClick={() => goToSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "w-8 bg-primary-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {/* Next */}
            <button
              onClick={nextSlide}
              className="p-2 rounded-full border border-gray-200 hover:bg-white/80 transition-colors bg-white/50 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Pause */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-full border border-gray-200 hover:bg-white/80 transition-colors bg-white/50 backdrop-blur-sm hidden sm:flex"
              aria-label={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
            >
              {isPaused ? <Play className="w-4 h-4 text-gray-600" /> : <Pause className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto">
            <path d="M0 60V20C240 0 480 40 720 30C960 20 1200 0 1440 20V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════ UK HUB ACTIVATION ══════ */}
      <Section className="py-10 md:py-14 bg-white">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              UK Hub Activation Programme
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Building Stronger High Streets Across the UK</h2>
            <p className="text-gray-500">Connecting cities, boroughs, local areas, and high streets through community-driven funding and participation.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">76+ UK Cities</h3>
              <p className="text-sm text-gray-500 leading-relaxed">From London to Edinburgh, cities across the UK are activating their local hubs.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">High Street Campaigns</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Local businesses and residents fund campaigns that strengthen their high streets.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Community Driven</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Business owners and consumers work together to build stronger local communities.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              to="/uk-hub-activation"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-gray-800 hover:to-gray-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Explore UK Hub Activation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ══════ FUND OR DONATE INTRO ══════ */}
      <Section className="py-12 md:py-16 bg-white">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50/80 border border-primary-100 text-primary-700 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                FundOrDonate by MCOM
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Fund or Donate to Build{" "}
                <span className="text-primary-600">Stronger Local Communities</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                FundOrDonate supports Hyper Local National Reward and Loyalty Fund or Donate Hubs on
                UK High Streets. Local Business Owners and Local Residents can Fund or Donate to their
                Local Hub — joining MCOM community's cost-neutral funding so communities can support
                themselves without adding cost.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/campaigns" className="btn-primary inline-flex items-center justify-center gap-2">
                  Explore Campaigns
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/fund-vs-donate" className="btn-secondary inline-flex items-center justify-center gap-2">
                  Fund vs Donate
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Heart, label: "Donation Programmes", desc: "Direct community support for Local Hubs" },
                { icon: Target, label: "Funding Programmes", desc: "Goal-driven Local Hub campaigns" },
                { icon: HandHeart, label: "Cost-Neutral Giving", desc: "MCOM community's cost-neutral funding" },
                { icon: Building2, label: "Local Hub Partners", desc: "Co-branded business partner Hubs" },
              ].map((item) => (
                <div key={item.label} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <item.icon className="w-7 h-7 text-primary-500 mx-auto mb-3" />
                  <div className="text-sm font-bold text-gray-900">{item.label}</div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ WHAT WE ARE FUNDING ══════ */}
      <Section id="funding" className="py-12 md:py-16 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What We Are Funding</h2>
            <p className="text-gray-500">
              Find out what you can Fund or Donate to through your Local Hub. Choose how you want to
              support your local community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: "Support a Donation Program",
                desc: "Receive direct donations from Local Residents and Business Contributors who believe in your Local Hub.",
                color: "from-pink-500 to-rose-500",
              },
              {
                icon: Target,
                title: "Support a Funding Program",
                desc: "Set a goal and let backers pledge toward your Local Hub campaign with rewards and milestones.",
                color: "from-primary-500 to-blue-600",
              },
              {
                icon: HandHeart,
                title: "Fund or Donate to Your Hub",
                desc: "Help by Founding or Donating to your Local Hub. Join MCOM community's cost-neutral funding.",
                color: "from-secondary-500 to-emerald-600",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════ SPLIT YOUR CONTRIBUTION — WHAT / HOW / WHY ══════ */}
      <Section className="py-12 md:py-16 bg-white">
        <div className="container-page">
          <SplitContributionExplain tone="light" />
        </div>
      </Section>

      {/* ══════ CAMPAIGN CATEGORIES ══════ */}
      {categories.length > 0 && (
        <Section className="py-12 md:py-16">
          <div className="container-page">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Explore Categories</h2>
            <p className="text-gray-500 mb-8">Find campaigns that match your interests</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`/campaigns?category=${cat.slug || cat.id}`}
                  className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <TagIcon name={cat.name} />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors text-sm">
                    {cat.name}
                  </span>
                  {cat._count && (
                    <span className="block text-xs text-gray-400 mt-1">
                      {cat._count.campaigns || 0} campaigns
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ══════ CAMPAIGNS — SINGLE SECTION WITH FILTERS ══════ */}
      <CampaignSection
        campaigns={[...apiFeatured, ...apiRecent].length > 0 ? [...apiFeatured, ...apiRecent] : getAllHubCampaigns()}
        categories={categories}
      />

      {/* ══════ VIDEO 1 — HOW LOCAL HUBS WORK ══════ */}
      <Section className="py-12 md:py-16 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">How FundOrDonate Local Hubs Work</h2>
            <p className="text-gray-500">Hyper Local National Reward and Loyalty Fund or Donate Hubs on UK High Streets</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <VideoPlaceholder video={DEMO_VIDEOS[0]!} />
          </div>
        </div>
      </Section>

      {/* ══════ NATIONAL / LOCAL PLATFORM STATISTICS ══════ */}
      <Section className="py-12 md:py-16 bg-white">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Platform Statistics</h2>
            <p className="text-gray-500">Fund or Donate impact across UK Local Hubs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { label: "Campaigns Funded", value: displayStats.campaigns, icon: Megaphone },
              { label: "Total Raised", value: formatCurrency(displayStats.raised), icon: TrendingUp },
              { label: "Backers", value: formatNumber(displayStats.backers), icon: Users },
              { label: "UK City Hubs", value: "76", icon: Award },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-primary-50/50 transition-colors">
                <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════ VIDEO 2 — BUSINESS & RESIDENT FUNDING ══════ */}
      <Section className="py-12 md:py-16">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-100 text-secondary-700 text-sm font-medium mb-4">
                <Heart className="w-4 h-4" />
                Community Funding
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                How Businesses & Local Residents Fund or Donate
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Business Contributors and Local Residents share, exchange and redeem reward points
                through their local MCOM community hub. Join MCOM community's cost-neutral funding.
              </p>
              <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2">
                Find Your Local Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div>
              <VideoPlaceholder video={DEMO_VIDEOS[1]!} />
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ UK HUB ACTIVATION TEASER ══════ */}
      <Section className="py-12 md:py-16 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                Activate a Fund or Donate Hub in Your Local Community
              </h2>
              <p className="text-primary-100 text-lg leading-relaxed mb-6">
                Our aim is to set up 76 National UK City Hubs. Individual Hyper Local National Reward
                and Loyalty Fund or Donate Hubs are activated on Local High Streets across the UK for
                Business Owners and Local Residents.
              </p>
              <Link
                to="/uk-hub-activation"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
              >
                Activate Your Local Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "UK City Hubs", value: "76", icon: Building2 },
                    { label: "High Streets", value: "100+", icon: Store },
                    { label: "Business Partners", value: "1,000+", icon: Users },
                    { label: "Residents Reached", value: "100K+", icon: HandHeart },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center">
                      <s.icon className="w-6 h-6 text-primary-200 mx-auto mb-2" />
                      <div className="text-xl font-bold">{s.value}</div>
                      <div className="text-xs text-primary-100/80">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ BUSINESS SELF-FUNDING ══════ */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative hidden lg:block">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-8 h-8 text-primary-500" />
                    <div>
                      <div className="font-semibold text-gray-900">Business Wallet</div>
                      <div className="text-sm text-gray-400">Self-funded campaign balance</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Available Balance</span>
                    <span className="font-semibold text-gray-900">£25,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Campaign Target</span>
                    <span className="font-semibold text-secondary-600">£50,000</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-primary-400 to-secondary-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Wallet className="w-4 h-4" />
                Self-Funding
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Business{" "}
                <span className="text-primary-600">Self-Funding</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Businesses can self-fund their campaigns using their own wallet balance. Combine
                self-funding with community contributions from Local Residents and Business Contributors
                for maximum impact and flexibility through your Local Hub.
              </p>
              <ul className="space-y-3">
                {[
                  "Fund your own campaign from your business wallet",
                  "Combine self-funding with community backing",
                  "Track contributions from multiple sources",
                  "Maintain full control of your funding journey",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ BACKER PROGRAMMES ══════ */}
      <Section id="business" className="py-16 md:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Business Contributors<br />
                <span className="text-primary-400">Receive Backer Status</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Business owners can join our MCOM Monthly giving programme. Fund or Donate to your
                Local Hub and receive Backer Status with national reward exchange benefits across
                Gift Cards, Vouchers, Coupons, and Deals.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Co-Branded Business Partner Hubs across 76 UK City Hubs",
                  "Backer Status with national reward exchange",
                  "Share, Exchange and Redeem Nationally",
                  "Cost-neutral community funding model",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/campaigns?mode=fund" className="btn-primary inline-flex items-center gap-2">
                Join as Business Contributor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Active Campaigns", value: "128", icon: Megaphone },
                    { label: "Total Raised", value: "£2.4M", icon: TrendingUp },
                    { label: "Businesses", value: "64", icon: Building2 },
                    { label: "Success Rate", value: "92%", icon: Award },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center">
                      <s.icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                      <div className="text-xl font-bold">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ VIDEO 3 — MCOM REWARDS & MEMBERSHIP ══════ */}
      <Section className="py-12 md:py-16">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <VideoPlaceholder video={DEMO_VIDEOS[2]!} />
            </div>
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-4">
                <Gift className="w-4 h-4" />
                MCOM Rewards
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                MCOM Rewards, Membership & Share Exchange Redeem
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Consumer Founding Memberships, MCOM reward points, gift cards, vouchers, coupons and
                deals. Share, exchange and redeem nationally through the MCOM community network.
              </p>
              <Link to="/auth/register" className="btn-primary inline-flex items-center gap-2">
                Join MCOM Community
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ NATIONAL / LOCAL COMMUNITY POSITIONING ══════ */}
      <Section id="why" className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">National & Local Community Positioning</h2>
            <p className="text-gray-500">Built for transparency, simplicity, and real local impact across the UK</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Transparent & Secure", desc: "Every transaction is tracked. Full visibility for Business Contributors, Local Residents, and Hub Coordinators." },
              { icon: Zap, title: "Cost-Neutral Funding", desc: "Join MCOM community's cost-neutral funding. Local Business Owners and Local Residents fund their local communities." },
              { icon: Globe, title: "76 UK City Hubs", desc: "Our aim is to setup 76 National UK City Hubs. Co-Branded Business Partner Hubs across the UK." },
              { icon: Smartphone, title: "Share Exchange Redeem", desc: "Founding Members share, exchange and redeem nationally — Gift Cards, Vouchers, Coupons, and Deals." },
              { icon: Gift, title: "Founding Membership", desc: "Consumer Receive A Founding Membership. Found or Donate and receive a free Gift or MCOM Reward point." },
              { icon: Repeat, title: "Fund & Donate Modes", desc: "Choose donation, fund, or sponsor modes. Fund or Donate to MCOM Community Hubs on UK High Streets." },
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

      {/* ══════ REWARDS / E-CARD ══════ */}
      <Section id="rewards" className="py-16 md:py-24">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-100 text-secondary-700 text-sm font-medium mb-6">
                <Gift className="w-4 h-4" />
                MCOM Rewards & E-Cards
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Share, Exchange &{" "}
                <span className="text-secondary-600">Redeem Nationally</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Found or Donate and receive a free Gift or MCOM Reward point. Consumer Founding Members
                share, exchange and redeem across the UK — Gift Cards, Vouchers, Coupons, and Deals.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Camera, label: "E-Cards" },
                  { icon: Gift, label: "Gift Cards" },
                  { icon: Star, label: "Vouchers & Deals" },
                  { icon: BadgeCheck, label: "Reward Points" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <r.icon className="w-5 h-5 text-secondary-500" />
                    <span className="text-sm font-medium text-gray-700">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Thank You E-Card</div>
                      <div className="text-xs text-gray-400">Digital reward</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-secondary-400 to-primary-500 rounded-xl p-6 text-white text-center">
                    <Heart className="w-8 h-8 mx-auto mb-2" fill="white" />
                    <div className="font-bold text-lg mb-1">Thank You!</div>
                    <div className="text-sm opacity-90">Your support means the world to us.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ HOW IT WORKS ══════ */}
      <Section id="how-it-works" className="py-16 md:py-24">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">How FundOrDonate Works</h2>
            <p className="text-gray-500">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary-200 via-secondary-200 to-primary-200" />
            {[
              { step: "01", icon: Lightbulb, title: "Set Up Your Local Hub", desc: "Create a Fund or Donate Hub for your Local High Street. Set a goal, add your story, and connect with business partners." },
              { step: "02", icon: Megaphone, title: "Share Across the UK", desc: "Share your Hub with business owners and local residents. Use VCard, QR codes, and social media to spread the word." },
              { step: "03", icon: TrendingUp, title: "Fund or Donate", desc: "Business Contributors receive Backer Status. Consumer Founding Members earn MCOM reward points. Share, Exchange and Redeem Nationally." },
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
      </Section>

      {/* ══════ TESTIMONIALS ══════ */}
      <Section className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What People Say</h2>
            <p className="text-gray-500">Experiences from the FundOrDonate community</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {DEMO_TESTIMONIALS.slice(0, 3).map((t) => (
              <div key={t.name} className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════ COMMUNITY ══════ */}
      <Section id="community" className="py-16 md:py-24">
        <div className="container-page text-center">
          <div className="max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 text-primary-500 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Join the MCOM Community</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Connect with Local Hub Coordinators, Business Contributors, and Consumer Founding Members.
              Share stories, celebrate milestones, and be part of the MCOM community across the UK.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/campaigns" className="btn-primary inline-flex items-center justify-center gap-2">
                Find Your Local Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/auth/register" className="btn-secondary inline-flex items-center justify-center gap-2">
                Become a Founding Member
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ MCOM ECOSYSTEM ══════ */}
      <Section id="mcom" className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Part of the MCOM Ecosystem</h2>
            <p className="text-gray-500">
              FundOrDonate is part of the MCOM ecosystem — a suite of interconnected tools
              designed to empower communities and businesses.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "FundOrDonate", desc: "Fund & Donate", active: true },
              { name: "MCOM VCard", desc: "Digital business cards", active: false },
              { name: "MCOM Terminal", desc: "Payment processing", active: false },
            ].map((product) => (
              <div
                key={product.name}
                className={`p-6 rounded-2xl border text-center transition-all ${
                  product.active
                    ? "bg-primary-50 border-primary-200 shadow-sm"
                    : "bg-white border-gray-100 opacity-70"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                  product.active ? "bg-primary-100" : "bg-gray-100"
                }`}>
                  {product.active ? (
                    <Heart className="w-6 h-6 text-primary-600" />
                  ) : (
                    <Globe className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500">{product.desc}</p>
                {product.active && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════ MOBILE VCARD ══════ */}
      <Section id="vcard" className="py-16 md:py-24">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" />
                Mobile VCard
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Share Campaigns with{" "}
                <span className="text-primary-600">VCard</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                FundOrDonate integrates with Mobile VCard, letting you share campaign details
                instantly via digital business cards. Scan, share, and support — all from your phone.
              </p>
              <ul className="space-y-3">
                {[
                  "QR code campaign sharing",
                  "Instant VCard contact exchange",
                  "Mobile-first campaign discovery",
                  "Seamless payment integration",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden lg:flex justify-center">
              <div className="w-64 bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-center text-white">
                    <Heart className="w-8 h-8 mx-auto mb-2" fill="white" />
                    <div className="font-bold">FundOrDonate</div>
                    <div className="text-xs opacity-80">Scan to support</div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Megaphone className="w-6 h-6 text-gray-300" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ FAQ ══════ */}
      <Section id="faq" className="py-16 md:py-24 bg-gray-50">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know about FundOrDonate</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {DEMO_FAQ.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ══════ CAMPAIGN CTA ══════ */}
      <Section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fund or Donate to Your Local Hub</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Help by Founding or Donating to your Local Hub. Join MCOM community's cost-neutral funding
            — Local Business Owners and Local Residents can fund and donate to their local communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/campaigns/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              Start a Local Hub Campaign
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-800 transition-colors"
            >
              Find Your Local Hub
            </Link>
          </div>
        </div>
      </Section>

      {/* ══════ FINAL CTA ══════ */}
      <Section className="py-16 md:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="container-page text-center">
          <div className="max-w-2xl mx-auto">
            <Heart className="w-12 h-12 mx-auto mb-6 text-white/80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our MCOM Community</h2>
            <p className="text-primary-100 text-lg mb-8 leading-relaxed">
              Join our MCOM Monthly giving Programme as a Corporate Business Backer or as a Consumer's
              Founding Member. Any contribution no matter the size will provide much needed support
              for our long term MCOM Community Fund or Donate Cost-Neutral Projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
                Become a Founding Member
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/campaigns" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                Support a Local Hub
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

/* ───────────────────── tag icon helper ───────────────────── */

function TagIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("health") || lower.includes("medical")) return <Heart className="w-5 h-5 text-rose-500" />;
  if (lower.includes("education") || lower.includes("school")) return <BookOpen className="w-5 h-5 text-blue-500" />;
  if (lower.includes("environment") || lower.includes("green")) return <Globe className="w-5 h-5 text-green-500" />;
  if (lower.includes("business") || lower.includes("startup")) return <Building2 className="w-5 h-5 text-purple-500" />;
  if (lower.includes("art") || lower.includes("creative")) return <Camera className="w-5 h-5 text-pink-500" />;
  if (lower.includes("technology") || lower.includes("tech")) return <Zap className="w-5 h-5 text-cyan-500" />;
  if (lower.includes("community") || lower.includes("social")) return <Users className="w-5 h-5 text-orange-500" />;
  if (lower.includes("animal")) return <Heart className="w-5 h-5 text-amber-500" />;
  return <Megaphone className="w-5 h-5 text-primary-500" />;
}
