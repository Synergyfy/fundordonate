import { useEffect, useState } from "react";
import { campaignApi } from "@/services/campaign.service";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Props {
  campaignId: string;
  refreshKey?: number;
}

export function PostList({ campaignId, refreshKey }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await campaignApi.getPosts(campaignId, pageNum, 10);
      if (append) {
        setPosts((prev) => [...prev, ...res.items]);
      } else {
        setPosts(res.items);
      }
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [campaignId, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 p-5">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full rounded bg-gray-200" />
            <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <p className="mt-3 text-sm text-gray-500">No updates posted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{post.title}</h4>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div
            className="mt-3 text-sm text-gray-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      ))}

      {page < totalPages && (
        <div className="text-center">
          <button
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchPosts(next, true);
            }}
            disabled={loadingMore}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {loadingMore ? "Loading..." : "Load more updates"}
          </button>
        </div>
      )}
    </div>
  );
}
