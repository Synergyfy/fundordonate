import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Gift,
  Heart,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  getContribution,
  type ConsumerContribution,
} from "@/data/consumerActivityData";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

const PARTICIPATION_LABELS: Record<string, string> = {
  backer: "Backer",
  back_campaign: "Backer",
  donation: "Donate",
  donate: "Donate",
  founding_member: "Founding Member",
  founding_monthly: "Founding Monthly",
};

const REWARD_STATUS_LABELS: Record<string, string> = {
  available: "Available to claim",
  claimed: "Claimed",
  redeemed: "Redeemed",
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ContributionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ConsumerContribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getContribution(id ?? "")
      .then((res) => {
        if (cancelled) return;
        setItem(res);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItem(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/consumer/activity?tab=contributions");
  };

  const handleCopy = async () => {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-gray-300" />
        <h3 className="mt-3 text-base font-semibold text-gray-900">
          Contribution not found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          This contribution may have been removed.
        </p>
        <Link
          to="/consumer/activity?tab=contributions"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to Activity
        </Link>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[item.status] ?? item.status;
  const statusStyle = STATUS_STYLES[item.status] ?? "bg-gray-100 text-gray-600";
  const participationLabel =
    PARTICIPATION_LABELS[item.participationType] ?? item.participationType;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xs text-gray-400">Contribution</span>
      </div>

      {/* Campaign card */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          {item.campaignImage ? (
            <img
              src={item.campaignImage}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Heart className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-gray-900">
              {item.campaignTitle}
            </h2>
            {item.campaignLocation ? (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">{item.campaignLocation}</span>
              </p>
            ) : null}
            <Link
              to={`/consumer/explore/campaign/${item.campaignSlug}`}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View Campaign
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Receipt card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Amount
          </p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900">
            {formatCurrency(item.amount)}
          </p>
        </div>

        <DetailRow label="Date">
          <p className="font-medium text-gray-900">{formatDate(item.createdAt)}</p>
        </DetailRow>

        <DetailRow label="Contribution Status">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}
          >
            {statusLabel}
          </span>
        </DetailRow>

        <DetailRow label="Reference">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-gray-900">
              {item.reference}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy reference"
              className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </DetailRow>

        <DetailRow label="Payment Status">
          <p className="font-medium text-gray-900">{item.paymentStatus}</p>
        </DetailRow>

        <DetailRow label="Contribution Type">
          <p className="font-medium text-gray-900">{participationLabel}</p>
        </DetailRow>

        <DetailRow label="Reward Status">
          {item.rewardEligible ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                <Gift className="h-3.5 w-3.5" />
                {item.rewardTitle ?? "Reward"}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {REWARD_STATUS_LABELS[item.rewardStatus ?? ""] ?? "Available"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not qualified for a reward</p>
          )}
        </DetailRow>
      </div>

      {item.rewardEligible && (
        <Link
          to={`/consumer/rewards/${item.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <ShieldCheck className="h-4 w-4" />
          View Reward
        </Link>
      )}
    </div>
  );
}
