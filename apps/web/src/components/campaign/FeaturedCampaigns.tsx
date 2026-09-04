import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { CampaignSlider } from "./CampaignSlider";

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
  author?: { firstName?: string; lastName?: string; avatar?: string; username: string };
  category?: { name: string; slug: string };
  _count?: { donations: number; pledges: number; comments: number };
}

export function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignApi
      .getFeatured(6)
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="mt-2 h-6 w-full rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
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
    <section className="py-12">
      <div className="container-page">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Campaigns</h2>
            <p className="mt-1 text-gray-500">Discover campaigns handpicked by our team</p>
          </div>
          <Link
            to="/campaigns"
            className="hidden text-sm font-medium text-primary-600 hover:text-primary-700 sm:block"
          >
            View all campaigns →
          </Link>
        </div>

        <CampaignSlider campaigns={campaigns} />

        <div className="mt-6 text-center sm:hidden">
          <Link to="/campaigns" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all campaigns →
          </Link>
        </div>
      </div>
    </section>
  );
}
