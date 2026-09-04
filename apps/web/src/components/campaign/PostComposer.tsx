import { useState } from "react";
import { campaignApi } from "@/services/campaign.service";

interface Props {
  campaignId: string;
  onCreated: () => void;
}

export function PostComposer({ campaignId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError("");
    try {
      await campaignApi.createPost(campaignId, { title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Post an Update</h3>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Update title"
          className="input-field"
          required
        />
      </div>

      <div className="mt-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your update here... (HTML supported)"
          rows={5}
          className="input-field resize-none"
          required
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="btn-primary"
        >
          {loading ? "Posting..." : "Post Update"}
        </button>
      </div>
    </form>
  );
}
