import { Link } from "react-router-dom";

interface Author {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  username: string;
}

interface Props {
  author: Author;
  campaignCount?: number;
}

export function CampaignAuthorCard({ author, campaignCount }: Props) {
  const name = `${author.firstName || ""} ${author.lastName || ""}`.trim() || author.username;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Campaign Creator</h3>
      <Link to={`/profile/${author.username}`} className="flex items-center gap-3">
        {author.avatar ? (
          <img src={author.avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900 hover:text-primary-600">{name}</p>
          <p className="text-sm text-gray-500">@{author.username}</p>
        </div>
      </Link>
      {campaignCount !== undefined && (
        <p className="mt-3 text-sm text-gray-500">
          {campaignCount} campaign{campaignCount !== 1 ? "s" : ""} created
        </p>
      )}
      <Link
        to={`/profile/${author.username}`}
        className="mt-4 block w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        View Profile
      </Link>
    </div>
  );
}
