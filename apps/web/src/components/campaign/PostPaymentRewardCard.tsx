// =============================================================================
// Post-Payment Reward Card — Shows earned rewards after a successful contribution.
// Displays the provider fulfilment (Mall/Central), code, instructions and links.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Gift,
  Clock,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  BadgeCheck,
} from "lucide-react";
import type { RewardInstructions } from "@/types/rewards";

interface EarnedReward {
  entitlementId: string;
  rewardTitle: string;
  rewardDescription: string;
  expiresAt: string;
  items: { title: string; physicalType: string }[];
  // ── Provider fulfilment (optional for legacy/local rewards) ─────────────
  rewardId?: string | null;
  code?: string | null;
  fulfilmentProvider?: string | null;
  fulfilmentKind?: string | null;
  fulfilmentStatus?: string | null;
  fulfilmentError?: string | null;
  instructions?: RewardInstructions | null;
}

interface Props {
  rewards: EarnedReward[];
  onClaim?: (entitlementId: string) => void;
  onClose?: () => void;
}

export function PostPaymentRewardCard({ rewards, onClaim, onClose }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (rewards.length === 0) return null;

  const copy = async (reward: EarnedReward) => {
    const code = reward.instructions
      ? reward.instructions.code ?? null
      : reward.code ?? null;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(reward.entitlementId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <Gift className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-green-900">
            Congratulations — you&apos;ve earned a reward!
          </h3>
          <p className="text-xs text-green-700">
            Your contribution qualified you for {rewards.length} reward{rewards.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      {rewards.map((reward) => {
        const code = reward.instructions
          ? reward.instructions.code ?? null
          : reward.code ?? null;
        const links = reward.instructions?.links ?? [];
        const central =
          reward.fulfilmentProvider === "CENTRAL" ||
          (reward.fulfilmentKind ?? "").startsWith("CENTRAL");
        return (
          <div
            key={reward.entitlementId}
            className="rounded-lg border border-green-200 bg-white p-4 space-y-3"
          >
            {/* Reward Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gray-900">{reward.rewardTitle}</h4>
                {reward.rewardDescription && (
                  <p className="text-xs text-gray-600 mt-0.5">{reward.rewardDescription}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                Ready to Claim
              </span>
            </div>

            {/* Fulfilment badge */}
            {reward.fulfilmentKind && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    central
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-teal-50 text-teal-700"
                  }`}
                >
                  {central ? <BadgeCheck className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                  {central ? "MCOM Central" : "MCOM Mall"}
                </span>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                  {reward.instructions?.headline ?? reward.fulfilmentKind.replace(/_/g, " ")}
                </span>
              </div>
            )}

            {/* Instructions */}
            {reward.instructions?.body && (
              <p className="text-xs text-gray-700">{reward.instructions.body}</p>
            )}

            {/* Code */}
            {code && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                <span className="flex-1 font-mono text-sm font-bold tracking-wide text-gray-900">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={() => void copy(reward)}
                  aria-label="Copy reward code"
                  className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  {copiedId === reward.entitlementId ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Links */}
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {reward.instructions?.note && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-600">
                {reward.instructions.note}
              </p>
            )}

            {reward.fulfilmentStatus === "FAILED" && reward.fulfilmentError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                {reward.fulfilmentError}
              </p>
            )}

            {/* Items */}
            {reward.items.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Includes</span>
                {reward.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{item.title}</span>
                    <span className="text-[10px] text-gray-400 uppercase">({item.physicalType})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Expiry */}
            {reward.expiresAt && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Clock className="h-3 w-3" />
                Claim before {new Date(reward.expiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {onClaim && (
                <button
                  type="button"
                  onClick={() => onClaim(reward.entitlementId)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Gift className="h-3 w-3" />
                  Claim Reward
                </button>
              )}
              {reward.rewardId && (
                <Link
                  to={`/consumer/rewards/${reward.rewardId}`}
                  className="rounded-lg border border-green-300 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                >
                  View full reward
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs text-green-700 hover:text-green-900 font-medium"
        >
          Continue to dashboard
        </button>
      )}
    </div>
  );
}
