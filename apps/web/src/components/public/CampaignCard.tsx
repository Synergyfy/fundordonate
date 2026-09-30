import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";

export interface PublicCampaign {
  id: string;
  slug?: string;
  title: string;
  shortDescription?: string | null;
  mode?: string | null;
  goalAmount?: number | null;
  raisedAmount?: number | null;
  deadline?: string | null;
  featuredImage?: string | null;
}

export const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

export function modeLabel(mode?: string | null): string {
  if (mode === "donation" || mode === "donate") return "Donate";
  if (mode === "sponsor") return "Sponsor";
  return "Fund";
}

export function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const goal = campaign.goalAmount || 0;
  const raised = campaign.raisedAmount || 0;
  const progress = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
  const deadline = campaign.deadline ? new Date(campaign.deadline) : null;
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000)) : null;

  return (
    <Link
      to={`/campaigns/${campaign.slug || campaign.id}`}
      className="group block h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        {campaign.featuredImage ? (
          <img
            src={campaign.featuredImage}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
            <Megaphone className="w-10 h-10 text-primary-300" aria-hidden="true" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
          {modeLabel(campaign.mode)}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-2">
          {campaign.title}
        </h3>
        {campaign.shortDescription && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{campaign.shortDescription}</p>
        )}
        <div className="mb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary-500 to-secondary-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-secondary-600">{formatCurrency(raised)}</span>
          <span className="text-gray-400">of {formatCurrency(goal)}</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{progress}% funded</span>
          {daysLeft !== null && <span>{daysLeft > 0 ? `${daysLeft} days left` : "Ended"}</span>}
        </div>
      </div>
    </Link>
  );
}
