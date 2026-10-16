import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  Copy,
  Gift,
  MapPin,
  Package,
} from "lucide-react";
import { consumerService } from "@/services/consumer";
import {
  REWARD_CATEGORY_META,
  issuedRewardGuidance,
  type IssuedReward,
} from "@/types/rewards";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );

const STATUS_META: Record<string, { label: string; className: string; hint: string }> = {
  ISSUED: {
    label: "Available",
    className: "bg-amber-50 text-amber-700",
    hint: "Show or quote the code below to redeem this reward.",
  },
  REDEEMED: {
    label: "Redeemed",
    className: "bg-green-50 text-green-700",
    hint: "This reward has already been redeemed.",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600",
    hint: "This reward has passed its expiry date.",
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-red-50 text-red-700",
    hint: "This reward was revoked and can no longer be used.",
  },
  FAILED: {
    label: "Action required",
    className: "bg-amber-50 text-amber-700",
    hint: "We could not issue this reward automatically. Activate your MCOM Rewards account and it will be delivered.",
  },
};

function statusMeta(status: string) {
  return STATUS_META[status?.toUpperCase()] ?? STATUS_META.ISSUED;
}

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
  const [item, setItem] = useState<IssuedReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!id) {
      setLoading(false);
      setItem(null);
      return;
    }

    consumerService
      .getReward(id)
      .then((reward) => {
        if (!cancelled) {
          setItem(reward);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/consumer/rewards");
  };

  const handleCopyCode = async () => {
    if (!item?.code) return;
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

  const status = statusMeta(item.status);
  const category = item.rewardType ? REWARD_CATEGORY_META[item.rewardType as keyof typeof REWARD_CATEGORY_META] : undefined;
  const hasCode = !!item.code;

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
        <p className="mt-1 text-sm text-gray-600">
          {issuedRewardGuidance(item) ?? status.hint}
        </p>
      </div>

      {/* Campaign card */}
      {(item.campaignTitle || item.campaignImage) && (
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
              {item.campaignLocation && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{item.campaignLocation}</span>
                </p>
              )}
              {item.campaignId && (
                <Link
                  to={`/consumer/explore/campaign/${item.campaignId}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  View Campaign
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <DetailRow label="Reward type">
          <p className="flex items-start gap-1.5 font-medium text-gray-900">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <span>
              {category?.label ??
                (item.source === "mcom" ? "MCOM Rewards" : "FundOrDonate reward")}
            </span>
          </p>
        </DetailRow>

        {item.value != null && (
          <DetailRow label="Value">
            <p className="font-medium text-gray-900">{formatCurrency(item.value)}</p>
          </DetailRow>
        )}

        <DetailRow label="Date earned">
          <p className="font-medium text-gray-900">{formatDate(item.earnedAt)}</p>
        </DetailRow>

        <DetailRow label="Status">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </DetailRow>

        {item.expiresAt && (
          <DetailRow label="Expiry date">
            <p className="flex items-center gap-1.5 font-medium text-gray-900">
              <CalendarClock className="h-4 w-4 text-gray-400" />
              {formatDate(item.expiresAt)}
            </p>
          </DetailRow>
        )}

        {item.redeemedAt && (
          <DetailRow label="Redeemed on">
            <p className="font-medium text-gray-900">{formatDate(item.redeemedAt)}</p>
          </DetailRow>
        )}
      </div>

      {/* Redemption code panel */}
      {hasCode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Package className="h-4 w-4" />
            Redemption code
          </p>
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
    </div>
  );
}
