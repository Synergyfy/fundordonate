// =============================================================================
// Business Owner Rewards Page
// View earned rewards and unlock new ones, wired to live backend API.
// =============================================================================

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  Check,
  AlertCircle,
  Copy,
  RefreshCw,
  Target,
  Wallet,
} from "lucide-react";
import { useRewards } from "@/services/reward/hook";

const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  ONLINE: "Online contribution",
  IN_STORE: "In-store contribution",
  FUNDING_SPLIT: "Funding split",
  SELF_FUNDING: "Self-funding",
};

/** Friendly labels for the reward type stored on the issuance. */
const REWARD_TYPE_META: Record<string, { label: string; className: string }> = {
  local: { label: "FundOrDonate reward", className: "bg-primary-50 text-primary-700" },
  voucher: { label: "Voucher", className: "bg-blue-50 text-blue-700" },
  "gift card": { label: "Gift card", className: "bg-purple-50 text-purple-700" },
  giftcard: { label: "Gift card", className: "bg-purple-50 text-purple-700" },
  coupon: { label: "Coupon", className: "bg-amber-50 text-amber-700" },
  "point offer": { label: "Points reward", className: "bg-teal-50 text-teal-700" },
  points: { label: "Points reward", className: "bg-teal-50 text-teal-700" },
  "physical product": { label: "Physical product", className: "bg-rose-50 text-rose-700" },
  membership: { label: "Membership reward", className: "bg-indigo-50 text-indigo-700" },
};

const rewardTypeMeta = (rewardType?: string | null) => {
  const key = (rewardType ?? "").trim().toLowerCase();
  return (
    REWARD_TYPE_META[key] ?? {
      label: rewardType ?? "Reward",
      className: "bg-gray-100 text-gray-600",
    }
  );
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Processing", className: "bg-blue-50 text-blue-700" },
  ISSUED: { label: "Available", className: "bg-amber-50 text-amber-700" },
  REDEEMED: { label: "Redeemed", className: "bg-green-50 text-green-700" },
  EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-600" },
  REVOKED: { label: "Revoked", className: "bg-red-50 text-red-700" },
  FAILED: { label: "Action required", className: "bg-amber-50 text-amber-700" },
};

const statusMeta = (status?: string | null) =>
  STATUS_META[(status ?? "").toUpperCase()] ?? {
    label: status ?? "Issued",
    className: "bg-gray-100 text-gray-600",
  };

const fmtPence = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );

/** Reward values are stored in whole pounds GBP (matches `valueGbp`). */
const fmtGbp = (pounds: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(pounds);

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

export default function BusinessOwnerRewardsPage() {
  const { data, isLoading, error, refetch } = useRewards();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const earned = data?.earned || [];
  const locked = data?.locked || [];
  const earnedCount = data?.earnedCount || 0;
  const totalCount = data?.totalCount || 0;

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
        <p className="text-sm text-gray-500">Track your earned rewards and see what's next to unlock.</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="font-semibold text-red-900">Failed to load rewards progress.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && (
        <>
          <div className="rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-100">Rewards Earned</div>
                <div className="text-4xl font-bold">{earnedCount} / {totalCount}</div>
              </div>
              <Award className="h-12 w-12 text-yellow-200" />
            </div>
          </div>

          {/* Earned Rewards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Earned Rewards</h2>
            {earned.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 border">
                No rewards unlocked yet. Keep contributing and launching campaigns to earn recognition!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {earned.map((r) => {
                  const type = rewardTypeMeta(r.rewardType);
                  const status = statusMeta(r.status);
                  const code = r.code ?? null;
                  return (
                    <div key={r.id} className="flex flex-col rounded-xl bg-white p-4 shadow-sm border">
                      <div className="flex items-start gap-3">
                        {r.campaignImage ? (
                          <img
                            src={r.campaignImage}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-3xl">{r.icon}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          {/* What the reward actually is / what they get */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${type.className}`}
                            >
                              <BadgeCheck className="h-3 w-3" />
                              {type.label}
                            </span>
                            {r.value != null && (
                              <span className="text-xs font-semibold text-gray-900">
                                {fmtGbp(r.value)} value
                              </span>
                            )}
                            {r.quantity != null && r.quantity > 1 && (
                              <span className="text-xs text-gray-500">
                                × {r.quantity}
                              </span>
                            )}
                          </div>

                          {r.description?.trim() &&
                            r.description.trim() !== type.label && (
                              <p className="mt-1.5 text-xs text-gray-500">
                                {r.description}
                              </p>
                            )}

                          {r.earnedAt && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                              <Check className="h-3 w-3" /> Earned on{" "}
                              {fmtDate(r.earnedAt) ?? r.earnedAt}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* How they get it: redemption code + expiry */}
                      {(code || r.expiresAt) && (
                        <div className="mt-3 space-y-2 rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                          {code && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                  Redemption code
                                </span>
                                <span className="font-mono text-sm font-bold tracking-wide text-gray-900">
                                  {code}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(r.id, code)}
                                className="inline-flex shrink-0 items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                {copiedId === r.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-green-600" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                          {r.expiresAt && (
                            <p className="flex items-center gap-1 text-[11px] text-amber-700">
                              <CalendarClock className="h-3 w-3" />
                              Redeem before {fmtDate(r.expiresAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {(r.campaignTitle || r.contributionAmount != null) && (
                        <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3">
                          {r.campaignTitle && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-700">
                              <Target className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {r.campaignTitle}
                              </span>
                            </p>
                          )}
                          {r.contributionAmount != null && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Wallet className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span>
                                {fmtPence(r.contributionAmount)}
                                {r.contributionType
                                  ? ` · ${
                                      CONTRIBUTION_TYPE_LABELS[r.contributionType] ??
                                      r.contributionType
                                    }`
                                  : ""}
                                {r.contributionDate
                                  ? ` · ${fmtDate(r.contributionDate)}`
                                  : ""}
                              </span>
                            </p>
                          )}
                          {r.contributionReference && (
                            <p className="pl-5 text-[11px] text-gray-400">
                              Ref: {r.contributionReference}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Locked Rewards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Locked Rewards</h2>
            {locked.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 border">
                All available rewards have been unlocked! 🏆
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locked.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm border border-dashed border-gray-300 flex items-start gap-3">
                    <div className="text-3xl opacity-40">{r.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{r.progress ?? 0}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.progress ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
