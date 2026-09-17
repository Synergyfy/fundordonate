import { useState, useEffect } from "react";
import { campaignApi } from "@/services/campaign.service";
import { Heart, Gift, ChevronDown } from "lucide-react";

interface SupporterItem {
  id: string;
  type: "donation" | "pledge";
  amount: number;
  createdAt: string;
  isAnonymous?: boolean;
  anonymous?: boolean;
  user?: { id: string; firstName?: string; avatar?: string; username?: string };
  reward?: { title: string; amount: number };
  notes?: string;
  /** Backer tier if user has backer status */
  backerTier?: string;
  /** Whether user is a founding member */
  isFoundingMember?: boolean;
  /** Whether user is an original founding member */
  isOriginalFounding?: boolean;
  /** Contribution type: backer or founding_member */
  contributionType?: string;
}

interface Props {
  campaignId: string;
  mode: string;
}

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function SupporterList({ campaignId, mode }: Props) {
  const [donations, setDonations] = useState<SupporterItem[]>([]);
  const [pledges, setPledges] = useState<SupporterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      campaignApi.getCampaignDonations(campaignId, 1, 20).catch(() => ({ items: [], total: 0 })),
      campaignApi.getCampaignPledges(campaignId, 1, 20).catch(() => ({ items: [], total: 0 })),
    ]).then(([donationRes, pledgeRes]) => {
      setDonations(donationRes.items || []);
      setPledges(pledgeRes.items || []);
      setLoading(false);
    });
  }, [campaignId]);

  const supporters: SupporterItem[] = [
    ...donations.map((d) => ({ ...d, type: "donation" as const })),
    ...pledges.map((p) => ({ ...p, type: "pledge" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayed = showAll ? supporters : supporters.slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Supporters</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200 mt-1" />
              </div>
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (supporters.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-secondary-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Supporters ({supporters.length})
          </h3>
        </div>
        <span className="text-sm text-gray-500">
          {mode === "fund" ? "Backers" : mode === "sponsor" ? "Partners" : "Donors"}
        </span>
      </div>

      <div className="space-y-3">
        {displayed.map((s) => {
          const isAnon = s.isAnonymous || s.anonymous;
          const name = isAnon
            ? "Anonymous"
            : s.user?.firstName || s.user?.username || "Supporter";

          return (
            <div key={s.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
              {/* Avatar */}
              {!isAnon && s.user?.avatar ? (
                <img src={s.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {isAnon ? "?" : name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
                  {s.isOriginalFounding && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                      ⭐ Original
                    </span>
                  )}
                  {s.isFoundingMember && !s.isOriginalFounding && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                      {s.contributionType === "founding_member" ? "⭐" : "🤝"} Founding
                    </span>
                  )}
                  {s.backerTier && s.backerTier !== "BACKER" && !s.isFoundingMember && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                      {s.backerTier === "NATIONAL" ? "🇬🇧" : "🏙️"} {s.backerTier}
                    </span>
                  )}
                  {s.type === "pledge" && s.reward && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      <Gift className="h-3 w-3" />
                      {s.reward.title}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(s.createdAt)}</span>
              </div>

              {/* Amount */}
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(s.amount)}
              </span>
            </div>
          );
        })}
      </div>

      {supporters.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {showAll ? "Show fewer" : `View all ${supporters.length} supporters`}
          <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
