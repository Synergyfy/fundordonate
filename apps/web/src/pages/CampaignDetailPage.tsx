import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { useAuthStore } from "@/stores/auth.store";
import { DEMO_CAMPAIGNS } from "@/data/demo";
import { HUB_LOCATIONS, getDemoCampaignsForLocation } from "@/data/hubActivation";
import { getAdminCampaignBySlug, getAdminCampaignPublicPath } from "@/data/adminCampaigns";
import { CampaignDetailBody, type DetailCampaign } from "@/components/campaign/CampaignDetailBody";
import { RelatedCampaigns } from "@/components/campaign/RelatedCampaigns";
import { DonationForm } from "@/components/campaign/DonationForm";
import { PledgeForm } from "@/components/campaign/PledgeForm";
import { ContributionTypeChoice, type ContributionType } from "@/components/campaign/ContributionTypeChoice";
import { ChevronRight } from "lucide-react";

type Campaign = DetailCampaign;

export function CampaignDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore((s) => s.user);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState<ContributionType | null>(null);
  const [adminPath, setAdminPath] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    // Admin-created campaigns live on the rich hub campaign page.
    const adminCampaign = getAdminCampaignBySlug(slug);
    if (adminCampaign) {
      setAdminPath(getAdminCampaignPublicPath(adminCampaign));
      setLoading(false);
      return;
    }

    setAdminPath(null);
    setLoading(true);
    setError(null);

    campaignApi
      .getBySlug(slug)
      .then(setCampaign)
      .catch(() => {
        // Try DEMO_CAMPAIGNS first, then search all hubActivation campaigns
        const demo = DEMO_CAMPAIGNS.find((c) => c.slug === slug);
        if (demo) {
          setCampaign({
            id: demo.id,
            slug: demo.slug,
            title: demo.title,
            shortDescription: demo.shortDescription,
            description: demo.shortDescription,
            goalAmount: demo.goalAmount,
            raisedAmount: demo.raisedAmount,
            deadline: demo.deadline,
            status: "published",
            mode: demo.mode,
            featuredImage: demo.featuredImage,
            settings: "{}",
            createdAt: new Date().toISOString(),
            author: { id: "demo-user", firstName: demo.author.firstName, lastName: demo.author.lastName, username: `${demo.author.firstName.toLowerCase()}-${demo.author.lastName.toLowerCase()}` },
            category: demo.category ? { id: `cat-${demo.category.slug}`, name: demo.category.name, slug: demo.category.slug } : undefined,
            tags: Array.isArray(demo.tags) ? demo.tags.map((t) => ({ tag: { id: `tag-${t}`, name: t, slug: t } })) : undefined,
            _count: { donations: demo._count?.donations || 0, pledges: demo._count?.pledges || 0, comments: 0, bookmarks: 0 },
            parentId: demo.parentId,
            parentSlug: demo.parentSlug,
            parentTitle: demo.parentTitle,
            location: demo.location,
            campaignType: demo.campaignType,
            participationTypes: demo.participationTypes ? JSON.stringify(demo.participationTypes) : undefined,
            backerTiersEnabled: demo.backerTiersEnabled,
            recurringEnabled: demo.recurringEnabled,
            isSelfFunding: demo.isSelfFunding,
            selfFundingLevel: demo.selfFundingLevel,
            ownerContribution: demo.ownerContribution,
            campaignTarget: demo.campaignTarget,
            children: DEMO_CAMPAIGNS.filter(c => c.parentId === demo.id).map(c => ({
              id: c.id,
              slug: c.slug,
              title: c.title,
              shortDescription: c.shortDescription,
              goalAmount: c.goalAmount,
              raisedAmount: c.raisedAmount,
              deadline: c.deadline,
              mode: c.mode,
              featuredImage: c.featuredImage,
              _count: { donations: c._count?.donations || 0, pledges: c._count?.pledges || 0 },
            })),
          } as Campaign);
        } else {
          // Search all hubActivation campaigns
          let found = false;
          for (const location of HUB_LOCATIONS) {
            const locationCampaigns = getDemoCampaignsForLocation(location);
            const match = locationCampaigns.find((c) => c.slug === slug);
            if (match) {
              setCampaign({
                id: match.id,
                slug: match.slug,
                title: match.title,
                shortDescription: match.shortDescription,
                description: match.shortDescription,
                goalAmount: match.goalAmount,
                raisedAmount: match.raisedAmount,
                deadline: match.deadline,
                status: "published",
                mode: match.mode,
                featuredImage: match.featuredImage,
                media: match.media,
                settings: "{}",
                createdAt: new Date().toISOString(),
                author: { id: "demo-user", firstName: match.author.firstName, lastName: match.author.lastName, username: `${match.author.firstName.toLowerCase()}-${match.author.lastName.toLowerCase()}` },
                category: match.category ? { id: `cat-${match.category.slug}`, name: match.category.name, slug: match.category.slug } : undefined,
                tags: Array.isArray(match.tags) ? match.tags.map((t: string) => ({ tag: { id: `tag-${t}`, name: t, slug: t } })) : undefined,
                _count: { donations: match._count?.donations || 0, pledges: match._count?.pledges || 0, comments: 0, bookmarks: 0 },
                parentId: match.parentId,
                parentSlug: match.parentSlug,
                parentTitle: match.parentTitle,
                location: match.location,
                campaignType: match.campaignType,
                participationTypes: match.participationTypes ? JSON.stringify(match.participationTypes) : undefined,
                backerTiersEnabled: match.backerTiersEnabled,
                isSelfFunding: match.isSelfFunding,
                selfFundingLevel: match.selfFundingLevel,
              } as Campaign);
              found = true;
              break;
            }
          }
          if (!found) {
            setError("Campaign not found");
          }
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (adminPath) {
    return <Navigate to={adminPath} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-page py-8">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-3/4 rounded bg-gray-200" />
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="aspect-video rounded-xl bg-gray-200" />
              </div>
              <div className="space-y-4">
                <div className="h-48 rounded-xl bg-gray-200" />
                <div className="h-32 rounded-xl bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <p className="mt-4 text-lg text-gray-600">{error || "Campaign not found"}</p>
          <Link to="/campaigns" className="btn-primary mt-6 inline-block">
            Browse Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const isEnded = campaign.status === "completed" || campaign.status === "expired" || campaign.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-page py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/campaigns" className="hover:text-gray-700">Campaigns</Link>
            <ChevronRight className="h-3 w-3" />
            {campaign.category && (
              <>
                <Link to={`/campaigns?category=${campaign.category.slug}`} className="hover:text-gray-700">
                  {campaign.category.name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            <span className="text-gray-900 font-medium truncate">{campaign.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-page py-8">
        <CampaignDetailBody campaign={campaign} user={user} />
      </div>

      {/* Related Campaigns */}
      <RelatedCampaigns
        campaignId={campaign.id}
        categoryId={campaign.category?.id}
        currentSlug={campaign.slug}
      />

      {/* Donation/Pledge Form */}
      {!isEnded && (
        <div id="contribute" className="border-t border-gray-200 py-12 scroll-mt-20">
          <div className="container-page max-w-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {campaign.mode === "fund" ? "Fund This Project" : "Donate Now"}
              </h2>
              <p className="mt-1 text-gray-500">
                {campaign.mode === "fund"
                  ? "Support this local initiative and help bring it to life"
                  : "Your contribution helps strengthen your local community hub"}
              </p>
            </div>

            {campaign.hierarchyLevel && (
              <div className="mb-4 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  <span>{campaign.hierarchyLevel === "national" ? "🇬🇧" : campaign.hierarchyLevel === "city" ? "🏙️" : campaign.hierarchyLevel === "borough" ? "🏘️" : campaign.hierarchyLevel === "high_street" ? "🛒" : "🏢"}</span>
                  <span className="capitalize">{campaign.hierarchyLevel.replace("_", " ")} Campaign</span>
                  {campaign.location && <span className="text-gray-400">· {campaign.location}</span>}
                </span>
              </div>
            )}

            {!contributionType ? (
              <ContributionTypeChoice
                campaignTitle={campaign.title}
                locationName={campaign.location || undefined}
                hasFoundingProgramme={!!campaign.locationId}
                foundingRemaining={undefined}
                onSelect={setContributionType}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContributionType(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ← Change participation type
                  </button>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs font-medium text-gray-600">
                    Contributing as: {contributionType === "founding_member" ? "⭐ Founding Member" : "🤝 Backer"}
                  </span>
                </div>
                {campaign.mode === "donation" ? (
                  <DonationForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType={contributionType}
                  />
                ) : (
                  <PledgeForm
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    rewards={campaign.rewards || []}
                    hierarchyLevel={campaign.hierarchyLevel}
                    locationName={campaign.location || undefined}
                    contributionType={contributionType}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
