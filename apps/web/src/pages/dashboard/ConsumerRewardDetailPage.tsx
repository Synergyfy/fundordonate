import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  MapPin,
  Package,
} from "lucide-react";
import {
  claimReward,
  getRewardEntitlement,
  openReward,
  type ConsumerRewardEntitlement,
  type RewardStatus,
} from "@/data/consumerActivityData";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );

const STATUS_META: Record<RewardStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-amber-50 text-amber-700" },
  claimed: { label: "Earned", className: "bg-blue-50 text-blue-700" },
  redeemed: { label: "Redeemed", className: "bg-green-50 text-green-700" },
};

const FULFILMENT_META: Record<string, { label: string; instructions: string }> = {
  manual: {
    label: "Sent by email",
    instructions:
      "Your reward is sent to your registered email address. Quote the code below when prompted.",
  },
  internal: {
    label: "Issued in FundOrDonate",
    instructions:
      "This reward lives in your account — show the code below to use it.",
  },
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ConsumerRewardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ConsumerRewardEntitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"claim" | "open" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRewardEntitlement(id ?? "")
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
    else navigate("/consumer/rewards");
  };

  const handleClaim = async () => {
    if (!item || acting) return;
    setActing("claim");
    setError(null);
    setSuccess(null);
    try {
      const next = await claimReward(item.id);
      if (next) {
        setItem(next);
        setSuccess("Reward claimed — open it to view your delivery details.");
      } else {
        setError("This reward could not be claimed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActing(null);
    }
  };

  const handleOpen = async () => {
    if (!item || acting) return;
    setActing("open");
    setError(null);
    setSuccess(null);
    try {
      const next = await openReward(item.id);
      if (next) {
        setItem(next);
        setSuccess("Reward opened and marked as redeemed.");
      } else {
        setError("This reward could not be opened. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActing(null);
    }
  };

  const handleCopyCode = async () => {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.code);
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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <Gift className="h-6 w-6 text-primary-500" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-gray-900">
          Reward not found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          This reward may no longer be available.
        </p>
        <Link
          to="/consumer/rewards"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to Rewards
        </Link>
      </div>
    );
  }

  const status = STATUS_META[item.status];
  const fulfilment =
    FULFILMENT_META[item.fulfilmentType] ?? {
      label: "Standard delivery",
      instructions: "Quote the code below to redeem this reward.",
    };
  const hasFulfilment = item.status === "claimed" || item.status === "redeemed";

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
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
        {item.description && (
          <p className="mt-1 text-sm text-gray-600">{item.description}</p>
        )}
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-50">
              <Gift className="h-6 w-6 text-primary-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">
              {item.campaignTitle}
            </p>
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

      {/* Detail card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <DetailRow label="Qualification">
          <p className="flex items-start gap-1.5 font-medium text-gray-900">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <span>{item.condition}</span>
          </p>
        </DetailRow>

        <DetailRow label="How Earned">
          <p className="font-medium text-gray-900">
            Contributed {formatCurrency(item.contributionAmount)} to{" "}
            {item.campaignTitle}
          </p>
          <p className="font-mono text-xs text-gray-400">{item.reference}</p>
        </DetailRow>

        <DetailRow label="Date Earned">
          <p className="font-medium text-gray-900">{formatDate(item.earnedAt)}</p>
        </DetailRow>

        <DetailRow label="Status">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </DetailRow>

        <DetailRow label="Expiry Date">
          <p className="flex items-center gap-1.5 font-medium text-gray-900">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            {formatDate(item.expiryDate)}
          </p>
        </DetailRow>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Fulfilment panel */}
      {hasFulfilment && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Package className="h-4 w-4" />
            Delivery — {fulfilment.label}
          </p>
          <p className="mt-2 text-sm text-amber-900">{fulfilment.instructions}</p>
          {item.items.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
              {item.items.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2">
            <span className="flex-1 font-mono text-sm font-bold tracking-wide text-gray-900">
              {item.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy reward code"
              className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {item.status === "available" && (
        <button
          type="button"
          onClick={handleClaim}
          disabled={acting !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
        >
          {acting === "claim" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Claiming…
            </>
          ) : (
            <>
              <Gift className="h-4 w-4" />
              Claim Reward
            </>
          )}
        </button>
      )}
      {item.status === "claimed" && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={acting !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
        >
          {acting === "open" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Opening…
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              Open Reward
            </>
          )}
        </button>
      )}
    </div>
  );
}
