import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { CampaignMarketplaceCard } from "./CampaignMarketplaceCard";

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
  location?: string;
  author?: { firstName?: string; lastName?: string; avatar?: string; username?: string };
  category?: { name: string; slug: string };
  _count?: { donations: number; pledges: number; comments: number };
}

interface Props {
  campaignId: string;
  categoryId?: string;
  currentSlug: string;
}

export function RelatedCampaigns({ campaignId, categoryId, currentSlug }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    campaignApi
      .list({ categoryId, status: "published", limit: 4, sortBy: "newest" })
      .then((res) => {
        setCampaigns(res.items.filter((c) => c.id !== campaignId && c.slug !== currentSlug).slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [campaignId, categoryId]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-page">
          <div className="mb-6 h-7 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="mt-2 h-6 w-full rounded bg-gray-200" />
                  <div className="mt-4 h-2 w-full rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) return null;

  return (
    <section className="border-t border-gray-200 py-12">
      <div className="container-page">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Related Campaigns</h2>
          <Link to="/campaigns" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignMarketplaceCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </div>
    </section>
  );
}
