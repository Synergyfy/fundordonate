// =============================================================================
// Season Review Page
// Post-season analysis with summary, performance, outcomes, and next steps.
// =============================================================================

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { seasonApi, type SeasonReview } from "@/services/season.service";
import {
  Calendar, AlertTriangle, CheckCircle, Copy, ArrowRight,
} from "lucide-react";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

// =============================================================================
// Summary Section
// =============================================================================

function ReviewSummary({ review }: { review: SeasonReview }) {
  const { season, metrics } = review;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Target", value: formatCurrency(season.overallTarget) },
          { label: "Raised", value: formatCurrency(season.totalRaised) },
          { label: "Difference", value: formatCurrency(season.totalRaised - season.overallTarget), highlight: season.totalRaised >= season.overallTarget },
          { label: "Progress", value: `${metrics?.progressPercent || 0}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white border p-4">
            <div className="text-xs text-gray-400 mb-1">{item.label}</div>
            <div className={`text-xl font-bold ${item.highlight ? "text-green-600" : "text-gray-900"}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Cities Active", value: metrics?.citiesActive || 0 },
          { label: "Local Areas", value: metrics?.localAreasActive || 0 },
          { label: "High Streets", value: metrics?.highStreetsActive || 0 },
          { label: "Businesses", value: metrics?.businessesActive || 0 },
          { label: "Participants", value: metrics?.totalParticipants || 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 border p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{item.value.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Campaign Outcomes
// =============================================================================

function CampaignOutcomes({ review }: { review: SeasonReview }) {
  const { campaignOutcomes } = review;
  const items = [
    { label: "Target Reached", value: campaignOutcomes.targetReached, color: "bg-green-500" },
    { label: "Exceeded Target", value: campaignOutcomes.exceededTarget, color: "bg-green-600" },
    { label: "Below Target", value: campaignOutcomes.completedBelowTarget, color: "bg-amber-500" },
    { label: "Carried Forward", value: campaignOutcomes.carriedForward, color: "bg-blue-500" },
    { label: "Closed", value: campaignOutcomes.closed, color: "bg-gray-400" },
  ];
  return (
    <div className="rounded-xl bg-white border p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Campaign Outcomes</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${item.color}`} />
            <span className="text-sm text-gray-700 flex-1">{item.label}</span>
            <span className="text-sm font-bold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Funding & Surplus
// =============================================================================

function FundingSurplus({ review }: { review: SeasonReview }) {
  const { fundingAndSurplus: f } = review;
  return (
    <div className="rounded-xl bg-white border p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Funding & Surplus</h3>
      <div className="space-y-3">
        {[
          { label: "Total Season Funding", value: formatCurrency(f.totalSeasonFunding) },
          { label: "Funds Allocated", value: formatCurrency(f.fundsAllocated) },
          { label: "Surplus", value: formatCurrency(f.surplus), highlight: true },
          { label: "Awaiting Allocation", value: formatCurrency(f.fundsAwaitingAllocation) },
          { label: "Carry Forward", value: formatCurrency(f.carryForwardAmount) },
          { label: "Outstanding Exceptions", value: f.outstandingExceptions.toString(), alert: f.outstandingExceptions > 0 },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className={`text-sm font-bold ${item.highlight ? "text-amber-600" : item.alert ? "text-red-600" : "text-gray-900"}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Unfinished Items
// =============================================================================

function UnfinishedItems({ review }: { review: SeasonReview }) {
  const severityColor = { LOW: "bg-gray-100 text-gray-600", MEDIUM: "bg-amber-100 text-amber-700", HIGH: "bg-red-100 text-red-700", CRITICAL: "bg-red-200 text-red-800" };
  return (
    <div className="rounded-xl bg-white border p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900">Unfinished Items ({review.unfinishedItems.length})</h3>
      </div>
      {review.unfinishedItems.length === 0 ? (
        <div className="text-center py-4">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">All items resolved.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {review.unfinishedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${severityColor[item.severity]}`}>
                {item.severity}
              </span>
              <span className="text-sm text-gray-700 flex-1">{item.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Next Season Preparation
// =============================================================================

function NextSeasonPrep({ review, onDuplicate }: { review: SeasonReview; onDuplicate: () => void }) {
  const { nextSeasonPrep: prep } = review;
  return (
    <div className="rounded-xl bg-primary-50 border border-primary-200 p-5">
      <h3 className="text-sm font-bold text-primary-900 mb-3">Next Season Preparation</h3>
      <div className="space-y-2 mb-4">
        {[
          { label: "Duplicate Season Available", ok: prep.duplicateAvailable },
          { label: "Carry Forward Available", ok: prep.carryForwardAvailable },
          { label: "Configuration Ready", ok: prep.configurationReady },
          { label: "Unresolved Items", ok: prep.unresolvedItemsCount === 0, detail: `${prep.unresolvedItemsCount} remaining` },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.ok ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            <span className="text-primary-700">{item.label}</span>
            {item.detail && <span className="text-xs text-primary-500">({item.detail})</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onDuplicate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
        >
          <Copy className="h-4 w-4" />
          Duplicate for Next Season
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">
          Create New Season
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function SeasonReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<SeasonReview | null>(null);
  const [loading, setLoading] = useState(true);

  const seasonId = searchParams.get("id");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const s = seasonId ? await seasonApi.getById(seasonId) : await seasonApi.getCurrent();
      if (s) {
        const r = await seasonApi.getReview(s.id);
        setReview(r);
      }
      setLoading(false);
    };
    load();
  }, [seasonId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">No Season to Review</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Season Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          {review.season.name} — {new Date(review.season.startDate).toLocaleDateString("en-GB")} to {new Date(review.season.endDate).toLocaleDateString("en-GB")}
        </p>
      </div>

      <div className="space-y-6">
        <ReviewSummary review={review} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CampaignOutcomes review={review} />
          <FundingSurplus review={review} />
        </div>
        <UnfinishedItems review={review} />
        <NextSeasonPrep review={review} onDuplicate={() => navigate("/admin/seasons/new")} />
      </div>
    </div>
  );
}
