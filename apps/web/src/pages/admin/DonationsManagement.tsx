import { useEffect, useState } from "react";
import { adminApi } from "@/services/admin.service";

interface Donation {
  uid: string;
  amount: number;
  status: string;
  isAnonymous: boolean;
  campaign: { title: string; slug: string };
  user: { firstName: string; lastName: string; email: string } | null;
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

export function DonationsManagement() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDonations({ page, limit: 20, status: statusFilter || undefined });
      setDonations(data.donations);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleStatus = async (uid: string, status: string) => {
    await adminApi.updateDonationStatus(uid, status);
    load();
  };

  const handleRefund = async (uid: string) => {
    if (!confirm("Process refund?")) return;
    await adminApi.refundDonation(uid);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
        <span className="text-sm text-gray-400">{donations.length} donations</span>
      </div>

      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-40">
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
      </select>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Donation ID</th>
              <th className="px-3 py-3 font-medium text-gray-500">Donor</th>
              <th className="px-3 py-3 font-medium text-gray-500">Campaign</th>
              <th className="px-3 py-3 font-medium text-gray-500">Amount</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && donations.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No donations found.</td></tr>}
            {!loading && donations.map((d) => (
              <tr key={d.uid} className="hover:bg-gray-50">
                <td className="px-3 py-3 font-mono text-xs text-gray-500">{d.uid.slice(0, 8)}...</td>
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-gray-800">{d.isAnonymous ? "Anonymous" : d.user ? `${d.user.firstName} ${d.user.lastName}` : "N/A"}</p>
                  {!d.isAnonymous && d.user && <p className="text-xs text-gray-400">{d.user.email}</p>}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[150px]">{d.campaign.title}</td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-900">{formatCurrency(d.amount)}</td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-600"}`}>{d.status}</span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400">{formatDate(d.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedDonation(d)} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">Details</button>
                    {d.status === "completed" && <button onClick={() => handleRefund(d.uid)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Refund</button>}
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

      {/* Donation Details Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDonation(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Donation Details</h2>
              <button onClick={() => setSelectedDonation(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-mono text-gray-800">{selectedDonation.uid}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Donor</span><span className="text-gray-800">{selectedDonation.isAnonymous ? "Anonymous" : selectedDonation.user ? `${selectedDonation.user.firstName} ${selectedDonation.user.lastName}` : "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800">{selectedDonation.user?.email || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Campaign</span><span className="text-gray-800">{selectedDonation.campaign.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900">{formatCurrency(selectedDonation.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedDonation.status]}`}>{selectedDonation.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-800">{formatDate(selectedDonation.createdAt)}</span></div>
            </div>
            <div className="mt-5 flex gap-2">
              {selectedDonation.status === "pending" && (
                <button onClick={() => { handleStatus(selectedDonation.uid, "completed"); setSelectedDonation(null); }} className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">Mark Complete</button>
              )}
              {selectedDonation.status === "completed" && (
                <button onClick={() => { handleRefund(selectedDonation.uid); setSelectedDonation(null); }} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Refund</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
