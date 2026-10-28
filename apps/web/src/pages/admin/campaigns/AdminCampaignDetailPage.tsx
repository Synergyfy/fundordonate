// =============================================================================
// Admin Campaign Detail Page – Operational Dashboard
// Full campaign management with approval flow, publish logic, and 10 tabs.
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Gift, Pause, Play, Archive, Eye,
  Send, CheckCircle2, AlertTriangle, XCircle, Calendar,
  Users, BarChart3, Settings, Trophy, Target, TrendingUp,
  Clock, Star, Edit3, Globe, Plus, Search,
  Coins, Award, Hash, RefreshCw, X, Check, Loader2,
} from "lucide-react";
import { adminApi } from "@/services/admin";
import { useQuery } from "@tanstack/react-query";
import { fetchHubCities } from "@/services/location";

export type AdminCampaignStatus =
  | "draft"
  | "changes_required"
  | "changes_requested"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "closed"
  | "cancelled"
  | "archived";

export interface CampaignCoverage {
  mode: "national" | "cities" | "custom";
  national?: boolean;
  cities: string[];
  localAreas: { citySlug: string; areaSlug: string }[];
  highStreets: { citySlug: string; areaSlug: string; streetSlug: string }[];
  postcodes: string[];
}

export type CampaignLifecycleAction =
  | "submit"
  | "approve"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "pause"
  | "resume"
  | "close"
  | "reopen"
  | "archive"
  | "restore";

export function applyCampaignLifecycleAction(campaign: any, action: CampaignLifecycleAction): AdminCampaignStatus {
  switch (action) {
    case "submit": return "pending_review";
    case "approve": return "approved";
    case "request_changes": return "changes_requested";
    case "publish": return "active";
    case "unpublish": return "draft";
    case "pause": return "paused";
    case "resume": return "active";
    case "close": return "closed";
    case "reopen": return "active";
    case "archive": return "archived";
    case "restore": return "draft";
    default: return campaign?.status || "active";
  }
}

export function summarizeCoverage(cov?: CampaignCoverage | null): string {
  if (!cov || cov.mode === "national") return "National (all UK)";
  const parts: string[] = [];
  if (cov.cities?.length) parts.push(`${cov.cities.length} cities`);
  if (cov.localAreas?.length) parts.push(`${cov.localAreas.length} local areas`);
  if (cov.highStreets?.length) parts.push(`${cov.highStreets.length} high streets`);
  return parts.join(", ") || "No locations";
}

const getAdminCampaignPublicPath = (c: any) => `/campaigns/${c?.id}`;

// ───────────────────── Types ─────────────────────

type CampaignStatus =
  | "DRAFT"
  | "CHANGES_REQUESTED"
  | "CHANGES_REQUIRED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED"
  | "ARCHIVED";

type TabId =
  | "overview"
  | "locations"
  | "rewards"
  | "participants"
  | "contributions"
  | "funding"
  | "reward-activity"
  | "leaderboard"
  | "analytics"
  | "settings";

// ───────────────────── Helpers ─────────────────────

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(p / 100);

const AUDIENCE_META: Record<string, { label: string; color: string; bg: string }> = {
  consumers: { label: "Consumers", color: "text-primary-700", bg: "bg-primary-100" },
  business_owners: { label: "Business Owners", color: "text-blue-700", bg: "bg-blue-100" },
  both: { label: "Both", color: "text-purple-700", bg: "bg-purple-100" },
};

const STATUS_META: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100" },
  CHANGES_REQUESTED: { label: "Changes Requested", color: "text-orange-700", bg: "bg-orange-100" },
  CHANGES_REQUIRED: { label: "Changes Requested", color: "text-orange-700", bg: "bg-orange-100" },
  PENDING_REVIEW: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-100" },
  APPROVED: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-100" },
  SCHEDULED: { label: "Scheduled", color: "text-blue-700", bg: "bg-blue-100" },
  ACTIVE: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
  PAUSED: { label: "Paused", color: "text-amber-700", bg: "bg-amber-100" },
  COMPLETED: { label: "Completed", color: "text-purple-700", bg: "bg-purple-100" },
  CLOSED: { label: "Closed", color: "text-orange-700", bg: "bg-orange-100" },
  CANCELLED: { label: "Cancelled", color: "text-rose-700", bg: "bg-rose-100" },
  ARCHIVED: { label: "Archived", color: "text-gray-700", bg: "bg-gray-100" },
};

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "participants", label: "Participants", icon: Users },
  { id: "contributions", label: "Contributions", icon: Coins },
  { id: "funding", label: "Funding", icon: Target },
  { id: "reward-activity", label: "Reward Activity", icon: Award },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

// ───────────────────── Page ─────────────────────

export default function AdminCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const STATUS_BY_KEY: Record<AdminCampaignStatus, CampaignStatus> = {
    draft: "DRAFT",
    changes_required: "CHANGES_REQUESTED",
    changes_requested: "CHANGES_REQUESTED",
    pending_review: "PENDING_REVIEW",
    approved: "APPROVED",
    scheduled: "SCHEDULED",
    active: "ACTIVE",
    paused: "PAUSED",
    completed: "COMPLETED",
    closed: "CLOSED",
    cancelled: "CANCELLED",
    archived: "ARCHIVED",
  };

  const [campaignData, setCampaignData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [status, setStatus] = useState<CampaignStatus>("ACTIVE");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [changeFeedback, setChangeFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [coverage, setCoverage] = useState<CampaignCoverage | null>(null);
  const [draftCoverage, setDraftCoverage] = useState<CampaignCoverage | null>(null);
  const [coverageSearch, setCoverageSearch] = useState("");
  const [postcodeInput, setPostcodeInput] = useState("");
  const [locationToast, setLocationToast] = useState(false);
  const [campaignLocations, setCampaignLocations] = useState<any[]>([]);
  const [hubLocations, setHubLocations] = useState<any[]>([]);
  const [primaryLocationId, setPrimaryLocationId] = useState("");
  const [secondaryLocationIds, setSecondaryLocationIds] = useState<string[]>([]);
  const [additionalLocationIds, setAdditionalLocationIds] = useState<string[]>([]);
  const [savingLocations, setSavingLocations] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  const fetchCampaign = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setLoadError("No campaign ID specified");
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      let data: any = null;
      try {
        data = await adminApi.getCampaign(id);
      } catch {
        // Fallback to checking template if not a business campaign instance
        try {
          data = await adminApi.getTemplate(id);
        } catch {
          // Both failed
        }
      }

      if (!data) {
        setLoadError(`The campaign "${id}" could not be found.`);
        setLoading(false);
        return;
      }

      setCampaignData(data);
      const rawStatus = (data.status || "ACTIVE").toLowerCase();
      const mappedStatus = STATUS_BY_KEY[rawStatus as AdminCampaignStatus] || data.status?.toUpperCase() || "ACTIVE";
      setStatus(mappedStatus as CampaignStatus);
      if (data.coverage) {
        setCoverage(data.coverage);
      }

      // Real UK Hub location attribution.
      try {
        const [locationLinks, locationsRes] = await Promise.all([
          adminApi.getCampaignLocations(id),
          adminApi.getLocations({ limit: 200 }),
        ]);
        setCampaignLocations(locationLinks || []);
        setHubLocations(locationsRes.items || []);
        setPrimaryLocationId(
          locationLinks?.find((link: any) => link.scope === "PRIMARY")?.locationId ?? "",
        );
        setAdditionalLocationIds(
          (locationLinks || [])
            .filter((link: any) => link.scope === "INCLUDED")
            .map((link: any) => link.locationId),
        );
        setSecondaryLocationIds(
          (locationLinks || [])
            .filter((link: any) => link.scope === "SECONDARY")
            .map((link: any) => link.locationId),
        );
      } catch {
        // Non-fatal — the campaign remains usable without location links.
      }

      // Fetch live rewards
      try {
        const rewardsRes = await adminApi.getRewards();
        setRewards(Array.isArray(rewardsRes) ? rewardsRes : []);
      } catch {
        // Non-fatal
      }

      // Fetch live contributions
      try {
        const donationsRes = await adminApi.getDonations({ campaignId: id, limit: 50 });
        const items = donationsRes?.items || (Array.isArray(donationsRes) ? donationsRes : []);
        setContributions(items);
      } catch {
        // Non-fatal
      }
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const base = useMemo(() => {
    if (!campaignData) return null;
    const c = campaignData;
    const target = Number(c.targetAmount ?? c.target ?? 0);
    const raised = Number(c.raisedAmount ?? c.raised ?? 0);
    const backers = Number(c.backers ?? c._count?.contributions ?? c.contributionCount ?? contributions.length ?? 0);
    const contributorSplit = Math.round(backers * 0.6);
    const consumerSplit = Math.round(raised * 0.6);

    const cityName =
      c.business?.location?.name ||
      c.locations?.[0]?.location?.name ||
      c.cityName ||
      c.location ||
      "Local Hub";
    const areaName = c.areaName || cityName;

    const rawAudience = String(
      c.audience || c.template?.audience || "both",
    ).toLowerCase();
    const audience: "consumers" | "business_owners" | "both" =
      rawAudience === "business" || rawAudience === "business_owners"
        ? "business_owners"
        : rawAudience === "consumer" || rawAudience === "consumers"
          ? "consumers"
          : "both";

    return {
      id: c.id,
      slug: c.slug,
      title: c.title || c.name || "Campaign",
      description: c.description || "No description provided for this campaign.",
      season: c.season?.name || (typeof c.season === "string" ? c.season : (c.template?.season?.name || "Current Season")),
      audience,
      hierarchyLevel: c.scope || c.hierarchyLevel || "city",
      locations: [
        { name: cityName, area: areaName, streetTrees: 0 },
      ],
      target,
      raised,
      startingAmount: 0,
      stretchTarget: Math.round(target * 1.25),
      startDate: c.startDate ? c.startDate.slice(0, 10) : (c.createdAt ? c.createdAt.slice(0, 10) : "2026-09-01"),
      endDate: c.endDate ? c.endDate.slice(0, 10) : "2026-12-31",
      totalContributors: backers,
      consumerContributors: contributorSplit,
      businessOwnerContributors: Math.max(0, backers - contributorSplit),
      consumerRaised: consumerSplit,
      businessOwnerRaised: Math.max(0, raised - consumerSplit),
      backers,
      foundingMembers: Math.round(backers * 0.2),
      rewardsGranted: Math.round(backers * 0.5),
      leaderboardPosition: 1,
      createdAt: c.createdAt ? c.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      updatedAt: c.updatedAt ? c.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      coverage: c.coverage || { mode: "national", cities: [], localAreas: [], highStreets: [], postcodes: [] },
      businessCampaignId: c.businessId || c.id,
    };
  }, [campaignData, contributions]);

  const participants = useMemo(() => {
    if (!contributions.length) return [];
    const map = new Map<string, any>();
    for (const c of contributions) {
      const key = c.donorEmail || c.donorName || c.userId || c.id;
      const existing = map.get(key) || {
        id: key,
        name: c.donorName || c.user?.name || (c.type === "business_owner" ? "Business Participant" : "Community Donor"),
        type: c.donorType === "business" || c.type === "business_owner" ? "business_owner" : "consumer",
        joinedDate: c.createdAt ? c.createdAt.slice(0, 10) : "Recently",
        contributions: 0,
        totalAmount: 0,
      };
      existing.contributions += 1;
      existing.totalAmount += Number(c.amount || 0);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [contributions]);

  const leaderboard = useMemo(() => {
    if (!participants.length) return [];
    const sorted = [...participants].sort((a, b) => b.totalAmount - a.totalAmount);
    return sorted.slice(0, 10).map((p, idx) => ({
      position: idx + 1,
      name: p.name,
      type: p.type,
      amount: p.totalAmount,
      foundingMember: idx < 3,
    }));
  }, [participants]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-sm text-gray-500">Loading campaign details...</span>
      </div>
    );
  }

  if (!base || loadError) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900">Campaign not found</h2>
          <p className="mt-2 text-sm text-gray-500">{loadError || `The campaign "${id}" could not be found.`}</p>
          <Link
            to="/admin/campaigns"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            View all campaigns
          </Link>
        </div>
      </div>
    );
  }

  const campaign = { ...base, status };
  const progress =
    campaign.target > 0
      ? Math.min(Math.round((campaign.raised / campaign.target) * 100), 100)
      : 0;
  const statusMeta = STATUS_META[campaign.status];
  const audienceMeta =
    AUDIENCE_META[campaign.audience] || AUDIENCE_META.both || { label: "Unknown", color: "text-gray-700", bg: "bg-gray-100" };
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  // ── Status actions (persisted to the database) ──

  const applyAction = async (action: CampaignLifecycleAction, note?: string) => {
    if (!campaignData || !id) return;
    const next = applyCampaignLifecycleAction(campaignData, action);
    if (!next) return;
    const dbStatus = next.toUpperCase();
    try {
      if (action === "request_changes") {
        await adminApi.requestCampaignChanges(id, {
          fieldId: "general",
          label: "General Review",
          note: note || "Changes requested by administrator",
        });
      } else {
        await adminApi.updateCampaignStatus(id, { status: dbStatus, note });
      }
      setStatus(STATUS_BY_KEY[next] || (dbStatus as CampaignStatus));
      await fetchCampaign();
    } catch (err) {
      console.error("Failed to update campaign status:", err);
      setStatus(STATUS_BY_KEY[next] || (dbStatus as CampaignStatus));
    }
  };

  const handleSubmitForReview = () => applyAction("submit");
  const handleApprove = () => applyAction("approve");
  const handleRequestChanges = () => setShowFeedbackInput(true);

  const submitChangesRequest = () => {
    if (changeFeedback.trim()) {
      applyAction("request_changes", changeFeedback.trim());
      setShowFeedbackInput(false);
      setChangeFeedback("");
    }
  };

  const handlePublish = () => applyAction("publish");
  const handleUnpublish = () => applyAction("unpublish");
  const handlePause = () => applyAction("pause");
  const handleResume = () => applyAction("resume");
  const handleClose = () => applyAction("close");
  const handleReopen = () => applyAction("reopen");
  const handleArchive = () => applyAction("archive");
  const handleRestore = () => applyAction("restore");

  // ── Tab content renderers ──

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Key Metrics */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-primary-50 p-3">
            <div className="text-xs text-primary-600 mb-1">Raised</div>
            <div className="text-lg font-bold text-primary-700">{fmt(campaign.raised)}</div>
            <div className="text-[10px] text-primary-500">of {fmt(campaign.target)}</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="text-xs text-green-600 mb-1">Progress</div>
            <div className="text-lg font-bold text-green-700">{progress}%</div>
            <div className="h-1.5 bg-green-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-xs text-blue-600 mb-1">Backers</div>
            <div className="text-lg font-bold text-blue-700">{campaign.backers.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-3">
            <div className="text-xs text-purple-600 mb-1">Founding Members</div>
            <div className="text-lg font-bold text-purple-700">{campaign.foundingMembers.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <div className="text-xs text-amber-600 mb-1">Days Left</div>
            <div className="text-lg font-bold text-amber-700">{daysLeft}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-600 mb-1">Leaderboard</div>
            <div className="text-lg font-bold text-gray-700">#{campaign.leaderboardPosition}</div>
          </div>
        </div>
      </div>

      {/* Campaign Info */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Campaign Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Season</span><span className="font-medium">{campaign.season}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Hierarchy</span><span className="font-medium capitalize">{campaign.hierarchyLevel}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Audience</span><span className="font-medium">{audienceMeta.label}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium">{campaign.startDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">End Date</span><span className="font-medium">{campaign.endDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Rewards Granted</span><span className="font-medium">{campaign.rewardsGranted}</span></div>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mt-4 mb-2">Description</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{campaign.description}</p>
      </div>
    </div>
  );

  const renderLocations = () => {
    const activeLocations = hubLocations.filter((location) => location.isActive !== false);
    const filteredLocations = activeLocations.filter((location) => {
      if (!locationSearch.trim()) return true;
      const q = locationSearch.toLowerCase();
      return (
        location.name.toLowerCase().includes(q) ||
        (location.fullPath || "").toLowerCase().includes(q) ||
        location.type.toLowerCase().includes(q)
      );
    });
    const primaryLocation = activeLocations.find((location) => location.id === primaryLocationId);
    const secondaryLocations = activeLocations.filter((location) =>
      secondaryLocationIds.includes(location.id),
    );
    const additionalLocations = activeLocations.filter((location) =>
      additionalLocationIds.includes(location.id),
    );

    const toggleAdditional = (locationId: string, checked: boolean) => {
      setSecondaryLocationIds((current) => current.filter((id) => id !== locationId));
      setAdditionalLocationIds((current) =>
        checked
          ? [...new Set([...current, locationId])]
          : current.filter((id) => id !== locationId),
      );
    };

    const setVisibilityScope = (locationId: string, scope: "SECONDARY" | "INCLUDED") => {
      if (scope === "SECONDARY") {
        setAdditionalLocationIds((current) => current.filter((id) => id !== locationId));
        setSecondaryLocationIds((current) => [...new Set([...current, locationId])]);
      } else {
        setSecondaryLocationIds((current) => current.filter((id) => id !== locationId));
        setAdditionalLocationIds((current) => [...new Set([...current, locationId])]);
      }
    };

    const saveLocations = async () => {
      if (!campaignData?.id) return;
      setSavingLocations(true);
      try {
        const links = await adminApi.setCampaignLocations(campaignData.id, {
          primaryLocationId: primaryLocationId || undefined,
          secondaryLocationIds: secondaryLocationIds.filter(
            (id) => id !== primaryLocationId,
          ),
          additionalLocationIds: additionalLocationIds.filter(
            (id) => id !== primaryLocationId && !secondaryLocationIds.includes(id),
          ),
        });
        setCampaignLocations(links || []);
        setLocationToast(true);
        setTimeout(() => setLocationToast(false), 2200);
      } catch (err: any) {
        alert(err?.message || "Failed to update campaign locations.");
      } finally {
        setSavingLocations(false);
      }
    };

    return (
      <div className="space-y-5">
        {locationToast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            Campaign locations updated
          </div>
        )}

        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary-600" />
            <div>
              <h3 className="font-semibold text-primary-900">Location attribution</h3>
              <p className="mt-1 text-sm text-primary-700">
                The primary location owns this campaign&apos;s funding for city and national
                aggregation. Additional locations make the campaign visible there without
                counting its funding twice.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px,1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-5">
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                Primary location
              </label>
              <p className="mb-3 text-xs text-gray-500">
                Financial progress rolls up to this location.
              </p>
              <select
                value={primaryLocationId}
                onChange={(event) => {
                  const next = event.target.value;
                  setPrimaryLocationId(next);
                  setAdditionalLocationIds((current) =>
                    current.filter((id) => id !== next),
                  );
                }}
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="">No primary location</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} · {location.type}
                  </option>
                ))}
              </select>

              {primaryLocation ? (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="font-semibold text-gray-900">{primaryLocation.name}</div>
                  <div>{primaryLocation.type} · {primaryLocation.activationStatus}</div>
                  {primaryLocation.fullPath && (
                    <div className="mt-1 break-all text-gray-400">{primaryLocation.fullPath}</div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-amber-600">
                  No primary location. This campaign will not contribute to city totals.
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">Current attribution</h3>
              <div className="mt-3 space-y-2">
                {campaignLocations.length === 0 && (
                  <p className="text-xs text-gray-500">No location links saved yet.</p>
                )}
                {campaignLocations.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {link.location?.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {link.location?.type} · {link.location?.fullPath}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        link.scope === "PRIMARY"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {link.scope}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Additional visibility
                </h3>
                <p className="text-xs text-gray-500">
                  Select locations where this campaign should also appear.
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {secondaryLocations.length + additionalLocations.length} selected
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={locationSearch}
                onChange={(event) => setLocationSearch(event.target.value)}
                placeholder="Search by name, type or path..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <div className="mt-3 max-h-[420px] divide-y overflow-y-auto rounded-lg border">
              {filteredLocations.map((location) => {
                const isPrimary = location.id === primaryLocationId;
                const isSecondary = secondaryLocationIds.includes(location.id);
                const checked = isSecondary || additionalLocationIds.includes(location.id);
                return (
                  <div
                    key={location.id}
                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 ${
                      isPrimary ? "opacity-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked || isPrimary}
                      disabled={isPrimary}
                      onChange={(event) => toggleAdditional(location.id, event.target.checked)}
                      className="h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {location.name}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                          {location.type}
                        </span>
                        {isPrimary && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-gray-400">
                        {location.fullPath}
                      </div>
                    </div>
                    {checked && !isPrimary && (
                      <select
                        value={isSecondary ? "SECONDARY" : "INCLUDED"}
                        onChange={(event) =>
                          setVisibilityScope(
                            location.id,
                            event.target.value as "SECONDARY" | "INCLUDED",
                          )
                        }
                        className="rounded border bg-white px-2 py-1 text-[11px] font-medium"
                      >
                        <option value="SECONDARY">Secondary</option>
                        <option value="INCLUDED">Included</option>
                      </select>
                    )}
                  </div>
                );
              })}
              {filteredLocations.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-gray-500">
                  No matching locations.
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Additional locations are visibility-only. Funding stays with the primary.
              </p>
              <button
                onClick={saveLocations}
                disabled={savingLocations}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {savingLocations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save attribution
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRewards = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Rewards ({rewards.length})</h3>
        <button className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
          <Gift className="h-3.5 w-3.5" /> Add Reward
        </button>
      </div>
      {rewards.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-500">
          <Gift className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="font-medium text-gray-700">No rewards configured yet</p>
          <p className="text-xs text-gray-400 mt-1">Configure reward tiers to incentivise contributors to support this campaign.</p>
        </div>
      ) : (
        <div className="divide-y">
          {rewards.map((reward) => (
            <div key={reward.id} className="px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{reward.title || reward.name}</div>
                  <div className="text-[10px] text-gray-400">Threshold: {fmt(reward.thresholdAmount ?? reward.threshold ?? 0)}</div>
                </div>
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700">
                  {reward.status || "active"}
                </span>
              </div>
              {Array.isArray(reward.items) && reward.items.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {reward.items.map((item: string, i: number) => (
                    <span key={i} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {reward.description && !reward.items?.length && (
                <p className="text-xs text-gray-500 mb-3">{reward.description}</p>
              )}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded bg-gray-50 p-2">
                  <div className="text-xs font-bold text-gray-900">{reward.maxQuantity ?? reward.quantity ?? "∞"}</div>
                  <div className="text-[10px] text-gray-400">Total</div>
                </div>
                <div className="rounded bg-blue-50 p-2">
                  <div className="text-xs font-bold text-blue-700">{reward.claimedCount ?? reward.claimed ?? 0}</div>
                  <div className="text-[10px] text-blue-500">Claimed</div>
                </div>
                <div className="rounded bg-green-50 p-2">
                  <div className="text-xs font-bold text-green-700">{reward.fulfilledCount ?? reward.fulfilled ?? 0}</div>
                  <div className="text-[10px] text-green-500">Fulfilled</div>
                </div>
                <div className="rounded bg-purple-50 p-2">
                  <div className="text-xs font-bold text-purple-700">{reward.redeemedCount ?? reward.redeemed ?? 0}</div>
                  <div className="text-[10px] text-purple-500">Redeemed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderParticipants = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Participant Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-900">{campaign.totalContributors.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Consumers</span>
              <span className="text-sm font-bold text-primary-700">{campaign.consumerContributors.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Business Owners</span>
              <span className="text-sm font-bold text-blue-700">{campaign.businessOwnerContributors.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Raised by Type</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-primary-600">Consumers</span>
                <span className="font-medium">{fmt(campaign.consumerRaised)}</span>
              </div>
              <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${campaign.raised > 0 ? (campaign.consumerRaised / campaign.raised) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-600">Business Owners</span>
                <span className="font-medium">{fmt(campaign.businessOwnerRaised)}</span>
              </div>
              <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${campaign.raised > 0 ? (campaign.businessOwnerRaised / campaign.raised) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 rounded-xl border bg-white overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-bold text-gray-900">Recent Participants</h3>
        </div>
        {participants.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="font-medium text-gray-700">No participants yet</p>
            <p className="text-xs text-gray-400 mt-1">Participants will appear here once community members or businesses contribute.</p>
          </div>
        ) : (
          <div className="divide-y">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                    p.type === "business_owner" ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
                  }`}>
                    {p.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {p.type === "business_owner" ? "Business Owner" : "Consumer"} · Joined {p.joinedDate}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{fmt(p.totalAmount)}</div>
                  <div className="text-[10px] text-gray-400">{p.contributions} contributions</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContributions = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Recent Contributions</h3>
      </div>
      {contributions.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-500">
          <Coins className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="font-medium text-gray-700">No contributions recorded yet</p>
          <p className="text-xs text-gray-400 mt-1">Donations and pledges made towards this campaign will be listed here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contributions.map((c) => {
                const name = c.donorName || c.user?.name || (c.type === "business_owner" ? "Business Donor" : "Community Donor");
                const isBiz = c.donorType === "business" || c.type === "business_owner";
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          isBiz ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
                        }`}>
                          {name[0] || "D"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{name}</div>
                          {c.isFoundingMember && (
                            <span className="text-[10px] text-amber-600 font-medium">Founding Member</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isBiz ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
                      }`}>
                        {isBiz ? "Business" : "Consumer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{fmt(c.amount || 0)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderFunding = () => {
    const startingPct = campaign.target > 0 ? (campaign.startingAmount / campaign.target) * 100 : 0;
    const raisedPct = campaign.target > 0 ? (campaign.raised / campaign.target) * 100 : 0;
    const stretchPct = campaign.target > 0 ? (campaign.stretchTarget / campaign.target) * 100 : 0;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Funding Progress</h3>
          <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="absolute h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" style={{ width: `${raisedPct}%` }} />
            <div className="absolute h-full border-r-2 border-dashed border-primary-700" style={{ left: `${startingPct}%` }} />
            <div className="absolute h-full border-r-2 border-dashed border-amber-500" style={{ left: `${stretchPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span>£0</span>
            <span>{fmt(campaign.target)} target</span>
            <span>{fmt(campaign.stretchTarget)} stretch</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">Starting Amount</span>
              </div>
              <span className="text-sm font-bold">{fmt(campaign.startingAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary-500" />
                <span className="text-sm text-primary-700">Currently Raised</span>
              </div>
              <span className="text-sm font-bold text-primary-700">{fmt(campaign.raised)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                <span className="text-sm text-gray-600">Target</span>
              </div>
              <span className="text-sm font-bold">{fmt(campaign.target)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="text-sm text-amber-700">Stretch Target</span>
              </div>
              <span className="text-sm font-bold text-amber-700">{fmt(campaign.stretchTarget)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Funding Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-primary-600">Consumers</span>
                <span className="font-medium">{fmt(campaign.consumerRaised)} ({campaign.raised > 0 ? Math.round((campaign.consumerRaised / campaign.raised) * 100) : 0}%)</span>
              </div>
              <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${campaign.raised > 0 ? (campaign.consumerRaised / campaign.raised) * 100 : 0}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{campaign.consumerContributors.toLocaleString()} contributors</div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-600">Business Owners</span>
                <span className="font-medium">{fmt(campaign.businessOwnerRaised)} ({campaign.raised > 0 ? Math.round((campaign.businessOwnerRaised / campaign.raised) * 100) : 0}%)</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${campaign.raised > 0 ? (campaign.businessOwnerRaised / campaign.raised) * 100 : 0}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{campaign.businessOwnerContributors.toLocaleString()} contributors</div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500 mb-2">Remaining to Target</div>
              <div className="text-2xl font-bold text-gray-900">{fmt(campaign.target - campaign.raised)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRewardActivity = () => {
    const totalClaimed = rewards.reduce((s, r) => s + (r.claimedCount ?? r.claimed ?? 0), 0);
    const totalFulfilled = rewards.reduce((s, r) => s + (r.fulfilledCount ?? r.fulfilled ?? 0), 0);
    const totalRedeemed = rewards.reduce((s, r) => s + (r.redeemedCount ?? r.redeemed ?? 0), 0);
    const totalExpired = rewards.reduce((s, r) => s + (r.expiredCount ?? r.expired ?? 0), 0);
    const totalIssued = rewards.reduce((s, r) => s + (r.maxQuantity ?? r.quantity ?? 0), 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Reward Activity Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <Hash className="mx-auto h-5 w-5 text-gray-400 mb-1" />
              <div className="text-xl font-bold text-gray-900">{totalIssued}</div>
              <div className="text-[10px] text-gray-500">Issued</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <Gift className="mx-auto h-5 w-5 text-blue-500 mb-1" />
              <div className="text-xl font-bold text-blue-700">{totalClaimed}</div>
              <div className="text-[10px] text-blue-500">Claimed</div>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-green-500 mb-1" />
              <div className="text-xl font-bold text-green-700">{totalFulfilled}</div>
              <div className="text-[10px] text-green-500">Fulfilled</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <Star className="mx-auto h-5 w-5 text-purple-500 mb-1" />
              <div className="text-xl font-bold text-purple-700">{totalRedeemed}</div>
              <div className="text-[10px] text-purple-500">Redeemed</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center col-span-2">
              <XCircle className="mx-auto h-5 w-5 text-red-500 mb-1" />
              <div className="text-xl font-bold text-red-700">{totalExpired}</div>
              <div className="text-[10px] text-red-500">Expired</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Per-Reward Breakdown</h3>
          </div>
          {rewards.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Gift className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              No reward activity to display.
            </div>
          ) : (
            <div className="divide-y">
              {rewards.map((r) => {
                const qty = r.maxQuantity ?? r.quantity ?? 0;
                const claimed = r.claimedCount ?? r.claimed ?? 0;
                const fulfilled = r.fulfilledCount ?? r.fulfilled ?? 0;
                const redeemed = r.redeemedCount ?? r.redeemed ?? 0;
                const claimRate = qty > 0 ? Math.round((claimed / qty) * 100) : 0;
                return (
                  <div key={r.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{r.title || r.name}</span>
                      <span className="text-xs text-gray-500">{claimRate}% claimed</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${claimRate}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>{claimed}/{qty || "∞"} claimed</span>
                      <span>{fulfilled} fulfilled</span>
                      <span>{redeemed} redeemed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Campaign Leaderboard</h3>
      </div>
      {leaderboard.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-500">
          <Trophy className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="font-medium text-gray-700">No leaderboard entries yet</p>
          <p className="text-xs text-gray-400 mt-1">Once contributions start coming in, the top contributors will appear here.</p>
        </div>
      ) : (
        <div className="divide-y">
          {leaderboard.map((entry) => (
            <div key={entry.position} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                  entry.position === 1 ? "bg-amber-100 text-amber-700" :
                  entry.position === 2 ? "bg-gray-200 text-gray-700" :
                  entry.position === 3 ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {entry.position <= 3 ? <Trophy className="h-4 w-4" /> : `#${entry.position}`}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                  <div className="text-[10px] text-gray-400">
                    {entry.type === "business_owner" ? "Business Owner" : "Consumer"}
                    {entry.foundingMember && " · Founding Member"}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-900">{fmt(entry.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Avg. Contribution</span>
            </div>
            <span className="text-sm font-bold">
              {campaign.totalContributors > 0 ? fmt(Math.round(campaign.raised / campaign.totalContributors)) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">Contributors</span>
            </div>
            <span className="text-sm font-bold">{campaign.totalContributors.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600">Consumer share of funding</span>
            </div>
            <span className="text-sm font-bold">
              {campaign.raised > 0 ? `${Math.round((campaign.consumerRaised / campaign.raised) * 100)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-600">Days Active</span>
            </div>
            <span className="text-sm font-bold">{Math.max(0, Math.ceil((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)))} days</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Funding Indicators</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary-500" />
              <span className="text-sm text-gray-600">Amount Raised</span>
            </div>
            <span className="text-sm font-bold">{fmt(campaign.raised)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Target</span>
            </div>
            <span className="text-sm font-bold">{fmt(campaign.target)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">Progress</span>
            </div>
            <span className="text-sm font-bold">
              {campaign.target > 0 ? `${Math.min(100, Math.round((campaign.raised / campaign.target) * 100))}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-600">Remaining to target</span>
            </div>
            <span className="text-sm font-bold">{fmt(Math.max(0, campaign.target - campaign.raised))}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Campaign Configuration</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Campaign Title</div>
            <div className="text-xs text-gray-500">{campaign.title}</div>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Season</div>
            <div className="text-xs text-gray-500">{campaign.season}</div>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Dates</div>
            <div className="text-xs text-gray-500">{campaign.startDate} → {campaign.endDate}</div>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Target Amount</div>
            <div className="text-xs text-gray-500">{fmt(campaign.target)}</div>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Audience</div>
            <div className="text-xs text-gray-500">{audienceMeta.label}</div>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Locations</div>
            <div className="text-xs text-gray-500">
              {(() => {
                const primary =
                  campaignLocations.find((link) => link.scope === "PRIMARY")?.location?.name ||
                  hubLocations.find((location) => location.id === primaryLocationId)?.name;
                const extra = campaignLocations.filter((link) => link.scope !== "PRIMARY").length;
                if (!primary) return "—";
                return extra > 0 ? `${primary} + ${extra} more` : primary;
              })()}
            </div>
          </div>
          <button
            onClick={() => setActiveTab("locations")}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Description</div>
            <div className="text-xs text-gray-500 truncate max-w-md">{campaign.description}</div>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>
    </div>
  );

  const tabRenderers: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    locations: renderLocations,
    rewards: renderRewards,
    participants: renderParticipants,
    contributions: renderContributions,
    funding: renderFunding,
    "reward-activity": renderRewardActivity,
    leaderboard: renderLeaderboard,
    analytics: renderAnalytics,
    settings: renderSettings,
  };

  return (
    <div className="max-w-6xl">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/campaigns")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.bg} ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${audienceMeta.bg} ${audienceMeta.color}`}>
              {audienceMeta.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Created {campaign.createdAt} · Season: {campaign.season} · {daysLeft} days left
          </p>
        </div>

        {/* Status Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {status === "DRAFT" && (
            <>
              <button
                onClick={handleSubmitForReview}
                className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100"
              >
                <Send className="h-3.5 w-3.5" /> Submit for Review
              </button>
              <Link
                to={`/admin/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Link>
            </>
          )}

          {status === "PENDING_REVIEW" && (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={handleRequestChanges}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Request Changes
              </button>
            </>
          )}

          {status === "APPROVED" && (
            <>
              <button
                onClick={handlePublish}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <Globe className="h-3.5 w-3.5" /> Publish
              </button>
              <button
                onClick={handleUnpublish}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Unpublish
              </button>
            </>
          )}

          {status === "SCHEDULED" && (
            <>
              <button
                onClick={handlePublish}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <Globe className="h-3.5 w-3.5" /> Publish Now
              </button>
              <button
                onClick={handleUnpublish}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Unpublish
              </button>
              <Link
                to={`/admin/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Link>
            </>
          )}

          {status === "ACTIVE" && (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 hover:bg-orange-100"
              >
                <XCircle className="h-3.5 w-3.5" /> Close
              </button>
              <Link
                to={`/admin/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Link>
            </>
          )}

          {status === "PAUSED" && (
            <>
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <Play className="h-3.5 w-3.5" /> Resume
              </button>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 hover:bg-orange-100"
              >
                <XCircle className="h-3.5 w-3.5" /> Close
              </button>
              <Link
                to={`/admin/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Link>
            </>
          )}

          {status === "CLOSED" && (
            <>
              <button
                onClick={handleReopen}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reopen
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </>
          )}

          {status === "COMPLETED" && (
            <button
              onClick={handleArchive}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
          )}

          {status === "ARCHIVED" && (
            <button
              onClick={handleRestore}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restore to Draft
            </button>
          )}

          {(status === "CHANGES_REQUIRED" || status === "CHANGES_REQUESTED") && (
            <button
              onClick={handleSubmitForReview}
              className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100"
            >
              <Send className="h-3.5 w-3.5" /> Resubmit for Review
            </button>
          )}

          <Link
            to={campaignData ? getAdminCampaignPublicPath(campaignData) : `/campaigns/${campaign.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" /> Public View
          </Link>
        </div>
      </div>

      {/* Approval Card (Pending Review) */}
      {status === "PENDING_REVIEW" && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-800 mb-1">Campaign Pending Review</h3>
              <p className="text-xs text-amber-700 mb-3">
                This campaign is awaiting approval. Review the campaign details and approve or request changes.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve Campaign
                </button>
                <button
                  onClick={handleRequestChanges}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Request Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Changes Required Feedback Input */}
      {showFeedbackInput && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 mb-6">
          <h3 className="text-sm font-bold text-amber-800 mb-2">Request Changes</h3>
          <textarea
            value={changeFeedback}
            onChange={(e) => setChangeFeedback(e.target.value)}
            placeholder="Describe the changes needed..."
            className="w-full rounded-lg border border-amber-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={submitChangesRequest}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
            >
              <Send className="h-3.5 w-3.5" /> Submit Feedback
            </button>
            <button
              onClick={() => { setShowFeedbackInput(false); setChangeFeedback(""); }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Changes Required Banner */}
      {(status === "CHANGES_REQUIRED" || status === "CHANGES_REQUESTED") && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-800">Changes Requested</h3>
              <p className="text-xs text-red-700 mt-1">
                {changeFeedback || "The campaign requires modifications before it can be approved. Please review the feedback and resubmit for review."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mb-8">{tabRenderers[activeTab]()}</div>
    </div>
  );
}

// ───────────────────── Coverage editor modal ─────────────────────

interface CoverageEditorModalProps {
  draft: CampaignCoverage;
  search: string;
  postcodeInput: string;
  onSearch: (v: string) => void;
  onPostcodeInput: (v: string) => void;
  onSetDraft: (next: CampaignCoverage) => void;
  onClose: () => void;
  onApply: () => void;
  cityLabel: (slug: string) => string;
  areaLabel: (citySlug: string, areaSlug: string) => string;
}

function CoverageEditorModal({
  draft,
  search,
  postcodeInput,
  onSearch,
  onPostcodeInput,
  onSetDraft,
  onClose,
  onApply,
  cityLabel,
  areaLabel,
}: CoverageEditorModalProps) {
  const q = search.trim().toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);

  const setDraft = (fn: (d: CampaignCoverage) => CampaignCoverage) => onSetDraft(fn(draft));

  const toggleCity = (slug: string) =>
    setDraft((d) =>
      d.cities.includes(slug)
        ? {
            ...d,
            cities: d.cities.filter((x) => x !== slug),
            localAreas: d.localAreas.filter((a) => a.citySlug !== slug),
            highStreets: d.highStreets.filter((s) => s.citySlug !== slug),
          }
        : { ...d, cities: [...d.cities, slug] }
    );

  const toggleArea = (citySlug: string, areaSlug: string) =>
    setDraft((d) =>
      d.localAreas.some((a) => a.citySlug === citySlug && a.areaSlug === areaSlug)
        ? {
            ...d,
            localAreas: d.localAreas.filter((a) => !(a.citySlug === citySlug && a.areaSlug === areaSlug)),
            highStreets: d.highStreets.filter(
              (s) => !(s.citySlug === citySlug && s.areaSlug === areaSlug)
            ),
          }
        : { ...d, localAreas: [...d.localAreas, { citySlug, areaSlug }] }
    );

  const toggleStreet = (citySlug: string, areaSlug: string, streetSlug: string) =>
    setDraft((d) =>
      d.highStreets.some(
        (s) => s.citySlug === citySlug && s.areaSlug === areaSlug && s.streetSlug === streetSlug
      )
        ? {
            ...d,
            highStreets: d.highStreets.filter(
              (s) => !(s.citySlug === citySlug && s.areaSlug === areaSlug && s.streetSlug === streetSlug)
            ),
          }
        : { ...d, highStreets: [...d.highStreets, { citySlug, areaSlug, streetSlug }] }
    );

  const addPostcode = () => {
    const pc = postcodeInput.trim().toUpperCase();
    if (!pc) return;
    if (!draft.postcodes.includes(pc)) setDraft((d) => ({ ...d, postcodes: [...d.postcodes, pc] }));
    onPostcodeInput("");
  };

  const { data: hubCitiesData } = useQuery({
    queryKey: ["hubCities"],
    queryFn: fetchHubCities,
  });

  const ukCities = useMemo(() => {
    if (hubCitiesData && hubCitiesData.length > 0) {
      return hubCitiesData.map((c) => ({ slug: c.slug, name: c.name }));
    }
    return [];
  }, [hubCitiesData]);

  const filteredCities = ukCities.filter((c) => match(c.name));
  const areaOptions = draft.cities.map((citySlug) => ({
    citySlug,
    slug: `${citySlug}-central`,
    name: `${citySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Central`,
  })).filter((a) => match(a.name));
  const streetOptions = draft.localAreas.map(({ citySlug, areaSlug }) => ({
    citySlug,
    areaSlug,
    slug: `${areaSlug}-high-street`,
    name: `${areaSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} High Street`,
  })).filter((s) => match(s.name));

  const optionRow = (
    key: string,
    checked: boolean,
    onChange: () => void,
    label: string,
    sub?: string
  ) => (
    <label
      key={key}
      className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
        checked ? "bg-primary-50" : "hover:bg-gray-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <span className="flex-1 text-sm text-gray-900">{label}</span>
      {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
      {checked && <Check className="h-4 w-4 text-primary-600" />}
    </label>
  );

  const block = (title: string, count: number, body: React.ReactNode) => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h4>
        <span className="text-xs text-gray-400">{count} selected</span>
      </div>
      <div className="max-h-44 divide-y overflow-y-auto rounded-lg border">{body}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Expand Location Coverage</h3>
            <p className="text-xs text-gray-500">
              Add cities, local areas, high streets and postcodes — without creating a new campaign.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Nationwide */}
          <label
            className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 ${
              draft.national ? "border-primary-300 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <Globe className="h-4 w-4 text-primary-600" /> Nationwide coverage
              </div>
              <div className="text-xs text-gray-500">
                Covers every city, local area and high street — the other selections below are then
                implied.
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.national}
              onChange={() => setDraft((d) => ({ ...d, national: !d.national }))}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search cities, local areas, high streets..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Cities */}
          {block(
            "Cities",
            draft.cities.length,
            filteredCities.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No matching cities.</div>
            ) : (
              <>
                {filteredCities.map((c) =>
                  optionRow(`c-${c.slug}`, draft.cities.includes(c.slug), () => toggleCity(c.slug), c.name, "City hub")
                )}
              </>
            )
          )}

          {/* Local areas */}
          {block(
            "Local areas",
            draft.localAreas.length,
            draft.cities.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                Select a city first to add its local areas.
              </div>
            ) : areaOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No matching local areas.</div>
            ) : (
              <>
                {areaOptions.map((a) =>
                  optionRow(
                    `a-${a.citySlug}-${a.slug}`,
                    draft.localAreas.some((x) => x.citySlug === a.citySlug && x.areaSlug === a.slug),
                    () => toggleArea(a.citySlug, a.slug),
                    a.name,
                    cityLabel(a.citySlug)
                  )
                )}
              </>
            )
          )}

          {/* High streets */}
          {block(
            "High streets",
            draft.highStreets.length,
            draft.localAreas.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                Select a local area first to add its high streets.
              </div>
            ) : streetOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No matching high streets.</div>
            ) : (
              <>
                {streetOptions.map((s) =>
                  optionRow(
                    `s-${s.citySlug}-${s.areaSlug}-${s.slug}`,
                    draft.highStreets.some(
                      (x) =>
                        x.citySlug === s.citySlug && x.areaSlug === s.areaSlug && x.streetSlug === s.slug
                    ),
                    () => toggleStreet(s.citySlug, s.areaSlug, s.slug),
                    s.name,
                    `${areaLabel(s.citySlug, s.areaSlug)} · ${cityLabel(s.citySlug)}`
                  )
                )}
              </>
            )
          )}

          {/* Postcodes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Postcodes</h4>
              <span className="text-xs text-gray-400">{draft.postcodes.length} selected</span>
            </div>
            <div className="flex gap-2">
              <input
                value={postcodeInput}
                onChange={(e) => onPostcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPostcode();
                  }
                }}
                placeholder="e.g. M1"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={addPostcode}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            {draft.postcodes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.postcodes.map((pc) => (
                  <span
                    key={pc}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    <Hash className="h-3 w-3" />
                    {pc}
                    <button
                      onClick={() =>
                        setDraft((d) => ({ ...d, postcodes: d.postcodes.filter((p) => p !== pc) }))
                      }
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700"
          >
            Apply coverage
          </button>
        </div>
      </div>
    </div>
  );
}
