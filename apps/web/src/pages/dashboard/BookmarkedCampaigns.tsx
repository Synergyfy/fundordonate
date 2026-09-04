import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userDashboardApi } from "@/services/user-dashboard.service";

interface Bookmark {
  id: string;
  campaign: {
    id: string;
    title: string;
    slug: string;
    raisedAmount: number;
    goalAmount: number;
    featuredImage: string | null;
    deadline: string;
    author: { firstName: string; lastName: string };
    _count: { donations: number; pledges: number };
  };
  createdAt: string;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

export function BookmarkedCampaigns() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const data = await userDashboardApi.getBookmarks({ page, limit: 12 });
      setBookmarks(data.bookmarks);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const handleRemoveBookmark = async (campaignId: string) => {
    await userDashboardApi.toggleBookmark(campaignId);
    setBookmarks((prev) => prev.filter((b) => b.campaign.id !== campaignId));
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Bookmarked Campaigns</h1>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      )}
      {!loading && bookmarks.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <p className="text-gray-400">No bookmarks yet.</p>
          <Link to="/campaigns" className="btn-primary mt-4 inline-block">Browse Campaigns</Link>
        </div>
      )}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => {
            const c = b.campaign;
            const pct = c.goalAmount > 0 ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100) : 0;
            const daysLeft = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

            return (
              <div key={b.id} className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gray-100">
                  {c.featuredImage ? (
                    <img src={c.featuredImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">🎯</div>
                  )}
                </div>
                <div className="p-4">
                  <Link to={`/campaigns/${c.slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate block">{c.title}</Link>
                  <p className="text-xs text-gray-400 mt-0.5">by {c.author.firstName} {c.author.lastName}</p>
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>{formatCurrency(c.raisedAmount)} raised</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{daysLeft} days left · {c._count.donations + c._count.pledges} backers</span>
                    <button onClick={() => handleRemoveBookmark(c.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
