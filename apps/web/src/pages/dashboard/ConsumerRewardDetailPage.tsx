import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Gift,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { consumerService } from "@/services/consumer";
import {
  REWARD_CATEGORY_META,
  fulfilmentKindLabel,
  issuedRewardDeliveryState,
  issuedRewardGuidance,
  issuedRewardIsRedeemable,
  type IssuedReward,
} from "@/types/rewards";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    value,
  );

const STATUS_META: Record<
  string,
  { label: string; className: string; hint: string }
> = {
  available: {
    label: "Available",
    className: "bg-amber-50 text-amber-700",
    hint: "Show or quote the code below to redeem this reward.",
  },
  processing: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700",
    hint: "MCOM is still delivering this reward. The code will appear once it is ready.",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    hint: "We could not deliver this reward. Our team has been notified and will retry where possible.",
  },
  redeemed: {
    label: "Redeemed",
    className: "bg-green-50 text-green-700",
    hint: "This reward has already been redeemed.",
  },
  expired: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600",
    hint: "This reward has passed its expiry date.",
  },
  revoked: {
    label: "Revoked",
    className: "bg-red-50 text-red-700",
    hint: "This reward was revoked and can no longer be used.",
  },
};

function statusMeta(reward: Pick<IssuedReward, "status" | "fulfilmentStatus">) {
  return (
    STATUS_META[issuedRewardDeliveryState(reward)] ?? STATUS_META.processing
  );
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
    if (!issuedRewardIsRedeemable(item!)) return;
    const code = item?.instructions?.code ?? item?.fulfilmentCode ?? item?.code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
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

  const status = statusMeta(item);
  const category = item.rewardType ? REWARD_CATEGORY_META[item.rewardType as keyof typeof REWARD_CATEGORY_META] : undefined;
  const instructions = item.instructions;
  const deliverable = issuedRewardIsRedeemable(item);
  const instructionCode = deliverable
    ? instructions
      ? instructions.code ?? null
      : item.fulfilmentCode ?? item.code
    : null;
  const hasCode = !!instructionCode;
  const pendingIdentity =
    item.fulfilmentStatus === "PENDING_IDENTITY" ||
    item.fulfilmentStatus === "PENDING_CONFLICT";
  const guidance = pendingIdentity
    ? instructions?.body ??
      (item.fulfilmentStatus === "PENDING_IDENTITY"
        ? "Link your MCOM account to receive this reward."
        : "Your reward is on hold while MCOM Rewards resolves a conflict.")
    : issuedRewardGuidance(item) ?? status.hint;

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
          {guidance}
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
                (item.fulfilmentKind
                  ? fulfilmentKindLabel(item.fulfilmentKind)
                  : item.source === "mcom"
                    ? "MCOM Rewards"
                    : "FundOrDonate reward")}
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

      {/* How to use this reward */}
      <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700">
          {item.fulfilmentProvider === "CENTRAL" ||
          (item.fulfilmentKind ?? "").startsWith("CENTRAL")
            ? <BadgeCheck className="h-4 w-4" />
            : <ShoppingBag className="h-4 w-4" />}
          How to use this reward
        </p>
        <h2 className="mt-2 text-base font-bold text-gray-900">
          {instructions?.headline ??
            (item.fulfilmentKind
              ? fulfilmentKindLabel(item.fulfilmentKind)
              : "Your reward")}
        </h2>
        <p className="mt-1 text-sm text-gray-700">
          {instructions?.body ?? item.fulfilmentSummary ?? guidance}
        </p>

        {hasCode && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {item.fulfilmentKind === "CENTRAL_ACCESS_PASS"
                ? "Access pass code"
                : "Redemption code"}
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2">
              <span className="flex-1 font-mono text-sm font-bold tracking-wide text-gray-900">
                {instructionCode}
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

        {deliverable && instructions && instructions.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {instructions.links.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <ExternalLink className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        )}

        {deliverable && !instructions && item.deepLink && (
          <a
            href={item.deepLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <ExternalLink className="h-4 w-4" />
            Open reward
          </a>
        )}

        {instructions?.note && (
          <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-gray-600">
            {instructions.note}
          </p>
        )}

        {item.fulfilmentStatus === "FAILED" && item.fulfilmentError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {item.fulfilmentError}
          </p>
        )}
      </div>
    </div>
  );
}
