// =============================================================================
// Business Profile Public Page
// Public-facing business profile view with live database data.
// =============================================================================

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Target, TrendingUp, Award, Crown, Share2, Heart, ArrowLeft,
} from "lucide-react";
import { businessService } from "@/services/business";
import { campaignService } from "@/services/campaign";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((p || 0) / 100);

interface PublicBusinessData {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  categories: string[];
  membershipTier: string;
  joinedAt: string;
  rank: number;
  totalRaised: number;
  campaigns: Array<{
    id: string;
    name: string;
    description: string;
    raised: number;
    target: number;
    status: string;
  }>;
  rewards: string[];
}

export default function BusinessProfilePublicPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState<PublicBusinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadBusiness() {
      setLoading(true);
      try {
        const [profileRes, campaignsRes] = await Promise.allSettled([
          businessService.getProfile(),
          campaignService.list({ search: slug, limit: 10 }),
        ]);

        if (!mounted) return;

        let bName = slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
        let bDesc = "";
        let bCity = "";
        let bTier = "";
        let bCategory = "";
        let bJoinedAt = "";
        let bRewards: string[] = [];

        if (profileRes.status === "fulfilled" && profileRes.value) {
          const p: any = profileRes.value;
          bName = p.name || bName;
          bDesc = p.description || bDesc;
          bCity = p.city || p.locationName || bCity;
          bTier = p.membershipTier || bTier;
          bCategory = p.category || bCategory;
          bJoinedAt = p.createdAt
            ? new Date(p.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
            : "";
          const rawRewards = p.rewards ?? p.badges ?? p.recognition;
          bRewards = Array.isArray(rawRewards) ? rawRewards.filter((r: unknown) => typeof r === "string") : [];
        }

        const rawCampaigns = campaignsRes.status === "fulfilled" ? campaignsRes.value?.items || [] : [];
        const mappedCampaigns = rawCampaigns.map((c: any) => ({
          id: c.id,
          name: c.title || "Untitled campaign",
          description: c.tagline || c.shortDescription || "",
          raised: c.raisedAmount || 0,
          target: c.targetAmount || 0,
          status: c.status || "ACTIVE",
        }));

        const totalRaised = mappedCampaigns.reduce((acc: number, c: any) => acc + c.raised, 0);

        setBusiness({
          id: slug || "",
          name: bName,
          type: bCategory,
          description: bDesc,
          location: bCity,
          categories: bCategory ? [bCategory] : [],
          membershipTier: bTier,
          joinedAt: bJoinedAt,
          rank: 0,
          totalRaised,
          campaigns: mappedCampaigns,
          rewards: bRewards,
        });
      } catch (err) {
        console.error("Failed to load business profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBusiness();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading business profile...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">Business not found.</p>
        <Link to="/campaigns" className="mt-4 inline-block text-xs font-semibold text-primary-600 hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{business.name || "Business profile"}</h1>
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {[business.type, business.location].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: business.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Profile URL copied to clipboard");
                  }
                }}
                className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <div className="text-xl font-bold text-gray-900">{fmt(business.totalRaised)}</div>
            <div className="text-xs text-gray-500">Total Raised</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <Target className="mx-auto h-5 w-5 text-blue-500 mb-1" />
            <div className="text-xl font-bold text-gray-900">{business.campaigns.length}</div>
            <div className="text-xs text-gray-500">Campaigns</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
            <Award className="mx-auto h-5 w-5 text-yellow-500 mb-1" />
            <div className="text-xl font-bold text-gray-900">{business.membershipTier || "—"}</div>
            <div className="text-xs text-gray-500">Partner Tier</div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl bg-white p-5 shadow-sm border mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
          {business.description && <p className="text-sm text-gray-600">{business.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {business.categories.map((c) => (
              <span key={c} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{c}</span>
            ))}
          </div>
          {business.joinedAt && (
            <div className="mt-4 text-xs text-gray-400">
              {business.joinedAt}
              {business.membershipTier ? ` · ${business.membershipTier} Tier` : ""}
            </div>
          )}
        </div>

        {/* Campaigns */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
          </div>
          <div className="divide-y">
            {business.campaigns.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No active campaigns published yet.
              </div>
            ) : (
              business.campaigns.map((c) => {
                const pct = c.target > 0 ? Math.min(100, Math.round((c.raised / c.target) * 100)) : 0;
                return (
                  <Link key={c.id} to={`/campaigns/${c.id}`} className="block p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{c.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>{c.status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{fmt(c.raised)} / {fmt(c.target)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Rewards */}
        {business.rewards.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Earned Recognition</h2>
            <div className="flex flex-wrap gap-2">
              {business.rewards.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700">
                  <Award className="h-3 w-3" /> {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
