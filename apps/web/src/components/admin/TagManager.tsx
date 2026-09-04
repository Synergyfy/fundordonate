import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { campaignTags: number };
}

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tags");
      setTags(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setError("");
    try {
      await api.post("/tags", { name: newTagName.trim() });
      setNewTagName("");
      fetchTags();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create tag");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/tags/${id}`, { name: editName.trim() });
      setEditingId(null);
      fetchTags();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update tag");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await api.delete(`/tags/${id}`);
      fetchTags();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete tag");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
      </div>

      {/* Create Form */}
      <div className="border-b border-gray-200 p-5">
        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            className="input-field flex-1"
          />
          <button type="submit" disabled={!newTagName.trim()} className="btn-primary text-sm">
            Add Tag
          </button>
        </form>
      </div>

      {/* Tags List */}
      <div className="p-5">
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 transition-colors hover:border-gray-300"
              >
                {editingId === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-24 bg-transparent text-sm outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(tag.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button onClick={() => handleUpdate(tag.id)} className="text-xs text-green-600 hover:text-green-700">✓</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700">{tag.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {tag._count?.campaignTags || 0}
                    </span>
                    <button
                      onClick={() => { setEditingId(tag.id); setEditName(tag.name); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && tags.length > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} total
          </p>
        )}
      </div>
    </div>
  );
}
