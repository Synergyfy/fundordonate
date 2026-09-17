// =============================================================================
// UK Hub — Consumer Campaign List Page
// Shows only consumer-oriented campaigns for a specific High Street.
// =============================================================================

import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import { getDemoCampaignsForHighStreet } from "@/data/highStreetData";
import { getAreaTerminology } from "@/data/ukHubData";
import { HubBreadcrumb } from "@/components/hub/HubBreadcrumb";
import type { BreadcrumbItem } from "@/types/uk-hub";
import {
  Calendar, Clock, Users, ArrowLeft, MapPin,
  ChevronRight, Heart,
} from "lucide-react";

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

export default function ConsumerCampaignListPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const areaTerminology = getAreaTerminology(citySlug || "");
  const cityName = (citySlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const areaName = (localAreaSlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const streetName = (highStreetSlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const allCampaigns = useMemo(
    () => getDemoCampaignsForHighStreet(citySlug || "", localAreaSlug || "", highStreetSlug || ""),
    [citySlug, localAreaSlug, highStreetSlug],
  );

  const campaigns = useMemo(
    () => allCampaigns.filter(c => c.targetAudience === "consumer" || c.targetAudience === "both"),
    [allCampaigns],
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { label: cityName, slug: citySlug || "", fullPath: citySlug || "", type: "CITY" },
    { label: areaName, slug: localAreaSlug || "", fullPath: `${citySlug}/${localAreaSlug}`, type: "BOROUGH" },
    { label: streetName, slug: highStreetSlug || "", fullPath: `${citySlug}/${localAreaSlug}/${highStreetSlug}`, type: "HIGH_STREET" },
  ];

  const parentPath = `/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to={parentPath}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {streetName}
        </Link>
        <HubBreadcrumb
          items={[
            ...breadcrumbs,
            { label: "Consumer Campaigns", slug: "consumer", fullPath: `${citySlug}/${localAreaSlug}/${highStreetSlug}/consumer`, type: "HIGH_STREET" },
          ]}
        />
      </div>

      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-pink-500/20 p-2">
                <Heart className="h-5 w-5 text-pink-300" />
              </div>
              <span className="text-sm font-medium text-pink-300">For Consumer</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Consumer Campaigns
            </h1>
            <p className="mt-3 text-lg text-gray-300 max-w-2xl">
              Campaigns and opportunities available to Consumers on {streetName}, {areaName}.
            </p>

            {/* Season */}
            {currentSeason && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-pink-200" />
                  <span className="text-sm font-bold">{currentSeason.name}</span>
                </div>
              </div>
            )}

            {/* Location context */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{cityName}</span>
              </div>
              <span className="text-gray-500">/</span>
              <span>{areaName}</span>
              <span className="text-gray-500">/</span>
              <span>{streetName}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign List */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {campaigns.length} Consumer {campaigns.length === 1 ? "Campaign" : "Campaigns"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4" />
            <span>{areaTerminology}: {areaName}</span>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-xl bg-white border p-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Consumer Campaigns Available</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              No consumer campaigns are currently available for this High Street. Check back soon or explore business campaigns.
            </p>
            <Link
              to={`/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {streetName}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const fundingPct = campaign.goalAmount > 0
                ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
                : 0;
              const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              const campaignLink = `/uk-hub-activation/${citySlug}/${localAreaSlug}/${highStreetSlug}/consumer/campaign/${campaign.slug}`;

              return (
                <Link
                  key={campaign.id}
                  to={campaignLink}
                  className="group rounded-xl bg-white border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {campaign.featuredImage && (
                    <div className="h-44 bg-gray-100 overflow-hidden">
                      <img
                        src={campaign.featuredImage}
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-full bg-pink-100 text-pink-700 px-2.5 py-0.5 text-[10px] font-bold">
                        Consumer
                      </span>
                      <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-[10px] font-bold">
                        {campaign.mode === "fund" ? "Fund" : campaign.mode === "donation" ? "Donate" : "Sponsor"}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">
                      {campaign.shortDescription}
                    </p>

                    {/* Funding Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Funding Progress</span>
                        <span className="text-xs font-bold text-gray-700">{fundingPct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${fundingPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-400">{fmtCurrency(campaign.raisedAmount)} raised</span>
                        <span className="text-[10px] text-gray-400">of {fmtCurrency(campaign.goalAmount)}</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft}d left
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign._count?.donations ?? 0}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
