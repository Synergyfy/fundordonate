import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Plus,
  CheckCircle2,
  XCircle,
  Wallet,
  CreditCard,
  Banknote,
  HandCoins,
} from "lucide-react";
import { DonationsManagement } from "@/pages/admin/DonationsManagement";
import { adminApi, type AdminPayout } from "@/services/admin";
import { formatCurrency, formatDate } from "@/utils/formatters";

type FundingTab = "funds" | "contributions" | "payments" | "withdrawals";

const TABS: { id: FundingTab; label: string; icon: typeof Wallet }[] = [
  { id: "funds", label: "Overview", icon: Wallet },
  { id: "contributions", label: "Donations", icon: HandCoins },
  { id: "withdrawals", label: "Payouts & Withdrawals", icon: Banknote },
];

const TAB_PATH: Record<FundingTab, string> = {
  funds: "/admin/funding",
  contributions: "/admin/funding/contributions",
  payments: "/admin/funding/payments",
  withdrawals: "/admin/funding/withdrawals",
};

export function FundingPage({ tab }: { tab: FundingTab }) {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    try {
      const [payoutsRes, statsRes] = await Promise.all([
        adminApi.getPayouts({ limit: 50 }).catch(() => ({ items: [], total: 0 })),
        adminApi.getDashboardStats().catch(() => null),
      ]);
      setPayouts(payoutsRes.items || (payoutsRes as any).payouts || []);
      setStats(statsRes);
    } catch {
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handlePayoutStatus = async (id: string, status: "APPROVED" | "REJECTED" | "PROCESSED") => {
    setBusyId(id);
    try {
      await adminApi.updatePayoutStatus(id, { status });
      notify(`Payout marked as ${status.toLowerCase()}`);
      fetchFinance();
    } catch {
      notify("Failed to update payout status");
    } finally {
      setBusyId(null);
    }
  };

  const pendingPayouts = payouts.filter((p) => p.status === "PENDING");
  const processedPayouts = payouts.filter((p) => p.status === "PROCESSED" || p.status === "APPROVED");

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Funding & Finance</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Funding & Transactions</h1>
        <p className="text-sm text-gray-500">Live platform revenue, donations, pledges, and payout requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(TAB_PATH[t.id])}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-primary-600 text-primary-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Funds & Overview */}
      {tab === "funds" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Total Raised</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRaised || 0)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Total Donations</span>
              <p className="mt-1 text-2xl font-bold text-green-700">{formatCurrency(stats?.totalDonationsAmount || 0)}</p>
              <span className="text-[11px] text-gray-400">{stats?.totalDonations || 0} donations</span>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Total Pledges</span>
              <p className="mt-1 text-2xl font-bold text-blue-700">{formatCurrency(stats?.totalPledgesAmount || 0)}</p>
              <span className="text-[11px] text-gray-400">{stats?.totalPledges || 0} pledges</span>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Pending Payouts</span>
              <p className="mt-1 text-2xl font-bold text-amber-700">{pendingPayouts.length}</p>
              <span className="text-[11px] text-gray-400">requests waiting</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Contributions */}
      {tab === "contributions" && <DonationsManagement />}

      {/* Tab: Withdrawals / Payouts */}
      {tab === "withdrawals" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Payout Requests ({payouts.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium">Beneficiary / Campaign</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-center font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Requested Date</th>
                    <th className="px-5 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">Loading payout records...</td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">No payout requests recorded.</td>
                    </tr>
                  ) : (
                    payouts.map((p) => {
                      const isPending = p.status === "PENDING";
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">{p.campaignTitle || p.campaignId || "Campaign Payout"}</p>
                            <p className="text-xs text-gray-400">{p.bankDetails ? `Account: ${p.bankDetails}` : `ID: ${p.id}`}</p>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-gray-900">
                            {formatCurrency(p.amount || 0)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.status === "PROCESSED" || p.status === "APPROVED" ? "bg-green-100 text-green-700" :
                              p.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 hidden md:table-cell">
                            {formatDate(p.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  disabled={busyId === p.id}
                                  onClick={() => handlePayoutStatus(p.id, "APPROVED")}
                                  className="rounded px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={busyId === p.id}
                                  onClick={() => handlePayoutStatus(p.id, "REJECTED")}
                                  className="rounded px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
