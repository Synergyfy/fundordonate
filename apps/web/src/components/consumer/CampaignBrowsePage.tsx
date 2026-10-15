import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { campaignService } from "@/services/campaign";

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  mode: "fund" | "donate";
  featuredImage: string;
  location: string;
  cityName: string;
  category: string;
  backersCount: number;
  status: string;
}

function formatCurrency(pence: number): string {
  const pounds = pence / 100;
  return `£${pounds.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getProgressPercentage(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

function daysLeft(deadline: string): number {
  if (!deadline) return 0;
  const now = new Date();
  const end = new Date(deadline);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

function getModeColor(mode: string): string {
  switch (mode) {
    case "fund":
      return "bg-secondary-500 text-white";
    case "donate":
      return "bg-primary-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case "fund":
      return "Fund";
    case "donate":
      return "Donate";
    default:
      return mode;
  }
}

interface CampaignBrowsePageProps {
  onCampaignSelect?: (campaign: Campaign) => void;
}

export function CampaignBrowsePage({ onCampaignSelect }: CampaignBrowsePageProps) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeMode, setActiveMode] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function fetchCampaigns() {
      setLoading(true);
      try {
        const res = await campaignService.list({ limit: 60 });
        if (!mounted) return;
        const items = res?.items || [];
        const mapped: Campaign[] = items.map((c: any) => {
          const target = c.targetAmount || c.goalAmount || 0;
          const raised = c.raisedAmount || 0;
          const modeStr = (c.mode || "fund").toLowerCase() === "donate" ? "donate" : "fund";
          return {
            id: c.id,
            slug: c.slug || c.id,
            title: c.title || "Community Campaign",
            shortDescription: c.tagline || c.shortDescription || c.description || "",
            goalAmount: target,
            raisedAmount: raised,
            deadline: c.endDate || c.deadline || "",
            mode: modeStr,
            featuredImage: c.featuredImage || c.coverImage || "",
            location: c.business?.name || c.cityName || c.location || "United Kingdom",
            cityName: c.city || c.cityName || (c.business?.city) || "UK",
            category: c.category || "Community",
            backersCount: c.backerCount || c.backersCount || 0,
            status: c.status || "ACTIVE",
          };
        });
        setCampaigns(mapped);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
        if (mounted) setCampaigns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCampaigns();
    return () => {
      mounted = false;
    };
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.cityName).filter(Boolean))).sort(),
    [campaigns]
  );

  const categories = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.category).filter(Boolean))).sort(),
    [campaigns]
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        searchQuery === "" ||
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMode = activeMode === "all" || campaign.mode === activeMode;
      const matchesCity = selectedCity === "all" || campaign.cityName === selectedCity;
      const matchesCategory = selectedCategory === "all" || campaign.category === selectedCategory;

      return matchesSearch && matchesMode && matchesCity && matchesCategory;
    });
  }, [campaigns, searchQuery, activeMode, selectedCity, selectedCategory]);

  const modeTabs = [
    { key: "all", label: "All" },
    { key: "fund", label: "Fund" },
    { key: "donate", label: "Donate" },
  ];

  const handleCardClick = (campaign: Campaign) => {
    if (onCampaignSelect) {
      onCampaignSelect(campaign);
    } else {
      navigate(`/campaigns/${campaign.slug || campaign.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Campaigns</h1>
          <p className="mt-2 text-gray-500">
            Find projects to fund or donate to in your community
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-full border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {modeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMode(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeMode === tab.key
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label htmlFor="city-filter" className="block text-xs font-medium text-gray-500 mb-1">
              Location
            </label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Locations</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category-filter" className="block text-xs font-medium text-gray-500 mb-1">
              Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="mb-4 text-sm text-gray-500">
          {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} found
        </p>

        {/* Campaign Grid */}
        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white py-16 text-center text-sm text-gray-400">
            Loading campaigns from database...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const progress = getProgressPercentage(campaign.raisedAmount, campaign.goalAmount);
              const remaining = daysLeft(campaign.deadline);

              return (
                <button
                  key={campaign.id}
                  onClick={() => handleCardClick(campaign)}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm text-left transition-shadow hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50">
                    {campaign.featuredImage ? (
                      <img
                        src={campaign.featuredImage}
                        alt={campaign.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg
                          className="h-12 w-12 text-primary-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Mode Badge */}
                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${getModeColor(campaign.mode)}`}
                      >
                        {getModeLabel(campaign.mode)}
                      </span>
                    </div>

                    {/* Days Left */}
                    {remaining > 0 && (
                      <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                          {remaining}d left
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Category */}
                    <span className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                      {campaign.category}
                    </span>

                    {/* Title */}
                    <h3 className="mt-2 line-clamp-1 text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {campaign.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {campaign.shortDescription}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(campaign.raisedAmount)}
                      </span>
                      <span className="text-sm font-semibold text-primary-600">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                      <span>{campaign.backersCount} backers</span>
                      <span>{remaining > 0 ? `${remaining} days left` : "Ended"}</span>
                    </div>

                    {/* Location */}
                    <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <svg
                        className="h-3.5 w-3.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">{campaign.location}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
