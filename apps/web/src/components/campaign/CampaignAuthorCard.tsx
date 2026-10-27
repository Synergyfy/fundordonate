import { BadgeCheck, Building2 } from "lucide-react";

interface Author {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  username: string | null;
}

interface Props {
  author: Author;
  campaignCount?: number;
  /** Business the runner owns / represents. */
  businessName?: string;
  businessCity?: string;
}

export function CampaignAuthorCard({
  author,
  campaignCount,
  businessName,
  businessCity,
}: Props) {
  const name =
    `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
    author.username ||
    "Campaign Runner";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Campaign Runner</h3>
      <div className="flex items-center gap-3">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-medium text-gray-900">
            <span className="truncate">{name}</span>
            <BadgeCheck className="h-4 w-4 flex-shrink-0 text-primary-600" />
          </p>
          {author.username && (
            <p className="truncate text-sm text-gray-500">@{author.username}</p>
          )}
        </div>
      </div>

      {businessName && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3">
          <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Running for
            </p>
            <p className="truncate text-sm font-medium text-gray-900">
              {businessName}
            </p>
            {businessCity && (
              <p className="truncate text-xs text-gray-500">{businessCity}</p>
            )}
          </div>
        </div>
      )}

      {campaignCount !== undefined && (
        <p className="mt-3 text-sm text-gray-500">
          {campaignCount} campaign{campaignCount !== 1 ? "s" : ""} created
        </p>
      )}
    </div>
  );
}
