import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, ArrowRight, Users, Building2, Heart, Globe,
  Store, UserRound, BriefcaseBusiness,
  Lightbulb, ChevronDown, Filter,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { UkMap } from "@/components/hub/UkMap";
import { LocationPanel } from "@/components/hub/LocationPanel";
import { SplitContributionExplain } from "@/components/hub/SplitContributionExplain";
import {
  HUB_LOCATIONS,
  OPPORTUNITY_META,
  HUB_STATUS_META,
  type HubStatus,
  type OpportunityRole,
} from "@/data/hubActivation";

const STATUS_OPTIONS: { value: HubStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "making_progress", label: "Making Progress" },
   { value: "needs_activation", label: "Inactive" },
];

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </section>
  );
}

export default function UKHubActivationPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HubStatus | "all">("all");
  const [oppFilters, setOppFilters] = useState<OpportunityRole[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [mobileStatOpen, setMobileStatOpen] = useState(false);

  const selected = useMemo(
    () => HUB_LOCATIONS.find((l) => l.slug === selectedSlug) ?? null,
    [selectedSlug]
  );

  // Base filtered by opportunity + search (used for counters).
  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HUB_LOCATIONS.filter((l) => {
      if (oppFilters.length > 0 && !oppFilters.some((r) => l.opportunities?.includes(r))) return false;
      if (q && !(l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [search, oppFilters]);

  // Dynamic status counts after opportunity + search filter.
  const statusCounts = useMemo(() => {
    const c = { all: searchFiltered.length, active: 0, making_progress: 0, needs_activation: 0 };
    searchFiltered.forEach((l) => { c[l.status] += 1; });
    return c;
  }, [searchFiltered]);

  // Final visible locations = search+opp filtered, then status filtered.
  const visible = useMemo(() => {
    if (statusFilter === "all") return searchFiltered;
    return searchFiltered.filter((l) => l.status === statusFilter);
  }, [searchFiltered, statusFilter]);

  return (
    <>
      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-secondary-700 text-white py-4 md:py-6">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-5">
              See Where Communities Are{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-300 to-primary-200">
                Growing Across the UK
              </span>
            </h1>
            <p className="text-lg text-primary-100 leading-relaxed">
              Find out how you can Fund or Donate to 76 UK Cities, 32 London Boroughs,
              36 Metropolitan Boroughs or 11 County Boroughs and District Councils.
              Discover where Local Hubs are active, making progress, or need activation — and how
              you can help build stronger local communities near you.
            </p>
          </div>
        </div>
      </section>

      {/* ── STATUS FILTER BAR ── */}
      <Section className="py-6 md:py-8 border-b border-gray-100">
        <div className="container-page">
          {/* Desktop: inline stat chips */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-3">
            {STATUS_OPTIONS.map((opt) => {
              const count = statusCounts[opt.value];
              const isActive = statusFilter === opt.value;
              const meta = opt.value === "all" ? null : HUB_STATUS_META[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:text-primary-700"
                  }`}
                >
                  {meta && (
                    <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : meta.dotClass}`} />
                  )}
                  {opt.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile: compact stat dropdown */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileStatOpen(!mobileStatOpen)}
              className="w-full flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-500" />
                {statusFilter === "all" ? "All Locations" : HUB_STATUS_META[statusFilter].label}
                <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-md text-xs font-bold">
                  {statusCounts[statusFilter]}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileStatOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileStatOpen && (
              <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {STATUS_OPTIONS.map((opt) => {
                  const count = statusCounts[opt.value];
                  const isActive = statusFilter === opt.value;
                  const meta = opt.value === "all" ? null : HUB_STATUS_META[opt.value];
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); setMobileStatOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                        isActive ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {meta && <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />}
                        {opt.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        isActive ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── DISCOVERY: MAP + LOCATION PANEL ── */}
      <Section className="py-10 md:py-14 bg-gray-50" id="map">
        <div className="container-page">
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location, city or region…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Search locations"
              />
            </div>
          </div>

          {/* Desktop: map + panel side by side; mobile: map then panel */}
          <div className="lg:grid lg:grid-cols-5 lg:gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-5">
                <UkMap
                  locations={visible}
                  selectedSlug={selectedSlug}
                  onSelect={(slug) => setSelectedSlug(slug === selectedSlug ? null : slug)}
                  statusFilter={statusFilter}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Showing {visible.length} hub{visible.length !== 1 ? "s" : ""}. Select a marker to see details.
                </p>
              </div>
            </div>
            <div className="lg:col-span-2 mt-5 lg:mt-0">
              {selected ? (
                <LocationPanel location={selected} onClose={() => setSelectedSlug(null)} />
              ) : (
                <div className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 flex flex-col items-center justify-center text-center">
                  <MapPin className="w-9 h-9 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium text-sm">Select a Hub to explore it</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Pick a marker on the map or use the filters above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── OPPORTUNITIES ── */}
      <Section className="py-12 md:py-16" id="opportunities">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-3">
                <Users className="w-4 h-4" />
                Local People Needed
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                How You Can Help Hubs Get Going
              </h2>
              <p className="text-sm text-gray-500">
                Across the network we need local people to take on roles that build participation.
              </p>
            </div>

            {/* Opportunity filter dropdown */}
            <div className="relative min-w-[220px]">
              <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={oppFilters.length === 0 ? "all" : oppFilters.length === 1 ? oppFilters[0] : "multi"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "all") setOppFilters([]);
                  else if (v === "multi") return;
                  else setOppFilters([v as OpportunityRole]);
                }}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Filter by opportunity role"
              >
                <option value="all">All Roles</option>
                <option value="agent">Agents</option>
                <option value="account_manager">Account Managers</option>
                <option value="consultant">Consultants</option>
                {oppFilters.length > 1 && (
                  <option value="multi">
                    {oppFilters.map((r) => OPPORTUNITY_META[r].label).join(" + ")}
                  </option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {(Object.keys(OPPORTUNITY_META) as OpportunityRole[]).map((role) => {
              const m = OPPORTUNITY_META[role];
              const hubs = HUB_LOCATIONS.filter((l) => l.opportunities?.includes(role));
              const iconMap = { agent: UserRound, account_manager: BriefcaseBusiness, consultant: Lightbulb };
              const Icon = iconMap[role];
              return (
                <div key={role} className="bg-white rounded-2xl border border-amber-100 p-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-amber-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">{m.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{m.description}</p>
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    Needed in {hubs.length} hub{hubs.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hubs.slice(0, 4).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedSlug(h.slug)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        {h.name}
                      </button>
                    ))}
                    {hubs.length > 4 && (
                      <span className="text-[11px] text-gray-400 flex items-center">+{hubs.length - 4}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── FUND OR DONATE TO YOUR LOCAL COMMUNITY ── */}
      <Section className="py-12 md:py-16 bg-gray-50">
        <div className="container-page">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-700 rounded-3xl text-white p-7 md:p-10 grid lg:grid-cols-2 gap-7 items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-3">
                Put Cost-Neutral Funding to Work on Your High Street
              </h2>
              <p className="text-primary-100 leading-relaxed mb-5 text-sm">
                Business Owners and Local Residents fund and donate to their Local Hub, joining MCOM
                community's cost-neutral funding. Every contribution helps the network grow nationally.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#map"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-sm"
                >
                  Find a Hub Near You
                  <MapPin className="w-4 h-4" />
                </a>
                <Link
                  to="/campaigns"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors text-sm"
                >
                  Browse All Campaigns
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl border border-white/20 p-5 space-y-3">
              {[
                { icon: Store, text: "Support your Local High Street with a Hyper Local Hub" },
                { icon: Building2, text: "Business Contributors earn Backer Status with rewards" },
                { icon: Heart, text: "Residents receive Founding Membership when they Fund or Donate" },
                { icon: Globe, text: "Rewards share, exchange and redeem across the UK network" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-primary-50 leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── NATIONAL HUB COMMUNITY HIERARCHY ── */}
      <Section className="py-12 md:py-16">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              From the Whole UK Down to Your Local High Street
            </h2>
            <p className="text-sm text-gray-500">
              The National Hub Community connects everyone — from national scale to your local High Street.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            {[
              { icon: Globe, label: "National Hub Community", desc: "76 UK Cities, 32 London Boroughs" },
              { icon: MapPin, label: "Cities & Boroughs", desc: "City and borough-level hubs" },
              { icon: Store, label: "Local Hubs & High Streets", desc: "Hyper Local hubs on High Streets" },
              { icon: Users, label: "Businesses & Residents", desc: "Business Contributors and Founding Members" },
              { icon: Heart, label: "Campaigns", desc: "Fund or Donate campaigns keeping hubs growing" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                  <row.icon className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 text-sm">{row.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{row.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SPLIT YOUR CONTRIBUTION — WHAT / HOW / WHY ── */}
      <Section className="py-12 md:py-16 bg-white">
        <div className="container-page">
          <SplitContributionExplain tone="dark" headline="Fund to the full extent — or split one contribution across levels" />
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="py-12 md:py-16 bg-primary-700 text-white">
        <div className="container-page text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Help Activate the Hubs That Need You
            </h2>
            <p className="text-primary-100 mb-6 leading-relaxed">
              Whether you want to support a Hub, take on a local role, or build a Stronger Local Community,
              there's a place for you in the National Hub Community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/campaigns/create"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
              >
                Start a Local Hub
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#opportunities"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
              >
                View Opportunities
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
