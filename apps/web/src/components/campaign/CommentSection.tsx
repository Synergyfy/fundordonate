import { useEffect, useState } from "react";
import { campaignApi } from "@/services/campaign.service";
import { useAuthStore } from "@/stores/auth.store";

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: { id: string; firstName?: string; lastName?: string; avatar?: string; username: string };
  replies: Comment[];
}

interface Props {
  campaignId: string;
  refreshKey?: number;
}

export function CommentSection({ campaignId, refreshKey }: Props) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchComments = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    try {
      const res = await campaignApi.getComments(campaignId, pageNum, 50);
      if (pageNum === 1) {
        setComments(res.items);
      } else {
        setComments((prev) => [...prev, ...res.items]);
      }
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchComments(1);
  }, [campaignId, refreshKey]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await campaignApi.addComment(campaignId, newComment.trim());
      setNewComment("");
      fetchComments(1);
      setPage(1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      await campaignApi.addComment(campaignId, replyContent.trim(), parentId);
      setReplyContent("");
      setReplyTo(null);
      fetchComments(1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await campaignApi.updateComment(campaignId, commentId, editContent.trim());
      setEditingId(null);
      fetchComments(1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to edit comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await campaignApi.deleteComment(campaignId, commentId);
      fetchComments(1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const getInitials = (u: Comment["user"]) => {
    const first = u.firstName?.charAt(0) || "";
    const last = u.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || u.username.charAt(0).toUpperCase();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? "ml-10 mt-3" : ""}`}>
      {comment.user.avatar ? (
        <img src={comment.user.avatar} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
          {getInitials(comment.user)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {comment.user.firstName || comment.user.username}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
          {comment.status === "pending" && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
              Pending
            </span>
          )}
        </div>

        {editingId === comment.id ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="input-field resize-none text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={() => handleEdit(comment.id)} className="btn-primary px-3 py-1 text-xs">
                Save
              </button>
              <button onClick={() => setEditingId(null)} className="btn-secondary px-3 py-1 text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-600 break-words">{comment.content}</p>
        )}

        {/* Actions */}
        {editingId !== comment.id && (
          <div className="mt-2 flex items-center gap-3">
            {!isReply && (
              <button
                onClick={() => {
                  setReplyTo(replyTo === comment.id ? null : comment.id);
                  setReplyContent("");
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Reply
              </button>
            )}
            {user?.id === comment.user.id && (
              <>
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply Input */}
        {replyTo === comment.id && (
          <div className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="input-field resize-none text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim() || submitting}
                className="btn-primary px-3 py-1 text-xs"
              >
                {submitting ? "Posting..." : "Reply"}
              </button>
              <button
                onClick={() => { setReplyTo(null); setReplyContent(""); }}
                className="btn-secondary px-3 py-1 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-1">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="rounded-xl border border-gray-200 p-4">
          <div className="flex gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {(user.firstName || user.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                rows={3}
                className="input-field resize-none text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
          <a href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </a>{" "}
          to leave a comment
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-full rounded bg-gray-200" />
                <div className="mt-1 h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center text-sm text-gray-500">No comments yet. Be the first!</div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Load More */}
      {!loading && page < totalPages && (
        <div className="text-center">
          <button
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchComments(next);
            }}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Load more comments
          </button>
        </div>
      )}
    </div>
  );
}
