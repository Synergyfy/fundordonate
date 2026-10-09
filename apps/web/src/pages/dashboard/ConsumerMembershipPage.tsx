import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Info, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import type { MembershipLevel, MembershipStatus, MembershipTier } from "@fundordonate/types";
import {
  getMembership,
  type ConsumerMembership,
} from "@/data/consumerYouData";

const TIER_LABELS: Record<MembershipTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_STYLES: Record<MembershipTier, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-100 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

const LEVEL_LABELS: Record<MembershipLevel, string> = {
  standard: "Standard",
  pro: "Pro",
  "pro+": "Pro+",
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<MembershipStatus, string> = {
  active: "bg-green-50 text-green-700",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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

export function ConsumerMembershipPage() {
  const [membership, setMembership] = useState<ConsumerMembership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMembership()
      .then((m) => {
        if (!cancelled) setMembership(m);
      })
      .catch(() => {
        /* shown as no-membership state */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          You
        </Link>
        <span className="text-xs text-gray-400">Membership</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Membership</h1>

      {membership ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
                  <Crown className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {TIER_LABELS[membership.tier]} · {LEVEL_LABELS[membership.level]}
                  </p>
                  <p className="text-xs text-gray-500">Membership plan</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[membership.status]}`}
              >
                {STATUS_LABELS[membership.status]}
              </span>
            </div>

            <div className="mt-3 border-t border-gray-100">
              <DetailRow label="Tier">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_STYLES[membership.tier]}`}
                >
                  {TIER_LABELS[membership.tier]}
                </span>
              </DetailRow>
              <DetailRow label="Plan">
                <p className="font-medium text-gray-900">
                  {LEVEL_LABELS[membership.level]}
                </p>
              </DetailRow>
              <DetailRow label="Start Date">
                <p className="font-medium text-gray-900">
                  {formatDate(membership.startDate)}
                </p>
              </DetailRow>
              <DetailRow label="End Date">
                <p className="font-medium text-gray-900">
                  {formatDate(membership.endDate)}
                </p>
              </DetailRow>
              <DetailRow label="Auto-renew">
                <p className="font-medium text-gray-900">
                  {membership.autoRenew ? "On" : "Off"}
                </p>
              </DetailRow>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Membership is not the same as being a Backer</p>
              <p className="mt-1">
                Membership is a subscription with its own tiers and benefits.
                Backer status is earned separately by contributing to campaigns —
                backing a campaign does not require a membership, and a
                membership does not make you a Backer.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Crown className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            No membership yet
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Membership plans with Bronze, Silver, Gold and Platinum tiers are
            coming soon.
          </p>
          <Link
            to="/consumer/you"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <RefreshCw className="h-4 w-4" />
            Back to You
          </Link>
        </div>
      )}
    </div>
  );
}
