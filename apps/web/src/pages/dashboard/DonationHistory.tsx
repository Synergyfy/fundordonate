import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userDashboardApi } from "@/services/user-dashboard.service";

interface Donation {
  uid: string;
  amount: number;
  status: string;
  isAnonymous: boolean;
  campaign: { title: string; slug: string; featuredImage: string | null };
  createdAt: string;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);
const formatDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export function DonationHistory() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const data = await userDashboardApi.getDonations({ page, limit: 15 });
      setDonations(data.donations);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Donation History</h1>

      <div className="space-y-3">
        {loading && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        )}
        {!loading && donations.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400">No donations yet.</p>
            <Link to="/campaigns" className="btn-primary mt-4 inline-block">Browse Campaigns</Link>
          </div>
        )}
        {!loading && donations.map((d) => (
          <div key={d.uid} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {d.campaign.featuredImage ? (
                  <img src={d.campaign.featuredImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">🎯</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/campaigns/${d.campaign.slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate block">{d.campaign.title}</Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-600"}`}>{d.status}</span>
                  <span className="text-xs text-gray-400">{formatDate(d.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-gray-900">{formatCurrency(d.amount)}</p>
                <p className="text-xs text-gray-400">ID: {d.uid.slice(0, 8)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
