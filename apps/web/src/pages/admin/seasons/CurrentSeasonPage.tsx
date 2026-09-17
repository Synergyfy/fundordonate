// =============================================================================
// Current Season Page
// Operational view of the active season with 8 tabs.
// =============================================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { seasonApi, type Season, type SeasonMetrics, type SeasonCityActivity } from "@/services/season.service";
import {
  Calendar, TrendingUp, Users, MapPin, Trophy, Settings, Activity,
  ChevronRight, AlertTriangle, Target, BarChart3,
} from "lucide-react";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

type TabId = "overview" | "activation" | "campaigns" | "participation" | "funding" | "engagement" | "activity" | "settings";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "activation", label: "Activation", icon: <MapPin className="h-4 w-4" /> },
  { id: "campaigns", label: "Campaigns", icon: <Target className="h-4 w-4" /> },
  { id: "participation", label: "Participation", icon: <Users className="h-4 w-4" /> },
  { id: "funding", label: "Funding", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "engagement", label: "Engagement", icon: <Trophy className="h-4 w-4" /> },
  { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

// =============================================================================
// Overview Tab
// =============================================================================

function OverviewTab({ season, metrics }: { season: Season; metrics: SeasonMetrics | null }) {
  const progress = metrics?.progressPercent || 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(season.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      {/* Primary Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Seasonal Target", value: formatCurrency(season.overallTarget) },
          { label: "Amount Raised", value: formatCurrency(season.totalRaised) },
          { label: "Remaining", value: formatCurrency(season.overallTarget - season.totalRaised) },
          { label: "Days Remaining", value: daysLeft.toString() },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white border p-4">
            <div className="text-xs text-gray-400 mb-1">{item.label}</div>
            <div className="text-xl font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-white border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Seasonal Progress</h3>
          <span className="text-sm font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Contributions", value: (metrics?.totalCampaigns ?? 0).toLocaleString(), icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
          { label: "Active Campaigns", value: String(metrics?.activeCampaigns ?? 0), icon: <Target className="h-4 w-4 text-blue-500" /> },
          { label: "Participants", value: (metrics?.totalParticipants ?? 0).toLocaleString(), icon: <Users className="h-4 w-4 text-purple-500" /> },
          { label: "Cities Active", value: `${metrics?.citiesActive ?? 0}/${metrics?.citiesTargeted ?? 0}`, icon: <MapPin className="h-4 w-4 text-amber-500" /> },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white border p-4 flex items-center gap-3">
            {item.icon}
            <div>
              <div className="text-xs text-gray-400">{item.label}</div>
              <div className="text-lg font-bold text-gray-900">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attention Required */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-bold text-amber-800">Attention Required</h3>
        </div>
        <div className="space-y-2">
          {[
            { text: "3 campaigns still active past planned end date", severity: "high" },
            { text: "Leeds activation below expected threshold", severity: "medium" },
            { text: "£2.8M surplus awaiting allocation decision", severity: "medium" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${item.severity === "high" ? "bg-red-500" : "bg-amber-500"}`} />
              <span className="text-amber-700">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Activation Tab
// =============================================================================

function ActivationTab({ season, cityActivities }: { season: Season; cityActivities: SeasonCityActivity[] }) {
  return (
    <div className="space-y-6">
      {/* National */}
      <div className="rounded-xl bg-white border p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🇬🇧</span>
          <h3 className="text-sm font-bold text-gray-900">National Hub</h3>
          <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            season.activationScope.nationalEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {season.activationScope.nationalEnabled ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Cities */}
      <div className="rounded-xl bg-white border p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Cities</h3>
        <div className="space-y-3">
          {cityActivities.map((city) => {
            const progress = city.target > 0 ? Math.round((city.raised / city.target) * 100) : 0;
            return (
              <div key={city.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {city.cityName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{city.cityName}</span>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      city.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {city.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500">{(city.participants ?? 0).toLocaleString()} participants</span>
                    <span className="text-xs text-gray-500">{(city.contributions ?? 0).toLocaleString()} contributions</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(city.raised)}</div>
                  <div className="text-xs text-gray-400">of {formatCurrency(city.target)}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Campaigns Tab (placeholder)
// =============================================================================

function CampaignsTab({ season }: { season: Season }) {
  return (
    <div className="rounded-xl bg-white border p-8 text-center">
      <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-gray-900 mb-1">Seasonal Campaigns</h3>
      <p className="text-sm text-gray-500">
        Campaign view for {season.name} — filtering by season context.
      </p>
    </div>
  );
}

// =============================================================================
// Participation Tab
// =============================================================================

function ParticipationTab({ season }: { season: Season }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Consumers", value: season.totalConsumers ?? 0, color: "text-blue-600 bg-blue-50" },
          { label: "Business Owners", value: season.totalBusinessOwners ?? 0, color: "text-purple-600 bg-purple-50" },
          { label: "Backers", value: season.totalBackers ?? 0, color: "text-green-600 bg-green-50" },
          { label: "Founding Members", value: season.totalFoundingMembers ?? 0, color: "text-amber-600 bg-amber-50" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
            <div className="text-xs opacity-70 mb-1">{item.label}</div>
            <div className="text-2xl font-bold">{(item.value as number).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Funding Tab
// =============================================================================

function FundingTab({ season, metrics }: { season: Season; metrics: SeasonMetrics | null }) {
  const progress = metrics?.progressPercent || 0;
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white border p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Seasonal Funding</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><div className="text-xs text-gray-400">Target</div><div className="text-lg font-bold">{formatCurrency(season.overallTarget)}</div></div>
          <div><div className="text-xs text-gray-400">Raised</div><div className="text-lg font-bold">{formatCurrency(season.totalRaised)}</div></div>
          <div><div className="text-xs text-gray-400">Progress</div><div className="text-lg font-bold">{progress}%</div></div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Engagement Tab
// =============================================================================

function EngagementTab({ season }: { season: Season }) {
  return (
    <div className="rounded-xl bg-white border p-8 text-center">
      <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-gray-900 mb-1">Seasonal Engagement</h3>
      <p className="text-sm text-gray-500">Rewards, leaderboards, and incentives for {season.name}.</p>
    </div>
  );
}

// =============================================================================
// Activity Tab
// =============================================================================

function ActivityTab(_: { season: Season }) {
  const events = [
    { time: "2 hours ago", text: "London campaign reached 50% milestone", type: "milestone" },
    { time: "5 hours ago", text: "Manchester: 100 new backers this week", type: "participation" },
    { time: "1 day ago", text: "Birmingham high street activation completed", type: "activation" },
    { time: "2 days ago", text: "Leeds campaign target adjusted", type: "config" },
    { time: "3 days ago", text: "Oxford Street business onboarding batch", type: "business" },
  ];
  return (
    <div className="rounded-xl bg-white border p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Operational Feed</h3>
      <div className="space-y-4">
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-primary-400 flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-900">{e.text}</div>
              <div className="text-xs text-gray-400 mt-0.5">{e.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Settings Tab
// =============================================================================

function SettingsTab(_: { season: Season }) {
  return (
    <div className="space-y-4">
      {[
        { group: "Basic", items: ["Name", "Description", "Dates"] },
        { group: "Activation Scope", items: ["Locations", "Businesses"] },
        { group: "Objectives", items: ["Targets", "Activation goals"] },
        { group: "Participation", items: ["Backer opportunities", "Founding Member opportunities"] },
        { group: "Engagement", items: ["Rewards", "Incentives", "Leaderboards"] },
        { group: "Operations", items: ["Spillover", "Surplus handling"] },
        { group: "Communications", items: ["Seasonal content connections"] },
      ].map((section) => (
        <div key={section.group} className="rounded-xl bg-white border p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-2">{section.group}</h3>
          <div className="flex flex-wrap gap-2">
            {section.items.map((item) => (
              <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function CurrentSeasonPage() {
  const [searchParams] = useSearchParams();
  const [season, setSeason] = useState<Season | null>(null);
  const [metrics, setMetrics] = useState<SeasonMetrics | null>(null);
  const [cityActivities, setCityActivities] = useState<SeasonCityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const seasonId = searchParams.get("id");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const s = seasonId ? await seasonApi.getById(seasonId) : await seasonApi.getCurrent();
      setSeason(s);
      if (s) {
        const [m, c] = await Promise.all([
          seasonApi.getMetrics(s.id),
          seasonApi.getCityActivities(s.id),
        ]);
        setMetrics(m);
        setCityActivities(c);
      }
      setLoading(false);
    };
    load();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">No Active Season</h2>
        <p className="text-sm text-gray-500">There is no currently active season.</p>
      </div>
    );
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(season.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{season.name}</h1>
          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">Active</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            {" — "}
            {new Date(season.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="font-medium text-amber-600">{daysLeft} days remaining</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab season={season} metrics={metrics} />}
      {activeTab === "activation" && <ActivationTab season={season} cityActivities={cityActivities} />}
      {activeTab === "campaigns" && <CampaignsTab season={season} />}
      {activeTab === "participation" && <ParticipationTab season={season} />}
      {activeTab === "funding" && <FundingTab season={season} metrics={metrics} />}
      {activeTab === "engagement" && <EngagementTab season={season} />}
      {activeTab === "activity" && <ActivityTab season={season} />}
      {activeTab === "settings" && <SettingsTab season={season} />}
    </div>
  );
}
