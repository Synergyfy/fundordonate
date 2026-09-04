import { useEffect, useState } from "react";
import { campaignApi } from "@/services/campaign.service";

interface PendingComment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: { id: string; firstName?: string; lastName?: string; avatar?: string; username: string };
  campaign: { id: string; title: string; slug: string };
}

interface Props {
  campaignId?: string;
}

export function CommentModeration({ campaignId }: Props) {
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await campaignApi.getPendingComments(campaignId);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [campaignId]);

  const handleModerate = async (commentId: string, status: string) => {
    try {
      await campaignApi.moderateComment("", commentId, status);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to moderate comment");
    }
  };

  const filteredComments = filter === "pending"
    ? comments.filter((c) => c.status === "pending")
    : comments;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Comment Moderation</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            Pending ({comments.filter((c) => c.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === "all" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            All ({comments.length})
          </button>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-gray-100 p-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-full rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No comments to moderate.</p>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {(comment.user.firstName || comment.user.username || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user.firstName || comment.user.username}
                        </span>
                        <span className="text-xs text-gray-500">on</span>
                        <a
                          href={`/campaigns/${comment.campaign.slug}`}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          {comment.campaign.title}
                        </a>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comment.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : comment.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleModerate(comment.id, "approved")}
                    className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleModerate(comment.id, "spam")}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Mark Spam
                  </button>
                  <button
                    onClick={() => handleModerate(comment.id, "pending")}
                    className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Hold
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
