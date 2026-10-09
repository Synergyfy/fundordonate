// =============================================================================
// Admin Campaign Detail Page – Operational Dashboard
// Full campaign management with approval flow, publish logic, and 10 tabs.
// =============================================================================

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Gift, Pause, Play, Archive, Eye,
  Send, CheckCircle2, AlertTriangle, XCircle, Calendar,
  Users, BarChart3, Settings, Trophy, Target, TrendingUp,
  Clock, Star, Edit3, Globe, Plus, Search,
  Coins, Award, Hash, RefreshCw, X, Check,
} from "lucide-react";
import {
  getAdminCampaignById,
  getAdminCampaignPublicPath,
  updateAdminCampaignCoverage,
  updateAdminCampaignStatus,
  applyCampaignLifecycleAction,
  summarizeCoverage,
  type AdminCampaignStatus,
  type CampaignCoverage,
  type CampaignLifecycleAction,
} from "@/data/adminCampaigns";
import { syncBusinessCampaign } from "@/data/campaignTemplateStore";
import { getCities } from "@/data/ukHubData";
import { getLocalAreasForCity, getHighStreetsForArea } from "@/data/highStreetData";

// ───────────────────── Types ─────────────────────

type CampaignStatus =
  | "DRAFT"
  | "CHANGES_REQUIRED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CLOSED"
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

// ───────────────────── Demo Data ─────────────────────

const DEMO_CAMPAIGN = {
  id: "camp-1",
  title: "Manchester Autumn Community Campaign",
  description:
    "A community-driven campaign to support local businesses and residents across Manchester during the Autumn 2026 season. This campaign brings together business owners and consumers to fund local hub improvements, high street revitalisation, and community programmes.",
  season: "Autumn 2026",
  audience: "both" as const,
  hierarchyLevel: "city",
  locations: [
    { name: "Manchester", area: "Greater Manchester", streetTrees: 1240 },
    { name: "City Centre", area: "Central Manchester", streetTrees: 380 },
    { name: "Salford", area: "Greater Manchester", streetTrees: 860 },
  ],
  target: 20000000,
  raised: 12500000,
  startingAmount: 5000000,
  stretchTarget: 25000000,
  startDate: "2026-09-01",
  endDate: "2026-11-30",
  totalContributors: 3420,
  consumerContributors: 2100,
  businessOwnerContributors: 1320,
  consumerRaised: 7800000,
  businessOwnerRaised: 4700000,
  backers: 2800,
  foundingMembers: 620,
  rewardsGranted: 1850,
  leaderboardPosition: 12,
  createdAt: "2026-08-15",
  updatedAt: "2026-09-08",
};

const DEMO_REWARDS = [
  { id: "r1", name: "Community Supporter", threshold: 1000, items: ["Digital Badge", "Newsletter"], quantity: 500, claimed: 342, fulfilled: 280, redeemed: 210, expired: 12, status: "active" },
  { id: "r2", name: "Local Champion", threshold: 5000, items: ["T-Shirt", "Sticker Pack", "Certificate"], quantity: 200, claimed: 156, fulfilled: 120, redeemed: 95, expired: 5, status: "active" },
  { id: "r3", name: "Founding Patron", threshold: 10000, items: ["Framed Certificate", "Annual Dinner Invite", "Name on Wall"], quantity: 100, claimed: 87, fulfilled: 60, redeemed: 45, expired: 3, status: "active" },
  { id: "r4", name: "Platinum Patron", threshold: 25000, items: ["Custom Plaque", "VIP Event Access", "Feature Article"], quantity: 25, claimed: 18, fulfilled: 10, redeemed: 8, expired: 1, status: "active" },
  { id: "r5", name: "Legacy Partner", threshold: 50000, items: ["Permanent Plaque", "Board Advisory Role", "Annual Report Feature"], quantity: 10, claimed: 5, fulfilled: 2, redeemed: 1, expired: 0, status: "active" },
];

const DEMO_RECENT_CONTRIBUTIONS = [
  { id: "1", name: "Sarah's Bakery", type: "business_owner", amount: 5000, date: "2026-09-08T14:30:00Z", foundingMember: true },
  { id: "2", name: "James Wilson", type: "consumer", amount: 2500, date: "2026-09-08T12:15:00Z", foundingMember: false },
  { id: "3", name: "Tech Hub Manchester", type: "business_owner", amount: 10000, date: "2026-09-08T10:00:00Z", foundingMember: true },
  { id: "4", name: "Emily Chen", type: "consumer", amount: 1500, date: "2026-09-07T18:45:00Z", foundingMember: false },
  { id: "5", name: "Green Valley Cafe", type: "business_owner", amount: 3000, date: "2026-09-07T16:20:00Z", foundingMember: false },
  { id: "6", name: "Michael Brown", type: "consumer", amount: 750, date: "2026-09-07T14:10:00Z", foundingMember: false },
  { id: "7", name: "Manchester Books Ltd", type: "business_owner", amount: 2000, date: "2026-09-07T11:30:00Z", foundingMember: false },
  { id: "8", name: "Lisa Taylor", type: "consumer", amount: 1000, date: "2026-09-06T20:00:00Z", foundingMember: false },
];

const DEMO_LEADERBOARD = [
  { position: 1, name: "Tech Hub Manchester", type: "business_owner", amount: 25000, foundingMember: true },
  { position: 2, name: "Sarah's Bakery", type: "business_owner", amount: 18000, foundingMember: true },
  { position: 3, name: "James Wilson", type: "consumer", amount: 15000, foundingMember: true },
  { position: 4, name: "Green Valley Cafe", type: "business_owner", amount: 12000, foundingMember: false },
  { position: 5, name: "Emily Chen", type: "consumer", amount: 10000, foundingMember: false },
  { position: 6, name: "Michael Brown", type: "consumer", amount: 8500, foundingMember: false },
  { position: 7, name: "Manchester Books Ltd", type: "business_owner", amount: 7200, foundingMember: false },
  { position: 8, name: "Lisa Taylor", type: "consumer", amount: 6000, foundingMember: false },
];

const DEMO_PARTICIPANTS = [
  { id: "p1", name: "Sarah's Bakery", type: "business_owner", joinedDate: "2026-08-20", contributions: 3, totalAmount: 12000 },
  { id: "p2", name: "James Wilson", type: "consumer", joinedDate: "2026-08-22", contributions: 5, totalAmount: 7500 },
  { id: "p3", name: "Tech Hub Manchester", type: "business_owner", joinedDate: "2026-08-18", contributions: 2, totalAmount: 35000 },
  { id: "p4", name: "Emily Chen", type: "consumer", joinedDate: "2026-08-25", contributions: 4, totalAmount: 4200 },
  { id: "p5", name: "Green Valley Cafe", type: "business_owner", joinedDate: "2026-08-21", contributions: 6, totalAmount: 15000 },
];

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
  CHANGES_REQUIRED: { label: "Changes Required", color: "text-orange-700", bg: "bg-orange-100" },
  PENDING_REVIEW: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-100" },
  APPROVED: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-100" },
  SCHEDULED: { label: "Scheduled", color: "text-blue-700", bg: "bg-blue-100" },
  ACTIVE: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
  PAUSED: { label: "Paused", color: "text-amber-700", bg: "bg-amber-100" },
  COMPLETED: { label: "Completed", color: "text-purple-700", bg: "bg-purple-100" },
  CLOSED: { label: "Closed", color: "text-orange-700", bg: "bg-orange-100" },
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

  const found = id ? getAdminCampaignById(id) : undefined;

  const STATUS_BY_KEY: Record<AdminCampaignStatus, CampaignStatus> = {
    draft: "DRAFT",
    changes_required: "CHANGES_REQUIRED",
    pending_review: "PENDING_REVIEW",
    approved: "APPROVED",
    scheduled: "SCHEDULED",
    active: "ACTIVE",
    paused: "PAUSED",
    completed: "COMPLETED",
    closed: "CLOSED",
    archived: "ARCHIVED",
  };

  const consumerSplit = found ? Math.round(found.raisedAmount * 0.6) : 0;
  const contributorSplit = found ? Math.round(found.backers * 0.6) : 0;

  const base = found
    ? {
        ...DEMO_CAMPAIGN,
        id: found.id,
        title: found.title,
        description: found.description,
        season: found.season,
        audience: found.audience,
        hierarchyLevel: found.scope,
        locations: [
          { name: found.cityName, area: `${found.areaName}, ${found.cityName}`, streetTrees: 0 },
        ],
        target: found.targetAmount,
        raised: found.raisedAmount,
        startingAmount: 0,
        stretchTarget: Math.round(found.targetAmount * 1.25),
        startDate: found.startDate || "2026-10-01",
        endDate: found.endDate || "2026-12-31",
        totalContributors: found.backers,
        consumerContributors: contributorSplit,
        businessOwnerContributors: found.backers - contributorSplit,
        consumerRaised: consumerSplit,
        businessOwnerRaised: found.raisedAmount - consumerSplit,
        backers: found.backers,
        foundingMembers: Math.round(found.backers * 0.2),
        rewardsGranted: Math.round(found.backers * 0.5),
        createdAt: found.createdAt,
        updatedAt: found.createdAt,
      }
    : DEMO_CAMPAIGN;

  const [status, setStatus] = useState<CampaignStatus>(
    found ? STATUS_BY_KEY[found.status] : "ACTIVE"
  );
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [changeFeedback, setChangeFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [coverage, setCoverage] = useState<CampaignCoverage | null>(found?.coverage ?? null);
  const [draftCoverage, setDraftCoverage] = useState<CampaignCoverage | null>(null);
  const [coverageSearch, setCoverageSearch] = useState("");
  const [postcodeInput, setPostcodeInput] = useState("");
  const [locationToast, setLocationToast] = useState(false);

  if (id && !found) {
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
          <p className="mt-2 text-sm text-gray-500">The campaign "{id}" could not be found.</p>
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

  // ── Status actions (persisted to the admin campaigns store) ──

  const applyAction = (action: CampaignLifecycleAction, note?: string) => {
    if (!found) return;
    const next = applyCampaignLifecycleAction(found, action);
    if (!next) return;
    updateAdminCampaignStatus(found.id, next);
    setStatus(STATUS_BY_KEY[next]);
    if (found.businessCampaignId) {
      syncBusinessCampaign(found.businessCampaignId, next, note);
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
    const cov = coverage;
    const tc = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const cityLabel = (slug: string) => getCities().find((c) => c.slug === slug)?.name ?? tc(slug);
    const areaLabel = (citySlug: string, areaSlug: string) =>
      getLocalAreasForCity(citySlug).find((a) => a.slug === areaSlug)?.name ?? tc(areaSlug);
    const streetLabel = (citySlug: string, areaSlug: string, streetSlug: string) =>
      getHighStreetsForArea(citySlug, areaSlug).find((s) => s.slug === streetSlug)?.name ?? tc(streetSlug);

    if (!cov || !found) {
      return (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          Location coverage is unavailable for this campaign.
        </div>
      );
    }

    const commitCoverage = (next: CampaignCoverage) => {
      const updated = updateAdminCampaignCoverage(found.id, next);
      if (updated) setCoverage(updated.coverage);
      setLocationToast(true);
      setTimeout(() => setLocationToast(false), 2000);
    };

    const removeCity = (slug: string) =>
      commitCoverage({
        ...cov,
        cities: cov.cities.filter((x) => x !== slug),
        localAreas: cov.localAreas.filter((a) => a.citySlug !== slug),
        highStreets: cov.highStreets.filter((s) => s.citySlug !== slug),
      });
    const removeArea = (citySlug: string, areaSlug: string) =>
      commitCoverage({
        ...cov,
        localAreas: cov.localAreas.filter((a) => !(a.citySlug === citySlug && a.areaSlug === areaSlug)),
        highStreets: cov.highStreets.filter((s) => !(s.citySlug === citySlug && s.areaSlug === areaSlug)),
      });
    const removeStreet = (citySlug: string, areaSlug: string, streetSlug: string) =>
      commitCoverage({
        ...cov,
        highStreets: cov.highStreets.filter(
          (s) => !(s.citySlug === citySlug && s.areaSlug === areaSlug && s.streetSlug === streetSlug)
        ),
      });
    const removePostcode = (pc: string) =>
      commitCoverage({ ...cov, postcodes: cov.postcodes.filter((p) => p !== pc) });

    const openEditor = () => {
      setDraftCoverage({
        national: cov.national,
        cities: [...cov.cities],
        localAreas: cov.localAreas.map((a) => ({ ...a })),
        highStreets: cov.highStreets.map((s) => ({ ...s })),
        postcodes: [...cov.postcodes],
      });
      setCoverageSearch("");
      setPostcodeInput("");
      setShowLocationModal(true);
    };

    const chip = (
      key: string,
      label: string,
      sub: string,
      onRemove: (() => void) | undefined,
      icon: React.ReactNode = <MapPin className="h-4 w-4 text-primary-600" />
    ) => (
      <div key={key} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100">{icon}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-900">{label}</div>
            <div className="truncate text-xs text-gray-500">{sub}</div>
          </div>
        </div>
        {onRemove ? (
          <button
            onClick={onRemove}
            title="Remove from coverage"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Primary
          </span>
        )}
      </div>
    );

    const section = (title: string, count: number, rows: React.ReactNode) => (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h4>
          <span className="text-xs text-gray-400">{count}</span>
        </div>
        <div className="divide-y">
          {count === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">Nothing covered at this level yet.</div>
          ) : (
            rows
          )}
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        {/* Coverage summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <MapPin className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Location Coverage</h3>
              <p className="text-xs text-gray-500">{summarizeCoverage({ ...found, coverage: cov })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cov.national && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Globe className="h-3.5 w-3.5" /> Nationwide
              </span>
            )}
            <button
              onClick={openEditor}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <MapPin className="h-3.5 w-3.5" /> Expand coverage
            </button>
          </div>
        </div>

        {/* Cities */}
        {section(
          "Cities covered",
          cov.cities.length,
          <>
            {cov.cities.map((slug) =>
              chip(
                `city-${slug}`,
                cityLabel(slug),
                "City hub",
                slug === found.citySlug ? undefined : () => removeCity(slug),
                <Globe className="h-4 w-4 text-primary-600" />
              )
            )}
          </>
        )}

        {/* Local areas */}
        {section(
          "Local areas",
          cov.localAreas.length,
          <>
            {cov.localAreas.map((a) =>
              chip(
                `area-${a.citySlug}-${a.areaSlug}`,
                areaLabel(a.citySlug, a.areaSlug),
                `${cityLabel(a.citySlug)} · local area`,
                a.citySlug === found.citySlug && a.areaSlug === found.areaSlug
                  ? undefined
                  : () => removeArea(a.citySlug, a.areaSlug)
              )
            )}
          </>
        )}

        {/* High streets */}
        {section(
          "High streets",
          cov.highStreets.length,
          <>
            {cov.highStreets.map((s) =>
              chip(
                `street-${s.citySlug}-${s.areaSlug}-${s.streetSlug}`,
                streetLabel(s.citySlug, s.areaSlug, s.streetSlug),
                `${areaLabel(s.citySlug, s.areaSlug)} · ${cityLabel(s.citySlug)}`,
                s.citySlug === found.citySlug &&
                s.areaSlug === found.areaSlug &&
                s.streetSlug === found.streetSlug
                  ? undefined
                  : () => removeStreet(s.citySlug, s.areaSlug, s.streetSlug)
              )
            )}
          </>
        )}

        {/* Postcodes */}
        {section(
          "Postcodes",
          cov.postcodes.length,
          <>
            {cov.postcodes.map((pc) =>
              chip(
                `pc-${pc}`,
                pc,
                "Postcode district",
                () => removePostcode(pc),
                <Hash className="h-4 w-4 text-primary-600" />
              )
            )}
          </>
        )}

        {/* Location Toast */}
        {locationToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            Location coverage updated
          </div>
        )}

        {/* Expand Coverage Modal */}
        {showLocationModal && draftCoverage && (
          <CoverageEditorModal
            draft={draftCoverage}
            search={coverageSearch}
            postcodeInput={postcodeInput}
            onSearch={setCoverageSearch}
            onPostcodeInput={setPostcodeInput}
            onSetDraft={(next) => setDraftCoverage(next)}
            onClose={() => setShowLocationModal(false)}
            onApply={() => {
              commitCoverage(draftCoverage);
              setShowLocationModal(false);
            }}
            cityLabel={cityLabel}
            areaLabel={areaLabel}
          />
        )}
      </div>
    );
  };

  const renderRewards = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Rewards ({DEMO_REWARDS.length})</h3>
        <button className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
          <Gift className="h-3.5 w-3.5" /> Add Reward
        </button>
      </div>
      <div className="divide-y">
        {DEMO_REWARDS.map((reward) => (
          <div key={reward.id} className="px-4 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                <div className="text-[10px] text-gray-400">Threshold: {fmt(reward.threshold)}</div>
              </div>
              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700">
                {reward.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {reward.items.map((item, i) => (
                <span key={i} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  {item}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded bg-gray-50 p-2">
                <div className="text-xs font-bold text-gray-900">{reward.quantity}</div>
                <div className="text-[10px] text-gray-400">Total</div>
              </div>
              <div className="rounded bg-blue-50 p-2">
                <div className="text-xs font-bold text-blue-700">{reward.claimed}</div>
                <div className="text-[10px] text-blue-500">Claimed</div>
              </div>
              <div className="rounded bg-green-50 p-2">
                <div className="text-xs font-bold text-green-700">{reward.fulfilled}</div>
                <div className="text-[10px] text-green-500">Fulfilled</div>
              </div>
              <div className="rounded bg-purple-50 p-2">
                <div className="text-xs font-bold text-purple-700">{reward.redeemed}</div>
                <div className="text-[10px] text-purple-500">Redeemed</div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
        <div className="divide-y">
          {DEMO_PARTICIPANTS.map((p) => (
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
      </div>
    </div>
  );

  const renderContributions = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Recent Contributions</h3>
      </div>
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
            {DEMO_RECENT_CONTRIBUTIONS.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      c.type === "business_owner" ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
                    }`}>
                      {c.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      {c.foundingMember && (
                        <span className="text-[10px] text-amber-600 font-medium">Founding Member</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.type === "business_owner" ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
                  }`}>
                    {c.type === "business_owner" ? "Business" : "Consumer"}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">{fmt(c.amount)}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    const totalClaimed = DEMO_REWARDS.reduce((s, r) => s + r.claimed, 0);
    const totalFulfilled = DEMO_REWARDS.reduce((s, r) => s + r.fulfilled, 0);
    const totalRedeemed = DEMO_REWARDS.reduce((s, r) => s + r.redeemed, 0);
    const totalExpired = DEMO_REWARDS.reduce((s, r) => s + r.expired, 0);
    const totalIssued = DEMO_REWARDS.reduce((s, r) => s + r.quantity, 0);

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
          <div className="divide-y">
            {DEMO_REWARDS.map((r) => {
              const claimRate = r.quantity > 0 ? Math.round((r.claimed / r.quantity) * 100) : 0;
              return (
                <div key={r.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{r.name}</span>
                    <span className="text-xs text-gray-500">{claimRate}% claimed</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${claimRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{r.claimed}/{r.quantity} claimed</span>
                    <span>{r.fulfilled} fulfilled</span>
                    <span>{r.redeemed} redeemed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Campaign Leaderboard</h3>
      </div>
      <div className="divide-y">
        {DEMO_LEADERBOARD.map((entry) => (
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
            <span className="text-sm font-bold">{fmt(Math.round(campaign.raised / campaign.totalContributors))}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">Conversion Rate</span>
            </div>
            <span className="text-sm font-bold">12.4%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600">Retention Rate</span>
            </div>
            <span className="text-sm font-bold">68%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-600">Avg. Time to Fund</span>
            </div>
            <span className="text-sm font-bold">14 days</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Growth Indicators</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary-500" />
              <span className="text-sm text-gray-600">Page Views</span>
            </div>
            <span className="text-sm font-bold">24,830</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Unique Visitors</span>
            </div>
            <span className="text-sm font-bold">8,420</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">Share Rate</span>
            </div>
            <span className="text-sm font-bold">5.2%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-600">Days Active</span>
            </div>
            <span className="text-sm font-bold">{Math.ceil((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
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
              {found && coverage ? summarizeCoverage({ ...found, coverage }) : "—"}
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

          {status === "CHANGES_REQUIRED" && (
            <button
              onClick={handleSubmitForReview}
              className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100"
            >
              <Send className="h-3.5 w-3.5" /> Resubmit for Review
            </button>
          )}

          <Link
            to={found ? getAdminCampaignPublicPath(found) : `/campaigns/${campaign.id}`}
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
      {status === "CHANGES_REQUIRED" && (
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

  const filteredCities = getCities().filter((c) => match(c.name));
  const areaOptions = draft.cities.flatMap((citySlug) =>
    getLocalAreasForCity(citySlug)
      .filter((a) => match(a.name))
      .map((a) => ({ citySlug, slug: a.slug, name: a.name }))
  );
  const streetOptions = draft.localAreas.flatMap(({ citySlug, areaSlug }) =>
    getHighStreetsForArea(citySlug, areaSlug)
      .filter((s) => match(s.name))
      .map((s) => ({ citySlug, areaSlug, slug: s.slug, name: s.name }))
  );

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
