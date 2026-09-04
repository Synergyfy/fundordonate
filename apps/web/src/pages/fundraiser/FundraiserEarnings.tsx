import { useEffect, useState } from "react";
import { walletApi } from "@/services/wallet.service";

interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalFees: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
  byCampaign: { campaignId: string; title: string; slug: string; earned: number }[];
}

interface Transaction {
  id: string;
  amount: number;
  action: string;
  type: string;
  status: string;
  createdAt: string;
  campaign: { title: string; slug: string } | null;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);
const formatDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const TYPE_COLORS: Record<string, string> = {
  earning: "bg-green-100 text-green-700",
  platform_fee: "bg-red-100 text-red-700",
  withdrawal_request: "bg-yellow-100 text-yellow-700",
  withdrawal_approval: "bg-blue-100 text-blue-700",
  withdrawal_rejection: "bg-orange-100 text-orange-700",
};

export function FundraiserEarnings() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        walletApi.getSummary(),
        walletApi.getTransactions({ page, limit: 15, type: typeFilter || undefined }),
      ]);
      setSummary(s);
      setTransactions(t.transactions);
      setTotalPages(t.pagination.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, typeFilter]);

  if (loading && !summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings & Wallet</h1>

      {/* Wallet Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">Wallet Balance</p>
          <p className="mt-1 text-2xl font-bold text-primary-700">{formatCurrency(summary?.balance || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Available for withdrawal</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">Total Earned</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{formatCurrency(summary?.totalEarned || 0)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">Platform Fees</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(summary?.totalFees || 0)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">Total Withdrawn</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{formatCurrency(summary?.totalWithdrawn || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Earnings by Campaign */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Campaign</h2>
          <div className="space-y-3">
            {(!summary?.byCampaign || summary.byCampaign.length === 0) && (
              <p className="text-sm text-gray-400">No campaign earnings yet.</p>
            )}
            {summary?.byCampaign.map((c) => {
              const pct = summary.totalEarned > 0 ? (c.earned / summary.totalEarned) * 100 : 0;
              return (
                <div key={c.campaignId} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                    <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Earned: {formatCurrency(c.earned)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="input-field w-36 text-xs">
              <option value="">All Types</option>
              <option value="earning">Earnings</option>
              <option value="platform_fee">Fees</option>
              <option value="withdrawal_approval">Withdrawals</option>
            </select>
          </div>
          <div className="space-y-2">
            {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions yet.</p>}
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[t.type] || "bg-gray-100 text-gray-600"}`}>
                      {t.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {t.campaign && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.campaign.title}</p>}
                  <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${t.action === "credit" ? "text-green-700" : "text-red-600"}`}>
                  {t.action === "credit" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
