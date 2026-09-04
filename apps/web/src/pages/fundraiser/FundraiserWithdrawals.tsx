import { useEffect, useState } from "react";
import { fundraiserApi } from "@/services/fundraiser.service";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  method: string;
  accountDetails: string;
  createdAt: string;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);
const formatDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export function FundraiserWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "bank_transfer", accountDetails: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fundraiserApi.getWithdrawals({ page, limit: 20 });
      setWithdrawals(data.withdrawals);
      setTotalPages(data.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const handleRequest = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      await fundraiserApi.requestWithdrawal({
        amount: Math.round(parseFloat(form.amount) * 100),
        method: form.method,
        accountDetails: form.accountDetails,
      });
      setShowRequest(false);
      setForm({ amount: "", method: "bank_transfer", accountDetails: "" });
      load();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
        <button onClick={() => setShowRequest(true)} className="btn-primary text-sm">Request Withdrawal</button>
      </div>

      {/* Withdrawals List */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">ID</th>
              <th className="px-3 py-3 font-medium text-gray-500">Amount</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Method</th>
              <th className="px-3 py-3 font-medium text-gray-500">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && withdrawals.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No withdrawals yet.</td></tr>}
            {!loading && withdrawals.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 font-mono text-xs text-gray-500">{w.id.slice(0, 8)}...</td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-900">{formatCurrency(w.amount)}</td>
                <td className="px-3 py-3 hidden sm:table-cell text-sm text-gray-600 capitalize">{w.method.replace("_", " ")}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[w.status] || "bg-gray-100 text-gray-600"}`}>{w.status}</span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400">{formatDate(w.createdAt)}</td>
                <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400 truncate max-w-[150px]">{w.accountDetails}</td>
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

      {/* Request Withdrawal Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRequest(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Request Withdrawal</h2>
              <button onClick={() => setShowRequest(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="input-field w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="input-field w-full">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div>
                <label className="label">Account Details</label>
                <textarea
                  value={form.accountDetails}
                  onChange={(e) => setForm((f) => ({ ...f, accountDetails: e.target.value }))}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Bank name, account number, routing number, etc."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleRequest} disabled={submitting || !form.amount} className="btn-primary flex-1">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
                <button onClick={() => setShowRequest(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
