// =============================================================================
// All Seasons Page
// Master seasonal management with list, filters, search, metrics, and actions.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { seasonApi, type Season, type SeasonStatus } from "@/services/season.service";
import {
  Plus, Search, Calendar, TrendingUp,
  MoreVertical, Copy, Edit, Eye, Trash2, Play, Archive,
  CheckCircle, Clock, AlertCircle, FileText, X,
} from "lucide-react";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  SCHEDULED: { label: "Scheduled", color: "text-blue-600", bg: "bg-blue-100" },
  ACTIVE: { label: "Active", color: "text-green-600", bg: "bg-green-100" },
  CLOSING: { label: "Closing", color: "text-amber-600", bg: "bg-amber-100" },
  REVIEW: { label: "Review", color: "text-purple-600", bg: "bg-purple-100" },
  COMPLETED: { label: "Completed", color: "text-primary-600", bg: "bg-primary-100" },
  ARCHIVED: { label: "Archived", color: "text-gray-400", bg: "bg-gray-50" },
};

function getDaysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getDaysBetween(start: string, end: string): number {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

// =============================================================================
// Summary Metrics
// =============================================================================

function SeasonSummaryMetrics({ seasons }: { seasons: Season[] }) {
  const counts = useMemo(() => {
    const c = { active: 0, upcoming: 0, draft: 0, completed: 0, totalRaised: 0 };
    for (const s of seasons) {
      if (s.status === "ACTIVE") c.active++;
      else if (s.status === "SCHEDULED") c.upcoming++;
      else if (s.status === "DRAFT") c.draft++;
      else if (s.status === "COMPLETED") c.completed++;
      c.totalRaised += s.totalRaised;
    }
    return c;
  }, [seasons]);

  const cards = [
    { label: "Active", value: counts.active, icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "border-green-200 bg-green-50" },
    { label: "Upcoming", value: counts.upcoming, icon: <Clock className="h-5 w-5 text-blue-500" />, color: "border-blue-200 bg-blue-50" },
    { label: "Draft", value: counts.draft, icon: <FileText className="h-5 w-5 text-gray-500" />, color: "border-gray-200 bg-gray-50" },
    { label: "Completed", value: counts.completed, icon: <CheckCircle className="h-5 w-5 text-primary-500" />, color: "border-primary-200 bg-primary-50" },
    { label: "Total Raised", value: formatCurrency(counts.totalRaised), icon: <TrendingUp className="h-5 w-5 text-amber-500" />, color: "border-amber-200 bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
          <div className="flex items-center gap-2 mb-1">
            {card.icon}
            <span className="text-xs font-medium text-gray-500">{card.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Season Card Row
// =============================================================================

function SeasonRow({
  season,
  onAction,
}: {
  season: Season;
  onAction: (seasonId: string, action: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[season.status] ?? { label: season.status, color: "text-gray-700", bg: "bg-gray-100" };
  const progress = season.overallTarget > 0 ? Math.round((season.totalRaised / season.overallTarget) * 100) : 0;
  const daysLeft = season.status === "ACTIVE" ? getDaysRemaining(season.endDate) : null;
  const duration = getDaysBetween(season.startDate, season.endDate);

  const getActions = () => {
    switch (season.status) {
      case "DRAFT":
        return [
          { label: "Edit", icon: <Edit className="h-4 w-4" />, action: "EDIT" },
          { label: "Duplicate", icon: <Copy className="h-4 w-4" />, action: "DUPLICATE" },
          { label: "Delete", icon: <Trash2 className="h-4 w-4 text-red-500" />, action: "DELETE" },
        ];
      case "SCHEDULED":
        return [
          { label: "View", icon: <Eye className="h-4 w-4" />, action: "VIEW" },
          { label: "Edit", icon: <Edit className="h-4 w-4" />, action: "EDIT" },
          { label: "Activate", icon: <Play className="h-4 w-4 text-green-500" />, action: "ACTIVATE" },
          { label: "Duplicate", icon: <Copy className="h-4 w-4" />, action: "DUPLICATE" },
        ];
      case "ACTIVE":
        return [
          { label: "Open Workspace", icon: <Eye className="h-4 w-4" />, action: "VIEW" },
          { label: "View Progress", icon: <TrendingUp className="h-4 w-4" />, action: "VIEW" },
          { label: "Close Season", icon: <AlertCircle className="h-4 w-4 text-amber-500" />, action: "CLOSE" },
        ];
      case "COMPLETED":
        return [
          { label: "View Review", icon: <Eye className="h-4 w-4" />, action: "REVIEW" },
          { label: "Duplicate", icon: <Copy className="h-4 w-4" />, action: "DUPLICATE" },
          { label: "Archive", icon: <Archive className="h-4 w-4" />, action: "ARCHIVE" },
        ];
      default:
        return [{ label: "View", icon: <Eye className="h-4 w-4" />, action: "VIEW" }];
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Season Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 truncate">{season.name}</h3>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {season.referenceCode && (
              <span className="text-xs text-gray-400 font-mono">{season.referenceCode}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {" — "}
              {new Date(season.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span>{duration} days</span>
            {daysLeft !== null && daysLeft > 0 && (
              <span className="font-medium text-amber-600">{daysLeft} days left</span>
            )}
          </div>
          {season.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-1">{season.description}</p>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center min-w-[80px]">
            <div className="text-xs text-gray-400 mb-0.5">Target</div>
            <div className="font-bold text-gray-900">{formatCurrency(season.overallTarget)}</div>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="text-xs text-gray-400 mb-0.5">Raised</div>
            <div className="font-bold text-gray-900">{formatCurrency(season.totalRaised)}</div>
          </div>
          <div className="text-center min-w-[60px]">
            <div className="text-xs text-gray-400 mb-0.5">Progress</div>
            <div className="font-bold text-gray-900">{progress}%</div>
          </div>
          <div className="text-center min-w-[60px] hidden sm:block">
            <div className="text-xs text-gray-400 mb-0.5">Campaigns</div>
            <div className="font-bold text-gray-900">{season.activeCampaigns || season.totalParticipants > 0 ? Math.ceil(season.totalParticipants / 50) : 0}</div>
          </div>
          <div className="text-center min-w-[60px] hidden sm:block">
            <div className="text-xs text-gray-400 mb-0.5">Participants</div>
            <div className="font-bold text-gray-900">{season.totalParticipants.toLocaleString()}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Season actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border bg-white py-1 shadow-lg">
                {getActions().map((a) => (
                  <button
                    key={a.action}
                    onClick={() => { onAction(season.id, a.action); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {season.overallTarget > 0 && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function AllSeasonsPage() {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SeasonStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    seasonApi.list().then((res) => {
      setSeasons(res.seasons);
      setLoading(false);
    });
  }, []);

  const filteredSeasons = useMemo(() => {
    let result = [...seasons];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.referenceCode?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter.length > 0) {
      result = result.filter((s) => (statusFilter as string[]).includes(s.status));
    }
    return result;
  }, [seasons, search, statusFilter]);

  const handleAction = async (seasonId: string, action: string) => {
    if (action === "VIEW" || action === "REVIEW") {
      if (action === "REVIEW") navigate(`/admin/seasons/review?id=${seasonId}`);
      else navigate(`/admin/seasons/current?id=${seasonId}`);
      return;
    }
    if (action === "DUPLICATE") {
      const season = seasons.find((s) => s.id === seasonId);
      if (season) {
        navigate(`/admin/seasons/new?duplicate=${seasonId}`);
      }
      return;
    }
    if (action === "EDIT") {
      navigate(`/admin/seasons/new?edit=${seasonId}`);
      return;
    }
    const result = await seasonApi.performAction(seasonId, action as any);
    if (result.success) {
      setSeasons((prev) => prev.map((s) => s.id === seasonId ? { ...s, status: action === "ACTIVATE" ? "ACTIVE" : s.status } : s));
    }
  };

  const toggleStatus = (status: SeasonStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Seasons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, manage and monitor FundOrDonate's seasonal programmes and their activation, funding and participation activity.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/seasons/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Create Season
        </button>
      </div>

      {/* Summary Metrics */}
      <SeasonSummaryMetrics seasons={seasons} />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search seasons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            showFilters || statusFilter.length > 0
              ? "border-primary-200 bg-primary-50 text-primary-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters
          {statusFilter.length > 0 && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-bold text-primary-700">
              {statusFilter.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Chips */}
      {showFilters && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 border">
          <div className="text-xs font-medium text-gray-500 mb-2">Status</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_CONFIG) as SeasonStatus[]).map((status) => {
              const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-gray-700", bg: "bg-gray-100" };
              const active = statusFilter.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cfg.label}
                  {active && <X className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Season List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-5">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSeasons.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No seasons found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search || statusFilter.length > 0 ? "Try adjusting your search or filters." : "Create your first season to get started."}
          </p>
          {!search && statusFilter.length === 0 && (
            <button
              onClick={() => navigate("/admin/seasons/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create Season
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSeasons.map((season) => (
            <SeasonRow key={season.id} season={season} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
