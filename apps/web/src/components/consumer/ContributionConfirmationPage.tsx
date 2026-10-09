// =============================================================================
// Contribution Confirmation Page
// Post-contribution confirmation page shown after successful payment.
// =============================================================================

import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Mail,
  Share2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listContributions,
  type ConsumerContribution,
} from "@/data/consumerActivityData";

// ── Types ──

interface ContributionConfirmationPageProps {
  transactionRef?: string;
  campaignTitle?: string;
  campaignSlug?: string;
  amount?: number;
  participationType?: "backer" | "founding_member" | "founding_monthly" | "donate";
  reward?: { title: string; description?: string };
  onDashboardClick?: () => void;
  onViewCampaign?: () => void;
}

// ── Helpers ──

const PARTICIPATION_META: Record<
  string,
  { label: string; emoji: string; color: string; bg: string }
> = {
  backer: {
    label: "Backer",
    emoji: "🤝",
    color: "text-primary-700",
    bg: "bg-primary-50 border-primary-200",
  },
  founding_member: {
    label: "Founding Member",
    emoji: "👑",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  founding_monthly: {
    label: "Founding Monthly",
    emoji: "🔄",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
  donate: {
    label: "Donate",
    emoji: "💚",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
};

function formatPence(pence: number): string {
  const gbp = pence / 100;
  return `£${gbp.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const WHAT_HAPPENS_NEXT = [
  { icon: Mail, text: "You'll receive a confirmation email shortly" },
  { icon: TrendingUp, text: "Track your campaign progress in your dashboard" },
  { icon: Gift, text: "If the campaign reaches its goal, your reward will be delivered" },
  { icon: Trophy, text: "You'll be added to the campaign leaderboard" },
];

// ── Component ──

const DEFAULT_PARTICIPATION_META = { label: "Backer", emoji: "🤝", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" };

export function ContributionConfirmationPage({
  transactionRef: transactionRefProp,
  campaignTitle: campaignTitleProp,
  campaignSlug: campaignSlugProp,
  amount: amountProp,
  participationType: participationTypeProp,
  reward,
  onDashboardClick,
  onViewCampaign,
}: ContributionConfirmationPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fallback, setFallback] = useState<ConsumerContribution | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (searchParams.get("ref") || transactionRefProp) return;
    let cancelled = false;
    listContributions()
      .then((list) => {
        if (!cancelled) setFallback(list[0] ?? null);
      })
      .catch(() => {
        /* show defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams, transactionRefProp]);

  const transactionRef =
    searchParams.get("ref") ?? transactionRefProp ?? fallback?.reference ?? "";
  const campaignSlug =
    searchParams.get("slug") ?? campaignSlugProp ?? fallback?.campaignSlug ?? "";
  const campaignTitle =
    searchParams.get("title") ??
    campaignTitleProp ??
    fallback?.campaignTitle ??
    "Campaign";
  const amountParam = searchParams.get("amount");
  const amount = amountParam
    ? Number(amountParam)
    : (amountProp ?? fallback?.amount ?? 0);
  const rawParticipation =
    searchParams.get("type") ??
    participationTypeProp ??
    fallback?.participationType ??
    "backer";
  const participationType = (rawParticipation === "back_campaign" || rawParticipation === "backer"
    ? "backer"
    : rawParticipation === "donation" || rawParticipation === "donate"
      ? "donate"
      : rawParticipation) as NonNullable<
    ContributionConfirmationPageProps["participationType"]
  >;
  const contributionStatus =
    searchParams.get("status") ?? fallback?.status ?? "completed";
  const dateIso =
    searchParams.get("date") ?? fallback?.createdAt ?? new Date().toISOString();
  const rewardParam = searchParams.get("reward");
  const rewardTitle = rewardParam ?? reward?.title ?? fallback?.rewardTitle;
  const rewardDescription = reward?.description;
  const rewardEligible = rewardParam
    ? true
    : reward
      ? true
      : fallback
        ? fallback.rewardEligible
        : false;

  const meta =
    PARTICIPATION_META[participationType] ??
    PARTICIPATION_META.backer ??
    DEFAULT_PARTICIPATION_META;
  const campaignUrl = `${window.location.origin}/campaigns/${campaignSlug}`;
  const shareText = `I just contributed ${formatPence(amount)} to ${campaignTitle}! Check it out:`;
  const formattedDate = new Date(dateIso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const statusStyle =
    contributionStatus === "pending"
      ? "bg-amber-100 text-amber-700"
      : contributionStatus === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700";
  const statusLabel =
    contributionStatus === "pending"
      ? "Pending"
      : contributionStatus === "failed"
        ? "Failed"
        : "Completed";

  const handleViewCampaign =
    onViewCampaign ??
    (() =>
      navigate(
        campaignSlug
          ? `/consumer/explore/campaign/${campaignSlug}`
          : "/consumer/explore",
      ));
  const handleDashboard = onDashboardClick ?? (() => navigate("/consumer"));

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(transactionRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = transactionRef;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(campaignUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + " " + campaignUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {/* Animated Checkmark */}
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Thank you for your contribution!
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Your support makes a real difference.
          </p>
        </div>

        {/* Transaction Card */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Transaction Ref */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                Transaction Reference
              </p>
              <p className="font-mono text-sm font-semibold text-gray-900 mt-0.5">
                {transactionRef || "—"}
              </p>
            </div>
            <button
              onClick={handleCopyRef}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Campaign */}
          <div className="py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Campaign</p>
            <p className="font-semibold text-gray-900 mt-0.5">{campaignTitle}</p>
          </div>

          {/* Participation Type */}
          <div className="py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Contribution Type</p>
            <span
              className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 text-sm font-medium rounded-full border ${meta.bg} ${meta.color}`}
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </span>
          </div>

          {/* Amount */}
          <div className="py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatPence(amount)}</p>
          </div>

          {/* Date */}
          <div className="py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Date</p>
            <p className="font-medium text-gray-900 mt-0.5">{formattedDate}</p>
          </div>

          {/* Contribution Status */}
          <div className="py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Contribution Status</p>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>

          {/* Reward Eligibility */}
          {rewardEligible && rewardTitle ? (
            <div className="py-3 bg-amber-50 -mx-5 px-5 border-t border-amber-100 rounded-b-xl">
              <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">
                Reward Eligibility
              </p>
              <div className="flex items-start gap-2 mt-1.5">
                <Gift className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">Eligible — {rewardTitle}</p>
                  {rewardDescription && (
                    <p className="text-xs text-amber-700 mt-0.5">{rewardDescription}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Reward Eligibility</p>
              <p className="text-sm text-gray-500 mt-0.5">Not qualified for a reward yet</p>
            </div>
          )}
        </div>

        {/* What Happens Next */}
        <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50 p-5">
          <h2 className="text-sm font-semibold text-primary-800 mb-3">What Happens Next</h2>
          <ul className="space-y-3">
            {WHAT_HAPPENS_NEXT.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm text-primary-700">{step.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Social Share */}
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Share your contribution</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShareFacebook}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#166FE5] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#22C55E] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={handleViewCampaign}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View Campaign
          </button>
          <button
            onClick={handleDashboard}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
