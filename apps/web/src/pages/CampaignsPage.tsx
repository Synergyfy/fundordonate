import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { campaignApi } from "@/services/campaign.service";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { CampaignFilters, type CampaignFilters as CampaignFiltersType } from "@/components/campaign/CampaignFilters";
import { FeaturedCampaigns } from "@/components/campaign/FeaturedCampaigns";
import {
  DEMO_CAMPAIGNS,
  getDemoFeatured,
  getDemoEnding,
  getDemoNewest,
  getDemoPopular,
  DEMO_CATEGORIES,
} from "@/data/demo";
import {
  TrendingUp, Clock, Sparkles, ArrowRight, Megaphone, Target,
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */

interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  mode: string;
  featuredImage?: string;
  author?: { firstName?: string; lastName?: string; avatar?: string; username?: string };
  category?: { name: string; slug: string };
  location?: string;
  tags?: string[] | { tag: { id: string; name: string; slug: string } }[];
  membership?: boolean;
  evergreen?: boolean;
  // Campaign Hierarchy
  parentId?: string;
  parentSlug?: string;
  parentTitle?: string;
  // Campaign Context
  campaignType?: string | { id: string; name: string; slug: string; isOpportunity?: boolean } | null;
  participationTypes?: string;
  backerTiersEnabled?: boolean;
  // Self-Funding
  isSelfFunding?: boolean;
  selfFundingLevel?: string;
  _count?: { donations: number; pledges: number; comments: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

/* ─────────────────── Helpers ─────────────────── */

const INITIAL_FILTERS: CampaignFiltersType = {
  search: "",
  category: "",
  mode: "",
  status: "",
  sortBy: "newest",
  dateRange: "",
  location: "",
  tag: "",
  membership: "",
  evergreen: "",
  campaignType: "",
  season: "",
};

function filtersToSearchParams(filters: CampaignFiltersType): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.status) params.set("status", filters.status);
  if (filters.sortBy && filters.sortBy !== "newest") params.set("sort", filters.sortBy);
  if (filters.location) params.set("location", filters.location);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.membership) params.set("membership", filters.membership);
  if (filters.evergreen) params.set("evergreen", filters.evergreen);
  if (filters.dateRange) params.set("dateRange", filters.dateRange);
  if (filters.campaignType) params.set("campaignType", filters.campaignType);
  if (filters.season) params.set("season", filters.season);
  return params;
}

function searchParamsToFilters(sp: URLSearchParams): CampaignFiltersType {
  return {
    search: sp.get("search") || "",
    category: sp.get("category") || "",
    mode: sp.get("mode") || "",
    status: sp.get("status") || "",
    sortBy: sp.get("sort") || "newest",
    dateRange: sp.get("dateRange") || "",
    location: sp.get("location") || "",
    tag: sp.get("tag") || "",
    membership: sp.get("membership") || "",
    evergreen: sp.get("evergreen") || "",
    campaignType: sp.get("campaignType") || "",
    season: sp.get("season") || "",
  };
}

/* ─────────────────── Discovery Section ─────────────────── */

function DiscoverySection({
  title,
  subtitle,
  icon: Icon,
  campaigns,
  viewAllLink,
  viewAllLabel = "View all",
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  campaigns: Campaign[];
  viewAllLink: string;
  viewAllLabel?: string;
}) {
  if (campaigns.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <Link
          to={viewAllLink}
          className="hidden text-sm font-medium text-primary-600 hover:text-primary-700 sm:inline-flex items-center gap-1"
        >
          {viewAllLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.slice(0, 3).map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign as any} />
        ))}
      </div>

      <div className="mt-4 text-center sm:hidden">
        <Link to={viewAllLink} className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
          {viewAllLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CAMPAIGNS PAGE
   ═══════════════════════════════════════════════════════════ */

export function CampaignsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<CampaignFiltersType>(() =>
    searchParamsToFilters(searchParams)
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showDiscovery, setShowDiscovery] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const limit = 12;

  // Load categories
  useEffect(() => {
    campaignApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories(DEMO_CATEGORIES));
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = filtersToSearchParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Check if any active filters (beyond defaults)
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.category ||
      filters.mode ||
      (filters.status && filters.status !== "published") ||
      filters.location ||
      filters.tag ||
      filters.membership ||
      filters.evergreen ||
      filters.dateRange ||
      filters.campaignType ||
      filters.season
    );
  }, [filters]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params: Record<string, string | number> = {
          page: pageNum,
          limit,
          sortBy: filters.sortBy === "mostFunded" ? "raisedAmount" : filters.sortBy === "endingSoon" ? "deadline" : filters.sortBy === "popular" ? "createdAt" : filters.sortBy === "mostBacked" ? "createdAt" : "createdAt",
          sortOrder: filters.sortBy === "endingSoon" ? "asc" : "desc",
        };

        if (filters.search) params.search = filters.search;
        if (filters.category) params.categoryId = filters.category;
        if (filters.mode) params.mode = filters.mode;
        if (filters.status) params.status = filters.status;
        if (filters.tag) params.tag = filters.tag;
        if (filters.campaignType) params.campaignTypeId = filters.campaignType;
        if (filters.season) params.seasonId = filters.season;

        const res = await campaignApi.list(params);

        if (append) {
          setCampaigns((prev) => [...prev, ...res.items]);
        } else {
          setCampaigns(res.items);
        }

        setHasMore(pageNum < res.totalPages);
      } catch {
        // API unavailable — use demo data fallback with client-side filtering
        const filtered = filterDemoCampaigns(DEMO_CAMPAIGNS as unknown as Campaign[], filters);
        const sorted = sortDemoCampaigns(filtered, filters.sortBy);
        const start = (pageNum - 1) * limit;
        const paged = sorted.slice(start, start + limit);

        if (append) {
          setCampaigns((prev) => [...prev, ...paged]);
        } else {
          setCampaigns(paged);
        }
        setHasMore(start + limit < sorted.length);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Reset on filter change
  useEffect(() => {
    setPage(1);
    fetchCampaigns(1, false);
  }, [filters, fetchCampaigns]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCampaigns(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, loadingMore, page, fetchCampaigns]);

  const handleFilterChange = (newFilters: CampaignFiltersType) => {
    setFilters(newFilters);
    setShowDiscovery(true);
  };

  // Discovery data (only shown when no active filters)
  const discoveryFeatured = getDemoFeatured() as unknown as Campaign[];
  const discoveryEnding = getDemoEnding() as unknown as Campaign[];
  const discoveryNew = getDemoNewest() as unknown as Campaign[];
  const discoveryPopular = getDemoPopular() as unknown as Campaign[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-page py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fund or Donate to Your Local Hub</h1>
              <p className="mt-1 text-gray-500">
                Discover local London campaigns, business initiatives, community hubs and MCOM programmes
              </p>
            </div>
            {user?.role === "admin" && (
              <Link to="/campaigns/create" className="btn-primary">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Start Campaign
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Featured Campaigns (always shown) */}
      <FeaturedCampaigns />

      {/* Filters & List */}
      <div className="container-page py-6">
        <CampaignFilters
          filters={filters}
          onChange={handleFilterChange}
          categories={categories}
        />

        {/* Discovery Sections — shown only when no active filters */}
        {showDiscovery && !hasActiveFilters && !loading && (
          <div className="mt-6 space-y-2">
            <DiscoverySection
              title="Featured Campaigns"
              subtitle="Handpicked campaigns from our community"
              icon={Sparkles}
              campaigns={discoveryFeatured}
              viewAllLink="/campaigns?sort=mostFunded"
              viewAllLabel="View all featured"
            />
            <DiscoverySection
              title="Ending Soon"
              subtitle="Campaigns approaching their deadline"
              icon={Clock}
              campaigns={discoveryEnding}
              viewAllLink="/campaigns?sort=endingSoon"
              viewAllLabel="View all ending soon"
            />
            <DiscoverySection
              title="New Campaigns"
              subtitle="Recently launched campaigns"
              icon={Megaphone}
              campaigns={discoveryNew}
              viewAllLink="/campaigns?sort=newest"
              viewAllLabel="View all new"
            />
            <DiscoverySection
              title="Most Popular"
              subtitle="Campaigns with the most community support"
              icon={TrendingUp}
              campaigns={discoveryPopular}
              viewAllLink="/campaigns?sort=popular"
              viewAllLabel="View all popular"
            />
          </div>
        )}

        {/* All Campaigns Section Header */}
        {(!showDiscovery || hasActiveFilters) && (
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {hasActiveFilters ? "Filtered Campaigns" : "All Campaigns"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilters(INITIAL_FILTERS);
                    setShowDiscovery(true);
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Campaign Grid */}
        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="mt-2 h-6 w-full rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
                  <div className="mt-4 h-2 w-full rounded-full bg-gray-200" />
                  <div className="mt-3 flex justify-between">
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="h-3 w-16 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="mt-16 text-center">
            <Target className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-2 text-gray-500">
              {filters.search
                ? `No results for "${filters.search}". Try different search terms.`
                : "Try adjusting your filters or search terms."}
            </p>
            <button
              onClick={() => {
                setFilters(INITIAL_FILTERS);
                setShowDiscovery(true);
              }}
              className="btn-primary mt-4"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign as any} />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={observerRef} className="py-8" />

            {/* Loading More */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading more campaigns...
                </div>
              </div>
            )}

            {/* End of List */}
            {!hasMore && campaigns.length > 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                You've reached the end of the list
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Demo filtering helpers ─────────────────── */

function filterDemoCampaigns(campaigns: Campaign[], filters: CampaignFiltersType): Campaign[] {
  return campaigns.filter((c) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        c.title.toLowerCase().includes(q) ||
        (c.shortDescription || "").toLowerCase().includes(q) ||
        (c.category?.name || "").toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q) ||
        (c.author?.firstName || "").toLowerCase().includes(q) ||
        (c.author?.lastName || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filters.category && c.category?.slug !== filters.category) return false;
    if (filters.mode && c.mode !== filters.mode) return false;
    if (filters.location && c.location?.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-") !== filters.location) return false;
    if (filters.tag) {
      const tags = c.tags || [];
      const tagSlugs = tags.map((t: any) => typeof t === "string" ? t : t.tag?.slug || "");
      if (!tagSlugs.includes(filters.tag)) return false;
    }
    if (filters.membership === "membership" && !c.membership && c.category?.slug !== "founding-membership") return false;
    if (filters.membership === "non-membership" && (c.membership || c.category?.slug === "founding-membership")) return false;
    if (filters.evergreen === "evergreen" && !c.evergreen) return false;
    if (filters.evergreen === "seasonal" && c.evergreen) return false;
    if (filters.campaignType && c.category?.slug !== filters.campaignType) return false;
    if (filters.season) return false; // Season not in demo data, skip
    return true;
  });
}

function sortDemoCampaigns(campaigns: Campaign[], sortBy: string): Campaign[] {
  const sorted = [...campaigns];
  switch (sortBy) {
    case "mostFunded":
      return sorted.sort((a, b) => b.raisedAmount - a.raisedAmount);
    case "endingSoon":
      return sorted
        .filter((c) => new Date(c.deadline) > new Date())
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    case "popular":
      return sorted.sort(
        (a, b) =>
          ((b._count?.donations || 0) + (b._count?.pledges || 0)) -
          ((a._count?.donations || 0) + (a._count?.pledges || 0))
      );
    case "mostBacked":
      return sorted.sort(
        (a, b) =>
          ((b._count?.donations || 0) + (b._count?.pledges || 0)) -
          ((a._count?.donations || 0) + (a._count?.pledges || 0))
      );
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }
}
