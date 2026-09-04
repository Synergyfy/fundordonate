import type { FC } from "react";
import type { CampaignStatus } from "@fundordonate/types";

interface CampaignStatusBadgeProps {
  status: CampaignStatus | string;
  className?: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  archived: "Archived",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  pending_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-blue-100 text-blue-700",
  completed: "bg-cyan-100 text-cyan-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600",
  archived: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

const ALL_STATUSES: string[] = [
  "draft",
  "submitted",
  "pending_review",
  "approved",
  "published",
  "active",
  "paused",
  "completed",
  "cancelled",
  "expired",
  "archived",
  "rejected",
];

function normalize(status: CampaignStatus | string): string {
  const value = String(status);
  return ALL_STATUSES.includes(value) ? value : value.toLowerCase();
}

export const CampaignStatusBadge: FC<CampaignStatusBadgeProps> = ({ status, className }) => {
  const normalized = normalize(status);
  const color = STATUS_COLORS[normalized] || "bg-gray-100 text-gray-600";
  const label = STATUS_LABEL[normalized] || normalized.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${color} ${className ?? ""}`}>
      {label}
    </span>
  );
};

export default CampaignStatusBadge;
