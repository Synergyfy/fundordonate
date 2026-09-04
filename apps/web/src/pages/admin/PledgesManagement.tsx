import { useEffect, useState } from "react";
import { adminApi } from "@/services/admin.service";

interface Pledge {
  uid: string;
  amount: number;
  status: string;
  campaign: { title: string; slug: string };
  user: { firstName: string; lastName: string; email: string } | null;
  reward: { title: string; amount: number } | null;
  createdAt: string;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);
const formatDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
  charged: "bg-blue-100 text-blue-700",
};

export function PledgesManagement() {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPledges({ page, limit: 20, status: statusFilter || undefined });
      setPledges(data.pledges);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleStatus = async (uid: string, status: string) => {
    await adminApi.updatePledgeStatus(uid, status);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pledges</h1>
        <span className="text-sm text-gray-400">{pledges.length} pledges</span>
      </div>

      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-40">
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="charged">Charged</option>
        <option value="failed">Failed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Pledge ID</th>
              <th className="px-3 py-3 font-medium text-gray-500">Backer</th>
              <th className="px-3 py-3 font-medium text-gray-500">Campaign</th>
              <th className="px-3 py-3 font-medium text-gray-500">Reward</th>
              <th className="px-3 py-3 font-medium text-gray-500">Amount</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && pledges.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No pledges found.</td></tr>}
            {!loading && pledges.map((p) => (
              <tr key={p.uid} className="hover:bg-gray-50">
                <td className="px-3 py-3 font-mono text-xs text-gray-500">{p.uid.slice(0, 8)}...</td>
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-gray-800">{p.user ? `${p.user.firstName} ${p.user.lastName}` : "N/A"}</p>
                  {p.user && <p className="text-xs text-gray-400">{p.user.email}</p>}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[150px]">{p.campaign.title}</td>
                <td className="px-3 py-3">
                  {p.reward ? (
                    <div>
                      <p className="text-sm text-gray-800">{p.reward.title}</p>
                      <p className="text-xs text-gray-400">Min: {formatCurrency(p.reward.amount)}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No reward</span>
                  )}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400">{formatDate(p.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedPledge(p)} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">Details</button>
                    {p.status === "pending" && <button onClick={() => handleStatus(p.uid, "completed")} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">Approve</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Pledge Details Modal */}
      {selectedPledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedPledge(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pledge Details</h2>
              <button onClick={() => setSelectedPledge(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-mono text-gray-800">{selectedPledge.uid}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Backer</span><span className="text-gray-800">{selectedPledge.user ? `${selectedPledge.user.firstName} ${selectedPledge.user.lastName}` : "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800">{selectedPledge.user?.email || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Campaign</span><span className="text-gray-800">{selectedPledge.campaign.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reward</span><span className="text-gray-800">{selectedPledge.reward?.title || "No reward"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900">{formatCurrency(selectedPledge.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedPledge.status]}`}>{selectedPledge.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-800">{formatDate(selectedPledge.createdAt)}</span></div>
            </div>
            <div className="mt-5 flex gap-2">
              {selectedPledge.status === "pending" && (
                <button onClick={() => { handleStatus(selectedPledge.uid, "completed"); setSelectedPledge(null); }} className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">Approve</button>
              )}
              {selectedPledge.status === "completed" && (
                <button onClick={() => { handleStatus(selectedPledge.uid, "charged"); setSelectedPledge(null); }} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">Charge Backer</button>
              )}
              {(selectedPledge.status === "pending" || selectedPledge.status === "completed") && (
                <button onClick={() => { handleStatus(selectedPledge.uid, "cancelled"); setSelectedPledge(null); }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
